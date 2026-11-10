# DR-1403: L298 — What Programs You: know yourself at the root, the strongholds, and agreeing with the King’s rewrite

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons-class.js`, `living-lessons-dates.js`)
**Sent in by:** Darrell, a spoken teaching, 2026-11-10 ("Lesson")
**Pairs with:** DR-0098 (teach the Word), DR-0076 (every verse fetched), DR-0210 (Yahweh in our voice), DR-0331 (his words rendered for meaning), Layer 0 typography (the adversary lowercase)

## Context

He spoke it in one long teaching and named it a lesson:

- **What programs you.** Whatever system you use every day is programming you. Look at the root of yourself and your workflows, and at what you do over and over that is not quality, because that is what Yahweh is rewriting. Agree with the King’s rewrite.
- **Know yourself.** It is a requirement, and others can see a blind spot you cannot.
- **Strongholds.** One kind is Yahweh Himself; the other is a belief against His way.
- **Reason together daily.** His thoughts are higher. The Word, read with the Holy Spirit’s help, is the only way to think toward them, with a heart in position and actions in step.
- **An ecosystem.** Sowing and reaping, grace and mercy, and trouble.
- **Yeshua stepped down.** He took the humiliating road to win.
- **Whom you believe.** Choose whom you believe, and believe Yahweh before yourself.

## What was measured

- **Length.** The adult lesson is 1,605 prose words. Band shares of it: child 0.51, youth 0.61, teen 0.60, senior 0.63.
- **Reading ladder.** Grades run child 2.4, youth 5.0, teen 6.3, senior 6.7 (adult 5.4).
- **Band overlap.** The worst is 0.05.
- **Talk directions.** All three appear in every band.
- **Verses.** 45 anchor references, 0 verse faults against `app/public/bible/kjv`.
- **Voice.** No percentage, no generic God in our voice.

## Impact

The lesson is in the catalog for every reader at every band from the day it was spoken. Its gate keeps 17 spine spans in every text. It also keeps the adversary’s name lowercase, so a later edit cannot quietly drop the Word or honor the adversary.

## Decision

`ll298-what-programs-you` is dated 2026-11-10, after L297. It follows his order, then a practical daily-system audit and a "say it again" recap.

**Repetition.** Recaps carry deliberate repetition in every band, because he asked that overlap bring clarity without boredom.

**Typography and the adversary.**
- His "Luciferian" is rendered "luciferian", lowercase, per Layer 0.
- Isaiah 14:12, which capitalizes that name in the KJV, is not quoted. Isaiah 14:13-14 carries the profile instead.
- His "biting the apple" is kept, and the lesson notes that Genesis 3:6 says "the fruit".

**Stories.** Two parables with invented people: a parts-counter spreadsheet, and a charge nurse’s sister. Eight quiz questions.

## Verification

`living-lessons-ll298-what-programs-you.test.js` runs 46 cases, generated from L297’s gate.

It is proven to catch:
- an altered verse word;
- a capitalized mid-verse span;
- a band dropping a spine verse;
- a stripped teen friend line.

New cases pin the lowercase rendering, the unquoted Isaiah 14:12, and Yahweh-first believing in every text.
