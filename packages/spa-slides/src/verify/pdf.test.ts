import { describe, expect, it } from 'vitest';
import { countPdfPages } from './pdf.js';

const pdf = (text: string) => new TextEncoder().encode(text);

describe('countPdfPages', () => {
  it('counts page objects but not the page tree', () => {
    expect(countPdfPages(pdf('<< /Type /Pages /Count 2 >> << /Type /Page >> << /Type/Page /Parent 1 0 R >>'))).toBe(2);
  });

  it('does not count other types that start with Page', () => {
    expect(countPdfPages(pdf('<< /Type /PageLabel >>'))).toBe(0);
  });
});
