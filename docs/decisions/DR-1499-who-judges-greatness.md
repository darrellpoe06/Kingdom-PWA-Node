# DR-1499: L317 — Who Judges Greatness

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll317-who-judges-greatness.js`, its own file per DR-1468)
**Forwarded by:** Darrell, one Big Think essay, with one word above it: Lessons (plural)
**Pairs with:** DR-1492 (L314, the first teaching from the same forward), DR-0610 (one teaching, one lesson), DR-1285 / DR-1317 (one source, two landings), DR-1468 / DR-1477, DR-0098, DR-0100, DR-0076, DR-0331

## Context

Darrell forwarded Big Think's essay by Anna Gát, George Lucas spent 17 years building his latest world (2026-11-10), into the app on 2026-11-10 at 17:30:05 UTC, 11:30 AM Central (Gmail thread `1a1c68295f781bbb`), with one word above it, Lessons, in the plural; rendered, never quoted. DR-1492 built the first teaching as L314 and named the second as a candidate: the crowd, voting with its money, as the judge of greatness. This record builds that second teaching. new-lesson.mjs reserved L317 (L311 to L316 were held by other sessions).

**Two teachings, one forward (DR-0610 is one TEACHING one lesson, never one SOURCE one lesson).** Measured against L314 on its branch (`claude/lesson-ll314`): anchor verses 59 against 61, **1 shared** (John 1:29, the Lamb, which closes nearly every lesson); shared chapters 1 Corinthians 4, Matthew 6, Exodus 31, John 15, John 1, each on a different verse. The landings differ: L314 answers the essay's opening questions (will my work live on, will my children keep good values, have I done my duty) through Solomon, names in stone and the city whose Builder is Yahweh; L317 answers its closing claim (the public, voting with its dollars, knows best; the collection ranked by what resonates) with who judges (Luke 16:15) and what greatness is (Mark 10:43-45). Title openings differ (will my work / who judges greatness). The pair is recorded in `scripts/one-thread-one-record-guard.mjs` KNOWN_SHARED_THREADS. Whether the two should be one lesson is Darrell's call.

## What was measured

| what | measured |
| --- | --- |
| verses | 59 anchor verses (47 references); 129 tokens filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults; 0 double-quoted spans without a reference |
| length | adult 1,877 prose words; child 972 |
| band shares | child 0.52, youth 0.62, teen 0.62, senior 0.63 |
| reading ladder | child 2.1, youth 4.7, teen 5.2, senior 7.0 |
| band overlap | worst pair 0.05 (ceiling 0.5) |
| essay, tiered | the writer's reading, reported by Big Think: the founders seem to declare the public, voting with its dollars, knows best; the collection ranks by what resonates; the crowds made the filmmaker; her closing question whether he won. No verdict on any heart |
| not read | bigthink.com refused this session (proxy 403 on CONNECT); `re-review: 2026-11-27` |
| PoeTech, measured | no per-lesson opens recorded, only the tab (`app/src/lib/lessons-walked.js:14-15`); Learn sorts have no popularity sort (`app/src/lib/learn-organize.js:196-221`); Youth Zone has no leaderboard by design (`app/src/lib/youth-zone.js:22`); The Word — Migdal offers Most reacted and Most viewed (YouTube) beside Newest, the default (`app/src/components/Pulpit.jsx:351,356`); shared-link opens are counted so links can be checked (`app/src/lib/lesson-share-record.js:5-21`) |

## Impact

A learner meets the claim that the crowd decides greatness answered Word first (DR-0098): two human courts, critic and crowd, both set aside (Luke 16:13-15; 1 Samuel 16:7); the multitude's record (Exodus 23:2; 32:1; 1 Samuel 15:24; Acts 12:22-23); Hosanna, then Crucify (Matthew 21:9; 27:20-23; Mark 15:15); the stone the builders refused (Psalms 118:22; Acts 4:11); greatness as service (Mark 10:42-45). Not against skill or an audience (Psalms 33:3; Exodus 31:6; Mark 12:37). Applied to a household, a church and PoeTech, with the one popularity sort named plainly. Content only.

## Decision

`ll317-who-judges-greatness`, ORDER 317, ADDED 2026-11-13, Word first: two courts of men; the crowd is not the judge; Hosanna and Crucify, and the crown He refused (John 6:15; 5:41); the rejected stone and the Father's verdict first (Matthew 3:17; Philippians 2:9); the many and the few (Matthew 7:13-14; Luke 6:26; John 6:66-68); the praise of men (John 12:43; Galatians 1:10; John 5:44); skill and audience rightly placed; what greatness is (Luke 22:27; John 13:15; John 3:30); by their fruits (Matthew 7:20). Two parables with invented people (Guadalajara, Nairobi); a ten-question quiz.

## Verification

`living-lessons-ll317-who-judges-greatness.test.js`: 14 cases on the shared gate (DR-1477) with 9 spine spans in every text, plus four dangers, each proven to catch with a planted defect: the essay's claim stated as our verdict; drift into anti-art (adult drops a verse that honours skill, or a band never names skill); a PoeTech fact whose cited file and line no longer say it, or a citation the test does not pin; the thread id or the link to L314 dropped. `export const UNCHECKED` names what was not read back. `re-review: 2026-11-27`: try bigthink.com again.
