import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';

/** The class that styles.css uses to make the React root fill the viewport. */
export const ROOT_CLASS = 'sps-root';

export function mountDeck(deck: ReactElement, container: Element | string = '#root') {
  const element = typeof container === 'string' ? document.querySelector(container) : container;
  if (!element) throw new Error(`[spa-slides] mount target ${String(container)} not found`);
  element.classList.add(ROOT_CLASS);
  createRoot(element).render(<StrictMode>{deck}</StrictMode>);
}
