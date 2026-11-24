# DR-1633: Learn by squares is another way in

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (a new area on Learn's strip; every existing area untouched; no schema, no data)
**Type:** decision
**Area:** `app/src/components/LearnSquares.jsx`; `app/src/components/ChurchLearn.jsx` (the area strip, DR-1190)
**Sent in by:** Darrell, 2026-11-24: *"Not a scroll of death... sections... so each of the 13 the inside each.... all as squares... not rectangular so it takes up less space on the screen and gives more options and a place to go for more information the same courses... maybe a area tabs... then... courses... the lessons... don't get rid of the view I like... just giving another option for navigating the app"*, then *"What does app development research and actual high performance or users apps say about this?!!!!! ... did we do this?!!!"*, *"Do we need to reinvent the wheel or get an understanding"*, *"Looking at what has and is working to keep users engaged"*.
**Pairs with:** DR-1190 (the area strip), DR-0432 (departments derived from the catalog), DR-1420 (where the reader stands), DR-1606 (Learn opens on Latest), P7 (research first), DR-0076, DR-0100

## Context

Learn's ways in were a course picker, Latest, Find and the record. He asked for a second way: areas, then courses, then lessons, as squares, with no long scroll. The first build of this session was written from his direction and the house patterns alone; he asked what research and working apps say, and the answer was that it had not been looked up. It was looked up before this was written.

## What was measured

What the sources say, each read 2026-11-24:

| source | finding | where it is applied |
|---|---|---|
| Baymard, mobile category research | on mobile, people rely on tile "intermediary category pages" to choose where to go; use them for the first one or two layers; breadcrumbs carry the wayfinding | areas and courses are square tiles under a breadcrumb |
| NN/g, cards component; card view vs list view | a vertical list scans faster than cards and fits more per screen; cards suit items that differ in kind | rows are offered beside the squares he asked for |
| NN/g, pogo-sticking | weak labels on a routing page send people in and back out | the row view cuts no title; a square keeps the whole title in its name |
| NN/g, touch targets; older adults | at least 1 cm targets; relative text sizes; small targets fail older users | 44 px floors, rem sizes |
| Duolingo, streak experiments (company data) | Day-7 retention up 14% in one test; one lesson keeping the streak raised Day-14 retention 3.3% | not adopted as a streak; see below |
| an RCT on a reading app (arXiv 2310.10850) | a behavioral nudge raised 12-week retention; the same paper calls the wider evidence mixed | progress shown where the choice is made |

Not found: a controlled comparison of drill-down against a long page, and any published retention data from a Bible app. Both are named here as not found.

On the built component: `learn-squares.test.jsx` 6 green. Two areas from three courses, counted; a 25-lesson course pages 1–10, 11–20, 21–25; a lesson row carries its whole title and opens that lesson; the breadcrumb steps back one level at a time; a course tile reads the reader's own standing.

## Impact

A reader has one more way to a lesson: three taps, one screen at a time, each screen short. Every view he already uses is where it was.

## Decision

1. Learn's area strip gains **Browse**. Latest still opens first (DR-1606); nothing is removed or reordered beyond the one added tab.
2. Areas and courses are square tiles. The areas are the catalog's own departments, derived, never a list kept by hand.
3. Lessons open as squares, twelve to a page, as he asked; each square carries its whole title in its name. The research says a list reads better for long titles, so full-title rows, ten to a page, are one tap away on the same screen and the choice is remembered on the device. Both are built; neither is left as a question.
4. A course tile says where the reader stands, from their real records. No streak, no leaderboard: the house rule for children is no scoreboard, and the streak evidence is one company's own.
5. "More about this course" opens the course's existing page.

## What is NOT in this record

Whether a daily-reading streak belongs in this house is a decision for Darrell, with the evidence above and its cautions. `re-review: 2026-12-08`.
