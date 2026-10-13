---
id: DR-0641
title: The reader floats and docks — a window you can move over the app, remembered per device, reset with a double-tap, and Dock puts it back
status: accepted
date: 2026-09-24
tier: A
type: feature
declared_by: Darrell
scope:
  - app/src/components/FloatingReader.jsx (new) — the floating window
  - app/src/lib/float-geometry.js (new) — clamp, keep off Feedback / Give, remember
  - app/src/components/TTSControl.jsx — Pop out on the panel and the mini-bar; the float replaces the corner reader while it floats
  - app/src/lib/read-target.js, app/src/components/ChurchLearn.jsx — a reading carries its own title (one line each)
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0633 — the reader plays like a radio (the app-wide reader and the mini-player this hangs off)
source: 2026-09-24 — Darrell, verbatim, relayed by the orchestrator
---

## Context

Darrell, 2026-09-24, verbatim: "Maybe be a popout reader that floating around? Then can be reset back to normal?"

## What was measured

- **The corner reader.** The reader lives once in the app shell (DR-0633). Its only forms were the corner mini-bar, the pill and the panel, all pinned to the bottom-right corner. None of them shows the words being read.
- **The corner buttons.** On a phone, the Feedback button sits bottom-left and the church Give button sits above the reader's corner. Anything floating must stay off both.
- **Document Picture-in-Picture** (a real always-on-top window) exists in Chrome on a computer and not on Android. It is feature-detected, never assumed.

## Impact

A listener could hear the reading anywhere in the app but could only see its words on the page they came from. They could not keep both the words and the app in view.

## Decision

1. **Pop out.** "⧉ Pop out" on the Read Aloud panel (reading and idle) and on the mini-bar opens a floating window. It is on the mini-bar only at 400 px and wider, because at 320 px an extra button would reach the Feedback button.
   - The window shows the paragraph being read, with the spoken sentence lit and kept in view.
   - It has back, play / pause and next paragraph, plus the speed.
   - The app stays usable underneath. The window hangs off the shell's one reader, so it stays through every tab change.
2. **Move and resize.**
   - Drag it by the title bar (pointer events, touch and mouse). Resize it from the corner handle.
   - It never goes smaller than 260 × 220, which keeps every control a 44 px target, and never goes off screen.
   - At rest it moves off the Feedback and Give buttons: above them, or below when there is no room above.
   - It is re-clamped on rotate and resize, including the Fold opening from 904 to 1812.
3. **Reset.**
   - "⤓ Dock" returns the normal reader, the mini-bar or the panel.
   - A double-tap on the title bar resets the window's size and place.
   - Floating or docked, position and size are remembered per device in `localStorage` (guarded; a device that cannot store starts docked).
4. **Out of the app, only where it exists.** Where `documentPictureInPicture` exists, the float offers "Out of app": the same controls in a real always-on-top window, with the app's styles carried in. Everywhere else, including Android, it stays in the app.

## Verification

- `float-geometry.test.js` (8 tests):
  - a float dragged off any edge comes back on screen;
  - it never goes below the 44 px-control minimum;
  - it never grows larger than the screen, and it is re-clamped from 1812 to 904 wide;
  - parked over Give it moves above it;
  - a fresh float starts clear of both buttons;
  - floating, place and size survive a reload;
  - docking is remembered;
  - broken storage starts docked without throwing.
- `reader-floats-and-docks.test.jsx` (6 tests, the real reader):
  - Pop out shows the float with the paragraph and the spoken sentence, and the corner mini-bar leaves;
  - its buttons drive the same pause / paragraph / speed;
  - a drag to −3000 and +5000 is clamped;
  - a double-tap resets;
  - Dock returns the mini-bar and is remembered;
  - a remount (reload) keeps it floating.
- **Proven to catch:** with the clamp removed, 4 tests turn red (run).
- **Chromium, the real reader stack with real audio,** at 320×640, 390×844, 904×2000 and 1812×1000:
  - popped on screen, not on Feedback or Give, smallest control 44 px;
  - dragged into the Feedback corner, it moves above it and stays on screen;
  - rotated, still on screen;
  - after a tab change the float is still there and the audio advanced 3.02–3.08 s in 3 s;
  - Dock gives back the mini-bar, and the saved state is docked;
  - no horizontal overflow at any size.
- Screenshots: 16, four per size (popped, dragged to the corner, rotated, docked).
- **Not proven here:** the Document Picture-in-Picture window on a real Chrome desktop. The headless run shows the "Out of app" button is offered where the API exists; opening the window needs a user gesture on a real screen.

re-review: 2026-10-08 — his Fold, folded and open; whether the float should show the next paragraph too.
