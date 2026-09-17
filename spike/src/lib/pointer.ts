/**
 * Maps a pointer event into the element's own unscaled CSS-pixel space.
 * Reveal scales the whole deck with a CSS transform, so `clientX - rect.left`
 * alone is off by the deck scale factor.
 */
export function localPoint(event: { clientX: number; clientY: number }, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (el.offsetWidth / rect.width),
    y: (event.clientY - rect.top) * (el.offsetHeight / rect.height),
  };
}
