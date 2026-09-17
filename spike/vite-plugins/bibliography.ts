import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';

export interface BibEntry {
  inline: string;
  html: string;
}

interface Options {
  file: string;
  style: string;
}

const VIRTUAL_ID = 'virtual:bibliography';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * Parses a BibTeX file at build time and exposes pre-formatted citations as
 * `virtual:bibliography`, so no citation engine ships in the deck.
 */
export function bibliography({ file, style }: Options): Plugin {
  let bibPath = '';
  return {
    name: 'spa-slides:bibliography',
    configResolved(config) {
      bibPath = resolve(config.root, file);
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      this.addWatchFile(bibPath);
      const all = new Cite(readFileSync(bibPath, 'utf8'));
      const entries: Record<string, BibEntry> = {};
      for (const item of all.data) {
        const one = new Cite(item);
        entries[item.id] = {
          inline: one.format('citation', { template: style, format: 'text', lang: 'en-US' }),
          html: one.format('bibliography', { template: style, format: 'html', lang: 'en-US' }),
        };
      }
      return `export default ${JSON.stringify(entries)};`;
    },
  };
}
