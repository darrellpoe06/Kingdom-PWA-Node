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

## L119 — the thirty-fourth full lesson (2026-09-16)

Abstention: if I am an option, do not pick me, and the choosing settled before there was a list (adult prose 2,022 by the gate's counter; floors child 1,011, others 1,214). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 326 · 0.16 | **1,626 · 0.80** |
| youth | missing | **1,898 · 0.94** (new) |
| teen | 472 · 0.23 | **1,308 · 0.65** |
| senior | 483 · 0.24 | **1,274 · 0.63** |

The child band keeps its gate's marks (the being-picked frame, the refused stone, before the foundation of the world, kindness, the bedtime verse, no adult frame) and walks eleven pieces: the four words for being left out, Yahweh will not be a maybe either, chosen before there was a list, people rank by what shows, think before you promise and never compare after, you cannot buy love, the price was already paid, do not be a maybe person yourself, a friend shows up when it is hard, knowing you are valuable is not permission to be mean, and called-chosen-faithful, closing on the two captains at recess and the Father's hand already on the shoulder. The youth band walks every movement with the feed named as a ranking machine and the maybe-er addressed directly. The teen band gains the four words with Peter's two ledgers, Yahweh's own posture, the scale of convenience, the fire whole, the closed market, the period, friend under load, all four cautions, and the three texts of the settlement. The senior band gains a run-of-room for a spoken declaration: honour the speaker then sort, the vocabulary walk as an exercise, who may make the demand and of whom drawn as two seats, the line of time drawn on the board, the fire and the market for those who priced themselves by a career, all four corrections named, four pastoral watch-fors, and a note on what may never be cut for time. Its first draft measured 1,200 against a floor of 1,214 and was extended before it was recorded. Fullness baseline 120 → 119.

## L118 — the thirty-fifth full lesson (2026-09-16)

Ninety-Seven Percent: testing a viral number against the Word and the real research (adult prose 2,874 by the gate's counter; floors child 1,437, others 1,725). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 270 · 0.09 | **1,712 · 0.60** |
| youth | missing | **2,414 · 0.84** (new) |
| teen | 602 · 0.21 | **1,785 · 0.62** |
| senior | 688 · 0.24 | **1,801 · 0.63** |

The child band keeps its gate's marks ("HOW DO YOU KNOW", the fruit verse, "Wisdom is the principal thing", none of the adult vocabulary) and walks thirteen pieces: the four questions, studies-have-shown as a permission slip, a number about people is a kind of telling, a number is a weight, the real counting went the other way, we do not fix a wrong number with another wrong number, one thing nobody knows yet, Yahweh looks at the heart, the Bible's wise and strong women, learning is a gift and not knowing is not holiness, the one true thing that cuts both ways, the man in the mirror, and how you really know a person, closing on the two shopkeepers' scales. The youth band walks the whole adult lesson with every figure, every source, the attribution note, and the fruit questions turned around on the asker. The teen band gains the shape before the substance, the Word setting the test, testimony in full, the rest of the record with the honesty note and the trend corrections, the one open question, follows-by-nature answered from the text, the mirror-image weight, the man in the mirror, the fruit questions, environments on both pans applied to the reader's own feed, and why this matters at that age. The senior band gains a run-of-room: the shape on the board, the four questions as a drill, testimony not arithmetic, reading the numbers with the attribution note aloud, the three true things without flinching, the one open question, the women walk with the Huldah word handled first, the mirror-image weight with the grandmothers in view, the man in the mirror for the young men, the seven fruit questions, the environments movement turned on the room's own habits, four pastoral watch-fors, and a note on what may never be cut. The first teen and senior drafts measured under their floors and were extended before recording. Fullness baseline 119 → 118.

## L117 — the thirty-sixth full lesson (2026-09-16)

No Two Children Grow Up in the Same House: why siblings differ, and the one Parent who is the same (adult prose 2,079 by the gate's counter; floors child 1,040, others 1,248). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 359 · 0.17 | **1,782 · 0.86** |
| youth | missing | **1,948 · 0.94** (new) |
| teen | 581 · 0.28 | **1,414 · 0.68** |
| senior | 654 · 0.31 | **1,328 · 0.64** |

The child band keeps its gate's marks (Genesis 25:27, the unchanging Father, the wounded seat, "fearfully and wonderfully made", "all that I have is thine", both-telling-the-truth, and none of the adult vocabulary) and walks eleven pieces: two kids and two childhoods, the Word showed it first, parents are told not to pick favourites, nobody can fully explain why you are different and that is good, a parent's job is to see you, the one Parent who never changes, for the one who got left out, shaped not sentenced, forgiving a parent who could not be the same with the tell-a-safe-grown-up guard rail, stop keeping score, and how a divided house can end, closing on the gardener with a rose, a tomato and a cactus. The youth band walks every movement with the research cited and its limit named. The teen band gains goodness of fit, the Word judging the preference, the assignment sentence to write down, the two trips on one night, Joseph's last word, shaped-not-sentenced in full, the forgiveness guard rail, and the ledger closed. The senior band gains a run-of-room: the Thanksgiving-table opener, how to cite research to a room including its limit, the sentence for the board, the two trips as the parents' model, the wounded seat named out loud, the guard rail in the same session as the command, four pastoral watch-fors, and what may never be cut for time. Fullness baseline 118 → 117.

## L116 — the thirty-seventh full lesson (2026-09-16)

The Thirty-Day Experiment: action produces information, and the grace that met a pretender (adult prose 1,752 by the gate's counter; floors child 876, others 1,052). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 464 · 0.26 | **1,731 · 0.99** |
| youth | missing | **1,984 · 1.13** (new) |
| teen | 551 · 0.31 | **1,369 · 0.78** |
| senior | 736 · 0.42 | **1,566 · 0.89** |

The child band keeps its gate's marks (John 7:17, the living Word, the forgiveness that moved first, "he knoweth not how", the submit-then-resist order, the bedtime verse, and "could not stop" in place of the adult substance) and walks eleven pieces: action makes information, Yahweh is not afraid of being tested, taste and see, the four small things each with its verse, the power was not in him, the friendship that moved first, the chain that fell off by itself, the bad dreams that are not a punishment, what to do in order, the warning against a trick, and why he got answered at all, closing on the person arguing at a door he could simply open. The youth band walks every movement with the term offered as the reader's own and the comment-section fight refused by name. The teen band gains the dated test in Scripture, the four practices each with its verse, the Word's advertised behaviour with the variable isolated, the fruit order as diagnosis, the post-turn assault taught before it happens, the seeking-clause tension, the caution riding with the invitation, and why the argument is never taken. The senior band gains a run-of-room: the source line kept short, the three wrong sermons named up front, the order taught as epistemology with the ask reframed from assent to a term, the doctrinal centre pressed against sincerity-as-power, the fruit order with its payoff for the thirty-year white-knuckler, the assault in order, the tension not resolved cheaply, the caution in the same breath as the invitation, Darrell's own grief answered the Word's way, and four pastoral watch-fors. Fullness baseline 117 → 116.

## L115 — the thirty-eighth full lesson (2026-09-16)

Meek and Quiet: strength, the ornament of great price, and why Jael is not the blueprint (adult prose 1,975 by the gate's counter; floors child 988, others 1,185). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 280 · 0.14 | **1,399 · 0.71** |
| youth | missing | **2,009 · 1.02** (new) |
| teen | 538 · 0.27 | **1,263 · 0.64** |
| senior | 775 · 0.39 | **1,485 · 0.75** |

The child band keeps its gate's marks (Numbers 12:3, Psalm 131:2, the law of kindness, and none of the adult freight: no nail, hammer, Jael, strange woman, spouse or deceit) and walks twelve pieces: the reins, the strongest meek people, meek is for everybody and not just girls, the weaned child, quiet is called strength, quiet people are allowed to talk, loudness is not the measure, the law of kindness with a mouth that opens, speak up for people who need it, never gentle outside and sneaky inside, where the strength goes, and the soft answer, closing on the big kind dog with the loose leash. The youth band walks every movement with the group chat named as where the guileless test lands first. The teen band gains the preposition read exactly, the gendering as the root error, quiet as an interior condition, the false floor pulled out properly with the harshness distinction stated twice, the Jael transfer error, the decibel argument retired, the mechanism that keeps this from being repression, and the third rail that is always cut off in the quoting. The senior band gains a run-of-room: say what is true first and mean it, both readings of the preposition on the board, the gendering pressed with the men in view, how to remove a false floor without knocking the house down, Judges 4:17-21 read aloud for the details that are not there, the rails in the same session and never a later one, Titus 2:3-5 affirmed rather than avoided, and four pastoral watch-fors including the woman who was handed this as a reason to stay silent. Fullness baseline 116 → 115.

## L114 — the thirty-ninth full lesson (2026-09-16)

What Makes Having You Better: covenant not contract, and the value a paycheck cannot cover (adult prose 2,008 by the gate's counter; floors child 1,004, others 1,205). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 233 · 0.12 | **1,213 · 0.60** |
| youth | missing | **2,031 · 1.01** (new) |
| teen | 402 · 0.20 | **1,296 · 0.65** |
| senior | 547 · 0.27 | **1,366 · 0.68** |

The child band keeps its gate's marks ("In a home, everybody helps", "For I have given you an example", the answer to alone, the making-life-easier question, and none of the adult freight: no leverage, divorce, treachery or paycheck) and walks ten pieces: four kinds of work in one meal, the towel, greatness upside down, the real question for your house, learn your people, helping is not keeping score, why Yahweh made families, the threefold cord, a governed temper, and the King's own rule, closing on the rowboat where the one with strength left pulls harder. The youth band walks every movement with the market frame applied to friendships now and the test questions turned on the reader's own house. The teen band gains the frame as the whole fight, the husband list counted, both money tiers, the contradiction, Proverbs 31 against the modern-invention claim, the towel settling the chores, the ledger ended at charity seeketh not her own, what cannot be hired, leverage is not covenant as the one to remember, and her side of the same covenant. The senior band gains a run-of-room: the two columns on the board with the room's own last argument sorted into one, the commands counted aloud to one in six, both tiers with the earner never shamed, the towel taken from the Lord and no one else, the ledger killed where the fighting actually happens, the two hard things a younger teacher may flinch from, the mutual half spoken so it is not heard as accusation, the widows and widowers invited to speak last on what a spouse is worth, and four pastoral watch-fors. One generic "God" in the youth draft was caught and reworded before it shipped. Fullness baseline 115 → 114.

## L113 — the fortieth full lesson (2026-09-16)

The Spirit Is Willing, but the Flesh Is Weak: telling the two apart, ruling your own spirit, and the long work Yahweh has given His time to (adult prose 1,378 by the gate's counter; floors child 689, others 827). Before- and after-values both by the gate's counter:

| band | before | after (gate counter) |
|---|---|---|
| child | 319 · 0.23 | **716 · 0.52** |
| youth | missing | **851 · 0.62** (new) |
| teen | 546 · 0.40 | **923 · 0.67** |
| senior | 672 · 0.49 | **935 · 0.68** |

The child band keeps its gate's marks (the flesh-is-weak clause, "For he knoweth our frame", "Arise and eat", the fruit list, Proverbs 25:28 and Caleb's another spirit, with tired-or-hungry named plainly) and gains five pieces: watch and pray as two small jobs a child can actually do, moving the cookie rather than out-willing it (Romans 13:14 taught at the provisioning stage), words carrying weight with the merry heart and the broken spirit, the tug-of-war named as normal and as evidence of life rather than of badness, and Yahweh's long patience with the promise to put a new spirit inside — closing on handing Him the whole suit instead of manufacturing strength. The youth band walks every movement: Gethsemane read in place so the clause is a diagnosis with a prescription, the three-part frame, the body-is-real tier stated plainly with Elijah's order, the body REPORTS it does not RULE, the fruit test with the surprise that the works list is mostly relational, negativity as a breach in the wall, Kadesh with "in our OWN sight FIRST", Caleb's another spirit carrying the same facts, the seven moves, the war as permanent and not a verdict, the supplied willingness, and the ages closing on the delay as mercy. The teen band gains the relational reading of the works list, the epistemic limit of 1 Corinthians 2:14 (a man on flesh alone cannot self-administer the test, which is why the instruments are fruit and leading), James 1:14's drawn-away-then-enticed as the practical centre, words carrying weight, the repair petitioned rather than generated, Zechariah 4:6, the interior renovation as His promised work before it is our discipline, and Romans 7:24-25 refusing to end the paragraph on the despair. The senior band gains three teaching additions already in the text — the epistemic limit taught as observable fruit the congregation can see in one another, the provisioning sequence as the practical centre of movement 6, and the repair as petition — plus a caution on usage: this clause is often quoted over the sick, the aged and the grieving as a verdict, when in Gethsemane it was spoken TO the exhausted as kindness with their heaviness named, so movement 3 is the pastoral prerequisite and Elijah's order is the model for the visit as much as for the sermon.

**Two process notes from this pass, both caught by the gates rather than by me.** First, my own scratch word-counter disagreed with the gate's counter (1,272 against 1,378 adult prose), so a child band I measured at 0.51 was really 0.49 and still short. The gate is the authority; the band was topped up until `shortBands` returned empty, and from here the measurement is taken with `scripts/full-levels.mjs` itself rather than a proxy (DR-0332: a proxy measures what it claims to). The 716 in the table is the figure AFTER the second note below: rewrapping that quotation in double quotes correctly moved its words out of our authored prose, which took the band from 731 to 716 — still over the floor, and the table carries the true post-fix number rather than the one measured mid-flight. Second, the top-up wrapped its Psalm 51:10 quotation in escaped single quotes, which put "O God" inside our own authored voice — the L113 voice gate failed on exactly that, and it was rewrapped in double quotes. Quoted Scripture lives in double quotes only; that is what makes the rule machine-checkable. All 54 quotations in the new bands were also verified verbatim against `public/bible/kjv` before the apply. Fullness baseline 114 → 113.

## L112 — the forty-first full lesson (2026-09-16)

Foxes, Wolves, and Bears: why Yahweh names the enemy by creature, and how His servants win (adult prose 990 by the gate's counter; floors child 495, others 594). Before- and after-values both by the gate's counter, and both measured AFTER every fix below:

| band | before | after (gate counter) |
|---|---|---|
| child | 256 · 0.26 | **623 · 0.63** |
| youth | missing | **818 · 0.83** (new) |
| teen | 389 · 0.39 | **613 · 0.62** |
| senior | 526 · 0.53 | **755 · 0.76** |

The child band keeps its gate's marks ("Take us the foxes", catch, the little foxes, the lion and the bear, and whose battle it is) and gains five pieces: WHY He teaches by creature at all (Job 12:7 — go ask the animals), that each animal names a different trick so you do not fight them all the same way, the wolf in wool with the test that answers it (judge by what it GROWS, not how it looks, and stay near the Shepherd who does not run), Amos 5:19 told as the picture it is — run from a lion, meet a bear, go inside and lean on the wall and a serpent bites — so relocation is not escape, and Exodus 23:30's little-by-little as kindness rather than absence, closing on Luke 10:19's tread and Joel 2:25's restored years. The youth band is new and walks all eight movements: the creature-as-tactic frame, the foxes that spoil TENDER fruit before it can ripen, the fox as mocker (Nehemiah 4:3 — the wall did not fall, the sneer only made it feel like it would) and as the prophet camped in the ruins, the wolf's disguise and scattering with the evening hour he hunts, the bear as force that cannot be out-clevered at personal scale, the lion's roar weighed on the word AS (a likeness, not a throne), Amos 5:19 with one already-sentenced adversary behind four masks, David's private field as what SIZED the public giant ("as ONE OF THEM", measured against what Yahweh had already done rather than against himself), Deuteronomy 7:22's stated REASON beside its pace, Judges 3:2's school, and the six moves closing on submit-then-resist and a finished victory. The teen band gains the fox's full range including Jesus refusing to be moved off His schedule by a crafty ruler (Luke 13:32 — name the mocker accurately, then keep working), the devourer rebuked by Yahweh Himself, the bear at KINGDOM scale (Daniel 7:5, Proverbs 28:15) so the lens reads power and not only a hard week, the inverted pair set right (James 4:7 puts submission BEFORE resistance; resistance without it is just effort) with Psalms 144:1 so the hands are His trained hands, and the ledger left open on what the beasts already took. The senior band gains three teaching notes — the order as the most commonly inverted pair in popular teaching, the bear taught at both scales so a diagnosis and a ruler read through one lens without collapsing into fatalism or partisanship, and Deuteronomy 7:22's reason ("lest the beasts of the field increase upon thee") as the pastoral answer to a believer who reads slow deliverance as divine absence — plus a caution: for a hearer in the middle of a bear, the training movement must never be preached before the force-is-real movement, or the lesson lands as a rebuke for not having won yet. David's field came BEFORE the valley; a person still in the field is exactly on schedule.

**The process note from this pass, and it is a correction to my own method.** My scratch quotation checker passed all 43 spans, and the repo's whole-span gate then failed three of them: `father's`, `the LORD's` and `God's`. The cause is that my checker **folded typographic apostrophes to ASCII on both sides** before comparing, while the gate compares verbatim — so it was structurally incapable of catching the one class of in-quote alteration most likely to occur when a quotation is typed rather than pasted. The repo KJV carries `’` (U+2019); all three spans now do too. A checker more lenient than the gate is worse than no checker, because it manufactures confidence: the lesson carried into the next pass is that the pre-apply verification must compare byte-for-byte, exactly as `living-lessons-l112-verses.test.js` does, and the gate remains the authority either way (DR-0076 §3). Fullness baseline 113 → 112.

## L111 — the forty-second full lesson (2026-09-17)

The Just Weight: Yahweh's unchanging measure against the world's shifting standard (adult prose 647 by the gate's counter; floors child 324, others 389). Before- and after-values both by the gate's counter, and both measured AFTER every fix below:

| band | before | after (gate counter) |
|---|---|---|
| child | 106 · 0.18 | **365 · 0.61** |
| youth | missing | **417 · 0.70** (new) |
| teen | 127 · 0.21 | **419 · 0.70** |
| senior | 208 · 0.35 | **498 · 0.83** |

This lesson needed all four bands, not three: child and teen were one-paragraph summaries, youth did not exist, and **the senior band was not a senior reader's lesson at all — it was the facilitator's notes**, opening "Teach as biblical economics grounded in the immutability of Yahweh", carrying "Handle in DR-0100 tiers" and the capture date, and addressing whoever was running the room rather than the reader in front of it. That is why its share read 0.35 while looking long: most of its length was quoted Scripture strung between numbered instructions. The notes were not lost — they live in `facilitator.talkingPoints` and in `bigIdea`, where a facilitator actually looks — and the band was rewritten as prose for a senior reader. A gate now asserts that (the band may not open with the notes' own sentences, and `talkingPoints` must still exist), because "the senior band is long" and "the senior band teaches a senior" are not the same claim.

The child band teaches the two-cup store, then the two stones in one bag, the honest stone Yahweh commands (Deuteronomy 25:13; Proverbs 11:1; Deuteronomy 25:15), WHY He cares about a stone (He is honest all the way through and never switches His own rule — Malachi 3:6; Hebrews 13:8; Isaiah 40:8), what rust and a shrinking dollar do to a child's own things against treasure in heaven (Matthew 6:20), honesty in the small amounts (Luke 16:10), the promise that removes the fear (Hebrews 13:5), thanks to the One who heals (Psalms 103:3), and a closing picture of a ruler cut an inch shorter every week until nothing fits. The youth band is new and walks the whole arc: the three reported facts stated plainly, the stones as the deal's real power, the abomination named (Proverbs 20:10; Micah 6:11), what is NOT condemned, the one weight Yahweh commands with the signature on it (Deuteronomy 25:15; Leviticus 19:35-36), the unmoved One behind it, riches that grow wings (Proverbs 23:5), treasure that cannot lose value, contentment with a Provider who put the promise in writing (1 Timothy 6:6; Hebrews 13:5), the trap named as the love of it rather than the money (1 Timothy 6:10), faithfulness where nobody would check (Luke 16:10), the kingdom sought first (Matthew 6:33), the mercy in the same week's news — and the shifting measures a young person actually meets: a subscription that quietly rises, a bag with the same price and less inside, a curve that moves after the test. The teen band adds the third repetition of the judgment (Proverbs 20:23), the goalposts named as the same fraud in a better suit, the signature as the hinge, James 1:17 and the double-minded standard of James 1:8 with instability named as a property rather than a neutral, where the treasure goes and therefore the heart (Matthew 6:21), and the order of the reasoning itself — the Word does not begin with the economy and reason toward Yahweh; it begins with Yahweh, who does not move, and reasons outward. The senior band carries every movement in full sentences, including the prohibition and its positive command together, the creation exchanged like a garment while He remains (Psalms 102:26-27), the practical counsel following from the fixed point in order, and the mercy under the same headline named as plainly as the grievance.

**The process note from this pass, and it closes the gap the last two passes opened.** L113's failure was a quotation wrapped in single quotes; L112's was a checker that folded apostrophes and so could not catch what the gate caught. Both were verification gaps, and L111's own gate had **neither of the two checks that caught them** — no whole-span verbatim gate and no authored-voice check. Both are now part of it, and both immediately found real work: the voice check flagged **five instances of the generic "God" in our own prose**, all in the child and teen bands (rewritten in place — never a blind sweep, and never inside a quotation, DR-0076's bright line), and the span gate needed a correction of its own. The L112 gate concatenates the corpus with each VERSE on its own line, which makes a legitimate quotation of contiguous verses — Matthew 6:19-21, 1 Timothy 6:6-8, Psalms 102:26-27, Psalms 103:2-3 — read as "not verbatim" purely because it crosses a newline. L111's gate joins verses WITHIN a chapter by a space instead, so a full passage quotation is a true substring while a phrase stitched from two chapters still is not; and because this lesson quotes the REPORTING as well as the Word, the three news phrases are named explicitly rather than the gate being loosened for everything. With that, all 125 spans already in the lesson and all 69 in the new bands verify byte-for-byte. Proven-to-catch three ways: a drifted hinge verse ("For I am the LORD; I change not" — a semicolon that reads perfectly and is not the text), the generic name put back into one sentence of our prose, and the youth band removed. Fullness baseline 112 → 111.

## L110 — the forty-third full lesson (2026-09-17)

Wolf vs Lion: the enemy's two tactics, and the one Shepherd who answers both (adult prose 483 by the gate's counter; floors child 242, others 290):

| band | before | after (gate counter) |
|---|---|---|
| child | 161 · 0.33 | **312 · 0.70** |
| youth | missing | **317 · 0.71** (new) |
| teen | 131 · 0.27 | **384 · 0.86** |
| senior | 215 · 0.45 | **533 · 1.20** |

The same shape as L111, and the same root cause in the senior band: it was **the facilitator's notes**, opening "Teach as the enemy's two-tactic doctrine (companion to L106...)", carrying "Adversary named low" and numbered movements addressed to whoever was running the room. The teen band had the same leak in miniature — "Answer: DISCERNMENT (L106)" is a note to a teacher, not a sentence for a reader. Both are now readers' lessons, and the facilitator's material stays where a facilitator looks. A gate asserts it, including that `talkingPoints` still exists, so the fix cannot be "delete the notes."

Every band now carries all six movements rather than a subset, and the asymmetry — **discernment against the wolf, courage against the lion** — is taught explicitly in all four, because that asymmetry IS the lesson: apply the wrong instrument and you are either paranoid or naive. The child band teaches the sheep coat and the fruit test (a coat can be changed and fruit cannot; an apple tree grows apples and a thorn bush grows thorns), the roar with the word AS weighed in it, the two different jobs named as two different jobs, the pretend helper who runs because the sheep were never his against the Shepherd who stays, the hand nobody can pluck from, and the real Lion who already won. The youth band walks the whole arc including the disguise at the highest level (2 Corinthians 11:14), the instruction to test rather than assume (1 John 4:1), the ownership line rather than an ability line, David's field before the valley, and the standing order in its own sequence — submission first, resistance second. The teen band adds the epistemic point that fruit is chosen as the instrument *because* a costume is exchangeable while fruit is not, the hireling who "does not lack skill; he lacks belonging", and John 10:27-28 quoted whole. The senior band carries every movement in full sentences, with the pastoral consequence of the asymmetry named plainly: the wrong instrument produces either the believer who suspects every kindness or the one who dreads nothing and tests nothing.

**The two gates added to L111 the same day were carried here, and both immediately found real work.** The span gate caught **Matthew 7:15 quoted with an ASCII apostrophe** where the corpus carries U+2019 — `sheep's` for `sheep’s` — an in-quote alteration of the Word that had been shipping. The identical altered quotation was found in **L102** and restored there too: this is not a style sweep but a byte-for-byte restoration to the corpus, which is the DR-0076 bright line working in the direction it was written for. The voice check caught the generic name in the child band's prose. One correction to my own pin while writing the gate, worth recording because it is the same error class the gate exists to prevent: I first pinned `"like a roaring lion"` as a drift, and **it is in the corpus** (Ezekiel 22:25, of the prophets in her midst). A corpus-wide phrase search would have called a real reading a drift, so the pin is now the 1 Peter 5:8 clause as a whole, which is what the lesson's teaching on the word AS actually rests on. Proven-to-catch three ways: the ASCII apostrophe put back, the generic name put back into one sentence, and the senior band returned to its notes. Reading level child 0.8 / teen 6.5 / senior 9.2, ascending. Fullness baseline 111 → 110.

## L109 — the forty-fourth full lesson (2026-09-17)

How We Know Yahweh's Love: experienced, not only believed — taste, see, hear, touch, at every age (adult prose 523 by the gate's counter; floors child 262, others 314):

| band | before | after (gate counter) |
|---|---|---|
| child | 137 · 0.26 | **352 · 0.67** |
| youth | missing | **374 · 0.72** (new) |
| teen | 122 · 0.23 | **477 · 0.91** |
| senior | 212 · 0.41 | **584 · 1.12** |

The third lesson in a row whose senior band was **the facilitator's notes** rather than a senior reader's lesson — opening "Teach as experiential knowledge of Yahweh's Love (companion to L105 and L107)", ordinal movements addressed to whoever was leading, and closing on "lead the group." Three in a row is no longer a coincidence to note in passing; it is a pattern in how these lessons were originally built, and every remaining lesson in this pass should be expected to carry it until proven otherwise. The notes stay in `facilitator`; the band is now for the reader, and a gate holds both halves.

All four bands now carry the whole arc rather than a subset: taste first (and the order in Psalms 34:8 taught as deliberate — contact precedes the clear look), the cross as the sight that settles it with the word *commendeth* weighed as demonstration entered into evidence, the incarnation, creation's own testimony, the Love spoken and then sung over you (Zephaniah 3:17 read slowly rather than cited), the Love poured in and holding and healing and literally handled (Luke 24:39), the paradox of a love that passeth knowledge which we are nonetheless told to know — sat with rather than resolved, because the instruction is only coherent if the knowing is experiential — the order in 1 John 4:16 (known AND believed, in that sequence), the proof required outward in deed, and both ends of a life on purpose so nobody excuses themselves: the children He took up Himself, and the gray head He carries and does not hand off. The child band closes on a week of practice, one sense per day, with the point named plainly: you are not making His love happen, you are noticing what is already there.

**This lesson arrived clean on both new checks — 109 spans verbatim and not one generic name in our prose — and the checks were added anyway.** That is the discipline worth recording: a property that holds today and is not checked is a property that breaks quietly tomorrow, which is precisely how L110's altered apostrophe had been shipping. Proven-to-catch three ways against real drifts that read perfectly: Psalms 34:8 with taste and see reversed, the generic name put into one sentence of our prose, and the senior band returned to its notes. Four tamper pins now guard this lesson's own hinges (the taste/see order, the singing clause, the known-and-believed order, and "hoar hairs" against a modernized "grey hairs"). Reading level child 1.7 / teen 7.4 / senior 9.9, ascending. Fullness baseline 110 → 109.

## L108 — the forty-fifth full lesson (2026-09-17)

Why We Name Him Low: the typography of a defeated enemy (adult prose 535 by the gate's counter; floors child 268, others 321):

| band | before | after (gate counter) |
|---|---|---|
| child | 145 · 0.27 | **362 · 0.68** |
| youth | missing | **411 · 0.77** (new) |
| teen | 129 · 0.24 | **543 · 1.01** |
| senior | 273 · 0.51 | **635 · 1.19** |

**Four in a row.** The senior band was the facilitator's notes again — "Teach as the rationale behind the platform's typography", "Pairs with the Typographic Theology, the Color Theology, and L105", ordinal movements addressed to whoever was leading. The pattern named at L109 holds, and the gate now asserts the fix in this lesson too.

All four bands now carry all five reasons rather than a subset: the honor he forfeited (and that nothing was done to him he had not first said in his own heart — Isaiah 14:13), the head-for-heel asymmetry of Genesis 3:15 read as the asymmetry it is, the glory Yahweh will not share, the Name that is actually high, and the discipling of the eye with the fear reassigned by name — because fear does not evaporate under instruction, it relocates. The practical point is stated carefully in every band, because it is commonly taken backwards: **he is not weakened by our contempt; we are strengthened by refusing him a dignity he no longer holds.**

**Two real findings on arrival, in the lesson whose whole subject is which names get honor.** First, a discussion question had put **our own phrase in double quotes and followed it with verse references** — `"agree with Heaven's verdict" (Isaiah 5:20; Revelation 12:10)` — so it read as a quotation of those verses when it was not Scripture at all. In a lesson arguing about honor in typography, that is exactly the confusion we must not manufacture, so the quotation marks came off and the references stayed references. No allowlist was added, deliberately: unlike L111, where the lesson genuinely quotes the reporting it answers, nothing of ours here has any business wearing quotation marks. Second, **the generic name stood in our own prose in four places** — three in the child band, one in a facilitator talking point ("not a peer of God"). All four are now His covenant name; the quoted KJV is untouched.

Proven-to-catch four ways: re-quoting our own phrase beside the verse references, capitalizing him in one sentence of our prose (which fails two checks, including this lesson's pre-existing bright-line test), reversing head and heel inside the Genesis 3:15 quotation, and returning the senior band to its notes. The tamper pins also now assert what this lesson argues for — that **the corpus itself keeps him low inside the Bible text** (`I beheld satan as lightning fall from heaven` present, the capitalized form absent), so the practice the lesson defends is itself machine-checked. Reading level child 3.4 / teen 8.1 / senior 9.9, ascending. Fullness baseline 109 → 108.

## L107 — the forty-sixth full lesson (2026-09-17)

What the Word Gives: love, truth, light, knowledge, understanding — the thoughts to think, what to experience, how we receive it, and the two strategies (adult prose 607 by the gate's counter; floors child 304, others 365):

| band | before | after (gate counter) |
|---|---|---|
| child | 139 · 0.23 | **398 · 0.66** |
| youth | missing | **492 · 0.81** (new) |
| teen | 153 · 0.25 | **518 · 0.85** |
| senior | 255 · 0.42 | **605 · 1.00** |

**Five in a row.** The senior band was the facilitator's notes again — "Teach as the positive companion to L106 (know the enemy)", the capture date, and a checklist of what to cover. The pattern is now assumed rather than discovered, and the gate asserts the fix.

This is the longest arc in the pass so far — eight movements — and all four bands now carry every one rather than a subset, which the gate enumerates item by item: the eight-question filter of Philippians 4:8 taught as **eight tests rather than an atmosphere**, the failing thought taken captive rather than argued with indefinitely, the fruit that GROWS against the mood that must be manufactured, the abundant life set against the thief *inside a single verse* so the contrast belongs to the text and not to our arrangement of it, the Love poured in rather than produced, truth that performs work rather than informing, and the sentence that ought to change how a person reads — `The entrance of thy words giveth light` — taught as the mechanism it is: **the light arrives WITH the Word rather than before it, so nobody waits to understand before opening it; the opening is how the understanding comes.** Then wisdom given *liberally, and upbraideth not* (He does not make a person feel small for needing what they lack), the single posture that receives all of it, and the two strategies in two columns, closing on both instruments of the overcoming with submission kept before resistance. The child band ends by making the filter usable at its own age — you can check a thought in about five seconds — and the youth band ends on the observation that **every item on the list is RECEIVED**, with acting on it the only part left to the reader.

**Two real findings on arrival.** The span gate caught **John 15:10 quoted with an ASCII apostrophe** where the corpus carries U+2019 (`Father's` for `Father’s`) — the third in-quote alteration of the Word this pass has now caught, after L110's Matthew 7:15 (which also appeared in L102) and L108's falsely-quoted phrase of our own. And the voice check caught **the generic name in our own prose in six places** — five in the child band, one in a facilitator talking point ("God IS love, and the Word is His Love in a body"). All six now carry His covenant name; the quoted KJV is untouched.

Proven-to-catch four ways: the ASCII apostrophe put back into John 15:10, the generic name put back into one sentence, `thy word` for `thy words` inside the Psalms 119:130 quotation (a singular that reads perfectly and is not the text), and the senior band returned to its notes. Reading level child 1.8 / teen 6.0 / senior 7.8, ascending. Fullness baseline 108 → 107.

## L106 — the forty-seventh full lesson (2026-09-17)

Wise as Serpents, Harmless as Doves: knowing the enemy, denying the flesh, doing only Yahweh's will, and the one directed way (adult prose 668 by the gate's counter; floors child 334, others 401):

| band | before | after (gate counter) |
|---|---|---|
| child | 145 · 0.24 | **372 · 0.56** |
| youth | missing | **450 · 0.67** (new) |
| teen | 141 · 0.23 | **603 · 0.90** |
| senior | 281 · 0.46 | **701 · 1.05** |

**Six in a row** on the facilitator's-notes senior band ("Teach as discernment-under-the-Word (companion to L102 … L104 … L105)", the capture date, a checklist of what the phrases mean). Nine movements, and the gate now enumerates all twelve of their load-bearing quotations per band, because a nine-movement lesson is exactly where a band quietly carries six.

The through-line every band now holds: the pairing IS the instruction, with Romans 16:19 as the plainest form of it — **wise unto GOOD, simple concerning EVIL** — and the consequence of taking one half named in both directions (a cynic who knows every trick and trusts nobody, or a mark who trusts everybody and knows nothing). Then the enemy Yahweh has ALREADY exposed rather than one to reverse-engineer; the armour issued against **method** rather than force, which tells you what kind of fight this is; the roaring lion weighed on Peter's word **AS** and set beside the Lion who already prevailed; serpent-WISDOM against serpent-NATURE, with the counterfeit named outright and the genuine article known by what it produces rather than by how smart it sounds; submission before resistance, because resistance without it is willpower in a scriptural coat; the flesh denied as **the ground he works** (starve the ground and he has nothing to work with — a better strategy than meeting him on his own terms); and the answer to why the Word divides soul from spirit: so you can tell **which pull is which**. That discernment IS the serpent-wisdom — *not cleverness about the enemy, accuracy about yourself*, which is the harder of the two. Then capable-yet-bounded, with the legions Jesus could have called and did not; the guard against leaning on your own understanding, which belongs in THIS lesson because the serpent's oldest tactic was to make the hearer her own oracle; and the one way, which is a Person rather than a technique.

**Two findings, and the second is about the gate itself.** First, the span gate earned its keep *before* the apply, which is the point of running it on the drafts: my own new teen and senior bands were written with `Christ's` where Galatians 5:24 carries `Christ’s`. I had **typed the quotation instead of pasting it** — precisely the mechanism the L112 note in this record named — and it never reached the file.

Second, and this is a real limitation worth recording rather than glossing: **the module scan passed before the apply and failed after it, on a defect that was pre-existing.** The adult body's own Galatians 5:24 carried the ASCII apostrophe all along. The checker pairs double-quote characters sequentially, so which text counts as "quoted" depends on the alignment of every quote before it; changing the bands shifted the pairing and exposed a span that had previously been folded into a passing one. Two things follow. The defect was real either way and is now restored byte-for-byte (the fourth in-quote alteration of the Word this pass has caught). And the checker can report a clean lesson that carries an altered quotation — which is an argument for running it on **every** lesson rather than trusting a green result, and the reason this pass adds it lesson by lesson instead of sampling. A delimiter-aware version (pairing only quotes that open or close beside a verse reference) is the obvious improvement; **re-review: 2026-10-01.**

Proven-to-catch four ways: the ASCII apostrophe put back into Galatians 5:24, `gentle` for `harmless` inside Matthew 10:16 (a synonym that reads perfectly and is not the text), the generic name put into one sentence of our prose, and the senior band returned to its notes. Reading level child 2.3 / teen 7.2 / senior 9.5, ascending. Fullness baseline 107 → 106.

## L105 — the forty-eighth full lesson (2026-09-17)

Doing the Word Rewires You: daily intake, the heart as the deep layer, and why experiential knowing surpasses theory (adult prose 687 by the gate's counter; floors child 344, others 413):

| band | before | after (gate counter) |
|---|---|---|
| child | 167 · 0.26 | **407 · 0.59** |
| youth | missing | **452 · 0.66** (new) |
| teen | 161 · 0.25 | **593 · 0.86** |
| senior | 327 · 0.51 | **669 · 0.97** |

**Seven in a row** on the facilitator's-notes senior band ("Teach as the experiential/created-design companion to L104 (Study Your Ways)", the capture date, a list of questions to cover).

Seven movements, and every band now carries all of them: daily and attentive intake (attention commanded in bodily terms — ear, eyes, heart — and Jesus on the MANNER of hearing, not only its content); the biblical heart defined precisely as the inner control centre, the habitual and largely below-conscious person, because the whole lesson turns on that word; the Word as the **active party** rather than information transferred; and then the hinge where most faithful daily-reading habits quietly stall — **reading is not doing.** The rock-versus-sand parable is read for its real variable, which is not the one usually assumed: **both men heard.** Hearing was never the dividing line. Then the knowing that only doing yields, with obedience placed FIRST in the order of knowledge, and the psalmist's startling claim on exactly that basis — *I understand more than the ancients* — not because he read more, because he KEPT them. It closes on Joshua 1:8 read in its own order: meditate **in order to observe to DO**, and THEN the way prospers. The prosperity is downstream of the doing, not of the reading.

**A third gate was added here that the earlier lessons did not need, and it is the one worth recording.** This lesson makes a created-design argument from cognitive neuroscience — attention gating what the brain encodes, practice reshaping neural pathways, and the declarative/procedural split where a skill migrates from effortful to automatic, which is what Hebrews 5:14 called senses exercised by use. That argument is legitimate and it is also exactly the kind of claim that decays into a lie when it is compressed for a younger reader: the mechanism survives the edit and **the limit gets dropped.** So the gate now requires that any band teaching the echo also state, in its own words, that **the specific neurochemistry of Bible-reading is not a measured result** and that the Word is the authority while the science only rhymes with it. Proven-to-catch by replacing the child band's limit with a confident false claim ("Scientists have measured exactly what Bible reading does inside a brain") — which fails. A band that keeps the claim and drops the boundary would be worse than a short band, and now it cannot ship.

Also proven-to-catch three more ways: `read` for `keep` inside Psalms 119:100 (which would invert the lesson's own point while reading perfectly), the generic name put into one sentence of our prose, and the senior band returned to its notes. One honest correction to my own gate while writing it: I first set the quoted-span floor at 180 from the pre-apply count of 197, and the rewritten bands carry 172 — the old bands' quotations were part of that number. The floor is now 150, which asserts a substantial body of Scripture without pinning a count that legitimately changes whenever a band is authored. Reading level child 3.3 / teen 9.2 / senior 10.5, ascending. Fullness baseline 106 → 105.

## L104 — the forty-ninth full lesson (2026-09-17)

Study Your Ways: how Yahweh weighs love — the deterministic standard, the two ways, and seeing them only through the Word (adult prose 618 by the gate's counter; floors child 309, others 371):

| band | before | after (gate counter) |
|---|---|---|
| child | 149 · 0.26 | **405 · 0.66** |
| youth | missing | **438 · 0.71** (new) |
| teen | 117 · 0.21 | **550 · 0.89** |
| senior | 267 · 0.47 | **612 · 0.99** |

**Eighth in a row** on the facilitator's-notes senior band ("Teach this as the platform's core self-examination — Word-first and deterministic (DR-0098; pairs with the Godhead Study, L102 integrity…)").

**This is the first lesson in the pass whose band ordering was actually INVERTED, and the rewrite fixed it.** Measured before: child 4.6, teen 3.2 — the "child" band read *harder* than the teen band, which is the gross failure `reading-level.mjs` exists to catch, and it was sitting in the baseline as recorded debt. Measured after: child 2.9 / teen 8.4 / senior 10.5, properly ascending, and the reading-level baseline's inverted list shrinks 30 → 29. That drop is the durable evidence; it is not a number I chose.

Eight movements, and the gate now enumerates twelve load-bearing quotations per band. The movement I was most careful to keep whole in every band is the fourth, because it is the one a compressed band would quietly drop: **feelings are flesh.** Feeling loving is the most common substitute there is for being found faithful, and the instrument a person would naturally reach for to check themselves is precisely the one the Word calls bent — which is why every claim in this lesson is validated through the Scriptures rather than through introspection. Every band also keeps the **mercy hidden inside the fixed standard**, since the weighing passages are commonly heard as threat alone: what is measured is your actual way, weighed the same for everyone — not your press release, and not your reputation. And the psalmist's whole procedure in one sentence: *I thought on my ways, and turned my feet* — thought on the WAYS, then turned the FEET.

**The voice finding here was the largest of the pass — seven instances — and it was not carelessness.** Six of the seven were our own PARAPHRASE of Mark 10:18 ("only God is good", "the standard of good is God Himself") in `bigIdea`, a quiz option and the facilitator notes. A paraphrase in our voice is our voice, so they now read "only Yahweh is good" — the same claim under His covenant name, which is the entire point of DR-0210. The QUOTED verse is untouched and stays exactly as the corpus has it: *there is none good but one, that is, God.*

That pairing is now asserted in both directions by one check, which is the sharpest thing this lesson added to the harness: our prose must carry **no** generic name, AND the quotation must **still read `that is, God`**. Pushing the covenant name *into* the quotation — the well-meant error that would corrupt the Word in the opposite direction from the one DR-0210 guards — fails two assertions. Proven-to-catch four ways in total: `right` for `clean` inside Proverbs 16:2 (which would erase the lesson's own hinge while reading perfectly), the covenant name pushed into Mark 10:18, the generic name restored to one paraphrase, and the senior band returned to its notes. Fullness baseline 105 → 104.

## L103 — the fiftieth full lesson (2026-09-17)

His Kings: reigning under the King of kings — two paths, wealth Yahweh's way not confusion, winning souls through excellence, and skill drawn from His Word (adult prose 646 by the gate's counter; floors child 323, others 388):

| band | before | after (gate counter) |
|---|---|---|
| child | 135 · 0.23 | **432 · 0.67** |
| youth | missing | **459 · 0.71** (new) |
| teen | 126 · 0.21 | **580 · 0.90** |
| senior | 264 · 0.44 | **637 · 0.99** |

**Ninth in a row** on the facilitator's-notes senior band, and the **second inverted band ordering in a row**: before, child 5.6 against teen 4.4 — the child level reading harder than the teen level; after, 2.6 / 7.0 / 8.1 ascending, and the reading-level baseline's inverted list shrinks 29 → 28.

Nine movements, and the gate enumerates sixteen load-bearing quotations per band plus a check of its own for the observation that gives this lesson its edge rather than merely its correctness: **being your own king IS the broad way.** It does not feel like rebellion from the inside — it feels like independence, which is exactly why that road is wide and well travelled. A band that dropped that sentence would leave a lesson about kingship which flatters the reader, so the gate requires it in all four. The crowns are the other thing every band keeps: twenty-four crowned elders in His presence take their crowns off and put them down, which settles the question of posture more decisively than any exhortation to humility could.

## A correction to my own method, and it is the same class this pass exists to catch

My scratch pre-apply checker had been reading **the wrong lesson**. Its module slice was pinned to `id: 'll107-'`, inherited through a chain of sed-renamed copies that updated the filenames but not that string — so every "module clean" line I reported for L103, and for L104 and L105 before it, was re-auditing **L107** rather than the lesson in hand. That is precisely the L112 failure repeated in a new costume: *a checker that reports on the wrong subject manufactures confidence exactly as effectively as one that is too lenient.*

What it did and did not cost, measured rather than assumed:

- **Nothing shipped unverified.** Each lesson's own repo gate slices by full id and ran before every commit; all of them passed. I re-audited L104, L105, L106 and L107 with a corrected auditor that takes the lesson id as an argument and refuses to run without it — **all four are genuinely clean, 0 non-verbatim spans**.
- **It did hide a real defect in L103 for one cycle.** L103's own module carried `Christ's stead` — an ASCII apostrophe inside 2 Corinthians 5:20, where the corpus has `Christ’s`. That is the **fifth** in-quote alteration of the Word this pass has found, and it is now restored byte-for-byte.
- The new bands were never affected, because they are checked by filename rather than by id — which is why the same run correctly caught me typing `Christ's stead` into the teen and senior drafts, the second time in this pass I have typed a quotation instead of pasting it.

The fix is structural: the auditor now takes the lesson prefix as `argv[2]`, prints the full id it resolved, and exits rather than defaulting. A checker that cannot say which subject it examined should not be trusted, and mine could not.

## Darrell's own words are quoted here, and they stay quoted

The span gate then surfaced twelve spans that are not Scripture and should not be: this lesson was captured from what Darrell said on 2026-08-29, and `bigIdea` quotes him directly — *"Kings are also bold… His kings… creating wealth is the goal, not confusion… winning souls, because souls respect excellence, and we kings respect The Living Yahweh…"*. Those are real quotations of a real person, the source the lesson was built from, so the quotation marks are correct and removing them would erase the attribution (DR-0331). They are named in the gate one by one, so it can tell a quoted SPEAKER from a quoted VERSE rather than being loosened for both — the L111 pattern, and the exact opposite of L108's, where a phrase of OUR OWN wore quotation marks beside verse references and had them removed. Two further assertions keep that allowlist honest: **his words must still be present** (it can never become a way to delete his voice), and **none of them may appear in the corpus** (it can never excuse a real quotation from the gate).

Proven-to-catch four ways: the ASCII apostrophe put back into 2 Corinthians 5:20, one of his quoted phrases altered (which fails two checks), the broad-way edge removed from the child band, and the senior band returned to its notes. Fullness baseline 104 → 103.

## L102 — Bold as a Lion (2026-09-17)

Bold as a Lion: righteousness kept by integrity, His good will live-or-die, a Word-trained mind, suffering to reign, loving enemies, and discerning the destroyer (adult prose 809 by the gate's counter; floors child 405, others 486):

| band | before | after (gate counter) |
|---|---|---|
| child | 167 · 0.21 | **501 · 0.62** |
| youth | missing | **724 · 0.89** (new) |
| teen | 169 · 0.21 | **807 · 1.00** |
| senior | 456 · 0.56 | **1221 · 1.51** |

**Tenth in a row** on the facilitator's-notes senior band, and this one was the most explicit yet: it opened *"Teach as boldness rightly sourced - sequel to L101, mate to L99 and the Test (Philippians 4:8), and a Scripture-voiced echo of DR-0076"* and closed on *"CLOSE:"*. A senior reader was being handed the teacher's clipboard, complete with the decision-record cross-references. The gate now refuses a senior band that names an `L99`–`L109` sibling, a `DR-####`, or that opening, while asserting the facilitator notes still exist where they belong.

Twelve movements, and the gate enumerates twenty-two load-bearing quotations per band. Two checks of its own guard what gives this lesson its edge rather than merely its correctness. The first is the **diagnosis**, which is the half of Proverbs 28:1 that is easy to skip: nobody is chasing, and he runs anyway — guilt manufactures its own pursuers, so the standing of the righteous is not nerve or temperament but a settled account. A band carrying only "be bold" would have dropped the reason boldness is available at all. The second is the **not-naive half**, because loving enemies without discernment produces a doormat and discernment without love produces a cynic; the lesson's own observation that *the counterfeit is a lion too* (1 Peter 5:8) is the hinge, and it must survive into every band.

**Three altered quotations of the Word, all in the adult body, all restored here** — the largest single find of the pass. Genesis 49:9 carried `lion's whelp`, Romans 14:8 carried `we are the Lord's.`, and Proverbs 16:7 carried `When a man's ways` — each an ASCII apostrophe where the KJV carries U+2019, each reading perfectly, each invisible at a glance. That makes **eight** in-quote alterations found across this pass, and it is now the single most common defect class it has surfaced. The gate proves-to-catch on all three by name.

## A method correction that matters more than the three apostrophes

My pre-apply auditor, run on the raw SOURCE SLICE, reported **18** non-verbatim spans for this lesson. Auditing the **parsed module field-by-field** reported **3**. The slice version was not merely noisy — it was wrong in a specific, structural way: quote pairing is sequential, so a field boundary or a `\'` escape shifts the odd/even alignment, and from that point on every "span" is an arbitrary cut of unquoted prose. Fifteen of the eighteen were phantoms.

This is the delimiter-aware checker I had parked with `re-review: 2026-10-01` after L106, where the same alignment fragility made a module scan **pass before an apply and fail after** without the quotations changing. It is built now, a fortnight early, and the fix is smaller than the problem sounded: audit the **parsed** module, field by field, so there is no alignment to lose. Fifteen false findings and one genuinely hidden defect are the same bug wearing two faces, and both faces are closed by reading the data structure instead of the text that produces it. The `re-review` is discharged.

## His own words are quoted here, and they stay quoted

Of the three real findings none was his voice, but the field audit named fifteen spans that are not Scripture and correctly should not be: `bigIdea` carries his spoken teaching of 2026-08-29 as one attributed run — *"bold because if we live or die it was His will… His Will is Good no matter what… cry with Him when you need to, just stay Word solid… love even the enemies - they switch sides and are better family than family, Blood In Blood Out… it's amazing how much Yahweh can do with enemies"* — and a quiz question quotes two of his phrases back to the reader. They are named in the gate one by one, with the same two honesty assertions the L103 allowlist carries: his words must still be present, and none may appear in the corpus.

One entry deserves naming on its own. His rendering of the anchor verse is *"the righteous are as bold as a lion"* — with an `as` the KJV does not have. That is **his voice, not a drifted quotation**, and the distinction is visible in the field itself: his paraphrase sits inside the attributed run, and two sentences later the verse is introduced *"Word first, verbatim:"* and quoted exactly. His paraphrase is rendered for meaning (DR-0331); the Word is quoted letter-for-letter. The gate asserts both halves — his phrase present, and `the righteous are as bold as a lion` absent from the corpus so the allowlist can never excuse a real drift.

Proven-to-catch three ways, each in a different gate: the ASCII apostrophe put back into Romans 14:8 in the child band (which fails the span gate *and* the twelve-movement check), the generic name restored to one sentence of child prose, and the youth band cut to a summary. Fullness baseline 103 → 102.

## L101 — The Real Champion (2026-09-17)

The Real Champion: He did it in action rather than theory, died once to live for ever, and He is solid (adult prose 597 by the gate's counter; floors child 299, others 359):

| band | before | after (gate counter) |
|---|---|---|
| child | 171 · 0.29 | **448 · 0.75** |
| youth | missing | **624 · 1.05** (new) |
| teen | 199 · 0.33 | **582 · 0.97** |
| senior | 307 · 0.51 | **769 · 1.29** |

**Eleventh in a row** on the facilitator's-notes senior band — it opened *"Teach this as worship-grade doctrine drawn from a member's testimony (Darrell, 2026-08-29), pairing with MIND-OF-CHRIST and the Godhead studies"* and closed on *"CLOSE:"* — and the **third inverted band ordering** of the pass: before, child 6.3 against teen 4.8, the child level reading harder than the teen level; after, 2.2 / 4.9 / 5.8 / 6.7 ascending, and the reading-level baseline's inverted list shrinks 28 → 27.

**A NEW SUBCLASS OF IN-QUOTE ALTERATION, and it is worth naming because the eight before it were all the same shape.** Every previous find in this pass was an ASCII apostrophe standing where the KJV carries U+2019. This one is punctuation *inside* the quotation: the body quoted Malachi 3:6 as `"For I am the LORD, I change not."` — a full stop where the verse carries a semicolon and keeps going (*"...therefore ye sons of Jacob are not consumed."*). A period closes a sentence the Word did not close there, and the effect is not cosmetic: it presents a clause as the whole verse. The tell was already in the file — the lesson quotes the same verse correctly twenty lines earlier with no terminal punctuation at all, which is the form both now use. Nine in-quote alterations found across the pass, and the defect classes are now two: the apostrophe, and the borrowed full stop.

Seven movements, fourteen load-bearing quotations enumerated per band, and three checks of its own — one more than any lesson before it, because this lesson carries a doctrinal edge that a compressed band would round off rather than drop outright:

- **Both halves of the hard doctrine, uncollapsed.** Darrell drew the line precisely: the Crown was never truly at risk, AND the obedience was fully real. Collapse the first and the cross becomes a tragedy that might have gone the other way; collapse the second and it becomes theatre. The Word holds both without embarrassment — the immutable Nature (Malachi 3:6) beside *he humbled himself, and became obedient unto death, even the death of the cross* — and the gate requires both verses in every band plus an explicit both-halves sentence, so a band cannot quietly resolve the paradox it is supposed to keep.
- **The not-Superman displacement WITH its reason.** *A fictional hero is a wish someone wrote down* — and the real One upholds all things, including the person imagining the cartoon. Without that reason the movement is only a scolding about comics; the gate requires the reason, not just the word.
- **What SOLID means, rather than asserting it.** Unchanging is the definition, and the payoff is the thing a reader can use: it is the only thing that can be leaned on at full weight without checking first.

**His own phrase carries this lesson, so it rides into every band.** *"He is a G"* — from his neighbourhood, meaning SOLID: a soldier who will die for what is right by the Word. That is why the sixth movement is about immutability rather than toughness; he had already made the connection, and the lesson follows his word to Hebrews 13:8 rather than the other way round. It is allowlisted as a quoted SPEAKER (DR-0331), required present in all four bands, and asserted absent from the corpus so the allowlist can never excuse a real drift.

Proven-to-catch three ways, each in a different gate: the full stop put back inside Malachi 3:6, the generic name restored to one sentence of child prose, and the both-halves sentence removed from the youth band. Fullness baseline 102 → 101.

## L100 — Guard the Little Ones (2026-09-17)

Guard the Little Ones: children as a trust, the millstone warning, and being mastered by nothing (adult prose 728 by the gate's counter; floors child 364, others 437):

| band | before | after (gate counter) |
|---|---|---|
| child | 194 · 0.27 | **699 · 0.96** |
| youth | missing | **768 · 1.05** (new) |
| teen | 254 · 0.35 | **789 · 1.08** |
| senior | 435 · 0.60 | **1040 · 1.43** |

**Twelfth in a row** on the facilitator's-notes senior band — it opened *"Teach this as a Word-first, non-partisan response to a real event (pairs with the Sovereign A.I. course and L99, a sound mind not fear)"* and closed on *"CLOSE:"* — and the **fourth inverted band ordering** of the pass: before, child 6.3 against teen 5.2; after, 3.2 / 6.5 / 6.9 / 8.8 ascending, and the reading-level baseline's inverted list shrinks 27 → 26.

**The first lesson in the pass whose quotations arrived CLEAN.** After nine in-quote alterations found in the ten lessons above it, this module had none. What it produced instead is a third category of quoted span, which the two allowlists built so far do not describe.

### The three categories of quoted span, now that all three exist

1. **Quoted Scripture** — must be verbatim KJV. The default, and everything below is an exception that has to earn its place.
2. **A quoted speaker** — Darrell's own words (L103, L101). Real quotations of a real person, correct as marks, and deleting them would erase the attribution (DR-0331).
3. **Our own quoted terms and reported reflexes** — this lesson. `"parental controls"` names an industry term we are re-framing; `"likes"` names a product feature; and the inApp block quotes the two reflexes a story like this provokes — `"the platforms are the enemy"` and `"everyone's on it, what can you do"` — in order to TEST both against the Word rather than endorse either. That is ordinary English: a term held at arm's length, and reported speech.

What keeps category 3 from becoming a hole is where it may NOT appear: not beside a verse reference, and not reading as Scripture. That is the L108 line, where a phrase of OUR OWN wore quotation marks next to verse references and had them removed. None of the four sits anywhere near a reference.

**The honesty assertion earned its keep while the gate was being written.** My draft allowlist also carried `"some say"` — and `some say` IS in the KJV. An allowlist entry that is real Scripture would excuse a real quotation from the gate, so the sentence was rewritten to drop the marks rather than the assertion being relaxed. Two of my own rhetorical questions in the senior draft were unquoted for the same reason, before the apply. An allowlist is only safe while every entry is provably ours.

### The two-tier honesty check, and a lesson that disagreed with itself

The gate now holds **both tiers of DR-0100 in one check**, because dropping either is a failure of truth in a different direction. Soften the documented harm into a hedge and the reader is misled about something real (under-claiming); assert the disputed figure as settled and the reader is misled about something unproven (over-claiming). So every band must carry the guards and the developing-brain harm plainly, AND the company's denial and the contested figure as flagged rather than asserted — and no band may name a dollar figure at all.

That last clause is not hypothetical. **The senior band used to fail it:** it asserted *"reported at up to roughly $17 billion, with outlets ranging about $16.7B to $18B"* while the adult body of the same lesson deliberately refused to name a figure and called it contested. A single lesson disagreeing with itself about what is settled fact is exactly the drift this check now prevents, and the body's treatment is the correct one.

### Two of our own paraphrases carried the generic name

The voice check found two instances, both our own paraphrase of John 12:43 in the facilitator notes — *"one act done for the praise of God, not men"* and *"than the praise of God?"*. A paraphrase in our voice is our voice, so both now say Yahweh; the quoted verse is untouched and still reads exactly as the corpus has it. This is the L104 pairing, asserted in both directions here too: our prose must carry no generic name AND John 12:43 must still read `the praise of God`. Pushing the covenant name INTO the quotation fails **four** separate checks in this file.

Three further band checks guard what a compressed version would round off: the **uncomfortable half** of the millstone warning (it is easy to aim outward at a corporation, and a band that did only that would leave a lesson about other people — the most comfortable kind and the least useful); **the line Paul actually draws** in 1 Corinthians 6:12, which is at the POWER rather than at the lawfulness, so the question of a feed is not whether it is permitted but what it has taken hold of; and that **outward walls do not travel** — the two-hour limit and the nighttime block are real and worth having, but only self-mastery goes with the child into a friend's house, into adulthood, onto a device nobody configured. Plus the sentence the whole third movement turns on: *a feed is a gate, whether or not anyone calls it one.*

Proven-to-catch three ways: the contested dollar figure asserted in the senior band, the covenant name pushed into John 12:43 (four checks), and a real Scripture phrase added to the allowlist. Fullness baseline 101 → 100.

## L99 — Watch and Be Ready (2026-09-17) — the largest find of the pass

Watch and Be Ready: no date-setting, a sober word on A.I. and prophecy, and the blessed hope (adult prose 672 by the gate's counter; floors child 336, others 404):

| band | before | after (gate counter) |
|---|---|---|
| child | 131 · 0.19 | **750 · 1.12** |
| youth | missing | **718 · 1.07** (new) |
| teen | 199 · 0.30 | **716 · 1.07** |
| senior | 299 · 0.44 | **1007 · 1.50** |

**Thirteenth in a row** on the facilitator's-notes senior band, and the **fifth inverted band ordering**: before, child 5.2 against teen 4.3; after, 3.1 / 4.5 / 4.7 / 6.5 ascending, and the reading-level baseline's inverted list shrinks 26 → 25.

### Our own phrase was presented AS Scripture, six times

This is the most consequential find of the pass, and it was not an altered quotation at all. `"found so doing"` appeared **in quotation marks in six places** — `inApp`, a benefit, a quiz explanation, two facilitator fields and a discussion prompt — and in **every case a verse reference stood immediately beside it**: `"found so doing" (Matthew 24:46)`.

The KJV does not say that. It says *shall find so doing* — and the adult body of this very lesson quotes Matthew 24:45-46 correctly. So a reader met quotation marks, a phrase, and a chapter-and-verse citation, and drew the only reasonable conclusion available to them: that they were reading Matthew 24:46. They were reading our participial recasting of it, one word off.

That is the **L108 class at its worst**. L108 had one phrase of our own wearing marks beside references; this had six, and unlike L108's the phrase is a *near-miss of a real verse*, which makes it far likelier to be believed and repeated by someone who trusts us. The fix is L108's: the marks come off, the phrase stays as ours, and the reference remains the honest allusion pointer it always was. The gate now pins both halves — the quoted form may never return, and the phrase itself must still be present.

### Two genuine in-quote alterations came with it, both punctuation

- **Titus 2:13** in `anchor.theme` closed with a full stop where the KJV carries a **semicolon** and continues (*"...Jesus Christ; Who gave himself for us..."*). Truncated to the verbatim clause with no terminal mark — the same fix L101's Malachi 3:6 took.
- **Revelation 22:20** in a quiz option closed with a **comma** where the KJV carries a full stop. A third punctuation variant, and the exact mirror of L101's: there a period was *borrowed*, here a period was *replaced*.

**Running total for the pass: twelve in-quote alterations of the Word** in three typographic classes (eight ASCII apostrophes, two borrowed full stops, one swapped-out full stop), **plus six instances of our own phrase falsely attributed.** The second category is the more dangerous, because a gate that only compares quoted spans to the corpus catches it solely when the phrase is not *also* a corpus substring.

### And that limit is real, so it is named rather than glossed

The check compares each quoted span against the corpus **as a substring**. A short, common quoted word therefore always passes. This lesson quotes the single words `"when"` and `"watch"` in our own prose (*"He turns every when into a watch"*) and both are corpus substrings by coincidence, not by verification. The same coincidence is what let `"some say"` pass in L100's draft allowlist. The check is strong on quotations of any length and weak on one-word quotations; a version requiring a span to match a verse **boundary** rather than merely appear somewhere in the corpus would close it. **re-review: 2026-10-08.**

### Seven movements, and five band checks

Four generic-name instances were lifted from our prose and paraphrase (`bigIdea`, a benefit, a quiz explanation, a talking point — all of "leave the secret things to God"); the quoted Deuteronomy 29:29 still reads *the LORD our God* exactly, asserted in all five fields.

The band checks guard what a compressed version rounds off: **the closed door is a door, not a caution** (if the Son in His earthly ministry did not name the day, then no chart, headline or A.I. milestone does — a band that quoted Matthew 24:36 and stopped would leave date-setting merely discouraged); **readiness stays undramatic**, with the stay-ready-so-you-do-not-have-to-get-ready line intact; **both halves on the imagery** — it is not wrong to WONDER, it IS wrong to make a guess into a doctrine, which is DR-0098's move of naming a question in order to teach past it; **both of the paired commands**, since most people manage only one and each failure looks like faithfulness to the person committing it; and the sharpest observation in the lesson, which a band would drop precisely because it is an aside rather than a verse — **the end-time danger Scripture names is not a machine, it is a WORSHIP, a demand for allegiance.** Drop that and the lesson becomes a lesson about technology.

The senior band also named a specific show as the panel's source. The reader's band keeps the panel generic exactly as the adult body does, rather than carrying an attribution this lesson does not verify, and the gate holds that.

Proven-to-catch three ways: the marks put back on our own phrase (fails **two** checks), the Titus 2:13 full stop restored, and the worship observation removed from the teen band. Fullness baseline 100 → 99.

## L98 — The Judge of All the Earth (2026-09-17)

Equal justice, real partiality named, and a just weight for the numbers (adult prose 626 by the gate's counter before the fixes; floors child 313, others 376):

| band | before | after (gate counter) |
|---|---|---|
| child | 158 · 0.25 | **684 · 1.14** |
| youth | missing | **683 · 1.14** (new) |
| teen | 218 · 0.35 | **627 · 1.05** |
| senior | 341 · 0.54 | **958 · 1.60** |

**Fourteenth in a row** on the facilitator's-notes senior band, and the **sixth inverted band ordering**: before, child 6.6 against teen 6.3; after, 3.0 / 4.9 / 7.4 / 9.4 ascending, and the reading-level baseline's inverted list shrinks 25 → 24. Fullness baseline 99 → 98.

### Five altered quotations, found before a word was authored

| finding | class | instances |
|---|---|---|
| Deuteronomy 1:17 `is God's` | ASCII apostrophe for U+2019 | 3 |
| Leviticus 19:15 `...the mighty.` | borrowed full stop | 1 |
| 1 Thessalonians 5:21 `Prove all things,` | comma for semicolon | 1 |

The 1 Thessalonians comma is a **new variant**, and the pattern is now hard to call accidental. L99 gave period-for-semicolon (Titus 2:13) and comma-for-period (Revelation 22:20); this is comma-for-semicolon — a third pairing of the same two marks. The common cause looks systematic rather than careless: a clause is quoted out of a verse that keeps going, and then closed with whatever punctuation the surrounding sentence wanted. Running total: **seventeen altered quotations in four typographic classes, plus seven false attributions.**

### Four corrections to my own work, all caught by machinery rather than by my reading

This lesson cost more rework than any other in the pass, and every bit of it was mine.

**1. I nearly "fixed" a correct spelling into a real alteration.** The Leviticus span failed and my first reading was `honor` standing where the KJV usually carries `honour`. Wrong twice over: this corpus *does* carry `nor honor the person of the mighty`, so the spelling was right and the defect was purely the trailing full stop — **and the header of the gate file I was editing already said so**: *"this catalog's KJV reads 'honor,' not 'honour,' in Leviticus 19:15; the lesson matches the corpus."* The finding was already verified and written down exactly where I was working. Reading a gate's own header before diagnosing its failures is the cheap step I skipped. Both directions are now pinned, so the spelling can never be "corrected" into a drift.

**2. I built the teen band by transforming the youth band's headings.** 655 words differing from youth by three sentences and 0.1 of a reading grade. That is not a teen band; it is youth with different numbering, and **it would have passed every gate in this repo** — the fullness measure asks whether a band is long enough, never whether it is distinct. Thrown out; youth was rewritten genuinely simpler instead, which is what produced the real 3.0 / 4.9 / 7.4 / 9.4 ladder. Worth recording because the shortcut stays available for ~98 more lessons and no machine will catch it.

**3. My rewritten bands dropped verified specifics the old bands carried** — the 138.2 sentence points and the 19th Judicial Circuit — and the *pre-existing* assertions caught it. Those are tier-1 documented facts, and naming them is what makes the claim checkable, which is this lesson's entire ethic. **A rewrite that makes a verified claim vaguer is a regression even when every word of it is true.** Restored, and the gate now requires both in all four bands.

**4. I broke the module.** Inserting `Florida's` as literal text into a single-quoted JS string terminated the string and the file stopped parsing. Two compounding errors made it worse: the failed command was `&&`-chained, so the snapshot I meant to take was never written, and a `git checkout` on the test file discarded the gate additions I had just authored. Recovery cost a full re-application. Three habits close it: any text inserted into that file is escaped or written apostrophe-free, a parse check runs after every edit, and snapshots are taken as their own command rather than chained behind something that can fail.

### Acts 10:34 was quoted rather than lifted

The voice check found eleven generic-name instances, ten of them our own prose or paraphrase (*"what God requires"*, *"where God judges the judges"*, *"God's law forbids partial judgment"*) — all now the covenant name. The eleventh was different and deserved the opposite treatment: `God is no respecter of persons (Acts 10:34)` used the verse's **exact words unquoted**. The words are Scripture, so the fix was to *quote* them, which keeps the generic name correctly inside the Word and adds an anchor instead of lifting a name that was never ours to lift.

### The largest allowlist of the pass, and why it is sound

This is a justice-statistics lesson, so it quotes the reel's claims in order to weigh them: `"4.5 to 6.5 times harsher"`, `"the white guy got 2 years"`, `"the Black guy got 26 years,"`, `"only difference was race"`, `"6.5x"` — plus a report title, a name, a hashtag, the two reflexes the inApp block tests against the Word, and our own sharpest line, *"an inflated truth is handed its own dismissal."* Twenty-two entries, every one asserted absent from the corpus. Quoting a claim you are about to examine is not asserting it; it is the opposite.

### The hinge the gate now requires in every band

> naming the real wrong does NOT require inflating it — and inflating a true injustice hands it the easiest possible way to be dismissed.

The senior band spells out the mechanism: an opponent who catches the exaggerated multiple will use it to discard the documented 13–20 percent *and* the verified same-judge case along with it. Accuracy is not a concession to the other side; it is the only form in which a true accusation survives scrutiny. One check holds both DR-0100 tiers in every band, because a band keeping only the first would read as advocacy and one keeping only the second would read as dismissal — both failures of truth, in opposite directions.

Proven-to-catch three ways: the Deuteronomy 1:17 apostrophe restored, the 138.2 specifics dropped from the youth band, and a real Scripture phrase added to the allowlist.

## L97 — A Just Weight for Work, Money, and Words (2026-09-17)

Honouring faithful service, one standard for every person, and verifying every claim (adult prose 669 by the gate's counter; floors child 335, others 402):

| band | before | after (gate counter) |
|---|---|---|
| child | 162 · 0.24 | **706 · 1.12** |
| youth | missing | **661 · 1.04** (new) |
| teen | 275 · 0.41 | **666 · 1.05** |
| senior | 381 · 0.57 | **920 · 1.45** |

**Fifteenth in a row** on the facilitator's-notes senior band, and the **seventh inverted band ordering**: before, child 6.5 against teen 6.1; after, 4.1 / 5.1 / 6.8 / 8.2 ascending, and the reading-level baseline's inverted list shrinks 24 → 23. Fullness baseline 98 → 97.

### This lesson is why the pass changed method mid-stream

Its audit turned up `"Prove all things,"` — the **identical** comma-for-semicolon defect fixed in L98 one commit earlier. The same verse, quoted the same wrong way, in the sibling lesson. Finding a defect twice in two adjacent lessons meant lesson-by-lesson auditing was the wrong instrument for a class that recurs, so the catalog was measured at once (28,695 spans; 35 apostrophes fixed catalog-wide with their own gate; 146 terminal-punctuation cases surfaced rather than swept).

Five defects in this module, all verified against the corpus before anything was authored:

| finding | class |
|---|---|
| Ecclesiastes 9:16 `the poor man's wisdom` | ASCII apostrophe (fixed by the catalog sweep) |
| Acts 10:34 `...persons.` | period for a **colon** |
| Acts 10:34 `...persons,` | comma for a **colon** |
| 1 Samuel 16:7 `...on the heart,` | comma for a period |
| 1 Thessalonians 5:21 `Prove all things,` | comma for a semicolon |

**The policy, stated so it is not mistaken for inconsistency:** a lesson entering the gated set takes the **strict** reading — a quotation ends where the verse's own punctuation falls, and any mark the host sentence wants goes outside the closing quote. The other ~157 lessons keep the convention until that standard is decided. The catalog is mixed on purpose, and this lesson is on the strict side.

**An eighth false attribution.** `"searching out" (Proverbs 18:17)` — our nominalisation of a verse that reads *his neighbour cometh and searcheth him*. Marks off. The rewritten bands drop the nominalisation entirely in favour of plain words (*let the process be opened and searched*), which is better than either form.

### Two of my three break tests were no-ops, and the cause is one I have hit before

Proving the new checks caught, two "breaks" left the suite green. That is not a passing gate; it is proven-to-catch theatre, which DR-0076 §3 names outright. Both failed for the same root cause: **my replacement edited text outside the lesson under test.** One targeted a phrase my rewritten band no longer contained, so the edit was a no-op. The other used a whole-file `replace(..., 1)`, which hit the first occurrence anywhere in the catalog — and **L90 is literally named `no-respecter-of-persons`**, so the break edited L90 while L97's gate was watching L97.

That is the L103 failure in a third costume: a check pointed at the wrong subject manufactures confidence exactly as effectively as one that is too lenient. The fix is structural and now standing practice: **a break test is scoped to the block under test and asserts that the edit landed** (`assert n > 0, 'BREAK IS A NO-OP'`) before the result is trusted either way. Re-run under that discipline, all three caught — the nominalisation by two independent checks.

### What the gate now requires in every band

The **self-correction, whole, including that we were the ones corrected.** It was said the video mislabelled the official as a Congressman, insisting he was Florida's CFO. We searched it out, and the correction itself was out of date: he WAS Florida CFO through March 2025, then resigned and won a U.S. House seat, taking office in April 2025 — so Congressman was correct. The lesson is emphatically not who won that exchange; it is that a just weight for words checks **every** claim, the video's, the world's, the correction's, and our own. Every band must carry both dates (so a reader can check it), the conclusion, and the words *our own*. The senior band adds the general principle: **a correction is not automatically more reliable than the thing it corrects; it is simply another claim, owed the same weighing.**

**Both commands at once, and that this is not fence-sitting.** Name the real disparity AND refuse to convict a heart nobody can see. The lesson says it plainly and the gate requires it: fence-sitting declines to say anything, while this says two things and refuses to drop either because the other is easier to shout. Also required: **asking for an accounting stays distinct from declaring guilt** — the discipline that lets the lesson touch a live dispute it does not pretend to resolve.

Proven-to-catch three ways, all verified to land inside L97: the marks put back on our nominalisation (fails two checks), the correction dates dropped from a band, and the Acts 10:34 comma restored.

## L96 — Doers of the Word (2026-09-17)

Competence by doing, the mind's tactics, purity by the Spirit, the highest knowledge (to know Him), and how the family of Yahweh is known — by doing (adult prose 776 by the gate's counter; floors child 388, others 466):

| band | before | after (gate counter) |
|---|---|---|
| child | 167 · 0.22 | **937 · 1.21** |
| youth | missing | **767 · 0.99** (new) |
| teen | 182 · 0.23 | **926 · 1.19** |
| senior | 328 · 0.42 | **1260 · 1.62** |

**Sixteenth in a row** on the facilitator's-notes senior band, which opened *"Teach this as the difference between information and formation"* and carried instructions to the teacher throughout — *"Draw the delegated/reserved line"*, *"Close on the daily dosage and the arc"*, *"Take the sharpest, longest example"*. Reading levels 2.6 / 3.3 / 6.8 / 9.1 ascending; **no inversion to fix** — this is the first lesson in the pass where the original ordering was already correct, so the reading-level baseline is unchanged at 23. Fullness baseline 97 → 96.

### The check-in's premise was wrong, and measurement corrected it before any edit

I carried two false attributions into this lesson. Measurement found one.

`"better to marry than to burn,"` was on the list because 1 Corinthians 7:9 reads *for it is better to marry than to burn*. But the fragment **without** the leading `it is` is a true contiguous substring, so the quotation was legitimate and always had been. What had actually been wrong was the trailing comma — and the catalog-wide terminal sweep in the preceding commit had already fixed it. I was about to strip the marks off a correct quotation of the Word on the strength of a claim I had written down myself and never measured. The gate now records the disproof beside the assertion, because the failure mode here is not carelessness about Scripture but confidence in my own earlier note.

The one real false attribution was `"cast it down"` beside 2 Corinthians 10:5, in the `inApp` block and the child band. The verse reads *Casting down imaginations*. The phrase is a good teaching compression and it is **kept** — as ours, unquoted, with the reference still pointing where a reader can check it. Ninth of the pass.

### A second claim of mine the gate disproved on the spot

Writing the proven-to-catch block I asserted that `There is a way that seemeth right unto a man` is absent from the corpus, as the drift of Proverbs 14:12's `which seemeth right`. It is present. **Proverbs 16:25 is the same sentence with `that`**, and both verses are in this store. So a swap between the two is invisible to any substring check, and the only honest guard is the **reference** the lesson prints beside the words. The gate now asserts both forms present, pins the `which` form to 14:12, and fails if that form is ever labelled 16:25 — which the break test confirms.

This is the third time in this pass that a guard clause of mine died to a corpus read (after `satan’s` being real Scripture, and `Satan` capitalised appearing nowhere). The pattern is worth naming: **my assumptions about what the Word does not say fail more often than my quotations of what it does.**

### The child band was quietly thinner, and the gate is what found it

The first draft cleared the fullness floor at 858 words and would have passed every existing check. Measuring which fragments all four bands actually shared showed the child band missing **sixteen** movements the other three carried: the renewed mind (Romans 12:2), the mortified deeds (Romans 8:13), `rightly dividing the word of truth`, the reasonable service (Romans 12:1), `faith, if it hath not works, is dead, being alone` in full rather than a two-word fragment, the excellency (Philippians 3:8), led-by-the-Spirit (Romans 8:14), the works of Abraham (John 8:39), `temperance`, and the prefrontal cortex by name.

Fourteen were restored, which is the right direction: **a band that clears a length floor while carrying fewer movements is the exact failure this DR exists to prevent**, and length alone cannot see it. Fifty-six fragments are now required in every one of the four bands.

Two are deliberately age-gated and the gate says so with its reason: `that ye should abstain from fornication` and `better to marry than to burn` stay out of the band written for a six-year-old. The **movement** does not — the child band carries the sanctification command, the temple, that marriage is honourable, that singleness for the Kingdom is honoured, and that it is held for years. That is the whole shape of it without the explicit clauses, and the gate requires the shape in all four while requiring the clauses in the other three.

### What else the gate now requires in every band

**The honest clause.** Purity was Darrell's worked example precisely because the flesh will not do it — *"the flesh can't and won't want to do this without the Holy Spirit of Yahweh, over a lifetime."* A band stating a lifetime standard without naming the power for it would be cruel, so every band must say that willpower is not the remedy and that He supplies **both** halves, the wanting and the doing (Philippians 2:13).

**The neuroscience under the Word, not beside it.** DR-0100 tier one: the prefrontal-cortex finding is documented and is stated plainly as true in all four bands, the child's included, with the structure named. And its **place** is stated too — He commanded a `sound mind` and `temperance` millennia before any instrument could observe the tissue. Dropping the ordering would invite a reader to take the Word as needing science's endorsement, which inverts the authority. The senior band adds that the tissue remains capable of reshaping late in life, because that is the encouragement a reader of years actually needs from this movement.

**The deed measured by the Word, not by how right it felt** (Proverbs 14:12) — and in the teen band aimed where it belongs, at the confidence that age is handed.

**Teaching LAST in Ezra's order**, with the reason, in every band. This is the most searching item in the lesson for the senior reader, and the senior band says why: the instruction to teach is real and the temptation is to reach it by the shorter road. *Teaching what one has sought but not done is the hearer-only condition, dressed in authority and multiplied by an audience.*

### The senior band as a reader's lesson

Two new checks, because removing the teacher's instructions is not by itself enough to make a senior reader's lesson: the years spent doing must read as the training rather than a loss, the late-life reshaping must be there, and being asked for counsel must be named as the live temptation. A senior band that merely deletes the clipboard language is still not addressed to anyone.

Proven-to-catch six ways, every edit verified to land inside L96's own block before the result was trusted: the marks put back on `cast it down` (fails two checks), the prefrontal cortex dropped from the child band, the explicit clause pushed into the child band, `Teach this as the difference` restored to the senior band, the Psalms 8:5 comma moved back inside its quotation, and the `which` form relabelled Proverbs 16:25.

One generic `God` was lifted from our own voice in a talking point — *the thief steals/kills/destroys, not God* — and is now the covenant name (DR-0210).

## L95 — Know the State of Thy Flocks (2026-09-17)

Reading the times, meeting people where they are, and not chasing the rally (adult prose 446 by the gate's counter; floors child 223, others 268):

| band | before | after (gate counter) |
|---|---|---|
| child | 106 · 0.24 | **521 · 1.17** |
| youth | missing | **508 · 1.14** (new) |
| teen | 121 · 0.27 | **640 · 1.43** |
| senior | 188 · 0.42 | **918 · 2.06** |

Seventeenth consecutive facilitator's-notes senior band, which opened *"Teach this the..."* and instructed the teacher rather than addressing a reader. Reading levels 3.1 / 5.6 / 7.3 / 8.7 ascending; no inversion to fix. Fullness baseline 96 → 95. All seventeen of the lesson's Scripture quotations were already verbatim — the catalog-wide terminal sweep had cleaned this one.

### A class this pass had not met before: a LIVING PERSON'S words misquoted

Every earlier false attribution in this pass put our own phrasing inside quotation marks beside a **verse** reference. This lesson did it to a named company's chief executive — and the proof needed no outside source at all, because the same sentence appeared in **two different forms** in the same catalog:

| field | form |
|---|---|
| `bigIdea` | `"Following consumers' lead, wherever they may want to go"` |
| teen band | `"following consumers' lead, wherever they may want to go."` |

Different capital, different terminal punctuation. **A verbatim quotation cannot have two forms**, so at most one could ever have been right, and no transcript exists in this repo for either. The one-word `"trick,"` was attributed to him the same way, and a quiz stem carried `"trick"` as well.

The fix required no research, because the lesson already contained the correct pattern in its own base prose: paraphrase him **unquoted** and say the claim is carried as reported. That discipline now holds in `bigIdea`, the quiz and all four bands, and the paraphrase states plainly that we hold no transcript.

**Why this is owed at least as strictly as it is owed to Scripture, arguably more.** A misquoted verse can be checked by any reader against a text that is fixed and public — which is exactly what the gates in this pass do. A misquoted person has words placed in his mouth that he cannot retrieve, and no reader can check them at all. The asymmetry runs against us, so the marks come off.

**The gate's own header was carrying the same misquotation** (`its "trick" was following consumers' lead`) and is corrected, with a note saying so. A gate that forbids in the code what it commits in its own comment is not a gate.

### My chain-order check was theatre, and its own break test proved it

The check asserting every band keeps the Romans 5 order looked sound and passed. Deleting the sentence that actually walks the sequence — *"It produces patience; patience produces proven experience; and experience is what finally produces hope"* — **left the suite green.**

Two causes, both mine:

1. The check tested the **disclaimer** ("does not produce hope directly") and the consequence ("quit in the middle"), never the sequence. It verified a label, not the teaching.
2. Worse, the chain words all appear inside the Romans 5:3-4 **quotation itself**, so any naive search finds `patience`, `experience` and `hope` whether or not we ever explain the order.

Fixed by stripping every quoted span first and requiring the ordered chain in **our own prose**. This is the same root cause as L97's two no-op breaks in a fourth costume: a check pointed at the wrong text manufactures confidence exactly as well as one that is too lenient. It was caught only because the break test was run and its result was read rather than assumed — which is the whole argument for DR-0076 §3.

One further break was a no-op and the harness threw rather than reporting a false pass, which is the L97 discipline working as intended.

### What the gate now requires in every band

- **The Romans 5 order, walked in our own words** — with the disclaimer and the reason people quit in the middle.
- **Reading the times kept DISTINCT from trend-chasing.** Trend-chasing follows what is loudest; this attends to what your own people actually need now. The senior band adds that Issachar's understanding was joined to a conclusion — they knew what Israel *ought* to do, and discernment that never reaches an ought is not yet understanding.
- **Meeting people where they are kept DISTINCT from compromise**, with what makes the difference: compromise surrenders the truth to be accepted, this keeps the truth and absorbs the cost of knowing someone well enough to be useful.
- **Both halves of the money teaching (DR-0100).** The beat is real and is said to be real; earning is not treated as sin in the teen and senior bands; and the crowd's verdict is still refused as a foundation. Under-claiming a verified good result would be as much a failure of truth as inflating it.

### The senior band as a reader's lesson

Four checks, because deleting the teacher's instructions does not by itself address anyone. Each movement is turned toward a reader who has the decades: the Romans 5 chain is the one thing a long life is positioned to **verify** rather than merely accept; the compromise boundary has a mirror-image failure that long conviction invites — defending the truth in terms nobody present can receive, and calling the failure faithfulness; gathering is read as a service rendered rather than a benefit collected, which is the reading that still applies when going has become difficult; and work done for Him does not become worthless when fewer people are watching it.

Its closing principle: **a crowd's approval and a crowd's disappointment are the same substance, arriving on different days, and neither is evidence about the work.**

Gate 22 → 37 checks. Proven to catch six ways, every edit verified to land inside L95's own block: the marks put back on `trick`, the CEO's sentence re-quoted, the chain sequence deleted, the compromise boundary blurred, the senior band turned back into notes, and the beat-is-real clause dropped.

## A sixth class — the first letter of a quotation, re-cased to suit our sentence (2026-09-17)

Found by accident while auditing L94, and the accident is the part worth recording. Its audit flagged

> `"the thoughts of the wicked are an abomination to the LORD,"`

and my first reading was the familiar one: a fabricated comma, the class the terminal sweep had already fixed 222 of. Moving the comma did **not** make it verbatim. Proverbs 15:26 reads *The thoughts of the wicked are an abomination to the LORD:* — a **colon**, and a capital **The**. The span carried **two defects at once**, which is exactly why my own sweep had walked past it: that sweep's test was *"does this become verbatim once the mark moves,"* which answers no for a span that also needs a case fix.

**A detector that normalises one thing at a time is blind to every span needing two.** That is a real weakness in work I had shipped two commits earlier, not a new judgment call.

### Measured

| | |
|---|---|
| spans ≥ 25 chars examined | 24,905 |
| already exact | 24,138 |
| fixed by one existing gate | 11 |
| **needed a case fix PLUS something** | **95** ← no gate could see these |
| not Scripture at all | 661 |

Classified, those 95 were four different things, and only two were this gate's business:

| class | count | what it is |
|---|---|---|
| `firstLetterOnly` | 52 | the host-sentence capitalisation convention |
| `firstPlusTerminal` | 17 | a case fix **and** a fabricated mark — the sweep's miss |
| `capsInside` | 17 | the emphasis class compounded with a case change, already in `quoted-emphasis-baseline.json` |
| `other` | 9 | mostly caps+terminal together, plus two of our own section titles (*"Fearfully and Wonderfully Made,"*) which are ours, not the Word |

### Why the case change is fixed rather than allowed

Lowercasing the first letter of a quotation woven into a host sentence is the most universal convention in English; it removes nothing and makes no claim about meaning, so it is genuinely milder than a fabricated comma and milder still than added emphasis. It is nonetheless not what CLAUDE.md binds — quoted KJV is *"fetched verbatim and left EXACTLY as written,"* with no carve-out. I had already tried holding a carve-out once, for terminal punctuation, and was corrected for applying the strict reading to gated lessons while calling it open elsewhere. The same reasoning settles this, and restoring the verse's case is mechanical, reads correctly inside quotation marks, and costs a reader nothing.

**The catalog was already disagreeing with itself**, which is the strongest evidence the capital is right: of the 53 distinct spans swept, **33 were already pinned in their verbatim form by another lesson's gate** — the same verse quoted correctly in one lesson and re-cased in another. That is the same shape of proof L95 turned on a misquoted person: a quotation appearing in two forms in one catalog cannot be verbatim in both.

**69 occurrences fixed, and the class is at ZERO** — 60 by whole-span replace, then 9 more reachable only by matching a fragment against its region's delimiters rather than as a whole span. That last step is worth noting because both earlier sweeps recorded ellipsis-joined fragments as unreachable residual work; they were not unreachable, just addressed at the wrong granularity. So this gate asserts zero rather than ratcheting.

### The gate's first version was blind to its own founding example

I excluded every span containing an ALL-CAPS word, reasoning that ALL-CAPS belongs to the emphasis class — and `...abomination to the LORD,` contains `LORD`. So the one span that started the investigation was skipped, the reintroduced break **left the suite green**, and I had already written that blindness into the gate's header as an acceptable cost rather than noticing it voided the gate entirely.

The exclusion is now name-aware: `LORD` and `GOD` no longer exempt a span, only ALL-CAPS that is not the divine name. What actually keeps the divine name safe is that the detector alters *only the first letter's case* and a verse beginning with the divine name already matches the corpus exactly, so it is skipped before any flip.

That is the **second time in two lessons** a check of mine tested a label instead of the thing — after L95's Romans 5 chain-order check — and both times the break test was the only reason I found out. Neither would have been caught by reading the check; both were caught by breaking the code and reading the result.

### A structural finding that outlives this class

**L104's gate pins an altered quotation** — `'and see if there be any wicked way in me'`, lowercase, where Psalms 139:24 has `And` — and L104's prose still matches it, so the gate passes and *protects* the alteration from correction. A per-lesson pinned fragment is only as good as the fetch that produced it. Recorded with a date rather than fixed in passing, because changing it means editing another lesson's gate and its prose together. **`re-review: 2026-10-24`** — sweep the per-lesson gates' own pins against the corpus, so no gate can enshrine an altered quotation.

Also honest about evidence: 20 of the 53 swept spans are pinned by no gate at all, so for those the suite's green is silence rather than confirmation. The 33 that are pinned verbatim elsewhere are the real corroboration.

Proven to catch three ways, each verified to land: the Proverbs 15:26 span that started it, `Casting all your care upon him`, and `Let no man despise thy youth`. Gate: `app/src/__tests__/living-lessons-quoted-case.test.js`, 3 checks, asserting zero.

## L94 — Lord of Hosts, the Two Ways, and the Seal of Eternity (2026-09-17)

The capstone, and the largest lesson in the pass: eighteen movements (adult prose 1046 by the gate's counter; floors child 523, others 628):

| band | before | after (gate counter) |
|---|---|---|
| child | 218 · 0.21 | **1086 · 1.04** |
| youth | missing | **1019 · 0.97** (new) |
| teen | 303 · 0.29 | **1233 · 1.18** |
| senior | 402 · 0.38 | **1438 · 1.37** |

Eighteenth consecutive facilitator's-notes senior band. Reading levels 3.9 / 5.1 / 6.6 / 7.2 ascending; no inversion to fix. Fullness baseline 95 → 94. Gate 86 → 98 checks.

**This lesson's audit is what surfaced the sixth typographic class** — its Proverbs 15:26 span carried a fabricated comma *and* a re-cased first letter at once, which is why the terminal sweep could not see it. That sweep and its gate shipped separately, ahead of these bands.

### The allowlist is almost entirely one thing, and it is the lesson's own point

`"the Lord of Host"` is quoted precisely because it is **wrong**: the lesson opens by correcting it, since He is the LORD of host**s**, plural — Commander of all the armies of heaven, not one host among many. Quoting an error in order to correct it is the same legitimate category as L97's `"Congressman"`, the term that was itself under examination. So the gate does more than allowlist it: it requires that the wrong form **never stands without the plural correction beside it**, in every band and in the base prose, with Isaiah 6:3 as the witness.

### The child band was nineteen movements short, again

The first draft cleared the word floor at 957 and would have passed every existing check while missing nineteen fragments the other three carried: Proverbs 4:18-19 (the darkness that hides what trips you, and the path that shines *more and more*), Ecclesiastes 11:3 verbatim, the `righteous still` clause of Revelation 22:11, Psalms 51:5, Colossians 1:15-16, John 1:18, John 6:38, John 6:53/57/63, Matthew 18:19, Matthew 28:19, 1 Corinthians 12:21, 3 John 1:2, Proverbs 15:22, Colossians 3:16, Proverbs 24:3, Luke 14:28 verbatim, Proverbs 12:24.

All nineteen restored. **Eighty fragments are now required in every one of the four bands** — the third consecutive lesson where the shared-fragment measurement caught a thin band that length alone could not see (L96: sixteen; L95: one; L94: nineteen). That consistency is itself the argument for running the measurement before writing any gate.

### What the gate now requires in every band

- **The instrument problem, which is the lesson's spine.** Proverbs 16:2 is not one more verse here: self-assessment reports back clean, which is *why* an outside standard is structural rather than optional. A band quoting the verse without drawing that conclusion has kept the citation and dropped the teaching.
- **The flesh actively opposed, not merely weak.** Romans 8:7 says *neither indeed can be* — not weak, not undecided, but constitutionally unable to submit. Softening it into weakness is the easy drift.
- **Taste before see**, in that order, and study as eating rather than glancing.
- **Yahweh gets the glory for the algorithm; the walker gets the fruit** — the whole point of the seventeenth movement, and the easiest clause to lose.

### The senior band as a reader's lesson

Six checks, because deleting the teacher's instructions does not by itself address anyone. Each movement is turned toward a reader who *has* the decades: **decades of practice do not calibrate that instrument** — they make its verdicts feel better earned; the just path shines *more and more* **the longer it is walked**, which is the promise addressed precisely to someone far along it; a narrower window is still an open one, and *open is the only word that matters*; **long familiarity with the Word is not the same as having eaten today**; receiving help is named as the **harder half** of mutual support; and a career's worth of competence in the operational disciplines is not diminished by attributing it upward — it is **finally accounted for**.

### Two break tests looked like misses and were not

`fleshopposed` and `seniorreader` each left the suite green. Both times my break removed the phrase from the movement but left it in the band's **closing summary**, where the check legitimately found it — so the break had not actually removed the teaching. Widening each break to every instance inside L94's block made both fail. That distinction matters and is the opposite of L95's case: there the check was too lenient; here the break was too narrow. **Neither result is trustworthy until the edit is confirmed to remove the thing itself** — which is why the harness asserts the edit landed, and why a green result after a break gets investigated rather than accepted.

Two generic `God` instances were lifted from our own voice in quiz options — a distractor (*"Many valid paths that all reach God eventually"*) and the correct option's unquoted paraphrase of Romans 8:7 — both now the covenant name (DR-0210).

Proven to catch eight ways, every edit verified to land inside L94's own block: the plural correction removed from the Name, the instrument-problem conclusion deleted, the flesh softened to merely weak (all instances), the taste-then-see order dropped, the glory/fruit split collapsed, the senior band turned back into notes, the senior band's decades-do-not-calibrate line removed (all instances), and one required movement deleted.

## L93 — Come, Let Us Reason (2026-09-17)

Truth is truth in any language, the mind rewired, and the Word that seemed a fantasy turning data-real (adult prose 721 by the gate's counter; floors child 361, others 433):

| band | before | after (gate counter) |
|---|---|---|
| child | 153 · 0.21 | **798 · 1.11** |
| youth | missing | **705 · 0.98** (new) |
| teen | 223 · 0.31 | **895 · 1.24** |
| senior | 288 · 0.40 | **1157 · 1.60** |

Nineteenth consecutive facilitator's-notes senior band. Reading levels 4.8 / 6.7 / 8.0 / 8.7 ascending; no inversion to fix. Fullness baseline 94 → 93. Gate 30 → 44 checks.

### The allowlist's first entry is the lesson's own hinge

`"believe or else"` is quoted precisely because it is what Yahweh does **not** say — the contrast that makes the invitation of Isaiah 1:18 land. Quoting a thing in order to deny it is the same category as L94's `"the Lord of Host"` and L97's `"Congressman"`, and the gate does more than permit it: it requires every band to carry the contrast **and** negate it explicitly, alongside the invitation itself. A band that let `believe or else` stand unmarked would invert the lesson.

### A paraphrase that was already honest, and is now gated as such

The child band renders *reason together* as `"Come here, let us think it through together!"` — our plain English, not the verse's words. It was already signposted with *that means* immediately before, which is exactly the form DR-0076 requires of a paraphrase. Rather than strip it, the gate now **requires the signpost**: it locates the gloss and asserts the preceding characters carry the marker, so our rendering can never drift into looking like His words. This is the first time in the pass a paraphrase has been kept *and* structurally protected instead of un-quoted.

### The sentence a careless reader would invert

If the truth survives any language, why fetch verses verbatim? The lesson answers it directly — *precisely BECAUSE the meaning is too valuable to distort* — and the gate now requires that answer in every band. Dropping it would hand the reader a licence this lesson never grants, and it would contradict the very discipline the other gates in this pass enforce. Invariant meaning is an argument for accuracy, never against it.

### Also required in every band

- **The experiment's order** — obedience *before* certainty (John 7:17), with the knowing named as the promised result. Demanding the result before running the experiment is the one procedure guaranteed to produce no data.
- **The shock and the joy read as evidence, not mood** — an old pathway breaking and a new one forming, both data rather than a feeling passing through.
- **The neuroscience under His Word** — He commanded the re-forming before the term `neuroplasticity` existed.

### The senior band as a reader's lesson

Six checks turning each movement toward a reader who has the decades: a long-held translation is **reconciled rather than corrected** (*the treasure was never the alphabet*, and it was never diminished by anyone receiving it in theirs); reversed majorities are named as evidence he already holds; the rewiring is documented to continue **late in life** and the pathways are explicitly **not sealed**; the everlasting love is weighed for its direction — it has **no start date** to be measured against his record; and *the joy of the LORD is your strength* is addressed most pointedly to whoever has less strength of his own than he once had.

Nine generic `God` instances were lifted from our own voice across the base prose, the bands and a facilitator note — *"The God of all truth"*, *"the God who IS Truth"*, *"not what most people expect from a God"* — now His covenant name or a title that names Him unambiguously (DR-0210). Titles CLAUDE.md leaves available stay available; what went is the bare generic where He is the one being named. Note that `"God, that cannot lie"` (Titus 1:2) is untouched and the gate asserts it: the covenant-name rule governs our voice, never a quotation of the Word.

Proven to catch eight ways, every break made **global inside L93's block** from the outset — the discipline L94 taught after two breaks left a phrase standing in a band's closing summary: the negation removed from what He does not say, the verbatim-accuracy clause deleted, the experiment order dropped, the shock/joy-as-evidence reading removed, the before-the-term clause deleted, the paraphrase signpost stripped, the senior band turned back into notes, and the senior band's translation-reconciling line removed.

## L92 — Yahweh Standardized Love (2026-09-17)

Obedience, deeds, the thoughts not cast down, and the Kingdom inside us (adult prose 664 by the gate's counter; floors child 332, others 399):

| band | before | after (gate counter) |
|---|---|---|
| child | 171 · 0.26 | **752 · 1.13** |
| youth | missing | **646 · 0.97** (new) |
| teen | 202 · 0.30 | **790 · 1.19** |
| senior | 251 · 0.38 | **998 · 1.50** |

Twentieth consecutive facilitator's-notes senior band. Reading levels 4.1 / 4.8 / 5.7 / 6.9 ascending; no inversion to fix. Fullness baseline 93 → 92. Gate 37 → 51 checks.

### A tenth false attribution, and the subtlest kind yet

A facilitator prompt carried `"captive to the obedience of Christ"` in quotation marks — **inside a sentence that had already cited (2 Corinthians 10:5) a clause earlier**. The verse reads *bringing into captivity every thought to the obedience of Christ*; ours is a compression. The adjacent citation is what makes it a false attribution rather than a stray phrase: a reader has every reason to take the quoted words for the verse's own. Marks off, phrase kept as ours, reference still pointing where it can be checked — and the gate now asserts both that our compression is never quoted and that the verse itself appears in full.

### A check that would have failed a correct child band

The shared-fragment measurement found three fragments missing from the child band: `temple made of temples`, `defilement carried INTO the holy place`, `lamp you never light`. But the child band **does** teach all three, in its own words — *the temple made out of temples*, *dirt you carried INTO His holy room*, *a lamp you never turned on in there*. Requiring the adult phrasing would have forced the child band to adopt language written for adults, in the name of a gate meant to protect it.

So the synthesis check tests the **teaching** rather than one phrasing, accepting either form. That is the mirror image of the mistake this pass keeps catching: L95's check watched a label instead of the thing; here a naive check would have watched the adult's *wording* instead of the child's *meaning*. Both failures are the same error pointed in opposite directions — **a check must watch the thing, not a token standing in for it.**

### The synthesis is the payoff, so every band must reach it

Movement nine is what turns the standard from a rulebook into the upkeep of an occupied house: if you are a temple, an uncast-down thought is defilement carried **into the holy place**, and the study you never do is a lamp you never light in it. The gate requires all five parts in every band — the defilement, the unlit lamp, *not a leash*, the temple-made-of-temples, and the closing if-then (*Obey Him, and the temple stays His*). A band carrying the nine movements but stopping short of the synthesis would read as a list of demands with its reason removed.

Also required in every band: that the command is **casting down and taking captive, not avoidance** — the thought's arrival is not itself the sin (the teen and senior bands quote `"avoid bad thoughts"` in order to deny it); that an unfought thought is **a deed already begun**; and that the **study never done is not neutral**, restated as *a thought never captured and a deed never done*.

### The senior band as a reader's lesson

Six checks turning each movement toward a reader who has the decades: **not grievous** is weighed as a statement about the commandments rather than about the reader's vigour; a thought fed for forty years has a **deeper channel** than one fed for four, which makes the casting down harder and the command no less addressed to him; **long acquaintance with the Word is not study undertaken this week**; a quiet obedience nobody notices is **still load the body is carrying** because of him; ownership is settled even of a body that has **begun to fail** (*ye are not your own*); and a stone already laid is **still bearing weight**.

Two generic `God` instances were lifted from our own prose, where it supplied the subject before a Romans 2:6 quotation (*God "will render to every man according to his deeds"*) — now `He`, since the verse itself reads *Who will render* (DR-0210).

Proven to catch eleven ways, every break made global inside L92's block: the marks put back on our compression (fails two checks), and each of the defilement, unlit lamp, not-a-leash, temple-made-of-temples, closing if-then, deed-already-begun, not-neutral, omission-restated, senior-as-notes and still-bearing-weight lines removed.

## Not decided here (surfaced, with recommendations)

- The floors (0.5 / 0.6) are the recommended default. Darrell may set them higher; raising them only grows the recorded debt, never hides it.
- Whether the youth level is authored in the same pass as child/teen/senior (recommended: yes — the lesson is open, the message is in hand) or as a second pass.
