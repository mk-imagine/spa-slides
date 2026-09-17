/**
 * Pages in a PDF, read from the file itself. Print-stylesheet clipping is invisible to DOM checks,
 * so the file is the only trustworthy source. Chromium's PDF writer does not use object streams,
 * so every page object appears as `/Type /Page` in the bytes.
 */
export function countPdfPages(pdf: Uint8Array): number {
  return (Buffer.from(pdf).toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
}
