# Spike 3: the cross-window toggle, and what drift can be checked

Two items [spike 2](interactivity-spike-2.md) left open: the manual override reaches only the
window it is pressed in, and nothing catches the still and the interactive version drifting apart.

**Both are tractable. The toggle is a small fix that works even from disk, which is not what the
platform rules suggest, and drift is checkable on the part that matters.**

## The toggle

### It works, and the obvious reasoning about why it could not is wrong

The deck is distributed as a single file opened from disk, and `file://` documents get an **opaque
origin** — `window.origin` is the string `"null"`. BroadcastChannel and `localStorage` are both
origin-scoped, so the expectation is that neither reaches across two such documents and the toggle
has to be carried some other way.

Measured, in Chromium, both of them do reach:

| | `file://` | `http://` |
|---|---|---|
| `window.origin` | `"null"` | the real origin |
| BroadcastChannel delivered | **yes** | yes |
| `storage` event delivered | **yes** | yes |
| Scripted access to another document | **no** | yes |

Chrome keeps a shared storage partition for `file://` documents even though it refuses them
scripted access to each other. The two capabilities are not the same gate, and conflating them is
what makes this look impossible.

End to end with the real deck, from disk: pressing the key in one window flipped the other, which
reported hearing it on both channels.

### Use BroadcastChannel, not postMessage

postMessage was the mechanism that looked most likely to survive an opaque origin, because it does
not require one. It is useless here anyway: the audience window has **no window references at
all** — no opener, no frames, nothing to send to. A deck window does not hold a handle on the
speaker view.

So: BroadcastChannel, with the `storage` event as a fallback for anywhere it is unavailable.

### What is still not proven

Chromium only. Firefox and Safari were not tested, and this is exactly the kind of behavior that
differs between them. The verifier runs Chromium and a presenter chooses their own browser, so it
is worth checking before the key is documented as reliable.

The speaker view's preview frames also cannot be *read* from a `file://` page, so a probe cannot
confirm they received the toggle — only that the mechanism reaches other documents of the same
kind. Confirming it directly needs the deck over http.

## Drift

Only the slide's **prose** has to match between the two versions. The figure is allowed to differ:
that is the whole point of authoring a still rather than freezing a frame.

That makes the check simple, because the library's own structure already draws the boundary.
Removing `svg`, `.sps-figure` and `.sps-chart` from a slide's body leaves its argument and drops
the chart's labels, ticks and legend. Run over the talk's slides as they stand:

| Slide | All text | Prose after removing figures |
|---|---|---|
| What one layer can't do | 1312 | 1171 |
| Two measures | 857 | 571 |
| Note: a linear network | 1411 | 1306 |
| Two checks | 677 | 409 |

What it drops is what should be allowed to drift — axis labels, legend entries, a figure's own
caption. What it keeps is the claim the slide is making.

So the check is: render an interactive slide both ways, take the prose of each, and fail if they
differ. It does not need to understand either version.

### The stronger form, where a slide can manage it

Prose that lives *outside* the switch is authored once and shared, so it cannot drift at all. A
slide that wraps only its visual gets this for free and the check has nothing to compare. The
check earns its keep on slides that need different prose around the still — which the talk has,
since some of its static alternatives are a different composition rather than a different
rendering.

## What this leaves for step 2

- Carry the toggle on BroadcastChannel with a `storage` fallback; confirm on a second browser
  before calling it reliable.
- Check prose equality between the two versions, with figures excluded.
- Encourage the shared-prose shape, where only the visual sits inside the switch, because it makes
  the check moot rather than merely passing.
