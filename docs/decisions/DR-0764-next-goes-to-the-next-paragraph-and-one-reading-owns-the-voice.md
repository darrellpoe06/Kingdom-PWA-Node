---
id: DR-0764
title: Next goes to the next paragraph, Back to the one before, and one reading owns the voice
status: accepted
date: 2026-10-06
tier: A
type: defect
declared_by: Darrell
scope:
  - app/src/lib/read-follow.js — buildFollowMap records the block grid; paragraphStarts reads paragraphs from it instead of from a second tag list
  - app/src/components/TTSControl.jsx — one run-local position, put back to 0 whenever a jump sets a new base
  - app/src/lib/use-read-aloud.js — every read takes a number; a superseded read installs no queue and touches no audio element
  - app/src/__tests__/the-reader-steps-one-paragraph.test.jsx, app/src/__tests__/one-reading-owns-the-voice.test.jsx
principles: [VERIFICATION-DOCTRINE (DR-0076), HOLD-THE-HAND (DR-0621), PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0264 — highlight as it reads, and keep the words in sight (the follow map this corrects)
  - DR-0653 — one piece per reading segment, and the lit sentence is the piece playing
  - DR-0718 / DR-0747 — a saved reading plays as ONE joined file; Opus pieces decoded for the join (what makes a read's preparing window seconds long)
  - DR-0659 — every piece from the device first
source: 2026-10-06 — Darrell, from his phone, a lesson open with READ ALOUD, the voice on "My voice (Darrell) · AI (stand-in)" (the NAS piece path), the whole lesson on the device ("169 of 169 pieces · 3.2 MB")
---

## Context

Two reports, one sitting, one reader:

1. *"The reader does not go to the next section or paragraph... it goes to the beginning of the lessons."*
2. *"it gets garbled words at times even with the storage increase for cache."*

The paragraph steps are the Back and Next of the reader bar, of the panel, and of the headset, the car and the lock screen — all four call the same function. The reading was in the NAS voice (`/voice-lite`, one short clip per sentence, DR-0653), not the phone's own voice, and every piece of it was already on the device.

## What was measured

Everything below was run against the code as it was, in jsdom, over the real helpers and — for the garble — the real `useReadAloud` hook with only the network seam faked.

- **Why Next did nothing and Back went to the top.** `paragraphStarts` (read-follow.js) resolved each spoken sentence to its nearest ancestor in a tag whitelist — `P`, `LI`, `H1`-`H6`, `BLOCKQUOTE`, `TD`, `TH`, `DT`, `DD`, `FIGCAPTION`, `PRE` — while `buildFollowMap`, twenty lines above in the same file, treats twenty more tags as block boundaries, `DIV` and `SECTION` among them. A lesson whose prose renders in `DIV`s therefore had every sentence walk past every one of them and land on the single element the whole lesson is wrapped in (`<li id="learn-lesson-…">`, ChurchLearn.jsx:2856). Measured on a three-`DIV` lesson: six sentences, **`starts` = `[0]`**. `paragraphJumpTarget` then answers **`null` for Forward** — nothing moves, "does not go to the next section or paragraph" — and **`starts[0]`, segment 0, for Back** — "it goes to the beginning of the lessons". One line, both halves of his sentence.
- **Why the step AFTER a step landed wrong.** The absolute place was `base + local`, with `local` read live from whichever counter the current mode pointed at (`deviceRead ? segmentIndex : lastCloudIdxRef.current`). A jump sets the new `base` at once while that counter still holds the position of the run that just ended — and `deviceRead` itself is `!cloudPlaying`, so it flips for the seconds the NAS voice takes to answer. Measured on a four-paragraph lesson with the NAS voice on its fourth piece: Forward landed correctly on paragraph 3, and **Back then went FORWARD to paragraph 4**.
- **Why words garbled.** A read is asynchronous for seconds before it plays a note: the family bridge key, the saved-on-device check, and — once a reading is fully saved — decoding and joining every piece into one file (DR-0718/DR-0747). A second read begun inside that window (a paragraph jump, a Continue, the headset's skip) calls `stopCloud()` first, exactly as it should, and finds **nothing to stop**: the first read has not installed its queue yet. Both reads then build a clip queue over the **one shared `<audio>` element** (`liteAudioRef`), and the superseded one puts its own piece on that element mid-sentence. Measured against the real hook with the first read's piece slower than the second's: the element took `blob:Bravo one sentence here.` and then **`blob:Alpha one sentence here.`** — the new reading cut off part-way and replaced by a sentence from where the listener no longer is. The superseded read also went on fetching its remaining pieces, each of which would have swapped in at the next sentence boundary. Nothing in the cache can cure this; **a fully saved reading makes the window longer**, which is why he met it after raising the cache.
- **Ruled out, by measurement, so they are not carried as suspicions.** Piece length is not the cause: across the Living Lessons corpus the reader's cut gives 154,630 pieces, the longest **181** characters, **none** over `PIECE_MAX` (200) — DR-0653 holds. Nor is a shifted piece index: `segmentText` is prefix-stable at its own segment boundaries (8,570 slices checked, **one** mismatch, an isolated `"..."`), and clip keys are content-addressed (voice + model + the exact words), so a jump plays the same sentence's own clip.

## Impact

Reading a lesson aloud — the way this app is used hands-free, in the car, with the screen off, and by readers aged 6 to 60 (DR-0264) — could not be navigated: Next was inert, Back threw the listener back to the first line of the lesson, and a step made while the voice was preparing produced a sentence from the wrong place, part-way through another. Every one of those is worse on the listener's best setup: a whole lesson saved on the device is exactly the case with the longest preparing window.

## Decision

1. **Paragraphs come from the follow map's own block grid.** `buildFollowMap` already knows every block boundary — it inserts the separator at each one — so it now writes those positions down (`blocks`), and `paragraphStarts` reads paragraphs from them. The second tag list is gone from the decision: a boundary the map splits on is a paragraph the jump can reach, for every kind of block, by construction. Positions, not live nodes, so the grid also survives a lesson re-rendering under the reading. The old DOM walk stays only for a follow map built by hand, which carries no grid.
2. **One run-local position, owned by the run.** `runLocalRef` is set by whichever follow effect is driving and put back to 0 by `beginRun()` the moment a new base is set, and `base + runLocal` is the one absolute place. It is **not** cleared when the voice stops — a stop is where Continue picks the place up, and the cloud path now keeps its offset across a stop instead of losing it.
3. **Every read takes a number, and only the current one owns the voice.** Past each await, a read whose number is no longer current stops where it stands: it installs no queue, puts nothing on the `<audio>` element, releases the clips it had prepared, and never falls through to the phone's own voice with text the listener has already moved on from. Stop takes a number too, so a read that was fetching when Stop was pressed cannot begin speaking a moment later.

Everything the reader already did is unchanged: Back re-listens the current paragraph and walks back on a second tap, Top restarts the whole reading, the OS media buttons call the same two functions as the bar, the place-keeping stays absolute (`base + local`), and the device-voice path is untouched.

## Verification

- `the-reader-steps-one-paragraph.test.jsx` — **proven-to-catch**, four of its five assertions fail against the code as it was: a `DIV`-rendered lesson gives `starts` `[0]` with Forward `null` and Back `0`; the grid does not survive a re-render; and, driving the real reader over a real lesson element in the NAS-voice path, "Back after Next moved FORWARD instead of back" (`The fourth paragraph…`).
- `one-reading-owns-the-voice.test.jsx` — **proven-to-catch**, both assertions fail against the code as it was: the superseded reading's piece reaches the shared element (`blob:Alpha one sentence here.`), and a read still preparing when Stop is pressed goes on to speak.
- `section-share-and-paragraph-nav.test.jsx` (the existing paragraph-grouping contract) is unchanged and still green: a `<p>`/`<li>` lesson groups exactly as before.
- Full suite: `npx vitest run` in `app/`; `npx eslint src`; `business-systems-guard`, `legibility-guard --check`, `interconnect-guard`, `monolith-budget-guard`.

**His test:** open a lesson, press Read with the NAS voice, and use ↩¶ and ↪¶ — Next moves one paragraph on, Back moves one paragraph back, neither returns to the first line of the lesson, and stepping while the voice is still fetching never leaves two sentences talking over each other.

re-review: 2026-10-20 — his own listen on the Fold with a fully downloaded lesson: do the steps land, and is the voice clean through a run of jumps. If a garble is still heard after this, the next place to measure is the NAS voice service itself (`infra/nas-voice-lite`), which is outside the app and outside this change.
