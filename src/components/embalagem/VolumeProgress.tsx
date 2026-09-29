interface Props {
  scannedCount: number;
  totalVolumes: number;
}

// Feedback visual da bipagem de volumes durante a embalagem. Mostra um grid
// com um cartão por volume esperado; o último bipado pulsa por ~600ms para
// chamar atenção. Quando o operador bipa volumes além do esperado, eles
// aparecem ao final com aviso "extra".
export function VolumeProgress({ scannedCount, totalVolumes }: Props) {
  const expected = Math.max(totalVolumes, 1);
  const totalSlots = Math.max(scannedCount, expected);
  const complete = scannedCount >= expected;

  return (
    <div className="vol-progress" role="status" aria-live="polite">
      <div className="vol-progress-head">
        <div className="vol-progress-counter">
          <span className="vol-progress-current">{scannedCount}</span>
          <span className="vol-progress-sep">/</span>
          <span className="vol-progress-total">{expected}</span>
        </div>
        <div className="vol-progress-label">
          {complete ? (
            <>
              <span className="vol-progress-status vol-progress-status--ok">
                Volumes bipados
              </span>
              <span className="vol-progress-hint">
                Bipe a NF-e ou o pedido para finalizar
              </span>
            </>
          ) : (
            <>
              <span className="vol-progress-status">Bipando volumes</span>
              <span className="vol-progress-hint">
                Faltam {expected - scannedCount} de {expected}
              </span>
            </>
          )}
        </div>
      </div>

      <div
        className="vol-progress-grid"
        style={{
          gridTemplateColumns: `repeat(${Math.min(totalSlots, 10)}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: totalSlots }).map((_, index) => {
          const position = index + 1;
          const isScanned = position <= scannedCount;
          const isLast = position === scannedCount;
          const isExtra = position > expected;
          return (
            <div
              key={`${position}-${isScanned}`}
              className={
                "vol-slot" +
                (isScanned ? " vol-slot--scanned" : "") +
                (isLast ? " vol-slot--pulse" : "") +
                (isExtra ? " vol-slot--extra" : "")
              }
            >
              <span className="vol-slot-num">{String(position).padStart(2, "0")}</span>
              {isScanned ? (
                <svg
                  className="vol-slot-check"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="vol-slot-dot" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
