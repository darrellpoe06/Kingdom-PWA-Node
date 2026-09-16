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

## L152 — the eighth full lesson (later the same night), and the order from here

Crying Because of All the Dying, on the same measure (authored prose · share of adult prose · Flesch-Kincaid; adult prose 1,236 words):

| band | before | after |
|---|---|---|
| child | 189 · 0.15 · 0.0 | **809 · 0.65 · 1.3** |
| youth | missing | **1,078 · 0.87 · 3.7** (new) |
| teen | 460 · 0.37 · 7.7 | **907 · 0.73 · 5.6** |
| senior | 749 · 0.61 · 12.9 | 749 · 0.61 · 12.9 (already full) |

Every section of the adult body is carried in each band: the tears as the mark, the renaming of slow dying and Hosea's rejected knowledge, the two slownesses, who wants the dying and who held the power of death, the tears as fuel and the trap of contempt, the hinge and its three tenses, the honest posture in the valley, joy as the strength. The child and youth texts each quote verbatim what they name. Fullness baseline 146 → 145.

**L153 is excluded from this pass, on Darrell's word** (2026-09-15: *"Don't mess with that Programer lesson though... that was too good!!!"*). Its bands measure full already in the youth/teen/senior sense of the corpus (the baseline records it short in all four, because its child level was written to the program metaphor at a length he chose), and the message he praised is the shape he wants kept. This is a recorded non-improvement under DR-0075: **why** — the author's own judgment on a lesson he called the standard; **re-review: 2026-10-13** — ask him whether a child version of the program lesson should be written new beside it rather than by re-cutting his text.

**The order from here:** L144, L143, L142, L141, then L140 and downward, each pass posting this table. Measured at this session's end: 8 lessons made full in one day at 20–45 minutes each, so the 2026-09-22 re-review can set the pace from a real day rather than the estimate above.

## L144 — the ninth full lesson (2026-09-15, the next morning of the lane)

A False Balance, on the same measure (authored prose · share of adult prose · Flesch-Kincaid; adult prose 2,786 words, the longest body in the pass so far):

| band | before | after |
|---|---|---|
| child | 173 · 0.06 · 1.5 | **1,462 · 0.52 · 1.5** |
| youth | missing | **1,842 · 0.66 · 4.3** (new) |
| teen | 268 · 0.10 · 7.2 | **2,005 · 0.72 · 7.2** |
| senior | 806 · 0.29 · 9.2 | **1,735 · 0.62 · 9.2** |

Every section of the adult body is carried in each band, at the register of the band: the weight as a promise and its national outcome; a loan as a scale and ability as Heaven's criterion; the Federal Reserve survey and the matched-pair tests as two instruments with one finding; the six million jobs and the mechanism Darrell named; the correction he asked for (the disparity stands, the channel is the rotating credit circle, and esusu is the inheritance); the inspection switched off (section 1071, the EEOC and Civil Rights Division figures); the markers, the July replacement panel, and the landmark verses; the cases told to their actual end (Wilcox upheld in December 2025; the 113,000 stated against the looser three hundred thousand; distribution measured, motive not); Nehemiah's same-day restitution; the posture (vengeance His, the mouth still open); the two ways and Heaven and earth called to record. The senior pass adds what the older men in the room already hold: the testimony Darrell gathered, recorded as a recurring account and not as one named case, and the pooled circle under the names their generation used. The child and youth texts each quote verbatim what they name. Fullness baseline 145 → 144.

## L143 — the tenth full lesson (2026-09-15)

Yahweh's Will Be Done on Earth, on the same measure (authored prose · share of adult prose · Flesch-Kincaid; adult prose 1,776 words):

| band | before | after |
|---|---|---|
| child | 224 · 0.13 · 1.8 | **1,108 · 0.62 · 2.2** |
| youth | missing | **1,448 · 0.82 · 7.2** (new) |
| teen | 306 · 0.17 · 7.6 | **1,340 · 0.75 · 9.3** |
| senior | 375 · 0.21 · 16.4 | **1,153 · 0.65 · 10.5** |

Every section of the adult body is carried in each band: the cost of seeing and the joy as fuel; the economy as legislation with a clock (release, no usury of a brother, jubilee, the open hand); the guarantee no human framework attaches; mammon named; debt as a governing relationship and what was done to the children; the documented shape of the present system stated as documentation; the older fact and the turn (the wealth was produced, so it is producible); restitution with arithmetic; the present-day mortgage figures stated in all three parts; the credential question; the segregation-era proof of concept; the mutual economy of Acts 4; the release never about money; build it here. The senior pass adds the pastoral sequence for a mixed room and the older members' own memory of the burial society, the lodge and the fund, as a working manual. Fullness baseline 144 → 143.

## L142, L141 and L140 — the eleventh, twelfth and thirteenth full lessons (2026-09-15, one push)

Measured by the gate's own counter (`scripts/full-levels.mjs` proseWords; authored prose · share of adult prose), reading level by Flesch-Kincaid on the same prose:

**L142 It Is Written Again** (adult prose 2,531; floors child 1,266, others 1,519):

| band | before | after |
|---|---|---|
| child | 226 · 0.09 · 0.7 | **1,352 · 0.53 · 1.4** |
| youth | missing | **1,907 · 0.75 · 5.1** (new) |
| teen | 294 · 0.12 · 8.1 | **1,740 · 0.69 · 7.4** |
| senior | 333 · 0.14 · 15.6 | **1,657 · 0.65 · 8.6** |

Every band carries the method (the garden edit, the clipped psalm, "It is written again", Peter's two causes), the pastoral rule, all four planks with the true half conceded first, the 1807 Slave Bible, the oldest instance, the charter that proves nothing, why He gives the device, untouchable and touched, the fire, why they cannot see, and taste and see. The teen band adds the gate's own discipline turned on the house; the senior band adds the manner across the table.

**L141 Separate and Connect** (adult prose 1,397; floors child 699, others 839):

| band | before | after |
|---|---|---|
| child | 462 · 0.34 · 3.9 | **974 · 0.70 · 2.2** |
| youth | missing | **1,013 · 0.73 · 4.6** (new) |
| teen | 571 · 0.42 · 5.3 | **1,003 · 0.72 · 6.0** |
| senior | 713 · 0.52 · 15.7 | **1,057 · 0.76 · 14.8** |

All eight questions in each band: the sword and the peace as one motion, the Matthew 18 procedure with its guardrails, study to be approved, study without reading, misunderstanding and its cures, tempted versus tried, seasons, and enemies.

**L140 The People of Judah and the People of the Way** (adult prose 3,654 — the longest body in the corpus; floors child 1,827, others 2,193):

| band | before | after |
|---|---|---|
| child | 500 · 0.15 · 3.1 | **1,923 · 0.53 · 2.2** |
| youth | missing | **2,314 · 0.63 · 4.6** (new) |
| teen | 874 · 0.27 · 7.3 | **2,516 · 0.69 · 8.7** |
| senior | 1,344 · 0.41 · 10.7 | **2,296 · 0.63 · 10.7** |

All eleven parts in each band: who Judah is and the timeline; scattered, never lost, with the debate named to teach past it; the Way; the tribe from every nation by the graft; joined, never replacing; whom to listen to (one Voice, one test); the two untils; psyops and known by love; more than conquerors; the Way kept and wages stolen; which country, Harriet Tubman as history, a means of making money, sold to all nations, and the if. Where the Word stops, every band stops: no modern date, no living man named a tribe.

Fullness baseline 143 → 140. Thirteen lessons full in one day at the measured pace; the 2026-09-22 re-review sets the order from L139 downward.

## L139 — the fourteenth full lesson (2026-09-15)

The Sceptre of Judah (adult prose 3,609 by the gate's counter; floors child 1,805, others 2,166). The "before" column is the session's own word count, the "after" column the gate's (`scripts/full-levels.mjs`), which counts about a tenth more; both are stated so neither is mistaken for the other:

| band | before | after (gate counter) |
|---|---|---|
| child | 258 · 0.08 · FK 3.1 | **1,920 · 0.53** |
| youth | missing | **2,521 · 0.70** (new) |
| teen | 488 · 0.15 · FK 5.9 | **2,493 · 0.69** |
| senior | 610 · 0.19 · FK 8.4 | **2,251 · 0.62** |

All of the lesson in each band: the verse and Jacob's last-days frame; who Judah is (the man, the tribe, the kingdom, the people); the sceptre by choice and by oath; who Shiloh is, by the gathering and by the right; until as arrival, not expiry; humans will listen to Judah; the Lion who is the Lamb; the war on the sceptre; the one Lawgiver who wants His ways; the whole tribe of law-carriers; the percentage corrected to alignment; the god of this world versus the Law with the civil rights movement as history; media, music and the Word's own star; the church that shut the door and the unseen church that praised Him anyhow; black and beautiful; unseen because the Word is not their guide; and where the Word stops. The child band carries the relay picture; the senior band the elder's testimony and the restraints. Fullness baseline 140 → 139.

**Caught by the lane on this pass, recorded so it is not repeated:** three sentence-initial "The devil" in the L140 and L142 child bands and three more in the L139 bands tripped the adversary guard (`adversary-is-never-capitalized.test.js`); the house rule is never sentence-initial, so the sentences were recast ("It is the devil who…", "Then the devil…", "Yes, the devil…"). And the L139 gate's proven-to-catch clause caught "Judah is done" in the child band's own paraphrase of the error it was refuting; recast to "Judah stops mattering", which the gate allows because it is not the lesson's claim.

## L138 — the fifteenth full lesson (2026-09-16)

Exercised Senses (adult prose 1,835 by the gate's counter; floors child 918, others 1,101). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 355 · 0.21 · FK 1.4 | **1,296 · 0.71** |
| youth | missing | **1,390 · 0.76** (new) |
| teen | 554 · 0.32 · FK 3.6 | **1,264 · 0.69** |
| senior | 691 · 0.40 · FK 6.3 | **1,211 · 0.66** |

All seven parts in each band: He is not stingy and does not lecture; why it is not a download (exercised, by reason of use; a dawn, not a switch); do, then know (alignment is the road, not the toll); what the tests are for since He already knows; why it seems to come after; what He keeps, what He gave, and where the lack is really from; diligence evaluated by Yahweh and aimed at His Word (seek, do, teach; the ever-learning counterfeit). The child band adds the piano and the sunrise; the teen band turns the four reasons into habits and names the fear the adversary wants carried; the senior band the elders as the room's evidence and their own humility rep. Fullness baseline 139 → 138.

## L137 — the sixteenth full lesson (2026-09-16)

Look and Live (adult prose 1,526 by the gate's counter; floors child 763, others 916). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 320 · 0.22 · FK 1.9 | **984 · 0.64** |
| youth | missing | **1,248 · 0.82** (new) |
| teen | 650 · 0.45 · FK 4.6 | **1,065 · 0.70** |
| senior | 810 · 0.56 · FK 7.1 | **1,086 · 0.71** |

All six parts in each band: the type is His (John 3:14-16 as the explanation of the pole); what was on the pole (the cure shaped like the curse, the Lamb and the serpent both); the look was believing (the sin was a sentence; nobody looked well; the look is not a work); how far and how long (whosoever; eternally, the picture smaller than the Person); the serpent's end in the Word's words; the serpents not taken away and the sign that became Nehushtan; where the Word stops. Fullness baseline 138 → 137. One sentence-initial "the devil" in the child draft was caught by the session's own scan before the lane and recast.

## L136 — the seventeenth full lesson (2026-09-16)

Touched With the Feeling (adult prose 2,679 by the gate's counter; floors child 1,340, others 1,608). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 625 · 0.24 · FK 1.4 | **1,818 · 0.68** |
| youth | missing | **1,754 · 0.65** (new) |
| teen | 1,422 · 0.55 · FK 4.7 | **1,734 · 0.65** |
| senior | 1,745 · 0.67 · FK 9.7 | **2,003 · 0.75** |

All twelve movements in each band: the sympathy as fact; without sin as completeness (the exit nobody but He refused); made sin, numbered, wounded rather than "felt like a sinner"; how He was tempted at all (nothing in Me); the weight measured in damage, not desire (the advertisement inversion); the old priest's shared guilt against His; the judgment never grounded in sampling; He knows you without a briefing; what the sympathy is for (your nerve, not His verdict); what it does to prayer; where the Word stops; where it lands. The child band keeps the L136 gate's own child rules: no made-to-be-sin abstraction and no Levitical comparison quoted at child level (two verses the first draft quoted were replaced with child prose, caught by the gate before the lane). Fullness baseline 137 → 136.

## L135 — the eighteenth full lesson (2026-09-16)

They Called Every One of Them George (adult prose 3,008 by the gate's counter; floors child 1,504, others 1,805). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 820 · 0.28 · FK 1.3 | **1,890 · 0.63** |
| youth | missing | **1,930 · 0.64** (new) |
| teen | 1,312 · 0.45 · FK 6.7 | **1,881 · 0.63** |
| senior | 1,731 · 0.59 · FK 12.3 | **2,063 · 0.69** |

All thirteen parts in each band: the telling with its one precision; the name they took; the porter honoured in the Word; Yahweh names and never un-names; Hagar; hired to be invisible and therefore positioned, with the guard; what the Word says about stealing a man (kept out of the child band per the L135 gate's own child rules); shut out by the builders; the wage Yahweh legislated; good news from a far country; thirty years then one phone call; the One who took the servant's form and was given the Name; the one small instruction. The L135 gate also holds the child band shorter than the senior; the first draft's senior was 119 characters too short and was given the elders' two-ledgers paragraph. Fullness baseline 136 → 135.

## L134 — the nineteenth full lesson (2026-09-16)

Divers Weights: when the question keeps moving, the record that stands, and the better assignment (adult prose 2,382 by the gate's counter; floors child 1,191, others 1,430). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 471 · 0.20 | **1,387 · 0.58** |
| youth | missing | **1,599 · 0.67** (new) |
| teen | 829 · 0.35 | **1,481 · 0.62** |
| senior | 1,136 · 0.48 | **1,636 · 0.69** |

All eight parts in each band: the scene and the comment that was wiser than the video; the moving goalpost named in the Torah as divers weights, not a figure of speech; you do not owe a rigged question an answer, with the Master as the proof; honour is a debt; the record stated plainly (Latimer's filament, Williams's pericardium, the thin attributions called thin, the electret microphone in the phone); why telling it exactly right is the stronger honour; the frame underneath (one image, one blood, one Giver); the better assignment, which is the children. The teen band adds the two objections young readers actually hear and the Bezaleel frame for the school's engineering track; the senior band adds the elders' testimony, the once-a-year list read aloud at the table, and the two failures that look like strength. The first draft's teen and senior each sat 29 and 19 words under the floor and the senior was shorter than the child, which the age gate forbids; both were extended. Fullness baseline 135 → 134.

## L133 — the twentieth full lesson (2026-09-16)

How to See the Whole Torah at Once: the twelve patterns and the two questions that opened them (adult prose 1,871 by the gate's counter; floors child 936, others 1,123). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 345 · 0.18 | **1,010 · 0.54** |
| youth | missing | **1,338 · 0.72** (new) |
| teen | 675 · 0.36 | **1,131 · 0.60** |
| senior | 742 · 0.40 | **1,156 · 0.62** |

All nine parts in each band: the discipline of named versus shown; the Three on the first page before there is an enemy; the Spirit in all five books; the One who is seen and carries the Name; what Yahweh meant by our likeness (a communion, family language, self-giving — Judah, Moses, Aaron, and the coats of skins first); the chain of substitution from the garden to the pole; the enemy named with the one playbook; the hard pattern that knowing did not prevent it, with Deuteronomy 29:4 keeping it from contempt; and the whole picture. The child band keeps its gate's own three marks (what a pattern is, the three tricks, points to Jesus) and walks each pattern a second time with a job to do; the youth band is the full nine patterns in a teenager's voice; the teen adds the two questions answered in their own words and the pencil-mark reading plan; the senior adds three charges, Bezaleel for the school, and the table assignment. Fullness baseline 134 → 133.

## L132 — the twenty-first full lesson (2026-09-16)

The Whole Salvation Plan Inside Genesis Alone, and the Godhead at War with the Enemies from the First Pages (adult prose 2,343 by the gate's counter; floors child 1,172, others 1,406). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 410 · 0.17 | **1,237 · 0.53** |
| youth | missing | **1,601 · 0.68** (new) |
| teen | 788 · 0.34 | **1,416 · 0.60** |
| senior | 914 · 0.39 | **1,433 · 0.61** |

All nine parts in each band: the Three on page one before there is an enemy; the enemy's three moves on the record; Yahweh seeks before He sentences; the whole rescue announced to the enemy as his sentence; the first covering Yahweh provided and the way kept, not demolished; the plan the length of Genesis (Abel, the Spirit striving, grace by name, the blessing for everybody, righteousness counted, the covenant Yahweh walked alone, the Lamb on Moriah, the ladder, the ford, the sceptre, Joseph's sentence); the enemies named early; the Three working together against them; and why the case borrows nothing from later. The child band keeps its gate's own marks (the sore heel that gets better; Jesus is the Lamb) and walks the plan a second time with a job to do; the youth band is the full nine parts in a teenager's voice; the teen adds the three moves as today's pressure, the covenant walked alone, the five-minute Genesis-only telling and Bezaleel for the school; the senior adds four charges and the table. Fullness baseline 133 → 132.

## L131 — the twenty-second full lesson (2026-09-16)

Joy Is Not Happiness: three days, one strength, and the Word as the code that runs each of them (adult prose 1,330 by the gate's counter; floors child 665, others 798). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 321 · 0.24 | **753 · 0.57** |
| youth | missing | **1,013 · 0.76** (new) |
| teen | 401 · 0.30 | **806 · 0.61** |
| senior | 474 · 0.36 | **816 · 0.61** |

All movements in each band: happiness as a readout and strength wired to joy; the weeping crowd the verse was issued to; the four-line code (read, source, act, strength); the bad day with Habakkuk's Yet, James's ledger word and the Philippian jail; the okay day as the dangerous one, the Maker of the day and the discipline of counting; the great day with the seventy, the Giver and the shared win; the same joy on all three proved at Golgotha and sealed by the theft-proof clause; and the prayer for the day the strength line reads empty. The child band keeps its gate's own marks (two different kinds of glad; the crowd was crying; Jesus is the best example) and learns the four steps with a nightly job; the youth band is the full teaching in a teenager's voice; the teen adds the five uses and a seven-night assignment; the senior adds three charges from the elders' own data and the portion sent by hand. Fullness baseline 132 → 131.

## L130 — the twenty-third full lesson (2026-09-16)

Three Days and Three Nights: what He did in the place of the dead, and why the devil is defeated but not destroyed (adult prose 1,971 by the gate's counter; floors child 986, others 1,183). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 484 · 0.25 | **1,110 · 0.56** |
| youth | missing | **1,260 · 0.64** (new) |
| teen | 630 · 0.32 | **1,227 · 0.62** |
| senior | 741 · 0.38 | **1,238 · 0.63** |

All ten parts in each band: the question asked precisely as three claims; where He was and the one English word doing two jobs; the four verbs and not one of them is fight; where the victory was won, by date; what destroy means; the proof he was not annihilated, written after the resurrection; the three dates kept straight; where the Word is silent, we stop; Yahweh's purpose in His own clauses; and the ten points for the Body. The child band keeps its gate's own marks (It is finished; the keys; the Lamb of Yahweh) and walks ten pieces with a job to do; the youth band is the full teaching in a teenager's voice; the teen adds the seven uses, the card and the three-sentence answer, and the bench discipline for the school; the senior adds four charges, the two halves for the fearful, and the table. The first draft's teen and senior each sat under the floor by 43 and 62 words and were extended. Fullness baseline 131 → 130.

## L129 — the twenty-fourth full lesson (2026-09-16)

You Have a Destiny: the Giver, the window, covenant authority, the heart of flesh, and the me that has to die (adult prose 2,890 by the gate's counter, the longest lesson in the pass so far; floors child 1,445, others 1,734). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 505 · 0.17 | **1,658 · 0.57** |
| youth | missing | **1,871 · 0.65** (new) |
| teen | 665 · 0.23 | **1,775 · 0.61** |
| senior | 936 · 0.32 | **1,787 · 0.62** |

All ten movements in each band: He is a Giver, settled before you pray; faith is the window, and a window can be shut from the inside, with the Word's own limits (James 4:2-3, Paul's thorn); short is not small and long is not holy; authority is not power and the verse itself says so, with the honest note on the keys; the covenant is what makes it work, and bounds it; the heart of stone (Darrell's word, the hinge); thoughts brought to obey (his second word), with the guard rail and the Philippians 4:8 checklist; to the death of me and His version of me (his third and fourth words), both choosing sentences taught; grace then glory; the destiny and its fence. The child band keeps its gate's own marks and walks ten pieces with a three-part job; the youth band is the full ten movements in a teenager's voice; the teen adds the movements the short version skipped and seven uses; the senior adds five charges, the two choosings and the corporate destiny for the elders, and the table. This lesson's bands are stored with paragraph breaks, so the apply script learned to escape newlines (a one-line fix, kept for every later lesson). Fullness baseline 130 → 129.

## L128 — the twenty-fifth full lesson (2026-09-16)

The Prudent Man Studies: systematic analysis, the Ways that protect, and seeing Him while blind (adult prose 4,650 by the gate's counter — the longest lesson in the corpus; floors child 2,325, others 2,790). Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 581 · 0.12 | **2,594 · 0.56** |
| youth | missing | **3,461 · 0.74** (new) |
| teen | 673 · 0.14 | **3,242 · 0.70** |
| senior | 1,131 · 0.24 | **3,002 · 0.65** |

Every movement in each band: the weld verse (Hosea 14:9) and the two verbs of the prudent man; prudence as a skill handed to the simple and the young, with its active definitions; systematic analysis as a workman's labour (precept upon precept, the Bereans' pairing, Ezra's seek-do-teach); the mechanism (senses exercised by use) and the fence (both houses got identical weather, and both men heard); the hiding as invitation and the fence on the searching (the secret things His, the revealed ours and our children's, to do); what prophets and kings wanted and did not get (not unto themselves, but unto us; Daniel by books); acts versus Ways, the still small voice, the word behind you at the turn, the stranger's voice, recognising someone never met, the retrospective proof (Jacob, Emmaus, the healed man) and Isaiah 42:16; He changes the default and holds the attention with His own eye; the temple as the actual heart and the words abiding as the link that makes studying into protecting; noticing the difference (the thin line, the peace as umpire, the decision still yours); cannot see, not will not; the deterministic doing (dwell, the terms in His first person, willing and obedient, sowing and reaping); three guard rails; ask for the Ways by name; the warning of John 5:39 and the walk of Genesis 3:8. The child band keeps the whole lesson in seventeen pieces with the curb story and a nightly job; the youth band is the full teaching in a teenager's voice; the teen adds the movements the short version left out and a seven-part week; the senior adds five charges, the elders' accumulating advantage, and the table. Fullness baseline 129 → 128.

## L127 — the twenty-sixth full lesson (2026-09-16)

The Firsts: what Yahweh did in each century that had never been done before (adult prose 1,554 by the gate's counter; floors child 777, others 933). This is the standard lesson (DR-0410); its teen and senior were already full, so only the child and the youth needed work. Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 514 · 0.33 | **959 · 0.62** |
| youth | missing | **1,574 · 1.01** (new) |
| teen | 1,235 · 0.79 | 1,235 · 0.79 (already full, unchanged) |
| senior | 1,555 · 1.00 | 1,555 · 1.00 (already full, unchanged) |

The child band keeps its gate's own marks (the walk, Genesis 3:8, no adult freight) and now walks every first a second time with what each was for, ending at the walk; the youth band carries all ten movements — the goal, why it looks like this, dating without lying, the firsts themselves, where the firsts stop, the puzzle, the fence that matters most, why the covenant had to change, the road, and the receipt book — in a teenager's voice. The apply script learned to leave a band alone when it has no extension. Fullness baseline 128 → 127.

## L126 — the twenty-seventh full lesson (2026-09-16)

Feelings Are Fruit, Not Root: belief, the renewed mind, and declarations bounded by His Word (adult prose 4,090 by the gate's counter; floors child 2,045, others 2,454). One of the longest lessons in the corpus, with nineteen movements. Before-values by the session counter, after-values by the gate's:

| band | before | after (gate counter) |
|---|---|---|
| child | 525 · 0.13 | **2,281 · 0.56** |
| youth | missing | **2,924 · 0.71** (new) |
| teen | 1,567 · 0.38 | **2,600 · 0.64** |
| senior | 1,525 · 0.37 | **2,619 · 0.64** |

The child band keeps its gate's own marks (none of the adult vocabulary — no subconscious, neural, self-sabotage, or declaration — and its three kept quotes) and now walks all nineteen pieces as a garden: the roots, the tree, the bird that does not get a nest, the sharp knife that sees the why, the fence that we speak only what He said, and the meal and the nap before the word. The youth, teen, and senior bands each carry the whole spine — feelings prove belief not truth, you are not your thoughts, the honest days-to-a-habit answer with no invented number, the reasoning-together pattern from Abraham to Habakkuk to Job, "who told thee," the stuffed-feelings warning from Psalm 32, the opened eyes at Dothan, and thanksgiving before petition — in their own registers. Fullness baseline 127 → 126.

## L125 — the twenty-eighth full lesson (2026-09-16)

Rules of Engagement: the warfare the Word authorizes, the open doors it closes, and where the Word stops (adult prose 3,664 by the gate's counter; floors child 1,832, others 2,199). The short bands were quote-dense and prose-thin: the teen carried the verses but not the bloodline, the land, the giants at home, or the deception movement at all. Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 432 · 0.12 | **2,134 · 0.58** |
| youth | missing | **2,647 · 0.72** (new) |
| teen | 684 · 0.19 | **2,548 · 0.70** |
| senior | 1,150 · 0.31 | **2,620 · 0.72** |

The child band keeps its gate's own marks (no demonology vocabulary, "not a lesson about being afraid", the archangel's line, the joy moved to the name written in heaven) and now carries the family question in both halves in a child's words — say sorry like Daniel did, and you are not in trouble for what they did — and closes on the locked house with the lights on. The teen band gains the movements it lacked: source discipline in two hands, Peter's sequence beside James's, the three giants treated pastorally with Elijah's meal and nap and the explicit depression guardrail, the bloodline in both tiers with the evening-versus-once proportion, legal ground with the who-holds-the-controversy question, the drift-vector of deception, the Isaiah 14 proportion, Jehoshaphat, the pace verse, and the two failure modes addressed to teenagers. The senior band gains a movement-by-movement run-of-room: the ninety-second source framing, the show-of-hands diagnosis on James 4:7, Elijah given the whole segment, the third-row script for the bloodline, the one question asked of every land text, the house audit done in the room rather than described, the boundary movement's close-the-loop, which movement may never be cut for time, and how to spot each failure mode by the end of the first movement. Fullness baseline 126 → 125.

## L124 — the twenty-ninth full lesson (2026-09-16)

Equipped to Win: the hour you are losing, the Word again, and the man who did not want the job (adult prose 2,411 by the gate's counter; floors child 1,206, others 1,447). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 554 · 0.23 | **1,529 · 0.63** |
| youth | missing | **2,263 · 0.94** (new) |
| teen | 909 · 0.38 | **1,625 · 0.67** |
| senior | 1,105 · 0.46 | **1,676 · 0.70** |

The child band keeps its gate's marks (no captivity or death arithmetic; Jeremiah 1:5 kept) and now carries the broken jar against again as mending versus making, the burned scroll and the room that was not scared, the house nobody wanted, opposition in the terms, the tears that are love, the two things to put down, the fountain and the buckets, and the present-tense you are, closing on the father's hand on the bicycle seat. The youth band walks all sixteen movements in a teenager's voice. The teen band gains the seventy-years arithmetic, Daniel's we as the anti-offence posture, mending versus making, and the buyer and the passer-by, with homework and the whole of it. The senior band gains three movements (the arithmetic of the sentence, mending versus making said explicitly, and the buyer illustration credited and grounded) plus a run-of-room order: hands on who is losing now, waves early, love before again, the honest cost before the identity, and the two-evils question asked and waited on. Fullness baseline 125 → 124.

## L123 — the thirtieth full lesson (2026-09-16)

Would You Sign That Contract: the answer, the qualification, and the manner that forfeited it (adult prose 2,118 by the gate's counter; floors child 1,059, others 1,271). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 223 · 0.11 | **1,379 · 0.65** |
| youth | missing | **2,001 · 0.94** (new) |
| teen | 502 · 0.24 | **1,394 · 0.66** |
| senior | 495 · 0.23 | **1,311 · 0.62** |

The child band keeps its gate's marks (no marriage, divorce, contract, or spouse vocabulary; "Ye shall know them by their fruits" kept) and teaches the transferable spine as nine pieces for a child: a question is not a trap, Yahweh keeps His promises to people who break theirs, a promise that only counts when it is easy was never a promise, Caesar's coin as rules-and-Yahweh-both, check the bottom block, kids are allowed to say true things, names are not arguments, slow down, and the question nobody asked, closing on the two block-builders. The youth band walks every movement of the adult lesson in a teenager's voice with a how-to-use-this list. The teen band gains the seam, the Ephesians 5:32 licence, the tribute-money occasion stated, the three tiers as a method, all four qualification steps at exact size, the slur handled specifically, and the question neither man asked. The senior band gains a run-of-room: the three people in the room named at the opening, the seam found by the room itself, tier one said face to face with the young men, Psalm 15:4 slowed down, the fourth qualification step kept at the size the text gives it, the manner where a grey head is the asset, and three pastoral watch-fors. Fullness baseline 124 → 123.

## L122 — the thirty-first full lesson (2026-09-16)

Does She Feel Like Your Favorite Person: preferring one another and the first works (adult prose 1,509 by the gate's counter; floors child 755, others 906). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 262 · 0.17 | **1,121 · 0.74** |
| youth | missing | **1,537 · 1.02** (new) |
| teen | 479 · 0.32 | **1,161 · 0.77** |
| senior | 475 · 0.31 | **1,162 · 0.77** |

The child band keeps its gate's marks (no marital frame; "do the first works" and the practice a child can run) and now walks eight pieces for a household: can they tell, the Word's own name for favorite person at a fervent temperature, the friend who goes missing, the three-step repair that never waits on feelings, the list item by item with the talebearer warning, laughing at home as obedience, the two warnings (the sad person who cannot feel it; the mirror never a bill), and Jesus first, closing on the campfire nobody decided to let go out. The youth band walks the whole adult lesson for friendships and family with the first-relationship trap named. The teen band gains why the order is the whole lesson, delight as command with Deuteronomy 24:5, the covering item pressed, both caveats, the first-relationship trap, and homework. The senior band gains a run-of-room: the silence after the second question, the friend movement made to cost something by a silent list that becomes the homework, Revelation 2:4-5 in its honest order, the covering item named as talebearing, Deuteronomy 24:5 as the verse the room has never heard preached, and the two people the caveats protect. Fullness baseline 123 → 122.

## L121 — the thirty-second full lesson (2026-09-16)

Know Your Own Post: her provision, her guard, and the beam in the pointing eye (adult prose 1,596 by the gate's counter; floors child 798, others 958). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 267 · 0.17 | **1,354 · 0.85** |
| youth | missing | **1,601 · 1.00** (new) |
| teen | 451 · 0.28 | **1,184 · 0.74** |
| senior | 469 · 0.29 | **1,125 · 0.70** |

The child band keeps its gate's marks (the beam verse, "Strength and honour are her clothing", "never tell someone they are worthless", no marital-argument frame) and walks nine pieces: the two lists, the plank first, the hero woman really provides (Dorcas, the Shunammite, the women who funded the Lord), the hero woman really guards (looketh well, ready before the snow, Abigail, the midwives), peace is everybody's job with the tell-a-grown-up guard rail, never price a person at zero with the edify test, the funny part that is not funny, your score is your own, and the floor everybody stands on, closing on the goalie who leaves the goal. The youth band walks the whole adult lesson with the feed named as the place the fault performs itself. The teen band gains her guard as logistics, peace weighed with both hands and the guard rail, the beam precisely without dismissing the man, the busybody economy, the floor, and why this matters at that age. The senior band gains a run-of-room: the verb count done by the room, 21:9 never without 29:22, the guard rail said while looking at the room, the contempt hinge done in both halves, the beam as order not cancellation, and three pastoral watch-fors. Fullness baseline 122 → 121.

## L120 — the thirty-third full lesson (2026-09-16)

It Is Written: keep the policy in your pocket, advocacy from the written Word, and a just weight (adult prose 2,168 by the gate's counter; floors child 1,084, others 1,301). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 478 · 0.22 | **1,510 · 0.70** |
| youth | missing | **1,901 · 0.88** (new) |
| teen | 655 · 0.30 | **1,372 · 0.63** |
| senior | 702 · 0.32 | **1,401 · 0.65** |

The child band keeps its gate's marks (the pocket, "For the LORD will plead their cause", forgiving one another, no accusation words) and walks ten pieces: put the words in first, a rule is a scale, Yahweh watches out for the little ones, fair goes both ways, two are better than one and so is a piece of paper, how Mom wrote the letter, the one who says sorry is the wise one, do not guess what is in somebody's heart, follow the money, and the win was not the envelope, closing on the lemonade stand. The youth band walks the whole record and every movement with the appeal template spelled out for a lifetime of counters. The teen band gains the fruit shown where the parents were not, two witnesses and a document with Proverbs 18:17 binding the teller too, the father's anger and where it goes, the correction honoured in full, follow the money, and the floor. The senior band gains a run-of-room for parents and children together: the facts read from the page, the method role-played, the weight made physical, the guardrail pressed with the young men in view, the appeal template on the board, the correction honoured, the anger modelled, the economics for the parents, and three watch-fors. Fullness baseline 121 → 120.

## Not decided here (surfaced, with recommendations)

- The floors (0.5 / 0.6) are the recommended default. Darrell may set them higher; raising them only grows the recorded debt, never hides it.
- Whether the youth level is authored in the same pass as child/teen/senior (recommended: yes — the lesson is open, the message is in hand) or as a second pass.
