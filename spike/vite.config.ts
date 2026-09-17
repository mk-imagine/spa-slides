import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { bibliography } from './vite-plugins/bibliography.ts';

export default defineConfig({
  // Relative base so the built index.html works from file:// and any subpath.
  base: './',
  plugins: [react(), viteSingleFile(), bibliography({ file: 'src/refs.bib', style: 'apa' })],
});
