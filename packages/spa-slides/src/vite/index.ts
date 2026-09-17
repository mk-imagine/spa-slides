import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { bibliography } from './bibliography.js';
import { imageAssets } from './image-assets.js';

export interface SpaSlidesOptions {
  /** BibTeX files for <Cite> and <References>, relative to the deck's root. */
  bibliography?: string | string[];
}

/**
 * Everything a deck's vite.config needs:
 *
 *   export default defineConfig({ plugins: [spaSlides({ bibliography: 'references.bib' })] });
 *
 * Builds a single index.html (scripts, styles, fonts, and imported images inlined)
 * that opens straight from disk. Files in the deck's public/ folder are copied alongside it.
 */
export function spaSlides(options: SpaSlidesOptions = {}): PluginOption[] {
  const bibFiles = options.bibliography === undefined ? [] : [options.bibliography].flat();
  return [
    {
      name: 'spa-slides:config',
      // Relative URLs, so the built deck works from file:// and from any subdirectory.
      config: () => ({ base: './' }),
    },
    react(),
    imageAssets(),
    bibliography(bibFiles),
    viteSingleFile(),
  ];
}
