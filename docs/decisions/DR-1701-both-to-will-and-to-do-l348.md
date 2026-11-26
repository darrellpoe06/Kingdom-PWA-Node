# DR-1701: L348 — Both to Will and to Do

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll348-both-to-will-and-to-do-his-will-our-way-and-the-brightness.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, 2026-11-26, a spoken question and prayer in this session, ending with the word Lesson.
**Pairs with:** CLAUDE.md "Spoken Teachings Are Build Input", DR-0076, DR-0098 (teach, don't debate), DR-0210, DR-0331, DR-0610, DR-1468 / DR-1477, DR-1698 and DR-1700 (the same day)

## Context

His question, rendered: can anybody change the future? Does being around, or doing, certain things make it brighter or dimmer, or does Yahweh's will decide the brightness, period? He believes a deterministic design does both: using the Word makes your way better and the opposite makes it worse; people can use His principles without knowing Him and without credit, not knowing their skills are His Spirit's gifts; He gives a new heart and spirit to the one who comes; He planned us before the foundation of the world, and we were broken before we came. How does all of this work?

One teaching, one lesson (DR-0610): `one-teaching-one-lesson-guard` finds no pair. Taught as the Word holds it, both halves in one breath (Philippians 2:12-13), never as a contest between schools (DR-0098); where the text is reticent about how the two fit, the lesson stops (Deuteronomy 29:29).

## What was measured

| what | measured |
| --- | --- |
| the source | his spoken words, read in full; rendered for meaning, never quoted |
| verses | 153 quoted spans, every one filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults |
| length | adult prose 988 words |
| band shares | child 0.56, youth 0.64, teen 0.64, senior 0.72 (first build: child 0.49, youth 0.54, teen 0.55; each gained a taught section) |
| reading ladder | child 1.2, youth 2.9, teen 6.2, senior 6.6 |
| band overlap | worst pair 0.03 (ceiling 0.5) |
| UNCHECKED | no claim outside Scripture and his words (`re-review: 2026-12-10`) |

## Impact

A reader asking whether the future is fixed or chosen is given the Word's own answer: His counsel came first, the choice is real, the future answers turning and prayer, both stand together, every skill is His gift whether or not it is thanked, the new heart is His alone, and the path of the just keeps brightening. One lesson file and its test; no shared behavior changed.

## Decision

`ll348-both-to-will-and-to-do-his-will-our-way-and-the-brightness`, ORDER 348, ADDED 2026-11-26, eight movements (the anchor theme lists every reference):

1. **He wrote the book before the first day** (Ephesians 1:4; Jeremiah 1:5; Psalms 139:16; Isaiah 46:10; Ephesians 2:10; Colossians 1:17).
2. **And He set the choice before you** (Deuteronomy 30:19; Joshua 1:8, his make your way; Galatians 6:7-8; Proverbs 13:20; Psalms 1:3).
3. **The future answers turning and prayer** (Jeremiah 18:8, 10; Jonah 3:10; 2 Kings 20:5-6; James 4:2).
4. **Both at once** (Philippians 2:12-13; Proverbs 16:9; Proverbs 19:21; Acts 2:23; Genesis 50:20; Romans 8:28).
5. **The principles work for anyone, and the gift is still His** (Matthew 5:45; Romans 2:14-15; Exodus 31:3; James 1:17; Daniel 2:21; Deuteronomy 8:18; 1 Corinthians 4:7; Romans 1:21; Acts 17:28).
6. **Broken before we came, and made new** (Romans 3:23; Romans 5:8; Ephesians 2:5; Ezekiel 36:26; 2 Corinthians 5:17).
7. **Where the Word stops** (Deuteronomy 29:29; Romans 11:33; Isaiah 55:9; James 4:15).
8. **Brighter and brighter** (Proverbs 4:18; Jeremiah 29:11; John 1:29; John 3:16; Hebrews 1:8).

All five bands close with TALK ABOUT IT TOGETHER, THIS WEEK and a prayer. Two parables with invented people (two gardens on one street; a weaver in Kumasi). Ten quiz questions.

**Relationships collection:** judged and left off the current hand-picked shelf (marriage, love, family, friendship): this lesson is about relating to Yahweh, not to people. Under DR-1694's broader definition (relating in every direction, with Yahweh first) it qualifies; whichever of DR-1694 or this lands second adds it there. **Cover:** none bought; the department's approved interim cover (DR-1666) until the next approved library batch.

## Verification

`living-lessons-ll348-both-to-will-and-to-do-his-will-our-way-and-the-brightness.test.js` (9 cases): the shared gate with eight spine spans (Philippians 2:13, Ephesians 1:4, Deuteronomy 30:19, Galatians 6:7, Proverbs 16:9, James 1:17, Deuteronomy 29:29, Proverbs 4:18) in the adult lesson and every band; every quotation verbatim; Yahweh in our voice; no bare double quotes; talk-together directions; band shares, ladder and overlap; two parables and ten questions. First run caught two bands citing a spine verse without quoting it and three short bands; each fixed.

`re-review: 2026-12-10`
