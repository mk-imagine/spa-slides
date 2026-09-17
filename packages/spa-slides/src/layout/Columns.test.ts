import { describe, expect, it } from 'vitest';
import { columnTemplate } from './Columns.js';

describe('columnTemplate', () => {
  it('defaults to equal widths', () => {
    expect(columnTemplate(2)).toBe('1fr 1fr');
  });

  it('uses the given relative widths', () => {
    expect(columnTemplate(2, [54, 44])).toBe('54fr 44fr');
  });

  it('rejects a width count that does not match the children', () => {
    expect(() => columnTemplate(3, [1, 1])).toThrow(/3 children but 2 widths/);
  });
});
