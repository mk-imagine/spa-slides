import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from 'playwright';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '../core/size.js';
import { STEP_MARKER_CLASS } from '../core/step-marker.js';
import { VERIFY_PARAM } from '../interactive/environment.js';
import { INTERACTIVE_ATTRIBUTE } from '../interactive/toggle.js';
import { renderContactSheet } from './contact-sheet.js';
import { measureSlide } from './measure.js';
import { mergeStepReports } from './merge.js';
import { exerciseHover } from './hover.js';
import { countPdfPages } from './pdf.js';
import { proseDifference } from './prose.js';
import type { Check, SlideReport, VerifyOptions, VerifyResult } from './types.js';

export type { Check, CheckId, HoverProblem, HoverReport, Overflow, SlideReport, VerifyOptions, VerifyResult } from './types.js';

const SECTIONS = '.reveal .slides > section';
const TOLERANCE_PX = 1.5;
const TIMEOUT_MS = 20_000;
const VIEWPORT = { width: SLIDE_WIDTH, height: SLIDE_HEIGHT };

/**
 * Shows slide `index` at build step `step` (0 is the slide on arrival), once the slide has rendered
 * that step: Reveal marks the step's fragments first, and React renders the step after.
 */
async function showSlide(page: Page, index: number, step = 0) {
  // Reveal's URL is #/slide/vertical/fragment, where fragment -1 means none shown yet.
  await page.evaluate(({ i, fragment }) => (location.hash = `#/${i}/0/${fragment}`), { i: index, fragment: step - 1 });
  await page.waitForFunction(
    ({ selector, marker, i, s }) => {
      const section = document.querySelectorAll(selector)[i];
      const rendered = section?.querySelector('.sps-step-markers')?.getAttribute('data-step') ?? '0';
      return section?.classList.contains('present') && section.querySelectorAll(`.${marker}.visible`).length === s && rendered === String(s);
    },
    { selector: SECTIONS, marker: STEP_MARKER_CLASS, i: index, s: step },
    { timeout: TIMEOUT_MS },
  );
}

/** Build animations would put screenshots and measurements mid-fade. */
const NO_TRANSITIONS = '*, *::before, *::after { transition: none !important; animation: none !important; }';

/**
 * The query for each pass. The verifier announces itself and the version it is checking, so every
 * interactive figure shows that version, and its timeline lands on each keyframe instead of gliding.
 */
const passQuery = (version: 'still' | 'live') => `?transition=none&backgroundTransition=none&${VERIFY_PARAM}=${version}`;

/** Each version of a slide that was measured: the slide itself, and its live version if it has one. */
function versions(slide: SlideReport): { version?: 'still' | 'live'; report: Omit<SlideReport, 'live'> }[] {
  return slide.live ? [{ version: 'still', report: slide }, { version: 'live', report: slide.live }] : [{ report: slide }];
}

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
  /** A screenshot at one step, or at the last step when `step` is omitted. Live versions get their own. */
  const shotPath = (version: 'still' | 'live', slide: number, step?: number) =>
    join(outDir, 'slides', `${slideName(slide)}${version === 'live' ? '-live' : ''}${step === undefined ? '' : `-step-${step}`}.png`);
  /** The slide in its final state; used for the contact sheet. */
  const screenshotPath = (slide: number) => shotPath('still', slide);
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

  /** Measures one slide at every build step, screenshotting each, then hovers its charts at the last. */
  const measureSteps = async (page: Page, index: number, version: 'still' | 'live') => {
    const steps = await page.locator(SECTIONS).nth(index).locator(`.${STEP_MARKER_CLASS}`).count();
    const reports: SlideReport[] = [];
    for (let step = 0; step <= steps; step++) {
      await showSlide(page, index, step);
      reports.push(await page.evaluate(measureSlide, { index, step, tolerance: TOLERANCE_PX }));
      await page.screenshot({ path: shotPath(version, index + 1, step === steps ? undefined : step) });
    }
    // After the screenshots, which must not show a readout; it leaves the mouse off the slide.
    const hover = await exerciseHover(page, index, TOLERANCE_PX);
    return { ...mergeStepReports(reports), ...(hover ? { hover } : {}) };
  };

  const slides: SlideReport[] = [];
  const browser = await chromium.launch();
  try {
    // ---- The deck as presented, with every figure's still ----------------------------------
    const presented = await browser.newContext({ viewport: VIEWPORT });
    const page = await presented.newPage();
    watchConsole(page, 'deck');
    await page.goto(`${url}${passQuery('still')}`);
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

    for (let i = 0; i < slideCount; i++) slides.push(await measureSteps(page, i, 'still'));

    // ---- The live version of every interactive figure ---------------------------------------
    // Print and the screenshots above show stills, so without this pass a live version could
    // overflow, collide its labels or fail outright with every check passing.
    const interactive = slides.filter((s) => s.rendered.length > 0);
    if (interactive.length > 0) {
      const liveContext = await browser.newContext({ viewport: VIEWPORT });
      const livePage = await liveContext.newPage();
      watchConsole(livePage, 'live');
      await livePage.goto(`${url}${passQuery('live')}`);
      await livePage.waitForSelector('.reveal.ready', { timeout: TIMEOUT_MS });
      await livePage.addStyleTag({ content: NO_TRANSITIONS });
      for (const slide of interactive) slide.live = await measureSteps(livePage, slide.slide - 1, 'live');
      await liveContext.close();
    }

    /** Slides failing a measurement in either version, with the version named where there are two. */
    const failing = <T,>(pick: (r: Omit<SlideReport, 'live'>) => T | undefined) =>
      slides.flatMap((s) =>
        versions(s).flatMap(({ version, report }) => {
          const found = pick(report);
          return found === undefined ? [] : [{ slide: s.slide, ...(version ? { version } : {}), ...found }];
        }),
      );

    const overflowing = failing((r) => (r.overflowCount > 0 ? { title: r.title, worst: r.overflow.slice(0, 3) } : undefined));
    record({ id: 'overflow', name: 'no slide overflows', pass: overflowing.length === 0, detail: overflowing });

    const broken = failing((r) => (r.brokenImages.length > 0 ? { images: r.brokenImages } : undefined));
    record({ id: 'images', name: 'every image loads', pass: broken.length === 0, detail: broken });

    const placeholders = failing((r) => (r.placeholders.length > 0 ? { placeholders: r.placeholders } : undefined));
    record({ id: 'placeholders', name: 'no screenshot placeholders remain', pass: placeholders.length === 0, detail: placeholders });

    const unresolved = failing((r) => (r.missingCitations.length > 0 ? { keys: r.missingCitations } : undefined));
    record({ id: 'citations', name: 'every citation resolves', pass: unresolved.length === 0, detail: unresolved });

    // A reference list is meant to be what the deck cites. An entry nothing cites is a leftover in
    // the bibliography, and it is invisible on the slide: it looks exactly like a real reference.
    const cited = new Set(slides.flatMap((s) => versions(s).flatMap((v) => v.report.citations)));
    const listed = [...new Set(slides.flatMap((s) => s.references))].sort();
    const uncited = listed.filter((key) => !cited.has(key));
    if (listed.length > 0) {
      record({
        id: 'references-cited',
        name: 'every reference listed is cited',
        pass: uncited.length === 0,
        detail: { uncited, listed: listed.length, cited: cited.size },
      });
    }

    const colliding = failing((r) => (r.labelOverlaps.length > 0 ? { title: r.title, overlaps: r.labelOverlaps.slice(0, 3) } : undefined));
    record({ id: 'label-overlap', name: 'no chart labels overlap', pass: colliding.length === 0, detail: colliding });

    // A font the deck does not bundle falls back to whatever the machine has, so text wraps
    // differently on the presentation laptop than it did here.
    const loaded = new Set(
      await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/^["']|["']$/g, ''))),
    );
    const unbundled = new Map<string, number[]>();
    for (const s of slides) {
      const families = new Set(versions(s).flatMap((v) => v.report.fonts));
      for (const family of [...families].filter((f) => !loaded.has(f))) unbundled.set(family, [...(unbundled.get(family) ?? []), s.slide]);
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
      const [speaker] = await Promise.all([presented.waitForEvent('page'), page.keyboard.press('s')]);
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
    await presented.close();

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
    const printed = await printPage.evaluate(
      (attribute) =>
        [...document.querySelectorAll(`[${attribute}]`)].map((el) => ({
          title: (el.closest('section')?.querySelector('.sps-title')?.textContent ?? '').trim(),
          rendered: el.getAttribute(attribute) === 'live' ? 'live' : `still:${el.getAttribute('data-sps-still-reason') ?? ''}`,
        })),
      INTERACTIVE_ATTRIBUTE,
    );
    const pdfPath = join(outDir, 'deck.pdf');
    await printPage.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
    await print.close();
    const pdfPages = countPdfPages(readFileSync(pdfPath));
    record({ id: 'pdf-pages', name: 'PDF has one page per slide', pass: pdfPages === slideCount, detail: { pdfPages, slides: slideCount } });

    if (interactive.length > 0) {
      // The PDF and the screenshots are what a reader and a reviewer see, so both must show the
      // authored stills. A live version here means a condition was missed, and it is printed mid-motion.
      const unstill = [
        ...interactive.flatMap((s) => s.rendered.filter((r) => r !== 'still:verify').map((rendered) => ({ slide: s.slide, title: s.title, where: 'screenshots', rendered }))),
        ...printed.filter((p) => p.rendered !== 'still:print').map((p) => ({ ...p, where: 'pdf' })),
      ];
      record({
        id: 'stills',
        name: 'the PDF and the screenshots show each still',
        pass: unstill.length === 0,
        detail: { figures: printed.length, unstill },
      });

      // A slide showing its still because its live version threw would pass every other check here.
      const notLive = interactive.flatMap((s) => (s.live?.rendered ?? []).filter((r) => r !== 'live').map((rendered) => ({ slide: s.slide, title: s.title, rendered })));
      record({ id: 'live', name: 'every live version renders', pass: notLive.length === 0, detail: notLive });

      // The two versions may draw different figures; the text around them has to make the same claim.
      const drifted = interactive.flatMap((s) => {
        const difference = proseDifference(s.prose, s.live?.prose ?? '');
        return difference === null ? [] : [{ slide: s.slide, title: s.title, ...difference }];
      });
      record({ id: 'prose', name: 'each still says what its live version says', pass: drifted.length === 0, detail: drifted });
    }

    // A readout appears only under a pointer, so no screenshot or other check ever sees one.
    const hovered = slides.flatMap((s) => versions(s).flatMap(({ version, report }) => (report.hover ? [{ slide: s.slide, version, hover: report.hover }] : [])));
    if (hovered.length > 0) {
      const problems = hovered.flatMap(({ slide, version, hover }) => hover.problems.map((p) => ({ slide, ...(version ? { version } : {}), ...p })));
      record({
        id: 'hover',
        name: 'every hover readout stays in view',
        pass: problems.length === 0,
        detail: {
          charts: hovered.reduce((n, h) => n + h.hover.charts, 0),
          points: hovered.reduce((n, h) => n + h.hover.points, 0),
          readouts: hovered.reduce((n, h) => n + h.hover.readouts, 0),
          problems: problems.slice(0, 20),
        },
      });
    }

    await renderContactSheet(browser, slides, screenshotPath, join(outDir, 'contact-sheet.png'));
  } finally {
    await browser.close();
  }

  record({ id: 'console', name: 'no console errors or warnings', pass: consoleMessages.length === 0, detail: consoleMessages });

  const result: VerifyResult = { pass: checks.every((c) => c.pass), checks, slides, outDir };
  writeFileSync(join(outDir, 'results.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
