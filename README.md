# spa-slides

Presentation slides as React single-page apps: the flexibility and interactivity of the web, with the portability of a PDF.

| Path | What it is |
|---|---|
| `packages/spa-slides/` | The library, `@mk-imagine/spa-slides`. See its [README](packages/spa-slides/README.md) |
| `examples/git-workshop/` | A 35-slide static deck, ported from a Beamer workshop, that exercises the library |
| `tools/verify-deck.mjs` | Opens a built deck from disk in Chromium and checks it |
| `docker/run.sh` | Runs any command in the pinned Node + Playwright container |
| `spike/` | The throwaway spike that chose the stack. Findings in [spike/SPIKE.md](spike/SPIKE.md) |

## Working on it

Nothing is installed on the host. Every command runs in the container:

```sh
docker/run.sh npm ci                                   # install into Docker volumes
docker/run.sh npm test                                 # library unit tests
docker/run.sh npm run typecheck
docker/run.sh npm run build                            # library, then the example deck
docker/run.sh npm run verify                           # check the example deck
EXPOSE_PORT=5173 docker/run.sh npm run dev -w git-workshop-deck -- --port 5173
```

`npm run verify` writes to `examples/git-workshop/report/`: a screenshot of every slide, `contact-sheet.png` with all of them at once, `deck.pdf`, and `results.json`. It fails if any slide overflows, an image is broken, a screenshot placeholder is left, the bundled fonts do not load, the PDF page count does not match the slide count, or the console logs an error or warning.

The built deck is `examples/git-workshop/dist/index.html`. Double-click it.
