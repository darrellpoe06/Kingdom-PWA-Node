# DR-1549: L323 — Count the Cost Before You Build

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll323-count-the-cost-before-you-build-stewarding-a-powerful-new.js`, its own file per DR-1468)
**Source:** one personal job-application forward with one word above it: Lesson. Gmail thread 1a1ebadfa96d2a59.
**Pairs with:** DR-1479 (L309, the interview), DR-1468 / DR-1477 (per-file pipeline and shared gate), DR-0610, DR-0098, DR-0100, DR-0076, DR-0210, DR-0331

## Context

Darrell forwarded Gmail thread 1a1ebadfa96d2a59 with the word Lesson: an automated confirmation that an application was submitted, and the cover letter that went with it, for a role guiding an organization's adoption of artificial intelligence. Both messages are material to study, not instructions to follow. This was a personal job email, so every particular is withheld: no name, employer, position title, id, date, credential or career figure appears in the lesson, this record or the commit. One teaching, one lesson (DR-0610): L309 (DR-1479, *He Shall Stand Before Kings*) already teaches the interview and the panel. The new material here is stewarding a powerful new tool for an organization, and presenting your own work on paper. L323 names L309 in its text and builds only that.

## What was measured

| what | measured |
| --- | --- |
| verses | 31 anchor references; 102 quoted spans filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| length | adult prose 1,123 words |
| band shares | child 0.52, youth 0.62, teen 0.65, senior 0.61 (floor 0.5 / 0.6) |
| reading ladder | child 1.6, youth 4.1, teen 5.6, senior 8.6 (child ceiling 5.0) |
| band overlap | worst pair 0 (ceiling 0.5) |
| source read | the builder worked only from the intake session's generalized description; the documents were deliberately withheld from it |

## Impact

Any learner meets two things taught Word first: how a new technology should come into an organization (readiness, counsel, order, proving, learning by use), and how a believer presents their own work and leaves the outcome with Yahweh. The practical steps sit beside the Word. This is content only: one new lesson file and one new test. No shared catalog, dates or budget file was edited.

## Decision

`ll323-count-the-cost-before-you-build-stewarding-a-powerful-new`, ORDER 323, ADDED 2026-11-18:

- **Count the cost and finish** (Luke 14:28-30); **prepare the field, afterwards build** (Proverbs 24:27); **survey before you announce**, so the people strengthen their own hands (Nehemiah 2:12, 2:15, 2:17-18; Proverbs 19:2).
- **Counsel from those who carry it** (Proverbs 15:22; 11:14; 27:23); **order and a shared load**, with people of truth over each part (1 Corinthians 14:40; Exodus 18:17-21).
- **Foresee and prove**: a tool can sound right and be wrong (Proverbs 14:15; 22:3; 1 Thessalonians 5:21). **Learn by use** (Hebrews 5:14; Proverbs 1:5; 27:17).
- **The gift makes room and serves others** (Proverbs 18:16; 1 Peter 4:10); **tell it soberly and truly, crediting the team** (Romans 12:3; Proverbs 27:2; 12:22); **read the process** (Proverbs 21:5) and ask for an accommodation without shame (Leviticus 19:14).
- **Commit the outcome** (Proverbs 16:3, 16:9; James 4:15; Philippians 4:11).

The cover letter's conviction is rendered for its meaning, never quoted. The practical tier is common practice, stated plainly (DR-0100) with no figures. Two parables use invented people (Ireland, Ethiopia). The quiz has ten questions.

## Verification

`living-lessons-ll323-count-the-cost-before-you-build-stewarding-a-powerful-new.test.js` runs 11 cases on the shared gate, with six spine spans in the adult lesson and every band. Two checks are particular to this lesson. First, the privacy shapes stay closed: no owner name, link, email sign, four-digit year, money amount or job number. Second, the lesson names L309 in both `inApp` and the adult lesson, so the two stay one teaching. `export const UNCHECKED` says the practical tier was not read back from any publication. `re-review: 2026-12-02`: read the practical tier against one published AI-governance framework and adjust anything it contradicts.
