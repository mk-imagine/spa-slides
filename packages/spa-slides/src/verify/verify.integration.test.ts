import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';
import { spaSlides } from '../vite/index.js';
import { verifyDeck, type CheckId, type VerifyResult } from './index.js';

const PACKAGE = resolve(fileURLToPath(import.meta.url), '../../..');
const FIXTURE = join(PACKAGE, 'test/fixtures/verify-deck');

describe('verifyDeck on a deck with one deliberate failure per slide', () => {
  let result: VerifyResult;
  const check = (id: CheckId) => {
    const found = result.checks.find((c) => c.id === id);
    if (!found) throw new Error(`no "${id}" check in the result`);
    return found;
  };
  const slidesWhere = (failing: (s: VerifyResult['slides'][number]) => boolean) => result.slides.filter(failing).map((s) => s.slide);

  beforeAll(async () => {
    const work = mkdtempSync(join(tmpdir(), 'spa-slides-verify-'));
    await build({
      root: FIXTURE,
      configFile: false,
      logLevel: 'warn',
      plugins: [spaSlides()],
      // Build against this package's source, not a previously built dist/.
      resolve: {
        alias: [
          { find: /^@mk-imagine\/spa-slides$/, replacement: join(PACKAGE, 'src/index.ts') },
          { find: /^@mk-imagine\/spa-slides\/styles\.css$/, replacement: join(PACKAGE, 'styles/index.css') },
        ],
      },
      build: { outDir: join(work, 'dist'), emptyOutDir: true },
    });
    result = await verifyDeck({ deckDir: work, expectSlides: 7 });
  }, 180_000);

  it('opens the deck and counts its slides', () => {
    expect(check('boot').pass).toBe(true);
    expect(check('slide-count').pass).toBe(true);
  });

  it('flags overflow on the overfull slide only, not on a cropped screenshot', () => {
    expect(check('overflow').pass).toBe(false);
    expect(slidesWhere((s) => s.overflowCount > 0)).toEqual([3]);
    expect(result.slides[2]!.overflow[0]).toMatchObject({ within: 'body', side: 'bottom' });
  });

  it('flags the placeholder', () => {
    expect(check('placeholders').pass).toBe(false);
    expect(slidesWhere((s) => s.placeholders.length > 0)).toEqual([4]);
  });

  it('flags the broken image', () => {
    expect(check('images').pass).toBe(false);
    expect(slidesWhere((s) => s.brokenImages.length > 0)).toEqual([5]);
  });

  it('flags the unbundled font by family and slide', () => {
    expect(check('fonts').pass).toBe(false);
    expect(check('fonts').detail).toEqual([{ family: 'Georgia', slides: [6] }]);
  });

  it('reports console errors', () => {
    expect(check('console').pass).toBe(false);
    expect(check('console').detail).toEqual(expect.arrayContaining([expect.stringContaining('fixture console error')]));
  });

  it('finds the notes in the speaker view', () => {
    expect(check('speaker-view').pass).toBe(true);
  });

  it('exports a PDF with one page per slide', () => {
    expect(check('pdf-pages')).toMatchObject({ pass: true, detail: { pdfPages: 7, slides: 7 } });
  });

  it('marks appendix slides', () => {
    expect(slidesWhere((s) => s.appendix)).toEqual([7]);
  });
});
