# DR-1587: The calendar looks back at past years, and a parishioner can say something while it still matters

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (pure derivations over the calendar's records; suggestions ride the existing feedback list; no schema, no new route, no money)
**Type:** decision
**Area:** `app/src/lib/church-calendar.js`, `app/src/components/lovecorner/ChurchCalendarPlanning.jsx`, `app/src/components/ChurchHome.jsx`, `app/src/poe-financial-mvp-v28.jsx` (two props on one existing line), `app/src/index.css`
**Sent in by:** Darrell, 2026-11-18: *"Make sure historical events are also populated so users and office staff can review and so can parishioners so they can expect what will potentially be this year and maybe suggest something before it's too late... feedback when it matters... so we can plan as a team."*
**Pairs with:** DR-1575 (landed the same day: the office's pictures now enlarge with the text-size step, so DR-1585's line that a picture "does not grow" is true of its lettering only; the picture still cannot be tapped by day or added to, which is what the records are for), DR-1585 (event records), DR-1586 (the office's upload, which is how past years arrive), DR-0076 (never invented), DR-0061 (a surface is a view of real state)

## Context

The month and year view (DR-1585) already reaches any year. Nothing told a reader what past years held at the time of year now coming up, and nothing let a parishioner say so to anyone.

## What was measured

- **Past years on record: none.** Every dated church event in the repository is from 2026: the two `announcedEvents` (77th National Assembly, Jul 14 to 16; Gospel Fest, Aug 29). The church-site digest carries the current month's picture, a letter and flyers, with no dates as text. The Assembly program (`assembly-program-2026.js`) is the same 2026 event. No earlier year could be traced to a real record, so **no historical event is seeded.**
- **No channel in the database carries a member's words to the church office.** `church_voice` and `inquiries` are household-scoped. The one pipe that crosses instances is the feedback list (`addFeedback` then `uploadFeedback`), already used the same way for class interest (`lib/church-classes.js`, a text tag and an extractor).
- **Signed out, `uploadFeedback` sends nothing**, so a signed-out suggestion would stay on the device.

## Impact

Staff and parishioners see, on the calendar itself, what earlier years held at the time of year now coming up, once earlier years are on record; today the section says none are. A signed-in parishioner can send a suggestion or a comment about an event in time for it to matter, and gets a reference for it. The feedback list gains rows tagged as calendar suggestions; nothing else in it changes.

## Decision

1. **"This time of year, in past years"**: every event from a year before today's whose same month and day falls from today through 60 days ahead, with the year it was held, how long ago, and the date it would fall on this time round. The window crosses a year end; February 29 lands on February 28 where there is none. This year's own events are never listed as past.
2. **It is the record, not a promise.** The words say "Held" with the year, and that the event "is not on this year's calendar unless it is listed above." Nothing says it will happen.
3. **When no past year is on record the section says so** and names how it gets filled: the office's upload. It lists the years that are on record with their counts. No example event is shown.
4. **A suggestion** is one row in the app's existing feedback list, area `church`, marked `[Calendar suggestion]`, carrying who (optional), what it is about (a new idea, an upcoming event, or a past-year event) and the words. The surface says where it went and gives the row's reference.
5. **Signed out, there is no form.** The surface says a suggestion would reach no one.
6. **The office sees "Suggestions received"**: the tagged rows in the feedback list that account can read.

## Open, with dates

- **Whether a church office account that is not a platform steward can read another member's feedback row** depends on the feedback table's read policy and was not exercised here. If it cannot, suggestions still reach the stewards' feedback review, and a church-scoped suggestion row becomes the next change. `re-review: 2026-12-03`, at the first real suggestion.
- **Past years stay empty until the office uploads them.** `re-review: 2026-12-17`: if none has arrived, ask the office for last year's calendars.

## Verification

`church-calendar-planning.test.jsx`, 14 cases: the 60-day window, soonest first, with years ago; yesterday's date last year and this year's own events excluded; the year-end crossing and February 29; the church's real record yielding nothing from past years and `2026 (2)` on record; the next 90 days including a running multi-day event; the suggestion line and its extraction (tagged rows only, each once, newest first, words containing the separator kept whole); the empty state's words; "Held ... (last year)" and no promise wording; signed out, no form; a sent suggestion's exact payload and reference; empty words sending nothing; a failed send keeping the words; the office's received list, and none for a member. **Proven to catch:** dropping the past-year check turns the exclusion case red. Fixture events in the tests are named "Fixture" and ship nowhere in the app.

**Not verified:** a real suggestion arriving in the feedback list on the live site, and a real phone.

**Measured in Chromium at 360px wide** (harness with the app stylesheet): the form's select, text box, name field and Send button each at least 44px tall, nothing off the right edge, no page-level sideways scroll at 1x and 2.75x; the empty-state text 13.6px at 1x and 37.4px at 2.75x.
