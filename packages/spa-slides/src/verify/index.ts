import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from 'playwright';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '../core/size.js';
import { STEP_MARKER_CLASS } from '../core/step-marker.js';
import { renderContactSheet } from './contact-sheet.js';
import { measureSlide } from './measure.js';
import { mergeStepReports } from './merge.js';
import { countPdfPages } from './pdf.js';
import type { Check, SlideReport, VerifyOptions, VerifyResult } from './types.js';

export type { Check, CheckId, Overflow, SlideReport, VerifyOptions, VerifyResult } from './types.js';

const SECTIONS = '.reveal .slides > section';
const TOLERANCE_PX = 1.5;
const TIMEOUT_MS = 20_000;
const VIEWPORT = { width: SLIDE_WIDTH, height: SLIDE_HEIGHT };

/** Shows slide `index` at build step `step` (0 is the slide on arrival). */
async function showSlide(page: Page, index: number, step = 0) {
  // Reveal's URL is #/slide/vertical/fragment, where fragment -1 means none shown yet.
  await page.evaluate(({ i, fragment }) => (location.hash = `#/${i}/0/${fragment}`), { i: index, fragment: step - 1 });
  await page.waitForFunction(
    ({ selector, marker, i, s }) => {
      const section = document.querySelectorAll(selector)[i];
      return section?.classList.contains('present') && section.querySelectorAll(`.${marker}.visible`).length === s;
    },
    { selector: SECTIONS, marker: STEP_MARKER_CLASS, i: index, s: step },
    { timeout: TIMEOUT_MS },
  );
}

/** Build animations would put screenshots and measurements mid-fade. */
const NO_TRANSITIONS = '*, *::before, *::after { transition: none !important; animation: none !important; }';

/**
 * Opens a built deck from disk in Chromium, the way an audience would get it, and checks every slide.
 * Writes a screenshot per slide, a contact sheet, the exported PDF, and results.json to `outDir`.
 */
export async function verifyDeck(options: VerifyOptions): Promise<VerifyResult> {
  const deckDir = resolve(options.deckDir);
  const indexHtml = join(resolve(deckDir, options.distDir ?? 'dist'), 'index.html');
  const outDir = resolve(deckDir, options.outDir ?? 'report');
  if (!existsSync(indexHtml)) throw new Error(`no built deck at ${indexHtml}. Build the deck first.`);

  const url = pathToFileURL(indexHtml).href;
  const slideName = (slide: number) => String(slide).padStart(2, '0');
  /** The slide in its final state; used for the contact sheet. */
  const screenshotPath = (slide: number) => join(outDir, 'slides', `${slideName(slide)}.png`);
  const stepScreenshotPath = (slide: number, step: number) => join(outDir, 'slides', `${slideName(slide)}-step-${step}.png`);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, 'slides'), { recursive: true });

  const checks: Check[] = [];
  const record = (check: Check) => {
    checks.push(check);
    options.onCheck?.(check);
  };
  const consoleMessages: string[] = [];
  const watchConsole = (page: Page, label: string) => {
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') consoleMessages.push(`[${label}] ${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => consoleMessages.push(`[${label}] uncaught: ${e.message}`));
  };

  const slides: SlideReport[] = [];
  const browser = await chromium.launch();
  try {
    // ---- The deck as presented -------------------------------------------------------------
    const live = await browser.newContext({ viewport: VIEWPORT });
    const page = await live.newPage();
    watchConsole(page, 'deck');
    await page.goto(`${url}?transition=none&backgroundTransition=none`);
    await page.waitForSelector('.reveal.ready', { timeout: TIMEOUT_MS });
    await page.addStyleTag({ content: NO_TRANSITIONS });

    const slideCount = await page.locator(SECTIONS).count();
    record({ id: 'boot', name: 'deck opens from disk', pass: slideCount > 0, detail: { slides: slideCount } });
    if (options.expectSlides !== undefined) {
      record({
        id: 'slide-count',
        name: `deck has ${options.expectSlides} slide${options.expectSlides === 1 ? '' : 's'}`,
        pass: slideCount === options.expectSlides,
        detail: { slides: slideCount },
      });
    }

    for (let i = 0; i < slideCount; i++) {
      const steps = await page.locator(SECTIONS).nth(i).locator(`.${STEP_MARKER_CLASS}`).count();
      const reports: SlideReport[] = [];
      for (let step = 0; step <= steps; step++) {
        await showSlide(page, i, step);
        reports.push(await page.evaluate(measureSlide, { index: i, step, tolerance: TOLERANCE_PX }));
        await page.screenshot({ path: step === steps ? screenshotPath(i + 1) : stepScreenshotPath(i + 1, step) });
      }
      slides.push(mergeStepReports(reports));
    }

    const overflowing = slides.filter((s) => s.overflowCount > 0);
    record({
      id: 'overflow',
      name: 'no slide overflows',
      pass: overflowing.length === 0,
      detail: overflowing.map((s) => ({ slide: s.slide, title: s.title, worst: s.overflow.slice(0, 3) })),
    });

    const broken = slides.filter((s) => s.brokenImages.length > 0);
    record({
      id: 'images',
      name: 'every image loads',
      pass: broken.length === 0,
      detail: broken.map((s) => ({ slide: s.slide, images: s.brokenImages })),
    });

    const placeholders = slides.filter((s) => s.placeholders.length > 0);
    record({
      id: 'placeholders',
      name: 'no screenshot placeholders remain',
      pass: placeholders.length === 0,
      detail: placeholders.map((s) => ({ slide: s.slide, placeholders: s.placeholders })),
    });

    // A font the deck does not bundle falls back to whatever the machine has, so text wraps
    // differently on the presentation laptop than it did here.
    const loaded = new Set(
      await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/^["']|["']$/g, ''))),
    );
    const unbundled = new Map<string, number[]>();
    for (const s of slides) {
      for (const family of s.fonts.filter((f) => !loaded.has(f))) unbundled.set(family, [...(unbundled.get(family) ?? []), s.slide]);
    }
    record({
      id: 'fonts',
      name: 'every font is bundled and loaded',
      pass: unbundled.size === 0,
      detail: [...unbundled].map(([family, onSlides]) => ({ family, slides: onSlides })),
    });

    const withNotes = slides.find((s) => s.notes !== '');
    if (withNotes) {
      await showSlide(page, withNotes.slide - 1, 0);
      const [speaker] = await Promise.all([live.waitForEvent('page'), page.keyboard.press('s')]);
      watchConsole(speaker, 'speaker view');
      const snippet = withNotes.notes.slice(0, 40);
      const shown = await speaker
        .waitForFunction(
          (text) => (document.querySelector('.speaker-controls-notes')?.textContent ?? '').replace(/\s+/g, ' ').includes(text),
          snippet,
          { timeout: TIMEOUT_MS },
        )
        .then(
          () => true,
          () => false,
        );
      record({ id: 'speaker-view', name: 'speaker view shows the notes', pass: shown, detail: { slide: withNotes.slide } });
      await speaker.close();
    }
    await live.close();

    // ---- The deck as a PDF -----------------------------------------------------------------
    const print = await browser.newContext({ viewport: VIEWPORT });
    const printPage = await print.newPage();
    watchConsole(printPage, 'print');
    await printPage.goto(`${url}?print-pdf`);
    await printPage.waitForSelector('.reveal.ready', { timeout: TIMEOUT_MS });
    await printPage.waitForSelector('.pdf-page', { state: 'attached', timeout: TIMEOUT_MS });
    await printPage.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)));
    });
    const pdfPath = join(outDir, 'deck.pdf');
    await printPage.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
    await print.close();
    const pdfPages = countPdfPages(readFileSync(pdfPath));
    record({ id: 'pdf-pages', name: 'PDF has one page per slide', pass: pdfPages === slideCount, detail: { pdfPages, slides: slideCount } });

    await renderContactSheet(browser, slides, screenshotPath, join(outDir, 'contact-sheet.png'));
  } finally {
    await browser.close();
  }

  record({ id: 'console', name: 'no console errors or warnings', pass: consoleMessages.length === 0, detail: consoleMessages });

  const result: VerifyResult = { pass: checks.every((c) => c.pass), checks, slides, outDir };
  writeFileSync(join(outDir, 'results.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
