# DR-0426 — The level is chosen from the beginning and at every stage, and the reader can switch it too

- **Status:** accepted
- **Tier:** A (Learn surface control wiring; no schema, no money)
- **Date:** 2026-09-15
- **Type:** product
- **Scope:** `app/src/components/LessonFlow.jsx` (`stageExtra` slot under every stage header, paced and read-all), `app/src/components/ChurchLearn.jsx` (TutorPanel supplies the "Who is learning?" row from the band in force; the paced core no longer doubles it; the read target carries `level` / `levels` / `setLevel`), `app/src/lib/read-target.js` (the three fields), `app/src/components/TTSControl.jsx` (the row in the panel, a one-tap select on the reading pill, `pickLevel`, `startFraction` restart), `app/src/lib/read-follow.js` (`startIndexForFraction`), tests `the-level-is-chosen-at-every-stage-and-in-the-reader.test.jsx` and the updated pin in `the-level-is-chosen-inside-the-lesson.test.jsx`
- **Principles:** SURFACE-SAYS-TRUTH, THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0417 (the level inside the lesson), DR-0418 (a level change keeps the place — half-way stays half-way), DR-0264/0265 (the reader follows)

## The word, as spoken

Darrell, 2026-09-15, from his phone, on Lesson 152 at Youth pace: *"We need to be able to choose the level from the beginning and at each section change... we would also want the reader to be able to switch too..."*

## What was true

DR-0417 put the row at the top of the paced core — the **Teach** stage, the second section of the arc. The first thing a learner met (Open: hook + anchor) still had no way to pitch it, and the reading panel — what a listener sees for the whole reading — had no level at all. A listener on the pill who wanted the child words had to stop, scroll to the core, pick, and start over from the top.

## The decision

1. **The row rides the flow.** `LessonFlowAudience` takes a `stageExtra(segment, index)` slot and renders it under every stage header, before the body, in both the paced view and the read-all view. The tutor panel hands in the same `LessonLevelControl` (DR-0417's row, unchanged), computed from the band in force and the resolved level, so it is the first choice offered (Open) and offered again at each section change. The paced core keeps only the override for its proportional re-step (DR-0418); it no longer renders its own row inside the tutor panel (a host that still passes the setter directly, like the tests, renders it as before).
2. **The reader carries the level.** A lesson registers `level`, `levels` and `setLevel` on its read target. The reading panel shows the same row (idle and reading), and the pill carries a one-tap select. A pick reaches the same remembered state the in-lesson row sets (and clears a standing depth override, as DR-0417 decided).
3. **A switch mid-read keeps the place.** On a pick while reading, the panel remembers the fraction of the way through the current words, stops the engine (guarded so the hands-free run does not advance to the next lesson), and when the lesson re-registers its target with the new words, resumes at `startIndexForFraction(fraction, newSentenceCount)` — the sentence-level twin of DR-0418's step mapping.

## Proof

- Component tests: the Open stage carries exactly one row before its body; Next part carries it to Teach; read-all shows one per stage; a host with no slot renders as before.
- Live-tree test: opening a real Living Lesson shows exactly one row, in the Open stage, and a Child pick reaches `setAgeBand('child')`; the read target carries `level: 'adult'`, the five levels, and a setter that reaches the same state.
- Reader tests: a target with a level shows the row with the right radio checked and a pick calls `setLevel`; a target without a level (a chapter, a door) shows none; a non-function setter is dropped.
- `startIndexForFraction`: half of 40 is 20, half of 9 is 5, clamps to the last sentence, tolerates 0 and NaN.
- Every assertion fails against the previous code.

## Boundaries

- The Presenter's own "Who is in the room" row is untouched; this record is the learner's lesson and its reader.
- The re-read after a switch begins at the mapped sentence with the reader's normal reveal; word-level follow resumes as before. If the new level has fewer sentences the mapping clamps to the last one rather than guessing.

## Re-review

- **re-review: 2026-09-29** — ask Darrell whether a mid-read switch lands where he expects; if the pill select is too small at Big Print, promote it to the same chip row as the panel.
