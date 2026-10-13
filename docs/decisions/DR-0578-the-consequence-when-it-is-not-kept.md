# DR-0578 — The consequence when it is not kept: a lesson may not name a consequence the Word is not quoted for

- **Status:** accepted
- **Tier:** A
- **Type:** fix (content + gate)
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/history-course.js` (lesson 1: the consequence stated from Judges 2:11-14, Hosea 4:6, Deuteronomy 8:19 and Psalms 78:8 in the benefit, all three bands, the anchor, the quiz and the facilitator notes); `app/src/lib/learn-crosslist.js` (the measured anchor count, 39 → 41); `app/src/__tests__/history-course.test.js` (four new checks, one a course-wide gate)
- **Principles:** DR-0098 (teach the Word; where the Word speaks, say what it says), DR-0100 (state the consequence plainly), DR-0076 (every verse fetched verbatim from the repo's KJV), DR-0572
- **Grounds:** Darrell, 2026-09-23, reading lesson 1 on his Fold at the benefit *"the command to tell the children is a command with a consequence attached when it is not kept"*: **"Seems short! What's the consequence when it's not kept?!!!!!!!"**

---

## The defect

The lesson said a consequence existed and never said what it was. Every band taught Judges 2:10 as *"a generation nobody told"* and stopped there, as if the untold generation merely knew less. The Word does not stop there, and a lesson that names a consequence without quoting it is a claim with no verse under it — the same class DR-0076 forbids for system claims, applied to the Word.

## What the Word says, now in the lesson

Fetched verbatim from `app/public/bible/kjv`:

- **Judges 2:11** — the untold generation *"did evil in the sight of the LORD, and served baalim"*.
- **Judges 2:12** — they *"followed other gods, of the gods of the people that were round about them"*.
- **Judges 2:14** — *"he delivered them into the hands of spoilers that spoiled them"*.
- **Hosea 4:6** — *"My people are destroyed for lack of knowledge"* and *"seeing thou hast forgotten the law of thy God, I will also forget thy children"*.
- **Deuteronomy 8:19** — *"if thou do at all forget the LORD thy God, and walk after other gods, and serve them, and worship them, I testify against you this day that ye shall surely perish"*.
- **Psalms 78:8** — the telling is commanded so that the children *"might not be as their fathers, a stubborn and rebellious generation"*.

Taught as cause and effect, in our voice: a record left untold becomes, within one generation, a people who serve what their neighbors serve and are ruled by whoever is strongest; the forgetting runs downhill through the children; the telling is what prevents it. The benefit now quotes it; the teen band says it in short sentences and sends the reader to read the verses with the family; the senior band names the mechanism and says *teach it as cause and effect, not as a threat*; the quiz asks it; the anchor carries the references.

## The gate

Four checks. The benefit that says "consequence" quotes Judges 2:11, 2:14 and Hosea 4:6; every band carries the verbatim Judges 2:11 span and the Hosea reach to the children; the anchor and quiz carry it. And course-wide: **no paragraph in any lesson may say "consequence" without a Scripture reference in that paragraph.** The existing gates hold unchanged: every quoted span walks against the KJV, no elision, "the LORD" only inside quotes, the teen band under grade 6.0 and at least 0.6 of the adult text, no near-copy between bands, American spelling, plain words.

## Limits

- "Seems short" was also read as a length remark. Lesson 1 gained a paragraph in each band; the other seven lessons were not lengthened. Whether the eight lessons are the right depth for the department is the DR-0572 re-review (2026-10-07).
