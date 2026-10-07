// Regras de foco/toque compartilhadas pela estação (leitor de código e
// bloqueio de zoom).

// Campos onde o operador digita: quando um deles está em uso, o leitor de
// código não pode roubar o foco (senão o teclado do celular fecha).
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

// Elementos que respondem a toque: nunca podem ter o toque cancelado.
const INTERACTIVE_SELECTOR = `button, a, label, [role="button"], ${EDITABLE_SELECTOR}`;

function asElement(target: EventTarget | null): Element | null {
  return target instanceof Element ? target : null;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  return Boolean(asElement(target)?.closest(EDITABLE_SELECTOR));
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return Boolean(asElement(target)?.closest(INTERACTIVE_SELECTOR));
}

/** Outro campo de texto (que não `ownField`) está com o foco agora. */
export function isOtherFieldFocused(ownField: HTMLElement): boolean {
  const active = document.activeElement;
  return active !== ownField && isEditableTarget(active);
}
