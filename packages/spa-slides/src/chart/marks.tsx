import type { ReactNode } from 'react';
import { line as d3line } from 'd3-shape';
import { markClass, position, usePlot, type MarkTone } from './context.js';

/** Where a label sits relative to its anchor point. */
export type LabelPosition = 'right' | 'left' | 'above' | 'below';

const LABEL_GAP = 14;

function labelPlacement(position: LabelPosition) {
  switch (position) {
    case 'right':
      return { dx: LABEL_GAP, dy: 0, textAnchor: 'start' as const, dominantBaseline: 'middle' as const };
    case 'left':
      return { dx: -LABEL_GAP, dy: 0, textAnchor: 'end' as const, dominantBaseline: 'middle' as const };
    case 'above':
      return { dx: 0, dy: -LABEL_GAP, textAnchor: 'middle' as const, dominantBaseline: 'auto' as const };
    case 'below':
      return { dx: 0, dy: LABEL_GAP, textAnchor: 'middle' as const, dominantBaseline: 'hanging' as const };
  }
}

interface MarkLabelProps {
  x: number;
  y: number;
  position: LabelPosition;
  /** Nudge in slide pixels, to separate labels that would collide. */
  offset?: [number, number];
  children: ReactNode;
}

/** Label text, in text colours: identity comes from the mark it sits beside, never the text colour. */
function MarkLabel({ x, y, position, offset = [0, 0], children }: MarkLabelProps) {
  const { dx, dy, textAnchor, dominantBaseline } = labelPlacement(position);
  return (
    <text className="sps-mark-label" x={x + dx + offset[0]} y={y + dy + offset[1]} textAnchor={textAnchor} dominantBaseline={dominantBaseline}>
      {children}
    </text>
  );
}

/** A data point; `null` leaves a gap in a line. */
export type Point = [x: number, y: number | null];

export interface LineProps {
  data: Point[];
  /** Categorical slot, 1–8. */
  series?: number;
  tone?: MarkTone;
  /** For predictions and theory curves, not for gridlines. */
  dashed?: boolean;
  /** Direct label at the last point with a value. */
  label?: ReactNode;
  labelPosition?: LabelPosition;
  labelOffset?: [number, number];
}

export function Line({ data, series, tone, dashed = false, label, labelPosition = 'right', labelOffset }: LineProps) {
  const { x, y, clipId } = usePlot();
  const path = d3line<Point>()
    .defined((p) => p[1] !== null && Number.isFinite(p[1]))
    .x((p) => position(x, p[0], 'x'))
    .y((p) => position(y, p[1] as number, 'y'))(data);
  const last = [...data].reverse().find((p) => p[1] !== null && Number.isFinite(p[1]));
  const classes = ['sps-line', markClass(series, tone), dashed ? 'sps-line--dashed' : ''].filter(Boolean).join(' ');
  return (
    <g>
      <path className={classes} d={path ?? ''} clipPath={`url(#${clipId})`} />
      {label !== undefined && last && (
        <MarkLabel x={x(last[0])} y={y(last[1] as number)} position={labelPosition} offset={labelOffset}>
          {label}
        </MarkLabel>
      )}
    </g>
  );
}

export interface RuleProps {
  /** A horizontal rule at this y value. */
  y?: number;
  /** A vertical rule at this x value. */
  x?: number;
  /** Placed beside the line, never across it: above the right end of a horizontal rule, right of the top of a vertical one. */
  label?: ReactNode;
  dashed?: boolean;
}

/** A reference line across the data area, such as a threshold or an event. */
export function Rule({ x: xValue, y: yValue, label, dashed = false }: RuleProps) {
  const { x, y, width, height } = usePlot();
  if ((xValue === undefined) === (yValue === undefined)) {
    throw new Error('[spa-slides] <Rule> needs exactly one of x or y');
  }
  const className = `sps-rule${dashed ? ' sps-rule--dashed' : ''}`;
  if (yValue !== undefined) {
    const py = position(y, yValue, 'y');
    return (
      <g>
        <line className={className} x1={0} x2={width} y1={py} y2={py} />
        {label !== undefined && (
          <text className="sps-mark-label" x={width} y={py - LABEL_GAP / 2} textAnchor="end" dominantBaseline="auto">
            {label}
          </text>
        )}
      </g>
    );
  }
  const px = position(x, xValue as number, 'x');
  return (
    <g>
      <line className={className} x1={px} x2={px} y1={0} y2={height} />
      {label !== undefined && (
        <text className="sps-mark-label" x={px + LABEL_GAP / 2} y={0} textAnchor="start" dominantBaseline="hanging">
          {label}
        </text>
      )}
    </g>
  );
}

export type SpanProps = {
  series?: number;
  tone?: MarkTone;
  label?: ReactNode;
} & (
  | { /** A vertical band between these x values. */ x0: number; x1: number; y0?: never; y1?: never }
  | { /** A horizontal band between these y values. */ y0: number; y1: number; x0?: never; x1?: never }
);

/** A shaded interval: a vertical band (x0–x1) such as a qualifying run, or a horizontal one (y0–y1) such as a range of values. */
export function Span({ series, tone = 'muted', label, ...band }: SpanProps) {
  const { x, y, width, height, clipId } = usePlot();
  const className = `sps-span ${markClass(series, series === undefined ? tone : undefined)}`;
  if (band.x0 !== undefined) {
    const left = Math.min(position(x, band.x0, 'x'), position(x, band.x1, 'x'));
    const right = Math.max(position(x, band.x0, 'x'), position(x, band.x1, 'x'));
    return (
      <g>
        <rect className={className} x={left} width={right - left} y={0} height={height} clipPath={`url(#${clipId})`} />
        {label !== undefined && (
          <MarkLabel x={(left + right) / 2} y={0} position="below">
            {label}
          </MarkLabel>
        )}
      </g>
    );
  }
  const top = Math.min(position(y, band.y0, 'y'), position(y, band.y1, 'y'));
  const bottom = Math.max(position(y, band.y0, 'y'), position(y, band.y1, 'y'));
  return (
    <g>
      <rect className={className} x={0} width={width} y={top} height={bottom - top} clipPath={`url(#${clipId})`} />
      {label !== undefined && (
        <text className="sps-mark-label" x={LABEL_GAP / 2} y={(top + bottom) / 2} dominantBaseline="middle">
          {label}
        </text>
      )}
    </g>
  );
}

export interface MarkerProps {
  x: number;
  y: number;
  series?: number;
  tone?: MarkTone;
  label?: ReactNode;
  labelPosition?: LabelPosition;
  labelOffset?: [number, number];
  /** An outline instead of a filled dot, as a second encoding (for example, "lost strength first"). */
  hollow?: boolean;
}

/** A point mark with a ring in the surface colour, so it stays legible on top of lines. */
export function Marker({ x: xValue, y: yValue, series, tone, label, labelPosition = 'above', labelOffset, hollow = false }: MarkerProps) {
  const { x, y } = usePlot();
  const px = position(x, xValue, 'x');
  const py = position(y, yValue, 'y');
  return (
    <g>
      <circle className={`sps-marker ${markClass(series, tone)}${hollow ? ' sps-marker--hollow' : ''}`} cx={px} cy={py} />
      {label !== undefined && (
        <MarkLabel x={px} y={py} position={labelPosition} offset={labelOffset}>
          {label}
        </MarkLabel>
      )}
    </g>
  );
}

const BAR_RADIUS = 4;

/** Path for a bar with a rounded data end and a square end on its baseline. */
export function barPath(orientation: 'horizontal' | 'vertical', base: number, end: number, center: number, thickness: number): string {
  const half = thickness / 2;
  const length = Math.abs(end - base);
  const r = Math.min(BAR_RADIUS, half, length);
  const dir = end >= base ? 1 : -1;
  if (orientation === 'horizontal') {
    const top = center - half;
    const bottom = center + half;
    return `M${base},${top} H${end - dir * r} Q${end},${top} ${end},${top + r} V${bottom - r} Q${end},${bottom} ${end - dir * r},${bottom} H${base} Z`;
  }
  const left = center - half;
  const right = center + half;
  return `M${left},${base} V${end + dir * r} Q${left},${end} ${left + r},${end} H${right - r} Q${right},${end} ${right},${end + dir * r} V${base} Z`;
}

export interface BarProps {
  orientation?: 'horizontal' | 'vertical';
  /** Position across the bar (y for horizontal bars, x for vertical), in data units. */
  at: number;
  /** Data value the bar grows to. */
  value: number;
  /** Data value of the baseline. Default 0. */
  base?: number;
  /** Bar thickness in slide pixels. */
  thickness?: number;
  series?: number;
  tone?: MarkTone;
  /** A range around the value, such as min–max over runs, drawn as a whisker. */
  range?: [low: number, high: number];
  /** Direct label, placed past the end of the bar or its range, whichever reaches further. */
  label?: ReactNode;
}

/** A bar from a baseline to a value, with an optional range whisker and a direct label past its end. */
export function Bar({ orientation = 'horizontal', at, value, base = 0, thickness = 32, series, tone, range, label }: BarProps) {
  const { x, y, xType, yType } = usePlot();
  const horizontal = orientation === 'horizontal';
  if ((horizontal ? xType : yType) === 'log') {
    // A bar's length is read from zero, and a log axis has no zero.
    throw new Error('[spa-slides] <Bar> needs a linear value axis; on a log axis, use <Marker> as a dot plot');
  }
  const valueAxis = horizontal ? 'x' : 'y';
  const crossAxis = horizontal ? 'y' : 'x';
  const valueScale = horizontal ? x : y;
  const crossScale = horizontal ? y : x;
  const d = barPath(orientation, position(valueScale, base, valueAxis), position(valueScale, value, valueAxis), position(crossScale, at, crossAxis), thickness);
  const grows = value >= base;
  const reach = range ? (grows ? Math.max(value, range[1]) : Math.min(value, range[0])) : value;
  const endX = horizontal ? valueScale(reach) : crossScale(at);
  const endY = horizontal ? crossScale(at) : valueScale(reach);
  return (
    <g>
      <path className={`sps-bar ${markClass(series, tone)}`} d={d} />
      {range && <Whisker orientation={orientation} at={at} low={range[0]} high={range[1]} cap={thickness * 0.6} />}
      {label !== undefined && (
        <MarkLabel x={endX} y={endY} position={horizontal ? (grows ? 'right' : 'left') : grows ? 'above' : 'below'}>
          {label}
        </MarkLabel>
      )}
    </g>
  );
}

export interface WhiskerProps {
  orientation?: 'horizontal' | 'vertical';
  /** Position across the whisker, in data units. */
  at: number;
  low: number;
  high: number;
  /** Length of the end caps in slide pixels. */
  cap?: number;
}

/** A range (such as min–max over runs) drawn over its bar. */
export function Whisker({ orientation = 'horizontal', at, low, high, cap = 16 }: WhiskerProps) {
  const { x, y } = usePlot();
  if (orientation === 'horizontal') {
    const py = y(at);
    const [a, b] = [x(low), x(high)];
    return (
      <g className="sps-whisker">
        <line x1={a} x2={b} y1={py} y2={py} />
        <line x1={a} x2={a} y1={py - cap / 2} y2={py + cap / 2} />
        <line x1={b} x2={b} y1={py - cap / 2} y2={py + cap / 2} />
      </g>
    );
  }
  const px = x(at);
  const [a, b] = [y(low), y(high)];
  return (
    <g className="sps-whisker">
      <line x1={px} x2={px} y1={a} y2={b} />
      <line x1={px - cap / 2} x2={px + cap / 2} y1={a} y2={a} />
      <line x1={px - cap / 2} x2={px + cap / 2} y1={b} y2={b} />
    </g>
  );
}
