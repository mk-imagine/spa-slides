import type { Page } from 'playwright';
import { HOVER_ATTRIBUTE } from '../chart/hover.js';
import type { HoverProblem, HoverReport } from './types.js';

/** Where in its data area each chart is hovered: the corners, the middle of each edge, and the center. */
const GRID = [0.03, 0.5, 0.97];

interface Target {
  /** In the window, for the mouse. */
  x: number;
  y: number;
  /** For the report: which chart (its position on the slide, and its label), and where in its data area. */
  n: number;
  chart: string;
  where: string;
}

/**
 * The points to hover on one slide. Every chart that answers a hover is visited at the corners,
 * edges and center of its data area, where a readout is likeliest to run out of room, and along
 * every bar's row at both ends, since a bar answers anywhere in its row. Runs in the page.
 */
function targets({ index, attribute, grid }: { index: number; attribute: string; grid: number[] }): Target[] {
  const section = document.querySelectorAll('.reveal .slides > section')[index];
  if (!section) return [];
  const out: Target[] = [];
  for (const [n, svg] of [...section.querySelectorAll<SVGSVGElement>(`svg[${attribute}]`)].entries()) {
    const box = svg.getBoundingClientRect();
    if (box.width === 0 || getComputedStyle(svg).visibility === 'hidden') continue;
    const [left, top, width, height] = (svg.getAttribute(attribute) ?? '').split(' ').map(Number) as [number, number, number, number];
    const units = box.width / svg.viewBox.baseVal.width;
    const at = (fx: number, fy: number) => [box.left + (left + fx * width) * units, box.top + (top + fy * height) * units] as const;
    const chart = svg.getAttribute('aria-label') ?? '';
    for (const fy of grid) {
      for (const fx of grid) {
        const [x, y] = at(fx, fy);
        out.push({ x, y, n, chart, where: `${Math.round(fx * 100)}% across, ${Math.round(fy * 100)}% down` });
      }
    }
    const rows = new Set<number>();
    for (const bar of svg.querySelectorAll('path.sps-bar')) {
      const b = bar.getBoundingClientRect();
      const y = Math.round(b.top + b.height / 2);
      if (b.height === 0 || rows.has(y)) continue;
      rows.add(y);
      for (const fx of [grid[0]!, grid.at(-1)!]) out.push({ x: at(fx, 0)[0], y, n, chart, where: `bar row at ${Math.round(fx * 100)}% across` });
    }
  }
  return out;
}

/**
 * Every readout on the slide, measured: how far it is cut off by anything that clips it, or runs
 * past the slide; whether it covers the point it reports on, which is where the pointer is; and
 * whether its text reads. Runs in the page, so it takes what it needs as arguments.
 */
function inspect({ index, tolerance, point }: { index: number; tolerance: number; point: { x: number; y: number } }) {
  const section = document.querySelectorAll<HTMLElement>('.reveal .slides > section')[index]!;
  const slides = document.querySelector<HTMLElement>('.reveal .slides')!;
  const frame = slides.getBoundingClientRect();
  const scale = frame.width / slides.offsetWidth;
  const found: { kind: 'clipped' | 'off the slide' | 'unreadable' | 'covers the point'; detail: string }[] = [];
  const panels = [...section.querySelectorAll('.sps-hover__panel')];
  for (const panel of panels) {
    const box = panel.getBoundingClientRect();
    const text = [...(panel.parentElement?.querySelectorAll('text') ?? [])].map((t) => t.textContent ?? '').join(' / ');
    if (/NaN|undefined|Infinity/.test(text)) found.push({ kind: 'unreadable', detail: text });
    if (point.x > box.left && point.x < box.right && point.y > box.top && point.y < box.bottom) found.push({ kind: 'covers the point', detail: text });
    // The slide's edges, then every box between the panel and the slide that clips what is in it.
    const limits: { kind: 'clipped' | 'off the slide'; box: DOMRect }[] = [{ kind: 'off the slide', box: frame }];
    for (let a = panel.parentElement; a && a !== section; a = a.parentElement) {
      const style = getComputedStyle(a);
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible') limits.push({ kind: 'clipped', box: a.getBoundingClientRect() });
    }
    for (const { kind, box: limit } of limits) {
      const sides = { top: limit.top - box.top, bottom: box.bottom - limit.bottom, left: limit.left - box.left, right: box.right - limit.right };
      const [side, px] = Object.entries(sides).sort((a, b) => b[1] - a[1])[0]!;
      if (px / scale > tolerance) found.push({ kind, detail: `${Math.round(px / scale)}px past the ${side}: ${text}` });
    }
  }
  return { readouts: panels.length, found };
}

/** Two animation frames: the pointer is read once a frame, and the readout drawn in the frame after. */
const settle = (page: Page) => page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));

/**
 * Hovers every chart on the slide being shown, and measures each readout it gets. A readout appears
 * only under a pointer, so without this the screenshots and every other check would never see one.
 * Leaves the mouse off the slide, and checks no readout stays behind there.
 */
export async function exerciseHover(page: Page, index: number, tolerance: number): Promise<HoverReport | undefined> {
  const points = await page.evaluate(targets, { index, attribute: HOVER_ATTRIBUTE, grid: GRID });
  if (points.length === 0) return undefined;
  const problems: HoverProblem[] = [];
  let readouts = 0;
  for (const point of points) {
    await page.mouse.move(point.x, point.y);
    await settle(page);
    const seen = await page.evaluate(inspect, { index, tolerance, point: { x: point.x, y: point.y } });
    readouts += seen.readouts;
    for (const f of seen.found) problems.push({ chart: point.chart, where: point.where, problem: f.kind, detail: f.detail });
  }
  // Off the slide entirely: the viewport is the slide's size, and Reveal leaves a margin round it.
  await page.mouse.move(0, 0);
  await settle(page);
  const left = await page.evaluate((i) => document.querySelectorAll('.reveal .slides > section')[i]!.querySelectorAll('.sps-hover').length, index);
  if (left > 0) problems.push({ chart: '', where: 'pointer off the slide', problem: 'stays', detail: `${left} readout${left === 1 ? '' : 's'} still showing` });
  return { charts: new Set(points.map((p) => p.n)).size, points: points.length, readouts, problems };
}
