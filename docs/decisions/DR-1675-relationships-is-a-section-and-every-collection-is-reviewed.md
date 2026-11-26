# DR-1675: Relationships is a section of its own, and every lesson collection is reviewed, never picked from memory

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A (which lessons a collection lists and how it shows them; no schema)
**Type:** fix
**Area:** `app/src/lib/learn-presentation/presentation.js` (`RELATIONSHIP_GROUPS`, `relationshipGroups`), `app/src/lib/learn-presentation/collection-review.js` (new), `app/src/components/learn-studio/LearnStudio.jsx`, `learn-studio.css`; tests `every-collection-is-reviewed.test.js`, `learn-functions-in-new-look.test.jsx`
**Sent in by:** Darrell, 2026-11-26: "We don't have a lot on relationships?!!!!!! How is that possible?!!!!!!"; "relationships should be a larger section of the sections of learning"; "Can we make sure to review and make better decisions on these types of sorts and collection of lessons?"; "Keeping all ways to view a groups of lessons make sense?"; "We need more lessons on relationships".
**Pairs with:** DR-1666 (the first Relationships shelf, 19 lessons)

## Context

Lessons carry no topic tags. DR-1666 picked 19 relationship lessons by reading a keyword scan of titles and big ideas, which missed lessons whose teaching is relational but whose titles are not.

## What was measured

- A scan of every lesson's FULL text (title, big idea, lesson) for words that mean people in relationship (marriage, husband, wife, parent, sibling, friend, forgive, reconcile, one another, neighbour...), per 1,000 words, over the 995 lessons; 901 have 300+ words.
- At 6 or more per 1,000, 42 lessons are flagged; 18 were on the shelf. Each of the other 24 was read by title and big idea, and the top 140 of a wider scan the same way.
- Judged IN: 25 more lessons (including Iron Sharpens Iron, the neighbour lesson, Safe to Speak, Seasoned with Salt, Separate and Connect, No Offense Taken, Vengeance Is His, Admit You Are Wrong, A Prophet in His Own House, Church Hurt, the viral marriage number, Building Someone Up or Pulling Them Down, the petition and forgiveness lesson). Judged OUT: 19, each with its reason in `RELATIONSHIP_REVIEWED_OUT` (forgiveness from Yahweh rather than between people; money; A.I.; doctrine).
- 19 lessons became 44, in four sections: Marriage & Love 13, Family & Children 13, Friends, Neighbors & the Church 8, Hard Conversations, Offense & Forgiveness 10.

## Decision

1. **Relationships is a section of its own** with four parts and a count, first in Explore by Topic ("Should say relationships as an option"; Marriage · Family · Friends · Forgiveness), opened from the shelf's See All, and it keeps every way to view a list: Pictures | List (remembered per device).
2. **Every collection is reviewed by rule, measure and judgment.** A test fails the build while any lesson at or above the flag is neither in a section nor judged out with a reason, so a new lesson can never silently miss the collection.
3. **More lessons** come from new teaching: the measured section shows where it is thin (Friends, Neighbors & the Church has 8); the research plan for what members want to learn is in the reply and its follow-up record.

## Impact

- The Relationships section more than doubles, from lessons already written; nothing was removed.
- Any future collection follows the same pattern (rule, measure, judge, gate).

## Verification after merge

- `every-collection-is-reviewed.test.js` (3): every flagged lesson is judged; no id is both in and out, every id is real, every reason is written; four sections, more than 38 lessons. Removing one judged-out id makes the first case fail (run 2026-11-26).
- `learn-functions-in-new-look.test.jsx`: See All shows the four parts and the count; List shows all 44 as rows and no picture cards.

`re-review: 2026-12-03`
