# DR-1465: L306 — The Path of the Just Shineth: enduring with the Word first

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons-class.js`, `living-lessons-dates.js`)
**Spoken by:** Darrell, 2026-11-13, the fifth of a thread
**Pairs with:** DR-1464 (L305, whose "bread for us" this takes up), DR-1463 (L304, tied in through Isaiah 54:17), DR-0098, DR-0076, DR-0331

## Context

Darrell spoke from his working life. He worked in retail rent-to-own in every position, in technology and programming, in mechanical systems across many buildings, and in project management in the private and public sectors. Always on someone's project; his mother worked before him.

He spoke of six things he learned:

- **The little foxes.** Small details decide outcomes. Watch for what would undermine the work, then let Understanding come.
- **A ram in the bush.** In every place he was not preferred, one or two taught him their skills, and the majority came around.
- **Rules used for control.** People tried to control him through rules unrelated to the work. That made him rigorous with policy, and the rigor led into administration.
- **For and against.** Yahweh prepared him through people for him and against him at the same time.
- **Seeing it coming.** He sees it coming by fruit, which is not prejudging.
- **No hating, no condemnation.** People can grow, he has blind spots too, and some enjoy being foul.

He told of a friend of 20+ years who left a university after about 25 years of bullying leadership. The friend is a white man among white colleagues: this is not about race, it is people. He now earns about twice as much, keeps a state pension, and is moving into the public sector. Darrell helped him earn his business degree through Western Governors University, as Darrell did. He asked for a lesson on enduring with the Word first, with a salute to his friend and to the King, Jesus Christ.

## Decision

`ll306-the-path-of-the-just-shineth` is dated 2026-11-13, after L305. Word first:

- **Work as to the Lord** (Colossians 3:23-24; Ecclesiastes 9:10).
- **The little foxes** (Song of Solomon 2:15; Luke 16:10; Proverbs 24:3-4).
- **The ram in the thicket** (Genesis 22:13-14) **and the Jonathan beside David** while Saul was against him (1 Samuel 18:1, 29).
- **Sharpened by both** (Proverbs 27:17; Genesis 50:20; Romans 8:28).
- **None occasion nor fault** (Daniel 6:4-5; Matthew 10:16). This is the verse for his rigor with policy.
- **Fruit without prejudging** (Matthew 7:16; Matthew 7:1; Proverbs 22:3).
- **No vengeance, no hatred** (Romans 12:17-19; Proverbs 24:17; Matthew 5:44; Psalms 37:1-2, 7). This ties back to L305's Psalms 139:23.
- **The friend** (Proverbs 17:17; Ecclesiastes 4:9-10; Proverbs 18:16).
- **Run with patience** (Hebrews 12:1-2; James 1:2-4; 2 Corinthians 4:8-9).
- **Leveled up** (Psalms 75:6-7; Psalms 23:5; Proverbs 16:7; 1 Peter 5:10; Job 42:12). Isaiah 54:17 ties back to L304 through "their righteousness is of me".
- **Shining** (Proverbs 4:18), with the salute to the King (Matthew 28:18).

It has two parables with invented people and a ten-question quiz.

## Privacy, and what was not claimed

The friend and his university are not named. Western Governors University appears once, in the adult text, as Darrell named it, with no claim about it. A teen and a senior draft first called it an online university; that was a claim Darrell did not make, and it was removed. The gate allows exactly one university name anywhere in the module, and it is that one.

The friend's earnings are given only in Darrell's words, "about twice as much". There is no outside research. The gate asserts that the lesson admits nothing unchecked, so the third-pile GAP is unchanged by this lesson.

## What was measured

Verses: 39 anchor references and 181 quoted spans, every one fetched from `app/public/bible/kjv`. There are 0 verse faults and 0 quotes lacking a reference. Luke 16:10 was verified before use. Length: The adult text is 2,463 words, with 1,688 words of prose. Band shares are child 0.54, youth 0.61, teen 0.60 and senior 0.64. Reading ladder: Child 2.2, youth 4.1, teen 5.5, senior 5.9. Band overlap: The worst pair is 0.10. Voice: A teen line first read "the LORD will provide" in our voice. It now says Yahweh.

## Verification

`living-lessons-ll306-the-path-of-the-just-shineth.test.js` runs 52 cases (vitest's count) and pins 17 spine spans in every text. It proves it catches: a band dropping a spine verse; an altered verse word; a capitalized mid-verse span; a stripped teen friend line; a generic "God" in our voice; a band losing its not-prejudging line; a planted university name.
