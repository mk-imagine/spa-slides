import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AxisX, Band, Bar, Line, Marker, Playhead, Plot, Rule, Span } from './index.js';
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

describe('Band', () => {
  it('draws the high edge forward and the low edge back, closed', () => {
    const svg = plot(<Band series={1} data={[[0, 0.2, 0.4], [10, 0.3, 0.6]]} />);
    const d = svg.match(/class="sps-band[^"]*" d="([^"]*)"/)![1]!;
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.split('L')).toHaveLength(4);
  });

  it('draws nothing when fewer than two points have both edges', () => {
    expect(plot(<Band series={1} data={[[0, 0.2, 0.4], [10, null, null]]} />)).not.toContain('sps-band');
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

describe('Span', () => {
  it('draws a horizontal band across the data area', () => {
    // y domain 0–1 over a 288px data area: 0.9–1 is the top 28.8px.
    const svg = plot(<Span y0={0.9} y1={1} />);
    const rect = svg.match(/<rect class="sps-span[^"]*" x="([\d.]+)" width="([\d.]+)" y="([\d.]+)" height="([\d.]+)"/)!;
    expect(rect.slice(1).map(Number)).toEqual([0, 456, 0, expect.closeTo(28.8, 6)]);
  });
});

describe('Marker', () => {
  it('can be drawn hollow', () => {
    expect(plot(<Marker x={1} y={0.5} series={2} hollow />)).toContain('class="sps-marker sps-series-2 sps-marker--hollow"');
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

describe('a revealed chart', () => {
  // x domain 0–10 over a 456px data area, so the reveal at 5 sits at 228px.
  // null: no reveal at all, which is what a still gets.
  const revealed = (children: React.ReactNode, reveal: number | null = 5) => plot(children, { reveal: reveal ?? undefined });
  const lineEnd = (svg: string) => Number(svg.match(/class="sps-line[^"]*" d="[^"]*L([\d.]+),[\d.]+"/)![1]);

  it('draws a line only as far as the reveal, ending exactly there', () => {
    expect(lineEnd(revealed(<Line data={[[0, 0], [10, 1]]} />))).toBeCloseTo(228);
  });

  it('draws a line whole when told to, as for a prediction made in advance', () => {
    expect(lineEnd(revealed(<Line whole data={[[0, 0], [10, 1]]} />))).toBeCloseTo(456);
  });

  it('draws everything when there is no reveal, which is what a still gets', () => {
    expect(lineEnd(revealed(<Line data={[[0, 0], [10, 1]]} />, null))).toBeCloseTo(456);
  });

  it('cuts a band at the reveal, both edges together', () => {
    const d = revealed(<Band series={1} data={[[0, 0.2, 0.4], [10, 0.3, 0.6]]} />).match(/class="sps-band[^"]*" d="([^"]*)"/)![1]!;
    expect(Math.max(...d.split(/[ML]/).filter(Boolean).map((p) => Number(p.split(',')[0])))).toBeCloseTo(228);
  });

  it('shows a marker, and a rule at an x, once the reveal reaches them', () => {
    expect(revealed(<Marker x={7} y={0.5} />)).not.toContain('sps-marker');
    expect(revealed(<Marker x={7} y={0.5} />, 7)).toContain('sps-marker');
    expect(revealed(<Rule x={7} label="arrives" />)).not.toContain('arrives');
    expect(revealed(<Rule y={0.3} label="criterion" />)).toContain('criterion');
  });

  it('grows a vertical span with the reveal, and labels it once it is whole', () => {
    const span = <Span x0={2} x1={8} label="run" />;
    const width = (svg: string) => Number(svg.match(/<rect class="sps-span[^"]*" x="[\d.]+" width="([\d.]+)"/)![1]);
    expect(width(revealed(span))).toBeCloseTo(((5 - 2) / 10) * 456);
    expect(revealed(span)).not.toContain('>run<');
    expect(revealed(span, 9)).toContain('>run<');
    expect(revealed(<Span x0={6} x1={8} />)).not.toContain('sps-span');
  });

  it('grows a bar with the reveal, and adds its whisker and label once it is whole', () => {
    const bar = <Bar at={0.5} value={8} range={[6, 9]} label="median 8" />;
    expect(revealed(bar)).not.toContain('sps-whisker');
    expect(revealed(bar)).not.toContain('>median 8<');
    expect(revealed(bar, 9)).toContain('sps-whisker');
    expect(revealed(bar, 9)).toContain('>median 8<');
  });

  it('shows the playhead while the chart fills in, and not once it is whole', () => {
    expect(revealed(<Playhead />)).toContain('sps-playhead');
    expect(revealed(<Playhead />, 10)).not.toContain('sps-playhead');
    expect(revealed(<Playhead />, null)).not.toContain('sps-playhead');
  });

  it('puts the playhead\'s label on whichever side has room', () => {
    expect(revealed(<Playhead label="12 in a row" />, 2)).toMatch(/text-anchor="start"[^>]*>12 in a row/);
    expect(revealed(<Playhead label="47 in a row" />, 8)).toMatch(/text-anchor="end"[^>]*>47 in a row/);
  });
});
