# DR-1024: The order names its people and its time, and the actual order shows what took place against the order the Bishop asked for

**Date:** 2026-10-15
**Status:** accepted
**Area:**
- `infra/supabase/migrations-auto/0292-every-line-of-the-order-names-its-people.sql` (`church_service_segments.personnel jsonb`, `.auxiliary text`; the one legacy owner backfilled once)
- `app/src/lib/service-program.js` (`parsePeople`, `peopleOf`, `whoText`, `whoServes`; the shape and row carry personnel + auxiliary; the starter order is the church's own; `segmentRow` exported)
- `app/src/lib/service-actuals.js` (`clockLines`, `clockTotals`, `addedLine`, `trackRecord`, `SERVICE_TOLERANCE_MIN`, `saveActualTimes`; the blueprint carries the people forward)
- `app/src/components/ServiceProgram.jsx` (Key personnel + Auxiliary fields; the flow row says who; the "Who serves" panel; the "Actual times" and "Track record" chips; "Start from our order")
- `app/src/components/ServiceActuals.jsx` (Clock the service: minutes per line, a line that took place added where it happened, saved in one tap; `TrackRecord`)
- `app/src/__tests__/service-program.test.js` (+7), `app/src/__tests__/service-actuals.test.js` (+5), `app/src/__tests__/service-program-sections.test.jsx` (chips)

**Amends:** DR-0042-era Order of Service (0042: one owner_name per line), 0045 (the actual side: the clock form and the record ride its tables unchanged)
**Declared by:** Darrell, 2026-10-15, in four messages while the work was built

## Context

Darrell handed over his church's order of service, Prayer · Announcements · Choir, 1 song · Special events if we have one · Offering / Givers' Creed · Choir, 2 songs · Speaker · Benediction, and asked for three things: *"add the ability to add time to each section so any church can total their time and add key personnel to each task on the order of services list... or add a auxiliary"*; *"a tab that allows us to add the actual times to keep track of times we actually live up to that timeline on each Sunday and Wednesday"*; and *"add sections to the editable side of the Order of Services so we can show what took place based on reality... so the difference is obvious... The static Order can be updated by staff... however the other order of service is to see how well we are capable of living up to the Order our presiding Bishop has requested for the church."*

So there are two orders. The first is the Order the presiding Bishop asked for: the plan, edited by staff, with its time and its people. The second is what took place, line by line and minute by minute, with the sections that happened though they were not asked for, read against the first so every difference is plain, and kept across every Sunday and Wednesday so the church can see how well it lives up to the Bishop's order.

## What was measured

- **SHOULD / ARE (DR-0219):** `church_service_segments` (0042) already carried `planned_minutes` per line, and the header already totaled them ("N′ planned across M segments"); the time was built. People were one `owner_name` text box per line: one person, no group. The actual side (0045, `church_service_segment_actuals`) already recorded `actual_minutes`, `added` and `skipped` dispositions and a per-line variance, but entering them meant "Reconcile from plan" then opening each line's "Adjust" editor one at a time, and the chip was named "Actuals & blueprint" with video-harvest wording first. Nothing read across services: each program's actual stood alone.
- The starter order was a generic nine-line template with "Sermon"; the church's own order has eight lines and the Choir carries two of them.

## Impact

- Every line of the order names its key people (several) and, when a group carries it, its auxiliary (Choir, Ushers, Deacons; a short list offered, any name accepted). The flow row prints the sector, the auxiliary and the people. A "Who serves" panel under the flow totals each person's and each auxiliary's minutes and the lines they carry, so a church reads its people's load as plainly as the service's length; the header counts people and auxiliaries beside the minutes.
- "Actual times": every planned line beside a box for the minutes it really took, prefilled with what is recorded or the plan, a blank meaning it did not happen, and "Add a line that took place" for a section that was not on the order, placed after the line it followed. One tap saves every line, inserts the added sections as `added` rows, and stamps the service reconciled with the summed total. The deeper tools (songs sung, sermon preached, notes, the video harvest) stay below for the finalizer.
- "Track record": every clocked service newest first, its planned and actual totals, whether it kept the 75–90′ window, its drift from the plan, how many lines ran on time, what it skipped or added, and the line that drifted most; a keep rate and average drift per service type (Sunday, Wednesday); the streak from the newest service back. A service with no actual times is not a record and not a zero.
- The starter is the church's own order ("Start from our order"), the Speaker fixed so a reflow never compresses the Word, the Choir lines carrying the Choir. The blueprint that seeds next week carries the people and auxiliaries forward.
- RLS, realtime and the change trail are unchanged; the migration is additive and idempotent.

## Decision

1. **Every line of the order carries its time, its key personnel and its auxiliary.** `planned_minutes` was the time; `personnel` (a list of the church's own names) and `auxiliary` (the group carrying the line) are the people. The first key person doubles as the legacy `owner_name` so older readers keep a name.
2. **The order the Bishop asked for is the plan, edited by staff; what took place is recorded against it, never over it.** The actual order may carry sections the plan did not; a planned line with no actual reads as skipped once the service is clocked. The difference is the surface, not a footnote.
3. **The service runs 75 to 90 minutes, and both orders are read against that window.** Darrell: *"Services time needs to be between 1 hour and 15 minutes to 1 hour 30 minutes max."* `SERVICE_WINDOW` (75, 90): the plan's header says whether the order fits ("within 75–90′", or "7′ over the 90′ limit", or "15′ under the 75′ floor"); the clock form says the same of the clocked total; the track record counts a service kept only when its actual total is inside the window, and still reports its drift from the plan beside it. A line is on time within the existing two-minute tolerance.
4. **The starter order is the church's own**, as handed over, and the Word is never compressed by a reflow.

Not done, and said: a line's people are names, not roster links (no person record is created or looked up); the clock form does not yet take a real start and end clock per line (minutes only); the Bishop's order is not yet a named, separate template from "this Sunday's plan" (the plan is the order until edited). `re-review: 2026-10-22`, with the first two clocked Sundays and a Wednesday read from the live record.

## Verification

- **`service-program` (39):** `windowSay` reads 81′ as within, 97′ as 7′ over the limit, 60′ as 15′ under the floor; the church's own order fits and a padded Speaker does not. `parsePeople` splits and dedupes; the shape carries personnel + auxiliary and a pre-0292 row names its one owner; `whoText` prints auxiliary then people; `segmentRow` writes both and the first person as the owner; `whoServes` totals per person and per auxiliary (the Choir's two lines summed to 15′, case-folded) in the order's order; the flow carries `who`; the seed is the eight lines as handed over (81′, Speaker fixed, Choir on two, Ushers on the offering); 0292 adds two columns additively and backfills once.
- **`service-actuals` (+6, 35):** `clockLines` one per planned line with the recorded minutes; `clockTotals` sums and gives a delta only when complete; `addedLine` lands after the line it followed; `trackRecord` orders newest first, skips a plan-only service, reads kept / missed by the window (82′ kept with the Sermon 12′ long and the altar skipped; 92′ missed, 2′ over the limit, with a testimony added; a 60′ service that matched its short plan still missed, 15′ under the floor), per-type keep rates and average drift, the streak from the newest back.
- **`service-program-sections`:** the chips read "Actual times" and "Track record"; a non-editing viewer still never gets "Team & changes".
- **Proven to catch:** with the four code files stashed and the tests kept, the three suites fail (the new pins and the moved ones); restored, 77 pass across the four suites that read the Order of Service.
- Lint clean; the 20 gates green.
- **Live proof owed (DR-0107):** after the merge, db-migrate applies 0292 on hosted and the sovereign replay; the deploy's boot-check; then the first clocked Sunday on Darrell's Fold: the order with its people, the actual times saved in one tap, the track record's first row.
