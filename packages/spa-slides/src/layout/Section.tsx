import type { ReactNode } from 'react';

export interface SectionProps {
  /** The section's heading. */
  title: ReactNode;
  children: ReactNode;
}

/**
 * A heading and the content it introduces, as a single unit.
 *
 * A heading belongs to what follows it, not to what precedes it, so it sits close to its own
 * content and the flow gap falls before the whole group. Without that, a heading is the same
 * distance from the list above as from its own list below, and reads as the end of the previous
 * section. Spacing comes from the container, so it holds whatever the section contains.
 */
export function Section({ title, children }: SectionProps) {
  // A <div>, not a <section>: Reveal reads every <section> inside .slides as a slide of its own,
  // so a semantic sectioning element here silently turns one slide into a stack of vertical ones.
  return (
    <div className="sps-section">
      <h3 className="sps-section__title">{title}</h3>
      {children}
    </div>
  );
}
