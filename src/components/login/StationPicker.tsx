"use client";

import { useMemo, useState } from "react";
import { Input } from "@heroui/react";
import { Icon } from "@/components/icons";
import type { ApiEstacao } from "@/lib/api";
import { StationCard } from "./StationCard";

// A partir deste número de estações aparece a busca.
const SEARCH_THRESHOLD = 7;

interface Props {
  stations: ApiEstacao[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}

interface NumberedStation {
  station: ApiEstacao;
  // Posição no cadastro: não muda quando a lista é reordenada ou filtrada.
  number: number;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matchesSearch(station: ApiEstacao, normalizedTerm: string): boolean {
  const searchable = [station.name, station.description, station.occupantName]
    .filter(Boolean)
    .join(" ");
  return normalize(searchable).includes(normalizedTerm);
}

// Escolha da estação no login. Com muitas estações a lista rola dentro da
// própria área (o botão Entrar continua à vista), as livres vêm primeiro e há
// busca por nome, descrição ou operador.
export function StationPicker({ stations, selectedId, loading, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const availableCount = stations.filter((station) => station.status !== "em_uso").length;
  const busyCount = stations.length - availableCount;
  const selectedStation = stations.find((station) => station.id === selectedId) ?? null;

  const visibleStations = useMemo<NumberedStation[]>(() => {
    const normalizedTerm = normalize(search.trim());
    const numbered = stations.map((station, index) => ({ station, number: index + 1 }));
    return numbered
      .filter(({ station }) => !normalizedTerm || matchesSearch(station, normalizedTerm))
      .sort(
        (first, second) =>
          Number(first.station.status === "em_uso") - Number(second.station.status === "em_uso") ||
          first.number - second.number
      );
  }, [stations, search]);

  const helpText = loading
    ? "Carregando estações…"
    : stations.length === 0
    ? "Nenhuma estação cadastrada. Fale com o supervisor."
    : selectedStation
    ? `Selecionada: ${selectedStation.name}`
    : "Estações em cinza estão ocupadas por outros operadores.";

  return (
    <>
      <div className="station-head">
        <label id="station-label">Estação</label>
        {stations.length > 0 && (
          <span className="station-counts">
            <span className="count-free">{availableCount} livre{availableCount === 1 ? "" : "s"}</span>
            {busyCount > 0 && <span className="count-busy">{busyCount} em uso</span>}
          </span>
        )}
      </div>

      {stations.length >= SEARCH_THRESHOLD && (
        <div className="ctrl station-search">
          <span className="ic-left">
            <Icon.search width={16} height={16} />
          </span>
          <Input
            type="search"
            aria-label="Buscar estação"
            placeholder="Buscar estação, descrição ou operador"
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}

      <div className="station-list" role="group" aria-labelledby="station-label">
        {visibleStations.length === 0 && stations.length > 0 ? (
          <div className="station-empty">Nenhuma estação encontrada para “{search.trim()}”.</div>
        ) : (
          <div className="station-grid">
            {visibleStations.map(({ station, number }) => (
              <StationCard
                key={station.id}
                station={station}
                number={number}
                selected={selectedId === station.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>

      <div className="help">{helpText}</div>
    </>
  );
}
