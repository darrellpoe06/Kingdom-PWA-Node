# DR-1574: L334 — This I Recall to My Mind

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll334-this-i-recall-to-my-mind.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, 2026-11-19, in a build session: further written summaries of the YouTube conversation behind L330, L331 and L333, on timelines and time, a dead-tree picture of the brain under trauma, hardship as training, the steps of a timeline-correction prayer, and how the speaker prays
**Pairs with:** DR-1567 (L330), DR-1569 (L331), DR-1573 (L333); DR-0098 (teach the Word, do not debate it), DR-0100, DR-0076, DR-1317 (a verse is never spent), DR-0210, DR-0331, DR-1468 / DR-1477

## Context

L330 already says the past is redeemed and not cut out. The later summaries went further into the method: Yahweh perceiving all possible realities, alternate timelines, the heart as a tuning fork, choice as real only because many futures exist, prayer sent into the past to cut an event out with a sword, wash it, replace it and seal the replacement in heavenly gold. They also carried two things the Word plainly affirms: that the speaker asks the Holy Spirit, not his own list, to bring up what needs healing, and that years of being unchosen can become training to comfort others. A fourth lesson was the honest shape: time, memory, and what Yahweh does with a hard past.

## What was measured

| what | measured |
| --- | --- |
| the video | never watched (proxy 403 on YouTube from the sandbox); only the summaries were read |
| who said what | two summaries disagree on which man spoke of being unchosen as training; the lesson says one of the men and leans on neither, and `UNCHECKED` says so |
| verses | 258 tokens filled by `fill-verses.mjs` from `app/public/bible/kjv`, none typed; 0 verse faults |
| length | adult prose 1,271 words |
| points | 7, one per movement, read by `lessonPoints` |
| band shares | child 0.58, youth 0.63, teen 0.76, senior 0.84 (floor 0.5 / 0.6) |
| reading ladder | child 1.6, youth 3.5, teen 4.4, senior 5.3 (child ceiling 5.0) |
| band overlap | worst pair 0.13 (ceiling 0.5) |
| gate | 9 of 9 on the first run; doubled-word guard green |

## Impact

A learner who has prayed to have a day undone is given David, who prayed with everything while the matter was open and afterward looked ahead, and is told the past is kept by Yahweh. A learner with a memory that will not leave is given a method from Lamentations 3: remember honestly, then call the mercies to mind on purpose. One lesson file and one test; no shared catalog, dates or budget line is edited.

## Decision

`ll334-this-i-recall-to-my-mind`, ORDER 334, ADDED 2026-11-19:

1. **Yahweh and time** (Psalms 90:2, 4; 2 Peter 3:8; Isaiah 46:9-10; Psalms 139:16; 31:15). Alternate timelines are named as the speaker's and not taught.
2. **The choice is real** (Deuteronomy 30:19; Joshua 24:15; Galatians 6:7; Proverbs 16:9): commanded, with no theory of many futures.
3. **The past does not reopen, and what is sealed is you** (2 Samuel 12:22-23; Hebrews 9:27; Ecclesiastes 3:15). The sword is the Word (Ephesians 6:17); the Blood purges the conscience (Hebrews 9:14); the believer is sealed (Ephesians 1:13; 4:30). Kept from the speaker's practice: asking the Spirit to search (Psalms 139:23; Romans 8:26; John 16:13).
4. **What you call to mind** (Lamentations 3:19-23; Psalms 77:9-12; Deuteronomy 8:2; Psalms 103:2; Romans 12:2; Philippians 4:8).
5. **The tree** (Jeremiah 17:7-8; John 15:5; 1 Corinthians 12:26). Protector parts are named as a counselling school's words, not Scripture's.
6. **The unchosen** (2 Corinthians 1:3-4; 1 Samuel 16:7, 11; Psalms 118:22; Isaiah 53:3; John 15:16; Hebrews 12:11).
7. **Peter's memory** (Luke 22:61-62; John 21:15, 17): the memory stayed and its meaning changed.

Stated from general knowledge with no study opened, and carried in `UNCHECKED`: that a memory is rebuilt each time it is recalled and coloured by present mood, and that protector and firefighter are terms of a school of counselling. Two parables use invented people (Hawaii, Poland). The quiz has ten questions. The facilitator notes tell the leader not to ask anyone to describe a painful memory before the group.

## Verification

`living-lessons-ll334-this-i-recall-to-my-mind.test.js` runs the shared gate (9 cases) with seven spine spans in the adult lesson and every band. `re-review: 2026-12-18`, with the other three. On merge: PR, squash SHA, deploy run on that SHA, `site-health.yml`. One shared test changed with this lesson: `the-lesson-count-is-derived.test.jsx` required the real catalog to carry at most six unused numbers, which fails any lesson that lands ahead of numbers still reserved by parallel branches (L324-L329 and L332 on 2026-11-19); it now reads whichever branch of the label's own rule the catalog is on.
