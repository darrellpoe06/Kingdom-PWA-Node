# DR-0843 — When, and by whom, the apps are used: who has done the evaluating, which weekdays, and a calendar per person

- **Status:** accepted
- **Tier:** A (one governor-gated read function over rows that already exist; counts only, no view names; the governor circle gate is 0073's and 0079's)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `infra/supabase/migrations-auto/0259-when-and-by-whom-the-apps-are-used.sql` (`usage_calendar_metrics(days_in)` → per person, per Chicago day, per kind, a count), `infra/supabase/tests/0259-usage-calendar-smoke.sql` (six assertions; role-control leg), `app/src/lib/usage-calendar.js` (new, pure: `cleanRows`, `perPerson`, `leaderboard`, `weekdayTotals`, `calendarGrid`, `calendarLine`), `app/src/lib/usage-calendar-sync.js` (the bounded REST read), `app/src/components/UsageCalendar.jsx` (new), `app/src/components/AccessUsageMetrics.jsx` (the *When & by whom* section), `scripts/system-flow-registry.mjs` (`usage-record` writer and `usage-calendar` reader over `db:usage_events`), `app/src/__tests__/usage-calendar.test.jsx` (5).
- **Principles:** 0073 (usage is sovereign, governor-aggregate, each person owns and can delete their own trail), DR-0819 (a function exercised is measured as a use, which is the work of evaluating), DR-0840 (each person understood), DR-0076 (every number here is a count of rows; a refused read is said), DR-0825 (a person is named as the viewer knows them), DR-0100 (what the son did is stated as measured, and the reward is the governor's call).
- **Grounds:** Darrell, 2026-10-09: *"How many times have users used the apps?... my son has done 90% of the work of evaluation of apps he shows he should have more from investing more on the platform... make sense? How many times a day and days specifically... on a calendar for most used days Saturday or Mondays etc... metrics for enhancement purposes... make sense?"* and *"Also for me and what I did and do inside and outside of the app based on user profiles and data analytics make sense?"*

## Context

`usage_events` has held every tab open since 0073 and every function exercised since DR-0819, per person, with the time. The aggregate answered which tabs (What's used); the per-person read (0145) answered which tabs for one member. Nothing answered WHEN (which day, which weekday) or HOW MUCH BY WHOM, so "my son has done 90% of the evaluating" was a true thing said from memory and the app could not show it.

## What was measured

- 0073: `usage_events(owner, kind, name, at)`; `usage_flow_metrics` gates on poe-family membership and groups by name only. 0145: `user_usage_metrics` groups by name for one person. Neither groups by day.
- The shell records a view on every tab change (`poe-financial-mvp-v28.jsx` 1036) and a use on functions that call `noteUse` (DR-0819), so "uses" is the count of functions exercised and "opens" the count of tabs opened.
- The smoke on a local PostgreSQL 16: two opens and one use by one person on one Chicago day read as two rows (view 2, use 1); an event 400 days old is not counted; a caller outside poe-family is refused.

## Impact

- Unresolved: the governor cannot see who has carried the evaluating, nor which days the family actually uses the apps, so a reward and an enhancement plan both rest on memory.
- The call obligates: counts only, per person per day per kind, from the governor's gate; the son's share is a share of the rows' total; the surface never names a view, so the calendar says when and how much and never what; the reward for the share is the governor's decision, not the app's.

## Decision

1. **`usage_calendar_metrics(days_in)`** (0259): per person, per Chicago calendar day, per kind, a count; 90 days by default, a year at most; poe-family governors only.
2. **Who has done the evaluating:** each person by uses first, then opens, with active days, their share of all uses and of everything; named the way the viewer knows them (DR-0825).
3. **Which days of the week:** seven bars, the busiest named in the line.
4. **A calendar of the last twelve weeks**, Sunday to Saturday, for everyone or for one person by tapping their name; the darker the day the more it was used, the number is that day's count.
5. **The governor's own row is on the list like anyone's.** What a person does outside the app is not held by the cloud (DR-0828) and no row here claims it.

## Verification

- `0259-usage-calendar-smoke.sql`: passes locally on PostgreSQL 16 (one day, two kinds, the window, the gate); runs on the hosted database in the role-control leg from here on.
- `usage-calendar.test.jsx`: the rows cleaned (a blank owner and a bad day dropped); one person's opens, uses, days and weekdays; the leaderboard by uses then opens with shares (90% of the using, 81% of all for the son fixture); the weekdays with Saturday busiest; the twelve-week grid's bounds, a Saturday cell, a future cell, the maximum, and one person's grid; the line; the section rendered with the names, the counts, the busiest weekday, 84 cells, and the grid narrowing to one person on a tap; the refused read said plainly.
- Interconnect guard: `usage-record` writes and `usage-calendar` reads `db:usage_events`, 0 findings; eslint clean.
- Owed after merge: db-migrate applies 0259; the first real read on the live build names the son's share from the rows.
- `re-review: 2026-10-16`: whether the calendar should also carry the Poe Properties door's opens (the door app does not record views today; a tenant's or worker's day reads as empty here until it does).
