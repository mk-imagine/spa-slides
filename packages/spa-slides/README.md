# @mk-imagine/spa-slides

Presentation decks as React single-page apps, built on reveal.js. A deck is an ordinary Vite + React project that depends on this package; the build is a single `index.html` that opens straight from disk.

## A deck in six files

**package.json** — pin the library like any dependency.

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "spa-slides lint",
    "verify": "spa-slides verify"
  },
  "dependencies": { "@mk-imagine/spa-slides": "0.1.0", "react": "19.3.0", "react-dom": "19.3.0" },
  "devDependencies": { "vite": "8.3.0", "typescript": "6.0.3", "@types/react": "19.3.0", "@types/react-dom": "19.3.0" }
}
```

**vite.config.ts**

```ts
import { defineConfig } from 'vite';
import { spaSlides } from '@mk-imagine/spa-slides/vite';

export default defineConfig({ plugins: [spaSlides()] });
```

**tsconfig.json** — include the client types so `?image` imports are typed.

```json
{ "compilerOptions": { "jsx": "react-jsx", "moduleResolution": "bundler", "module": "ESNext", "strict": true,
  "types": ["vite/client", "@mk-imagine/spa-slides/client"] } }
```

**eslint.config.js** — optional; lets an editor show the design rules as you type.

```js
import { spaSlidesLint } from '@mk-imagine/spa-slides/eslint';

export default spaSlidesLint();
```

**index.html** — a `<div id="root">` and `<script type="module" src="/src/main.tsx">`.

**src/main.tsx**

```tsx
import { Deck, Slide, TitleSlide, mountDeck } from '@mk-imagine/spa-slides';
import '@mk-imagine/spa-slides/styles.css';

mountDeck(
  <Deck meta={{ title: 'My talk', author: 'Me', date: 'Friday, September 18, 2026' }}>
    <TitleSlide />
    <Slide title="First point" notes={['Say this out loud.']}>
      <p>Hello.</p>
    </Slide>
  </Deck>,
);
```

See `examples/git-workshop` in this repository for a complete 35-slide deck.

## Components

| Component | Purpose |
|---|---|
| `mountDeck(element)` | Renders the deck into `#root` |
| `<Deck meta transition slideNumbers>` | The presentation. `meta` feeds the title slide |
| `<TitleSlide notes>` | Title, subtitle, author, institute, and date from `meta`; children go underneath |
| `<Slide title notes appendix align>` | A slide. `notes` is speaker notes (an array renders as a list). `appendix` leaves it out of the slide count |
| `<StandoutSlide notes>` | Full-bleed, centered, for the one message to remember |
| `<Columns widths>` | Side-by-side columns, one child per column. `widths={[54, 44]}` sets relative widths |
| `<Screenshot image alt crop width maxHeight>` | A cropped image. `crop` trims source pixels from each edge; `width` is a fraction of the available width, `maxHeight` a fraction of the slide height |
| `<Screenshot placeholder="…">` | A labeled box for a capture you have not taken yet. The verifier fails until it is replaced |
| `<MonoBlock align size>` | Verbatim monospace lines: file listings, terminal output |
| `<Text as size tone align italic>` | Typed text variants, so slides never need ad-hoc sizes or colors |

Plain HTML (`p`, `ul`, `ol`, `dl`, `code`, `strong`, `em`, `table`) is styled by the theme and needs no component.

### Images

Import screenshots with the `?image` query:

```tsx
import diffPane from './images/diff-pane.png?image';

<Screenshot image={diffPane} alt="Diff pane" crop={{ left: 250, top: 105, bottom: 414 }} />
```

The build reads each image's pixel size, so cropping and layout are fixed before the image loads. A missing file fails the build.

## Checking a deck

```sh
spa-slides lint   [deck-dir]
spa-slides verify [deck-dir] [--dist <dir>] [--out <dir>] [--expect-slides <n>]
```

Both default to the current directory. Exit codes: `0` passed, `1` checks failed, `2` could not run.

### `lint`: the design rules

Checks everything under `src/` without needing an ESLint config of your own.

| Rule | Rejects |
|---|---|
| `spa-slides/no-inline-style` | `style={…}` on any element. Use a component prop, or a class whose CSS uses `--sps-*` tokens |
| `spa-slides/no-raw-color` | Fixed colors (`#c00`, `red`, `rgb(…)`) in markup. Allowed: `var(--sps-…)`, `currentColor`, `none`, `transparent`, `inherit` |

To make a deliberate exception, say so on the line: `// eslint-disable-next-line spa-slides/no-inline-style`.

### `verify`: the built deck, as an audience gets it

Opens `dist/index.html` from disk in Chromium and checks:

| Check | Fails when |
|---|---|
| deck opens from disk | Reveal never becomes ready |
| deck has *n* slides | `--expect-slides` does not match |
| no slide overflows | Anything leaves the slide, or body content runs into the title or margins. Clipped content, such as a cropped screenshot, does not count |
| every image loads | An image fails to decode |
| no screenshot placeholders remain | A `<Screenshot placeholder>` is still in the deck |
| every font is bundled and loaded | Text falls back to a system font, so it would wrap differently on another machine |
| speaker view shows the notes | The speaker view does not open or does not show a slide's notes |
| PDF has one page per slide | The exported PDF's page count, read from the file, differs from the slide count |
| no console errors or warnings | Anything is logged at error or warning level |

It writes to `report/`: a screenshot of every slide, `contact-sheet.png` with all of them at once (failing slides outlined), `deck.pdf`, and `results.json` with per-slide measurements.

`verify` drives Playwright 1.63.0's Chromium. Run it in `mcr.microsoft.com/playwright:v1.63.0-noble`, which has that browser installed. The same checks are available programmatically from `@mk-imagine/spa-slides/verify` as `verifyDeck()`.

## Theming

Every size, space, and color is a CSS custom property in `styles/tokens.css` (`--sps-*`). Override them in the deck's own CSS, imported after the library's:

```css
:root {
  --sps-color-accent: #8a2be2;
  --sps-text-body: 36px;
}
```

Fonts (Inter and JetBrains Mono) are bundled rather than taken from the system, so a slide lays out the same on every machine, including the container that runs the verifier.

## Built in

- 1920 × 1080 slides, scaled to any screen
- Speaker view (press `S`), which works when the deck is opened from disk
- PDF export: open `index.html?print-pdf` and print, one page per slide
- Single-file build: scripts, styles, fonts, and imported images are inlined; `public/` files are copied beside it
