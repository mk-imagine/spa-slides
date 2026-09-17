import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { spaSlides } from '../vite/index.js';

const PACKAGE = resolve(fileURLToPath(import.meta.url), '../../..');

/**
 * Builds a fixture deck from test/fixtures/<name> against this package's source (not a
 * previously built dist/) and returns the directory holding dist/.
 */
export async function buildFixtureDeck(name: string): Promise<string> {
  const deckDir = mkdtempSync(join(tmpdir(), `spa-slides-${name}-`));
  const root = join(PACKAGE, 'test/fixtures', name);
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [spaSlides({ bibliography: existsSync(join(root, 'references.bib')) ? 'references.bib' : [] })],
    resolve: {
      alias: [
        { find: /^@mk-imagine\/spa-slides$/, replacement: join(PACKAGE, 'src/index.ts') },
        { find: /^@mk-imagine\/spa-slides\/chart$/, replacement: join(PACKAGE, 'src/chart/index.ts') },
        { find: /^@mk-imagine\/spa-slides\/styles\.css$/, replacement: join(PACKAGE, 'styles/index.css') },
      ],
    },
    build: { outDir: join(deckDir, 'dist'), emptyOutDir: true },
  });
  return deckDir;
}
