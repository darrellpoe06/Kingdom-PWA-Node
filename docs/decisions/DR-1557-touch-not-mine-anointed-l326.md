# DR-1557: L326 — Touch Not Mine Anointed

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll326-touch-not-mine-anointed.js`, its own file per DR-1468)
**Spoken by:** Darrell, in session, with one word above it: Lesson
**Pairs with:** L84 (`ll84-blessed-and-highly-favored-before-during-after-time`), DR-0610, DR-1468 / DR-1477, DR-0098, DR-0210, DR-0331, DR-0076

## Context

On 2026-11-18 Darrell spoke a set of questions into the session as a Lesson (no email; no thread id). What does it mean in the Word to be anointed? How does it show in a life? Who can and who cannot? Does it happen now? What are a prophet and an anointed one, and what does touch not mine anointed mean? And since the adversary works evil into people so subtly it is not seen, in what ways does our King, who is greater, join Himself to us? He also named blessed and being blessed.

One teaching, one lesson: no lesson in the catalog or the per-file lessons is built on anointing (three mention it in passing). Blessed is already taught whole in L84, so this lesson names L84 and does not re-teach it.

His phrasing gave the adversary a royal title next to our King's; the lesson keeps the adversary lowercase and untitled (Layer 0), and renders his words for meaning, never in quotes (DR-0331).

## What was measured

| what | measured |
| --- | --- |
| verses | 113 tokens filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| length | adult 702 prose words |
| band shares | child 0.56, youth 0.67, teen 0.68, senior 0.69 |
| reading ladder | child 1.7, youth 4.3, teen 5.2, senior 6.2 |
| band overlap | worst pair 0.00 (ceiling 0.5) |
| source | Darrell's spoken questions only; no outside source was used, so there is no `UNCHECKED` |

## Impact

A learner gets each question answered from the Word, in order. Anointed means oil poured to set apart priests, kings and prophets, with the Spirit as the substance (Exodus 30:30-32; 1 Samuel 16:13; 1 Kings 19:16). Christ means the Anointed (John 1:41; Luke 4:18; Acts 10:38; Hebrews 1:9). It shows as doing good and as fruit, not as wonders alone (Galatians 5:22-23; Matthew 7:22-23; 24:24). Who can and who cannot is answered by the door, not a count (Acts 2:38-39; Luke 11:13; Acts 5:32; John 14:17; Romans 8:9; Acts 8:20; 1 Samuel 16:14). It is now (2 Corinthians 1:21-22; 1 John 2:20, 27; James 5:14). The two methods: the serpent's subtlety (Genesis 3:1; 2 Corinthians 11:3, 14; Ephesians 2:2) against His indwelling (Ezekiel 36:26-27; John 14:17; 1 Corinthians 6:19; Ephesians 1:13; 1 John 4:4). Touch not mine anointed is read in its place: it is spoken of the patriarchs (Psalms 105:9-15; 1 Chronicles 16:22), David honoured it toward Saul (1 Samuel 26:9), and Nathan still rebuked the anointed David (2 Samuel 12:7). A prophet speaks what Yahweh puts in his mouth (Deuteronomy 18:18, 22; 2 Peter 1:21; 1 Corinthians 14:3; Numbers 11:29). Content only.

## Decision

`ll326-touch-not-mine-anointed`, ORDER 326, ADDED 2026-11-18, anchored on 1 John 2:27, Word first, with the sections above. Two parables with invented people (a lamp in Accra never plugged in; a well in the Andes poisoned slowly and healed from a new spring), and a ten-question quiz.

## Verification

`living-lessons-ll326-touch-not-mine-anointed.test.js`: the shared gate (DR-1477) with 7 spine spans, one for each question, in the adult lesson and every band, plus three lesson cases: every question has its heading; touch not mine anointed cites Psalms 105:15, 1 Samuel 26:9 and 2 Samuel 12:7; blessed points to L84. The gate caught two faults in the first draft (LORD in a quiz option in our voice; three bands below their share floors), and both were fixed before commit.
