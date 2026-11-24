# 2026-11-24 — Every event lives on its day (DR-1628)

**Asked (Darrell, with Times-tab screenshots):** events from the office's calendar on their own days, automatically; the full calendar too; only the office and unit leadership add; a flyer's event (Battle Cry Sunday) shown on its day perpetually and reusable with this year's details; the church's past flyers found on the website or uploaded.

## Reality trace

- **Real data:** `ministry_ops` calendar rows (0099) — 2 on record, both typed. The office's November picture is kept by the daily reader into `church_site_archive` (0342), but nothing read its words onto days.
- **The daily reader was red since it merged.** Runs 4–7 (2026-11-20 to 23) died at "join the tailnet": the auth key had expired. Darrell restored the road the same day (OAuth client, no expiring key). Nothing had been kept, which is why the archive said "Nothing is kept yet".
- **The surface he used:** Times tab, dark theme. Three headings were near-black on the near-black card (measured 1.07:1).

## What changed

| Piece | File |
| --- | --- |
| Source marks, unit leaders, the post door, the read-once door, office uploads | `infra/supabase/migrations-auto/0343-every-event-lives-on-its-day.sql` + smoke |
| NAS: pull unread pictures, file what was read | `infra/nas-church-archive/church_calendar_reads.py` |
| Runner: read each picture once, check every event | `scripts/church-calendar-read.mjs`, `app/src/lib/church-calendar-read.js` |
| Road | `scripts/church-calendar-reads-over-tailnet.sh`, three steps in `church-site-archive.yml` |
| App: source line, See the flyer, Use again, leaders send in, office panel | `ChurchCalendar.jsx`, `ChurchCalendarTools.jsx`, `ChurchCalendarOffice.jsx` (new), `ChurchHome.jsx`, `church-calendar*.js` |
| Dark-theme text + its gate | `index.css`, `church-calendar-theme-text.test.js` |

## Evidence

- 0343 applied twice on PostgreSQL 16; `CALENDAR DAYS SMOKE: PASS`, `CHURCH SITE ARCHIVE SMOKE: PASS`. Two walls broken on purpose; the smoke caught both.
- Pull → read → file rehearsed on a mock database and model: 4 events filed, the second run "already", the third pull empty. Caught and fixed: "11:00 AM Worship" on a Sunday slipped past the weekly-service check.
- New tests: 12 (reader), 26 (days, leaders, uploads, data layer), 3 (theme gate, proven on the old stylesheet).
- Chromium, midnight theme, the real component and stylesheet: the day heading 1.07:1 → 16.21:1; no sideways scroll at 412 px.
- `verify:gates`: every gate OK except `lesson-dates:check`, which needs full git history (this clone is shallow; no lesson was touched; CI has the history).

## Not yet measured

- The model's read of the real November 2026 picture (no API key in the sandbox). After merge: dispatch `church-site-archive.yml` and read its summary. `re-review: 2026-11-27`
- The Wayback backfill (`mode: wayback`) to recover past months' calendars and flyers; each recovered picture is then read 6 a day.
