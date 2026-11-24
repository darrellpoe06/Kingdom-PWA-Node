# DR-1629: The Kids Zone carries every lesson, chosen by age

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (a new way into lessons that already exist; no schema, no data written that was not written before)
**Type:** decision
**Area:** `app/src/lib/kids/lesson-library.js`; `app/src/components/kids/KidsZone.jsx`; `app/src/components/kids/KidsAdventure.jsx`; `app/src/components/kids/kids-zone.css`
**Sent in by:** Darrell, 2026-11-24: *"the kids zone should have all the children lessons to choose from correctly we have the labeled by population young to seniors"*, then *"Not saying it shouldn't open this week's lesson or not... we need function to be obviously for the appropriate audiences"* and *"Kid Zone looks amazing... make it easy to navigate to lessons"*.
**Pairs with:** DR-1508 (the Kids Zone, true ages), DR-1606 (Learn opens on Latest), DR-0418 (the youth level), DR-0076

## Context

The Kids door opened one lesson, the week's pick. Every Living Lesson carries its own words for a child, and most for a youth and a teen, and none of them could be chosen.

## What was measured

Before: one lesson reachable from the Kids home. After, on the built app at 390 px: the library lists Little Ones 9, Kids 337, Youth 272, Teen 337 lessons, counted from each lesson's authored `levels`; the dock's six tabs are 53 px wide and 55 px tall with no label overflowing; page scroll width 390. `kids-lesson-library.test.js` 6 green; `kids-zone-render.test.jsx` 11 green, including a lesson picked at Teen opening at `data-band="teen"`.

## Impact

A child, or the grown-up beside them, picks an age and any lesson written for that age. The week's lesson still opens first and now says who it is for.

## Decision

1. The Kids Zone has a lesson library: four age buttons (Little Ones 3–6, Kids 6–10, Youth 11–14, Teen 15–17) with measured counts, a search over title and big idea, and the lessons 24 at a time.
2. A lesson is listed for an age only when it carries that age's own authored level. Living Lessons read newest first; Little Learners keep their teaching order.
3. The library is one tap from anywhere: a LESSONS tab on the Kids dock, and a "Choose any lesson" tile beside the week's adventure.
4. A lesson opened from the library reads at the chosen age, and its exit reads "All lessons", so it is not mistaken for the step-back button beside it.
5. The week's adventure is unchanged and its tile names its audience.

## Verification

`kids-lesson-library.test.js` 6 green: a lesson without an age's own words is not listed for that age (proven to catch). `kids-zone-render.test.jsx` 11 green: the library opens from the tile and the dock, a lesson picked at Teen opens at that band, the exit returns to the library. Built app at 390 px: six dock tabs fit, scroll width 390. After merge: the deploy run and `site-health`, then the phone walk (DR-0104).

## What is NOT in this record

The Teens door (`TeensZone.jsx`) has its own reading-band switch and no library yet. `re-review: 2026-12-01` to give it the same library.
