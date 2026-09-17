import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';
import type { Plugin } from 'vite';
import type { Bibliography } from '../cite/types.js';

export const BIBLIOGRAPHY_MODULE = 'virtual:spa-slides/bibliography';
const RESOLVED = `\0${BIBLIOGRAPHY_MODULE}`;
const STYLE = { template: 'apa', lang: 'en-US' };

/** `(Rogers & McClelland, 2004)` → `Rogers and McClelland (2004)`, as APA writes names in running text. */
function narrativeFrom(inText: string): string {
  const split = inText.lastIndexOf(', ');
  if (split < 0) return inText;
  return `${inText.slice(0, split).replace(' & ', ' and ')} (${inText.slice(split + 2)})`;
}

/** Formats BibTeX sources into entries keyed by citation key. Throws on a key defined twice. */
export function formatBibliography(sources: { name: string; bibtex: string }[]): Bibliography {
  const entries: Bibliography = {};
  const definedIn = new Map<string, string>();
  for (const { name, bibtex } of sources) {
    for (const item of new Cite(bibtex).data) {
      const earlier = definedIn.get(item.id);
      if (earlier) throw new Error(`citation key "${item.id}" is defined in both ${earlier} and ${name}`);
      definedIn.set(item.id, name);
      const one = new Cite(item);
      const inText = one.format('citation', { ...STYLE, format: 'text' }).trim().replace(/^\(|\)$/g, '');
      entries[item.id] = {
        inText,
        narrative: narrativeFrom(inText),
        reference: one.format('bibliography', { ...STYLE, format: 'html' }).trim(),
      };
    }
  }
  return entries;
}

/**
 * Serves `virtual:spa-slides/bibliography`: the deck's BibTeX files, formatted in APA style at build
 * time, so no citation engine ships in the deck. With no files it serves an empty bibliography.
 */
export function bibliography(files: string[]): Plugin {
  let root = process.cwd();
  return {
    name: 'spa-slides:bibliography',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      return id === BIBLIOGRAPHY_MODULE ? RESOLVED : null;
    },
    load(id) {
      if (id !== RESOLVED) return null;
      const sources = files.map((file) => {
        const path = resolve(root, file);
        this.addWatchFile(path);
        return { name: file, bibtex: readFileSync(path, 'utf8') };
      });
      return `export default ${JSON.stringify(formatBibliography(sources))};\n`;
    },
  };
}
