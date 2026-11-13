# DR-1480: L310 — The Hidden Life and the Empty Chair

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll310-the-hidden-life-and-the-empty-chair.js`, its own file per DR-1468)
**Forwarded by:** Darrell, newsletters, each with one word above it: Lesson
**Pairs with:** DR-0610 (one teaching, one lesson), DR-1468 / DR-1477 (the parallel pipeline), DR-0098, DR-0100, DR-0076, DR-0331

## Context

Darrell forwarded two newsletters into the app on 2026-11-13, each with one word above it, Lesson: the 1440 Daily Digest, Nvidia Shakeup (Gmail thread `1a1d4fa73bc93705`, 12:55Z), and Morning Brew, Jensen's out (thread `1a1d4fb3c21f7744`, 12:56Z). A related earlier forward of the same story, Morning Brew, Everyone's problem, 2026-11-10 (thread `1a1c5c35c2357a0f`, 14:01Z), belongs to this lesson, but its text was not read in this build and nothing is stated from it (`re-review: 2026-11-27`: read it and fold in anything it adds). Both read newsletters lead with one story: the board's investigation announced on Sunday, then the resignation of Nvidia's chief executive after 33 years, amid reported affairs, one reportedly with a senior executive who reported directly to him, and, Morning Brew reports, 60 direct reports with no succession plan. One teaching, so one lesson. His only word is Lesson; it is rendered, never quoted. L309 was already reserved by another session (`reserve/ll-309`, He Shall Stand Before Kings), so this lesson took L310.

## What was measured

| what | measured |
| --- | --- |
| verses | 37 anchor references; 130 quoted spans over 43 references, every one filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| length | adult 2,148 words; child 946 (ceiling 2,000) |
| band shares | child 0.52, youth 0.62, teen 0.63, senior 0.64 |
| reading ladder | child 1.1, youth 4.3, teen 6.0, senior 8.4 |
| band overlap | worst pair 0.06 (ceiling 0.5) |
| news, tiered | fact where both 2026-11-13 newsletters state it (the resignation, the interim chief, 1993, 33 years); reported by the named outlet (the affairs, the New York Times and Reuters; the 60 direct reports and no plan, Morning Brew; the $550 billion, 1440); unknown (the spying suspicion: no finding) |
| not read | the 2026-11-10 Morning Brew forward (not read in this build; nothing drawn from it; re-review 2026-11-27); the New York Times and Reuters reports themselves; market data; the cause of the Brooklyn collapse (under investigation) |

## Impact

A learner meets a public fall taught Word first and without gossip: what is covered comes to light (Luke 12:2-3; Numbers 32:23), the David pattern of power over someone under you (2 Samuel 11-12), Joseph who fled (Genesis 39), no gloating (Galatians 6:1), and the succession the Word requires (Exodus 18; Numbers 27:15-18; 2 Timothy 2:2), applied to a household, a church and PoeTech itself. Content only; no data or behavior changes. One new file and one new test; no shared catalog, dates, budget or order line was edited.

## Decision

`ll310-the-hidden-life-and-the-empty-chair`, ORDER 310, ADDED 2026-11-13, Word first:

- **What is covered comes to light**, hidden, then reported, then the fall (Luke 12:2-3; Numbers 32:23; Hebrews 4:13; Proverbs 5:21; Proverbs 10:9); **the soul goes first** and a secret is a handle (Proverbs 6:32; Hebrews 13:4; Proverbs 22:1).
- **The king on the roof** (2 Samuel 11:1, 4, 27; 12:7, 10, 13; Psalms 51:10): desire joined to authority over someone under you; never blame the one with less power.
- **The servant who ran** (Genesis 39:2, 9, 12; 1 Corinthians 10:13; Psalms 101:2); **no gloating** (Proverbs 24:17; 1 Corinthians 10:12; Galatians 6:1).
- **The empty chair**: Jethro's counsel, character first, a successor named and trained in public, four generations (Exodus 17:12; 18:14-23; Numbers 27:17-18; Deuteronomy 34:9; 2 Kings 2:9; 2 Timothy 2:2).
- **The warning on the desk**: the Brooklyn collapse (1440), cause still under investigation (Proverbs 22:3; Matthew 7:24, 27), adult and senior bands only.
- **The way back**: confess and forsake, the Lamb, the Eternal Son of Yahweh (Proverbs 28:13; 1 John 1:9; John 1:29).

Only the public man is named; no one else from the reports is. The child band carries the truth without the adult words. Two parables with invented people; a ten-question quiz.

## Verification

`living-lessons-ll310-the-hidden-life-and-the-empty-chair.test.js`: 16 cases on the shared gate (DR-1477) with 8 spine spans in every text, plus six dangers, each proven to catch with a planted defect: an affair named without the word reported; spying stated as fact; another person from the reports named; adult words in the child band; a cause claimed for the Brooklyn collapse; a Gmail thread dropped from the file. `export const UNCHECKED` names what was not read. `re-review: 2026-12-13`: read the board's and the investigators' findings, and correct any line they overturn.
