# DR-1391: L295 — The Bleating of the Sheep: following in name and not in deed, the understanding only the whole can give, and what it costs the one who leads

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (app/src/lib/living-lessons-class.js, living-lessons-dates.js)
**Sent in by:** Darrell — a spoken teaching, 2026-11-10
**Pairs with:** DR-1387 (L292, the same day), DR-0098 (teach the Word), DR-0100 (state established findings plainly), DR-0076 (every verse fetched), DR-0210 (Yahweh in our voice), DR-0331 (his words rendered for meaning)

## Context

Two messages, 2026-11-10, Word first: family who say they follow while the record proves otherwise, who do part and overwork the rest, a leader with more than twenty years of results; then the leader’s side, the gaslighting, the feelings, the brain, the effect on both, the joy of one who truly follows, and how to manage.

## What was measured

34 anchors; adult 2,113 words; bands 0.54/0.63/0.63/0.63; grades 2.9/3.8/5.0/5.8/5.7. No ellipsis in a quotation, no DR id, no percentage, no generic God in our voice, adversary lowercase.

## Impact

**What this obligates.** The lesson is in the catalog for every reader at every band from the day it was spoken. Its gate keeps every quoted verse word for word against the KJV on disk and keeps its spine in every band, so a later edit cannot quietly drop or alter the Word. No schema, no money, no new surface.

## Decision

L295, `ll295-the-bleating-of-the-sheep`. Saul and the sheep (1 Samuel 15:13-14, 20); why call ye me Lord (Luke 6:46; Matthew 15:8; James 2:10); doing the whole is how you understand (John 7:17; John 14:15, 21); Naaman and the pattern (2 Kings 5:10-14; Hebrews 8:5; Deuteronomy 12:32; Exodus 39:42-43); a proven leader (1 Corinthians 11:1; Hebrews 13:17; Luke 2:51-52); what the leader goes through (Exodus 17:4; Numbers 11:11, 14:4; Galatians 4:16; Isaiah 5:20) with research named: Paige Sweet (2019) on gaslighting, Eisenberger, Lieberman and Williams (2003) on rejection as pain, Maslach on burnout; the follower (Festinger, 1957); they ran well at first (Galatians 5:7; Revelation 2:4-5); a true follower (Ruth 1:16; Philippians 2:19-22; 3 John 1:4); how to bear it (Psalms 61:2; 2 Corinthians 4:8-9; Matthew 26:40). Headings never put “LORD” in our voice.

His words are rendered for meaning and never put in double quotes; every double-quoted span is Scripture with its reference, fetched from `app/public/bible/kjv`. Two parables with invented people. Eight exam questions. All three talk directions in the lesson and every band.

## Verification

- `living-lessons-ll295-*.test.js`: generated from L292’s gate (same helpers, same measures), with this lesson’s own spine pinned verbatim, its key verses required in every text, and proofs that catch a dropped spine verse, an altered word, a capitalized mid-verse span, and a stripped youth friend line.
- `living-lessons-order.test.jsx` pin stays 2026-11-10, now naming L295; voice fixture regenerated; catalog budget raised to its measured 31,350 lines.
