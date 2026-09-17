import { readFileSync } from 'node:fs';
import type { Browser } from 'playwright';
import type { SlideReport } from './types.js';

const escape = (text: string) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Every slide screenshot on one page, with failing slides outlined, for reviewing a deck at a glance. */
export async function renderContactSheet(browser: Browser, slides: SlideReport[], screenshotPath: (slide: number) => string, outPath: string) {
  const tiles = slides
    .map((s) => {
      const png = readFileSync(screenshotPath(s.slide)).toString('base64');
      const failing =
        s.overflowCount > 0 || s.brokenImages.length > 0 || s.placeholders.length > 0 || s.missingCitations.length > 0 || s.labelOverlaps.length > 0;
      const flags = [
        s.appendix && 'appendix',
        s.overflowCount > 0 && 'overflow',
        s.brokenImages.length > 0 && 'broken image',
        s.placeholders.length > 0 && 'placeholder',
        s.missingCitations.length > 0 && 'missing citation',
        s.labelOverlaps.length > 0 && 'labels overlap',
      ]
        .filter(Boolean)
        .join(' · ');
      const caption = `${s.slide}. ${escape(s.title || '(untitled)')}${flags ? ` — ${flags}` : ''}`;
      return `<figure class="${failing ? 'failing' : ''}"><img src="data:image/png;base64,${png}"><figcaption>${caption}</figcaption></figure>`;
    })
    .join('');

  const page = await browser.newPage({ viewport: { width: 2016, height: 1000 } });
  await page.setContent(`<style>
    body { margin: 16px; font: 14px system-ui; background: #e9ecef; display: grid; grid-template-columns: repeat(5, 384px); gap: 16px; }
    figure { margin: 0; }
    img { display: block; width: 384px; height: 216px; background: #fff; outline: 1px solid #ccd; }
    figcaption { padding: 4px 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .failing img { outline: 4px solid #d00; }
  </style>${tiles}`);
  await page.screenshot({ path: outPath, fullPage: true });
  await page.close();
}
