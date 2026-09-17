import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { imageAssets } from './image-assets.js';

/**
 * Everything a deck's vite.config needs:
 *
 *   export default defineConfig({ plugins: [spaSlides()] });
 *
 * Builds a single index.html (scripts, styles, fonts, and imported images inlined)
 * that opens straight from disk. Files in the deck's public/ folder are copied alongside it.
 */
export function spaSlides(): PluginOption[] {
  return [
    {
      name: 'spa-slides:config',
      // Relative URLs, so the built deck works from file:// and from any subdirectory.
      config: () => ({ base: './' }),
    },
    react(),
    imageAssets(),
    viteSingleFile(),
  ];
}
