# DR-1698: L346 — Better Than He That Taketh a City

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file, plus one id on the hand-picked Relationships shelf; content only, no schema)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll346-better-than-he-that-taketh-a-city-ruling-your-spirit-when.js`, its own file per DR-1468), its gate test, `RELATIONSHIP_LESSONS` in `app/src/lib/learn-presentation/presentation.js`
**Sent in by:** Darrell, 2026-11-26, a spoken teaching and prayer (voice note) on being annoyed when the Word is misrepresented, and how to rule his spirit through it. A second word the same day asked for a section on talking with loved ones who believe differently, kept general.
**Pairs with:** CLAUDE.md "Spoken Teachings Are Build Input", DR-0076, DR-0098 (teach, don't debate), DR-0210, DR-0331 (his words rendered for meaning, never in quotes), DR-0610, DR-1468 / DR-1477, DR-1666 / DR-1686 (the Relationships shelf)

## Context

His question, rendered: people claim the Word says what it does not, bending it to fit a story so they sound wise in their own eyes; he can show the page (his example: the disciples were called Christians first in Antioch, Acts 11:26), and they move the goalposts or change the subject, so none of the points Yahweh is making is heard. Why does it still annoy him, how did Jesus and His people keep their mouths shut and their spirits ruled, and how does he stay word first, not riled up, with his energy where Yahweh wants it?

One teaching, one lesson (DR-0610). The catalog already holds `ll16-rule-your-spirit-repair-the-bond` (ruling the spirit to repair a bond after offense) and a misrepresentation lesson whose senior band teaches the adversary's edit of Genesis and Matthew 4 (the text of the twisting itself). Neither answers his question, which is the listener's own frustration and the discipline of the answer. This lesson takes that: the sting is not the sin, convincing is the Holy Spirit's work, discern the question, slow and keep it till afterwards, how Jesus did it, and the glory of passing over.

**Privacy (DR-0076 / his word):** the family-table section names no person, no faith and no occasion from his own home. It speaks only of "someone you love who believes differently".

## What was measured

| what | measured |
| --- | --- |
| the source | his spoken words, read in full; rendered for meaning, never quoted |
| verses | 159 quoted spans, every one filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults |
| length | adult prose 1,259 words |
| band shares | child 0.54, youth 0.63, teen 0.63, senior 0.84 (first build: child 0.44, youth 0.51, teen 0.54; each gained a taught section) |
| reading ladder | child 0.5, youth 2.8, teen 4.3, senior 7.2 |
| band overlap | worst pair 0.03 (ceiling 0.5) |
| UNCHECKED | the lesson makes no claim about church history after the apostles; his question about believers over the ages is answered from the Word alone (`re-review: 2026-12-10`) |

## Decision

`ll346-better-than-he-that-taketh-a-city-ruling-your-spirit-when`, ORDER 346, ADDED 2026-11-26, ten movements:

1. **Why it still stings, and why that is not the sin** (Ephesians 4:26; James 1:20).
2. **The Word is specific, so it can be checked** (Acts 11:26; Acts 17:11; 2 Peter 3:16; Proverbs 3:7; Matthew 4:7).
3. **Convincing is the Holy Spirit's work** (John 16:8; John 16:13; 1 Corinthians 3:6-7; Isaiah 55:11).
4. **Discern the question** (Proverbs 26:4-5 read together, as the Word explaining itself, not a contradiction; 2 Timothy 2:23-25; Proverbs 18:13). Moving goalposts named as the sign the talk stopped being about the first point.
5. **Slow, and keep it till afterwards** (James 1:19; Proverbs 29:11; Proverbs 16:32; Proverbs 25:28).
6. **How Jesus did it** (Isaiah 53:7; Matthew 27:14; 1 Peter 2:23; Matthew 22:46; Mark 11:33; Luke 4:30; John 6:66-68).
7. **The glory of passing over** (Proverbs 19:11; Proverbs 12:16; Romans 12:21).
8. **At the table with someone you love who believes differently** (Romans 12:18; Colossians 4:6; 1 Peter 3:15; Proverbs 15:1).
9. **The practice** — name the first point once and finish it, then bless and release; the thought taken captive and the Test (2 Corinthians 10:5; Philippians 4:8).
10. **The Lamb who opened not His mouth** (John 1:29; John 3:16; Hebrews 1:8).

All five bands (child, youth, teen, senior, and the adult lesson) close with TALK ABOUT IT TOGETHER (parents, children, friends), THIS WEEK and a prayer. Two parables with invented people (a library book circle; a grandmother in Ghana). Ten quiz questions.

**Relationships collection:** judged a relationships lesson (how we handle people in hard conversations), and added to `RELATIONSHIP_LESSONS` under hard conversations and forgiveness, beside `ll16-rule-your-spirit-repair-the-bond`.

**Cover:** no new picture was bought for this lesson in this session. It wears its department's approved interim cover (the reuse DR-1666 names for a lesson still waiting for its own picture), with the headline `interimHeadline()` derives from its title. It is an unfinished library lesson, so the next approved library batch of `learn-presentation-prepare.yml` (`only: all`, under the owner's caps) prepares its own cover for review.

## Verification

`living-lessons-ll346-better-than-he-that-taketh-a-city-ruling-your-spirit-when.test.js` (9 cases): the shared gate with seven spine spans (Proverbs 16:32, James 1:19, 1 Peter 2:23, Proverbs 19:11, John 16:13, Acts 11:26, Romans 12:18) in the adult lesson and every band; every quotation verbatim; our voice naming Yahweh, no generic God or LORD outside a quote; no bare double quotes; three talk-together directions in every place; band shares, ladder and overlap; two parables and ten questions. First run caught a heading in our voice that printed LORD, a teen band missing its parents direction, and three short bands; each fixed. The full suite result is in the PR.

`re-review: 2026-12-10`
