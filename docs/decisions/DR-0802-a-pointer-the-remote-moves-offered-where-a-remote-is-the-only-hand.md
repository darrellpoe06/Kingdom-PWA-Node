# DR-0802 — A pointer the remote moves, offered where a remote is the only hand

- **Status:** accepted
- **Tier:** A (an option, off by default, drawing nothing until it is switched on and woken)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/remote-pointer.js` (new), `app/src/components/RemotePointer.jsx` (new), `app/src/components/TTSControl.jsx` (the pref, the toggle on the left rail, the mount), `app/src/lib/reader-controller.js` (`pointer` joins the left rail), test `a-pointer-for-a-remote.test.jsx`
- **Principles:** DR-0800 (a rail control is one bar button), DR-0785 (the TV is a real device we build for), DR-0076, DR-0075
- **Grounds:** Darrell 2026-10-07: *"Make sure the app has a hovering pointer option for devices that use a remote... make sense?"*

## Context

SHOULD: every control the app draws can be reached on the device a person is holding. ARE: on a TV the hand is a D-pad. A Firestick's Silk browser drives a pointer of its own, which is why the rails work there at all — but that is Silk's, not ours, and other remote-driven browsers (Android TV webviews, several smart-TV browsers) send nothing but arrow keys, Enter and Back. On those, a control that cannot take keyboard focus cannot be pressed at all, and a control that can is reached only by tabbing through everything before it. GAPS: the app had no answer of its own, and no way to tell which browser it was on. CLOSE: below.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| one tap of travel | 24px | `STEP_PX` |
| a held key | ramps 1.22× per 16ms tick to a 180px cap | `stepFor`, pinned |
| crossing a 1920px screen holding one direction | under 30 ticks, under half a second | measured in the gate, not estimated |
| what the pointer costs when off | nothing rendered, no listener beyond the one keydown handler that is not installed at all when off | asserted in the gate |
| keys answered | 8 move names (a keyboard's four and a remote's four), 4 click names, 4 dismiss names | `MOVE_KEYS` / `CLICK_KEYS` / `DISMISS_KEYS` |

**Honest uncertainty.** Whether a given TV browser already has a pointer cannot be detected reliably, and guessing wrong is worse than either answer — which is exactly why he asked for an *option* and why this ships as one. It has not been driven on the Firestick itself; this sandbox has no route to poetech.us and no remote. That pass is after deploy.

## Impact

Unresolved: on a remote-driven screen with no pointer of its own, parts of the app were simply unreachable, and the app offered nothing. Resolved: a pointer the D-pad moves and OK presses, switched on from the TV rail in one tap, off everywhere else and costing nothing there.

## Decision

1. **It is an option, off by default, offered on a TV.** `pointerOffered(deviceClass)` is true only for the measured TV class; the pref is kept on the device and defaults off, so a Firestick that already has Silk's pointer never gets a second one unless the person asks.
2. **Arrows move it, holding ramps it, OK presses what is under it.** The arithmetic is pure and tested on real numbers; the component owns the clock and the document.
3. **It never takes a key that belongs to something else.** With the focus in an input, a textarea, a select or anything contenteditable, every key passes straight through. Enter before the pointer is woken is left to the page. Escape, Back and GoBack put it away.
4. **A press focuses before it clicks**, so a control that reads its own focus — and the person watching — both know what was pressed, and nothing is pressed at all when there is no control under the pointer.
5. **It lives on the left rail** as one bar button whose word says its state (DR-0800), beside Full screen.

Proven to catch (DR-0076): switched off, no pointer is drawn and an arrow does nothing; typing in an input, a textarea or a select keeps its own arrows and its own Enter; Enter before the pointer is up is left to the page; the pointer never leaves the screen in any of the four directions, including on a screen whose size we were never told; a span inside a button presses the button, a bare page presses nothing, and a document that cannot be asked presses nothing; a storage that throws on read and on write is survived.

## Verification

- `a-pointer-for-a-remote.test.jsx` green, including the four render cases against a real React tree.
- On the Firestick after deploy: turn Pointer on from the left rail, move it with the remote, press a control with OK, press Back to put it away — and confirm Silk's own pointer is not fighting it.
- re-review 2026-10-21: whether it should instead default on where the device reports no pointer at all, once there is a measurement that can tell.
