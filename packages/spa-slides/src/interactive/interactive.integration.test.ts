import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildFixtureDeck } from '../testing/build-fixture.js';
import { verifyDeck, type CheckId, type VerifyResult } from '../verify/index.js';

// Slide positions in the interactive fixture, counted from 0 as Reveal's URL counts them.
const PLAYHEAD = 1;
const THROWS = 3;

describe('interactive figures', () => {
  let deckDir: string;
  let url: string;
  let browser: Browser;

  beforeAll(async () => {
    deckDir = await buildFixtureDeck('interactive-deck');
    url = pathToFileURL(join(deckDir, 'dist/index.html')).href;
    browser = await chromium.launch();
  }, 180_000);

  afterAll(async () => {
    await browser?.close();
  });

  const open = async (context: BrowserContext, query = '', slide = PLAYHEAD) => {
    const page = await context.newPage();
    await page.goto(`${url}${query}#/${slide}`);
    await page.waitForSelector('.reveal.ready');
    return page;
  };

  /** What the figure on a slide is showing: `live`, or `still:` and why. */
  const rendered = (page: Page, slide = PLAYHEAD) =>
    page.evaluate((i) => {
      const figure = document.querySelectorAll('.reveal .slides > section')[i]?.querySelector('[data-sps-interactive]');
      if (!figure) return 'none';
      return figure.getAttribute('data-sps-interactive') === 'live' ? 'live' : `still:${figure.getAttribute('data-sps-still-reason')}`;
    }, slide);

  /** Presses a key while reading the playhead on every animation frame for a second. */
  const pressWatching = async (page: Page, key: string) => {
    const [seen] = await Promise.all([
      page.evaluate(
        () =>
          new Promise<number[]>((resolve) => {
            const seen: number[] = [];
            const start = performance.now();
            const frame = () => {
              seen.push(Number(document.querySelector('section.present [data-testid="position"]')?.textContent));
              if (performance.now() - start < 1000) requestAnimationFrame(frame);
              else resolve(seen);
            };
            frame();
          }),
      ),
      page.keyboard.press(key),
    ]);
    return seen;
  };

  describe('which version shows', () => {
    it('shows a presenter the live version', async () => {
      const context = await browser.newContext();
      expect(await rendered(await open(context))).toBe('live');
      await context.close();
    });

    it('shows the still under ?still, and under reduced motion', async () => {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      expect(await rendered(await open(context))).toBe('still:reduced-motion');
      expect(await rendered(await open(context, '?still'))).toBe('still:query');
      await context.close();
    });

    it('shows the still when the live version throws, and says so', async () => {
      const context = await browser.newContext();
      const page = await open(context, '', THROWS);
      expect(await rendered(page, THROWS)).toBe('still:error');
      await context.close();
    });

    it('shows the still from the first paint of a print, before Reveal marks the page as print', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${url}?print-pdf`);
      await page.waitForSelector('.pdf-page', { state: 'attached' });
      const all = await page.evaluate(() => [...document.querySelectorAll('[data-sps-interactive]')].map((el) => el.getAttribute('data-sps-still-reason')));
      expect(all).toEqual(['print', 'print', 'print', 'print']);
      await context.close();
    });
  });

  describe('the timeline', () => {
    it('glides forward one step, then holds on the keyframe', async () => {
      const context = await browser.newContext();
      const page = await open(context);
      const seen = await pressWatching(page, 'ArrowRight');
      expect(seen.some((p) => p > 0 && p < 10)).toBe(true);
      expect(seen.at(-1)).toBe(10);
      await context.close();
    });

    it('lands at once going back', async () => {
      const context = await browser.newContext();
      const page = await open(context);
      await page.keyboard.press('ArrowRight');
      await expect.poll(async () => Number(await page.locator('section.present [data-testid="position"]').textContent())).toBe(10);
      const seen = await pressWatching(page, 'ArrowLeft');
      expect(seen.filter((p) => p !== 0 && p !== 10)).toEqual([]);
      expect(seen.at(-1)).toBe(0);
      await context.close();
    });

    it('lands on every keyframe at once in the verifier’s live pass', async () => {
      const context = await browser.newContext();
      const page = await open(context, '?sps-verify=live');
      const keyframes = [0, 10, 10, 40];
      for (let step = 1; step < keyframes.length; step++) {
        const seen = await pressWatching(page, 'ArrowRight');
        expect(seen.filter((p) => p !== keyframes[step - 1] && p !== keyframes[step])).toEqual([]);
        expect(seen.at(-1)).toBe(keyframes[step]);
      }
      await context.close();
    });
  });

  describe('the key', () => {
    it('switches the slide in every window, including one opened afterwards', async () => {
      const context = await browser.newContext();
      const first = await open(context);
      const second = await open(context);
      await first.keyboard.press('t');
      await expect.poll(() => rendered(first)).toBe('still:toggle');
      await expect.poll(() => rendered(second)).toBe('still:toggle');

      const late = await open(context);
      await expect.poll(() => rendered(late)).toBe('still:toggle');

      await second.keyboard.press('t');
      for (const page of [first, second, late]) await expect.poll(() => rendered(page)).toBe('live');
      await context.close();
    });

    it('switches the audience window when pressed in the speaker view', async () => {
      const context = await browser.newContext();
      const audience = await open(context);
      const [speaker] = await Promise.all([context.waitForEvent('page'), audience.keyboard.press('s')]);
      await speaker.waitForLoadState('load');
      await expect.poll(() => speaker.frames().length).toBe(3);
      for (const frame of speaker.frames().slice(1)) await frame.waitForSelector('.reveal.ready');
      await speaker.keyboard.press('t');
      await expect.poll(() => rendered(audience)).toBe('still:toggle');
      expect(await audience.evaluate(() => location.hash)).toBe(`#/${PLAYHEAD}`);
      await context.close();
    });

    it('brings the live version up when reduced motion would show the still', async () => {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await open(context);
      await page.keyboard.press('t');
      await expect.poll(() => rendered(page)).toBe('live');
      await context.close();
    });
  });

  describe('verifyDeck', () => {
    let result: VerifyResult;
    const check = (id: CheckId) => {
      const found = result.checks.find((c) => c.id === id);
      if (!found) throw new Error(`no "${id}" check in the result`);
      return found;
    };

    beforeAll(async () => {
      result = await verifyDeck({ deckDir, expectSlides: 6 });
    }, 180_000);

    it('screenshots and prints every still', () => {
      expect(check('stills')).toMatchObject({ pass: true, detail: { figures: 4, unstill: [] } });
      expect(result.slides[PLAYHEAD]!.rendered).toEqual(['still:verify']);
    });

    it('measures the live version of each interactive slide, and screenshots every step of it', () => {
      expect(result.slides.filter((s) => s.live).map((s) => s.slide)).toEqual([2, 3, 4, 5]);
      expect(result.slides[PLAYHEAD]!.live!.rendered).toEqual(['live']);
      for (const name of ['02-live-step-0', '02-live-step-2', '02-live', '02']) {
        expect(existsSync(join(result.outDir, 'slides', `${name}.png`))).toBe(true);
      }
    });

    it('fails a live version that threw, though its still is fine', () => {
      expect(check('live')).toMatchObject({ pass: false, detail: [{ slide: 4, rendered: 'still:error' }] });
      expect(check('console').detail).toEqual(expect.arrayContaining([expect.stringContaining('fixture: the live version fails')]));
    });

    it('fails text that differs between the versions, and not a figure that does', () => {
      expect(check('prose').pass).toBe(false);
      expect(check('prose').detail).toEqual([
        expect.objectContaining({ slide: 3, still: expect.stringContaining('one thing'), live: expect.stringContaining('another') }),
      ]);
    });

    it('fails an overflow in the live version alone, and names the version', () => {
      expect(check('overflow').pass).toBe(false);
      expect(check('overflow').detail).toEqual([expect.objectContaining({ slide: 5, version: 'live' })]);
      expect(result.slides[4]!.overflowCount).toBe(0);
    });

    it('leaves a slide with nothing interactive to one pass', () => {
      expect(result.slides[5]!.live).toBeUndefined();
      expect(result.slides[5]!.rendered).toEqual([]);
    });
  });
});
