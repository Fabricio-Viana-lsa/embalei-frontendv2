// Camada de acesso ao backend ERP (módulo Embalei) e à sessão local do
// operador. O frontend de operação não usa cookies/NextAuth: a autenticação
// acontece ao "ocupar" uma estação (nome + data de nascimento) e a sessão
// resultante fica no localStorage até o logout (que libera a estação).

// Sem env explícita, o frontend deduz a URL do backend a partir do próprio
// host (porta 3000). Assim o app continua funcionando ao trocar de rede / IP
// sem precisar reconfigurar .env.local. Em produção, defina
// NEXT_PUBLIC_API_BASE_URL para apontar para o host do ERP.
const BACKEND_DEV_PORT = "4050";
const PRODUCTION_API_URL = "https://new.santolabs.com.br";

function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      const isLocalNetwork =
        /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
      if (isLocalNetwork) return `${protocol}//${hostname}:${BACKEND_DEV_PORT}`;
    }
  }
  return PRODUCTION_API_URL;
}

const API_BASE_URL = resolveApiBaseUrl();

import type {
  FinalizeResult,
  OperatorStats,
  ScannedOrder,
} from "@/types";

const ESTACOES_BASE = `${API_BASE_URL}/api/modulos/embalei/estacoes`;

export interface ApiUser {
  id: number;
  username: string;
}

export interface ApiEmbalagem {
  id: number;
  name: string;
  eanCode: string | null;
}

export type EstacaoStatus = "disponivel" | "em_uso";

export interface ApiEstacao {
  id: string;
  name: string;
  description: string | null;
  status: EstacaoStatus;
  occupantName: string | null;
  occupiedSince: string | null;
}

export interface EmbaleiSession {
  userId: number;
  username: string;
  workstationId: string;
  workstationName: string;
  heartbeatIntervalSeconds: number;
}

const SESSION_KEY = "embalei.session";

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.error ?? "Falha na comunicação com o servidor.";
  } catch {
    return "Falha na comunicação com o servidor.";
  }
}

export async function fetchUsuarios(): Promise<ApiUser[]> {
  const response = await fetch(`${ESTACOES_BASE}/usuarios`, { cache: "no-store" });
  if (!response.ok) throw new Error(await parseError(response));
  const data = await response.json();
  return data.usuarios as ApiUser[];
}

export async function fetchEmbalagens(): Promise<ApiEmbalagem[]> {
  const response = await fetch(`${ESTACOES_BASE}/embalagens`, { cache: "no-store" });
  if (!response.ok) throw new Error(await parseError(response));
  const data = await response.json();
  return data.embalagens as ApiEmbalagem[];
}

export async function fetchEstacoes(): Promise<{
  estacoes: ApiEstacao[];
  heartbeatIntervalSeconds: number;
}> {
  const response = await fetch(ESTACOES_BASE, { cache: "no-store" });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function ocuparEstacao(input: {
  workstationId: string;
  username: string;
  birthDate: string;
}): Promise<EmbaleiSession> {
  const response = await fetch(`${ESTACOES_BASE}/ocupar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  const data = await response.json();
  return {
    userId: data.user.id,
    username: data.user.username,
    workstationId: data.workstation.id,
    workstationName: data.workstation.name,
    heartbeatIntervalSeconds: data.heartbeatIntervalSeconds,
  };
}

// Identifica o pedido bipado: chave de acesso da NF-e (44 dígitos) ou número
// do pedido (IDOrder, código com prefixo ou número do marketplace).
export type OrderLookup = { chaveAcesso: string } | { numeroPedido: string };

// 1º bipe da NF-e (ou do número do pedido): abre uma sessão de embalagem para
// o pedido. O backend devolve os dados do pedido (IDWorks) + estado da sessão (open/closed/busy/
// already-packed). NÃO registra a embalagem ainda — isso acontece no
// `finalizarEmbalagem` (2º bipe).
export async function abrirEmbalagem(
  input: { workstationId: string } & OrderLookup,
): Promise<ScannedOrder> {
  const response = await fetch(`${ESTACOES_BASE}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as ScannedOrder;
}

// 2º bipe da NF-e (ou do número do pedido): fecha a sessão aberta com o total
// de volumes contados e grava a embalagem (com duration_seconds calculado pelo
// backend).
export async function finalizarEmbalagem(
  input: {
    workstationId: string;
    volumeCount: number;
    // Códigos (EAN das embalagens) bipados em cada volume, na ordem em que
    // foram lidos. O backend cruza com a tabela de embalagens para o relatório.
    volumeCodes: string[];
  } & OrderLookup,
): Promise<FinalizeResult> {
  const response = await fetch(`${ESTACOES_BASE}/pedidos/finalizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as FinalizeResult;
}

// Heartbeat e liberação são chamadas best-effort em background: uma falha de
// rede (backend reiniciando, conexão instável, navegação em curso) não deve
// estourar erro na UI da estação. Engolimos o erro e seguimos — o próximo
// heartbeat tenta de novo; o logout prossegue mesmo se a liberação falhar.
export async function fetchOperatorStats(
  workstationId: string,
): Promise<OperatorStats> {
  const response = await fetch(
    `${ESTACOES_BASE}/stats?workstationId=${encodeURIComponent(workstationId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as OperatorStats;
}

export async function enviarHeartbeat(workstationId: string): Promise<void> {
  try {
    await fetch(`${ESTACOES_BASE}/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workstationId }),
    });
  } catch {
    /* rede indisponível — ignora, o próximo ciclo tenta novamente */
  }
}

export async function liberarEstacao(workstationId: string): Promise<void> {
  try {
    await fetch(`${ESTACOES_BASE}/liberar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workstationId }),
    });
  } catch {
    /* rede indisponível — o logout segue mesmo assim */
  }
}

export function saveSession(session: EmbaleiSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): EmbaleiSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EmbaleiSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
