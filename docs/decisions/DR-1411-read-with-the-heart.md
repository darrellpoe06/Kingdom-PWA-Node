# DR-1411: L299 — Read with the Heart: according to the Word, not by the count

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons-class.js`, `living-lessons-dates.js`)
**Sent in by:** Darrell, a spoken teaching, 2026-11-10: "Lesson. Read with the heart... according to the Word"
**Pairs with:** DR-1409 (the read count, fixed the same day), DR-0098 (teach the Word from the Word), DR-0076 (every verse fetched), DR-0210 (Yahweh in our voice), DR-0331 (his words rendered for meaning)

## Context

He spoke it in four words and a reference, minutes after reporting a lesson counted as read thirty-eight times that he had read once. The teaching names what the count cannot measure.

## What was measured

- **Verses.** 33 anchor references, each fetched from `app/public/bible/kjv`, with 104 quoted spans and 0 verse faults.
- **Length.** The adult text is 1,655 words. Band shares of its prose are child 0.54, youth 0.60, teen 0.63 and senior 0.63.
- **Reading ladder.** Child 1.9, youth 2.4, teen 3.1, senior 3.8, adult 4.1.
- **Band overlap.** The worst pair is 0.11.
- **Talk directions.** All three appear in every band.
- **Voice.** No percentage and no generic God in our voice. A heading first written "THE LORD ASKS HOW" now reads "JESUS ASKS HOW".

## Impact

The lesson that answers the read count is in the catalog the day it was spoken. It teaches why a reading is measured by the heart, and how to read that way.

## Decision

`ll299-read-with-the-heart` is dated 2026-11-10, after L298. It is taught from the Word's own usage:

- how we hear, not how often (Luke 8:18; Mark 4:24);
- the ground is the heart (Matthew 13:19, 23; Luke 8:15);
- the mouth near and the heart far (Isaiah 29:13), and reading without coming to Him (John 5:39-40);
- open eyes asked for and given (Psalms 119:18; Luke 24:45; Acts 16:14; Luke 24:32);
- read to understand (Acts 8:30; Nehemiah 8:8), with a prepared heart (Ezra 7:10);
- hidden and written in the heart (Psalms 119:11; Proverbs 3:3; Jeremiah 31:33);
- the Word reads the heart (Hebrews 4:12), and the LORD looks on the heart (1 Samuel 16:7);
- received, believed and done (James 1:22).

The count is named a record and the heart the measure. The daily reading is kept, never thrown out. There are two parables with invented people: a deacon with forty tallies, and a bus driver who carried one line. The quiz has eight questions.

## Verification

`living-lessons-ll299-read-with-the-heart.test.js` runs 47 cases, generated from L298's gate. It pins 11 spine spans in every text.

It is proven to catch:
- a band dropping a spine verse;
- an altered verse word;
- a capitalized mid-verse span;
- a stripped teen friend line.

New cases pin that every text says the LORD looks on the heart, carries understanding and the hidden Word, and names the count a record.
