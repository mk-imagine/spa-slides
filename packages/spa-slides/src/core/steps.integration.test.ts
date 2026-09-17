import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildFixtureDeck } from '../testing/build-fixture.js';

// Slide 7 of the verify fixture has steps={2} and shows the step it reads.
const BUILDS = 6;

describe('build steps', () => {
  let browser: Browser;
  let url: string;

  beforeAll(async () => {
    url = pathToFileURL(join(await buildFixtureDeck('verify-deck'), 'dist/index.html')).href;
    browser = await chromium.launch();
  }, 180_000);

  afterAll(async () => {
    await browser?.close();
  });

  const open = async (query = '') => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`${url}${query}#/${BUILDS}`);
    await page.waitForSelector('.reveal.ready');
    return page;
  };
  const stepShown = (page: Page) => page.locator('section.present [data-testid="step"]').textContent();
  const press = async (page: Page, key: string) => {
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  };

  it('starts at step 0 and advances one step per click', async () => {
    const page = await open('?transition=none');
    expect(await stepShown(page)).toBe('0');
    await expect.poll(() => page.locator('section.present [data-testid="from-step-one"]').evaluate((el) => el.closest('.sps-step')!.getAttribute('data-shown'))).toBe('false');
    await press(page, 'ArrowRight');
    expect(await stepShown(page)).toBe('1');
    await expect.poll(() => page.locator('section.present [data-testid="from-step-one"]').evaluate((el) => el.closest('.sps-step')!.getAttribute('data-shown'))).toBe('true');
    await press(page, 'ArrowRight');
    expect(await stepShown(page)).toBe('2');
    await page.close();
  });

  it('moves to the next slide only after the last step', async () => {
    const page = await open('?transition=none');
    await press(page, 'ArrowRight');
    await press(page, 'ArrowRight');
    await press(page, 'ArrowRight');
    expect(await page.locator('section.present .sps-title').textContent()).toBe('Colliding labels');
    await page.close();
  });

  it('arrives at the last step when navigating back into the slide, then steps backwards', async () => {
    const page = await open('?transition=none');
    for (let i = 0; i < 3; i++) await press(page, 'ArrowRight');
    await press(page, 'ArrowLeft');
    expect(await stepShown(page)).toBe('2');
    await press(page, 'ArrowLeft');
    expect(await stepShown(page)).toBe('1');
    await page.close();
  });

  it('shows the last step in print', async () => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`${url}?print-pdf`);
    await page.waitForSelector('.reveal.ready');
    await expect.poll(() => page.locator('[data-testid="step"]').textContent()).toBe('2');
    await page.close();
  });
});
