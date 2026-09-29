import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import type { ForecastDay, OrderTemperature } from "@/types";
import { getDestinationForecast } from "@/lib/weather";

// Formata "YYYY-MM-DD" em "Seg · 14/07" sem shift de timezone (parse manual).
function formatForecastDay(raw: string): string {
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!isoMatch) return raw;
  const [, year, month, day] = isoMatch;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return `${day}/${month}`;
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  const label = weekday.replace(".", "");
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
  return `${capitalized} · ${day}/${month}`;
}

type ForecastStatus = "idle" | "loading" | "done" | "error";

export function TempCard({ temp }: { temp: OrderTemperature }) {
  // Backends antigos podem não enviar min/max — trata undefined e null igual.
  const hasReadings =
    typeof temp.min === "number" && typeof temp.max === "number";

  const [forecastOpen, setForecastOpen] = useState(false);
  const [status, setStatus] = useState<ForecastStatus>("idle");
  const [days, setDays] = useState<ForecastDay[]>([]);
  const loadedCity = useRef<string | null>(null);

  useEffect(() => {
    if (!forecastOpen) return;
    if (loadedCity.current === temp.city) return;
    let cancelled = false;
    setStatus("loading");
    getDestinationForecast(temp.city, 5)
      .then((result) => {
        if (cancelled) return;
        setDays(result);
        setStatus("done");
        loadedCity.current = temp.city;
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [forecastOpen, temp.city]);

  useEffect(() => {
    if (!forecastOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setForecastOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [forecastOpen]);

  return (
    <div>
      <h3 className="panel-title">
        <span className="ic">
          <Icon.thermo width={12} height={12} />
        </span>
        Temperatura no destino
      </h3>
      <div className="temp-minmax">
        <div className="temp-stat temp-stat--min">
          <span className="lbl">Mínima</span>
          <span className="val">{hasReadings ? `${temp.min}°` : "—"}</span>
        </div>
        <div className="temp-stat temp-stat--max">
          <span className="lbl">Máxima</span>
          <span className="val">{hasReadings ? `${temp.max}°` : "—"}</span>
        </div>
      </div>
      <div className="temp-meta">
        <div className="where">
          <b>{temp.city}</b>
        </div>
        <div className="cond">{temp.condition}</div>
      </div>
      {temp.deliveryDate && (
        <button
          type="button"
          className="temp-forecast temp-forecast--link"
          onClick={() => setForecastOpen(true)}
          aria-label="Ver previsão dos próximos dias"
        >
          <span>
            Previsão de entrega: <b>{temp.deliveryDate}</b>
          </span>
          <Icon.chev width={14} height={14} className="temp-forecast-caret" />
        </button>
      )}

      {forecastOpen && (
        <div
          className="temp-fc-scrim"
          role="dialog"
          aria-modal="true"
          aria-label="Previsão dos próximos dias"
          onClick={() => setForecastOpen(false)}
        >
          <div className="temp-fc-pop" onClick={(e) => e.stopPropagation()}>
            <div className="temp-fc-head">
              <div>
                <div className="temp-fc-title">Próximos dias</div>
                <div className="temp-fc-city">{temp.city}</div>
              </div>
              <button
                type="button"
                className="temp-fc-close"
                onClick={() => setForecastOpen(false)}
                aria-label="Fechar previsão"
              >
                ✕
              </button>
            </div>

            {status === "loading" && (
              <div className="temp-fc-loading">
                <span className="temp-fc-spinner" aria-hidden="true" />
                Carregando previsão…
              </div>
            )}

            {status === "error" && (
              <div className="temp-fc-empty">
                Não foi possível carregar a previsão detalhada no momento. A
                embalagem pode continuar normalmente.
              </div>
            )}

            {status === "done" && (
              <ul className="temp-fc-list">
                {days.map((day) => {
                  const dayHasReadings =
                    typeof day.min === "number" && typeof day.max === "number";
                  return (
                    <li key={day.date} className="temp-fc-day">
                      <span className="temp-fc-date">
                        {formatForecastDay(day.date)}
                      </span>
                      <span className="temp-fc-cond">{day.condition}</span>
                      <span className="temp-fc-temps">
                        <span className="temp-fc-min">
                          {dayHasReadings ? `${day.min}°` : "—"}
                        </span>
                        <b className="temp-fc-max">
                          {dayHasReadings ? `${day.max}°` : "—"}
                        </b>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
