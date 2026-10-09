# Interactivity: a plan

How spa-slides grows from decks that *build* to decks that *run* — live models, scrubbable
replays, and widgets the presenter drives — without giving up the two things that make the
library worth using: a deck is a single file you can open anywhere, and `spa-slides verify`
can tell you it is not broken.

This is a plan, not a specification. Each step below ends in something running, and the step
after it is designed from what that taught us rather than from this document.

## Where the slide numbers come from

Every slide number below belongs to a **staged-introduction talk**, a deck built with this library
from a psychology research project. It is not the example deck in this repository, and the library
does not depend on it: nothing here may make the library need that deck to build or to pass.

Each slide is named as well as numbered, because the numbers belong to a document this repository
does not control. The static version of that deck is finished, so they should hold; the names are
what survives if it ever grows a slide in the middle.

It earns its place in this plan because it is the only thing that has asked for any of this.
Fourteen of its slides are waiting on capabilities the library does not have — live models,
scrubbable replays, an explorer, a draggable widget — and designing against slides that exist
keeps the primitives honest in a way that designing against imagined ones does not. Where a step
below names a slide, it is naming a concrete case the design has to satisfy.

That deck is also the reason the four-places problem below is not hypothetical. It exports a PDF,
it is presented from a speaker view, and it is checked by `spa-slides verify` on every change.

## Why this is not just "add some animation"

A slide that animates is easy. A slide that animates **and** survives the four places a deck has
to work is not:

| Where | What it needs |
|---|---|
| The audience window | The thing the talk is about |
| The speaker view | A second window, its own DOM, showing the same state |
| The PDF export | No motion at all, frozen somewhere meaningful |
| `spa-slides verify` | A deterministic state it can screenshot and measure |

Most presentation tooling solves the first and gives up on the rest. The reason this library can
have all four is that **it already solved them once**, for builds.

## The precedent: how builds already work

`StepProvider` does not listen for Reveal events. It renders invisible `.fragment` markers, and
counts how many Reveal has marked `visible`:

```tsx
const read = () => setStep(container.querySelectorAll(`.${STEP_MARKER_CLASS}.visible`).length);
const observer = new MutationObserver(read);
```

Watching the DOM rather than the events is what makes it correct in all four places at once.
Reveal marks those fragments visible in the audience window, in the speaker view's previews, when
you navigate *backwards* into a slide, and in print — where it shows them all, so a printed slide
lands on its final build with no special case.

**This is the model to extend, not to sit beside.** Anything that re-solves speaker-view sync and
print freezing in its own way will get one of the four cases wrong, and the case it gets wrong
will be the PDF, because that is the one nobody looks at until the morning of the talk.

## The contract

Every interactive slide, whatever it does, exposes state that is:

1. **Addressable.** You can ask for the state at position *p* without having played through to
   it. Not `advance()` — `at(p)`.
2. **Deterministic.** The same *p* and the same seed give the same state, on any machine, with no
   dependence on wall-clock time or on how long the presenter lingered.
3. **Backed by a still.** The slide authors a static version, and that is what print and the
   verifier render.

Addressability is the load-bearing one, and it is worth being stubborn about. If state can only
be reached by playing forward, then print has to simulate, the verifier has to simulate,
scrubbing backwards is impossible, and re-entering a slide from the next one shows the wrong
thing. If any position is directly addressable, all four fall out for free. It is the same trick
as counting visible fragments: derive the state from a position, never accumulate it from events.

This is why a **data replay and a live simulation should look identical from the outside**. One
reads `frames[i]`; the other computes and memoizes. The timeline should not be able to tell them
apart.

The third clause used to say the slide declares a position to freeze at, and print renders that.
[Spike 2](interactivity-spike-2.md) retired it: for the slides this is being built for, no frame
of the animation is the right still. One talk slide's static version puts two finished curves
beside a table of final outputs — a comparison that exists in no frame of the live version, and
that no freeze can produce. The still is a separate, authored thing, and making it mandatory is
free, because every slide in question is static today.

## The layers

Four pieces, each usable alone. A slide takes only what it needs.

```
  position ──▶ source ──▶ state ──▶ marks
     ▲
  controls
```

**Position.** Where we are: a step, a frame index, a control value. Serializable, and derived
from Reveal's fragments wherever it can be, so it inherits the four-places correctness.

**Source.** `at(position) => state`. Three implementations, one interface: a replay over
precomputed frames, a simulation that computes lazily, and a script (keyframes plus easing).

**Controls.** Play/pause, scrub, reset, and direct manipulation. Presenter-facing, transient,
and never seen by print or the verifier, which render the still instead.

**The still.** What print, the verifier, reduced-motion and a failed interactive version all get.
Authored beside the live one rather than captured from it.

**Marks.** The existing chart primitives. They already take data and draw it; nothing here
changes them.

### Steps are the skeleton; the clock is the flesh

A free-running clock is the tempting design and the wrong default. Reveal owns the arrow keys,
the speaker view is a separate window whose clock would drift, and print has no clock at all.

Instead: **the clicker advances keyframes, and the clock animates between them.** The step is
the authoritative position — it syncs, it survives back-navigation, it prints, the verifier
already drives it. The clock is a presentation detail between two steps, and in print and
verification it simply does not run, so the slide lands exactly on the keyframe.

Free play and scrubbing then become what they should be: presenter conveniences layered on top,
not the mechanism the deck's correctness depends on.

## The steps

Each is gated on `npm run build && npm test && npm run lint && npm run verify` staying green on
the example deck in this repository, plus a look at the screenshots.

Spikes are numbered in the order they run, not by the step that asks for them: step 1 took three,
and step 2 one more. The spikes still ahead are named for what they test.

The talk is gated too, but it is checked where it lives, because the library cannot depend on it.
A step is not finished until its checks pass there as well, and a failure on the talk stops the
next step exactly as a failure here does. The difference is where the command runs, not whether
it counts.

### 0. This document

Agree the contract and the layering before writing the API.

### 1. Spike: the clock, on one slide

**The gap chart (17), and a playhead over it** — a precomputed replay, so the timeline is tested
without the compute problem confusing the result.

The real unknowns, in the order they can bite:

- Which key drives play/pause, given Reveal owns space and the arrows?
- Does the speaker view follow, or does it need its own channel?
- Does `?print-pdf` freeze, or does every slide start animating at once?
- Can the verifier land on the hold deterministically, and does it need a new hook to do it?

Throwaway code. The output is answers, and a decision on whether the step-as-skeleton design
survives contact.

**Done.** The design survives; the verifier does not. See
[the findings](interactivity-spike-1.md), which move the freeze out of each slide and into the
library, where print, the verifier and reduced-motion are one condition rather than three.

### 2. The timeline primitive

Generalize the spike into the library: the position/source split, `hold`, and the replay source.
Migrate the seven data-replay slides (12, 17, 19, 21, 23, 30, 32), which are the largest group and
the least risky.

**The library half is done.** What landed, and what it changed:

- `<Interactive still>` switches a figure between its authored still and its live version, and
  says which and why on the page. The still is a required prop, so a slide cannot have one without
  the other.
- `useTimeline(keyframes)` is the position: one keyframe per step, a glide forward one step,
  landing at once otherwise and whenever motion is not allowed. There is no separate `hold`: a
  keyframe is where the timeline holds. It runs only inside a live version, so anything that moves
  has a still.
- `replay(frames)` and `trace(points)` are the first sources. Neither the timeline nor a mark can
  tell them apart from a simulation, which is the point.
- `t` switches the slide on screen in every window. [Spike 4](interactivity-spike-4.md) found how
  it has to be bound to work from the speaker view, and how far it reaches outside Chromium.
- The verifier measures slides with interactive figures twice: with their stills, which the
  screenshots and the PDF use, and live, for the same layout checks. It fails a live version that
  threw, a PDF that shows a live version, and text that differs between the two.

The verifier also had a race that animation would have exposed: it waited for Reveal to mark a
step's fragments, not for React to render the step. The step engine now publishes the step it has
rendered, and the verifier waits for both.

**The talk's half is done too**, in its own repository and passing its gate, and two of the seven
slides turned out not to be what the plan assumed:

- **12, general before specific.** The talk's outline asked for a map of each item's internal
  pattern as a dot, splitting apart over training. Measured on a control run, it cannot be drawn
  faithfully: the items do not start together, and every 2-D projection tried squashes the item
  level, showing two siblings converging while the network pulls them apart. The slide animates the
  chart it already showed instead, decoded from the report that chart came from.
- **21, back to the opening question.** Not a replay at all: the outline's replay for it was
  optional, and its still was never built. It became highlights instead, one condition per click.
  They are the live version of its figures, not builds, because a build's last state is what prints.

The other five replay their stills' own data. One needed data the deck did not hold: slide 19's clock
switch moves every sample to its exact place on total training.

### 3. Hover, and a pointer the projector mirrors

Pulled forward from the controls step, because the talk wants it now: a chart that answers a hover
with its values, as Plotly's do, and a projector that shows where the presenter's pointer is in the
speaker view, hover and all.

Built into the library's own charts rather than by adopting Plotly. The full Plotly bundle is about
6 MB and the basic one 1.2 MB, against a talk deck of 1.8 MB in all; its charts would not look like
the deck's other thirty; and the verifier's chart checks are built around the library's marks.

The two are one feature. A chart's hover should follow *the pointer* (the local mouse, or the
presenter's mirrored one) from the start. Hover built per window first would have to be retrofitted
into every chart that has it. Only what the library draws can be mirrored: readouts, highlights, the
pointer itself. A browser's own hover styling cannot be replayed in another window.

The speaker view's current-slide pane is a full copy of the deck, so the library is already running
under the presenter's mouse there. The unknowns, for a spike:

- Does that pane receive pointer events at all, or does something sit over it?
- Do positions map exactly between the pane and the audience window, through Reveal's scaling,
  in the slide's own 1920 × 1080 coordinates?
- Does the channel the `t` key uses keep up at pointer-move rates, including the storage-event
  fallback WebKit needs from disk?
- How does it meet Reveal hiding an idle cursor, and a click, which must not navigate?

Hover never reaches the PDF or the screenshots, so it adds nothing a still has to show. The verifier
should still exercise it, since a readout near the edge of a slide can overflow it. Slides 12 and 21
are the first to use it.

**Built.** One pointer for the deck, in slide coordinates, sent by the audience window and the
speaker view's current-slide frame and drawn as a dot wherever the mouse is not; `usePointerOn`
gives it to anything that should answer it. Every chart answers it with a readout, on by default:
values and ranges on a bar, anywhere along its row; the nearest lines at the pointer's x elsewhere,
with their bands' ranges. Marks report what they have drawn, so a chart needs nothing added, and a
replay answers only for what it has drawn so far. The talk names a few marks and turns the readout
off on four schematics.

Before it, step 2's replays became library structures: `reveal` on a Plot that every mark follows,
`<Playhead>`, `<Replay>` for the common case, `useStepValue`, and `sps-dimmed`. The talk's figures
lost their hand-rolled replay code to them.

Not yet: the verifier does not hover, so a readout that overflows a slide near its edge would pass.
WebKit from disk carries the pointer only from the speaker view to the projector, as spike 4 found
for the key.

### 4. Spike: a live model

*The live-model spike.*

**The linear-network slide (26)** — two networks training side by side. The biggest unknown in
the whole plan.

- Chunked compute that does not block the render, and does not depend on frame timing for its
  results.
- A seed that makes a run reproducible, and a reset that returns to it.
- `at(i)` on a source that has not computed frame *i* yet: compute-through, and accept that
  print may block briefly, because print is not latency-sensitive.
- Whether a worker is needed, or whether chunking on the main thread is enough at this size.

### 5. The simulation source

Generalize, and migrate the live-simulation slides (7, 8, 10, 26).

### 6. Spike: direct manipulation

*The direct-manipulation spike.*

**The nonlinear-network slide (11), and its draggable S-curve.** Different in kind: no time axis,
so it tests whether the contract holds for state that comes from a gesture. A control value is a
position like any other, and it needs a declared default that print and the verifier see.

### 7. Controls, and the rest of the deck

The explorer (27) and the scripted animation (28), which should both fall out of the primitives
by this point. If they do not, the primitives are wrong.

### 8. Make the verifier enforce it

The checks that stop this decaying:

- Every interactive slide authors a still, and the PDF contains the still, not a frame.
- The interactive version is checked too, in its own pass, so it cannot overflow, collide labels
  or render blank while the checks look at its twin.
- A slide showing its still because the interactive version threw is a failure, not a pass.

By the same reasoning as the `references-cited` check: a claim the tooling enforces stays true,
and a claim in a comment does not.

**Done in step 2.** Spikes 1 to 3 showed that a timeline without these checks quietly degrades the
gate meant to catch it, so they landed with the timeline rather than after it. Steps 3 to 7 add
sources and controls, and each should leave these checks passing rather than add to them.

## What must not break

- **The static alternative.** Every dynamic visual in the talk already has a designed static
  figure, and those serve the PDF and a failed laptop. They do not retire: they become the
  required still, and the interactive version is added beside them. That is what makes this
  additive — no step of this plan can leave the printed deck worse than it is now.
- **`--expect-slides`.** Interactivity must not change the slide count.
- **Determinism.** Seeds are pinned and checked in, as the talk's seed-finding script already
  does for its toy network.

## Open questions

| Question | Settled by |
|---|---|
| Which key plays and pauses without fighting Reveal? | Spike 1: mostly moot, since the clicker advances keyframes |
| Does the speaker view need its own sync channel, or do fragments suffice? | Spike 1: fragments suffice |
| Does the verifier need a hold hook, or can it drive steps as it already does? | Spike 1, then step 2: it drives steps, and timelines land on keyframes when it announces itself |
| Main thread or worker for a live model? | Open: the live-model spike (step 4) |
| Does a gesture-driven control fit the same contract as a timeline? | Open: the direct-manipulation spike (step 6) |
| Does the static/interactive override cross windows? | Spike 3: yes, on a BroadcastChannel, even from disk |
| How is drift between the two versions caught? | Spike 3: prose equality, figures excluded |
| What key toggles the still, and is it safe in the speaker view? | Spike 4: `t`, bound through Reveal; it navigates nothing |
| Does the toggle work outside Chromium? | Spike 4: Firefox yes; WebKit over http, and from disk only from the speaker view |

## Cost, honestly

Steps 1–2 are worth doing regardless: they pay for themselves across seven slides and carry the
least risk. Step 4 is the one that could prove expensive, and it is worth knowing before starting
it that the linear-network slide's static alternative already works. If the live version costs
more than it teaches, stopping after step 2 leaves the deck better than it is now and the library
with a timeline it can use.
