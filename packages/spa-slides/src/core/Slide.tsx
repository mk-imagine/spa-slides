import type { ReactNode } from 'react';
import { Slide as RevealSlide } from '@revealjs/react';
import { SpeakerNotes, type Notes } from './SpeakerNotes.js';

export interface SlideProps {
  title?: ReactNode;
  notes?: Notes;
  /** A backup slide: presented only on demand, so it is left out of the slide count. */
  appendix?: boolean;
  /** Where the body sits in the space below the title. Defaults to centered, as in Beamer. */
  align?: 'center' | 'top';
  children?: ReactNode;
}

export function Slide({ title, notes, appendix = false, align = 'center', children }: SlideProps) {
  return (
    <RevealSlide visibility={appendix ? 'uncounted' : undefined}>
      <div className="sps-frame">
        {title !== undefined && <h2 className="sps-title">{title}</h2>}
        <div className={`sps-body sps-body--${align}`}>{children}</div>
      </div>
      <SpeakerNotes notes={notes} />
    </RevealSlide>
  );
}
