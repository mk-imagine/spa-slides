import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Deck as RevealDeck } from '@revealjs/react';
import RevealNotes from 'reveal.js/plugin/notes';

/** Logical slide size. Everything is laid out at this size and scaled to the screen. */
export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;

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
  children: ReactNode;
}

const PLUGINS = [RevealNotes];

const DeckMetaContext = createContext<DeckMeta | null>(null);

export function useDeckMeta(): DeckMeta {
  const meta = useContext(DeckMetaContext);
  if (!meta) throw new Error('[spa-slides] useDeckMeta() must be called inside <Deck>');
  return meta;
}

export function Deck({ meta, transition = 'fade', slideNumbers = true, children }: DeckProps) {
  useEffect(() => {
    document.title = meta.title;
  }, [meta.title]);

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
          controls: true,
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
