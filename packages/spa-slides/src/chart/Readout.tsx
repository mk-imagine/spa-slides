import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { usePointerOn, type PointerOnSlide } from '../interactive/runtime.js';
import { markClass, usePlot } from './context.js';
import { barAt, lineRows, nameOf, readable } from './hover.js';
import type { LegendItem } from './Legend.js';
import type { Margin } from './Plot.js';

const PAD = 12;
const LINE = 32;
const KEY = 28;
/** A first guess at the width of a character of chart text, until the rendered text is measured. */
const CHAR = 13;
const GAP = 20;

/**
 * Where a point on the slide falls in a plot's data area, in the plot's own pixels. The plot's box
 * is read in slide coordinates, the same in every window, so the presenter's mirrored pointer lands
 * on the same data as the mouse that sent it.
 */
function inPlot(svg: SVGSVGElement, pointer: PointerOnSlide, width: number, margin: Margin): { x: number; y: number } | null {
  const slides = document.querySelector<HTMLElement>('.reveal .slides');
  const box = svg.getBoundingClientRect();
  if (!slides || slides.offsetWidth === 0 || box.width === 0) return null;
  const frame = slides.getBoundingClientRect();
  const scale = frame.width / slides.offsetWidth;
  // Slide pixels to the svg's own units, should anything have resized it.
  const units = width / (box.width / scale);
  return {
    x: (pointer.x - (box.left - frame.left) / scale) * units - margin.left,
    y: (pointer.y - (box.top - frame.top) / scale) * units - margin.top,
  };
}

interface Row {
  key?: string;
  text: string;
}

/** A panel of rows beside a point, on whichever side has room, and kept inside the data area. */
function Panel({ at, rows, width, height }: { at: { x: number; y: number }; rows: Row[]; width: number; height: number }) {
  const texts = useRef<SVGGElement>(null);
  const guess = Math.max(...rows.map((r) => r.text.length * CHAR + (r.key ? KEY : 0)));
  const [measured, setMeasured] = useState<number | null>(null);
  // The text's real width, before the panel is painted, so it fits its text exactly.
  useLayoutEffect(() => {
    const lines = [...(texts.current?.querySelectorAll('text') ?? [])];
    if (lines.length === 0 || typeof lines[0]!.getComputedTextLength !== 'function') return;
    setMeasured(Math.max(...lines.map((t) => t.getComputedTextLength() + Number(t.getAttribute('x') ?? 0))));
  }, [rows.map((r) => r.text).join('\n')]);
  const w = PAD * 2 + (measured ?? guess);
  const h = PAD * 2 + rows.length * LINE;
  const left = at.x > width / 2 ? at.x - GAP - w : at.x + GAP;
  const top = Math.min(Math.max(at.y - h - GAP, 0), Math.max(height - h, 0));
  return (
    <g transform={`translate(${left},${top})`}>
      <rect className="sps-hover__panel" width={w} height={h} rx={6} />
      <g ref={texts}>
        {rows.map((row, i) => (
          <g key={i} transform={`translate(${PAD},${PAD + i * LINE + LINE / 2})`}>
            {row.key !== undefined && <line className={`sps-hover__key ${row.key}`} x1={0} x2={KEY - 8} y1={0} y2={0} />}
            <text className={`sps-hover__text${i === 0 ? ' sps-hover__head' : ''}`} x={row.key !== undefined ? KEY : 0} dominantBaseline="middle">
              {row.text}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
}

/**
 * A chart's answer to the pointer: the values under it. On a bar, its value and range; elsewhere,
 * a line across at the pointer's x with the values there of the lines nearest the pointer. It reads
 * the deck's pointer, not the mouse, so the presenter hovering in the speaker view shows the same
 * readout on the projector. Every mark reports what it has drawn, so a chart needs nothing added.
 */
export function Readout({ svg, slide, margin, width, legend }: { svg: RefObject<SVGSVGElement | null>; slide: number; margin: Margin; width: number; legend: readonly LegendItem[] }) {
  const plot = usePlot();
  const pointer = usePointerOn(slide);
  if (pointer === null || svg.current === null) return null;
  const at = inPlot(svg.current, pointer, width, margin);
  if (at === null) return null;
  const marks = [...plot.marks.values()];
  // A bar answers anywhere in its row within the chart, labels included; lines only inside the data.
  const inChart = at.x >= -margin.left && at.x <= width - margin.left && at.y >= -margin.top && at.y <= plot.height + margin.bottom;
  const inData = at.x >= 0 && at.y >= 0 && at.x <= plot.width && at.y <= plot.height;

  const bar = inChart ? barAt(marks, plot.x, plot.y, at) : undefined;
  if (bar) {
    const name = nameOf(bar, legend);
    const value = `${readable(bar.value)}${bar.range ? ` (${readable(bar.range[0])}–${readable(bar.range[1])})` : ''}`;
    return (
      <g className="sps-hover">
        <Panel at={at} width={plot.width} height={plot.height} rows={name === undefined ? [{ text: value }] : [{ text: name }, { text: value }]} />
      </g>
    );
  }

  if (!inData) return null;
  const x = plot.x.invert(at.x);
  // The lines nearest the pointer, listed top to bottom as they are drawn.
  const rows = lineRows(marks, legend, x, plot.y.invert(at.y)).sort((a, b) => b.value - a.value);
  if (rows.length === 0) return null;
  return (
    <g className="sps-hover">
      <line className="sps-hover__rule" x1={at.x} x2={at.x} y1={0} y2={plot.height} />
      {rows.map((row, i) => (
        <circle key={i} className={`sps-hover__dot ${markClass(row.mark.series, row.mark.tone, row.mark.ordinal)}`} cx={at.x} cy={plot.y(row.value)} />
      ))}
      <Panel
        at={at}
        width={plot.width}
        height={plot.height}
        rows={[
          { text: readable(x) },
          ...rows.map((row) => ({
            key: markClass(row.mark.series, row.mark.tone, row.mark.ordinal) + (row.mark.dashed ? ' sps-hover__key--dashed' : ''),
            text: `${row.name ? `${row.name}: ` : ''}${readable(row.value)}${row.range ? ` (${readable(row.range[0])}–${readable(row.range[1])})` : ''}`,
          })),
        ]}
      />
    </g>
  );
}
