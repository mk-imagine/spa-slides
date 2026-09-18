import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Deck as RevealDeck } from '@revealjs/react';
import RevealNotes from 'reveal.js/plugin/notes';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from './size.js';

export { SLIDE_HEIGHT, SLIDE_WIDTH } from './size.js';

export interface DeckMeta {
  title: string;
  subtitle?: string;
  author?: string;
  institute?: string;
  /** Written out rather than computed: the day the talk is given, not the day it was built. */
  date?: string;
}

export type Transition = 'none' | 'fade' | 'slide';

export interface DeckProps {
  meta: DeckMeta;
  transition?: Transition;
  slideNumbers?: boolean;
  /**
   * Reveal's on-screen back and forward arrows. Default: true. A presenter driving from a clicker
   * or the arrow keys never uses them, and the audience sees them on every slide, so a deck being
   * projected can turn them off and leave the slide face to its content.
   */
  controls?: boolean;
  children: ReactNode;
}

const PLUGINS = [RevealNotes];

/** Set on <html> when the deck hides Reveal's nav arrows, so the slide number can take the corner. */
export const NO_CONTROLS_CLASS = 'sps-no-controls';

const DeckMetaContext = createContext<DeckMeta | null>(null);

export function useDeckMeta(): DeckMeta {
  const meta = useContext(DeckMetaContext);
  if (!meta) throw new Error('[spa-slides] useDeckMeta() must be called inside <Deck>');
  return meta;
}

export function Deck({ meta, transition = 'fade', slideNumbers = true, controls = true, children }: DeckProps) {
  useEffect(() => {
    document.title = meta.title;
  }, [meta.title]);

  // The slide number is offset to clear the nav arrows. With the arrows off there is nothing to
  // clear, and Reveal leaves their box behind at zero size, so the stylesheet cannot tell on its
  // own; this says which case the deck is in.
  useEffect(() => {
    document.documentElement.classList.toggle(NO_CONTROLS_CLASS, !controls);
    return () => document.documentElement.classList.remove(NO_CONTROLS_CLASS);
  }, [controls]);

  return (
    <DeckMetaContext.Provider value={meta}>
      <RevealDeck
        config={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          margin: 0.04,
          // Slides own their vertical layout (title pinned to the top), so Reveal must not center them.
          center: false,
          hash: true,
          controls,
          progress: true,
          slideNumber: slideNumbers ? 'c/t' : false,
          transition,
          pdfSeparateFragments: false,
          // One page per slide. An overfull slide is a layout bug for the verifier to catch, not extra pages.
          pdfMaxPagesPerSlide: 1,
        }}
        plugins={PLUGINS}
      >
        {children}
      </RevealDeck>
    </DeckMetaContext.Provider>
  );
}
