export interface OrderItem {
  id: number;
  sku: string;
  name: string;
  qty: number;
  tags: string[];
  color: string;
  label: string;
}

export interface OrderBox {
  name: string;
  dim: string;
  fill: number;
}

export interface OrderCarrier {
  name: string;
  svc: string;
  logo: string;
  eta: string;
  color: string;
}

export interface ForecastDay {
  date: string; // "YYYY-MM-DD"
  min: number | null;
  max: number | null;
  condition: string;
}

export interface OrderTemperature {
  city: string;
  value: number;
  min: number | null;
  max: number | null;
  condition: string;
  forecast: string;
  deliveryDate: string;
}

export interface Order {
  code: string;
  customer: string;
  city: string;
  placedAt: string;
  priority: "normal" | "express";
  items: OrderItem[];
  box: OrderBox;
  carrier: OrderCarrier;
  temperature: OrderTemperature;
}

// Pedido real vindo da IDWorks (via backend ERP) ao bipar a chave de acesso
// da NF-e. Caixa, temperatura e posição de etiqueta ainda usam placeholder
// até serem integrados.
export interface ScannedItem {
  idSku: string;
  skuName: string;
  quantity: number;
}

export interface ScannedCarrier {
  name: string | null;
  deliveryDate: string | null;
}

export interface ScannedTemperature {
  city: string;
  value: number;
  min: number | null;
  max: number | null;
  condition: string;
  forecast: string;
  deliveryDate: string;
}

export interface OrderPackedBy {
  username: string;
  workstationName: string | null;
  scannedAt: string;
}

export interface OperatorStats {
  orderCount: number;
  unitCount: number;
}

export interface ScanSession {
  status: "open" | "closed";
  startedAt: string | null;
  isMine: boolean;
  busyBy: string | null;
}

export interface ScannedOrder {
  idOrder: string;
  numPedido: string;
  legacyNumPedido: string;
  // Nula quando o pedido foi aberto pelo número e ainda não tem NF-e.
  chaveAcesso: string | null;
  dataPedido: string | null;
  customer: string | null;
  orderComments: string | null;
  itemCount: number;
  unitCount: number;
  volumeCount: number;
  carrier: ScannedCarrier;
  temperature: ScannedTemperature | null;
  labelGifUrl: string | null;
  alreadyPacked: boolean;
  packedBy: OrderPackedBy | null;
  session: ScanSession;
  items: ScannedItem[];
  operatorStats: OperatorStats;
}

export interface FinalizeResult {
  success: boolean;
  finishedAt: string | null;
  durationSeconds: number | null;
  volumeCount: number | null;
  operatorStats: OperatorStats;
}

export type ToastKind = "" | "success" | "warn" | "error";

export interface Toast {
  id: string;
  msg: string;
  kind: ToastKind;
}
