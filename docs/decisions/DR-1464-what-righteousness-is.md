# DR-1464: L304 — What Righteousness Is: precept upon precept, jewel by jewel

**Date:** 2026-11-13
**Status:** Accepted (renumbered from DR-1463 the same day, after main took DR-1461 for the 0319 smoke record)
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons-class.js`, `living-lessons-dates.js`)
**Spoken by:** Darrell, 2026-11-13, the third of a thread
**Pairs with:** DR-1462 (L302), DR-1463 (L303), DR-0098, DR-0076, DR-0331, DR-0210

## Context

Darrell asked for a lesson on what righteousness is according to Yahweh, and what it is not. He tied it to good. Some people say they are righteous, and Yahweh says no. He also asked two more things: what the precept-upon-precept standard is, and what understanding we must gain from the Word, whose jewels come in many facets.

## Impact

A learner can tell Yahweh's righteousness from a verdict a person passes on himself, with its seven facets named. Content only; no data or behavior changes.

## Decision

`ll304-what-righteousness-is` is dated 2026-11-13, after L303. It works the Word line by line.

- **Precept upon precept, in its own context** (Isaiah 28:10; Isaiah 28:13). The line-upon-line Word builds the humble and breaks the scoffer who refuses it. It is sought as hid treasure, more precious than rubies (Proverbs 2:4-5; Proverbs 3:15). This is taught so the Word explains the Word (DR-0098).
- **His nature and His standard** (Deuteronomy 32:4; Psalms 11:7; Psalms 119:142, 172). The name is "THE LORD OUR RIGHTEOUSNESS" (Jeremiah 23:6).
- **What it is not: man's verdict on himself** (Proverbs 21:2; Proverbs 16:2; Romans 10:3; Matthew 23:28; Matthew 6:1; Isaiah 64:6; Romans 3:10). The Pharisee and the publican come next (Luke 18:9-14). The publican "went down to his house justified".
- **The standard that exceeds** (Matthew 5:20). No one reaches it by more works (Titus 3:5).
- **Given, not self-made** (Genesis 15:6; Romans 4:5; Philippians 3:9; Romans 10:4; 2 Corinthians 5:21; 1 Corinthians 1:30). It is worn as a robe, "as a bride adorneth herself with her jewels" (Isaiah 61:10). These are Darrell's jewels.
- **Given is lived.** "he that doeth righteousness is righteous" (1 John 3:7). This ties back to L303, where being and doing are one (Psalms 23:3; Matthew 6:33; Ephesians 6:14; Amos 5:24).
- **The road back** (1 John 1:9).
- **The definition, in our voice.** Righteousness is right standing and right living by Yahweh's standard, not man's. It begins as a gift and shows as a life. Self-righteousness is a verdict a person passes on himself; Yahweh weighs the heart. Its seven facets are named as jewels: His nature, His standard, the gift, the robe, the path, the breastplate and the stream.

The lesson hands Proverbs 21:2 forward to L305, the heart searched with Him. It has two parables with invented people and an eleven-question quiz.

## Research

None. The lesson makes no claim from outside the Word. Its gate asserts that it admits nothing unchecked, so the third-pile GAP is unchanged by this lesson.

"THE LORD OUR RIGHTEOUSNESS" appears in our text only inside its quotation with its reference. The gate keeps LORD out of our own voice (DR-0210). A first draft wrote the name unquoted in five places, and the voice scan caught all five before the gate ran.

## What was measured

Verses: 36 anchor references and 172 quoted spans, every one fetched from `app/public/bible/kjv`. There are 0 verse faults and 0 quotes lacking a reference. Length: The adult text is 2,179 words, with 1,424 words of prose. Band shares are child 0.70, youth 0.72, teen 0.67 and senior 0.68. Reading ladder: Child 2.2, youth 4.0, teen 5.0, senior 5.6. Band overlap: The worst pair is 0.08.

## Verification

`living-lessons-ll304-what-righteousness-is.test.js` runs 53 cases (vitest's count). It pins 16 spine spans and the seven named jewels in every text. It proves it catches: a band dropping a spine verse; an altered verse word; a capitalized mid-verse span; a stripped teen friend line; a generic "God" in our voice; a band losing a jewel.
