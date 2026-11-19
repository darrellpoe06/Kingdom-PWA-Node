# DR-1581: L335 — Not Done in a Corner

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll335-not-done-in-a-corner.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, 2026-11-19, in a build session: a YouTube link to a discussion of Gary Habermas's lecture on the historical data for the Resurrection (the minimal-facts method), the one word Lesson, and written summaries of it, with follow-ups on Galatians, on James, on the phrase according to the scriptures, and on the eleven sources for the crucifixion
**Pairs with:** DR-0098 (teach the Word, do not debate it), DR-0100, DR-0076, DR-0210, DR-1468 / DR-1477, DR-1580 (a landed number is not a skip)

## Context

The lecture argues from what scholars of every kind are said to concede, setting aside whether the Word is inspired. This platform does not teach that way round: man-agreement gets no vote over the Word (DR-0098). But the passages the lecture reads are the Word's own, and they say plainly who saw the risen Jesus, that the witnesses could be asked, and that an unbelieving brother was changed. The honest shape was a lesson on the Word's own witnesses, with the lecture's counts and dates named as reported.

## What was measured

| what | measured |
| --- | --- |
| the video | never watched (proxy refuses YouTube from the sandbox); only the summaries were read |
| verses | every quotation a kjv token filled by `fill-verses.mjs` from `app/public/bible/kjv`, none typed; 0 verse faults in `quoted-verse-is-the-verse.test.js` |
| length | adult prose 1,241 words |
| points | 8, one per movement, read by `lessonPoints` |
| band shares | child 0.61, youth 0.68, teen 0.63, senior 0.69 (floor 0.5 / 0.6); the first run failed here at child 0.40 and both short bands were lengthened |
| reading ladder | child 1.2, youth 3.3, teen 4.3, senior 5.5 (child ceiling 5.0) |
| band overlap | worst pair 0.12 (ceiling 0.5) |
| gate | 9 of 9; title-in-narrative, doubled-word, American spelling, plain-meaning and hollow-surface guards green before the first push |

## Impact

A learner asked why they believe is given the witnesses by name instead of a feeling. A learner praying for a relation who does not believe is given James. One lesson file and one test; no shared catalog, dates or budget line is edited.

## Decision

`ll335-not-done-in-a-corner`, ORDER 335, ADDED 2026-11-19, eight movements:

1. **The Word asks to be checked** (Acts 26:26; Luke 1:2-4; Deuteronomy 19:15; Acts 17:11).
2. **What was handed on first** (1 Corinthians 15:3-6), with the scriptures the short word points to opened, which the lecture leaves closed (Luke 24:46; Isaiah 53:5; Psalms 16:10; Acts 2:31).
3. **Paul checked his message** (Galatians 1:11-12, 18-19; 2:2, 9; 1 Corinthians 15:11).
4. **The death was real** (John 19:35). The historian's two-source rule is set beside the rule Yahweh gave first.
5. **They saw Him**, and had to be convinced (Acts 2:32; 4:20; 1 John 1:1; Luke 24:11, 39; Acts 10:41; 1:3; Matthew 28:17; John 20:25, 27).
6. **The brother who did not believe** (Mark 3:21, 31; John 7:5; 1 Corinthians 15:7; Acts 1:14; 15:13; James 1:1).
7. **The enemy who turned** (Acts 9:4-5; 1 Corinthians 15:8-9).
8. **What it means if it is true** (1 Corinthians 15:14, 17, 20; Romans 1:4; Revelation 1:18; John 20:29, 31; Romans 10:9; 1 Peter 3:15).

Carried in `UNCHECKED` as reported and unopened: the genre claim, the dating of the 1 Corinthians 15 wording and its two-stanza shape, Paul's dates, Ehrman's eleven sources, Maier's two-source saying, the 95 percent figure, and that James died for his faith. The Word does not record the death of James the Lord's brother, so the lesson does not say it. Two parables use invented people (Samoa, Romania). Ten quiz questions.

## Verification

`living-lessons-ll335-not-done-in-a-corner.test.js` runs the shared gate with seven spine spans in the adult lesson and every band. `re-review: 2026-12-19`. On merge: PR, squash SHA, deploy run on that SHA, `site-health.yml`. The branch also carries the DR-1580 lane files so a number landing on main mid-flight does not turn it red; they merge away when #2794 lands.
