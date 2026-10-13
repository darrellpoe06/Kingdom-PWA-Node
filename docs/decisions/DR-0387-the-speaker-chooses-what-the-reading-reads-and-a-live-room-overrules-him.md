# DR-0387 — The speaker chooses what the reading reads, and a live room overrules him

- **Date:** 2026-09-13
- **Status:** accepted
- **Tier:** B (the presenter console; a leak here is heard by a room)
- **Type:** orchestration

## What was asked

Darrell, 2026-09-13, answering the three questions put to him after #1563:

1. On the private-script audio — *"? What? The notes section of the presentation? Give the options for both one or the other... maybe a toggle that has all options?"*
2. On the long notes panels — *"Yes. Or both options... long scroll or per section depending on the choice the user makes."*

## The history this settles

He asked on **2026-08-10** to be able to listen to the full message from the console. A first attempt inside #1563 simply fed the presenter's private notes to the voice whenever no audience surface looked alive. `presenter-read-aloud.test.jsx` — an existing pinned test — **rejected it, and was right.** That attempt was withdrawn and the question put to him instead, because loosening a pinned law is the governor's call, not a side effect of a label fix. This record is his answer.

## The decisions

1. **THE SPEAKER CHOOSES, WITH ALL OPTIONS ON THE TOGGLE.** Three modes on the console: *What the room sees* (the slide — the default, unchanged), *My script* (his presenter notes), *Room + my script*. His console, his ear.
2. **A PREFERENCE NEVER OUTRANKS A FACT.** `audienceLive()` is a fact; the mode is a preference. When any audience surface is alive — presenting on this screen, a projector window open, a congregation broadcast running — the reading collapses to the room's slide **whatever he picked**.
3. **THE GUARD IS STRUCTURAL, NOT CLEVER, AND IT FAILS CLOSED.** The decision lives in one pure module (`lib/presenter-read-mode.js`) and is re-evaluated **on every render**, not once when the mode is chosen — so casting mid-reading drops the script at the moment the screen goes up rather than at the end of the part. And `audienceLive` treats an **unrecognised** audience state as LIVE: adding a fourth way to present fails safe instead of silently opening his script to a room. The speaker never has to remember to switch back before he presents, because forgetting is the failure a room would hear.
4. **A script mode on a part with no notes still reads the slide**, so choosing it never produces a dead play button.
5. **THE NOTES PANEL LAYS OUT THE WAY HE ASKS.** *Long scroll* (what shipped) or *One section at a time* (collapsed, the one he is teaching open). Routing the whole lesson into the deck (DR-0381) made these panels long **on purpose** — L142's Part 4 carries 9,140 characters — and a speaker mid-sermon should not scroll past four points to reach the one he is on. Advancing the deck reopens the FIRST section of the new part, because landing with section four expanded is the opposite of where he is about to teach.
6. **Both choices are remembered on his device** (`localStorage`, per-viewer), and a corrupted or absent stored value degrades to the safe default rather than throwing.

## Proof

- 23 new tests in `presenter-read-mode.test.jsx`; the original `presenter-read-aloud.test.jsx` passes **unchanged**, because the default is still the room's slide.
- **Proven-to-catch (DR-0076 §3), two ways.** Make `audienceLive` fail OPEN on an unknown state → the fail-closed test fails. Remove the collapse from `effectiveReadMode` → **4** tests fail, including the three that pin the law itself (presenting drops the script; it drops mid-reading; a stored preference does not leak when the app opens already live).
- `npm run verify` green.

## The limit, stated

The mode collapses on the states this component models. A future presentation path that does not flow through `onScreen` / `audienceState` / `followCode` would be invisible to it — which is exactly why `audienceLive` treats the unknown as live. **re-review: 2026-10-11**, to confirm no new path has been added that reports none of the three.

## Pairs with

DR-0381 (the hollow-surface work that made the panels long and the label honest), DR-0289 (the one-button read path), DR-0076 (gates over claims), DR-0111 (his answer is a decision, not a new question to re-ask).
