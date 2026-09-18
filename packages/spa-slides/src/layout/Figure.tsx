import type { ReactNode } from 'react';

export interface FigureProps {
  /** A short heading above the visual, naming what it shows. */
  label?: ReactNode;
  /** A note below the visual, at caption size. */
  caption?: ReactNode;
  /** The visual itself: a chart, a table, a diagram, and its legend. */
  children: ReactNode;
}

/**
 * One visual and the text that belongs to it, as a single unit.
 *
 * A label, a chart, its legend and a caption are one thing, so they sit close together; the gap a
 * flow puts between two figures is much larger. That contrast is what stops adjacent visuals from
 * reading as one. Spacing inside comes from the container's `gap`, so nothing is lost when a
 * caption or legend is absent, and a deck never hand-rolls the margins.
 */
export function Figure({ label, caption, children }: FigureProps) {
  return (
    <figure className="sps-figure">
      {label !== undefined && <p className="sps-figure__label">{label}</p>}
      {children}
      {caption !== undefined && <p className="sps-figure__caption">{caption}</p>}
    </figure>
  );
}
