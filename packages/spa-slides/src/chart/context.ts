import { createContext, useContext } from 'react';
import type { Scale } from './scales.js';

export interface PlotState {
  x: Scale;
  y: Scale;
  xType: 'linear' | 'log';
  yType: 'linear' | 'log';
  /** Size of the data area, inside the margins. */
  width: number;
  height: number;
  /** Clip path that keeps data marks inside the data area. */
  clipId: string;
}

export const PlotContext = createContext<PlotState | null>(null);

export function usePlot(): PlotState {
  const plot = useContext(PlotContext);
  if (!plot) throw new Error('[spa-slides] chart marks must be placed inside <Plot>');
  return plot;
}

/**
 * Class that sets a mark's color: categorical slot `series` (1–8) for identity, `ordinal`
 * (1–8) for a place in an order, or a neutral tone.
 *
 * `ordinal` is one hue in even lightness steps, so the reader sees the order in the color and
 * an ordered series never borrows a categorical slot that means something else in the deck.
 * Its steps are deliberately close together, which is what makes them read as one scale, so a
 * chart using it has to carry identity some other way: an order the reader can follow along an
 * axis, or direct labels. It is the wrong choice when the reader must pick one series out of
 * eight by its color.
 */
export function markClass(series?: number, tone?: MarkTone, ordinal?: number): string {
  if (series !== undefined && ordinal !== undefined) {
    throw new Error('[spa-slides] a mark takes series or ordinal, not both');
  }
  if (ordinal !== undefined) {
    if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 8) {
      throw new Error(`[spa-slides] ordinal must be a step from 1 to 8, got ${ordinal}`);
    }
    return `sps-ordinal-${ordinal}`;
  }
  if (series !== undefined) {
    if (!Number.isInteger(series) || series < 1 || series > 8) {
      throw new Error(`[spa-slides] series must be a slot from 1 to 8, got ${series}`);
    }
    return `sps-series-${series}`;
  }
  return `sps-tone-${tone ?? 'ink'}`;
}

/** Colors for marks that are not a series: `ink` for the main mark, `muted` for context. */
export type MarkTone = 'ink' | 'muted';

/** A scaled coordinate, refusing values the axis cannot place (such as 0 on a log axis). */
export function position(scale: Scale, value: number, axis: 'x' | 'y'): number {
  const p = scale(value);
  if (!Number.isFinite(p)) {
    throw new Error(`[spa-slides] ${value} cannot be placed on the ${axis} axis (domain ${scale.domain().join('–')})`);
  }
  return p;
}
