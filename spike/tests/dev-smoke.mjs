// Dev-server smoke test: StrictMode double-mounts effects, which the production build never exercises.
import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/');
await page.waitForSelector('.reveal.ready', { timeout: 20000 });
const decks = await page.locator('.reveal').count();
const slides = await page.locator('.reveal .slides > section').count();
await page.evaluate(() => (location.hash = '#/3'));
await new Promise((r) => setTimeout(r, 1500));
const t1 = await page.evaluate(() => window.__spikeMetrics?.simTicks ?? 0);
await new Promise((r) => setTimeout(r, 1000));
const t2 = await page.evaluate(() => window.__spikeMetrics?.simTicks ?? 0);
console.log(JSON.stringify({ decks, slides, simTicksPerSecond: t2 - t1, errors }, null, 2));
await browser.close();
process.exit(decks === 1 && slides === 6 && t2 - t1 > 20 && t2 - t1 < 90 && errors.length === 0 ? 0 : 1);
