# DR-1589: The Grown-ups pick always has notes to lead with

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (the weekly pick's filter; no schema, no copy change)
**Area:** `app/src/lib/youth-zone.js` (`weeklyModule`, `leadLines`, `hasLeadNotes`), `app/src/components/kids/GrownUps.jsx`, their tests
**Pairs with:** DR-1508 (the Kids Zone), DR-1588 (the test read against the week's lesson), DR-0219, DR-0076

## Context

The Grown-ups page says "This week with your child: <lesson>" and then "How to lead it, from the lesson's own notes" (`GrownUps.jsx`). `weeklyLesson` picked `items[weekIndex % length]` over ALL of `LIVING_LESSONS_MODULES`, so every lesson that landed moved the pick, and some weeks it fell on a lesson with no `howToRun`. Then the page said "This lesson carries no facilitator notes yet". DR-1588 changed the test to accept that. This record fixes the cause instead.

## What was measured

| what | measured, main da0137b, 2026-11-19 |
| --- | --- |
| catalog | 327 Living Lessons, 75 with no `howToRun`; Little Learners 9 of 9 with notes |
| pick for 2026-11-16 (kids, teens) | `ll238-who-holds-the-wind…`, no notes: the live page had no notes this week |
| 52 weeks from 2026-11-16, old rule | 8 door-weeks with no notes (kids and teens, 11-16, 11-23, 11-30, 12-07) |
| 52 weeks, new rule | 0 |
| earlier red | bank10 PR #2772 at 07:24Z picked `ll173-humility-is-the-strength…` (no notes), and `kids-zone-render` failed on a lesson PR for a reason outside it |

## Impact

The page now always shows notes, so a parent always has a way to lead the week's lesson, and a landing lesson can no longer turn another PR red here. The kids home tile and the Grown-ups page still share one `weeklyLesson`, so they name the same lesson. Lessons with no notes still play everywhere else in Learn; they are only left out of this rotation. Reversible by deleting one filter.

## Decision

`weeklyLesson` picks through a new `weeklyModule(modules, now)`. It keeps the deterministic week rotation, but only over the modules where `hasLeadNotes` is true (at least one `howToRun` line once the lesson's own ` | ` joins are split). `leadLines` moved into `youth-zone.js` and `GrownUps.jsx` re-exports it, so the page's rendering and the picker's filter use the same function. The whole list is used only when no module has notes; the page then shows its honest "no notes" line. Not decided: whether the 75 lessons should get facilitator notes. That is content work for those lessons, not a change to the picker.

## Verification

- `grownups-weekly-pick-has-notes.test.js`, 6 cases. It checks the split, a fixed five-module list where the old modulo lands on a lesson with no notes on 2026-11-16 (proven to catch), that the rotation is the same all week and goes through every led lesson, the empty and no-notes fallbacks, and every door for 52 weeks on the real catalog.
- `kids-zone-render` again requires "How to lead it" and the first note line, whatever size the catalog is.
- Proven to catch on the real artifact: with the old rule put back, 3 of 13 cases fail, including the year guard, which lists the 8 door-weeks. With the new rule, 13 of 13 pass.
- Lint clean; youth, kids and grown-ups suites 14 files and 124 cases green; every test that imports the zone, 10 files and 71 cases green.
