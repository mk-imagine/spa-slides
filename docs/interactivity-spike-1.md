# Spike 1: a playhead driven by build steps

Step 1 of [the interactivity plan](interactivity.md). The question was whether *steps are the
skeleton, the clock is the flesh* survives contact: if the build step is the authoritative
position and a clock only animates between steps, do the speaker view, print and the verifier
inherit correctness from the step machinery?

**Verdict: the design holds, and one of the four places it was supposed to protect is broken
anyway.** The break is in the verifier, it is fixable in the library rather than per slide, and
finding it is what this spike was for.

The spike was a throwaway slide in the example deck: forty precomputed frames, four keyframes,
a 600 ms glide between them, reporting its own state for a probe to read. It has been removed.

## What was asked, and what came back

### Which key drives play/pause, given Reveal owns space and the arrows?

Measured by pressing each candidate on a mid-deck slide and watching whether Reveal's position
moved:

| | |
|---|---|
| **Consumed** | space, `p`, `n`, `h`, `j`, `k`, `l`, Shift+space, Alt+space |
| **Free** | `m`, `g`, `t`, `r`, `w`, `q`, `e`, `i`, `u`, `a`, `d`, `z`, `x`, `c`, `v`, Enter, Backspace, Tab |

Reveal takes the vim-style navigation keys as well as the obvious ones, which rules out the two
media conventions — space and `k`. The probe cannot see keys whose effect is not a position
change (`s`, `f`, `b`, `o` are documented Reveal bindings and must be treated as taken however
they measure).

**But the more useful answer is that the question mostly dissolves.** Under this design the
clicker advances keyframes and the clock animates between them on its own, so the basic case
needs no key at all. A play/pause key is only wanted for free-running playback through several
keyframes, which is a rarer thing than the plan assumed. Whatever it ends up being, it must also
not be something a presenter's clicker emits — clickers send page up/down, arrows, and sometimes
`b`.

### Does the speaker view follow?

Yes. Advancing with the arrow key **in the speaker view** moved the audience window's step and
the playhead glided to the correct keyframe. Nothing had to be synchronized: the state is derived
from the fragments Reveal already mirrors.

One caveat the design accepts rather than solves: the two windows run their own clocks, so they
agree *at* keyframes and can differ mid-glide. That is the right trade, but it should be said out
loud.

Not confirmed: whether the speaker view's own preview renders the identical frame. Its iframes
are an opaque origin under `file://`, so the probe could not read into them. Confirming that
needs the deck served over http.

### Does `?print-pdf` freeze?

Yes — the playhead landed on the last keyframe with nothing in flight, exactly as the plan
predicted, because Reveal shows every fragment in print and the step therefore reads as its
maximum.

**But only because the spike component checked for print itself.** That check is the kind of
thing a slide will forget, and a slide that forgets it animates during export. It belongs in the
library.

### Can the verifier land on the hold deterministically?

**No, and this is the finding.** The verifier screenshots as soon as a step lands, without
waiting for anything the slide is doing. Running the real verifier over the spike slide, the
playhead was captured at frame 0 at steps 0, 1 *and* 2 — the glide had not started. Its
`label-overlap` check fired as a side effect, on labels that do not overlap once the slide
settles.

So a slide with any animation at all makes the deck's own gate non-deterministic: the
screenshots, the measurements and the PDF all record a state the audience never sees.

## What this changes in the plan

**The freeze is an environment decision, not a slide's.** Print and verification are both
"no clock" conditions, and a component must not have to know it is in one. The library should
carry a single frozen condition — print, the verifier, and `prefers-reduced-motion` — that every
timeline reads, snapping to its target instead of gliding.

Snapping beats having the verifier wait for animations to settle: it is deterministic rather than
merely slower, and it needs no protocol between the deck and the tool.

`hold` is still needed, but its job narrows. It chooses *which* position is authoritative; it does
not also have to mean "and stop moving".

## A trap worth writing down

**An appendix slide is not addressable by its DOM index through the location hash.** The spike
slide started out `appendix`, and driving it by hash silently measured the wrong slide, twice,
before the cause was clear. `spa-slides verify` drives slides by DOM index and the example deck
has appendix slides, so this is worth a closer look when the verifier grows a hold hook.

Related, and already known from the verifier's own source: navigating **backwards** into a slide
shows all of its fragments, so resetting to step 0 means entering from before the slide, not
returning to it.

## Where step 2 starts

The design survives, so the timeline primitive is worth building. It should land with the frozen
condition in place from the beginning, because until it exists every interactive slide quietly
degrades the checks that are supposed to catch problems.
