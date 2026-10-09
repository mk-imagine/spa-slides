import type { LegendItem } from './Legend.js';
import type { BandPoint, Point } from './marks.js';
import type { Scale } from './scales.js';

/**
 * Marks a chart that answers a hover, with its data area in the chart's own units: "left top width
 * height". Shared by Plot and the verifier, which hovers every chart that has it.
 */
export const HOVER_ATTRIBUTE = 'data-sps-hover';

/** What a line tells a hover readout: its data as drawn (after any reveal), and how to name it. */
export interface HoverLine {
  kind: 'line';
  name?: string;
  series?: number;
  ordinal?: number;
  tone?: 'ink' | 'muted';
  dashed: boolean;
  points: readonly Point[];
}

/** A band, which a readout reports as the range around the line of the same color. */
export interface HoverBand {
  kind: 'band';
  series?: number;
  ordinal?: number;
  tone?: 'ink' | 'muted';
  points: readonly BandPoint[];
}

/** What a bar tells a hover readout, as drawn. */
export interface HoverBar {
  kind: 'bar';
  name?: string;
  series?: number;
  ordinal?: number;
  tone?: 'ink' | 'muted';
  orientation: 'horizontal' | 'vertical';
  at: number;
  base: number;
  value: number;
  range?: [number, number];
  /** In slide pixels, across the bar. */
  thickness: number;
}

export type HoverMark = HoverLine | HoverBand | HoverBar;

/** A series' value at x, interpolated between its neighbors; null outside it or across a gap. */
export function valueAt(points: readonly Point[], x: number): number | null {
  for (let i = 0; i < points.length; i++) {
    const [px, py] = points[i]!;
    if (px === x) return py;
    if (px > x) {
      const before = points[i - 1];
      if (before === undefined || before[1] === null || py === null) return null;
      return before[1] + ((py - before[1]) * (x - before[0])) / (px - before[0]);
    }
  }
  return null;
}

/** A band's low and high edge at x, interpolated; null outside it or across a gap. */
export function rangeAt(points: readonly BandPoint[], x: number): [number, number] | null {
  const low = valueAt(points.map(([px, l]) => [px, l]), x);
  const high = valueAt(points.map(([px, , h]) => [px, h]), x);
  return low === null || high === null ? null : [low, high];
}

/**
 * A number for reading off a slide: two decimals below 10, one below 100, whole above, grouped in
 * thousands. Enough to tell values apart, never more digits than a room can take in.
 */
export function readable(value: number): string {
  const magnitude = Math.abs(value);
  const digits = magnitude < 10 ? 2 : magnitude < 100 ? 1 : 0;
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

type Identity = { series?: number; ordinal?: number; tone?: 'ink' | 'muted' };
const sameColor = (a: Identity, b: Identity) => a.series === b.series && a.ordinal === b.ordinal && (a.tone ?? 'ink') === (b.tone ?? 'ink');

/**
 * A mark's name for the readout: its own `name`, or the legend entry of its color. A dashed line
 * matched to a solid entry is told apart by saying so.
 */
export function nameOf(mark: HoverLine | HoverBar, legend: readonly LegendItem[]): string | undefined {
  if (mark.name !== undefined) return mark.name;
  const dashed = mark.kind === 'line' && mark.dashed;
  const entries = legend.filter((item) => typeof item.label === 'string' && sameColor(item, mark));
  const exact = entries.find((item) => (item.dashed ?? false) === dashed);
  if (exact) return exact.label as string;
  if (entries[0]) return `${entries[0].label as string}${dashed ? ' (dashed)' : ''}`;
  return undefined;
}

export interface LineRow {
  mark: HoverLine;
  name: string;
  value: number;
  range: [number, number] | null;
}

/**
 * What a readout lists at x: the lines with a value there, nearest to the pointer first, at most
 * `limit` of them, so a chart of many lines still answers "what is under the pointer" without
 * covering itself. Lines with no name are listed by their value alone.
 */
export function lineRows(marks: readonly HoverMark[], legend: readonly LegendItem[], x: number, pointerY: number, limit = 4): LineRow[] {
  const bands = marks.filter((m): m is HoverBand => m.kind === 'band');
  return marks
    .filter((m): m is HoverLine => m.kind === 'line')
    .flatMap((mark) => {
      const value = valueAt(mark.points, x);
      if (value === null) return [];
      const band = bands.find((b) => sameColor(b, mark));
      return [{ mark, name: nameOf(mark, legend) ?? '', value, range: band ? rangeAt(band.points, x) : null }];
    })
    .sort((a, b) => Math.abs(a.value - pointerY) - Math.abs(b.value - pointerY))
    .slice(0, limit);
}

/**
 * The bar whose row (or column) a point is in, in the plot's pixels, if any. Anywhere along it
 * counts, its labels included: pointing at a bar's value or its row's name asks about that bar.
 */
export function barAt(marks: readonly HoverMark[], x: Scale, y: Scale, point: { x: number; y: number }): HoverBar | undefined {
  return marks
    .filter((m): m is HoverBar => m.kind === 'bar')
    .find((bar) => {
      const horizontal = bar.orientation === 'horizontal';
      const center = (horizontal ? y : x)(bar.at);
      return Math.abs((horizontal ? point.y : point.x) - center) <= bar.thickness / 2;
    });
}

/** A box in a plot's own pixels, measured from the top left of its data area. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Where a readout panel of size w × h goes beside the point it reports on, kept inside `bounds`,
 * the whole chart: a chart that fits on its slide then keeps its readouts on it too. It sits to the
 * right of the point if it fits there, else to the left, else as near as the chart allows; and above
 * the point, sliding down where there is no room above.
 */
export function placePanel(at: { x: number; y: number }, w: number, h: number, bounds: Box, gap: number): { left: number; top: number } {
  const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(value, high));
  const right = at.x + gap;
  const left = right + w <= bounds.right ? right : at.x - gap - w >= bounds.left ? at.x - gap - w : clamp(right, bounds.left, bounds.right - w);
  return { left, top: clamp(at.y - gap - h, bounds.top, bounds.bottom - h) };
}
