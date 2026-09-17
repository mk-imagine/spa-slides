import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AxisX, Bar, Line, Plot } from './index.js';
import { barPath } from './marks.js';
import { makeScale } from './scales.js';

const plot = (children: React.ReactNode, props: Partial<Parameters<typeof Plot>[0]> = {}) =>
  renderToStaticMarkup(
    <Plot width={600} height={400} x={{ domain: [0, 10] }} y={{ domain: [0, 1] }} label="test chart" {...props}>
      {children}
    </Plot>,
  );

describe('makeScale', () => {
  it('spaces powers of ten evenly on a log axis', () => {
    const scale = makeScale({ domain: [1, 100], type: 'log' }, [0, 200]);
    expect(scale(10)).toBeCloseTo(100);
  });

  it('rejects a log axis that includes zero', () => {
    expect(() => makeScale({ domain: [0, 100], type: 'log' }, [0, 200])).toThrow(/positive domain/);
  });
});

describe('Line', () => {
  it('breaks the line where a value is missing', () => {
    const svg = plot(<Line series={1} data={[[0, 0.1], [1, 0.2], [2, null], [3, 0.4], [4, 0.5]]} />);
    const d = svg.match(/class="sps-line[^"]*" d="([^"]*)"/)![1]!;
    expect(d.match(/M/g)).toHaveLength(2);
  });

  it('labels the last point that has a value', () => {
    const svg = plot(<Line series={2} label="salmon" data={[[0, 0.1], [5, 0.5], [9, null]]} />);
    expect(svg).toContain('>salmon</text>');
  });

  it('rejects a series outside the eight slots', () => {
    expect(() => plot(<Line series={9} data={[[0, 0]]} />)).toThrow(/slot from 1 to 8/);
  });
});

describe('Bar', () => {
  it('rounds the data end and keeps the baseline square', () => {
    const d = barPath('horizontal', 0, 100, 50, 32);
    expect(d.startsWith('M0,34')).toBe(true);
    expect(d).toContain('Q100,34 100,38');
    expect(d.endsWith('H0 Z')).toBe(true);
  });

  it('refuses a log value axis, which has no zero to measure from', () => {
    expect(() => plot(<Bar at={0.5} value={10} />, { x: { domain: [1, 100], type: 'log' } })).toThrow(/linear value axis/);
  });

  it('places the label past the range when the range reaches further than the bar', () => {
    // x domain 0–10 over a 456px data area: the label sits 14px past x=9.5, not past x=7.
    const svg = plot(<Bar at={0.5} value={7} range={[6, 9.5]} label="7" />);
    const labelX = Number(svg.match(/class="sps-mark-label" x="([\d.]+)"/)![1]);
    expect(labelX).toBeCloseTo((9.5 / 10) * 456 + 14);
    expect(svg).toContain('class="sps-whisker"');
  });

  it('draws with its series class', () => {
    expect(plot(<Bar at={0.5} value={7} series={3} />)).toContain('class="sps-bar sps-series-3"');
  });
});

describe('positions', () => {
  it('names a value the axis cannot place instead of drawing a broken path', () => {
    expect(() => plot(<Line data={[[0, 0.5], [10, 0.5]]} />, { x: { domain: [1, 100], type: 'log' } })).toThrow(/0 cannot be placed on the x axis/);
  });
});

describe('AxisX', () => {
  it('groups thousands in tick labels', () => {
    expect(plot(<AxisX tickValues={[0, 1000, 2000]} />, { x: { domain: [0, 2000] } })).toContain('>1,000</text>');
  });
});

describe('Plot', () => {
  it('refuses margins that leave no data area', () => {
    expect(() => plot(null, { width: 100 })).toThrow(/no room for data/);
  });
});
