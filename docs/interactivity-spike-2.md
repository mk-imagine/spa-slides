# Spike 2: switching between the static and interactive versions

Follows [spike 1](interactivity-spike-1.md), which found that freezing an interactive slide is
not enough. This spike tests the mechanism that replaces it: every interactive slide authors a
static fallback, and something decides which one renders.

**Verdict: the mechanism works, and the obvious way to detect print is wrong.**

The spike was two throwaway slides in the example deck — one whose interactive version behaves,
one that throws on purpose. Both have been removed.

## Why a fallback rather than a frozen frame

Spike 1 assumed a slide could be frozen at a chosen position and that the still would serve print.
For the slides this is being built for, it often cannot. The talk's static alternative for one of
them is

> Two finished learning curves on one chart... Beside them, a small table of each network's final
> output for the three trial types, against the target.

That table appears in **no frame** of the live version. The animation shows one network failing
while the other succeeds over time; the still shows both finished, plus a comparison that never
exists during playback. No freeze produces it.

The practical argument is stronger still: **the fallbacks already exist.** Every slide this plan
targets is static today, and the talk's outline already requires a designed static alternative for
every dynamic visual. Making the fallback mandatory is therefore *additive* — no migration step
can make the printed deck worse than it is now.

## What renders which

| Condition | Renders | How it is detected |
|---|---|---|
| Presenting | interactive | nothing matched |
| Print | fallback | `print-pdf` in the query |
| The verifier | fallback | a flag the verifier appends |
| `prefers-reduced-motion` | fallback | media query |
| `?static=1` | fallback | query, for forcing it by URL |
| A key | fallback | toggles while presenting |
| The interactive version threw | fallback | an error boundary |

All seven were measured. Each reports why it switched, which matters: "showing the static one" and
"showing the static one *because the interactive one crashed*" are very different states to be in
ten minutes before a talk.

## The finding: print detection cannot be a one-shot read at mount

The natural check is `document.documentElement.classList.contains('reveal-print')`. It does not
work here. **Reveal adds that class after the deck boots**, so a component that reads it once on
mount sees nothing and renders the interactive version straight into the PDF.

The spike did exactly that and printed the wrong version. The query string is present from the
first paint, so asking it first is reliable:

```tsx
if (params.has('print-pdf') || document.documentElement.classList.contains('reveal-print')) return 'print';
```

Spike 1 did not hit this only by luck: its print check happened to sit inside an effect that ran
later, after Reveal had added the class.

## The verifier has to announce itself

Print is detectable and reduced-motion is detectable. The verifier is not: it is headless Chromium
loading the same file as anyone else, with nothing to distinguish it. It has to say so.

It already appends `?transition=none&backgroundTransition=none`, so one more flag costs nothing
and keeps the knowledge in the tool rather than in a heuristic that guesses at user agents.

## The error boundary works, and stays loud

A throwing interactive version swapped to its fallback and the deck kept working — the slide
rendered its still rather than going blank. The error is still written to the console, so the
verifier's existing "no console errors" check fails on it. It cannot hide during development, and
it cannot ruin a talk.

## What is still open

**The override does not cross windows.** The key toggle is per-window React state, so pressing it
in the audience window will not move the speaker view, and vice versa. Fragments sync because
Reveal mirrors them; this does not. Either the override rides on something Reveal syncs, or the
speaker view needs telling separately. Worth settling before the key is offered to presenters.

**The key is provisional.** `t` is free of Reveal's own bindings, but was not tested inside the
speaker view, and must not be something a presenter's clicker emits.

**Both versions still need checking.** If print and the verifier only ever render the fallback,
the interactive version is never exercised, and could overflow, collide labels or render blank
with every check passing. The verifier needs two passes over an interactive slide: the fallback
for the canonical screenshot and the PDF, and the interactive version for the structural checks.

**Drift is unsolved.** Two authored artifacts can come to say different things and no tool can
check that they agree. The fallback should at least derive from the same data and seed, so they
cannot disagree about numbers; showing both side by side in the contact sheet would make the rest
visible.
