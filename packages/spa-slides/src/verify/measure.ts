import type { Overflow, SlideReport } from './types.js';

export interface MeasureArgs {
  index: number;
  /** The build step the slide is showing. */
  step: number;
  /** Overshoot at or below this many slide pixels is rounding, not a layout bug. */
  tolerance: number;
}

/**
 * Measures one slide. Runs inside the page: Playwright serializes the function's source,
 * so it must not reference anything outside its own body.
 */
export async function measureSlide({ index, step, tolerance }: MeasureArgs): Promise<SlideReport> {
  const section = document.querySelectorAll<HTMLElement>('.reveal .slides > section')[index];
  if (!section) throw new Error(`slide ${index + 1} does not exist`);

  const images = [...section.querySelectorAll('img')];
  const brokenImages: string[] = [];
  await Promise.all(
    images.map((img) =>
      img.decode().catch(() => {
        brokenImages.push((img.getAttribute('src') ?? '').slice(0, 80));
      }),
    ),
  );
  await document.fonts.ready;

  const slides = document.querySelector<HTMLElement>('.reveal .slides')!;
  const frame = slides.getBoundingClientRect();
  const scale = frame.width / slides.offsetWidth;
  const body = section.querySelector<HTMLElement>('.sps-body');
  const bodyBox = body?.getBoundingClientRect();

  const describe = (el: Element) => {
    const classes = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : [];
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${classes.map((c) => `.${c}`).join('')}${text ? ` "${text}"` : ''}`;
  };

  const overflow: Overflow[] = [];
  const fonts = new Set<string>();

  for (const el of section.querySelectorAll<HTMLElement>('*')) {
    if (el.closest('aside.notes')) continue;
    const own = el.getBoundingClientRect();
    if (own.width === 0 && own.height === 0) continue;
    // Not shown at this step (a build that has not appeared yet). It is measured at the steps where it shows.
    if (getComputedStyle(el).visibility === 'hidden') continue;

    const rendersText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '');
    if (rendersText) {
      fonts.add(getComputedStyle(el).fontFamily.split(',')[0]!.trim().replace(/^["']|["']$/g, ''));
    }

    // What is actually visible: the element's box, clipped by every ancestor that clips overflow
    // (a cropped screenshot's image is meant to extend past its frame).
    let top = own.top;
    let bottom = own.bottom;
    let left = own.left;
    let right = own.right;
    for (let a = el.parentElement; a && a !== section; a = a.parentElement) {
      const style = getComputedStyle(a);
      if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
      const clip = a.getBoundingClientRect();
      top = Math.max(top, clip.top);
      bottom = Math.min(bottom, clip.bottom);
      left = Math.max(left, clip.left);
      right = Math.min(right, clip.right);
    }
    if (right <= left || bottom <= top) continue;

    // Body content must stay in the body, so it neither leaves the slide nor runs into the title.
    const inBody = body !== null && bodyBox !== undefined && body !== el && body.contains(el);
    const bounds = inBody ? bodyBox : frame;
    const sides = {
      top: (bounds.top - top) / scale,
      bottom: (bottom - bounds.bottom) / scale,
      left: (bounds.left - left) / scale,
      right: (right - bounds.right) / scale,
    };
    const [side, px] = (Object.entries(sides) as [Overflow['side'], number][]).sort((a, b) => b[1] - a[1])[0]!;
    if (px > tolerance) overflow.push({ element: describe(el), within: inBody ? 'body' : 'slide', side, px: Math.round(px), steps: [step] });
  }
  overflow.sort((a, b) => b.px - a.px);

  return {
    slide: index + 1,
    title: (section.querySelector('.sps-title, .sps-deck-title')?.textContent ?? '').trim(),
    appendix: section.getAttribute('data-visibility') === 'uncounted',
    steps: section.querySelectorAll('.sps-step-marker').length,
    notes: (section.querySelector('aside.notes')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    images: images.length,
    brokenImages,
    placeholders: [...section.querySelectorAll('[data-placeholder]')].map((el) => el.getAttribute('data-placeholder') ?? ''),
    overflow,
    overflowCount: overflow.length,
    fonts: [...fonts].sort(),
  };
}
