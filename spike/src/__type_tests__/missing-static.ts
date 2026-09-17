// Type fixture: `tsc` fails if this ever stops being an error.
import { defineInteractive } from '../lib/interactive';

export const Broken = defineInteractive<{ n: number }>(
  // @ts-expect-error — an interactive component without a Static variant must not compile.
  { name: 'broken', requires: 'single-file', Live: () => null },
);
