import type { ReactNode } from 'react';
import { Slide as RevealSlide } from '@revealjs/react';
import { useDeckMeta } from './Deck.js';
import { SpeakerNotes, type Notes } from './SpeakerNotes.js';

export interface TitleSlideProps {
  notes?: Notes;
  /** Anything extra under the byline, e.g. "Bring a laptop." */
  children?: ReactNode;
}

/** Renders the deck's metadata from <Deck meta>. */
export function TitleSlide({ notes, children }: TitleSlideProps) {
  const meta = useDeckMeta();
  return (
    <RevealSlide>
      <div className="sps-frame sps-frame--title">
        <h1 className="sps-deck-title">{meta.title}</h1>
        {meta.subtitle && <p className="sps-deck-subtitle">{meta.subtitle}</p>}
        <div className="sps-byline">
          {meta.author && <p>{meta.author}</p>}
          {meta.institute && <p>{meta.institute}</p>}
          {meta.date && <p>{meta.date}</p>}
        </div>
        {children !== undefined && <div className="sps-title-extra">{children}</div>}
      </div>
      <SpeakerNotes notes={notes} />
    </RevealSlide>
  );
}
