# DR-1666: Relationships, in one place on the Learn home

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (a curated shelf on the Learn home; no lesson content changed)
**Type:** product
**Area:** `app/src/lib/learn-presentation/presentation.js` (`RELATIONSHIP_LESSONS`, `relationshipShelf`, `studioHome().relationships`), `app/src/components/learn-studio/LearnStudio.jsx`, `app/src/__tests__/learn-functions-in-new-look.test.jsx`
**Sent in by:** Darrell, 2026-11-26: "We need the relationships lessons in one place... my wife says ladies will want those most... Make sense?"
**Pairs with:** DR-1662 (every Learn function in the new look), DR-1664 (the new look for every member)

## Context

Relationship teaching (marriage, love and hard conversations, family, friendship) is spread across Living Lessons and the Eternal Algorithms, and the Learn home's topic shelves are built by department, so there was no place to find it together.

## What was measured

- Lessons carry no topic tags (fields measured across all 995: id, title, bigIdea, lesson, levels, stories, anchor... no tags or topics).
- A keyword scan of titles and big ideas returned 196 candidates, most false (a wife or a marriage named in passing; "Father" meaning Yahweh; tech lessons with "relationship" in a data sense). A tightened scan still returned 50 with clear misses.
- So the shelf is a hand-picked list: 19 lessons, each read for its subject. Marriage (ll230, ll231, ll122, ll114, ll121, ll115, ll123, ll319), love and hard conversations (ll157, ll167, ll16, ll291, ll151), family (ll46, ll117, ll313, ll100, ll205), friendship (ea-gh-truth-love). Left out on purpose: lessons that only mention marriage in passing, and The Levels of Disrespect (about disrespecting Yahweh, not relationships between people).

## Decision

1. A **Relationships** row ("Marriage, love, family and friendship") sits directly under the Lessons list on the Learn home, above the dashboard and the hero, with **See All** opening every lesson on it.
2. The list is `RELATIONSHIP_LESSONS` in `presentation.js`, read from the mounted catalog in its order; a lesson is opened the same way every new-look card opens.
3. A test fails the build if any listed id stops resolving to a mounted lesson (proven to catch with a planted id), or if the list repeats a lesson.

## Impact

- Every member finds the relationship lessons in one tap from the top of Learn. No lesson changed; no new art (each lesson wears its approved cover, or its department's interim cover).
- New relationship lessons are added to the list as they are written.

## Verification after merge

- `learn-functions-in-new-look.test.jsx` + `learn-studio.test.jsx` + `lessons-in-order.test.jsx`: 31 of 31, including every listed id resolving and the shelf above the hero with See All showing all 19.
- Not yet seen on a phone: the row under Lessons, and See All.

`re-review: 2026-12-03`
