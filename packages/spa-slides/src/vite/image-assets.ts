import { readFileSync } from 'node:fs';
import { imageSize } from 'image-size';
import type { Plugin } from 'vite';

const QUERY = '?image';
const PREFIX = '\0spa-slides-image:';

/**
 * `import shot from './x.png?image'` resolves to `{ src, width, height }`.
 * Knowing the size at build time lets screenshots be cropped and laid out
 * before the image loads, so layout, PDF export, and overflow checks are deterministic.
 */
export function imageAssets(): Plugin {
  return {
    name: 'spa-slides:image-assets',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.endsWith(QUERY)) return null;
      const bare = source.slice(0, -QUERY.length);
      const resolved = await this.resolve(bare, importer, { skipSelf: true });
      if (!resolved) this.error(`image not found: "${bare}" (imported from ${importer ?? 'unknown'})`);
      return PREFIX + resolved.id;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return null;
      const file = id.slice(PREFIX.length);
      this.addWatchFile(file);
      const { width, height } = imageSize(readFileSync(file));
      if (!width || !height) this.error(`could not read the pixel size of ${file}`);
      return `import src from ${JSON.stringify(file)};\nexport default { src, width: ${width}, height: ${height} };\n`;
    },
  };
}
