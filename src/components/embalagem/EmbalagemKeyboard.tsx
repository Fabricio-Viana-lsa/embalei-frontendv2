import { useState } from "react";
import type { ApiEmbalagem } from "@/lib/api";
import { Icon } from "@/components/icons";

interface Props {
  embalagens: ApiEmbalagem[];
  // Códigos (EAN) já adicionados, na ordem — usados para contar por embalagem.
  codes: string[];
  total: number;
  finalizing: boolean;
  onAdd: (code: string) => void;
  onRemove: (code: string) => void;
  onSetQuantity: (code: string, quantity: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

// Código usado para contar/identificar a embalagem. Embalagens sem EAN caem num
// código sintético estável por id (não casa com a tabela no relatório, mas
// mantém a contagem do volume consistente).
function embalagemCode(embalagem: ApiEmbalagem): string {
  return embalagem.eanCode ?? `#${embalagem.id}`;
}

// Teclado virtual que sobe na hora de contar os volumes: o operador toca na
// embalagem usada (pode tocar várias vezes e combinar vários tipos), com um
// contador pequeno sobre cada uma. Sem limite de volumes — o botão "Confirmar
// volumes" fica sempre disponível e a validação ocorre na finalização. O "−"
// remove uma unidade e o lápis define a quantidade exata.
export function EmbalagemKeyboard({
  embalagens,
  codes,
  total,
  finalizing,
  onAdd,
  onRemove,
  onSetQuantity,
  onConfirm,
  onClose,
}: Props) {
  const countByCode = codes.reduce<Record<string, number>>((acc, code) => {
    acc[code] = (acc[code] ?? 0) + 1;
    return acc;
  }, {});

  const [editing, setEditing] = useState<ApiEmbalagem | null>(null);
  const [qtyInput, setQtyInput] = useState("");

  const openQtyPopup = (embalagem: ApiEmbalagem, currentCount: number) => {
    setEditing(embalagem);
    setQtyInput(String(currentCount));
  };

  const closeQtyPopup = () => {
    setEditing(null);
    setQtyInput("");
  };

  const saveQty = () => {
    if (!editing) return;
    const parsed = Number.parseInt(qtyInput, 10);
    const quantity = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    onSetQuantity(embalagemCode(editing), quantity);
    closeQtyPopup();
  };

  return (
    <div className="emb-kb" role="group" aria-label="Selecionar embalagens dos volumes">
      <div className="emb-kb-head">
        <span className="emb-kb-title">Toque na embalagem usada</span>
        <span className="emb-kb-counter">
          <b>{total}</b> volume(s)
        </span>
        <button
          type="button"
          className="emb-kb-close"
          onClick={onClose}
          aria-label="Fechar teclado"
        >
          ✕
        </button>
      </div>

      {embalagens.length === 0 ? (
        <div className="emb-kb-empty">Nenhuma embalagem cadastrada</div>
      ) : (
        <div className="emb-kb-grid">
          {embalagens.map((embalagem) => {
            const code = embalagemCode(embalagem);
            const count = countByCode[code] ?? 0;
            // Mesmo no limite os tiles ficam no estado normal (mais visibilidade);
            // a adição extra é bloqueada em addEmbalagem com aviso.
            const disableAdd = finalizing;
            return (
              <div key={embalagem.id} className={"emb-tile" + (count > 0 ? " emb-tile--active" : "")}>
                <button
                  type="button"
                  className="emb-tile-add"
                  onClick={() => onAdd(code)}
                  disabled={disableAdd}
                  aria-label={`Adicionar ${embalagem.name}`}
                >
                  {count > 0 && <span className="emb-count" aria-label={`${count} adicionada(s)`}>{count}</span>}
                  <Icon.box width={20} height={20} />
                  <span className="emb-tile-name">{embalagem.name}</span>
                </button>
                {count > 0 && (
                  <button
                    type="button"
                    className="emb-remove"
                    onClick={() => onRemove(code)}
                    disabled={finalizing}
                    aria-label={`Remover ${embalagem.name}`}
                  >
                    −
                  </button>
                )}
                <button
                  type="button"
                  className="emb-edit"
                  onClick={() => openQtyPopup(embalagem, count)}
                  disabled={finalizing}
                  aria-label={`Definir quantidade de ${embalagem.name}`}
                >
                  <Icon.pencil width={11} height={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="emb-kb-foot">
        <button
          type="button"
          className="btn primary emb-confirm"
          onClick={onConfirm}
          disabled={finalizing}
        >
          <Icon.check width={16} height={16} />
          Confirmar volumes
        </button>
      </div>

      {editing && (
        <div
          className="emb-qty-scrim"
          role="dialog"
          aria-modal="true"
          aria-label={`Quantidade de ${editing.name}`}
          onClick={closeQtyPopup}
        >
          <div className="emb-qty-pop" onClick={(e) => e.stopPropagation()}>
            <div className="emb-qty-title">Quantidade · {editing.name}</div>
            <input
              className="emb-qty-input"
              type="number"
              inputMode="numeric"
              min={0}
              value={qtyInput}
              autoFocus
              onChange={(e) => setQtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveQty();
                if (e.key === "Escape") closeQtyPopup();
              }}
              aria-label={`Quantidade de ${editing.name}`}
            />
            <div className="emb-qty-actions">
              <button
                type="button"
                className="btn ghost emb-qty-cancel"
                onClick={closeQtyPopup}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn primary emb-qty-save"
                onClick={saveQty}
                disabled={finalizing}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
