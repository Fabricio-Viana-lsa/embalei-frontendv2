import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input } from "@heroui/react";
import { Icon } from "@/components/icons";
import { ScannerIllus, type ScannerVariant } from "./ScannerIllus";

interface Props {
  onScan: (code: string) => void;
  hasOrder: boolean;
  boxScanCount: number;
  volumeCount: number;
  scannerVariant: ScannerVariant;
}

function buildHeadline(
  hasOrder: boolean,
  volumeCount: number,
  boxScanCount: number,
): string {
  if (!hasOrder) return "ESCANEIE A CHAVE DA NOTA OU O PEDIDO";
  if (boxScanCount >= volumeCount && volumeCount > 0)
    return "BIPE A NF-E OU O PEDIDO PARA FINALIZAR";
  if (volumeCount > 1)
    return `SELECIONE A CAIXA · ${boxScanCount}/${volumeCount} VOLUMES`;
  return "SELECIONE A CAIXA USADA";
}

interface VirtualKeyboardLike {
  overlaysContent?: boolean;
  hide?: () => void;
  show?: () => void;
}

function getVirtualKeyboard(): VirtualKeyboardLike | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & { virtualKeyboard?: VirtualKeyboardLike };
  return nav.virtualKeyboard ?? null;
}

export function ScanStrip({
  onScan,
  hasOrder,
  boxScanCount,
  volumeCount,
  scannerVariant,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const refocusTimer = useRef<number | null>(null);
  const [value, setValue] = useState("");
  // Digitação manual (chave da NF-e ou número do pedido) quando o leitor não
  // consegue ler a etiqueta. Enquanto aberta, o input fica visível e o foco
  // automático do leitor / ocultação do teclado virtual ficam suspensos. O ref
  // espelha o estado para os listeners globais lerem o valor atual.
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const isManualEntryOpenRef = useRef(false);

  const hideVirtualKeyboard = useCallback(() => {
    if (isManualEntryOpenRef.current) return;
    const vk = getVirtualKeyboard();
    if (!vk) return;
    vk.overlaysContent = true;
    // Algumas navegações trazem o teclado aberto antes do hide aplicar.
    // Repetimos por alguns frames para garantir que ele feche.
    vk.hide?.();
    window.setTimeout(() => vk.hide?.(), 50);
    window.setTimeout(() => vk.hide?.(), 200);
  }, []);

  const focusInput = useCallback(() => {
    if (isManualEntryOpenRef.current) return;
    const el = inputRef.current;
    if (!el || !el.isConnected || document.visibilityState !== "visible") return;
    try {
      hideVirtualKeyboard();
      el.focus({ preventScroll: true });
      hideVirtualKeyboard();
    } catch {
      /* foco indisponível neste instante — ignora */
    }
  }, [hideVirtualKeyboard]);

  const scheduleRefocus = useCallback(() => {
    if (refocusTimer.current !== null) window.clearTimeout(refocusTimer.current);
    refocusTimer.current = window.setTimeout(() => {
      refocusTimer.current = null;
      focusInput();
    }, 0);
  }, [focusInput]);

  // Sequência de mount/retomada: setamos inputmode="none" antes de focar para
  // o Android NÃO abrir o teclado virtual. Logo após o foco, restauramos
  // inputmode normal — o scanner do coletor volta a entregar os caracteres.
  const armScannerInput = useCallback(() => {
    if (isManualEntryOpenRef.current) return;
    const el = inputRef.current;
    if (!el || !el.isConnected || document.visibilityState !== "visible") return;
    el.setAttribute("inputmode", "none");
    hideVirtualKeyboard();
    try {
      el.focus({ preventScroll: true });
    } catch {
      /* ignora */
    }
    hideVirtualKeyboard();
    window.setTimeout(() => {
      el.removeAttribute("inputmode");
      hideVirtualKeyboard();
    }, 250);
  }, [hideVirtualKeyboard]);

  useEffect(() => {
    armScannerInput();

    const onVisibility = () => {
      if (document.visibilityState === "visible") armScannerInput();
    };
    // Qualquer toque na tela pode reabrir o teclado (Android abre o IME ao
    // tocar num input focado). Re-armamos sempre após o toque.
    const onPointer = () => {
      window.setTimeout(armScannerInput, 0);
    };
    window.addEventListener("focus", armScannerInput);
    window.addEventListener("pageshow", armScannerInput);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("touchstart", onPointer, true);
    return () => {
      window.removeEventListener("focus", armScannerInput);
      window.removeEventListener("pageshow", armScannerInput);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("touchstart", onPointer, true);
      if (refocusTimer.current !== null) {
        window.clearTimeout(refocusTimer.current);
        refocusTimer.current = null;
      }
    };
  }, [armScannerInput]);

  // Ao abrir a digitação manual, libera o teclado virtual e foca o input.
  useEffect(() => {
    if (!isManualEntryOpen) return;
    const el = inputRef.current;
    if (!el) return;
    el.removeAttribute("inputmode");
    el.focus({ preventScroll: true });
    getVirtualKeyboard()?.show?.();
  }, [isManualEntryOpen]);

  const openManualEntry = () => {
    isManualEntryOpenRef.current = true;
    setValue("");
    setIsManualEntryOpen(true);
  };

  const closeManualEntry = () => {
    isManualEntryOpenRef.current = false;
    setValue("");
    setIsManualEntryOpen(false);
    armScannerInput();
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = value.trim().toUpperCase();
    if (code) {
      onScan(code);
      setValue("");
    }
    if (isManualEntryOpenRef.current) {
      if (code) closeManualEntry();
      return;
    }
    focusInput();
  };

  return (
    <div className="scan-card">
      <ScannerIllus variant={scannerVariant} />
      <div className="scan-right">
        <div className="scan-headline">
          <span className="pulse" />
          {buildHeadline(hasOrder, volumeCount, boxScanCount)}
        </div>
        <form
          onSubmit={submit}
          className={isManualEntryOpen ? "scan-manual-form" : "scan-form-hidden"}
        >
          <Input
            ref={inputRef}
            className={isManualEntryOpen ? "scan-manual-input" : "scan-input-hidden"}
            aria-label="Leitor de código (NF-e ou pedido)"
            placeholder="Chave da NF-e ou número do pedido"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={scheduleRefocus}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            tabIndex={isManualEntryOpen ? 0 : -1}
          />
          {isManualEntryOpen && (
            <Button type="submit" className="btn primary" isDisabled={!value.trim()}>
              Buscar
            </Button>
          )}
        </form>
        <Button
          className="btn ghost scan-manual-toggle"
          onPress={isManualEntryOpen ? closeManualEntry : openManualEntry}
        >
          <Icon.keyboard width={14} height={14} />
          {isManualEntryOpen ? "Usar leitor" : "Digitar código"}
        </Button>
      </div>
    </div>
  );
}
