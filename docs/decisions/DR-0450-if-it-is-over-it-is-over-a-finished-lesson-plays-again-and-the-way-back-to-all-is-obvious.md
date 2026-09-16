# DR-0450 — If it is over, it is over: a finished lesson plays again, and the way back to All is obvious

- **Status:** accepted
- **Tier:** A (two reported defects on a learner surface; no schema, no money, no identity change)
- **Date:** 2026-09-16
- **Type:** app
- **Scope:** `app/src/lib/learn-resume.js` (the place record gains `done`; `finishPlace`, `placeIsFinished`), `app/src/components/TTSControl.jsx` (the end is recorded; a finished place never resumes), `app/src/components/ChurchLearn.jsx` (a finished lesson reopens at part one; the bar's way-out is primary; the end doors are wired), `app/src/components/LessonFlow.jsx` (`onAllUnits` / `onStartOver` — two doors at the end of a lesson), `app/src/__tests__/over-is-over-and-all-is-obvious.test.jsx` (new gate, 15 tests), `app/src/__tests__/learn-resume.test.js` (three shape pins extended with `done: false`)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), PERPETUAL-IMPROVEMENT (DR-0075), SPEC-CONFORMANCE (DR-0219), DECISION-RECORDS (DR-0011)
- **Grounds:** DR-0262 (every lesson gets its own space; the place survives both directions), DR-0418 §D3 (a level change keeps the place; a clamp to the last step "reads as the lesson ended"), DR-0410 (chrome is capped: the words grow, the frame stays a frame), DR-0438 (the phone bar is one row), DR-0287 (the reader turns the page itself), `resume-at-the-sentence.test.js` (the sentence-resume contract, kept intact)

## The two reports, in his words

Darrell, 2026-09-16, from his phone at part 7/7 of a lesson with the Read Aloud panel open:

> "can't re-listen to the lesson after the lesson is over because it's allowing the lesson to keep starting at the end because it thinks it's finished because it's starting where it left off at. But if it's over, it's over. So it needs to be able to recognize that the lesson was over and you want to re-listen to the same freaking lesson, obviously."

And, of the same screen:

> "There's a little bitty button to get back to all. So if you're on a phone, you can't really find the all button to get back to any of the other lessons. Make it obvious. Stop making it difficult to get to places in the app. All should just pop up with all every time you get done, anytime you want. You should be able to get to the front easily. Not make it be a little bitty spot on it for saying all. Fix it."

Both reports are exactly right, and both name a real mechanism. Neither was a misreading of the screen.

## SHOULD → ARE → GAPS → CLOSE (DR-0219)

**SHOULD.** DR-0262 says a lesson's own space exists so the reader cannot lose their place, and the resume record is what carries it. Nothing in it ever said the END is a place to resume into. DR-0418 §D3 had already written the exact failure mode in his words — a clamp to the last step "reads as 'the lesson ended'" — and fixed it only for a mid-read level change.

**ARE (traced end to end before any edit).** The place record (`lib/learn-resume.js`, key `poe-learn-place`) stored `{ courseKey, lessonId, stage, step, sentence, sentenceKey, at }`. The reader wrote the spoken sentence on **every** sentence, the last one included (`TTSControl.jsx` per-sentence effect → `recordPlace({ sentence: absIndex, sentenceKey: sentenceKeyOf(text) })`), and the next listener-initiated press resolved that sentence and started there (`savedStartIndex` → `read(follow.text.slice(follow.segments[at].start))`). Nothing was written at end-of-lesson, and nothing unwound the last write: `tts.js` `_finish()` resets only in-memory position, and it is reached identically from a natural end, a Stop, and an error. The paced view had the same stickiness through `initialIndex={savedHere ? savedHere.stage : 0}`.

So a lesson heard to its final sentence saved its final sentence. The next press spoke one line and stopped — and because the hands-free run is armed by every target read, it then either paged to the next lesson or collapsed the view. A lesson that would not play.

**GAPS, named plainly.**

1. **No completion concept existed anywhere in the chain.** `stage`/`step`/`sentence` and an `at` timestamp were the whole record; `tts.js` has `idle | playing | paused` and emits no "reached the end". Nothing could tell a pause from a finish, so nothing could act on the difference.
2. **The two existing resets were unreachable for a listener.** `clearPlace` ("Start fresh") renders only on the catalog banner, behind `!lessonFocus`, and `refreshPlace` ("Refresh first") only when `savedPlace.step > 0` — a person who listens never moves `step`. From inside a finished lesson there was no way out of the end.
3. **The way back to All was the smallest control on the screen** and the only one: a 10px label in a 1px outline, 36px tall, in a sticky bar above the fold, beside two mere arrows.
4. **The end of a lesson was a dead end.** At the last part the footer showed "◀ Previous part", the words "End of this lesson", and a **disabled** "Done ✓". Three controls, not one of which went anywhere.

**CLOSE.**

- **The record learns that a lesson can be over.** `getPlace` returns `done`, `finishPlace()` sets it, `placeIsFinished(place)` reads it. It is marked when the **last sentence of the piece is spoken** — the one moment that means *heard to the end* without having to tell an ended read from a Stop pressed on the closing words. Either way the listener heard it all, and either way the next start belongs at the top.
- **OVER clears itself the moment a reading moves again.** Any patch that moves the place (a stage, a step, a sentence) sets `done` false; a patch that only re-names the lesson (opening it) keeps it. That is what lets a finished lesson reopen at part one while an interrupted *re-listen* still resumes normally. A different lesson always starts unfinished.
- **The reader refuses a finished place** (`savedStartIndex` returns `-1`, the top) and the lesson space opens a finished lesson at its top (`savedHere` yields null). The DR-0426 `startFraction` branch and the `continuing` branch are untouched, so a level switch still keeps its fraction and an auto-advanced lesson still starts at its own top.
- **`done` is absent from every record written before this**, which reads as false, so an existing place resumes exactly as it did.
- **The bar's way-out is now the bar's primary control:** filled, `border-2`, 13px words, 44px tall, and it says "All lessons" on a phone too. Prev/Next stay quiet arrows, which is the right weight for them. It remains inside `.ts-chrome-region`, so Big Print grows the words and the frame stays a frame (DR-0410), and the bar stays one row on a phone (DR-0438).
- **The end of a lesson carries two full-width doors** (`LessonFlow.jsx`, `data-testid="lesson-end-doors"`): **↺ Start this lesson over** (part one, and the place cleared — which is what re-listening needs) and **← All lessons**, 48px tall, 13px words, `data-read-skip` so they are never read aloud. Optional props: a host that wires neither keeps the old footer exactly.

## Verification

- **New gate `over-is-over-and-all-is-obvious.test.jsx` — 15 tests**, and the central pair is the proof: the *same* saved last sentence, one field apart, produces opposite outcomes. With `done` true the press reads the whole lesson (first sentence present); with `done` false it still slices to the saved sentence (first sentence absent). The fix is not a reset for everyone.
- **Proven to catch, each break run against the gate:**

| Break | Failures |
|---|---|
| Remove the finished short-circuit from the resume decision | 2 |
| Never mark the end at the last sentence | 1 |
| Restore the old 10px / 36px / hairline bar button | 1 |
| Remove the two end-of-lesson doors | 2 |

- **The kept contract:** `resume-at-the-sentence.test.js` passes untouched, including its source pins on `recordPlace({ sentence: absIndex, sentenceKey: sentenceKeyOf(text) })`, `continuing ? -1 : savedStartIndex`, and `rememberSentence(st.base + segmentIndex, seg.text)` — the new writes sit beside those literals rather than replacing them.
- `learn-resume` 13, `learn-resume-render`, `the-place-survives-a-level-change`, `read-one-full-lesson`, `reader-hands-free`, `learn-lesson-space`, `lesson-127-is-the-standard` all green. Lint clean. **Full suite: 1038 files, 15,506 passed, 1 skipped.**
- Three exact-shape assertions in `learn-resume.test.js` were extended with `done: false` — the field is new, and those pins exist to notice exactly that.

## Limits, stated

- **Marked from the spoken sentence, not from the engine's end.** A listener who stops one sentence short of the end does not get a finished record, and their next press resumes on that last sentence — correct, but it means the final sentence is the boundary rather than the utterance queue emptying. If a case turns up where that reads wrong, the engine-side signal is the follow-up. `re-review: 2026-10-16`.
- **Reaching the last part by paging does not itself mark the lesson finished** — only hearing the last sentence does. A reader who pages to 7/7 without the reader still reopens at 7/7, which is the DR-0262 behaviour and is what the new Start over door is for. `re-review: 2026-10-16`.
- **Measured in the component and the record, not yet on a phone.** The sizes are asserted from the real class strings and the full suite is green; the live pass on his device is the DR-0104 step after this deploys.
- The catalog's own lessons-bar was left as it is; this touched the lesson-space bar and the end of a lesson, which is where both reports were made. `re-review: 2026-10-16`.
