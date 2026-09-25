---
id: DR-0633
title: The reader plays like a radio — leaving a tab never stops it, because no surface may silence speech it is not itself speaking
status: accepted
date: 2026-09-24
tier: A
type: defect
declared_by: Darrell
scope:
  - app/src/lib/tts.js — engine.stop() cancels speechSynthesis only when that engine is speaking
  - app/src/lib/use-cast-read.js — the Bible cast stops only what it is itself saying when it unmounts
  - app/src/__tests__/reader-plays-like-a-radio.test.js (new)
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0627 — the reader keeps playing when you switch apps (the audio voice)
source: 2026-09-24, 4:57pm — Darrell, verbatim, with two screenshots from his phone
---

## Context

Darrell, 2026-09-24, 4:57pm, verbatim: "Leaving a tab should not make the player stop playing. Like the player should be able to play no matter what's going on, whether I move, leave the tab, whether I do whatever, it should still be able to play. It is like a radio in the background... Stop trying to constrain it."

His screenshots show that moving from a lesson on the Learn tab to another tab stopped the reading.

## What was measured

- **Where the reader lives.** The reader (`TTSControl`) is mounted once in the app shell, beside the video popout, and not inside any tab. Moving between tabs does not unmount it.
- **Several engines share one voice.** Other surfaces hold their OWN speech engine: the lesson's quiz (`ChurchLearn` `optionTts`), the lesson teacher, the Eternal Algorithms study, the Voice Studio, and the Bible reader's cast. `speechSynthesis` is ONE object for the whole page.
- **The line that stopped it.** `useTextToSpeech` stops its engine when its component unmounts, and `engine.stop()` called `speechSynthesis.cancel()` unconditionally. So leaving the Learn tab unmounted an idle quiz engine, and its `stop()` cancelled the reader's utterance mid-sentence. `useCastRead` did the same on unmount.
- **Not reproduced on his phone from here.** The sandbox has no device. The path above is traced in code, and the test reproduces it with two engines on one synthesizer.

## Impact

Every listener lost the reading whenever they left a lesson, a study or the Bible tab while the phone's own voice was reading. That is most of the time, whenever the audio voice (DR-0627) is not reachable.

## Decision

1. **An engine silences only what it is saying.** `engine.stop()` cancels `speechSynthesis` only when that engine is not idle. The reader's own Stop still stops it.
2. **The same rule for the Bible cast.** On unmount it stops its player only when that player is playing.
3. **Only Stop stops the reader.** Navigation, unmounting and other surfaces never do.
4. **Later increments of the same Way, on `claude/reader-plays-like-a-radio`:** the mini-player on every tab, the dark-screen hand-over to the audio voice, and "Show the text".

## Verification

- `reader-plays-like-a-radio.test.js`: a reader engine and a quiz engine share one fake synthesizer.
  - The reader speaks, then the idle quiz engine is stopped, as it is on unmount. `cancel` is not called.
  - The reader's own stop then cancels exactly once.
  - An idle Bible cast cancels nothing.
  - Proven to catch: with the old unconditional cancel restored, the first test turns red. This was run.
- The reader and Bible suites stay green.

**His 20-second test:** start a lesson reading, then tap to another tab. The voice keeps talking.

re-review: 2026-10-01 — his phone test.

## Amendment (same day): the mini-player, the dark screen, and "Show the text"

Darrell, 5:03pm, on his Fold, verbatim: "Also need to be able to go back to the reading page to see the text when I want or any user!!!!!!!"

**What was measured.**
- With the panel closed, the reader was a 48 px speaker button. Its ▶ badge was shown while the voice was PLAYING, which reads as "press to play".
- Nothing on another tab led back to the words being read.
- The existing "Take me back" only posts a want to read (`requestRead`). No surface navigates on it.
- The "screen went dark" offer appeared whenever the page came back without a live reading, even when the phone's own voice could have been handed over first.
- A live DOM Range over words that leave the page does not disappear. The browser collapses it onto the nearest surviving ancestor, so "is it still on the page" must check `collapsed`, not only `isConnected`. (Found by the render test.)

**Decision.**
1. **A mini-player on every tab while the Word plays.** It shows the text, steps back a paragraph, plays or pauses, steps forward a paragraph, and opens the panel. It is icon-first so it fits at 320 px. The misleading ▶ badge is gone.
2. **Follow along, never yank.** The highlight always follows the voice. The scroll follows only until the listener scrolls on their own; then a "Back to the voice" chip offers the way back.
3. **Show the text.**
   - On the page being read, the spoken sentence is brought into view and lit.
   - From another tab, the reading's own page is asked to open it (`lib/reading-source.js`). For a lesson, that is the one Learn landing (`lib/learn-open.js` `requestOpenLesson`, DR-0642 on claude/lesson-opens-fast), read through `import.meta.glob`, so nothing is forked and nothing breaks before it lands. The shell switches to Learn on the existing TTSControl line (`onOpenLearn`, no new shell lines).
   - Until DR-0642 merges, a lesson opened from another tab is not yet taken there. That is the named gap.
4. **The dark screen.**
   - The AUDIO voice (DR-0627) plays on through it, and nothing is done.
   - The PHONE voice is handed over, the same sentence, to the audio voice as the page hides, when that voice is reachable.
   - If a reading still died, it is picked up again on return without being asked. The offer shows only as the backstop and clears itself once the reading stays live. Wake Lock stays an option (the panel's switch), not a requirement.
5. **Only the session that took the lock screen clears it.** A second reader standing down (the Help button, the Bible reader) never wipes the card and buttons of the one playing.
6. **A reading registered before the reader mounted is not missed.** The reader re-reads the target when it subscribes.

**Verification.**
- `reader-radio-mini-bar.test.jsx` (8 tests), on the real reader:
  - the mini-bar drives the same `pause` / paragraph functions;
  - a lesson leaving the page never calls `stop`;
  - with the audio voice, hiding the page reads, pauses and stops nothing;
  - with the phone voice, hiding hands the same sentence over;
  - "Show the text" from another tab asks the opener with `{ owner, sentence }`, and on the page asks no one;
  - scrolling away shows "Back to the voice".
- `reader-plays-like-a-radio.test.js`: the lock-screen claim case.
- **Chromium proof (real `use-read-aloud`, real clip queue, real `<audio>`, the `/voice-lite` answer served locally):** start the lesson, leave the lesson tab (the lesson and its quiz engine unmount), wait 5 s. The same audio element advanced **5.07 s at 390×844, 5.09 s at 320×640, 5.08 s at 1812×1000**, never paused. With the page hidden, it advanced **2.0 s** in 2 s. The mini-bar is on screen at all three sizes with no horizontal overflow and 40 px minimum buttons. It never overlaps Feedback or Give (at 320 px: bar 70–304 px, Feedback 16–64 px; Give sits above the bar).
