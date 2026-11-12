# DR-1445: With all thy getting get understanding (sov74)

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** A (one lesson added to an existing course; no schema, no door, no money)
**Type:** lesson
**Area:** `app/src/lib/sovereign-ai-class.js` (sov74, 74 modules), `app/src/__tests__/sovereign-ai-sov74-verses.test.js` (29), `app/src/lib/course-band-coverage-baseline.json`, `scripts/file-budgets.json`
**Sent in by:** Darrell, 2026-11-12: a video, https://youtu.be/g_gRHW4SJtI, on how A.I. is changing education worldwide, with one word of his own over it: Lesson. A point-by-point summary with timestamps came with it.
**Pairs with:** DR-1439 (understanding by repetition), DR-1440 (courses earn crowns), DR-0098 (teach the Word, do not debate it), DR-0100 (speak established fact), DR-0076 (never assert the unverified), DR-0456 (verses filled from the corpus, never typed), DR-0331 (his words rendered for meaning, never in quotation marks)

## Context

The video, as summarised, reports schools worldwide adapting to ChatGPT, Gemini and Claude: responsible use rather than bans, rules set by the student's level (Hany Farid among the experts), Estonia's national programme, a teacher (Karmen Kisel) on designing lessons so the tool adds value rather than a shortcut, fact-checking and data stewardship taught on purpose, India in primary schools, rising university cheating and the move to in-room exams, group work, projects and presentations, and the workplace that reveals a shortcut. The same night, DR-1439 and DR-1440 settled how this app's learner record reads.

## What was measured

- **The video was not watched.** This session cannot reach YouTube; the lesson is built from the summary and says so in all five texts, under a check.
- **Names and figures were checked where a tool could reach them.** A web search confirmed Hany Farid (the summary spells him Hani) as the UC Berkeley researcher of manipulated images. Press reports describe Estonia's AI Leap: announced early 2025, begun that September with about 20,000 high-school students and 3,000 teachers. Karmen Kisel, the India figure and any cheating figure were not checked, and the adult lesson lists them under WHAT WE DID NOT CHECK.
- **The video's principles are already this course's and this record's.** Data stewardship is why the course builds on owned hardware; four age bands are rules by level; DR-1439's every-try-is-study and every-answer-right are a test that measures understanding.

## Impact

The landing is Proverbs 4:7: with all thy getting get understanding. A machine can hand a student an answer; it cannot hand him the getting. Seven numbered movements teach the video Word-first: the getting (Proverbs 4:7, 18:15; James 1:5), rules by level (Isaiah 28:10; Hebrews 5:14), checking and data (Acts 17:11; Proverbs 14:15; 1 Thessalonians 5:21; Luke 16:10), the test that reveals (2 Timothy 2:15; Galatians 6:7; Proverbs 12:24; Hosea 4:6; Proverbs 19:2; Daniel 1:17, 1:20), the house's own record and its crowns (Proverbs 14:18; Proverbs 4:8-9; 1 Corinthians 9:25; Colossians 3:23), and the tool that supports and never replaces (Proverbs 2:4-5). The honest limit is said in every band: the record cannot see whether a machine sat beside the learner.

## Decision

1. **The video is handled fairly.** Its counsel is named as sound before anything is added; no quarrel is manufactured (DR-0098, DR-0100).
2. **Provenance is plain.** The video id is in the module; every text says it was not watched.
3. **Every verse is filled from `app/public/bible/kjv`** by a generator, never typed, and the gate re-derives that from disk.
4. **The tie to the record is taught, not asserted**: reading counts, every try is study, understanding means every answer right, crowns, and the limit, in every band.

## Verification

`sovereign-ai-sov74-verses.test.js`, 29 green against the live module. `fourBandFaults` clean: adult prose 1,578 words; shares child 0.546, youth 0.629, teen 0.643, senior 0.632; ladder child 1.26 < youth 3.43 < teen 5.42 < senior 9.21, adult 6.61; worst overlap 0.030 adult~teen. 80 quoted spans swept against per-chapter joins of 14 books, all verbatim; every double-quoted span anywhere in the module is Scripture. Proven to catch: one altered word, the U+2019 apostrophe class, and a band with the record's limit stripped. Talk-together directions present in every text (DR-0795). Band baseline re-derived by script: total 470, allFour 296, debt unmoved.

**One finding caught by the gate, not by reading:** the first draft's teen band read at grade 2.77, below youth's 3.72, inverting the ladder, because its sentences had been cut too short. It was rejoined by hand to 5.42 (DR-1306: no script edits authored prose).

`re-review: 2026-11-26` — read the child and teen bands on the live build at Big Print size.
