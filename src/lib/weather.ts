// Previsão dos próximos dias no destino, via Open-Meteo (geocoding + forecast).
// São APIs públicas — HTTPS, com CORS e sem chave — então rodam direto no
// navegador, sob demanda ao abrir o modal de previsão. É best-effort: qualquer
// falha lança erro e o TempCard mostra uma mensagem amigável, sem travar a
// bipagem (a chamada só acontece quando o operador abre o modal).

import type { ForecastDay } from "@/types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
// Timeout curto: se o Open-Meteo demorar, o modal mostra a mensagem de erro.
const WEATHER_FETCH_TIMEOUT_MS = 6000;

function fetchWithTimeout(url: string): Promise<Response> {
  // AbortController + setTimeout em vez de AbortSignal.timeout: mais compatível
  // com WebViews/navegadores antigos das estações (AbortSignal.timeout não
  // existe em versões mais velhas e quebraria toda a previsão nesses aparelhos).
  // Sem header User-Agent: o navegador não permite defini-lo (e o Open-Meteo
  // não exige).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEATHER_FETCH_TIMEOUT_MS);
  return fetch(url, {
    cache: "no-store",
    signal: controller.signal,
    headers: { Accept: "application/json" },
  }).finally(() => clearTimeout(timer));
}

// UF → nome do estado, para casar com o `admin1` do geocoding do Open-Meteo.
const STATE_NAMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

// Códigos WMO (weathercode do Open-Meteo) → descrição em pt-BR.
const WEATHER_CONDITIONS: Record<number, string> = {
  0: "Céu limpo",
  1: "Predomínio de sol",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Névoa",
  48: "Névoa com geada",
  51: "Garoa leve",
  53: "Garoa moderada",
  55: "Garoa intensa",
  61: "Chuva fraca",
  63: "Chuva moderada",
  65: "Chuva forte",
  66: "Chuva congelante",
  67: "Chuva congelante forte",
  71: "Neve fraca",
  73: "Neve moderada",
  75: "Neve forte",
  77: "Grãos de neve",
  80: "Pancadas de chuva",
  81: "Pancadas de chuva moderadas",
  82: "Pancadas de chuva fortes",
  85: "Pancadas de neve",
  86: "Pancadas de neve fortes",
  95: "Tempestade",
  96: "Tempestade com granizo",
  99: "Tempestade com granizo forte",
};

function describeWeather(code: number | null): string {
  if (code === null) return "Condição indisponível";
  return WEATHER_CONDITIONS[code] ?? "Condição indisponível";
}

// O TempCard recebe a cidade já formatada como "Cidade, UF" ou "Cidade, Estado"
// (ex.: "Mogi das Cruzes, SP" / "Mogi das Cruzes, São Paulo"). Separa em nome +
// estado para geocodificar e desambiguar homônimos.
function splitCityState(label: string): { city: string; state: string | null } {
  const parts = label
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return { city: label.trim(), state: null };
  return { city: parts[0], state: parts[1] ?? null };
}

// Converte o trecho de estado ("SP" ou "São Paulo") no nome completo usado pelo
// `admin1` do Open-Meteo.
function resolveStateName(state: string | null): string | null {
  if (!state) return null;
  if (state.length === 2) return STATE_NAMES[state.toUpperCase()] ?? state;
  return state;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  label: string;
}

async function geocode(
  city: string,
  state: string | null,
): Promise<GeoLocation | null> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(
    city,
  )}&count=20&language=pt&format=json`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) return null;
  const data: {
    results?: Array<{
      latitude: number;
      longitude: number;
      name: string;
      admin1?: string;
      country_code?: string;
      population?: number;
    }>;
  } = await response.json();
  const results = (data.results ?? []).filter(
    (result) => result.country_code === "BR",
  );
  if (results.length === 0) return null;

  const stateName = resolveStateName(state);
  const byState =
    stateName &&
    results.find(
      (result) => result.admin1?.toLowerCase() === stateName.toLowerCase(),
    );
  // Sem UF (ou sem casar o estado), desempata pela cidade mais populosa em vez
  // de pegar um homônimo arbitrário — reduz o risco de previsão da cidade errada.
  const mostPopulous = [...results].sort(
    (a, b) => (b.population ?? 0) - (a.population ?? 0),
  )[0];
  const match = byState || mostPopulous;

  return {
    latitude: match.latitude,
    longitude: match.longitude,
    label: match.admin1 ? `${match.name}, ${match.admin1}` : match.name,
  };
}

function toIsoLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Busca a previsão diária de `days` dias a partir de HOJE (dia da embalagem /
// envio), no destino informado. Lança em caso de falha — o componente trata.
export async function getDestinationForecast(
  cityLabel: string,
  days = 5,
): Promise<ForecastDay[]> {
  const { city, state } = splitCityState(cityLabel);
  if (!city) throw new Error("cidade ausente");

  const location = await geocode(city, state);
  if (!location) throw new Error("não foi possível localizar a cidade");

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days - 1);

  const url =
    `${FORECAST_URL}?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
    `&timezone=auto&start_date=${toIsoLocalDate(start)}&end_date=${toIsoLocalDate(end)}`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`forecast HTTP ${response.status}`);

  const data: {
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      weathercode?: number[];
    };
  } = await response.json();

  const times = data.daily?.time ?? [];
  if (times.length === 0) throw new Error("previsão sem dias na resposta");

  const maxes = data.daily?.temperature_2m_max ?? [];
  const mins = data.daily?.temperature_2m_min ?? [];
  const codes = data.daily?.weathercode ?? [];

  return times.map((date, index) => {
    const max = maxes[index];
    const min = mins[index];
    const code = codes[index];
    return {
      date,
      max: typeof max === "number" ? Math.round(max) : null,
      min: typeof min === "number" ? Math.round(min) : null,
      condition: describeWeather(typeof code === "number" ? code : null),
    };
  });
}
