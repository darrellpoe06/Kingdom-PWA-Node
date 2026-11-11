# DR-1426: L301 — Your Old Men Shall Dream Dreams: the Spirit poured on every generation

**Date:** 2026-11-11
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons-class.js`, `living-lessons-dates.js`)
**Sent in by:** Darrell, 2026-11-11: a search note on Joel 2:28 and Acts 2:17, with one word above it, Lesson
**Pairs with:** DR-1414 (L300, the same sent-in shape), DR-0098 (teach the Word from the Word), DR-0076 (every verse fetched), DR-0210 (Yahweh in our voice)

## Context

The note named where the line is written and said the promise uses every generation. It cited commentaries for that. The lesson teaches the same truth from the Word itself, not from the commentaries.

## What was measured

- **Verses.** 45 anchor references, each fetched from `app/public/bible/kjv`. There are 145 quoted spans, with 0 verse faults and 0 quotes lacking a reference.
- **Length.** The adult lesson has 1,422 words of prose. Band shares are child 0.55, youth 0.64, teen 0.62 and senior 0.62.
- **Reading ladder.** Child 2.3, youth 3.2, teen 4.5, senior 5.0.
- **Band overlap.** The worst pair is 0.07.
- **Talk directions.** All three appear in every band.
- **Voice.** No generic God in our voice. A teen line first said Joseph waited thirteen years for his dreams. It now says what the Word dates: seventeen when he dreamed (Genesis 37:2), thirty before Pharaoh (Genesis 41:46).

## Impact

The promise is in the catalog the day it was sent, taught so that no age is set aside and no dream outranks the Word.

## Decision

`ll301-old-men-dream-young-men-see` is dated 2026-11-11, after L300. It is taught from the Word's own usage:

- the outpouring comes after the returning (Joel 2:12-13, 25, 28-29);
- every kind of person is named (Numbers 11:29; Acts 21:9);
- the promise was fulfilled at Pentecost: this is that (Acts 2:16-17);
- the risen Jesus is the Giver, from the Father (Acts 2:32-33; John 14:26);
- it reaches your children (Acts 2:38-39);
- the old still dream and bear fruit (Hebrews 11:13; Luke 2:25; Psalms 92:14; Psalms 71:18);
- the young are not despised (1 Samuel 3:10; Jeremiah 1:7; 1 Timothy 4:12);
- each age needs the other (Proverbs 20:29; Job 32:8-9; Titus 2:2-6);
- every dream is tested by the Word (Jeremiah 23:28; 1 Thessalonians 5:19-21);
- the vision is written and waited for (Habakkuk 2:2-3);
- it is told to the next generation (Joel 1:3).

The lesson also says the Word does not lock dreams to the old and visions to the young (Genesis 37:5; Daniel 2:19), so Joel's pairing is not taught as a box. It has two parables with invented people and an eight-question quiz.

## Verification

`living-lessons-ll301-old-men-dream-young-men-see.test.js` runs 50 cases, generated from L299's gate. It pins 12 spine spans in every text.

It is proven to catch:
- a band dropping a spine verse;
- an altered verse word;
- a capitalized mid-verse span;
- a stripped teen friend line;
- a band losing its test of the dream.

The 13 catalog-wide lesson suites pass, and so does the curriculum gate (922 lessons). The voice-clarity corpus was regenerated from the live catalog.
