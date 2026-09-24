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
