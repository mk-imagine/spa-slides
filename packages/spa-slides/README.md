# @mk-imagine/spa-slides

Presentation decks as React single-page apps, built on reveal.js. A deck is an ordinary Vite + React project that depends on this package; the build is a single `index.html` that opens straight from disk.

## A deck in five files

**package.json** — pin the library like any dependency.

```json
{
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
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
| `<Screenshot placeholder="…">` | A labelled box for a capture you have not taken yet. The verifier fails until it is replaced |
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
