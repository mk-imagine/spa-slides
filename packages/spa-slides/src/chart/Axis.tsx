import { usePlot } from './context.js';
import { formatNumber } from './scales.js';

export interface AxisProps {
  /** Axis title. */
  label?: string;
  /** Roughly how many ticks. Ignored when `tickValues` is given. */
  ticks?: number;
  tickValues?: number[];
  format?: (value: number) => string;
  /** Hairline gridlines across the data area at each tick. */
  grid?: boolean;
}

const TICK_GAP = 14;

export function AxisX({ label, ticks = 5, tickValues, format = formatNumber, grid = false }: AxisProps) {
  const { x, width, height } = usePlot();
  const values = tickValues ?? x.ticks(ticks);
  return (
    <g className="sps-axis sps-axis--x" transform={`translate(0,${height})`}>
      {grid && values.map((v) => <line key={`g${v}`} className="sps-grid" x1={x(v)} x2={x(v)} y1={0} y2={-height} />)}
      <line className="sps-axis-line" x1={0} x2={width} />
      {values.map((v) => (
        <text key={v} className="sps-tick" x={x(v)} y={TICK_GAP} dominantBaseline="hanging" textAnchor="middle">
          {format(v)}
        </text>
      ))}
      {label && (
        <text className="sps-axis-label" x={width / 2} y={TICK_GAP + 44} dominantBaseline="hanging" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

export function AxisY({ label, ticks = 5, tickValues, format = formatNumber, grid = false }: AxisProps) {
  const { y, width, height } = usePlot();
  const values = tickValues ?? y.ticks(ticks);
  return (
    <g className="sps-axis sps-axis--y">
      {grid && values.map((v) => <line key={`g${v}`} className="sps-grid" x1={0} x2={width} y1={y(v)} y2={y(v)} />)}
      <line className="sps-axis-line" y1={0} y2={height} />
      {values.map((v) => (
        <text key={v} className="sps-tick" x={-TICK_GAP} y={y(v)} dominantBaseline="middle" textAnchor="end">
          {format(v)}
        </text>
      ))}
      {label && (
        <text
          className="sps-axis-label"
          transform={`translate(${-TICK_GAP - 72},${height / 2}) rotate(-90)`}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </g>
  );
}
