import { describe, expect, it } from 'vitest';
import { formatBibliography } from './bibliography.js';

const bib = `
@article{one,
  author = {Rosenblatt, Frank}, title = {The perceptron}, journal = {Psychological Review}, year = {1958}
}
@book{two,
  author = {Rogers, Timothy T. and McClelland, James L.}, title = {Semantic cognition}, publisher = {MIT Press}, year = {2004}
}
@article{three,
  author = {Saxe, Andrew M. and McClelland, James L. and Ganguli, Surya}, title = {A mathematical theory}, journal = {PNAS}, year = {2019}
}`;

describe('formatBibliography', () => {
  const entries = formatBibliography([{ name: 'refs.bib', bibtex: bib }]);

  it('formats APA author–year for one, two, and three authors', () => {
    expect(entries.one!.inText).toBe('Rosenblatt, 1958');
    expect(entries.two!.inText).toBe('Rogers & McClelland, 2004');
    expect(entries.three!.inText).toBe('Saxe et al., 2019');
  });

  it('writes narrative citations with "and"', () => {
    expect(entries.one!.narrative).toBe('Rosenblatt (1958)');
    expect(entries.two!.narrative).toBe('Rogers and McClelland (2004)');
    expect(entries.three!.narrative).toBe('Saxe et al. (2019)');
  });

  it('formats the full reference', () => {
    expect(entries.two!.reference).toContain('Semantic cognition');
    expect(entries.two!.reference).toContain('MIT Press');
  });

  it('rejects a key defined in two files', () => {
    expect(() =>
      formatBibliography([
        { name: 'a.bib', bibtex: bib },
        { name: 'b.bib', bibtex: '@misc{one, title = {Again}, year = {2020}}' },
      ]),
    ).toThrow(/"one" is defined in both a.bib and b.bib/);
  });
});
