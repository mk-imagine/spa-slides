import type { ReactNode } from 'react';
import { Slide as RevealSlide } from '@revealjs/react';
import { SpeakerNotes, type Notes } from './SpeakerNotes.js';
import { StepProvider } from './steps.js';

export interface SlideProps {
  title?: ReactNode;
  notes?: Notes;
  /** A backup slide: presented only on demand, so it is left out of the slide count. */
  appendix?: boolean;
  /** Where the body sits in the space below the title. Defaults to centered, as in Beamer. */
  align?: 'center' | 'top';
  /** How many clicks the slide has. Components read the current one with `useStep()`. */
  steps?: number;
  /** A line at the foot of the slide, such as a caveat that applies to its numbers. */
  footer?: ReactNode;
  children?: ReactNode;
}

export function Slide({ title, notes, appendix = false, align = 'center', steps = 0, footer, children }: SlideProps) {
  return (
    <RevealSlide visibility={appendix ? 'uncounted' : undefined}>
      <StepProvider count={steps}>
        <div className="sps-frame">
          {title !== undefined && <h2 className="sps-title">{title}</h2>}
          <div className={`sps-body sps-body--${align}`}>{children}</div>
          {footer !== undefined && <footer className="sps-footer">{footer}</footer>}
        </div>
      </StepProvider>
      <SpeakerNotes notes={notes} />
    </RevealSlide>
  );
}
