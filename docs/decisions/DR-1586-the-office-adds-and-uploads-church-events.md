# DR-1586: The office adds church events one at a time or from a file, and anyone downloads the calendar

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (writes to an existing table through its existing owner/admin write policies; no schema, no new route, no money)
**Type:** decision
**Area:** `app/src/lib/church-calendar-file.js`, `app/src/lib/church-calendar-sync.js`, `app/src/components/lovecorner/ChurchCalendarTools.jsx`, `app/src/components/lovecorner/ChurchCalendar.jsx`, `app/src/components/ChurchHome.jsx`, `app/src/index.css`
**Sent in by:** Darrell, 2026-11-18: *"Calendar that is there made as an upload/events to add to and for the church Calendar inside the church app... make sense?"* and *"Make sure historical events are also populated so users and office staff can review."*
**Pairs with:** DR-1585 (the calendar is event records; the store), DR-0060 (RLS is the tenancy gate), DR-0076 (never guessed), DR-0691 (copy and behavior tested together), DR-1053 (unknown is not a yes), DATA-AS-EMPOWERMENT commitment 3 (exportable always)

## Context

DR-1585 made the calendar read event records, including rows the church office files. Nothing in the app let the office file one.

## What was measured

- **The write gate already exists.** `ministry_ops` insert, update and delete are owner/admin of the church instance only (migration 0099). The client check decides only what to show.
- **The upload format.** The office keeps its calendar in spreadsheets and documents. CSV is the one file every spreadsheet writes. An .ics reader was considered and left out: it adds recurrence rules and time zones the record does not hold, and no .ics from the church exists to test against. `re-review: 2026-12-17`, when the office has used the upload.
- **History on record in the repository is 2026 only** (DR-1585). The upload is the path for earlier years; no historical event was seeded, because none could be traced to a real record.

## Impact

The church office (owner or admin of the church instance) can put an event, or a whole year of them, on the calendar from the app, and every signed-in member of that church sees it. Members see no form. Anyone can take the calendar away as a file. A mistaken upload cannot land silently: nothing is filed until the count is confirmed, and each filed event can be removed. Ops items are untouched.

## Decision

1. **Add an event:** a form (name, date, optional last day, time, place, note) shown to the church office only. An event already on the calendar that day under the same name is not added twice.
2. **Upload events:** a CSV whose first row names the columns; `date` and `name` required, `end_date`, `time`, `place`, `note` optional, in any order, under the names a spreadsheet might use. Dates read as `2026-11-21` or `11/21/2026` and nothing else.
3. **Choosing a file files nothing.** It shows how many events are ready, how many are already on the calendar (left alone), and every row not read with its line number and the reason. The button that files them names the count. "Cancel, add nothing" adds nothing.
4. **A row that cannot be read is rejected, never repaired.** A date that is not a real day is not rolled to another day. A file with no header, an unclosed quote, more than 1,000 events or more than 512 KB is refused whole.
5. **Every filed row carries the office's resolved church instance**; with no church resolved, signed out, or the church unreachable, nothing is sent. Writes are bounded at twelve seconds per batch of 200, and a partial upload says how many went in.
6. **Remove** shows on office-filed events only, to the office only, and takes two presses; the delete names the row and the calendar ministry, so it cannot delete an ops item.
7. **Download** is for everyone: the dated events as CSV in the upload's own columns, so a download can be edited and uploaded back. Cells that a spreadsheet would run as a formula are written as text. A blank template holds the column names and no event.

## Verification

`church-calendar-file.test.js`, 17 cases: quoted cells, doubled quotes, line breaks in quotes, CRLF, BOM; both date forms and six refused forms; column aliases in any order; six malformed rows each rejected with line and reason while the good row is read; whole-file refusals; duplicates left alone; download reading back to the same events; formula cells neutralised; the filed row's exact shape; nothing sent with no church, signed out, or unreachable; refusal and a mid-upload stall reported with the count; the delete's two filters; owner and admin only. `church-calendar-tools.test.jsx`, 13 cases with taps: member sees no form; add; duplicate refused; refusal keeps what was typed; choosing a file calls nothing; Cancel calls nothing; two-press remove. **Proven to catch:** letting a bad date roll forward turns three cases red; defaulting the church instance turns one red. Files restored after each.

**Measured in Chromium at 360px wide** (harness with the app stylesheet): every button and field at least 44 by 44 with the add and the upload forms open, nothing off the right edge, no page-level sideways scroll, at 1x and 2.75x.

**Not verified:** a real write to the NAS database as a church office account, the live site, and a real phone. The first real add by the office is the proof; if the database refuses it the surface says so.
