# DR-1644: Every event lives on its day, perpetually

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** C (schema: migration 0343; a vendor-spend step in a timer-driven workflow; COLG-facing)
**Type:** decision
**Area:** `infra/supabase/migrations-auto/0343-every-event-lives-on-its-day.sql` (new), `infra/supabase/tests/0343-every-event-lives-on-its-day-smoke.sql` (new), `infra/nas-church-archive/church_calendar_reads.py` (new), `scripts/church-calendar-read.mjs` (new), `scripts/church-calendar-reads-over-tailnet.sh` (new), `.github/workflows/church-site-archive.yml`, `.github/workflows/rls-isolation.yml`, `app/src/lib/church-calendar-read.js` (new), `app/src/lib/church-calendar-office.js` (new), `app/src/lib/church-calendar.js`, `app/src/lib/church-calendar-sync.js`, `app/src/components/lovecorner/ChurchCalendar.jsx`, `ChurchCalendarTools.jsx`, `ChurchCalendarOffice.jsx` (new), `app/src/components/ChurchHome.jsx`, `app/src/index.css`
**Sent in by:** Darrell, 2026-11-24, with screenshots of the Times tab: "The events should show from the calendar for that specific day!!!!!!!! ... we prefer each event on their respective days inside the calendar... and the full calendar... Automatic Calendar update where it has something on a specific day... also only certain people can add to the calendar... office staff and sent in by minister leadership over units". Then, over the Battle Cry Sunday flyer: "This should be showing on that day... perpetually.... and staff should be able to reuse it with updated information.... just to see what happened last year for the congregation". Then: "We need to find the churches archives of event flyers etc... on the website or we can add through uploading".
**Pairs with:** DR-1550 (the office's website read into the app), DR-1585 (the calendar as event records), DR-1586 (the office's tools), DR-1596 (what the office posts is kept), DR-0076, DR-0060

## Context

The Times tab showed "Nothing is on the church calendar for this day" for Tuesday, November 24, 2026, while the office's own November calendar picture, a few inches below on the same screen, printed "9:00 AM NA Meeting - Café" in that square. The calendar's events were records only when someone typed them (2 on record). The pictures were kept by the daily reader (DR-1596) but nothing read their words onto days.

Two more findings while tracing it:

- **The daily reader had failed every scheduled run since it merged** (runs 4 to 7, 2026-11-20 to 23), at "join the tailnet": the runner's auth key had expired. Nothing was kept, which is why the archive said "Nothing is kept yet". Darrell restored the road on 2026-11-24 (an OAuth client, no expiring key).
- **Three headings on the calendar card were near-black on the near-black card** in the dark themes ("Tuesday, November 24, 2026 · today", "This time of year, in past years", the suggestion form's labels). `.cc-list-h`, `.cc-field`, `.ca-*` painted a fixed `#1a1815` on `var(--lc-paper)`, which the night themes repaint. `contrast-guard` checks the theme tokens and inline colors, not a stylesheet rule's fixed color on a theme-painted card, so it stayed green.

## Decision

1. **The office's pictures are read onto their days.** After the daily reader keeps what is new, it brings back from the NAS the archive's calendars and flyers not yet read (site, Wayback, office uploads), at most 6 a run, and asks a vision model to list what each prints. Every event is checked before it may be filed (`church-calendar-read.js`): a real day inside the picture's month (a flyer: a year either side), a name, not a weekly service the church record already shows on that weekday, one per name per day. What fails is dropped and counted, never repaired by guessing.
2. **Once per picture, insert only, forever.** `church_calendar_keep_read()` files a picture's events once (`church_calendar_reads` remembers it), never deletes or changes a row, never doubles an event already on its day, and reads only a picture the church archive already holds (its kind and place come from that row). An event the office removes does not come back on the next run.
3. **Perpetual.** Nothing here deletes the past; 0342's wall (a past calendar row is archived, never deleted) stands under every row. Each read event names its picture, and the day shows that picture from the church's own archive, so a flyer stays visible after the website takes it down.
4. **Who adds.** The office (owner/admin), and the unit leaders the office names (`church_calendar_leads`). A leader adds only for their own unit, through `church_calendar_post()`; the row says "Sent in by Choir leadership". Everyone else is refused by the database; the app shows the form only to someone it will accept.
5. **Use again.** Any office event offers "Use again" to someone who may add: the add form opens filled, 52 weeks later on the same weekday, every field editable, linked to the event it came from (`reused_from`). Last year's event stays on its own day.
6. **The archive from before.** The website road is the daily reader plus its Wayback mode (a dispatched backfill of past snapshots). The hand road is new: the office uploads a flyer, a month's calendar or a letter for a chosen month (`church_site_archive_upload()`, bytes first into its own church's folder only); the next run reads a calendar or flyer onto its days.
7. **The calendar's words follow the theme.** The fixed dark text moved to the Love Corner tokens; a new gate (`church-calendar-theme-text.test.js`) fails any calendar or archive rule that paints fixed text on the theme-painted card.

## Brakes (the AI-class read, CLAUDE.md three brakes)

- **Budget:** 6 pictures a run, one request each, `max_tokens` and a 180 s timeout on each; a picture is read once ever, so the spend is one request per picture the office posts. A run stops after two failures with nothing read.
- **Lock:** the workflow's existing concurrency group (one run at a time).
- **Kill-switch:** repository variable `CHURCH_CALENDAR_READ=off` skips reading; pictures are still kept. With no `ANTHROPIC_API_KEY` secret the run says so on its summary and reads nothing.

## Verified

- 0343 applied twice on a bare PostgreSQL 16 after 0099 and 0342; `CALENDAR DAYS SMOKE: PASS` and `CHURCH SITE ARCHIVE SMOKE: PASS`. Proven to catch: with the post door opened to everyone the smoke fails "a plain member added to the calendar"; with read-once removed it fails "the same picture must file once".
- Pull, read and file rehearsed end to end against a mock database and a mock model: 2 pictures pulled, 4 events filed, the second run "already" for both, the third pull finds nothing unread. The rehearsal caught a real bug (an "11:00 AM Worship" Sunday line slipped past the weekly-service check because the service is named "Sunday Worship"), fixed and pinned by a test.
- The theme gate fails on the stylesheet as it was before this change (12 rules) and passes after.

## Impact

- **If the reader is not armed, nothing changes for the congregation:** without the `ANTHROPIC_API_KEY` secret (or with `CHURCH_CALENDAR_READ=off`) the pictures are still kept, but no event reaches its day, and the run summary says so. Typed events, leaders and Use again work either way.
- **The read is only as good as the picture.** Every event passes the checks in `church-calendar-read.js`, but a misread name or time on a real day can pass them; the office removes it once and it never comes back. The first real read is the measurement (below).
- **This obligates the office to name its unit leaders** in the app; until it does, only the office adds.
- An event revised in a later version of the same month's picture is filed from both versions if its name or day changed; the office archives the stale one. `re-review: 2026-12-31`

## Outcome

- **After merge:** dispatch `church-site-archive.yml` (mode `site`) and read its summary: each picture's events and what was left out, against the November 2026 calendar as printed (the NA Meeting on Tue Nov 24, Battle Cry Sunday on Nov 15, Communion on Nov 29). Then mode `wayback` once to recover past months, read 6 a day. `re-review: 2026-11-27`
- Proven to catch, in CI: the 0343 smoke (two walls broken on purpose), the reader's checks, and the theme-text gate on the old stylesheet.
