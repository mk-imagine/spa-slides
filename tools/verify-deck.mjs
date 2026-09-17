// Verifies a built deck the way an audience would see it: opened from disk in Chromium.
//
//   node tools/verify-deck.mjs <deck-dir> [--expect-slides N]
//
// Reads <deck-dir>/dist/index.html. Writes screenshots, a contact sheet, the PDF, and
// results.json to <deck-dir>/report/. Exits non-zero if any check fails.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const deckDir = args.find((a) => !a.startsWith('--'));
if (!deckDir) {
  console.error('usage: node tools/verify-deck.mjs <deck-dir> [--expect-slides N]');
  process.exit(2);
}
const expectIndex = args.indexOf('--expect-slides');
const expectedSlides = expectIndex >= 0 ? Number(args[expectIndex + 1]) : undefined;

const DIST = pathToFileURL(resolve(deckDir, 'dist/index.html')).href;
const OUT = resolve(deckDir, 'report');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/slides`, { recursive: true });

const BUNDLED_FONTS = ['Inter Variable', 'JetBrains Mono Variable'];
/** Overshoot below this many slide pixels is sub-pixel rounding, not a layout bug. */
const TOLERANCE_PX = 1.5;

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
  const suffix = detail === undefined ? '' : `\n      ${JSON.stringify(detail)}`;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${suffix}`);
}

const consoleLog = [];
function watchConsole(page, label) {
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleLog.push(`[${label}] ${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => consoleLog.push(`[${label}] pageerror: ${e.message}`));
}

const browser = await chromium.launch();

// ---------------------------------------------------------------------------- live
const live = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await live.newPage();
watchConsole(page, 'live');
await page.goto(`${DIST}?transition=none&backgroundTransition=none`);
await page.waitForSelector('.reveal.ready', { timeout: 20000 });

const slideCount = await page.locator('.reveal .slides > section').count();
check('deck boots from file://', slideCount > 0, { slides: slideCount });
if (expectedSlides !== undefined) {
  check(`deck has ${expectedSlides} slides`, slideCount === expectedSlides, { slides: slideCount });
}

const perSlide = [];
for (let i = 0; i < slideCount; i++) {
  await page.evaluate((index) => (location.hash = `#/${index}`), i);
  await page.waitForFunction(
    (index) => document.querySelectorAll('.reveal .slides > section')[index]?.classList.contains('present'),
    i,
  );
  const report = await page.evaluate(async ({ index, tolerance }) => {
    const section = document.querySelectorAll('.reveal .slides > section')[index];
    const images = [...section.querySelectorAll('img')];
    const broken = [];
    await Promise.all(images.map((img) => img.decode().catch(() => broken.push(img.currentSrc.slice(0, 80)))));
    await document.fonts.ready;

    const slides = document.querySelector('.reveal .slides');
    const frame = slides.getBoundingClientRect();
    const scale = frame.width / slides.offsetWidth;
    const body = section.querySelector('.sps-body');

    // An element's visible box: its own box, clipped by every ancestor that clips overflow.
    const visibleBox = (el) => {
      const r = el.getBoundingClientRect();
      const box = { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      for (let a = el.parentElement; a && a !== section; a = a.parentElement) {
        const style = getComputedStyle(a);
        if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
        const ar = a.getBoundingClientRect();
        box.top = Math.max(box.top, ar.top);
        box.bottom = Math.min(box.bottom, ar.bottom);
        box.left = Math.max(box.left, ar.left);
        box.right = Math.min(box.right, ar.right);
      }
      return box;
    };
    const describe = (el) => {
      const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return `${el.tagName.toLowerCase()}${cls}${text ? ` "${text}"` : ''}`;
    };

    const overflow = [];
    for (const el of section.querySelectorAll('*')) {
      if (el.closest('aside.notes')) continue;
      const own = el.getBoundingClientRect();
      if (own.width === 0 && own.height === 0) continue;
      const box = visibleBox(el);
      if (box.right <= box.left || box.bottom <= box.top) continue;
      // Body content must stay inside the body, so it can neither leave the slide nor run into the title.
      const inBody = body && body !== el && body.contains(el);
      const bounds = inBody ? body.getBoundingClientRect() : frame;
      const sides = {
        top: (bounds.top - box.top) / scale,
        bottom: (box.bottom - bounds.bottom) / scale,
        left: (bounds.left - box.left) / scale,
        right: (box.right - bounds.right) / scale,
      };
      const [side, px] = Object.entries(sides).sort((a, b) => b[1] - a[1])[0];
      if (px > tolerance) overflow.push({ element: describe(el), within: inBody ? 'body' : 'slide', side, px: Math.round(px) });
    }
    overflow.sort((a, b) => b.px - a.px);

    return {
      slide: index + 1,
      title: (section.querySelector('.sps-title, .sps-deck-title')?.textContent ?? '').trim(),
      appendix: section.getAttribute('data-visibility') === 'uncounted',
      notes: section.querySelectorAll('aside.notes li').length || (section.querySelector('aside.notes') ? 1 : 0),
      images: images.length,
      broken,
      placeholders: [...section.querySelectorAll('[data-placeholder]')].map((el) => el.getAttribute('data-placeholder')),
      overflow: overflow.slice(0, 5),
      overflowCount: overflow.length,
    };
  }, { index: i, tolerance: TOLERANCE_PX });
  await page.screenshot({ path: `${OUT}/slides/${String(i + 1).padStart(2, '0')}.png` });
  perSlide.push(report);
}

const overflowing = perSlide.filter((s) => s.overflowCount > 0);
check(
  'no slide overflows',
  overflowing.length === 0,
  overflowing.map(({ slide, title, overflow }) => ({ slide, title, worst: overflow })),
);

const broken = perSlide.filter((s) => s.broken.length > 0);
check('every image loads', broken.length === 0, broken.map(({ slide, broken: b }) => ({ slide, broken: b })));

const placeholders = perSlide.filter((s) => s.placeholders.length > 0);
check('no screenshot placeholders left', placeholders.length === 0, placeholders.map(({ slide, placeholders: p }) => ({ slide, p })));

const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
const missingFonts = BUNDLED_FONTS.filter((family) => !fonts.some((f) => f.replace(/"/g, '') === family));
check('bundled fonts load offline', missingFonts.length === 0, missingFonts.length ? { missing: missingFonts } : undefined);

// ---------------------------------------------------------------------------- speaker notes
const [speaker] = await Promise.all([live.waitForEvent('page'), page.keyboard.press('s')]);
watchConsole(speaker, 'speaker');
await speaker.waitForSelector('.speaker-controls-notes', { timeout: 15000 });
await speaker.waitForTimeout(2500);
const lastWithNotes = perSlide.findLast((s) => s.notes > 0);
const speakerNotes = ((await speaker.locator('.speaker-controls-notes').textContent()) ?? '').trim();
check('speaker view opens from file://', speakerNotes.length > 0 || !lastWithNotes, { notes: speakerNotes.slice(0, 60) });
await speaker.close();

// ---------------------------------------------------------------------------- PDF
const printContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const printPage = await printContext.newPage();
watchConsole(printPage, 'print');
await printPage.goto(`${DIST}?print-pdf`);
await printPage.waitForSelector('.reveal.ready', { timeout: 20000 });
await printPage.waitForFunction((n) => document.querySelectorAll('.pdf-page').length === n, slideCount);
await printPage.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.decode().catch(() => null)));
});
await printPage.pdf({ path: `${OUT}/deck.pdf`, preferCSSPageSize: true, printBackground: true });
await printContext.close();
// Count pages in the file itself: print-stylesheet clipping is invisible to DOM checks.
const pdfPages = (readFileSync(`${OUT}/deck.pdf`, 'latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
check('PDF has one page per slide', pdfPages === slideCount, { pdfPages, slides: slideCount });

// ---------------------------------------------------------------------------- contact sheet
const sheet = await browser.newPage({ viewport: { width: 2000, height: 1000 } });
const tiles = perSlide
  .map((s) => {
    const png = readFileSync(`${OUT}/slides/${String(s.slide).padStart(2, '0')}.png`).toString('base64');
    const flags = [s.appendix ? 'appendix' : '', s.overflowCount ? 'OVERFLOW' : ''].filter(Boolean).join(' · ');
    return `<figure class="${s.overflowCount ? 'bad' : ''}"><img src="data:image/png;base64,${png}"><figcaption>${s.slide}. ${s.title || '(untitled)'}${flags ? ` — ${flags}` : ''}</figcaption></figure>`;
  })
  .join('');
await sheet.setContent(
  `<style>body{margin:16px;font:14px system-ui;background:#e9ecef;display:grid;grid-template-columns:repeat(5,384px);gap:16px}
   figure{margin:0}img{width:384px;height:216px;display:block;background:#fff;outline:1px solid #ccd}
   figcaption{padding:4px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bad img{outline:4px solid #d00}</style>${tiles}`,
);
await sheet.screenshot({ path: `${OUT}/contact-sheet.png`, fullPage: true });

await live.close();
await browser.close();

check('no console errors or warnings', consoleLog.length === 0, consoleLog.length ? consoleLog : undefined);

writeFileSync(`${OUT}/results.json`, JSON.stringify({ checks: results, slides: perSlide }, null, 2));
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed · report: ${OUT}`);
process.exit(failed.length ? 1 : 0);
