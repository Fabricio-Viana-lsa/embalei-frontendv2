import type { ScannedCarrier } from "@/types";

function formatDeliveryDate(raw: string | null): string {
  if (!raw) return "A definir";
  // Backend normaliza para "YYYY-MM-DD". Parse manual evita shift de timezone
  // (new Date("2026-06-12") = meia-noite UTC → vira 11/06 em UTC-3).
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function carrierInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function CarrierCard({ carrier }: { carrier: ScannedCarrier }) {
  return (
    <div className="carrier">
      <div
        className="carrier-logo"
        style={{ background: "linear-gradient(135deg, #1d4ed8, #1d4ed8cc)" }}
      >
        {carrierInitials(carrier.name)}
      </div>
      <div className="carrier-info">
        <div className="name">{carrier.name ?? "Não informada"}</div>
        <div className="eta">
          Entrega · {formatDeliveryDate(carrier.deliveryDate)}
        </div>
      </div>
    </div>
  );
}
