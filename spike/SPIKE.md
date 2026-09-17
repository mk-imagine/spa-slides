# Spike: reveal.js 6 + @revealjs/react

Throwaway. Answers "can this stack host real interactive slides?" before building the framework.

## Stack (pinned in `package-lock.json`)

reveal.js 6.0.2 · @revealjs/react 0.2.2 · React 19.3 · Vite 8.3 · vite-plugin-singlefile 2.3 · KaTeX 0.18 · citation-js 0.8.
Everything runs in `mcr.microsoft.com/playwright:v1.63.0-noble` (Node 24), pinned by digest in `run.sh`. Nothing is installed on the host.

## Run

`public/media/` is excluded by the global gitignore, so restore it first:

```sh
mkdir -p public/media
cp ~/Repos/work/dsml_biotech_cert/courses/CSC408/week_5/source/media/w5l1-sigmoid/videos/W5L1_linear_to_sigmoid/1080p60/LinearToSigmoid.mp4 public/media/
docker run --rm -v "$PWD/public/media":/m -w /m mwader/static-ffmpeg:latest \
  -v error -sseof -0.5 -i LinearToSigmoid.mp4 -frames:v 1 -update 1 -y LinearToSigmoid-poster.png
```

```sh
./run.sh npm ci                          # node_modules lives in a Docker volume
./run.sh npm run build                   # dist/index.html + dist/media/
./run.sh npm run verify                  # 24 browser checks against dist/ over file://
EXPOSE_PORT=5173 ./run.sh npm run dev    # http://localhost:5173
```

`report/` gets per-slide screenshots, the speaker-view screenshot, `deck.pdf`, and `results.json`.

## Verified

| Question | Result |
|---|---|
| Single-file build boots from `file://` | Yes. 2.2 MB `index.html` (KaTeX fonts inlined) + `media/` folder |
| Video from `media/` over `file://` | Autoplays on enter, pauses on leave |
| Sim only runs while its slide is showing | 60 ticks/s active, 0 while away, resumes on return |
| Speaker view over `file://` | Works (reveal supports it explicitly). Notes follow navigation |
| Navigating from the speaker view | Drives the audience window |
| Speaker-view previews duplicate sims/video | No. Previews are the deck in `?receiver` iframes; they render the Static variant |
| Print / PDF | Static variants only; 6 pages for 6 slides |
| Pointer on canvas at deck scale 0.642 | Helper gives (190.5, 571.5) for target (190, 570); naive math gives (121.9, 365.8) |
| Arrow keys on a focused slider | Change the slider, not the slide (reveal ignores keys while an `<input>` has focus) |
| Space on a focused button | **Was broken** (reveal advanced the slide and ate the click). Fixed at the interactive boundary |
| Clicker PageDown with a button focused | Still navigates |
| Overflow check | Flags the overfull slide only |
| Lint | Inline `style` and hex colors in `src/slides/**` are errors |
| Types | An interactive without a `Static` variant does not compile |
| Citations | APA inline + reference list from `refs.bib`, formatted at build time |
| Dev server (StrictMode double-mount) | One Reveal instance, one sim loop, no errors |

## Problems found (the framework must own these)

1. **PDF silently truncated to 1 page.** The React root needs `height: 100%; overflow: hidden` for the live deck, but reveal's print CSS only un-clips `html`/`body`. DOM checks all passed; only counting pages in the PDF caught it.
2. **Reveal's print CSS forces `section { padding: 0 !important }`.** Slide padding must live on an inner frame (`lib/Slide.tsx`).
3. **Overfull slides spill onto extra PDF pages** by default. Set `pdfMaxPagesPerSlide: 1` and rely on the overflow check.
4. **reveal.js 6.0.2 types are wrong:** they declare `isPrintingPDF()`, the runtime has `isPrintView()`. Local augmentation in `lib/reveal-augment.d.ts`. Worth reporting upstream.
5. **@revealjs/react 0.2.2 is pre-1.0:** `useReveal()`'s return type points at a nonexistent path and resolves untyped.
6. **The first "overfull" test slide actually fit.** Eyeballed layout claims are wrong often enough that the overflow check needs to run on every build.

## Decisions

- **Requirement mismatch fails the build.** Each deck declares its output target (default: folder, i.e. `index.html` + `media/`). If any interactive component's `requires` exceeds that target, the build fails and names the slide. The verify step already renders every slide, so it can read `data-requires` directly. (2026-09-16)

## Open design questions

- **Slider focus (proposed, not implemented):** PageUp/PageDown always navigate, even while a slider has focus; arrows, Home, and End stay with the slider. Costs large-step PageUp/PageDown on a focused slider.
- **Presenter control of live components:** previews currently show the Static snapshot. Mirroring state (audience window authoritative, speaker view sends intents) is feasible in principle but unverified over `file://`, and a usable control surface likely means our own React speaker view instead of reveal's. Candidate opt-in module; needs its own spike.

## Not tested

Real Chrome on macOS (checks ran in headless Chromium on Linux), a projector or second display, clicker hardware, Web Workers / WASM / Pyodide, served mode, and multi-deck packaging.
