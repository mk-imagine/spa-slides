import { describe, expect, it } from 'vitest';
import { mergeStepReports } from './merge.js';
import type { SlideReport } from './types.js';

const base: SlideReport = {
  slide: 4,
  title: 'Builds',
  appendix: false,
  steps: 2,
  notes: '',
  images: 0,
  brokenImages: [],
  placeholders: [],
  missingCitations: [],
  labelOverlaps: [],
  overflow: [],
  overflowCount: 0,
  fonts: [],
};

describe('mergeStepReports', () => {
  it('lists an element once, with every step it overflows in and its worst overshoot', () => {
    const merged = mergeStepReports([
      { ...base, overflow: [] },
      { ...base, overflow: [{ element: 'ul', within: 'body', side: 'bottom', px: 12, steps: [1] }] },
      { ...base, overflow: [{ element: 'ul', within: 'body', side: 'bottom', px: 40, steps: [2] }] },
    ]);
    expect(merged.overflow).toEqual([{ element: 'ul', within: 'body', side: 'bottom', px: 40, steps: [1, 2] }]);
    expect(merged.overflowCount).toBe(1);
  });

  it('unions fonts, images, and placeholders across steps', () => {
    const merged = mergeStepReports([
      { ...base, fonts: ['Inter Variable'], images: 1 },
      { ...base, fonts: ['Inter Variable', 'Georgia'], placeholders: ['later capture'], images: 2 },
    ]);
    expect(merged.fonts).toEqual(['Georgia', 'Inter Variable']);
    expect(merged.placeholders).toEqual(['later capture']);
    expect(merged.images).toBe(2);
  });
});
