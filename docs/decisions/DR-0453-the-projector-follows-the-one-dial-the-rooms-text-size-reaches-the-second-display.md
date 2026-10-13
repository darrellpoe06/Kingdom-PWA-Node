# DR-0453 — The projector follows the one dial: the room's text size reaches the second display

- **Status:** accepted
- **Tier:** A (completes a shipped feature for the case it matters most in; layout only, no schema, no money)
- **Date:** 2026-09-17
- **Type:** app
- **Scope:** `app/src/components/Presenter.jsx` (the broadcast payload carries `slideScale`; a size change re-sends at once), `app/src/components/AudienceWindow.jsx` (the projector applies it and holds it across a blank), `app/src/__tests__/the-room-sets-its-own-size.test.jsx` (3 tests appended, 23 total)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), NOTHING-WAITS (DR-0236), APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)
- **Grounds:** DR-0451 (the room's size primitive and its control on the presenting screen — this closes that record's own stated limit), DR-0438 §1 (chrome never grows with the text), the 2026-07-19 top-alignment note in `AudienceWindow.jsx` (on an LED wall the speaker stands below the words)

## Why this exists

DR-0451 gave the room's text size a dial on the presenting screen, in answer to Darrell's report of 2026-09-17: *"Need to be able to work the text sizes on the PowerPoint."* Its own Limits section named what it had not done:

> "**The audience window (`?audience=1`) does not yet carry the room's size** — it renders the same `AudienceSlide`, so it is *ready* to, but nothing sets `--slide-scale` there and a second display keeps the default. A projector is exactly where a large step matters most."

That is backwards for the one case the feature is for. A phone held up is a stopgap; a projector across a hall is the real room. This closes it rather than waiting for the dated re-review (DR-0236: what can be built and verified now is built now).

## The decision

**The projector gets no control of its own — it follows the speaker's.** Nobody is standing at the projector, so a second dial there would be a control no hand can reach during a service. The size rides the slide the projector is already following, over the same BroadcastChannel, so one dial moves both screens at once.

Three properties make it safe:

1. **A payload without a scale renders at 1.** An older presenter, a hold, or any slide that never carried the field leaves the window exactly as it has always been.
2. **A size change re-sends immediately.** `slideSize.scale` joins `idx`, `age` and `reveal` in the broadcast effect, because the room's size is part of what the second screen is showing. A speaker enlarges the words precisely because the back row cannot read *this* slide, and waiting for the next one would be useless.
3. **Blanking the screen does not snap the room back.** A hold carries no scale, so the window holds the last size it was told. The choice belongs to the session, not to one slide.

The value is read through a ref inside the broadcast callback, so changing the size does not re-create `sendCurrent` and re-fire every effect that depends on it.

## Verification

- **3 tests appended to `the-room-sets-its-own-size.test.jsx`** (23 total): the payload carries the scale and is read through a ref; the size is named in the broadcast effect so a change does not wait for the next slide; the projector publishes the variable only for a real, positive, non-default number; and a blank does not reset it.
- **Proven to catch, each break run against the gate:**

| Break | Failures |
|---|---|
| Drop `slideScale` from the broadcast payload | 1 |
| Remove the size from the broadcast effect (a change waits for the next slide) | 1 |
| Projector never applies the variable | 1 |
| A hold resets the room to the default size | 1 |

- **Full suite: 1041 files, 15,669 passed, 1 skipped.** Lint clean.

## Limits, stated

- **Verified at the React and payload layer, not with two real displays.** A second physical screen driven by `window.open` onto a projector is the one part of this that a headless browser cannot honestly stand in for; the BroadcastChannel path is asserted, the glass is not. The live pass is Darrell's, with a projector. `re-review: 2026-10-01`.
- **The congregation-on-their-own-phones path (`follow-along`) is untouched.** Those are personal devices, where the reader's own text size is the right control and already works. Nothing was reported about them and nothing changed. `re-review: 2026-11-01`.
- **Only font sizes scale**, as in DR-0451: spacing and the QR corner keep their own clamps. `re-review: 2026-10-17`.
