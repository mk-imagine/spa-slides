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

/** Class that sets a mark's colour from categorical slot `series` (1–8), or a neutral tone. */
export function markClass(series?: number, tone?: MarkTone): string {
  if (series !== undefined) {
    if (!Number.isInteger(series) || series < 1 || series > 8) {
      throw new Error(`[spa-slides] series must be a slot from 1 to 8, got ${series}`);
    }
    return `sps-series-${series}`;
  }
  return `sps-tone-${tone ?? 'ink'}`;
}

/** Colours for marks that are not a series: `ink` for the main mark, `muted` for context. */
export type MarkTone = 'ink' | 'muted';

/** A scaled coordinate, refusing values the axis cannot place (such as 0 on a log axis). */
export function position(scale: Scale, value: number, axis: 'x' | 'y'): number {
  const p = scale(value);
  if (!Number.isFinite(p)) {
    throw new Error(`[spa-slides] ${value} cannot be placed on the ${axis} axis (domain ${scale.domain().join('–')})`);
  }
  return p;
}
