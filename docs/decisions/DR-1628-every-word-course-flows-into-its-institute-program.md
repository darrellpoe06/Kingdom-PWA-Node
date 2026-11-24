# DR-1628: Every Word course flows into its Institute program

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (the church's Institute surface; no schema, no auth, no money; the certificate standard is unchanged)
**Type:** decision
**Area:** `app/src/lib/church-institute.js`; `app/src/components/ChurchInstitute.jsx`; `app/src/index.css`
**Sent in by:** Darrell, 2026-11-24, on the Institute's About tab: *"All the courses should be flowing into their respective locations inside the institute!!!!!!???!!!!! Why not... lessons for the institute should show what makes sense"*, then *"a better or more intuitive way to present the information and options"*, *"we need function to be obviously for the appropriate audiences"*, *"Needs to be inviting and exciting inside the way to get to things"*.
**Pairs with:** DR-1455 (the Institute's card and surface), DR-1460 (the roll and the completion standard), DR-1428 (a lesson link opens in its own app), DR-0099 (red is reserved), DR-0076

## Context

Each program card said "Courses available today" and listed no course. The three programs named five of the catalog's courses between them; every other Word course lived only in Learn.

## What was measured

Before: `PROGRAMS[].courseKeys` held 2, 2 and 1 keys; the About card rendered a status chip and the planned names, no course. After, on the built app at 390 px: Christian Education opens four courses in place, each with who it is for, and six by-age tiles (Little Ones 9, Child 337, Youth 272, Teen 337, Adult 337, Senior 337 lessons, counted from the lessons); page scroll width 390; the opener 48 px tall. `church-institute.test.js` 13 green, `church-institute-render.test.jsx` 13 green.

## Impact

A member sees, on each program, the courses that belong to it and who each is for, and opens any of them in one tap. Nothing is offered that does not exist; the certificate's requirements did not move.

## Decision

1. A program carries two lists of catalog keys. `courseKeys` is the required core: an application snapshots it and `institute_completion` checks it (DR-1460), so it changes only by a decision. `alsoKeys` is every other registered course that belongs in the program, shown as open study and never added to the standard.
2. Only Word-and-house courses are placed: markets, real estate, mathematics and A.I. stay in Learn. A test refuses those categories.
3. Each program card opens its courses in place behind one gold button ("Explore N courses"), core first, each row naming its category and its audience from the course's own `meta.audience`.
4. Christian Education shows the Word by age, young to seniors: Little Ones, then every `AGE_BANDS` row, with counts measured from the lessons' authored levels.
5. The Courses tab filters by program; a course two programs name says so.
6. The by-age tiles carry a gold rule; true red stays reserved (DR-0099).

## Verification

`church-institute.test.js` 13 green and `church-institute-render.test.jsx` 13 green: the required core is pinned unchanged; an open-study key that does not exist is reported (proven to catch); no market, real-estate or A.I. category is placed; the by-age counts are computed from the lessons. Built app at 390 px in Chromium: the card opens in place, scroll width 390. After merge: the deploy run on main's SHA and `site-health` (DR-0107, DR-0125), then the phone walk (DR-0104).

## What is NOT in this record

The Institute's own survey and doctrine courses remain planned and are listed as planned. Whether any open-study course should join a program's required core is the Bishop's and the office's decision. `re-review: 2026-12-08` for that question to have been put to them.
