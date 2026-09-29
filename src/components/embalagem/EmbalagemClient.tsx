"use client";

import { useEffect, useRef, useState } from "react";
import { Toast, toast } from "@heroui/react";
import type { OperatorStats, ScannedOrder, ToastKind } from "@/types";
import {
  abrirEmbalagem,
  clearSession,
  enviarHeartbeat,
  fetchEmbalagens,
  fetchOperatorStats,
  finalizarEmbalagem,
  getSession,
  liberarEstacao,
  type ApiEmbalagem,
  type EmbaleiSession,
  type OrderLookup,
} from "@/lib/api";
import { Icon } from "@/components/icons";
import { TopBar } from "./TopBar";
import { ScanStrip } from "./ScanStrip";
import { EmptyState } from "./EmptyState";
import { OrderDetail } from "./OrderDetail";
import { OrderLoading } from "./OrderLoading";
import { OrderNotFound } from "./OrderNotFound";
import { EmbalagemKeyboard } from "./EmbalagemKeyboard";
import { PackSuccessOverlay } from "./PackSuccessOverlay";
import { OrderCommentsAlert } from "./OrderCommentsAlert";

// Duração do overlay de sucesso após fechar a embalagem.
const PACK_SUCCESS_VISIBLE_MS = 1400;

// Guard de auth e logout do quiosque usam navegação "dura" (window.location)
// em vez do router do App Router: redirect num efeito remontado pelo Strict
// Mode aborta a transição do router (InvalidStateError) — e aqui sair da tela
// deve resetar o estado por completo de qualquer forma.
function leaveToLogin() {
  window.location.replace("/");
}

export function EmbalagemClient() {
  const [session, setSession] = useState<EmbaleiSession | null>(null);
  const [order, setOrder] = useState<ScannedOrder | null>(null);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [scanning, setScanning] = useState(false);
  const [scannedKey, setScannedKey] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  // Códigos (EAN das embalagens) selecionados para o pedido, na ordem de leitura
  // — cada toque adiciona um; o lápis define a quantidade exata. Enviados ao
  // finalizar para o relatório de embalagens por operador. Não há limite por
  // volume esperado nem finalização automática — a finalização é explícita pelo
  // botão "Confirmar volumes", que exige ao menos uma embalagem.
  const [boxScanCodes, setBoxScanCodes] = useState<string[]>([]);
  // Quantidade total de embalagens — sempre derivada dos códigos, para nunca
  // dessincronizar (não é estado próprio).
  const boxScanCount = boxScanCodes.length;
  // Catálogo de embalagens para o teclado virtual de contagem de volumes.
  const [embalagens, setEmbalagens] = useState<ApiEmbalagem[]>([]);
  // Teclado fica recolhido atrás de um botão flutuante (são muitas embalagens);
  // abre em tela cheia (abaixo do header) quando o operador quer escolher.
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  // Popup da observação do pedido (OrderComments da IDWorks). Abre ao bipar um
  // pedido com observação; a barra piscante abaixo do header o reabre.
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  // Total de pedidos / itens embalados hoje pelo operador — atualizado a cada
  // novo bip de NF-e e quando a sessão monta. "0/0" enquanto a 1ª resposta
  // não chega.
  const [operatorStats, setOperatorStats] = useState<OperatorStats>({
    orderCount: 0,
    unitCount: 0,
  });
  const [packSuccess, setPackSuccess] = useState<{
    orderCode: string;
    volumeCount: number;
  } | null>(null);

  // Sem sessão (estação ocupada no login) não há o que embalar — volta ao login.
  useEffect(() => {
    const stored = getSession();
    if (!stored) {
      leaveToLogin();
      return;
    }
    setSession(stored);
  }, []);

  // Carrega as estatísticas do dia ao montar; depois disso, cada bipagem
  // bem-sucedida traz o valor atualizado dentro da resposta do pedido.
  useEffect(() => {
    if (!session) return;
    fetchOperatorStats(session.workstationId)
      .then(setOperatorStats)
      .catch(() => {
        /* rede indisponível — header mostra 0/0 até a próxima bipagem */
      });
  }, [session]);

  // Carrega o catálogo de embalagens uma vez para o teclado virtual.
  useEffect(() => {
    if (!session) return;
    fetchEmbalagens()
      .then(setEmbalagens)
      .catch(() => {
        /* sem catálogo — o teclado mostra "nenhuma embalagem cadastrada" */
      });
  }, [session]);

  // Heartbeat: enquanto a estação está em uso, registra atividade no backend
  // no intervalo configurado. A estação só é liberada no logout (SAIR).
  useEffect(() => {
    if (!session) return;
    enviarHeartbeat(session.workstationId);
    const intervalMs = Math.max(5, session.heartbeatIntervalSeconds) * 1000;
    const timer = setInterval(() => {
      enviarHeartbeat(session.workstationId);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [session]);

  const exiting = useRef(false);

  // Defere o reset do pedido para o próximo tick. Sem isso, react-aria/pressable
  // dispara "InvalidStateError: Transition was aborted because of invalid state"
  // porque o botão Cancelar (e o Input do ScanStrip) podem estar no meio de uma
  // transição de press/focus quando `setOrder(null)` os desmonta/troca de modo.
  const resetOrderState = () => {
    setTimeout(() => {
      setOrder(null);
      setPicks({});
      setBoxScanCodes([]);
      setKeyboardOpen(false);
      setCommentsOpen(false);
    }, 0);
  };

  const pushToast = (msg: string, kind: ToastKind = "") => {
    const opts = { timeout: 2400 };
    if (kind === "success") toast.success(msg, opts);
    else if (kind === "warn") toast.warning(msg, opts);
    else if (kind === "error") toast.danger(msg, opts);
    else toast(msg, opts);
  };

  // A chave de acesso da NF-e tem 44 dígitos; qualquer outro código bipado é
  // tratado como número do pedido (IDOrder, código com prefixo ou número do
  // marketplace) na consulta à IDWorks.
  const isChaveAcesso = (code: string) => /^\d{44}$/.test(code);

  const toOrderLookup = (code: string): OrderLookup =>
    isChaveAcesso(code) ? { chaveAcesso: code } : { numeroPedido: code };

  // Reconhece o re-bipe do pedido já aberto (pela NF-e ou pelo número).
  const isOpenOrderCode = (openOrder: ScannedOrder, code: string) =>
    [
      openOrder.chaveAcesso,
      openOrder.idOrder,
      openOrder.numPedido,
      openOrder.legacyNumPedido,
    ].some((orderCode) => orderCode?.toUpperCase() === code.toUpperCase());

  // Prefere a chave da NF-e (identificador único); sem NF-e, usa o IDOrder,
  // que a busca por número da IDWorks casa de forma exata.
  const openOrderLookup = (openOrder: ScannedOrder): OrderLookup =>
    openOrder.chaveAcesso
      ? { chaveAcesso: openOrder.chaveAcesso }
      : { numeroPedido: openOrder.idOrder };

  const abrir = async (code: string) => {
    if (!session || scanning) return;
    setScannedKey(code);
    setScanError(null);
    setScanning(true);
    setBoxScanCodes([]);
    setKeyboardOpen(false);
    try {
      const carregado = await abrirEmbalagem({
        workstationId: session.workstationId,
        ...toOrderLookup(code),
      });
      setOrder(carregado);
      setCommentsOpen(Boolean(carregado.orderComments));
      setOperatorStats(carregado.operatorStats);
      const initial: Record<string, number> = {};
      carregado.items.forEach((item) => {
        initial[item.idSku] = item.quantity;
      });
      setPicks(initial);
      if (carregado.alreadyPacked && carregado.packedBy) {
        const estacao = carregado.packedBy.workstationName
          ? ` (${carregado.packedBy.workstationName})`
          : "";
        pushToast(
          `Pedido ${carregado.numPedido} JÁ FOI EMBALADO por ${carregado.packedBy.username}${estacao}`,
          "warn"
        );
      } else if (carregado.session.status === "open" && !carregado.session.isMine) {
        pushToast(
          `Pedido ${carregado.numPedido} em embalagem por ${carregado.session.busyBy ?? "outro operador"}`,
          "warn"
        );
      } else {
        pushToast(
          `Pedido ${carregado.numPedido} aberto · selecione as embalagens e toque em "Confirmar volumes"`,
          "success"
        );
      }
    } catch (error: unknown) {
      setScanError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o pedido."
      );
    } finally {
      setScanning(false);
    }
  };

  const finalizar = async () => {
    if (!session || !order || finalizing) return;
    if (order.alreadyPacked || !order.session.isMine) {
      pushToast("Sessão não está aberta neste operador.", "error");
      return;
    }

    if (boxScanCount < 1) {
      pushToast(
        "Selecione ao menos uma embalagem utilizada antes de finalizar o pedido.",
        "error"
      );
      return;
    }
    setFinalizing(true);
    pushToast(
      `Fechando embalagem do pedido ${order.numPedido}…`,
      "warn"
    );
    try {
      const result = await finalizarEmbalagem({
        workstationId: session.workstationId,
        ...openOrderLookup(order),
        volumeCount: boxScanCount,
        volumeCodes: boxScanCodes,
      });
      setOperatorStats(result.operatorStats);
      setPackSuccess({
        orderCode: order.numPedido,
        volumeCount: boxScanCount,
      });
      setTimeout(() => setPackSuccess(null), PACK_SUCCESS_VISIBLE_MS);
      pushToast(
        `Pedido ${order.numPedido} embalado · ${boxScanCount} volume(s)`,
        "success"
      );
      resetOrderState();
      // Garante que o TopBar reflita o estado mais atual do banco após o
      // fechamento (defesa em profundidade: se a resposta do finalizar trouxer
      // contagem defasada por qualquer race, esta chamada corrige).
      fetchOperatorStats(session.workstationId)
        .then(setOperatorStats)
        .catch(() => {
          /* falha de rede — o próximo bipe atualiza */
        });
    } catch (error: unknown) {
      pushToast(
        error instanceof Error ? error.message : "Falha ao finalizar a embalagem.",
        "error"
      );
    } finally {
      setFinalizing(false);
    }
  };

  const handleScan = (code: string) => {
    if (finalizing) {
      pushToast("Aguarde a finalização da embalagem atual…", "warn");
      return;
    }
    // 2º bipe do MESMO pedido (NF-e ou número): NÃO finaliza mais (evita
    // finalização acidental por duplo bip). A finalização passa a ser explícita
    // pelo botão "Confirmar volumes", que valida os campos obrigatórios.
    if (order && isOpenOrderCode(order, code)) {
      pushToast("Pedido já carregado · use o botão para finalizar.", "warn");
      return;
    }
    const hasSessionInProgress =
      order && order.session.isMine && !order.alreadyPacked;
    if (!hasSessionInProgress) {
      void abrir(code);
      return;
    }
    // Bipou outra NF-e com sessão aberta: bloqueia (operador precisa finalizar
    // antes de abrir outra). Os volumes não são mais bipados — o operador
    // escolhe a embalagem usada no teclado.
    if (isChaveAcesso(code)) {
      pushToast("Finalize a embalagem atual antes de bipar outra NF-e.", "error");
      return;
    }
    pushToast("Selecione a embalagem do volume no teclado.", "warn");
  };

  // Adiciona um volume com aquele código — usado tanto pelo bipe quanto pelo
  // teclado virtual, para que os dois caminhos fiquem sempre em sincronia.
  const addEmbalagem = (code: string) => {
    if (!order || finalizing) return;
    if (order.alreadyPacked || !order.session.isMine) return;
    setBoxScanCodes((codes) => [...codes, code]);
  };

  // Remove a última ocorrência daquele código (para trocar de embalagem).
  const removeEmbalagem = (code: string) => {
    if (finalizing) return;
    const index = boxScanCodes.lastIndexOf(code);
    if (index === -1) return;
    const next = boxScanCodes.slice();
    next.splice(index, 1);
    setBoxScanCodes(next);
  };

  const setEmbalagemQuantity = (code: string, quantity: number) => {
    if (finalizing) return;
    const clamped = Math.max(0, Math.floor(quantity));
    let kept = 0;
    const next: string[] = [];
    for (const current of boxScanCodes) {
      if (current !== code) {
        next.push(current);
      } else if (kept < clamped) {
        next.push(current);
        kept += 1;
      }
    }
    while (kept < clamped) {
      next.push(code);
      kept += 1;
    }
    setBoxScanCodes(next);
  };

  const handlePickItem = (idSku: string) => {
    if (!order) return;
    const item = order.items.find((i) => i.idSku === idSku);
    if (!item) return;
    setPicks((p) => ({
      ...p,
      [idSku]: Math.min(item.quantity, (p[idSku] || 0) + 1),
    }));
  };

  const handleReset = () => {
    setScanError(null);
    resetOrderState();
  };

  const handleExit = async () => {
    if (exiting.current || !session) return;
    exiting.current = true;
    pushToast("Encerrando sessão…", "warn");
    try {
      await liberarEstacao(session.workstationId);
    } finally {
      clearSession();
      leaveToLogin();
    }
  };

  if (!session) return null;

  const showKeyboard =
    !!order && order.session.isMine && !order.alreadyPacked && !finalizing;
  // Campo obrigatório para finalizar: ao menos uma embalagem selecionada.
  const hasEmbalagem = boxScanCount >= 1;
  // Quando aberto, o modal cobre a tela (não precisa reservar). Quando fechado,
  // reserva espaço para o botão flutuante não cobrir o fim do conteúdo.
  const stagePaddingBottom = showKeyboard && !keyboardOpen ? 96 : undefined;

  return (
    <>
      <TopBar
        orderCode={order?.numPedido ?? null}
        stationName={session.workstationName}
        operatorName={session.username}
        operatorStats={operatorStats}
        onExit={handleExit}
        onReset={handleReset}
      />
      <OrderCommentsAlert
        comments={order?.orderComments ?? null}
        open={commentsOpen}
        onOpen={() => setCommentsOpen(true)}
        onClose={() => setCommentsOpen(false)}
      />
      <div
        className="stage"
        style={stagePaddingBottom ? { paddingBottom: stagePaddingBottom } : undefined}
      >
        <ScanStrip
          onScan={handleScan}
          hasOrder={!!order}
          boxScanCount={boxScanCount}
          volumeCount={order?.volumeCount ?? 0}
          scannerVariant="a"
        />
        {finalizing ? (
          <OrderLoading code={order?.chaveAcesso ?? null} mode="finalizando" />
        ) : scanning ? (
          <OrderLoading code={scannedKey} mode="buscando" />
        ) : scanError ? (
          <OrderNotFound message={scanError} code={scannedKey} />
        ) : order ? (
          <OrderDetail order={order} picks={picks} onPick={handlePickItem} />
        ) : (
          <EmptyState />
        )}
      </div>

      {showKeyboard && order && keyboardOpen && (
        <>
          <div
            className="emb-kb-scrim emb-kb-scrim--clickable"
            aria-hidden="true"
            onClick={() => setKeyboardOpen(false)}
          />
          <EmbalagemKeyboard
            embalagens={embalagens}
            codes={boxScanCodes}
            total={boxScanCount}
            finalizing={finalizing}
            onAdd={addEmbalagem}
            onRemove={removeEmbalagem}
            onSetQuantity={setEmbalagemQuantity}
            onConfirm={finalizar}
            onClose={() => setKeyboardOpen(false)}
          />
        </>
      )}

      {showKeyboard && !keyboardOpen && (
        <div className="emb-fab-bar">
          <button
            type="button"
            className="btn primary emb-fab-confirm"
            onClick={finalizar}
            disabled={finalizing}
          >
            <Icon.check width={16} height={16} />
            Confirmar volumes
          </button>
          <button
            type="button"
            className={"emb-fab" + (hasEmbalagem ? " emb-fab--complete" : "")}
            onClick={() => setKeyboardOpen(true)}
            aria-label="Abrir teclado de embalagens"
          >
            <Icon.box width={24} height={24} />
            <span className="emb-fab-badge">{boxScanCount}</span>
          </button>
        </div>
      )}
      <Toast.Provider placement="bottom" />
      {packSuccess && (
        <PackSuccessOverlay
          orderCode={packSuccess.orderCode}
          volumeCount={packSuccess.volumeCount}
        />
      )}
    </>
  );
}
