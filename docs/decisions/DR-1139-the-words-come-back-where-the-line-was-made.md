# DR-1139: The words come back where the line was made — a spoken lesson's prompt row shows its transcript's state, and Your prompts reads by type through the standard sub-tabs

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (one surface, one pure join, one sort key; no road, no schema)
**Type:** product (defect + capability)
**Area:**
- `app/src/lib/prompt-words.js` (new, pure: the join from a prompt row to the recording it stands for)
- `app/src/components/PromptHistory.jsx` (the row says where the words are; the list reads through `SectionTabs variant="sub"`, one type at a time)
- `app/src/lib/saved-prompts.js` (`promptType`, `promptTypes`, the "By type" sort)
- `app/src/__tests__/the-words-come-back-where-the-line-was-made.test.jsx` (new), `saved-prompts.test.jsx` (the sort pin)

**Amends:** DR-0636 (the words go back to the box: the loop closed on Your lessons, not on the row that made the promise). Grounds: DR-0116 (sideways sub-tabs on every surface), DR-0615 (Your prompts), DR-0611 (the Whisper intake), DR-0622 (Your lessons), DR-0076 (measure first).
**Declared by:** Darrell, 2026-10-20, a screenshot of Your prompts with six rows reading *"Spoken lesson, 28:24 (the words come back from Whisper)"* from 09-30 to 10-09: *"Not working..."* Then: *"Can we sort based on type and use our standard subtab standard?"*

---

## Context

The recorder writes one line into the box for a spoken lesson with no typed words, and the send remembers that line in Your prompts (DR-0615). The words themselves come back as a transcript row on the NAS road (DR-0611) and are shown under Your lessons (DR-0622). The row that made the promise never heard of the answer.

## What was measured

`voice-intake-health` run 39479627269, on the live database, 2026-10-20 19:00Z:

| class | rows | newest |
|---|---|---|
| lesson recording | 10 | 2026-10-09 13:51 |
| transcript (lesson) | 10 | 2026-10-09 14:01 |
| note recording | 6 | 2026-10-20 17:53 |
| transcript (note) | 6 | 2026-10-20 18:18 |
| failure report | 1 | 2026-09-24 (the first ever, retried and written the same day) |

Every spoken lesson in his screenshot has its transcript, all written by `whisper:nas-cpu` (the 4070 tower's Whisper answers 000 on all three addresses; the NAS CPU rung carried every one). The 28:24 recording of 2026-10-06 21:05 was written at 21:56, fifty-one minutes later, across more than one pass (the rider timed out at 480 s twice on the way, which is the carried-partial path working as designed). **The road is not the defect. The row is:** `saved_prompts` holds the line and nothing else — no recording id — so nothing on that screen could change when the words arrived.

## Decision

1. **The row says where the words are.** A prompt row that is a spoken-lesson line is joined to the person's own lesson rows by the two facts both carry: the clock in the line (`28:24`, repeated in the voice row's body as `(28:24)`) and the time of the send, nearest within thirty minutes. The row then shows one of four states, read from the lesson rows' own tags and never inferred: **written** (when, by which Whisper rung, with *Show the words* and *Put the words in the box*, which sends the words, not the line), **waiting**, **failed** (with the rider's stated reason), or **unmatched** (no recording on record for that line, said plainly).
2. **Your prompts reads by type through the standard sub-tabs** (DR-0116): *All · n* first, then one chip per type present with its count — Lesson, PoeTech, Prayer, Pastor, Serve, Work, Counseling, Private, and *Saved* for a row kept by Save as prompt. The Sort control gains *By type* for the All view.
3. The lesson rows are read once per load and only when a spoken line is on the screen; a list of typed prompts costs nothing more than before.
4. **The words go anywhere, one or several.** Darrell, the same hour: *"Do we have the ability to send our words anywhere after collected???! We need that in case it goes to the wrong location or we may want to create a lesson from a situation or few."* One row's words could always come back to the box and be sent to any destination (DR-0636); several could not be gathered, because the box only ever replaced what it held. Every row on Your prompts and Your lessons now carries **Add to the box** beside *Put it in the box*: the words land under what the box already holds, a blank line between, and the route the person chose for the gathering is kept. Gather a situation, or a few, choose Lesson (or anywhere), send.

## Impact

- The promise the recorder makes is kept on the screen that makes it. A person who records a lesson and comes back to Your prompts sees the words, or exactly why not, on that row.
- Nothing moves: Your lessons still shows every lesson's road; the sub-tabs only change how the list is read.
- Honest limit: a line sent while signed out, or whose upload failed, has no recording to join; the row says so instead of waiting forever.

## Verification

- `the-words-come-back-where-the-line-was-made.test.jsx` (10 cases): the clock is read from the line and nothing else; a typed prompt gets no note; the 28:24 line finds its own recording by clock and time and the words it was promised, with the rung named; the same clock on another day is not this recording; a different clock or a recording outside the window is unmatched; a failure carries its reason; a rendered written row shows the words on request and puts the **words** in the box (the `USE_PROMPT_EVENT` detail carries the transcript, not the line); waiting and unmatched rows say exactly that; the sub-tabs list All first and one chip per type with counts, a type chip shows only its rows, and *By type* orders the All view; a list with no spoken line never asks for the lessons.
- The gathering move: `boxAfter` is pinned pure (append under a blank line, trailing whitespace trimmed, replace unchanged, an empty add leaves the box alone); the three row buttons send `append`/`append`/`replace` in that order with the transcript's words, not the line; the box's handler applies `boxAfter` with the event's mode; the Your lessons row carries the same button.
- `saved-prompts.test.jsx`: the sort keys now include `type`. Existing cases unchanged.
- Lint clean. `re-review: 2026-10-21`: open Your prompts on the live build, signed in, and read the 28:24 row.
