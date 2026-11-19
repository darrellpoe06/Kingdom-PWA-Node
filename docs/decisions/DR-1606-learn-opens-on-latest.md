# DR-1606: Learn opens on Latest

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (which sub-tab is selected first; no schema, no data)
**Type:** decision
**Area:** `app/src/lib/learn-landing.js`; `app/src/components/ChurchLearn.jsx` (the area strip, DR-1190)
**Sent in by:** Darrell, 2026-11-19, on The Word tab of the Love Corner with Latest open: *"Land on latest every time someone goes to lessons... because it defaulting to a confusing situation... make it easy for new users!!!!!!!!!"*
**Pairs with:** DR-1190 (the area strip), DR-1251 (Latest), DR-1183 (one course list)

## Context

Learn's area strip (Lessons, Continue, Latest, Find, Record, Downloads) opened on Lessons. With no course chosen, Lessons is the list of every course, which asks a newcomer to choose before they have seen a lesson.

## What was measured

Before: `useState('lessons')` in `ChurchLearn.jsx`. Every visit opened on the course list, whatever the reader had done last time. Latest was one tap away and carries each new lesson with ▶ Play.

## Impact

Anyone who comes to the lessons sees the newest lessons first, each ready to play. Every other area is still one tap on the same strip, and nothing is removed.

## Decision

1. Learn opens on **Latest** on every visit, on every door that shows the area strip, including a department tab (its own course's newest lessons).
2. With one course there is no strip to come back by, so that reader still opens on its lessons.
3. Choosing a course from the picker shows that course's lessons, from whichever area it was chosen.
4. Unchanged: a lesson that closes returns to its course's lessons (DR-0880), and ▶ Play, resume and deep links open the lesson as before.

## Verification

- `lessons-land-on-latest.test.jsx` (5 cases): mounted, Latest is the selected tab with its list; Lessons is one tap; a second visit lands on Latest again. With the old first area two cases fail.
- The existing Learn render suites run on the change.
- **Not verified:** on his tablet. Checked on main after the deploy run.
