# DR-1401: dsi16 — The house reports itself: the before and after of the migration lane and the loops witness, taught as a module

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (one course module; content only)
**Type:** lesson
**Area:** PoeTech Data Systems & Infrastructure (`app/src/lib/datasystems-course.js`, `lesson-stories.json`)
**Sent in by:** Darrell, 2026-11-10: "Explain the before and after in a lesson... so we can know what where when how why of this workflow/s"
**Pairs with:** DR-1398, DR-1399 and DR-1400 (the change it teaches), DR-1360 (the NAS initiates every road), DR-0076 (every verse fetched; every number from a recorded run), DR-0331 (his words rendered for meaning), DR-0061 (reality-trace)

## Context

The same day the migration lane and the loops witness were turned around to read the house's own receipts over the public road, he asked for the change to be explained as a lesson, covering what, where, when, how and why, for whoever helps run these systems. The Data Systems course is the onboarding path for exactly those people, and its NAS module (dsi6) already teaches the box this runs on, so the lesson is its sixteenth module.

## What was measured

- **Length.** The adult lesson is 1,445 words. Band shares of it: child 0.51, youth 0.61, teen 0.61, senior 0.64 (floors 0.5 and 0.6).
- **Reading grades.** Child 2.5, youth 5.4, teen 6.3, senior 8.5, adult 6.9: rising band to band, not inverted.
- **Band overlap.** The worst overlap is 0.08 (ceiling 0.5). All three talk directions appear in every band.
- **Scripture.** 34 quoted spans, 0 verse faults against `app/public/bible/kjv`. No ellipsis, no percentage, no generic God in our voice.
- **Times and counts.** Every one is from a recorded run:
  - db-migrate 42813212175: 0317 was applied by the NAS at 12:15:24 and read back at 12:16:21, none missing of 316.
  - db-migrate 42824608061: 0318 was applied at 13:30:24.
  - loops-health 42826042122: the key was refused, the run read the heartbeat, and all twelve jobs passed; incident #2473 closed.

## Impact

A steward who meets a red migration check, or a late heartbeat in Admin, can learn what it means and what to do from the course. The lesson's gate reads the real workflow, the heartbeat reader and the admin surface, so the lesson cannot drift quietly from the system it teaches.

## Decision

`dsi16-the-house-reports-itself` is added, in twelve headed parts:

- The occasion; what the pieces are; where the roads run; what it was before.
- Why it was turned around. This part says plainly that the earlier advice, to mint a new outside credential, was wrong and had already been refused.
- What it is now (the three receipts); how it runs, in order; when it was proven.
- What it does not do: names and times only; a witness, not a lock; it rests on poetech.us.
- What the Word says; what to do with it; talk about it together.

The lesson rests on 14 references, among them Proverbs 27:23, Habakkuk 2:2, Isaiah 21:11, 2 Samuel 18:25 and Psalms 127:1. It carries two parables with invented people (a keeper's log in the window, a night nurse's posted round sheet) and six quiz questions. The course meta moves from 15 to 16 modules; dsi15's gate now pins it by position rather than as the last module.

## Verification

`datasystems-dsi16-house-reports-itself.test.js` (37 cases) checks:

- **What, where, when, how and why** are each said.
- **The measured timeline** appears in the lesson, teen and senior bands.
- **The admission** of the earlier wrong advice is there.
- **The limits and the four causes** are stated.
- **The reality-trace holds.** The lesson's 25 minutes is the workflow's `--wait 1500`, its 15 minutes is `CLOCK_MIN`, its twelve jobs are the witness's own list, and its strip is the one the OpsBoard renders.
- **It is proven to catch** a changed minute count, an altered verse word, a word of ours set in double quotes, and a stripped teen parent line.

The band baseline was re-derived by `course-band-baseline-write.mjs`: total 465, allFour 291, adultOnly 0.
