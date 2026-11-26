# DR-1700: L347 — He Is Worth the Rigor

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file, plus one id on the hand-picked Relationships shelf; content only, no schema)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll347-he-is-worth-the-rigor-growing-longsuffering-and-the-one.js`, its own file per DR-1468), its gate test, `RELATIONSHIP_LESSONS` in `app/src/lib/learn-presentation/presentation.js`
**Sent in by:** Darrell, 2026-11-26, a spoken teaching and prayer ending with the one word Lesson, relayed by the session he spoke it in.
**Pairs with:** CLAUDE.md "Spoken Teachings Are Build Input", DR-0076, DR-0098, DR-0210, DR-0331, DR-0610, DR-1468 / DR-1477, DR-1666, DR-1698 (L346, the same day)

## Context

His words, rendered: he does not like relationships where people cannot grow past a point; after one, two, three years of the same cycle he wants to move on, and he named that as the longsuffering he still needs. He learns by doing; faith matters to him as substance and evidence, a place to rest while he tastes and sees. He will not be loyal to what will not grow; Yahweh is his loyalty, always right and never wrong, so worth changing for and worth the rigor. He called his impatience a possible weakness and asked what the Word says first.

One teaching, one lesson (DR-0610): not built before (`one-teaching-one-lesson-guard` 0 pairs). Honest both ways, as he asked: his growth-mindset is affirmed from the Word, and his named weakness is weighed by the Word too. No family member or private person is named.

## What was measured

| what | measured |
| --- | --- |
| the source | his spoken words, read in full; rendered for meaning, never quoted |
| verses | 164 quoted spans, every one filled by `fill-verses.mjs` from `app/public/bible/kjv`; 0 verse faults |
| length | adult prose 1,225 words |
| band shares | child 0.54, youth 0.64, teen 0.64, senior 0.70 (first build: child 0.43, youth 0.49, teen 0.48; each gained taught sections) |
| reading ladder | child 0.8, youth 3.1, teen 5.3, senior 6.6 |
| band overlap | worst pair 0.02 (ceiling 0.5) |
| UNCHECKED | no claim outside Scripture and his words; the texts that give distance are taught in their own setting (`re-review: 2026-12-10`) |

## Decision

`ll347-he-is-worth-the-rigor-growing-longsuffering-and-the-one`, ORDER 347, ADDED 2026-11-26, ten movements (the anchor theme lists every reference):

1. **Faith is tested by doing** (Hebrews 11:1; Psalms 34:8; John 7:17; James 1:22, 25; James 2:17).
2. **He is worth changing for** (Numbers 23:19; Psalms 18:30; Malachi 3:6; Hebrews 13:8; Romans 12:2; 2 Corinthians 3:18).
3. **Grow up, by use** (2 Peter 3:18; Hebrews 5:12-14; Hebrews 6:1; 1 Peter 2:2; Proverbs 4:18).
4. **Whom you walk with shapes you** (Proverbs 13:20; Proverbs 27:17; 1 Corinthians 15:33; Proverbs 22:24-25; Psalms 1:3).
5. **Falling is not the cycle; refusing to rise is** (Proverbs 24:16; Proverbs 26:11; Proverbs 1:7).
6. **The longsuffering check on our own side** (1 Corinthians 13:4, 7; Romans 15:1; Galatians 6:1; 1 Thessalonians 5:14; Matthew 18:22; Mark 4:28).
7. **Three years, and one more with digging** (Luke 13:6-9; Galatians 6:9), which answers his one, two, three years from the parable.
8. **Where the Word gives distance, and how** (2 Thessalonians 3:6, 15; Titus 3:10; Proverbs 22:24), taught only in its setting, with no enmity.
9. **Loyal to the person, not to the cycle** (Ruth 1:16; Colossians 3:13; Romans 15:5).
10. **The one loyalty** (Joshua 24:15; John 6:68; Deuteronomy 7:9; Hebrews 11:6; Philippians 1:6; John 1:29; John 3:16; Hebrews 1:8).

All five bands close with TALK ABOUT IT TOGETHER, THIS WEEK and a prayer. Two parables with invented people (a corner bakery; two fishermen in the Philippines). Ten quiz questions.

**Relationships collection:** judged a relationships lesson (how we bear with people and when we step back), added to `RELATIONSHIP_LESSONS` under love. The in-flight `claude/relationships-shelf-by-definition` branch (DR-1694, not yet on main) adds an audit doc every shelf id must appear in; whichever lands second adds L346 and L347 there.

**Cover:** none bought. It wears its department's approved interim cover (DR-1666) until the next approved library batch prepares its own for review.

## Verification

`living-lessons-ll347-he-is-worth-the-rigor-growing-longsuffering-and-the-one.test.js` (9 cases): the shared gate with eight spine spans (Hebrews 5:14, Psalms 34:8, Numbers 23:19, John 7:17, 1 Corinthians 13:4, Luke 13:8, Proverbs 24:16, Joshua 24:15) in the adult lesson and every band; every quotation verbatim; Yahweh in our voice; no bare double quotes; talk-together directions; band shares, ladder and overlap; two parables and ten questions. First run caught a quiz option that printed LORD in our voice and three short bands; each fixed.

`re-review: 2026-12-10`
