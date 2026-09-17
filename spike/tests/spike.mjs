// Spike verification: drives the built single-file deck from file:// in headless Chromium.
// Run inside the container: ./run.sh node tests/spike.mjs
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = pathToFileURL(resolve('dist/index.html')).href;
const OUT = resolve('report');
mkdirSync(`${OUT}/slides`, { recursive: true });

const SLIDES = { title: 0, math: 1, video: 2, sim: 3, overflow: 4, refs: 5 };
const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? `\n      ${JSON.stringify(detail)}` : ''}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function watchConsole(page, label, sink) {
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') sink.push(`[${label}] ${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => sink.push(`[${label}] pageerror: ${e.message}`));
}

async function ready(page) {
  await page.waitForSelector('.reveal.ready', { timeout: 15000 });
}

async function goTo(page, index, settle = 900) {
  await page.evaluate((i) => (location.hash = `#/${i}`), index);
  await page.waitForFunction(
    (i) => document.querySelectorAll('.reveal .slides > section')[i]?.classList.contains('present'),
    index,
  );
  await sleep(settle);
}

const currentIndex = (page) =>
  page.evaluate(() => [...document.querySelectorAll('.reveal .slides > section')].findIndex((s) => s.classList.contains('present')));
const ticks = (target) => target.evaluate(() => window.__spikeMetrics?.simTicks ?? 0);

const browser = await chromium.launch();
const consoleLog = [];

// ---------------------------------------------------------------- live deck
const live = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await live.newPage();
watchConsole(page, 'live', consoleLog);
await page.goto(DIST);
await ready(page);

check('boots from file:// (single-file build)', (await page.locator('.reveal .slides > section').count()) === 6, {
  slides: await page.locator('.reveal .slides > section').count(),
});
check('sim idle while off-screen at load', (await ticks(page)) === 0, { ticks: await ticks(page) });

// Math
await goTo(page, SLIDES.math);
await page.evaluate(() => document.fonts.ready);
const katex = await page.evaluate(() => ({
  formulas: document.querySelectorAll('.katex-display').length,
  loadedKatexFaces: [...document.fonts].filter((f) => f.family.includes('KaTeX') && f.status === 'loaded').map((f) => f.family),
}));
check('KaTeX renders with fonts embedded offline', katex.formulas === 3 && katex.loadedKatexFaces.length > 0, katex);

const citations = await page.locator('.cite').allTextContents();
check('citations formatted at build time (APA)', citations.length === 2 && citations.every((c) => /\(\w+.*\d{4}\)/.test(c)), citations);

// Video
await goTo(page, SLIDES.video, 2500);
const video = await page.evaluate(() => {
  const v = document.querySelector('video');
  return {
    canPlayH264: v.canPlayType('video/mp4; codecs="avc1.640028"'),
    readyState: v.readyState,
    networkState: v.networkState,
    error: v.error?.code ?? null,
    paused: v.paused,
    currentTime: v.currentTime,
    src: v.currentSrc,
  };
});
check('video element present on video slide', true, video);
if (video.canPlayH264 === '') {
  check('video playback (H.264)', true, 'SKIPPED: open-source Chromium has no H.264 decoder; verify in real Chrome');
} else {
  check('video autoplays on enter from ./media via file://', !video.paused && video.currentTime > 0.5 && video.error === null, video);
}

// Simulation lifecycle
await goTo(page, SLIDES.sim, 1000);
const t1 = await ticks(page);
await sleep(1000);
const t2 = await ticks(page);
check('sim runs while its slide is active', t2 - t1 > 20, { perSecond: t2 - t1 });

if (video.canPlayH264 !== '') {
  const leftVideoPaused = await page.evaluate(() => document.querySelector('video')?.paused);
  check('video pauses when its slide is left', leftVideoPaused === true, { paused: leftVideoPaused });
}

// Keyboard: native range input keeps arrow keys
await page.focus('#sim-lr');
const before = await page.inputValue('#sim-lr');
for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
check('arrow keys on focused slider change the slider, not the slide', (await currentIndex(page)) === SLIDES.sim && (await page.inputValue('#sim-lr')) !== before, {
  slide: await currentIndex(page),
  before,
  after: await page.inputValue('#sim-lr'),
});

// Keyboard: focused <button> + Space (Reveal binds Space to "next")
await page.getByRole('button', { name: 'Pause' }).focus();
await page.keyboard.press('Space');
await sleep(900);
const afterSpace = { slide: await currentIndex(page), pauseLabel: await page.locator('.sim__buttons button').first().textContent() };
check('Space on a focused button toggles it without advancing the slide', afterSpace.slide === SLIDES.sim && afterSpace.pauseLabel === 'Play', afterSpace);
if (afterSpace.slide !== SLIDES.sim) await goTo(page, SLIDES.sim);
if ((await page.locator('.sim__buttons button').first().textContent()) === 'Pause') {
  await page.locator('.sim__buttons button').first().click();
}
await page.getByRole('button', { name: 'Play' }).click();

// Clicker: PageDown must still navigate even though the button just clicked has focus
await page.keyboard.press('PageDown');
await sleep(900);
check('clicker key (PageDown) navigates while a button has focus', (await currentIndex(page)) === SLIDES.overflow, { slide: await currentIndex(page) });
await goTo(page, SLIDES.sim);
await page.evaluate(() => document.activeElement?.blur());

await page.keyboard.press('ArrowRight');
await sleep(900);
check('arrow keys navigate when nothing interactive is focused', (await currentIndex(page)) === SLIDES.overflow, { slide: await currentIndex(page) });

const t3 = await ticks(page);
await sleep(1000);
const t4 = await ticks(page);
check('sim pauses when its slide is left', t4 === t3, { ticksWhileAway: t4 - t3 });

await goTo(page, SLIDES.sim, 1000);
const t5 = await ticks(page);
await sleep(500);
check('sim resumes when its slide returns', (await ticks(page)) > t5, { ticksAfterReturn: (await ticks(page)) - t5 });

// ---------------------------------------------------------------- speaker view
const [popup] = await Promise.all([live.waitForEvent('page'), page.keyboard.press('s')]);
watchConsole(popup, 'speaker', consoleLog);
await popup.waitForLoadState();
await sleep(4000);
const speakerNotes = (await popup.locator('.speaker-controls-notes').textContent().catch(() => null)) ?? '';
check('speaker view opens and syncs notes over file://', speakerNotes.includes('Live simulation'), { notes: speakerNotes.trim().slice(0, 80) });

const previewFrames = popup.frames().filter((f) => f.url().includes('receiver'));
const previewState = [];
for (const frame of previewFrames) {
  const before = await ticks(frame);
  await sleep(700);
  previewState.push({
    url: frame.url().replace(/^.*index\.html/, 'index.html'),
    modes: await frame.evaluate(() => [...document.querySelectorAll('[data-interactive]')].map((el) => `${el.dataset.interactive}:${el.dataset.mode}`)),
    videos: await frame.evaluate(() => document.querySelectorAll('video').length),
    posterLoaded: await frame.evaluate(() => [...document.querySelectorAll('img.video')].every((img) => img.naturalWidth > 0)),
    simTicksDelta: (await ticks(frame)) - before,
  });
}
check(
  'speaker-view previews render Static variants (no duplicate sim or video)',
  previewFrames.length === 2 &&
    previewState.every((s) => s.modes.every((m) => m.endsWith(':preview')) && s.videos === 0 && s.simTicksDelta === 0 && s.posterLoaded),
  previewState,
);
const mainTicksBefore = await ticks(page);
await sleep(700);
check('audience sim keeps running while speaker view is open', (await ticks(page)) > mainTicksBefore);
await popup.screenshot({ path: `${OUT}/speaker-view.png` });

await page.keyboard.press('ArrowRight');
await sleep(2000);
const notesAfterNav = (await popup.locator('.speaker-controls-notes').textContent()) ?? '';
check('speaker view follows navigation in the audience window', notesAfterNav.includes('overflow check'), { notes: notesAfterNav.trim().slice(0, 80) });

await popup.bringToFront();
await popup.keyboard.press('ArrowLeft');
await sleep(2000);
await page.bringToFront();
check('navigating in the speaker view drives the audience window', (await currentIndex(page)) === SLIDES.sim, { audienceSlide: await currentIndex(page) });
await popup.close();

// ---------------------------------------------------------------- pointer scaling
const small = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const sp = await small.newPage();
watchConsole(sp, 'small', consoleLog);
await sp.goto(DIST);
await ready(sp);
await goTo(sp, SLIDES.sim, 800);
await sp.getByRole('button', { name: 'Pause' }).click();
const target = { x: 190, y: 570 };
const box = await sp.locator('.sim__canvas').boundingBox();
const scale = box.width / 760;
await sp.mouse.click(box.x + target.x * scale, box.y + target.y * scale);
const logged = await sp.evaluate(() => window.__spikeMetrics.pointerLog.at(-1));
check(
  'click maps to logical canvas coordinates at deck scale ≠ 1',
  Math.abs(logged.x - target.x) < 2 && Math.abs(logged.y - target.y) < 2,
  { scale: +scale.toFixed(3), expected: target, scaleAware: { x: +logged.x.toFixed(1), y: +logged.y.toFixed(1) }, naive: { x: +logged.naiveX.toFixed(1), y: +logged.naiveY.toFixed(1) } },
);
await small.close();

// ---------------------------------------------------------------- print / PDF
const printCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const pp = await printCtx.newPage();
watchConsole(pp, 'print', consoleLog);
await pp.goto(`${DIST}?print-pdf`);
await ready(pp);
await pp.waitForSelector('.pdf-page');
await sleep(1500);
const print = await pp.evaluate(() => {
  const canvas = document.querySelector('.sim__canvas');
  const ctx = canvas.getContext('2d');
  const px = ctx.getImageData(canvas.width * 0.25, canvas.height * 0.25, 1, 1).data;
  return {
    pages: document.querySelectorAll('.pdf-page').length,
    modes: [...document.querySelectorAll('[data-interactive]')].map((el) => `${el.dataset.interactive}:${el.dataset.mode}`),
    videos: document.querySelectorAll('video').length,
    canvasPainted: px[3] > 0,
    posterLoaded: [...document.querySelectorAll('img.video')].every((img) => img.naturalWidth > 0),
    ticks: window.__spikeMetrics?.simTicks ?? 0,
  };
});
check('print view renders Static variants only', print.modes.every((m) => m.endsWith(':print')) && print.videos === 0 && print.canvasPainted && print.posterLoaded && print.ticks === 0, print);
await pp.pdf({ path: `${OUT}/deck.pdf`, preferCSSPageSize: true, printBackground: true });
// Count pages in the PDF itself — DOM checks can't see print-stylesheet clipping.
const pdfPages = (readFileSync(`${OUT}/deck.pdf`, 'latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
check('PDF has one page per slide', pdfPages === 6 && print.pages === 6, { pdfPages, printPages: print.pages });
await printCtx.close();

// ---------------------------------------------------------------- overflow + screenshots
const shots = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const sh = await shots.newPage();
await sh.goto(`${DIST}?transition=none&fragments=false`);
await ready(sh);
const overflow = [];
for (let i = 0; i < 6; i++) {
  await goTo(sh, i, i === SLIDES.sim ? 2500 : 600);
  const offenders = await sh.evaluate(() => {
    const slides = document.querySelector('.reveal .slides');
    const frame = slides.getBoundingClientRect();
    const scale = frame.width / slides.offsetWidth;
    const section = document.querySelector('.reveal .slides > section.present');
    const found = [];
    for (const el of section.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const sides = {
        top: (frame.top - r.top) / scale,
        bottom: (r.bottom - frame.bottom) / scale,
        left: (frame.left - r.left) / scale,
        right: (r.right - frame.right) / scale,
      };
      const [side, px] = Object.entries(sides).sort((a, b) => b[1] - a[1])[0];
      if (px > 1) {
        const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
        found.push({ el: `${el.tagName.toLowerCase()}${cls}`, side, px: Math.round(px) });
      }
    }
    return found;
  });
  overflow.push({ slide: i, offenders: offenders.length, worst: offenders.sort((a, b) => b.px - a.px).slice(0, 3) });
  await sh.screenshot({ path: `${OUT}/slides/${String(i).padStart(2, '0')}.png` });
}
check(
  'overflow check flags only the deliberately overfull slide',
  overflow.every((o) => (o.slide === SLIDES.overflow ? o.offenders > 0 : o.offenders === 0)),
  overflow,
);
await shots.close();

await live.close();
await browser.close();

check('no console errors or warnings', consoleLog.length === 0, consoleLog);

writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
