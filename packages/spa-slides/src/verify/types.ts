export interface Overflow {
  /** Tag, classes, and the start of the text, e.g. `li "Every copy is a full copy."`. */
  element: string;
  /** `body` when content leaves the space under the title; `slide` when anything leaves the slide. */
  within: 'body' | 'slide';
  side: 'top' | 'bottom' | 'left' | 'right';
  /** Overshoot in slide pixels. */
  px: number;
}

export interface SlideReport {
  /** 1-based, as the audience counts. */
  slide: number;
  title: string;
  appendix: boolean;
  /** Speaker notes as plain text; empty when the slide has none. */
  notes: string;
  images: number;
  brokenImages: string[];
  placeholders: string[];
  /** The worst overflowing elements, largest first. */
  overflow: Overflow[];
  overflowCount: number;
  /** The first font family of every element that renders text. */
  fonts: string[];
}

export type CheckId =
  | 'boot'
  | 'slide-count'
  | 'overflow'
  | 'images'
  | 'placeholders'
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
