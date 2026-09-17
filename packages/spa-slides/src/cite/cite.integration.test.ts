import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildFixtureDeck } from '../testing/build-fixture.js';

describe('citations in a built deck', () => {
  let browser: Browser;
  let url: string;

  beforeAll(async () => {
    url = pathToFileURL(join(await buildFixtureDeck('verify-deck'), 'dist/index.html')).href;
    browser = await chromium.launch();
  }, 180_000);

  afterAll(async () => {
    await browser?.close();
  });

  const textOn = async (slide: number, testId: string) => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`${url}#/${slide}`);
    await page.waitForSelector('.reveal.ready');
    const text = (await page.locator(`section.present [data-testid="${testId}"]`).textContent())?.replace(/\s+/g, ' ').trim();
    await page.close();
    return text;
  };

  it('renders a narrative citation', async () => {
    expect(await textOn(0, 'narrative')).toBe('After Saxe et al. (2019).');
  });

  it('renders several sources in one parenthetical', async () => {
    expect(await textOn(0, 'parenthetical')).toBe('Two sources (Saxe et al., 2019; Rogers & McClelland, 2004).');
  });

  it('shows an unknown key visibly instead of failing silently', async () => {
    expect(await textOn(5, 'missing')).toBe('As shown by [?nonexistent2020].');
  });
});
