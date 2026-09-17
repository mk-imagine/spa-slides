import { beforeAll, describe, expect, it } from 'vitest';
import { buildFixtureDeck } from '../testing/build-fixture.js';
import { verifyDeck, type CheckId, type VerifyResult } from './index.js';

describe('verifyDeck on a deck with one deliberate failure per slide', () => {
  let result: VerifyResult;
  const check = (id: CheckId) => {
    const found = result.checks.find((c) => c.id === id);
    if (!found) throw new Error(`no "${id}" check in the result`);
    return found;
  };
  const slidesWhere = (failing: (s: VerifyResult['slides'][number]) => boolean) => result.slides.filter(failing).map((s) => s.slide);

  beforeAll(async () => {
    result = await verifyDeck({ deckDir: await buildFixtureDeck('verify-deck'), expectSlides: 8 });
  }, 180_000);

  it('opens the deck and counts its slides', () => {
    expect(check('boot').pass).toBe(true);
    expect(check('slide-count').pass).toBe(true);
  });

  it('flags overflow on the overfull slides only, not on a cropped screenshot', () => {
    expect(check('overflow').pass).toBe(false);
    expect(slidesWhere((s) => s.overflowCount > 0)).toEqual([3, 7]);
    expect(result.slides[2]!.overflow[0]).toMatchObject({ within: 'body', side: 'bottom', steps: [0] });
  });

  it('measures every build step, and attributes overflow to the steps it occurs in', () => {
    const builds = result.slides[6]!;
    expect(builds.steps).toBe(2);
    expect(builds.overflow.map((o) => o.steps)).toEqual(builds.overflow.map(() => [2]));
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
    expect(check('pdf-pages')).toMatchObject({ pass: true, detail: { pdfPages: 8, slides: 8 } });
  });

  it('keeps a footer on the slide without counting it as overflow', () => {
    expect(result.slides[1]!.overflowCount).toBe(0);
  });

  it('marks appendix slides', () => {
    expect(slidesWhere((s) => s.appendix)).toEqual([8]);
  });
});
