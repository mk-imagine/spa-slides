# Spike 5: a pointer the projector mirrors

The spike for [step 3](interactivity.md#3-hover-and-a-pointer-the-projector-mirrors): can the
presenter point at a slide in the speaker view and have the projector show it, hover included? The
plan listed four unknowns. All four came back better than expected.

**Verdict: yes, exactly, and fast. The mirror adds no measurable error, keeps up with the mouse in
every browser, and needs nothing the library does not already have.**

The probe was a module in the library that sent the pointer from whichever window it was over, in
slide coordinates, on the same two channels the `t` key uses, and drew a dot where it received
one. It also recorded where the point fell in a chart's own coordinates, at both ends. A Playwright
script moved the real mouse over the speaker view's slide pane and read the results, in Chromium,
Firefox and WebKit, from disk and over http, with the audience window both smaller and larger than
the slide's 1920 × 1080. Both have been removed.

## What came back

### Does the speaker view's slide pane receive the mouse?

Yes, in all three browsers. The pane is a full copy of the deck, so the library is already running
under the presenter's mouse, and nothing sits over it.

### Do positions map exactly?

**The mirror adds no error.** The probe moved the mouse to three known points of a chart in the pane
and read back where they landed in the audience window's copy of the same chart:

| | Where the mouse landed in the pane | Where the audience window put it |
|---|---|---|
| Chromium | 4.3 slide px from the target | 4.3 |
| Firefox | 6.2 – 7.4 | 6.2 – 7.4 |
| WebKit | 6.2 – 7.4 | 6.2 – 7.4 |

The two columns agree to within a tenth of a pixel, at both window sizes. The distance from the
target is not the mirror's: the pane draws the slide at a third of its size, so one pixel of the
pane is three on the projector, and the mouse moves in whole pixels. That is the presenter's
precision, and it is plenty to point with.

A pointer sent as a position on the slide (its own 1920 × 1080 space) and drawn inside Reveal's
scaled slide box needs no arithmetic at the receiving end: Reveal's own scaling puts it in the right
place. Reveal scaled with a CSS transform in every case measured, above and below full size; it did
not fall back to CSS `zoom`, which has a history of disagreeing with the coordinate APIs.

### Does the channel keep up?

**Yes, with no loss.** A sweep of 121 mouse moves across the pane arrived as 121 messages in every
browser, from disk and over http:

| | Typical | 95th percentile | Worst |
|---|---|---|---|
| Chromium | 2.4 – 3 ms | 5 – 8 ms | 22 ms |
| Firefox | 2 – 3 ms | 4 – 6 ms | 34 ms |
| WebKit | 0 – 1 ms | 1 – 2 ms | 3 ms |

WebKit from disk delivered on the storage event alone, as [spike 4](interactivity-spike-4.md)
found for the key, and still lost nothing. Everywhere else every move arrived twice, once on each
channel; a position is idempotent, so that is harmless, though a sequence number halves the work.

### Clicks, and Reveal's idle cursor

A click in the pane navigated neither window.

**Reveal hides the cursor in the pane after five seconds still**, as it does in any window running
the deck. A presenter holding the pointer on one spot to talk about it loses their own cursor while
the projector keeps showing the dot. The pane can be told not to: it is the only document with
`receiver` in its URL.

## What this means for the design

- **One pointer for the deck.** A position on the slide, or none, shared by every window. Whichever
  window the mouse is over sends it; the others draw it. The window the mouse is in shows the real
  cursor, not a dot.
- **Hover reads that pointer, never the local mouse.** A chart's readout then appears on the
  projector whether the presenter is pointing at the projector or at the pane, and nothing has to
  be added per chart to make it mirror.
- **Only the current-slide pane sends.** The speaker view's second pane shows what comes next,
  sometimes the next click of the same slide; a pointer there would land on the projector's slide.
  The two panes are told apart by the URLs Reveal gives them (spike 4 recorded both).
- **Leaving the pane clears the pointer**, so the projector's dot goes when the presenter stops
  pointing.
- **The pane keeps its cursor:** no idle hiding in the `receiver` document.

What only the library draws can be mirrored: the dot, chart readouts, highlights. A browser's own
`:hover` styling cannot be replayed in another window, and nothing in a deck should depend on it.
