# DR-1585: The church calendar is event records, not only a picture

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A for this slice (reads an existing table through existing RLS; no schema, no new route, no money). The office write path and the upload follow in their own change and are named below.
**Type:** decision
**Area:** `app/src/lib/church-calendar.js`, `app/src/lib/church-calendar-sync.js`, `app/src/components/lovecorner/ChurchCalendar.jsx`, `app/src/components/ChurchHome.jsx`, `app/src/lib/ministry-ops-sync.js`, `app/src/index.css`
**Sent in by:** Darrell, 2026-11-18/19, with a screenshot of the Times tab's month calendar: *"Larger text doesn't enlarge the fonts on the images.... or documents"*; *"Calendar that is there made as an upload/events to add to and for the church Calendar inside the church app"*; *"Calendar connects the week days when clicked shows that day this week or a button to see the month year"*; *"Make sure historical events are also populated so users and office staff can review... feedback when it matters... so we can plan as a team."*
**Pairs with:** DR-1550 (the office's picture, read from the church website; kept), DR-0060 (RLS is the tenancy gate), DR-0061 (a surface is a view of real state), DR-0076 (never painted, measured), DR-1053 (a read that could not be made is not a no)

## Context

The month's calendar on the church screen was one picture from the church website. A picture does not grow with the text-size setting, cannot be tapped by day, and cannot be added to.

## What was measured

- **Real records that already exist:** the church record's `announcedEvents` (two, both 2026: the 77th National Assembly, Jul 14 to 16, and Gospel Fest, Aug 29; `lib/default-church.js`) and its three weekly `services`.
- **No church event table exists.** Church projects are device-local; `church_voice` and `inquiries` are household-scoped and never reach the office.
- **One existing store is church-scoped, office-writable and member-readable:** `ministry_ops` (migration 0099): `instance_id`, `title`, `detail`, a `date` column with no weekday check, `member_visible`; owner/admin write, members read visible rows.
- **History in the repository is thin.** Nothing dated before 2026 for the church's calendar is on record anywhere in the repo. None is invented.
- **Text size** sets the root font size (`lib/text-size.js`), so rem sizes scale and pictures do not.

## Impact

Everyone who opens Church, Times sees the week and the month as text that grows with the text-size setting, and can tap any day. Signed-in members of the church also see events the office has filed; signed out, the church record's own events and services still show, and the surface says the office's are missing. Nothing changes for the Ministry Ops board except that calendar rows no longer appear on it. No one's saved calendar entries are touched.

## Decision

1. **A calendar event is a record:** name, date, optional last day, time, place, note, and its source (`announced`, `office`, `service`). Pure model in `lib/church-calendar.js`; a row with no real date is dropped and counted, never guessed.
2. **Office-added events are `ministry_ops` rows filed under `ministry = 'calendar'`**, dated in `week_of`, with time, place and last day as plain labelled lines in `detail`. No schema change, so it is live for every member the day the office writes one. Scope is the church instance, not the user. The Ministry Ops board excludes these rows.
3. **The read names the reader's own church instance and the calendar ministry**, runs only when signed in and only when the church home is the church the app resolves an instance for, and is bounded at eight seconds. Signed out, failed and loading each say so on the surface.
4. **The surface, on the Times tab above the office's picture:** a This-week strip of seven day buttons (Sunday to Saturday); the tapped day's services and events as text; a "Month and year" button opening a month grid that moves by month and by year; "+ Calendar" on each dated event through the existing save path. The existing Parish Life "+ Calendar" and "Add all" buttons are untouched.
5. **The picture stays** as the office's own document.

## Not built in this change, each with its next step

- **Office add and file upload (CSV), with a download of the same file** (exportable always, DATA-AS-EMPOWERMENT commitment 3): next change, same store.
- **Past years, browsable, and "this time last year":** the month and year navigation already reaches any year; it shows what is on record, which today is 2026 only. Earlier years arrive through the office's upload. Next change adds the last-year look-ahead.
- **A parishioner's suggestion reaching the office:** no existing channel carries a member's words to the church office in the database. Decided in the change that builds it.
- **A dedicated `church_events` table** would be the cleaner home than a filed ministry in `ministry_ops`. Not needed to ship, and a schema change is Tier B. `re-review: 2026-12-17`, or sooner if the office's rows outgrow the shape.
- **The month grid at the two largest text sizes scrolls sideways inside its own box** (seven columns of 44px-or-larger cells do not fit 360px). The week strip wraps instead, and the events list under the grid is plain text. `re-review: 2026-12-03`.

## Verification

`church-calendar.test.js`, 23 cases: real and unreal dates; the Sunday week start across a year end; the two announced events read unchanged; office rows round-tripping time, place and last day; non-calendar and undated rows excluded; the week strip's seven keys and counts from the real church record (1, 0, 0, 2, 0, 0, 0 for the week of 2026-11-15); a multi-day event on each day it covers; month shifts across year ends; November 2026 and leap February laid out; the read naming `instance_id` and the ministry, asking nothing when signed out or with no church, and reporting unavailable on error, stall and throw. **Proven to catch:** dropping the weekday match in `servicesOnDate` turns three cases red. `church-calendar-surface.test.jsx`, 8 cases, taps included. Neighbours green: `church-office-board`, `tenancy-guard`.

**Measured in Chromium at 360px wide** (component in a harness with the app stylesheet, not the live site): all buttons at least 44 by 44; no page-level sideways scroll at 1x, 1.5x and 2.75x; all seven days visible at 1x; event name text 16px, 24px and 44px at those three sizes. **Not verified:** the live site, a signed-in read against the NAS database, and a real phone. After merge: the live look on the church door (DR-0104).
