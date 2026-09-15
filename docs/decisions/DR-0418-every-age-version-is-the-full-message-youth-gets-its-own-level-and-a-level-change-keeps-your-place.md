# DR-0418 — Every age version is the full message; youth gets its own level; a level change keeps your place

- **Status:** accepted (framework shipped; the authoring debt it measures is open and dated)
- **Tier:** A for the framework (additive gate, additive band slot, a place-mapping fix); the authoring pass it starts is COLG-facing teaching content and rides the normal lane lesson by lesson
- **Type:** product
- **Date:** 2026-09-15
- **Scope:** `scripts/full-levels.mjs` (the fullness measure, floors, ratchet), `app/src/lib/full-levels-baseline.json` (shrink-only debt: 153 lessons), `app/src/__tests__/living-lessons-full-levels.test.js` (proven-to-catch), `app/src/lib/learn-framework.js` (`youth` becomes its own depth: youth → teen → standard while unwritten), `app/src/__tests__/living-lessons-adult-band-debt.test.js` (youth judged at its recorded debt), `app/src/components/ChurchLearn.jsx` (`AgePacedLesson` maps the step proportionally when the plan re-chunks), `app/src/__tests__/the-place-survives-a-level-change.test.jsx`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §4 — measure, don't claim), NOTHING-WAITS (DR-0236), SURFACE-SAYS-TRUTH (P15), PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS (DR-0011)
- **Grounds:** Darrell 2026-08-25 ("full message, age-simple", "THE SHORT LESSON IS THE ONLY PROBLEM"); Darrell 2026-09-15 (below); DR-0417 (the level is chosen inside the lesson; the age ceiling); `07-neuroplasticity-and-the-word.md` (1 John 2:12-14 — three registers of one truth; Hebrews 5:14 — capacity by use)

## The report

Darrell, 2026-09-15, in four messages while the age ceiling was shipping:

> "Even if half of the way through they decided to change levels they can... make sense?"
> "I want all levels to be full now... why wait?!!!!!!"
> "Flexibility with rigorous control of the system and processes..." (with the standing assessment headings)
> "Timeline?!"

## What was measured first (SHOULD → ARE → GAPS)

**SHOULD.** `learn-framework.js` `resolveForAge` states in its own comment: *"each age version is authored at FULL COVERAGE (every point of the lesson, in that age's words), so no band is ever handed a fragment."* The foundation doc §3 repeats it: *"A child level is never a shortened adult level."*

**ARE.** Measured 2026-09-15 across all 153 living lessons (words, whole-corpus):

| band | median words | median share of the adult lesson | lessons under ½ | lessons under ⅓ |
|---|---|---|---|---|
| adult (`lesson`) | 1,395 | — | — | — |
| child | 211 | **0.16** | 153 | 149 |
| teen | 344 | **0.26** | 148 | 104 |
| senior | 583 | **0.41** | 98 | 55 |
| youth | 0 | — | 153 (no level of its own; reads teen) | — |

Adult words in the corpus: **294,872**. The newest lessons are no different: L149's child level is 161 words against 4,414 adult words; L142's 229 against 3,929.

**GAPS.** The claim was false by measurement. Every child level is a fragment of the message it claims to carry; the youth band (ages 11–14, grades 6–8) has never had a level of its own — `depth: 'teen'` served grades 9–12 text at youth pacing, and the "zero gaps for youth" the band-debt gate reported was true only under that definition. And a learner who changed level half-way through was clamped: step 20 of 41 child steps became the last adult step, which reads as "the lesson ended".

## Decisions

**D1 — "Full" is measured, floored, and ratcheted.** `scripts/full-levels.mjs` measures each band's word share of the adult lesson. The floors are a **decision, not a finding** (recommend-and-proceed, DR-0111): child ≥ 0.5 (simpler words are shorter words), youth / teen / senior ≥ 0.6. Every band under its floor or missing is recorded in `full-levels-baseline.json` as shrink-only debt: today **153 of 153 lessons** (child 153 · youth 153 · teen 151 · senior 115). A NEW lesson ships full or fails the build; a full band may never be shortened again; healed entries must be removed. The proxy is named as a proxy: a band above the floor may still be thin and the author's eye still judges; a band below it is certainly short.

**D2 — Youth has its own level.** `AGE_BANDS.youth.depth = 'youth'`, chain youth → teen → standard, so a lesson with `levels.youth` serves it and one without reads the teen text exactly as before — no learner sees less than today. The band-debt gate judges youth at its recorded debt from the fullness baseline rather than pretending the teen text is a youth level.

**D3 — A level change keeps the place.** `AgePacedLesson` maps the step proportionally when the plan's segment count changes (half-way stays half-way) and reports the mapped step through `onStepChange` so the saved place follows. Proven: the previous component shows "Step 12 of 12" where the new one shows step 7.

**D4 — The authoring pass starts now and runs in the lane, lesson by lesson.** Each lesson gets four full levels (child ≤ 5.0 FK where it is re-authored, youth, teen, senior), every quoted verse pulled verbatim from the corpus, the per-lesson verse gate, provenance, age-appropriateness, reading-level ordering and this fullness gate green before push; the baseline shrinks in the same commit. First lesson: **L151** (the pattern Darrell set: one lesson first, seen live).

## The timeline, from the numbers (not a promise)

Words to author at the floors: child 0.5 × 294,872 ≈ **147k**; youth, teen, senior 0.6 × 294,872 ≈ **177k each**; total ≈ **680k words**, roughly 4,450 per lesson on average (L151 alone ≈ 11,800). At the throughput of this lane — a lesson authored, gated and shipped in roughly 20–40 minutes depending on its length — that is **153 lesson-cycles ≈ 60–90 hours of continuous session work**, landing one merge at a time from today. It cannot be one push; it is one lesson after another without a pause between them.

- Framework (this record): merged 2026-09-15.
- L151 full: same session.
- Then in the DR-0404 owed order (L146, L147, L148, L150, L145, L141), then L154 downward, so the newest lessons — the ones on his screen — are full first. Every pass re-runs the table above and posts it.
- `re-review: 2026-09-22` — lessons full, words authored, throughput measured; adjust the order or the floors from data.
- `re-review: 2026-10-13` — the count again; expected roughly a third of the corpus if the lane runs daily.

## Amendment, same day — the measure counts the TEACHING, not the quotations

Writing L146's 26 owed anchors into its body (DR-0404's standing work) grew the adult lesson from 1,009 to 1,724 words with no new teaching — every added word was verbatim Scripture — and the senior band, untouched and full, fell from 0.83 to 0.48 of it. The first measure would have called a band "shortened" that nobody touched, on every lesson the anchor work still has to visit. So `measureFullness` now counts **authored prose with double-quoted spans removed on both sides** (`proseWords`, via the reading-level gate's `ourProseOnly` — the same register, for the same reason, DR-0332). A quoted verse is the Word, carried by the anchor work and verified by its own gates; this measure asks whether the message is taught in the age's own words. Re-measured on that basis (153 lessons):

| band | median prose words | median share of adult prose | lessons short |
|---|---|---|---|
| adult prose | 909 (188,857 total) | — | — |
| child | 176 | 0.21 | 151 |
| youth | 0 | — | 152 |
| teen | 231 | 0.28 | 150 |
| senior | 374 | 0.44 | 126 |

The picture is the same; the numbers are honest to what they measure. Words to author at the floors, restated: child ≈ 94k, youth / teen / senior ≈ 113k each, **≈ 435k words** in total (down from the 680k the first measure implied, because a third of the corpus is quotation). The baseline was rebuilt on the new measure in the same commit; the gate's proven-to-catch tests pass unchanged because they were written in plain prose.

## L151 — the first full lesson, measured after the write (same session)

| band | words before | words after | share of adult | FK grade | steps at its pace |
|---|---|---|---|---|---|
| child | 874 | 2,619 | 0.51 | 0.8 | 55 |
| youth | 0 | 3,587 | 0.70 | 3.8 | 38 |
| teen | 2,227 | 3,121 | 0.61 | 3.5 | 22 |
| senior | 4,173 | 4,173 | 0.81 | 6.1 | 34 |

The child level now carries every one of the lesson's thirteen sections at child words (the stakes and the two harvests, creation by speaking, the four pictures, no man tames it, the heart upstream, the fountain, the counted costs, the right and wrong uses, the audit, the certainty that is the problem, correction as diagnosis, the way you cannot see, the mind that predicts, humility, the on-ramp, the spouse who will not read, the mocker, the missing prerequisite, the method, frustration, sustaining, the body, the accounting and the prayer). The youth level is new. The teen level lost a refrain that had been pasted four times and gained the counted costs, the toolbox of right uses, the audit, the marriage duties, Nehemiah, and the accounting. Every verse in all three was expanded from the hosted KJV at write time. Gates green on the written lesson: fullness (L151 no longer short in any band; baseline 153 → 152 lessons short), reading-level ordering (child 0.8 ≤ teen 3.5 ≤ senior 6.1, all under both ceilings), age-appropriateness, provenance, L151's verse gate, the naming gate, the band-debt gate. **Measured throughput for the timeline:** L151 (the longest lesson in the series, 5,146 adult words) took about 45 minutes from first word to green gates, authoring ≈ 6,200 new words. That is the upper bound per lesson; the median lesson is a quarter of L151's length.

**One thing the numbers expose, recorded rather than fixed here:** `estimatedMinutes` multiplies steps by the band's `segmentMinutes` (child 5, youth 10), which reads a 45-word child step as five minutes and prices L151's child level at 275 minutes. The step count is right; the minute estimate is a pre-existing over-statement of the pacing model, not of the text. `re-review: 2026-09-22` alongside the child step length.

## L146 — the second full lesson (same session, with its DR-0404 anchors in the same pass)

| band | prose words before | prose words after | share of adult prose | FK grade |
|---|---|---|---|---|
| child | 266 | 763 | 0.79 | 0.9 |
| youth | 0 | 952 | 0.99 | 4.2 |
| teen | ~230 | 592 | 0.61 | 3.4 |
| senior | 695 | 695 | 0.72 | 4.9 |

Two gate catches, both kept as designed: the provenance ratchet refused a capitalised "While" inside a Romans 5:8 quote (the quote was corrected); the reading-level ordering refused a teen extension that measured 5.9 against the senior band's 4.9 (rewritten in shorter sentences to 3.4). Fullness baseline 152 → 151 lessons short. Throughput: about 25 minutes from measurement to green gates for a 1,009-word lesson, including its 26 anchors.

## L147 — the third full lesson (same session)

| band | prose words before | prose words after | share of adult prose | FK grade |
|---|---|---|---|---|
| child | 146 | 641 | 0.72 | 1.0 |
| youth | 0 | 828 | 0.93 | 4.3 |
| teen | 257 | 550 | 0.62 | 4.1 |
| senior | 393 | 543 | 0.61 | 8.5 |

Fullness baseline 151 → 150 lessons short. Two catches from the per-lesson verse gates, both kept: the typography rule (Yahweh in our voice, never the generic term) caught twelve places across L146's and L147's new bands; the verbatim-span rule caught a non-Scripture phrase in quotation marks. Both are exactly the class of error a machine catches better than an author's eye, and both were fixed in the text, never in the gate.

## L148 — the fourth full lesson (same session)

| band | prose words before | prose words after | share of adult prose | FK grade |
|---|---|---|---|---|
| child | 141 | 812 | 0.75 | 1.3 |
| youth | 0 | 974 | 0.90 | 5.1 |
| teen | 265 | 681 | 0.63 | 3.0 |
| senior | 595 | 653 | 0.61 | 7.7 |

Fullness baseline 150 → 149 lessons short. The first pass left teen at 0.48 and senior at 0.47 — under the floor, and the gate stayed green only because both were already recorded as debt; a lesson in this pass is made FULL, not merely no worse, so both were extended before the commit. That is the honest reading of "shrink-only": the baseline permits an old debt to stand, and the pass does not.

## L150 — the fifth full lesson (same session)

| band | prose words before | prose words after | share of adult prose | FK grade |
|---|---|---|---|---|
| child | 225 | 873 | 0.61 | 2.3 |
| youth | 0 | 1,090 | 0.77 | 5.1 |
| teen | 345 | 968 | 0.68 | 2.4 |
| senior | 802 | 904 | 0.64 | 16.3 |

Fullness baseline 149 → 148 lessons short. The first teen extension was a list of verses with a sentence between each and measured 0.33 of the adult prose: quotations do not count, by this record's own amendment, and the teen level was rewritten as a nine-step walk in the teen's own words. The typography rule caught the generic term twelve times in the new text; every instance was rewritten or quoted verbatim with its label.

## L145 — the sixth full lesson (same session)

| band | prose words before | prose words after | share of adult prose | FK grade |
|---|---|---|---|---|
| child | 234 | 758 | 0.67 | 1.4 |
| youth | 0 | 976 | 0.86 | 6.4 |
| teen | 369 | 704 | 0.62 | 3.7 |
| senior | ~700 | 746 | 0.66 | 8.2 |

Fullness baseline 148 → 147 lessons short. Six lessons full in one session (L151, L146, L147, L148, L150, L145): measured throughput 20–45 minutes per lesson including its DR-0404 anchors and every gate, which is the number the timeline above was waiting on.

## D5 (added the same night) — Refresh first: the resume banner replays the last steps on request

Darrell, 2026-09-15: *"Child lessons also condense the lessons for the younger students or just they start where they left off? I like making sure they start where they left last time they were using or learning so it can be a refresher if they wanted it."* Measured before building: the child levels WERE condensed (this record, D1) and are being made full; resume-your-place already existed (`lib/learn-resume.js`, the "Pick up where you left off" banner with Resume and Start fresh); what did not exist was the refresher. Built: `backUpPlace` / `refreshPlace` back the saved place up `REFRESH_BACK_STEPS` (2) paced steps inside the same stage, never below the first step, clearing the saved sentence; the banner offers **Refresh first** whenever the saved step is past the first, and it resumes exactly as Resume does — the lesson space reads the place live, so it opens on the refresher rather than the frontier. Proven-to-catch: the pure helper's test fails with an unchanged place; the render test finds no such button on the previous banner. Not offered at step 0 (nothing behind it to replay); a learner can still step back by hand inside the lesson.

## L154 — the seventh full lesson, and the first with no owed anchors (same night)

| band | prose words before | prose words after | share of adult prose | FK grade |
|---|---|---|---|---|
| child | 488 | 1,614 | 0.85 | 1.8 |
| youth | 0 | 1,801 | 0.95 | 5.7 |
| teen | ~800 | 1,331 | 0.70 | 3.9 |
| senior | ~1,100 | 1,498 | 0.79 | 16.0 |

Fullness baseline 147 → 146. L154's own verse gate carries an ascending-length rule (child < teen < senior in characters), which the first two passes tripped because a full child level is long; the teen and senior levels were lengthened with real content (the cousin who is himself the father; three forms of the question a pastor meets) until every band both clears its floor and ascends. The rule is kept: it is the shape the older lessons were built to.

## Not decided here (surfaced, with recommendations)

- The floors (0.5 / 0.6) are the recommended default. Darrell may set them higher; raising them only grows the recorded debt, never hides it.
- Whether the youth level is authored in the same pass as child/teen/senior (recommended: yes — the lesson is open, the message is in hand) or as a second pass.
