import { useState } from "react";
import { Chip } from "@heroui/react";
import type { OrderTemperature, ScannedOrder } from "@/types";
import { CarrierCard } from "./CarrierCard";
import { TempCard } from "./TempCard";
import { LabelGif } from "./LabelGif";
import { ItemRow } from "./ItemRow";

interface Props {
  order: ScannedOrder;
  picks: Record<string, number>;
  onPick: (idSku: string) => void;
}

const PLACEHOLDER_TEMPERATURE: OrderTemperature = {
  city: "—",
  value: 0,
  min: null,
  max: null,
  condition: "Previsão indisponível",
  forecast: "",
  deliveryDate: "",
};

function formatScannedAt(raw: string): string | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString("pt-BR");
}

function formatOrderDate(raw: string | null): string | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function OrderDetail({ order, picks, onPick }: Props) {
  const [itemsOpen, setItemsOpen] = useState(true);
  const orderDate = formatOrderDate(order.dataPedido);

  return (
    <div className="order">
      {order.alreadyPacked && order.packedBy && (
        <div className="already-packed" role="alert">
          <span className="already-packed-tag">JÁ EMBALADO</span>
          <span>
            Este pedido já foi embalado por{" "}
            <b>{order.packedBy.username}</b>
            {order.packedBy.workstationName && (
              <>
                {" "}
                na estação <b>{order.packedBy.workstationName}</b>
              </>
            )}
            {formatScannedAt(order.packedBy.scannedAt) && (
              <> em {formatScannedAt(order.packedBy.scannedAt)}</>
            )}
          </span>
        </div>
      )}
      <div className="info-grid">
        <div className="panel delivery-panel">
          <CarrierCard carrier={order.carrier} />
          <TempCard temp={order.temperature ?? PLACEHOLDER_TEMPERATURE} />
          <div className="panel-divider" />
          <LabelGif gifUrl={order.labelGifUrl} />
        </div>
      </div>
      <div className="panel">
        <div
          className="order-head collapsible"
          onClick={() => setItemsOpen((o) => !o)}
          role="button"
          tabIndex={0}
          aria-label={`Itens do pedido ${order.numPedido}`}
          aria-expanded={itemsOpen}
        >
          <div className="order-head-row">
            <div className="order-code">
              <span className={"chev-toggle" + (itemsOpen ? " open" : "")}>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
              <div>
                <div className="pid">{order.numPedido}</div>
                {orderDate && <div className="meta">{orderDate}</div>}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Chip className="badge brand">
                {order.itemCount} itens · {order.unitCount} unidades
              </Chip>
            </div>
          </div>
        </div>
        {itemsOpen && (
          <div className="items">
            {order.items.map((item) => (
              <ItemRow
                key={item.idSku}
                item={item}
                picked={Math.min(item.quantity, picks[item.idSku] || 0)}
                onPick={() => onPick(item.idSku)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
