# DR-1463: L303 — What Good Is: being good and doing good are one

**Date:** 2026-11-13
**Status:** Accepted (renumbered from DR-1462 the same day, after main took DR-1461 for the 0319 smoke record)
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons-class.js`, `living-lessons-dates.js`)
**Spoken by:** Darrell, 2026-11-13, the same day as L302
**Pairs with:** DR-1462 (L302, the standard that survives every age), DR-0098, DR-0100, DR-0076, DR-0331, DR-0210

## Context

Darrell asked for a lesson that defines good, from the Word first. He saw that the popular saying contradicts itself. The saying is that evil triumphs when good men do nothing. Darrell asked how someone can be good and do nothing at the same time.

## Impact

A learner gets the Word's own definition of good, and a popular saying corrected by the Word rather than repeated. Content only; no data or behavior changes.

## Decision

`ll303-what-good-is` is dated 2026-11-13, after L302. It is the second of a thread: the standard (L302), good (L303) and righteousness (L304).

The lesson teaches from the Word's own usage:

- **Good is defined by Yahweh, not by us** (Mark 10:18; Luke 18:19). His first use of the word is His verdict on His own work (Genesis 1:31; Psalms 145:9; Psalms 100:5; Psalms 34:8).
- **In Him, being good and doing good are one.** This is the key verse: "Thou art good, and doest good; teach me thy statutes" (Psalms 119:68). Jesus "went about doing good" (Acts 10:38), and Yahweh is good in trouble (Nahum 1:7).
- **A good tree cannot bear no fruit** (Matthew 7:17-18, 20; Luke 6:45; Matthew 12:35; 3 John 1:11).
- **The saying, said the Word's way.** By the Word's measure, the man who knows the good and does nothing is not doing good in that moment. To him it is sin (James 4:17; James 2:15-17; Proverbs 3:27; 1 John 3:18). The lesson says plainly that this is a mirror, not a verdict on anyone's soul.
- **The priest and the Levite passed by,** and the neighbor is the one who showed mercy (Luke 10:30-37). The hidden talent is called "Thou wicked and slothful servant", which is not a neutral word (Matthew 25:24-26, 45).
- **Where good comes from in us.** "in my flesh, dwelleth no good thing" (Romans 7:18). Goodness is fruit of the Spirit (Galatians 5:22-23). We are "created in Christ Jesus unto good works" (Ephesians 2:10; Titus 2:14).
- **The definition, stated plainly.** Good is what Yahweh is and what He does. Being good and doing good are one in Him, and they are one in whoever He makes good. Yahweh still seeks one to stand in the gap (Ezekiel 22:30).
- **Do it, and keep doing it** (Psalms 34:14; Matthew 5:16; Galatians 6:9-10; Romans 12:9, 21; Micah 6:8; Hebrews 13:16).

It has two parables with invented people and a ten-question quiz.

## Research

One question was researched: is the saying in Edmund Burke's writings? A web search on 2026-11-13 returned fact-checks and the reports of quotation researchers. They say the sentence has not been found in his writings, and that a similar thought appears in an 1867 address by John Stuart Mill.

The saying is named as popular and as commonly credited to Burke, and the attribution is held as unverified. Burke's writings and Mill's address were **not read**, and every reader text says so. The gate refuses any text that says Burke said or wrote it.

## What was measured

Verses: 37 anchor references and 165 quoted spans, every one fetched from `app/public/bible/kjv`. There are 0 verse faults and 0 quotes lacking a reference. Length: The adult text is 2,292 words, with 1,623 words of prose. Band shares are child 0.62, youth 0.66, teen 0.67 and senior 0.70. Reading ladder: Child 1.6, youth 2.6, teen 3.9, senior 5.5. Band overlap: The worst pair is 0.08.

## Verification

`living-lessons-ll303-what-good-is.test.js` runs 52 cases (vitest's count) and pins 14 spine spans in every text. It proves it catches: a band dropping a spine verse; an altered verse word; a capitalized mid-verse span; a stripped teen friend line; a generic "God" in our voice; a band losing the key verse; the Burke attribution stated as fact.

## Honesty gap

The lesson admits what was not read and has no figure for a source row. The third-pile GAP pin rises by one, with a dated note.

re-review: 2026-11-27. From a runner with web access, read the quotation researchers' sources on the Burke attribution, and keep or correct the "has not been found" wording to match.
