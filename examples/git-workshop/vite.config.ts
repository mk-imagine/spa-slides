import { defineConfig } from 'vite';
import { spaSlides } from '@mk-imagine/spa-slides/vite';

export default defineConfig({
  plugins: [spaSlides()],
});
