# DR-1394: L293 — One Thing Is Needful: obeying what was asked, the few words that matter most, longsuffering, and when it is enough

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (app/src/lib/living-lessons-class.js, living-lessons-dates.js)
**Sent in by:** Darrell — a spoken teaching, 2026-11-10
**Pairs with:** DR-1387 (L292, the same day), DR-0098 (teach the Word), DR-0100 (state established findings plainly), DR-0076 (every verse fetched), DR-0210 (Yahweh in our voice), DR-0331 (his words rendered for meaning)

## Context

Three long messages, 2026-11-10, closed in Jesus’ name: humble yourself to exactly what was said; Yahweh wrote it down and competence is proved by doing; looking at the same words without learning them; the critical path, the five out of every hundred that matter; deeds prove it; grace without losing integrity; agreement only on what the other can see; people who cannot be contracted or covenanted; hard work on what was not asked; longsuffering, when it is enough, Yahweh’s position, the cost to spirit, soul and body, and rest while staying.

## What was measured

44 anchors; adult 2,359 words; bands 0.52/0.61/0.63/0.70; grades 2.8/3.2/3.8/4.5/5.2. No ellipsis in a quotation, no DR id, no percentage, no generic God in our voice, adversary lowercase.

## Impact

**What this obligates.** The lesson is in the catalog for every reader at every band from the day it was spoken. Its gate keeps every quoted verse word for word against the KJV on disk and keeps its spine in every band, so a later edit cannot quietly drop or alter the Word. No schema, no money, no new surface.

## Decision

L293, `ll293-one-thing-is-needful`, after L292. Sections: written plain (Habakkuk 2:2; Deuteronomy 29:29); to obey is better than sacrifice (1 Samuel 15:22); looking without learning (2 Timothy 3:7; John 5:39-40); one thing is needful (Luke 10:40-42; Matthew 22:37-40; Ecclesiastes 12:13; Micah 6:8); deeds prove it (Matthew 21:28-31; James 2:18; Matthew 7:22-27); agreement and the hard part (Amos 3:3; Psalms 15:4; Proverbs 25:19); longsuffering, His and ours (Exodus 34:6; 2 Peter 3:9); when it is enough (Genesis 6:3; Romans 12:18; Proverbs 9:8; Matthew 10:14), with marriage and the care of one’s own kept under the Word; the cost (1 Thessalonians 5:23; Exodus 18:17-18); rest while bearing (Matthew 11:28-30; Mark 6:31). His “5%” is rendered “five out of every hundred” (no percentages in a lesson); his “when is enough enough” as “when it is enough” (the doubled-word rule).

His words are rendered for meaning and never put in double quotes; every double-quoted span is Scripture with its reference, fetched from `app/public/bible/kjv`. Two parables with invented people. Eight exam questions. All three talk directions in the lesson and every band.

## Verification

- `living-lessons-ll293-*.test.js`: generated from L292’s gate (same helpers, same measures), with this lesson’s own spine pinned verbatim, its key verses required in every text, and proofs that catch a dropped spine verse, an altered word, a capitalized mid-verse span, and a stripped youth friend line.
- `living-lessons-order.test.jsx` pin stays 2026-11-10, now naming L295; voice fixture regenerated; catalog budget raised to its measured 31,350 lines.
