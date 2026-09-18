export interface Overflow {
  /** Tag, classes, and the start of the text, e.g. `li "Every copy is a full copy."`. */
  element: string;
  /** `body` when content leaves the space under the title; `slide` when anything leaves the slide. */
  within: 'body' | 'slide';
  side: 'top' | 'bottom' | 'left' | 'right';
  /** Overshoot in slide pixels, the largest across the steps it occurs in. */
  px: number;
  /** The build steps in which it overflows (0 is the slide on arrival). */
  steps: number[];
}

export interface LabelOverlap {
  a: string;
  b: string;
  steps: number[];
}

export interface SlideReport {
  /** 1-based, as the audience counts. */
  slide: number;
  title: string;
  appendix: boolean;
  /** How many clicks the slide has. Every step state is measured. */
  steps: number;
  /** Speaker notes as plain text; empty when the slide has none. */
  notes: string;
  images: number;
  /** Across all steps. */
  brokenImages: string[];
  /** Across all steps. */
  placeholders: string[];
  /** Citation keys that did not resolve, across all steps. */
  missingCitations: string[];
  /** Citation keys cited on this slide, across all steps. */
  citations: string[];
  /** Citation keys this slide lists in a reference list, across all steps. */
  references: string[];
  /** Pairs of chart labels whose text overlaps, with the steps they overlap in. */
  labelOverlaps: LabelOverlap[];
  /** The worst overflowing elements across all steps, largest first. */
  overflow: Overflow[];
  overflowCount: number;
  /** The first font family of every element that renders text, across all steps. */
  fonts: string[];
}

export type CheckId =
  | 'boot'
  | 'slide-count'
  | 'overflow'
  | 'images'
  | 'placeholders'
  | 'citations'
  | 'references-cited'
  | 'label-overlap'
  | 'fonts'
  | 'speaker-view'
  | 'pdf-pages'
  | 'console';

export interface Check {
  id: CheckId;
  name: string;
  pass: boolean;
  detail?: unknown;
}

export interface VerifyOptions {
  /** The deck project. Other paths resolve against it. */
  deckDir: string;
  /** The build output containing index.html. Default: `dist`. */
  distDir?: string;
  /** Where screenshots, the contact sheet, the PDF, and results.json go. Default: `report`. Emptied first. */
  outDir?: string;
  /** Fail unless the deck has exactly this many slides. */
  expectSlides?: number;
  /** Called as each check completes, for streaming output. */
  onCheck?: (check: Check) => void;
}

export interface VerifyResult {
  pass: boolean;
  checks: Check[];
  slides: SlideReport[];
  outDir: string;
}
