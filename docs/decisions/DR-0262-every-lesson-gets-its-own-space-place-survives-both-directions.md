---
id: DR-0262
title: Every Learn lesson opens in its OWN space — the reader's place survives in both directions
status: accepted
date: 2026-08-02
tier: A
declared_by: Darrell
supersedes: the scroll-jump behavior of the 2026-07-15 title index (the index itself stays)
builds_on: [the 2026-07-30 resume-your-place build (learn-resume.js), DR-0201 (Inline No Jumping), DR-0079 (one source of truth for the journey), DR-0076 (verification doctrine), DR-0219 (SHOULD/ARE)]
principles: [EXCELLENCE-STANDARD, COMMUNITY-FIRST (elderly, tech-novice readers), VERIFICATION-DOCTRINE]
---

## Context

Darrell, 2026-08-02, with four Learn screenshots:

> "Learn lessons are amazing however each one I believe needs a space that
> dont allow for loosing your place... the system sets up the reader to lose
> their places."

## The SHOULD/ARE (DR-0219)

**SHOULD:** a reader in a 70-lesson self-paced course can read one lesson,
wander, come back, and be where they were — without skill.

**ARE (traced, `ChurchLearn.jsx`):** every lesson rendered IN FULL in one
stacked `<ol>` — Living Lessons alone is ~70 full cards in a single scroll.
The title index (2026-07-15) and the resume banner (2026-07-30) both ended in
`scrollIntoView` — a *jump within the ocean*, not a place. Any wander, tab
restore, font-size change, or reload dropped the reader back into the full
scroll. The 2026-07-30 resume build fixed re-ENTRY; it could not fix the
reading surface itself. The system really did set the reader up to lose their
place — the structure, not the reader, was the fault (his words were the
correct diagnosis).

## Decision

**A tapped lesson opens ALONE, in its own contained space:**

1. Only that lesson's card renders; the 70-lesson stack and the title index
   leave the tree entirely.
2. The space carries a **sticky bar**: "← All lessons" (the way back),
   "Lesson N of M" (where you are), and **Prev/Next** (one lesson at a time).
3. The **device Back button exits the space** — `useHistoryValue` composes
   one history entry with the app's nav spine, so Back never throws the
   reader out of Learn entirely.
4. Returning to the index scrolls the list to the lesson just left — the
   place survives in BOTH directions.
5. **Opening the space records the resume place** (learn-resume.js), so even
   a reload is one "Resume →" tap from the same lesson; the resume banner now
   lands IN the space with the lesson's guide open, not at a scroll offset.

## Verification

`learn-lesson-space.test.jsx` pins the contract end-to-end (one card only,
index gone, bar present, Next/Prev move and record, back restores the index,
Resume lands contained with the guide open); the 2026-07-30
`learn-resume-render` contract runs unchanged beside it. Full suite + lint
green before merge; the on-device feel pass is Darrell's, on the next build.

## Opportunities carried (dated)

- Per-lesson SCROLL offset (within a long lesson) is not yet persisted — the
  space makes lessons short enough that the lesson start is the honest
  anchor; revisit with the reading-progress ("% read") idea —
  re-review: 2026-08-16.
- The same one-long-scroll shape exists in other stacked surfaces (Scripture
  themed library, Godhead studies) — apply the space pattern where a reader
  reports the same loss — re-review: 2026-08-16.
