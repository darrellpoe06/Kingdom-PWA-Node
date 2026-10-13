# DR-0810 — A reading says so when it is recorded, so nobody decides it twice

- **Status:** accepted
- **Tier:** A (one choice added before Send, and two guards that honour it; the transcription road, the lesson path and the hand verdict are byte-for-byte unchanged)
- **Type:** fix
- **Date:** 2026-10-08
- **Scope:** `app/src/lib/lesson-voice.js` (`RECORDING_KINDS`, `RECORDING_KIND_LABELS`, `READING_REASON`, `normalizeRecordingKind`, `recordingKindTags`, `alreadyDecidedNotALesson`; `voiceLessonBody` and `sendVoiceLesson` take a kind), `app/src/components/OneVoiceInput.jsx` (the chooser above Send), `scripts/lesson-inbox-waiting.sql` (the one shared definition of waiting), `infra/nas-lesson-builder/lesson_builder.py` (`eligibility`), test `a-reading-says-so-when-it-is-recorded.test.jsx`
- **Principles:** DR-0768 (a recording that is not a lesson can say so and stop), DR-0725 (one definition of waiting), DR-0611 (spoken lessons), DR-0076, DR-0075
- **Grounds:** DR-0768's own dated item, due today: *"the recorder still offers no choice at record time between a teaching and a reading, so the next homework reading will arrive as a lesson row again and need the same verdict by hand."*

## Context

SHOULD: a recording that is not a teaching never becomes a lesson, and nobody is asked to decide that twice. ARE: DR-0768 gave the *human* verdict a place to be recorded — `not-a-lesson` with a reason — after a child's homework reading arrived as a lesson row and the NAS builder's own gate refused it five times. That closed the loop after the fact. GAPS: the recorder still asked nothing at record time, so the person who knew perfectly well they were recording a reading had no way to say so, and the next reading would take the same path: a lesson row, a bell, five refusals, a hand verdict. The knowledge existed at the only moment it was free to capture, and was thrown away. CLOSE: below.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| what the recorder asked before Send | nothing about the kind — only the name choice (DR-0639) | `OneVoiceInput.jsx` as it stood |
| what a reading cost last time | 5 builder refusals, 1 hand verdict, 2 rows tagged by hand | DR-0768's own record |
| tags a spoken recording carried | `lesson`, `voice`, `audio:<path>`, plus the name choice | `voiceLessonTags` |
| what the transcription road keys on | `lesson` and `voice` — so a reading must keep both or its words never come back | `lesson-inbox-waiting.sql`, the voice rules |
| places that would otherwise ask again | 2 — the shared waiting query (the list AND the bell, DR-0725) and the NAS builder's `eligibility` | read in source |

**Honest uncertainty.** This is measured in the test environment and from the code; it has not been driven on a phone. The second half of DR-0768's dated item — that a reading has no home of its own, beside the learner records (DR-0754) — is **not** built here, and is carried forward below rather than quietly dropped.

## Impact

Unresolved: the one moment when the kind of a recording is known for free — the moment the person presses record — captured nothing, so every reading cost a bell, five refusals and a hand verdict, and the person who knew had no way to tell us. Resolved: the recorder asks once, the answer rides with the row, and the two places that would have asked again now honour it. A reading still gets its words back; it simply never pretends to be a lesson.

## Decision

1. **Two kinds, asked once, before Send.** *A teaching* (the default, exactly what the road already assumed) or *Reading aloud*. A radio group, so a remote and a screen reader both work, with one line under it saying what each means.
2. **A reading rides the same road.** It keeps `lesson` and `voice`, so Whisper still transcribes it and the words still come back to the person who read them. It adds `reading-aloud`, `not-a-lesson`, and `not-a-lesson-reason:recorded as a reading aloud, not a teaching` — the same vocabulary DR-0768 built for the hand verdict, so there is one way to say this and not two.
3. **Nothing downstream asks again.** The shared waiting query skips any row tagged `not-a-lesson`, so it never reaches the list and never rings the bell; the NAS builder's `eligibility` refuses it by name. Both honour the hand verdict too — a row decided afterwards stops just as cleanly as one decided at the start.
4. **The body says which it is**, so a person reading the row later does not have to infer it from tags.

Proven to catch (DR-0076): a teaching adds no tags at all and its body is byte-for-byte the old wording; a reading carries all three tags and says "no lesson is built from it"; a kind that is not one of the two reads as a teaching rather than throwing; a reading keeps `lesson` and `voice` so the transcription road still runs; the waiting SQL carries the new clause AND still carries the three it had; the builder's refusal is matched by its exact wording; the chooser is on the screen, is a radio group, is built from the one `RECORDING_KINDS` list, and its answer reaches `sendVoiceLesson`.

## Verification

- `a-reading-says-so-when-it-is-recorded.test.jsx` green; the NAS builder's Python suite 103 green with the new guard; `eslint src --max-warnings 0` clean.
- On a phone after deploy: record ten seconds, press *Reading aloud*, Send — the row should not appear in the waiting list, should not ring the bell, and its words should still come back.
- **Carried forward from DR-0768, still not built:** a reading has no home of its own. A reading-aloud record beside the learner records (DR-0754) remains the obvious one — the length, the date and the text read are all already present. **re-review: 2026-10-22.**
