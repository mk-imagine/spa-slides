import { useEffect, useRef, useState } from 'react';
import { useReveal } from '@revealjs/react';
import type { RevealApi } from 'reveal.js';

/**
 * live    – the audience window
 * print   – ?print-pdf / view=print, used for PDF export
 * preview – the current/upcoming iframes inside the speaker view
 */
export type DeckMode = 'live' | 'print' | 'preview';

/**
 * Resolved synchronously from the URL so components render the right variant on
 * first paint, before Reveal finishes its async initialize (print layout is computed
 * during initialize, so switching variants afterwards would break pagination).
 * Mirrors Reveal's own checks; `assertDeckMode` verifies they agree once Reveal is ready.
 */
export function detectDeckMode(search = window.location.search): DeckMode {
  if (/receiver/i.test(search)) return 'preview';
  if (/print-pdf/i.test(search) || /[?&]view=print\b/i.test(search)) return 'print';
  return 'live';
}

export function assertDeckMode(deck: RevealApi) {
  const mode = detectDeckMode();
  const revealMode: DeckMode = deck.isSpeakerNotes() ? 'preview' : deck.isPrintView() ? 'print' : 'live';
  if (mode !== revealMode) {
    console.error(`[spa-slides] deck mode mismatch: URL says "${mode}", Reveal says "${revealMode}"`);
  }
}

export function useDeckMode(): DeckMode {
  const [mode] = useState(detectDeckMode);
  return mode;
}

const ACTIVITY_EVENTS = ['slidechanged', 'overviewshown', 'overviewhidden', 'paused', 'resumed'];

/**
 * True while the slide containing `ref` is the one the audience is looking at.
 * Reveal keeps every slide mounted, so anything that animates must gate on this.
 */
export function useSlideActive<T extends HTMLElement>() {
  // @revealjs/react 0.2.2 ships a broken type path for useReveal's return type.
  const deck = useReveal() as RevealApi | null;
  const ref = useRef<T>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!deck) return;
    const update = () => {
      const section = ref.current?.closest('section') ?? null;
      setActive(section !== null && deck.getCurrentSlide() === section && !deck.isOverview() && !deck.isPaused());
    };
    update();
    ACTIVITY_EVENTS.forEach((name) => deck.on(name, update));
    return () => ACTIVITY_EVENTS.forEach((name) => deck.off(name, update));
  }, [deck]);

  return [active, ref] as const;
}
