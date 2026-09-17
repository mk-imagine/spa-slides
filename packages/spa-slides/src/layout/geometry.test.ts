import { describe, expect, it } from 'vitest';
import { cropGeometry } from './geometry.js';

const image = { src: 'shot.png', width: 1000, height: 500 };

describe('cropGeometry', () => {
  it('is the identity without a crop', () => {
    expect(cropGeometry(image)).toEqual({ aspectRatio: 2, imageWidthPct: 100, leftPct: -0, topPct: -0 });
  });

  it('scales and offsets the image so only the cropped region shows', () => {
    // Visible region: x 200..700 (500 wide), y 100..350 (250 tall).
    const g = cropGeometry(image, { left: 200, right: 300, top: 100, bottom: 150 });
    expect(g.aspectRatio).toBe(2);
    expect(g.imageWidthPct).toBe(200);
    expect(g.leftPct).toBe(-40);
    expect(g.topPct).toBe(-40);
  });

  it('rejects a crop that leaves nothing', () => {
    expect(() => cropGeometry(image, { left: 600, right: 400 })).toThrow(/leaves nothing/);
  });

  it('rejects negative crop values', () => {
    expect(() => cropGeometry(image, { top: -1 })).toThrow(/>= 0/);
  });
});
