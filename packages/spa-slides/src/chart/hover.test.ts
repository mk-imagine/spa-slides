import { describe, expect, it } from 'vitest';
import { barAt, lineRows, nameOf, placePanel, rangeAt, readable, valueAt, type HoverMark } from './hover.js';
import { makeScale } from './scales.js';

describe('valueAt', () => {
  const series: [number, number | null][] = [
    [0, 0],
    [10, 1],
    [20, null],
    [30, 3],
  ];

  it('interpolates between neighbors, and is exact on a point', () => {
    expect(valueAt(series, 5)).toBe(0.5);
    expect(valueAt(series, 10)).toBe(1);
  });

  it('has nothing to say outside the series or across a gap', () => {
    expect(valueAt(series, -1)).toBeNull();
    expect(valueAt(series, 15)).toBeNull();
    expect(valueAt(series, 40)).toBeNull();
  });

  it('reads a band as its two edges', () => {
    expect(rangeAt([[0, 0, 2], [10, 1, 3]], 5)).toEqual([0.5, 2.5]);
  });
});

describe('readable', () => {
  it('keeps two decimals below 10, one below 100, none above, and groups thousands', () => {
    expect(readable(0.4567)).toBe('0.46');
    expect(readable(23.45)).toBe('23.5');
    expect(readable(12345.6)).toBe('12,346');
  });
});

describe('nameOf', () => {
  const legend = [
    { label: 'observed', ordinal: 3 },
    { label: 'salmon', series: 8 },
  ];

  it('prefers the mark\'s own name, then its legend entry', () => {
    expect(nameOf({ kind: 'line', name: 'mine', series: 8, dashed: false, points: [] }, legend)).toBe('mine');
    expect(nameOf({ kind: 'line', series: 8, dashed: false, points: [] }, legend)).toBe('salmon');
    expect(nameOf({ kind: 'line', series: 2, dashed: false, points: [] }, legend)).toBeUndefined();
  });

  it('tells a dashed line from the solid one its legend entry is for', () => {
    expect(nameOf({ kind: 'line', ordinal: 3, dashed: true, points: [] }, legend)).toBe('observed (dashed)');
  });
});

describe('lineRows', () => {
  const line = (series: number, value: number): HoverMark => ({ kind: 'line', series, dashed: false, points: [[0, value], [10, value]] });

  it('lists the lines nearest the pointer first, no more than the limit', () => {
    const marks = [line(1, 0.1), line(2, 0.5), line(3, 0.9), line(4, 0.45)];
    expect(lineRows(marks, [], 5, 0.5, 2).map((r) => r.mark.series)).toEqual([2, 4]);
  });

  it('reports the band of the same color as the line\'s range', () => {
    const marks: HoverMark[] = [line(1, 0.5), { kind: 'band', series: 1, points: [[0, 0.4, 0.6], [10, 0.4, 0.6]] }];
    expect(lineRows(marks, [], 5, 0.5)[0]!.range).toEqual([0.4, 0.6]);
  });

  it('leaves out a line with no value at the pointer, as one not yet revealed', () => {
    const marks: HoverMark[] = [{ kind: 'line', series: 1, dashed: false, points: [[0, 0.1], [3, 0.2]] }];
    expect(lineRows(marks, [], 5, 0.5)).toEqual([]);
  });
});

describe('barAt', () => {
  // x: 0–10 over 100px; y: rows 0–2 over 200px.
  const x = makeScale({ domain: [0, 10] }, [0, 100]);
  const y = makeScale({ domain: [0, 2] }, [0, 200]);
  const bar: HoverMark = { kind: 'bar', name: 'first', orientation: 'horizontal', at: 1, base: 0, value: 6, range: [5, 8], thickness: 20 };

  it('finds the bar anywhere along its row, its labels included', () => {
    expect(barAt([bar], x, y, { x: 30, y: 105 })).toBe(bar);
    expect(barAt([bar], x, y, { x: 99, y: 100 })).toBe(bar);
    expect(barAt([bar], x, y, { x: -40, y: 95 })).toBe(bar);
  });

  it('finds nothing between rows', () => {
    expect(barAt([bar], x, y, { x: 30, y: 140 })).toBeUndefined();
  });
});

describe('placePanel', () => {
  // What can be seen: 400 wide and 300 tall, starting 100 left of the data area and 20 above it.
  const seen = { left: -100, top: -20, right: 300, bottom: 280 };
  const covers = (p: { left: number; top: number }, w: number, h: number, at: { x: number; y: number }) =>
    at.x >= p.left && at.x <= p.left + w && at.y >= p.top && at.y <= p.top + h;

  it('sits right of the point and above it when there is room', () => {
    expect(placePanel({ x: 50, y: 200 }, 100, 60, seen, 10)).toEqual({ left: 60, top: 130 });
  });

  it('goes left when the right would leave what can be seen, however near the middle the point is', () => {
    expect(placePanel({ x: 150, y: 200 }, 200, 60, seen, 10)).toEqual({ left: -60, top: 130 });
  });

  it('beside the point, slides down when there is no room above', () => {
    expect(placePanel({ x: 50, y: 0 }, 100, 60, seen, 10).top).toBe(-20);
  });

  it('with no room on either side, goes above the point, centered on it', () => {
    expect(placePanel({ x: 100, y: 200 }, 380, 60, seen, 10)).toEqual({ left: -90, top: 130 });
  });

  it('with no room on either side or above, goes below rather than over the point', () => {
    const at = { x: 100, y: 40 };
    const placed = placePanel(at, 380, 120, seen, 10);
    expect(placed.top).toBe(50);
    expect(covers(placed, 380, 120, at)).toBe(false);
  });

  it('covers the point only when it fits nowhere, starting at the top so its first rows read', () => {
    expect(placePanel({ x: 100, y: 140 }, 380, 200, seen, 10)).toEqual({ left: -90, top: -20 });
  });
});
