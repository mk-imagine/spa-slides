# spa-slides

Presentation slides as React single-page apps: the flexibility and interactivity of the web, with the portability of a PDF.

| Path | What it is |
|---|---|
| `packages/spa-slides/` | The library, `@mk-imagine/spa-slides`. See its [README](packages/spa-slides/README.md) |
| `examples/git-workshop/` | A 35-slide static deck, ported from a Beamer workshop, that exercises the library |
| `docker/run.sh` | Runs any command in the pinned Node + Playwright container |
| `spike/` | The throwaway spike that chose the stack. Findings in [spike/SPIKE.md](spike/SPIKE.md) |

## Working on it

Nothing is installed on the host. Every command runs in the container:

```sh
docker/run.sh npm ci                                   # install into Docker volumes
docker/run.sh npm test                                 # library tests, including the verifier against a fixture deck
docker/run.sh npm run typecheck
docker/run.sh npm run build                            # library, then the example deck
docker/run.sh npm run lint                             # design rules on the example deck
docker/run.sh npm run verify                           # check the built example deck
EXPOSE_PORT=5173 docker/run.sh npm run dev -w git-workshop-deck -- --port 5173
```

`lint` and `verify` are the library's `spa-slides` command; see the [library README](packages/spa-slides/README.md#checking-a-deck) for what they check. `verify` writes screenshots, a contact sheet, the PDF, and `results.json` to `examples/git-workshop/report/`.

The built deck is `examples/git-workshop/dist/index.html`. Double-click it.
