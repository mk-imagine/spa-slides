import type { Overflow, SlideReport } from './types.js';

const MAX_REPORTED_OVERFLOWS = 5;

/**
 * Combines one slide's measurements at each build step into a single report. An element that
 * overflows in several steps is listed once, with every step it overflows in and its worst overshoot.
 */
export function mergeStepReports(reports: SlideReport[]): SlideReport {
  const final = reports.at(-1);
  if (!final) throw new Error('mergeStepReports needs at least one report');

  const overflow = new Map<string, Overflow>();
  for (const report of reports) {
    for (const o of report.overflow) {
      const key = `${o.element}|${o.within}|${o.side}`;
      const seen = overflow.get(key);
      overflow.set(
        key,
        seen ? { ...seen, px: Math.max(seen.px, o.px), steps: [...new Set([...seen.steps, ...o.steps])].sort((a, b) => a - b) } : o,
      );
    }
  }
  const merged = [...overflow.values()].sort((a, b) => b.px - a.px);

  const overlaps = new Map<string, SlideReport['labelOverlaps'][number]>();
  for (const report of reports) {
    for (const o of report.labelOverlaps) {
      const key = `${o.a}|${o.b}`;
      const seen = overlaps.get(key);
      overlaps.set(key, seen ? { ...seen, steps: [...new Set([...seen.steps, ...o.steps])].sort((a, b) => a - b) } : o);
    }
  }
  const union = (pick: (r: SlideReport) => string[]) => [...new Set(reports.flatMap(pick))].sort();

  return {
    ...final,
    images: Math.max(...reports.map((r) => r.images)),
    brokenImages: union((r) => r.brokenImages),
    placeholders: union((r) => r.placeholders),
    missingCitations: union((r) => r.missingCitations),
    citations: union((r) => r.citations),
    references: union((r) => r.references),
    overflow: merged.slice(0, MAX_REPORTED_OVERFLOWS),
    overflowCount: merged.length,
    fonts: union((r) => r.fonts),
    labelOverlaps: [...overlaps.values()],
  };
}
