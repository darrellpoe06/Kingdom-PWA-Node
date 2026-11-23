# DR-1616: L341 — Whoso Removeth Stones

**Date:** 2026-11-23
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll341-whoso-removeth-stones.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, a technology newsletter (the issue of 2026-11-23) forwarded with the one word Lesson. Gmail thread `1a208fb97b576d51`
**Pairs with:** DR-0076, DR-0098, DR-0100 (the report stated as reported, the denied link held as not established), DR-0107 / DR-0125 (the house example), DR-0210, DR-0610, DR-1468 / DR-1477, DR-1572 (sov97, the same outage)

## Context

The newsletter's lead: the air traffic outage of a Friday in November, its reported cause (a faulty router in one state; switches and routers overloaded with data, giving inconsistent data; the system shut down because of it), an online link to a new A.I. system that officials denied, and its advice to test and keep an update plan. Its word of the week was business continuity. Not a personal email; no official is named.

One teaching, one lesson (DR-0610). `lesson-already-built.mjs --thread`: a source-name match only. **sov97** (DR-1572, The Staff of This Broken Reed) already teaches this same outage as leaning on one system; **sov85** owns the storm runbook and Joseph's plan; the **Maintenance and Trades** course anchors on Ecclesiastes 10:18, 10 (the cost of neglect). This lesson takes what the reported cause adds: the danger in the change itself (Ecclesiastes 10:9, in no lesson before), the cascade, and the honest stop when the readings disagree. Joseph is quoted in one line and named as taught elsewhere. Left out: the platform-teams item, the traffic record, and vendor accountability (it did not serve the one teaching). The sibling thread `1a208f5960ac285d` (patching a Java flaw) is its own lesson; patching is not taught here. Placed in Living Lessons: the teaching is stewardship of change, with technology as the occasion.

## What was measured

| what | measured |
| --- | --- |
| the source | one newsletter, read in full; the outage, its cause and the denial are REPORTED by it alone; the press conference and any investigators' finding were not read back (UNCHECKED, `re-review: 2026-12-07`) |
| the A.I. link | NOT ESTABLISHED: raised online, denied by officials; the lesson neither confirms nor rules it out |
| the house | MEASURED (records): `LESSONS-LEARNED.md` P26 (2026-07-06, site stale ~9 hours after the merge-lane change); `.github/workflows/site-health.yml` dispatches a deploy when the site is STALE; `app/src/lib/site-health.js` feeds the OpsBoard Uptime strip. The test reads each back |
| verses | 107 quoted spans filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults |
| length | adult prose 1,272 words |
| band shares | child 0.53, youth 0.63, teen 0.66, senior 0.75 (first build: child 0.46, youth 0.52, teen 0.56; each gained taught paragraphs) |
| reading ladder | child 1.7, youth 3.6, teen 4.3, senior 7.4 |
| band overlap | worst pair 0.03 (ceiling 0.5) |

## Impact

A reader who saw the flights stop is given the Word's order for changing what people depend on: respect the danger in the change, watch the small part that carries a great load, stop when the witnesses disagree, prove it before you change it, and write the plan on a calm day. The house section tells this app's own outage plainly. One lesson file and one test; no shared line edited.

## Decision

`ll341-whoso-removeth-stones`, ORDER 341, ADDED 2026-11-23, eight movements:

1. **The danger is in the change** (Ecclesiastes 10:9; 10:10 named as the trades course's anchor).
2. **What was reported, kept at its weight** (Proverbs 14:15; Proverbs 18:17).
3. **A little fire, a great matter** (James 3:5; Luke 16:10; Exodus 18:18).
4. **When the witnesses do not agree, stop** (Deuteronomy 19:15; Mark 14:56; Proverbs 20:10; Proverbs 18:13).
5. **Prove it before you change it** (1 Thessalonians 5:21; Nehemiah 2:15; Nehemiah 4:17; Proverbs 27:23).
6. **The plan written before the storm** (Proverbs 22:3; Proverbs 24:27; Luke 14:28; Genesis 41:36).
7. **Our own house moved stones** (the 2026-07-06 stale site and the outside witness).
8. **The One by whom all things consist** (Psalms 121:4; Colossians 1:17; John 1:29; John 3:16; Hebrews 1:8).

Two parables with invented people (Mexico, Ghana). Ten quiz questions. `re-review: 2026-12-07`: read the investigators' finding and correct the tiers here and in sov97 from what is published.

## Verification

`living-lessons-ll341-whoso-removeth-stones.test.js` (14 cases): the shared gate with five spine spans (Ecclesiastes 10:9, James 3:5, Deuteronomy 19:15, 1 Thessalonians 5:21, Proverbs 22:3) in the adult lesson and every band; every place marks the report as reported and the A.I. link as denied and not established; no official, newsletter brand or thread id printed; the earlier lessons named; the house claims read back from LESSONS-LEARNED and site-health. **Proven-to-catch:** an unreported account, a dropped denial and a named official each fail. Title, anchor-named, American-spelling, course-band and quoted-verse suites pass; 139 shared-verse suites (5,344 tests) pass; the record-length guard is clean.
