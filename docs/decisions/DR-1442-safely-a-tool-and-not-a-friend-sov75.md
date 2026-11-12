# DR-1442: Safely - a tool and not a friend (sov75)

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** A (one lesson added to an existing course; no schema, no door, no money)
**Type:** lesson
**Area:** `app/src/lib/sovereign-ai-class.js` (sov75, 75 modules), `app/src/__tests__/sovereign-ai-sov75-verses.test.js` (30), `app/src/lib/course-band-coverage-baseline.json`, `scripts/file-budgets.json`
**Sent in by:** Darrell, 2026-11-12, straight after the video that became sov74 (DR-1446): a second video, https://youtu.be/dXxZwwCoO04, Sinead Bovell with Natalie Monbiot at SXSW EDU 2025, with a timestamped summary. His next message was one word: Safely.
**Pairs with:** DR-1446 (sov74), DR-1439 (understanding by repetition), DR-1440 (courses earn crowns), DR-0098, DR-0100, DR-0076, DR-0456, DR-0331 (his words rendered for meaning, never in quotation marks)

## Context

As summarised, Bovell argues that A.I. now is the internet of 1992, soon as invisible as electricity (03:11-04:28). She gives three pillars: safe adoption (A.I. is not a friend; ask good questions, validate answers), adjust the classroom now (tool at home, deep thinking in class, a higher bar), and long-term redesign (adaptable, intellectually independent learners, with policy leading so teachers are not alone). The skills that matter most are not technological, over-reliance brings cognitive atrophy, and the ethics are children's data, biased assessment and career prediction, and chatbot addiction (39:46-43:30). His one word, Safely, set the spine.

## What was measured

- **The video was not watched.** This session cannot reach YouTube; every text says so, under a check.
- **The session was checked; her words were not.** A web search found SXSW EDU's own pages for the 2025 featured session with Bovell and Monbiot. Her exact words and timestamps come from the summary. Her claims on atrophy and addiction are given as hers, and listed under WHAT WE DID NOT CHECK.
- **Safe use is required in every band, not remembered.** Each of the five practices is asserted in all five texts, and a stripped band is proven to fail by name.

## Impact

Safety in the Word is in sound wisdom kept, not in the tool and not in a ban (Proverbs 3:21-23; 1:33; 29:25). Eight numbered movements, five of them practices: a tool and not a friend (Proverbs 18:24, 27:17; John 15:15; Psalm 115:4, 8); validate every answer (Proverbs 20:5, 25:2; 1 Thessalonians 5:21); guard the child's data and worth (Matthew 18:10; Proverbs 27:23, 20:23; Psalm 139:14); not brought under the power of any (1 Corinthians 6:12; 2 Peter 2:19; Proverbs 24:30-31; Hebrews 5:12); and the thinking kept our own (Romans 12:2; 2 Corinthians 10:5; Proverbs 4:23; 2 Timothy 1:7). It ties to sov74 and the record: every retake is study (the exercise of Hebrews 5:14), and the crown goes to him that is temperate in all things (1 Corinthians 9:25). Teachers not left alone: Exodus 18:18.

## Decision

1. **Safely is the spine.** Every band carries all five practices and grounds them in Proverbs 3:21-23 or 3:23.
2. **Bovell is credited as Bovell.** Her points carry the summary's timestamps in the adult lesson. Nothing is attributed to her beyond the summary.
3. **The quiz tests understanding of the five practices** and of what was not checked (eight questions).
4. **Every verse is filled from `app/public/bible/kjv`** by a generator, never typed; the gate re-derives it from disk.

## Verification

`sovereign-ai-sov75-verses.test.js`, 30 green against the live module. `fourBandFaults` clean: adult prose 1,422 words; shares child 0.554, youth 0.643, teen 0.632, senior 0.638; ladder child 1.42 < youth 3.59 < teen 5.43 < senior 8.29, adult 6.30; worst overlap 0.042 adult~teen. 85 quoted spans swept against per-chapter joins of 12 books, all verbatim; every double-quoted span in the module is Scripture. Proven to catch: one altered word, the U+2019 class (Psalm 115:4), and a band stripped of a practice. Talk-together directions in every text (DR-0795). Band baseline re-derived: total 471, allFour 297, debt unmoved.

**Finding caught by the gate:** the first draft's bands carried 0.47 to 0.57 of the adult lesson, under their floors. They were written up by hand, not padded by script (DR-1306), and the child band was one referenced verse short of the gate until Proverbs 4:23 was added.

`re-review: 2026-11-26` — read the child band on the live build at Big Print size.
