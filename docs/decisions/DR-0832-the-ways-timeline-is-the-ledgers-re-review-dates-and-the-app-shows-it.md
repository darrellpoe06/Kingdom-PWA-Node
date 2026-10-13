# DR-0832 — The Way's timeline is the ledger's re-review dates, and the app shows it

- **Status:** accepted
- **Tier:** A (a read of the ledger the build already ships; nothing fetched, nothing written)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `app/src/lib/re-review-timeline.js` (new, pure: `weekStartOf`, `daysBetween`, `shortDay`, `rowOf`, `buildReReviewTimeline`, `timelineSummary`), `app/src/components/ReReviewTimeline.jsx` (new: the Timeline section), `app/src/components/GovernanceQueue.jsx` (mounts it under the Decided ledger header), `app/src/__tests__/re-review-timeline.test.js` (10).
- **Principles:** DR-0075 (a justified non-improvement is a recorded decision with a `re-review:` date sized to the issue; nothing parked is parked forever), DR-0058 (review cadence), DR-0103 §4 (between prompts the agent pulls the next dated re-review forward), DR-0065 (the app is the primary artifact), DR-0076 (counts from the real records; an absence is counted, never dated).
- **Grounds:** Darrell, 2026-10-09: *"Timelines based on the Way we work... DRs... etc...."*

## Context

The Way does not promise delivery dates. It promises a re-review date on every decision that parks something, and that the date is kept. That makes the ledger's `re-review:` lines the platform's timeline. The app already shipped the whole ledger at build time (`__DR_LEDGER__`) and already showed each record's date inside its chain (GovernanceQueue), and Operations Intelligence flagged re-reviews due within seven days or passed. Nobody could see the horizon: what comes back next week, the week after, and how much is stacked on one day.

## What was measured

- The records on 2026-10-09: 257 dated re-reviews across 217 records fall on or after today (one record may carry several dates; the app reads each record's latest). By day: 16 on 2026-10-14, 31 on 2026-10-21, 7 on 2026-11-08; the rest spread across six weeks. Earlier dates exist too: records whose re-review has passed and has not been re-reviewed.
- `decision-chain.js` reads a record's latest `re-review:` date; on DR-0809 it returns 2026-10-15 and on DR-0831 2026-10-16, which is what the ledger carries into the app.
- Operations Intelligence showed only the seven-day window and the passed ones as "timeline threats"; GovernanceQueue showed the date per record, not the calendar.

## Impact

- Unresolved: the re-review promise is kept by memory and by the agent's idle turns, with no surface that shows the governor what is due, how much, and what has already slipped; a week with 31 re-reviews arrives unannounced.
- The call obligates: the timeline is read from the records themselves, passed dates are named as passed with the days, and a record without a date is counted as decided rather than painted onto the calendar.

## Decision

1. The Timeline section on the governance surface: passed and not yet re-reviewed first (each with how many days), due today, then week by week Monday to Sunday, the first two weeks open and later weeks folded; a summary line with the counts and the heaviest week; the count of records with no date.
2. Pure derivation over the ledger items' `chain.reReview`; today is an input, so the section is testable on a fixed day.
3. The load the timeline reveals is worked the Way already says: each dated re-review is pulled forward on its day (DR-0103 §4), and a re-review that keeps a parking sets a new date (DR-0075). `re-review: 2026-10-21`, the heaviest week measured, to read the week's 31 against what was actually re-reviewed.

## Verification

- `re-review-timeline.test.js`: Monday week starts, days between, the short day; a row's date, lateness and passed flag; passed first and oldest first, today apart, weeks Monday to Sunday with labels and the heaviest; the summary counting only what is there, including the empty ledger and a ledger with no dates; the rendered section with passed before today before weeks, the day counts, two open weeks, the undated count, and the empty state with no painted week.
- The governance suites (21 cases) still pass with the section mounted; lint clean at zero warnings; every gate green.
