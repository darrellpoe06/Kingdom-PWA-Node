# DR-1582: L336 — The Lie, the Fear, and the Last Adam

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll336-the-lie-the-fear-and-the-last-adam.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, 2026-11-19, in a build session: a YouTube link to a short talk by a psychiatrist on the nature of sin, the one word Lesson, and a written summary of it (sin as broken trust, design law against human law, an inherited nature, Jesus as the second Adam)
**Pairs with:** DR-0098 (teach the Word, do not debate it), DR-0100 (the Word corrects the over-reach; the true part stands), DR-0076, DR-0210, DR-1468 / DR-1477, DR-1580

## Context

As summarized, the talk says sin is not chiefly rule-breaking but a collapse of trust after a lie is believed, that fear then drives a person, that the state is inherited, and that Jesus cleansed humanity's spirit by trusting the Father through the cross. Much of that is the Word's own account of Genesis 3. One part is an over-reach the Word corrects: the summary treats law as a human construct and describes the cross without sin-bearing or blood. The lesson teaches both halves from the Word and names the speaker's claims as reported (the third tier of DR-0100).

## What was measured

| what | measured |
| --- | --- |
| the video | never watched (proxy refuses YouTube from the sandbox); only the summary was read; the speaker is not named in it and is not named in the lesson |
| verses | 294 kjv tokens filled by `fill-verses.mjs` from `app/public/bible/kjv`, none typed; 0 verse faults |
| length | adult prose 1,030 words |
| points | 7, one per movement, read by `lessonPoints` |
| band shares | child 0.73, youth 0.70, teen 0.71, senior 0.73 (floor 0.5 / 0.6) |
| reading ladder | child 1.2, youth 2.6, teen 3.8, senior 5.6 (child ceiling 5.0) |
| band overlap | worst pair 0.17 (ceiling 0.5) |
| gate | 9 of 9 on the first run; title, doubled-word, American spelling, plain-meaning, hollow-surface and format guards green before the first push |

## Impact

A learner who hides from Yahweh after doing wrong is shown where hiding began and is given 1 John 1:9. A learner who has heard sin described only as sickness is given the Word's definition and the Blood. One lesson file and one test; no shared catalog, dates or budget line is edited.

## Decision

`ll336-the-lie-the-fear-and-the-last-adam`, ORDER 336, ADDED 2026-11-19, seven movements:

1. **It began with a lie** (Genesis 2:17; 3:1, 4-6; John 8:44; Romans 14:23; Hebrews 11:6). Affirmed: distrust came before the deed.
2. **Fear came in** (Genesis 3:8-10; Hebrews 2:15; Romans 8:15; 2 Timothy 1:7). Affirmed.
3. **Sin is also a broken law** (1 John 3:4; Romans 7:12; 3:19, 23; 6:23), and that law is love (Matthew 22:37, 40; Romans 13:10). Corrected: the law is Yahweh's, not man's.
4. **We are born into it** (Romans 5:12, 18; Psalms 51:5; Ephesians 2:3; Romans 3:20). Affirmed, with the verdict added to the sickness.
5. **The last Adam trusted** (Hebrews 4:15; Matthew 26:39; 1 Peter 2:23; Luke 23:46; Romans 5:19; 1 Corinthians 15:22, 45). Affirmed.
6. **What the Blood did** (1 Peter 2:24; Isaiah 53:5-6; 2 Corinthians 5:21; Hebrews 9:22; Romans 3:25; 5:9; Ephesians 1:7; Hebrews 2:14; 1 John 4:10), received by faith (John 1:12; 3:16). Corrected: sin was borne and remitted by Blood, and it is not applied to the race apart from believing.
7. **From fear back to trust** (Romans 5:1; 8:1; Ezekiel 36:26; Hebrews 10:16; 2 Corinthians 5:17; 1 John 4:18-19; John 8:32; Psalms 56:3; Proverbs 3:5; 1 John 1:9).

No claim about health or the brain is made. Two parables use invented people (Peru, Ghana); the second holds both halves, a debt paid and a friend walked back. Ten quiz questions. The facilitator notes say not to ask anyone to name a sin aloud.

## Verification

`living-lessons-ll336-the-lie-the-fear-and-the-last-adam.test.js` runs the shared gate with seven spine spans in the adult lesson and every band. `re-review: 2026-12-19`. On merge: PR, squash SHA, deploy run on that SHA, `site-health.yml`. The branch also carries the DR-1580 lane files; they merge away when #2794 lands.
