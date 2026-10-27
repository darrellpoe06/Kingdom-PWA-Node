# DR-1253: A published lesson opens the lesson, not the work that made it

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/lib/arrivals.js`, `app/src/components/ChurchLearn.jsx`, `app/src/lib/push-send-policy.js`, `infra/supabase/migrations-auto/0311-a-published-lessons-push-lands-on-the-lesson.sql`, `scripts/arrivals-ci-smoke.sql`
**Follows:** DR-0741 (arrivals land where they are), DR-0444 (the door the person is in), DR-0616 (every arrival counted), DR-1251 (a lesson played to the end is read)

## Context

Darrell, 2026-10-27, with the Arrivals card for L265 "Jericho's Barred Gates"
on screen: *"These lessons should go to the actual lesson... not the research
road work lesson... make sure you understand... The links need to be changed
to go to the correct page... to read or have a lesson read to you... Users
would be confused."*

## What was measured

- `lessonArrivals` built the published arrival with the lesson's own link in
  `href` AND `screen: 'your-lessons'`; `arrivalLanding` honoured the screen
  first, so OPEN went to `?view=create&panel=your-lessons` — the lane's record
  of the request — and never used the link it carried.
- The push for the same event (`agent_inbox_arrival_enqueue`, migration
  0246) carried the same Your lessons URL for both the ready and the
  published event, and its body said "Open Your lessons to read it."
- The Message (`publishedMessage`) already linked the lesson itself.
- Only Your lessons marked a published arrival as looked at; opening the
  lesson did not, so a reader who read the lesson from anywhere else kept the
  "1 new" badge.

## Decision

- A published lesson's arrival lands in Learn on the lesson (`screen:
  'learn'` with its course and lesson id): the lesson's own space, guide
  open, where it is read or read aloud. A lesson that is written or answered
  still opens Your lessons, because that is where the choice is made.
- Opening the lesson from its link marks the published arrival as looked at
  (`SCREEN_KINDS.lesson`).
- The push for a published lesson carries the lesson's URL, built from the
  row's `lesson-id:` tag, and says "Open it to read it, or have it read to
  you." A row with no lesson id falls back to Your lessons rather than to a
  dead link.

## Impact

Nothing about the lane's own screens changes: the Governor's queue and Your
lessons keep their landings and their marks. Only the published event moves,
on every road it travels (bell, push, message).

## Verification

- `arrivals.test.js`: the published arrival carries screen, course and
  lesson; `arrivalLanding` gives the lesson link in both doors; the old
  shape still proves the panel landing it used to give; `SCREEN_KINDS.lesson`.
- `scripts/arrivals-ci-smoke.sql` (CI): a row gaining `lesson-published`
  with a `lesson-id:` tag enqueues a push whose URL is the lesson's and whose
  body carries no lesson text.
- `push-send-policy` wording pinned by its own suite.
