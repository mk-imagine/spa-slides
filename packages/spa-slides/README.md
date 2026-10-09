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
| `<Interactive still>` | A figure with a live version and an authored still. See [Interactive figures](#interactive-figures) |
| `<Replay to on duration>` | A chart that fills in on a click; its still is the chart drawn whole. See [A replay](#a-replay-a-chart-that-fills-in-on-a-click) |

Plain HTML (`p`, `ul`, `ol`, `dl`, `code`, `strong`, `em`, `table`) is styled by the theme and needs no component.

### Images

Import screenshots with the `?image` query:

```tsx
import diffPane from './images/diff-pane.png?image';

<Screenshot image={diffPane} alt="Diff pane" crop={{ left: 250, top: 105, bottom: 414 }} />
```

The build reads each image's pixel size, so cropping and layout are fixed before the image loads. A missing file fails the build.

## Interactive figures

A figure that moves has two versions: the live one, and a still. The still is what the PDF and the verifier's screenshots show.

### A replay: a chart that fills in on a click

The common case takes a few lines. `<Replay>` plays its figure on a click, and its still is the figure drawn whole:

```tsx
import { Replay, Slide } from '@mk-imagine/spa-slides';
import { AxisX, Line, Marker, Playhead, Plot, Rule } from '@mk-imagine/spa-slides/chart';

function GapChart({ reveal }: { reveal?: number }) {
  return (
    <Plot width={900} height={400} x={{ domain: [0, 700] }} y={{ domain: [0, 1] }} reveal={reveal} label="The gap, as it was recorded">
      <AxisX label="Trials" />
      <Rule y={0.3} label="criterion" />
      <Line series={1} data={gap} />
      <Line series={1} dashed whole data={prediction} />
      <Marker x={38} y={0.31} label="told apart: trial 38" />
      <Playhead />
    </Plot>
  );
}

<Slide title="Told apart" steps={1}>
  <p>Text outside the figure is shared, so the two versions cannot drift apart.</p>
  <Replay to={700} duration={5000}>{(x) => <GapChart reveal={x} />}</Replay>
</Slide>;
```

`reveal` on a `Plot` draws it only as far as that x. Every mark follows one rule: **anything at an x appears once the reveal reaches it.** Lines and bands draw up to it, markers and vertical rules appear when it gets there, and spans and bars grow with it, getting their labels once they are whole. Horizontal rules, axes and legends are always drawn. Give a mark `whole` to draw it in full from the start, for what is known in advance, such as a prediction. `<Playhead>` marks the reveal while the chart fills in and goes once it is whole, so a finished replay looks exactly like its still.

`<Replay>` takes `from` (default 0), `to`, the click it plays `on` (default 1), and `duration`. Pass `still` when the static figure should be something other than the chart drawn whole.

### Anything else: `<Interactive>` and the step hooks

`<Replay>` is built from three pieces, which are there for whatever it does not cover:

- `<Interactive still={…}>` switches a figure between an authored still and its live version. Wrap only the figure: text outside it is shared, and the verifier fails a slide whose text differs between the two.
- `useTimeline(keyframes)` is a position that glides: one keyframe per click, step 0 included. Advancing a click glides there; anything else lands at once. It works only inside a live version.
- `useStepValue(values)` is a value that jumps: one per click, step 0 included, such as which group a click highlights. Mark what steps back with the `sps-dimmed` class.

```tsx
function TwoClocks() {
  const trials = useTimeline([0, { at: 900, duration: 5000 }, 900]);
  const clock = useTimeline([0, 0, { at: 1, duration: 2500 }]);
  const lit = useStepValue([undefined, 'salmon', 'sunfish']);
  // …draw with all three
}

<Interactive still={<TwoPanels />}>
  <TwoClocks />
</Interactive>;
```

The click is the position, and the clock only animates between keyframes, so the speaker view, going back a slide and print all follow the click. `replay(frames)` and `trace(points)` turn a position into state: any position directly, and the same state every time.

### Hover, and the presenter's pointer

Every chart answers the pointer with the values under it, as Plotly's do, with nothing added to the chart: on a bar, its value and range; elsewhere, a line across at the pointer with the values of the nearest lines there, and the range of any band in the same color. A mark is named in the readout by its `name`, else its text `label`, else its legend entry. A replay answers only for what it has drawn so far. `hover={false}` on a `Plot` turns it off, for a schematic whose values are not the point.

The projector mirrors the presenter's pointer. Point at the slide in the speaker view and the projector shows a dot there, and every chart's readout with it; point at the projector and the speaker view shows it. The speaker view's upcoming-slide pane never sends. The dot's color and size are the `--sps-pointer-color` and `--sps-pointer-radius` tokens.

Anything else that should answer a pointer reads it with `usePointerOn(slide)`, never the mouse, so that it answers the presenter's too: it gives the position on that slide in slide coordinates, and says whether it is mirrored. `useSlideIndex(ref)` finds the slide an element is on.

### What shows the still

| The still shows | Because |
|---|---|
| In the PDF | `print-pdf` in the URL |
| In the verifier's screenshots | it adds `?sps-verify=still` to the URL |
| With `?still` in the URL | for presenting with no motion at all |
| With `prefers-reduced-motion` set | the viewer asked for it |
| When `T` is pressed | per slide, in every window including the speaker view. Press again to switch back |
| When the live version throws | the slide keeps working, and the verifier fails |

Each figure says which version it is showing, and why, on `data-sps-interactive` and `data-sps-still-reason`. From disk in Safari, `T` reaches the audience window from the speaker view but not the other way; served over http it reaches both.

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
| the PDF and the screenshots show each still | An interactive figure is printed or screenshotted live |
| every live version renders | A live version throws, so its slide falls back to the still |
| each still says what its live version says | A slide's text, with its figures removed, differs between the two versions |
| no console errors or warnings | Anything is logged at error or warning level |

The three checks on interactive figures run only in a deck that has some. Their slides are measured twice: with their stills, which the screenshots and the PDF use, and live, against the same layout checks.

It writes to `report/`: a screenshot of every slide (and `NN-live.png` for each live version), `contact-sheet.png` with all of them at once (failing slides outlined), `deck.pdf`, and `results.json` with per-slide measurements.

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
- `T` switches the current slide's interactive figures between still and live, in every window
- The presenter's pointer, mirrored between the speaker view and the projector, with every chart's hover readout
- PDF export: open `index.html?print-pdf` and print, one page per slide
- Single-file build: scripts, styles, fonts, and imported images are inlined; `public/` files are copied beside it
