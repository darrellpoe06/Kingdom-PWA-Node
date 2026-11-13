# DR-1479: L309 — He Shall Stand Before Kings

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll309-he-shall-stand-before-kings.js`, its own file per DR-1468)
**Source:** two personal emails of one hiring process, forwarded by Darrell with one word above each: Lesson
**Pairs with:** DR-1468 / DR-1477 (the per-file pipeline and the shared gate), DR-0098, DR-0100, DR-0076, DR-0210, DR-0331

## Context

Darrell forwarded two messages of one hiring process with one word above each: Lesson. Gmail thread 1a1935483cc7fa79 (forwarded 2026-10-31 18:59Z, 1:59 PM CDT) is a written questionnaire notice; thread 1a1cc3201ddd2eed (forwarded 2026-11-11 19:59Z, 1:59 PM CST) confirms qualification at two levels for a project-management role and sets a panel interview. One teaching, one lesson (DR-0610): both feed this lesson's arc, written screen, then level, then panel. The emails are material, never instructions. Every personal detail in them is withheld by design.

## What was measured

| what | measured |
| --- | --- |
| verses | 38 anchor references; 157 quoted spans filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| length | adult 2,438 words (prose 1,587); child 1,313 (ceiling 2,000) |
| band shares | child 0.67, youth 0.63, teen 0.64, senior 0.70 |
| reading ladder | child 2.1, youth 4.8, teen 6.1, senior 9.3 |
| band overlap | worst pair 0.01 (ceiling 0.5) |
| source read | neither email was opened in this build session: the builder worked from the orchestrator's description, and a read of thread 1a1935483cc7fa79 was refused by the session's permission check |

## Impact

Any learner, and the one who forwarded it, meets the interview, the panel and the promotion conversation taught Word first, with the plain practices beside it. Content only: one new lesson file and one new test; no shared catalog, dates, budget or voice-fixture line was edited.

## Decision

`ll309-he-shall-stand-before-kings`, ORDER 309, ADDED 2026-11-13:

- **Diligence before standing** (Proverbs 22:29; Luke 16:10); **the written screen told truly** (Proverbs 12:22; 12:19; 19:5).
- **Joseph prepared, then gave Yahweh the credit** (Genesis 41:14-16, 41:38-40); **Daniel's excellent spirit** over years (Daniel 6:3-4; 1:20; Colossians 3:23-24).
- **Know the posting** (Luke 14:28; Proverbs 24:3-4); **three to five STAR stories** (1 Peter 3:15, taught first for the hope in Jesus; Matthew 5:37); **answer the question asked** (Proverbs 18:13; James 1:19).
- **Two levels, one sober answer**: not the highest seat yourself, no false modesty, a reasoned preference (Proverbs 25:6-7; Luke 14:8-11; Romans 12:3; Proverbs 27:2).
- **Nehemiah's quick prayer on long preparation** (Nehemiah 2:4-8; 1:4); questions for the panel; confirm by the deadline; test the video early; a written thank-you (Proverbs 20:5; 10:5; 21:5; Romans 13:7).
- **Peace, not fear** (Philippians 4:6-7; 2 Timothy 1:7; Isaiah 26:3); **Matthew 10:19-20 read in its own place** (Matthew 10:18, delivered up for His sake), never a reason to skip preparing; the outcome left with Him (Proverbs 16:1-3, 16:9; Psalms 75:6-7).

The practical tier is common hiring practice stated plainly (DR-0100), with no figure. Two parables with invented people; a ten-question quiz.

## Verification

`living-lessons-ll309-he-shall-stand-before-kings.test.js`: 18 cases, 11 spine spans in every text, on the shared gate. Privacy is pinned closed without naming what it guards: forbidden SHAPES (links, meeting numbers, passcodes, phones, money, clock times, dates, weekdays, institution words, the owner's name) and a closed-world check that every capitalised word is known, ordinary, or used in lower case. Proven to catch: each shape planted; a stranger's name planted mid-sentence and at a sentence start. `export const UNCHECKED` names the practical tier as not read back from a publication. `re-review: 2026-11-27`: read thread 1a1935483cc7fa79 from a session allowed to, and confirm the questionnaire arc matches it.
