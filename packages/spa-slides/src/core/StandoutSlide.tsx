import type { ReactNode } from 'react';
import { Slide as RevealSlide } from '@revealjs/react';
import { SpeakerNotes, type Notes } from './SpeakerNotes.js';

export interface StandoutSlideProps {
  notes?: Notes;
  children: ReactNode;
}

/** A full-bleed slide for the one message the audience should leave with. */
export function StandoutSlide({ notes, children }: StandoutSlideProps) {
  return (
    <RevealSlide backgroundColor="var(--sps-color-standout-bg)">
      <div className="sps-frame sps-frame--standout">{children}</div>
      <SpeakerNotes notes={notes} />
    </RevealSlide>
  );
}
