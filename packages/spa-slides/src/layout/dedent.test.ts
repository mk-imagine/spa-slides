import { describe, expect, it } from 'vitest';
import { dedent } from './dedent.js';

describe('dedent', () => {
  it('removes shared indentation and surrounding blank lines', () => {
    expect(dedent('\n    a\n      b\n    c\n  ')).toBe('a\n  b\nc');
  });

  it('keeps interior blank lines', () => {
    expect(dedent('\n  # one\n\n  # two\n')).toBe('# one\n\n# two');
  });

  it('handles a single line', () => {
    expect(dedent('git push')).toBe('git push');
  });
});
