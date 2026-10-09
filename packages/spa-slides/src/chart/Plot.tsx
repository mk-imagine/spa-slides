import { useId, useMemo, useRef, type ReactNode } from 'react';
import { useSlideIndex } from '../interactive/runtime.js';
import { PlotContext } from './context.js';
import { HOVER_ATTRIBUTE, type HoverMark } from './hover.js';
import { Legend, type LegendItem } from './Legend.js';
import { Readout } from './Readout.js';
import { makeScale, type AxisSpec } from './scales.js';

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PlotProps {
  /** Overall size in slide pixels, margins included. */
  width: number;
  height: number;
  x: AxisSpec;
  y: AxisSpec;
  /** Space around the data area for axes and labels. */
  margin?: Partial<Margin>;
  /** What the chart shows, for screen readers. */
  label: string;
  /**
   * The chart's identity key. Given here rather than placed after the chart, so that the two stay
   * one unit: a legend is part of its chart, and a deck that positions it by hand ends up with it
   * touching whatever follows.
   */
  legend?: LegendItem[];
  /**
   * Draws the chart only as far as this x: lines and bands up to it, and every other mark once it
   * is reached. A replay sets it from its timeline; its still leaves it out and gets the chart whole.
   */
  reveal?: number;
  /**
   * Answers the pointer with the values under it, the presenter's mirrored pointer included.
   * Default: on. Turn it off for a chart whose values are not the point, such as a schematic.
   */
  hover?: boolean;
  children: ReactNode;
}

const DEFAULT_MARGIN: Margin = { top: 24, right: 40, bottom: 88, left: 104 };

/** A chart's coordinate system. Axes and marks placed inside it share its scales. */
export function Plot({ width, height, x, y, margin, label, legend, reveal, hover = true, children }: PlotProps) {
  const m = { ...DEFAULT_MARGIN, ...margin };
  const innerWidth = width - m.left - m.right;
  const innerHeight = height - m.top - m.bottom;
  if (innerWidth <= 0 || innerHeight <= 0) {
    throw new Error(`[spa-slides] <Plot ${width}×${height}> leaves no room for data inside its margins`);
  }
  const clipId = useId();
  const svg = useRef<SVGSVGElement>(null);
  const marks = useRef(new Map<string, HoverMark>()).current;
  // Read here rather than in the readout: React attaches the svg's ref after the effects of what is
  // inside it have run, so only the plot, outside it, can see where it is.
  const slide = useSlideIndex(svg);
  const state = useMemo(
    () => ({
      x: makeScale(x, [0, innerWidth]),
      y: makeScale(y, [innerHeight, 0]),
      xType: x.type ?? 'linear',
      yType: y.type ?? 'linear',
      width: innerWidth,
      height: innerHeight,
      clipId,
      reveal,
      marks,
    }),
    [x.domain[0], x.domain[1], x.type, x.nice, y.domain[0], y.domain[1], y.type, y.nice, innerWidth, innerHeight, clipId, reveal, marks],
  );

  const plot = (
    <svg
      ref={svg}
      className="sps-plot"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      {...(hover ? { [HOVER_ATTRIBUTE]: `${m.left} ${m.top} ${innerWidth} ${innerHeight}` } : {})}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={innerWidth} height={innerHeight} />
        </clipPath>
      </defs>
      <g transform={`translate(${m.left},${m.top})`}>
        <PlotContext.Provider value={state}>
          {children}
          {/* After every mark, so it reads what each has just drawn. */}
          {hover && <Readout svg={svg} slide={slide} margin={m} width={width} height={height} legend={legend ?? []} />}
        </PlotContext.Provider>
      </g>
    </svg>
  );
  // Without a legend the chart is the svg itself, so nothing that places a bare <Plot> changes.
  if (!legend) return plot;
  return (
    <div className="sps-chart">
      {plot}
      <Legend items={legend} />
    </div>
  );
}
