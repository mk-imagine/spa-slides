/** One bibliography entry, formatted at build time. */
export interface BibEntry {
  /** Author–year for inside parentheses, e.g. `Saxe et al., 2019`. */
  inText: string;
  /** For running text, e.g. `Saxe et al. (2019)`. */
  narrative: string;
  /** The full reference as HTML. */
  reference: string;
}

export type Bibliography = Record<string, BibEntry>;
