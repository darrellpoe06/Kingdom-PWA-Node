# DR-0417 — The reader never opens the Word itself; the level is chosen inside the lesson; and the child ceiling is a corpus number, not an age number

- **Status:** accepted (D1–D2 shipped in #1594; D3 approved by Darrell 2026-09-15 — "Yes. Nice!" — and shipped as the age ceiling below)
- **Tier:** A (additive learner-facing controls on the Learn space; no schema, no money, no identity)
- **Type:** product
- **Date:** 2026-09-15
- **Scope:** `scripts/reading-level.mjs` (`NEW_LESSON_CHILD_CEILING` 5.0; `knownLessons`; `freshOverNewCeiling`), `app/src/lib/reading-level-baseline.json` (`knownLessons` = the 153-lesson corpus of 2026-09-15), `app/src/__tests__/reading-level-gate.test.js` (proven-to-catch), `app/src/components/WordInline.jsx`, `app/src/components/VerseChips.jsx` (verse chips carry `data-read-no-expand`; the prose chip also `data-read-keep`), `app/src/lib/read-follow.js` (`buildFollowMap` honours `data-read-keep`, as the fallback path already did), `app/src/components/ChurchLearn.jsx` (`LessonLevelControl`; `AgePacedLesson` + `TutorPanel` thread `setAgeBand` / `setLearnLevel` / `levelOverride`), `app/src/__tests__/the-reader-honours-show-the-word.test.jsx`, `app/src/__tests__/the-level-is-chosen-inside-the-lesson.test.jsx`, `docs/00-foundations/07-neuroplasticity-and-the-word.md` §4 (re-measured; re-review re-dated)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), SURFACE-SAYS-TRUTH (DR-0061 / P15), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS (DR-0011)
- **Grounds:** DR-0340 / DR-0341 (the Word opens in place; one switch opens it everywhere); DR-0285 / DR-0299 / DR-0301 (the reader reads the live DOM and mutes chrome); DR-0402 / DR-0404 (the Word is in the sentence; every anchor is spread through the lesson); DR-0215 (pacing, never cutting); `07-neuroplasticity-and-the-word.md` (the bands and the honest state of the register)

## The report

Darrell, 2026-09-15, after listening to L151 ("L151 was 🔥"), three tweaks and a standing question:

> "the reader currently reads the Word drop down even when it says to not read the Word which shouldn't read when that is the requested because it gives us all options and it stops the reader from re-reading the Word back to back because most of it is in the lesson for each paragraph... also keep the reader reading the Word already inside the lessons this will give us our flow for clarification of the Lord's Word... Are we sure the 6 - 10 reading level is appropriate for that age group? Are we using documentation or neuroplasticity based research to make sure we are helping and reaching our stakeholders in their respective reading and writing levels... we want comprehension... so each user can pick their level... also can we bring those level controls into each lesson so it can be chosen even inside the lessons like the PowerPoint currently do? Flexibility with rigorous control of the system and processes."

## What was measured before anything was changed (SHOULD → ARE)

1. **The reader opened every verse regardless of the switch.** `read-reveal.js` `revealForReading` clicks every `[aria-expanded="false"]` in the reading root unless it is in `NO_EXPAND` (`.tts-controls, [data-read-no-expand], [aria-haspopup], [role="tab"], [role="dialog"]`) or owns a popup. A verse chip (WordInline `WordInline.jsx`, VerseChips `VerseChips.jsx`) is a `<button aria-expanded>` with none of those marks, so with Show the Word OFF the reveal opened each verse and the reader spoke it — immediately after the same verse had been read verbatim inside the paragraph (L141+ carry the quoted Word in the prose, DR-0404). Reproduced in jsdom: the reveal reported one button opened and a `role="region"` verse appeared with the store off.
2. **The reader dropped the reference from the middle of its own sentence.** `buildFollowMap` (`read-follow.js`) mutes `button` wholesale (DR-0299: furniture was being read). Since DR-0402 the reference in lesson prose IS a button, so the primary reading path spoke "Love is patient, as says, and it is kind." — the reference gone. The fallback path (`TTSControl.jsx` `readablePageText`) already honoured `data-read-keep`; the primary path never did. This was not in the report; the new test found it.
3. **The level could not be chosen inside a lesson.** The only age control was the course's "Pace & depth" tab (`ChurchLearn.jsx`, `setAgeBand` / `setLearnLevel`); `TutorPanel` and `AgePacedLesson` received `ageBand` and `levelOverride` but no setter. The Presenter keeps its "Who is in the room" radio row in the speaker bar the whole way through (`Presenter.jsx`) — the pattern Darrell named.
4. **The pace line could say one thing while the words said another.** `resolveForAge` (`learn-framework.js`) lets a standing `levelOverride` win over the band: chain `[override, 'standard']`. The screenshot read "STEP 1 OF 41 · CHILD PACE" over the adult body. Nothing on the surface said an override was in force.
5. **The child ceiling is a corpus number.** `scripts/reading-level.mjs` `CHILD_CEILING = 7.0`, documented as "set from the MEASURED distribution (median 6.1), not from a preference." Flesch-Kincaid grade is a US school-grade estimate; ages 6–10 are grades 1–5. `07-neuroplasticity-and-the-word.md` §5 states plainly that the platform claims no neuroscience result of its own; the bands rest on 1 John 2:12-14 / Hebrews 5:12-14 and on measured pacing. Its `re-review: 2026-09-13` was overdue.

## Decisions

**D1 — The reader reads what is on the screen and never opens the Word itself.** Both verse chips carry `data-read-no-expand`; the reveal pass leaves them as the switch (or the listener's own tap) set them. Switch ON: every verse is open and is read, with its reference line. Switch OFF: the verses stay closed and are not read; the Word already in the prose is still read. A verse the listener tapped open with the switch off is on the screen and is read — surface says truth. The prose chip also carries `data-read-keep`, and `buildFollowMap` now honours it with the fallback path's meaning (a keep at or inside a muted element un-mutes that element only; it can never un-mute a dialog), so "as 1 Corinthians 13:4 says" is spoken as written. The reference strips beneath a paragraph (VerseChips) stay silent as chrome: a list of references is not a sentence (DR-0391); the opened verse text beneath them is read.

**D2 — The level is chosen inside the lesson, on the same remembered state.** `LessonLevelControl` — the Presenter's radio row, pitched for the page — sits at the top of the paced core in every render branch (stepper, read-along whole-core, single segment), only where a host hands in `setAgeBand`; every existing caller renders unchanged. It writes the same device-remembered state the Pace tab writes (one setting, two doors). Two truth rules: a fresh age pick clears a standing depth override, so the words change with the pace (the screenshot case); and whenever the words are not the band's own — an override, or a lesson with no version at that level — the row says so in a sentence, with "Follow my age instead" beside it. The row is `data-read-skip` and contains no `aria-expanded`, so the reader neither speaks nor clicks it.

**D3 — The child ceiling: recommendation, not a change (needs Darrell's decision).** Re-measured 2026-09-15 on 153 lessons, authored prose only (quoted Scripture removed, the register an author controls):

| band | min | p25 | median | p75 | max |
|---|---|---|---|---|---|
| child | 0.0 | 3.8 | 5.2 | 6.3 | 11.2 |
| teen | 2.3 | 5.3 | 6.5 | 7.6 | 13.1 |
| adult | 4.4 | 6.3 | 7.3 | 8.8 | 12.9 |
| senior | 4.9 | 9.4 | 11.4 | 13.7 | 24.2 |

Child lessons over a candidate ceiling: **7.0 → 17**, 6.0 → 47, **5.0 → 82**, 4.0 → 107 (of 153). The median has fallen from 6.1 (2026-09-06, 128 lessons) to 5.2; L141–L154 measure 0.0–5.0 (most under 2.1) — very short sentences, and a proxy that reads near zero on them, which is a reason to treat FK as a gross-case detector, not a comprehension measure (DR-0332). No research citation is on file that maps FK grade to ages 6–10 for this audience, and none is claimed. **Recommendation:** keep 7.0 as the never-worse ratchet for the existing corpus (shrink-only, as today) and add a second, stricter ceiling of **5.0 for NEW lessons only** (the top of the band's grade range), so the debt does not grow while the 82 existing lessons are brought down one at a time as they are re-authored; alongside it, every learner can now pick their own level inside the lesson (D2), which is the comprehension control that does not depend on the proxy. Not applied: a ceiling that puts 82 lessons in debt is authoring work and a bright line Darrell holds. `re-review: 2026-09-29` with this exact question and this table.

## Proof (DR-0076 §3)

- `the-reader-honours-show-the-word.test.jsx` — with the two attributes and the `buildFollowMap` change stashed, 3 of 4 tests fail (reveal opens the chip in prose, opens the chip in a strip, and the reference is missing from the reading); with them, 4/4 pass. A plain disclosure beside the chip is still opened, so the reveal is not disarmed.
- `the-level-is-chosen-inside-the-lesson.test.jsx` — 11 tests: the row exists in all three render branches, is checked on the band in force and sits above the step line; a pick reaches `setAgeBand`; the override case names the override and clears it on a fresh pick; "Follow my age instead" clears it alone; a no-version-at-band lesson is said plainly; the band's own words print no note; no setter → no row; the setters are threaded from the course through `TutorPanel` to `AgePacedLesson` (source-level pin).
- Neighbours green: read-reveal, read-reveal-nested, reader-reads-content-not-chrome, read-follow (20), read-follow-block-boundaries, reader-follows-on-a-page-without-main, reader-learn-follow, read-all-reads-every-step, learn-flow-reads-clean-refs-below, the-word-is-in-the-sentence.

## Not done, with why and date

- The Show-the-Word switch is not surfaced inside the reader's own pill while reading; it is on the lesson bar and in the reader card. `re-review: 2026-09-22` — measure whether listeners flip it mid-read.
- ~~The child ceiling change (D3) awaits the decision above.~~ Decided and shipped the same day; see the amendment.

## Amendment 2026-09-15 — D3 approved and shipped: the age ceiling for new lessons

Darrell, reading the recommendation: **"Yes. Nice! Timeline?"** — and two questions with it: *"Users will be able to look at the current lesson and change it instantly to their capacities based on their experience?"* and *"Grades? – etc?"*

**The mechanism.** `NEW_LESSON_CHILD_CEILING = 5.0` beside `CHILD_CEILING = 7.0` in `scripts/reading-level.mjs`. The baseline now carries `knownLessons`: the 153 lesson ids on disk at this decision, fixed, never rebuilt from a scan. A lesson not in that list is new and its child level must measure ≤ 5.0 or the build fails (`ratchet().freshOverNewCeiling`); a known lesson keeps the shrink-only 7.0 ratchet. A lesson is therefore either held to the age or recorded as debt, never quietly promoted from one to the other. Proven-to-catch: a child level measuring 6.0 in an unknown id passes the 7.0 ratchet and FAILS the age ceiling; the same text under a known id is judged by 7.0 only; a grade-2 new lesson passes; `knownLessons` survives a baseline rebuild; every lesson on disk today is in it (28/28 gate tests).

**Grades, in one table.** Flesch-Kincaid grade ≈ the US school grade a reader needs. The bands, their ages, the grades those ages sit in, the ceiling that now applies, and the corpus today (authored prose only):

| band | ages | US grades | ceiling | median today | max today |
|---|---|---|---|---|---|
| child | 6–10 | 1–5 | **5.0 new** / 7.0 existing | 5.2 | 11.2 |
| youth | 11–14 | 6–8 | reads the teen text | — | — |
| teen | 15–17 | 9–12 | ordering only (child ≤ teen) | 6.5 | 13.1 |
| adult | 18–64 | — | none | 7.3 | 12.9 |
| senior | 65+ | — | ordering only (teen ≤ senior) | 11.4 | 24.2 |

The youth band has no text of its own: `depthChainForAge('youth')` reads the teen level at youth pacing (90 words a step). That is a gap the table makes visible; it is recorded here, not fixed here. `re-review: 2026-09-29` — decide whether youth (grades 6–8) needs its own authored level.

**Instant switching, by experience.** Yes, and verified in code, not assumed: the row in the paced core writes the same state the Pace tab writes (`setLearnAgeBand` in the app shell); `TutorPanel` rebuilds the arc from `ageBand` on every render, `lessonPlanForAge` re-resolves the text and the pacing, and the stepper re-renders in the same tap. The labels are ages, but the pick is free — Hebrews 5:14 makes capacity a matter of USE, so a sixty-year-old new believer picks the child words and a well-taught fifteen-year-old picks the adult words, inside the lesson, without leaving it. The row says whose words are on the screen when they are not the band's own.

**Timeline (DR-0075: a why and a date, never a silent park).**
- Gate live: this merge (2026-09-15). No lesson written from today can ship a child level above grade 5.
- The 17 child levels over 7.0 (the worst): re-authored first, one lesson at a time through the same lane as L151/L149, each measured before and after. `re-review: 2026-09-22` with the count.
- The remaining 65 between 5.0 and 7.0: brought down as each lesson is touched for the owed-anchor work (DR-0404: L146, L147, L148, L150, L145, L141 next) and then in lesson order, with the measured table re-run and posted on each pass. `re-review: 2026-10-13` — the count, and whether the pace needs to change.
- The proxy stays a gross-case detector (DR-0332); the learner's own pick is the comprehension control that does not depend on it.
