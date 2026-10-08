# Spike 4: the toggle key, in the speaker view and outside Chromium

Two questions [spike 3](interactivity-spike-3.md) left open: which key switches a slide to its
still, and whether it is safe to press in the speaker view; and whether the cross-window toggle
works outside Chromium.

**Verdict: `t`, bound through Reveal rather than listened for, works from either window. Firefox
behaves like Chromium. WebKit carries it over http, and from disk only from the speaker view to the
projector.**

The probe was a key binding added to the example deck and a Playwright script that pressed the key
in each window and recorded which documents heard it, in Chromium, Firefox and WebKit, from
`file://` and over http. Both have been removed.

## The key has to go through Reveal

The speaker view does not pass key presses on as key presses. It forwards each one to its
current-slide frame by calling `Reveal.triggerKey`, which runs Reveal's handler directly, so no
`keydown` event fires in that frame. A document listener never hears a key pressed in the speaker
view, and in the audience window, where real events do fire, a listener and a binding would both
run and switch the slide twice.

| Key pressed in | Reveal's binding runs in | A `keydown` listener fires in |
|---|---|---|
| the audience window | the audience window | the audience window |
| the speaker view | the speaker view's current-slide frame | nowhere the deck runs |

So the toggle is a Reveal key binding (`addKeyBinding`, which also lists it in Reveal's `?` help),
and whichever document runs it tells the others. Reveal's handler drops bound keys while the screen
is paused (`b`, `.`) and while an overlay is open, which is the right behavior here too.

`t` moved neither window's position in any of the three browsers, pressed in either window. It is
not one of Reveal's bindings ([spike 1](interactivity-spike-1.md)), and presenter clickers send page
up/down, arrows, `b` and `.`.

## Which windows hear it

Measured with the binding sending on a BroadcastChannel and writing to `localStorage`, and every
window recording which of the two reached it:

| | Chromium | Firefox | WebKit |
|---|---|---|---|
| speaker view → audience, from disk | both | both | storage only |
| speaker view → audience, over http | both | both | both |
| audience → speaker view, from disk | both | both | **neither** |
| audience → speaker view, over http | both | both | both |
| two unrelated windows, from disk | both | both | **neither** |
| two unrelated windows, over http | both | both | BroadcastChannel only |

Firefox confines each `file://` document to its own origin and delivers both anyway, so origin
rules predict this table no better than they predicted spike 3's. WebKit is the only browser where
opening the deck from disk matters, and even there the direction a presenter needs most still
works: pressing the key at the lectern because the projector looks wrong.

Sending on both channels and listening on both covers every cell that has any channel at all.

## Send the state, not the change

The probe's first version sent "flip", and it reported the speaker view failing to reach the
audience window when it had in fact reached it. The speaker view had been opened after the first
press, so its frame started from the default, flipped to the state the audience window was already
in, and told it so.

That is the bug a presenter would meet: open the speaker view late, press the key, and watch the
two windows swap rather than agree. So every message carries the whole state, which slides are
switched, and a window that opens asks the others for it. Applying the same state twice changes
nothing, which is also why the two channels need no deduplication.

## What step 2 built from this

- `t` switches the slide on screen, and only that slide. A presenter pressing it because one figure
  misbehaves should not find every later slide switched too.
- It is bound through Reveal, sends the whole state on both channels, and a window that opens asks
  for it.
- The integration tests press it in the speaker view and check the audience window follows, and
  open a window after a press and check it agrees. They run in Chromium only, like the verifier.

WebKit from disk stays one-directional. A presenter on Safari who needs the speaker view to follow
the audience window should serve the deck over http.
