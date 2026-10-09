import { createContext, useContext, useLayoutEffect, useMemo, useState, useSyncExternalStore, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '../core/size.js';
import { readEnvironment, type Environment } from './environment.js';
import type { PointerState, PointerStore } from './pointer.js';
import { slideIndexOf, type ToggleStore } from './toggle.js';

/**
 * What a deck shares with everything inside it: the environment it is shown in, and the state it
 * keeps in step across windows. Outside a deck there is no other window to tell, and both stores are
 * null.
 */
export interface DeckRuntime {
  environment: Environment;
  toggles: ToggleStore | null;
  pointer: PointerStore | null;
}

export const RuntimeContext = createContext<DeckRuntime | null>(null);

/** The environment the deck is being shown in, read once when the deck mounts. */
export function useEnvironment(): Environment {
  const runtime = useContext(RuntimeContext);
  return useMemo(() => runtime?.environment ?? readEnvironment(), [runtime]);
}

/** The position among the deck's slides of the slide an element is on, once it is mounted; -1 before. */
export function useSlideIndex(ref: RefObject<Element | null>): number {
  const [slide, setSlide] = useState(-1);
  useLayoutEffect(() => setSlide(ref.current ? slideIndexOf(ref.current) : -1), [ref]);
  return slide;
}

const NO_POINTER: PointerState = { local: null, remote: null };
const NOTHING = () => () => {};

/** A position on a slide, and whether it is the presenter's, mirrored from another window. */
export interface PointerOnSlide {
  x: number;
  y: number;
  mirrored: boolean;
}

/**
 * The pointer on one slide, in the slide's own 1920 × 1080 coordinates: the mouse, when it is over
 * this window, and otherwise the presenter's, mirrored from wherever it is. Anything that answers a
 * pointer should read it here rather than listen to the mouse, so that it also answers the
 * presenter's pointer on the projector. Null when no pointer is on that slide, and always null in the
 * speaker view's upcoming frame, which is not the slide being pointed at.
 */
export function usePointerOn(slide: number): PointerOnSlide | null {
  const runtime = useContext(RuntimeContext);
  const store = runtime?.pointer ?? null;
  const read = store?.getSnapshot ?? (() => NO_POINTER);
  const { local, remote } = useSyncExternalStore(store?.subscribe ?? NOTHING, read, read);
  if (slide < 0 || runtime?.environment.role === 'upcoming') return null;
  if (local !== null) return local.slide === slide ? { x: local.x, y: local.y, mirrored: false } : null;
  return remote !== null && remote.slide === slide ? { x: remote.x, y: remote.y, mirrored: true } : null;
}

/** The slide being shown in this window, by its position among the deck's slides. */
function presentSlide(): number {
  const present = document.querySelector('.reveal .slides > section.present');
  return present ? slideIndexOf(present) : -1;
}

/**
 * The presenter's pointer, drawn where it is on the slide when it comes from another window. Where
 * the mouse itself is, its cursor shows instead. The layer spans the slide box, inside Reveal's
 * scaling, so a point in slide coordinates needs no arithmetic to land in the right place.
 */
export function PointerLayer({ slides }: { slides: Element }) {
  const pointer = usePointerOn(presentSlide());
  if (pointer === null || !pointer.mirrored) return null;
  return createPortal(
    <svg className="sps-pointer-layer" width={SLIDE_WIDTH} height={SLIDE_HEIGHT} viewBox={`0 0 ${SLIDE_WIDTH} ${SLIDE_HEIGHT}`} aria-hidden="true">
      <circle className="sps-pointer" cx={pointer.x} cy={pointer.y} />
    </svg>,
    slides,
  );
}
