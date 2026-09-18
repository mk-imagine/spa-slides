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
3. **Held.** The slide declares the position the PDF and the verifier should see.

Addressability is the load-bearing one, and it is worth being stubborn about. If state can only
be reached by playing forward, then print has to simulate, the verifier has to simulate,
scrubbing backwards is impossible, and re-entering a slide from the next one shows the wrong
thing. If any position is directly addressable, all four fall out for free. It is the same trick
as counting visible fragments: derive the state from a position, never accumulate it from events.

This is why a **data replay and a live simulation should look identical from the outside**. One
reads `frames[i]`; the other computes and memoizes. The timeline should not be able to tell them
apart, and neither should print.

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
and explicitly *not* part of what print or the verifier sees — except through the declared hold.

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

### 2. The timeline primitive

Generalize the spike into the library: the position/source split, `hold`, and the replay source.
Migrate the seven data-replay slides (12, 17, 19, 21, 23, 30, 32), which are the largest group and
the least risky.

### 3. Spike: a live model

**The linear-network slide (26)** — two networks training side by side. The biggest unknown in
the whole plan.

- Chunked compute that does not block the render, and does not depend on frame timing for its
  results.
- A seed that makes a run reproducible, and a reset that returns to it.
- `at(i)` on a source that has not computed frame *i* yet: compute-through, and accept that
  print may block briefly, because print is not latency-sensitive.
- Whether a worker is needed, or whether chunking on the main thread is enough at this size.

### 4. The simulation source

Generalize, and migrate the live-simulation slides (7, 8, 10, 26).

### 5. Spike: direct manipulation

**The nonlinear-network slide (11), and its draggable S-curve.** Different in kind: no time axis,
so it tests whether the contract holds for state that comes from a gesture. A control value is a
position like any other, and it needs a declared default that print and the verifier see.

### 6. Controls, and the rest of the deck

The explorer (27) and the scripted animation (28), which should both fall out of the primitives
by this point. If they do not, the primitives are wrong.

### 7. Make the verifier enforce it

The checks that stop this decaying:

- Every slide with an interactive source declares a `hold`.
- The PDF page for such a slide matches its held state, so a frozen slide cannot silently print
  mid-animation.
- No slide is still animating when the verifier screenshots it.

By the same reasoning as the `references-cited` check: a claim the tooling enforces stays true,
and a claim in a comment does not.

## What must not break

- **The static alternative.** Every dynamic visual in the talk already has a designed static
  figure, and those serve the PDF and a failed laptop. Interactivity is
  additive. Where the held frame says the same thing as the designed figure, the figure can
  retire; where the designed figure is a genuinely different composition, both stay and the
  slide declares which one print gets.
- **`--expect-slides`.** Interactivity must not change the slide count.
- **Determinism.** Seeds are pinned and checked in, as the talk's seed-finding script already
  does for its toy network.

## Open questions

| Question | Settled by |
|---|---|
| Which key plays and pauses without fighting Reveal? | Spike 1 |
| Does the speaker view need its own sync channel, or do fragments suffice? | Spike 1 |
| Does the verifier need a hold hook, or can it drive steps as it already does? | Spike 1 |
| Main thread or worker for a live model? | Spike 3 |
| Does a gesture-driven control fit the same contract as a timeline? | Spike 5 |
| Do held frames let the hand-built static alternatives retire? | Step 2, per slide |

## Cost, honestly

Steps 1–2 are worth doing regardless: they pay for themselves across seven slides and carry the
least risk. Step 3 is the one that could prove expensive, and it is worth knowing before starting
it that the linear-network slide's static alternative already works. If the live version costs
more than it teaches, stopping after step 2 leaves the deck better than it is now and the library
with a timeline it can use.
