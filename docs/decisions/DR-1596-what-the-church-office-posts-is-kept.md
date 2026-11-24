# DR-1596: What the church office posts is kept, by month, without the office archiving anything

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (a new table and private bucket, a daily timer-driven reader, a change to what the office's Remove does; congregation-facing; no money, no personal data)
**Type:** decision
**Area:** `infra/supabase/migrations-auto/0342-what-the-church-office-posts-is-kept.sql` + `infra/supabase/tests/0342-church-site-archive-smoke.sql`; `.github/workflows/church-site-archive.yml`, `scripts/church-site-archive-collect.mjs`, `scripts/church-site-archive-over-tailnet.sh`, `infra/nas-church-archive/church_archive_keep.py`; `app/src/lib/church-archive.js`, `church-archive-sync.js`, `church-calendar.js`, `church-calendar-sync.js`; `app/src/components/lovecorner/ChurchArchive.jsx`, `ChurchCalendar.jsx`, `ChurchCalendarPlanning.jsx`, `ChurchHome.jsx`
**Sent in by:** Darrell, 2026-11-19, after DR-1595: *"We like to keep historical events and activities etc..."* and *"Why does the office only have today forward... because they don't want to need to archive it... we can inside the Love Corner App because it's automated!?!!!!!!!"*
**Pairs with:** DR-1550 (the site read into the app), DR-1585/1586/1587 (the calendar as records, the office's tools, past years), DR-1595 (Parish Life's Past events), DR-0076, DR-0060, the three-brakes rule as amended 2026-07-29 (DR-0247/0248)

## Context

The church website shows one month's calendar picture, the latest Letter from BG and the current flyers (measured by `church-site-probe.yml`, DR-1550). Each is replaced when the next goes up, so last month's is gone. The office shows only what is current because archiving by hand is work. The app read the site live and kept nothing. The office's Remove on a calendar event deleted the row, whether or not the event had already happened.

## Decision

1. **Kept automatically, daily.** `church-site-archive.yml` runs once a day (10:23 UTC). A runner reads the four pages (calendar, letters, current events, previous events) with the app's own parser, downloads each picture, checks from its bytes that it is a picture, and hashes it. On the NAS, over the tailnet road the deploy uses, `church_archive_keep.py` stores the bytes in the private `church-archive` bucket at `<instance>/<sha256>` and records one row through `church_site_archive_keep()`, which only the service role may call.
2. **One copy per content.** `(instance_id, sha256)` is unique: a picture posted again, under any name, is the same row. Its `last_seen_at` moves. An earlier sighting moves `first_seen_at` back.
3. **The month it was for, never guessed.** A calendar's month comes from its file name or the page heading. A letter's comes from its file name. A flyer's comes from its file name when it names one; otherwise it is the month the reader first saw it, and the row records `month_from = 'first-seen'`.
4. **Seen in the app.** Times → the church calendar → "The archive", by year then month ("November 2026: the calendar, the letter, 3 flyers"). Each month opens to its pictures, which open full size at the reader's text-size step (DR-1575). The words are rem and grow with text size. The past-years section has a button to it. Members of the church read it (RLS `user_in_instance`). Only the office (owner/admin) may delete a row or an object. Nobody but the reader writes.
5. **Nothing disappears by accident.** The office's Remove now calls `church_calendar_remove()`:
   - An event that **began before today** (the church's day, America/Chicago) is **archived**. It goes off the calendar's views, the archive lists it under its month, and the row keeps `archived_at`, `archived_by` and an `audit_log` row.
   - An event from **today on** is **deleted**, so a post made by mistake still goes.
   - A `BEFORE DELETE` trigger refuses a direct delete of a past calendar row. A cascade from deleting the whole instance is let through.
   - The button says "Archive" for a past event and "Remove" for a future one.
   - Until 0342 applies, the client deletes only a future event and refuses a past one.
6. **Brakes, as amended.** The class is timer-driven and deterministic, so it starts by merge. Budget: a 30-minute job timeout, a timeout on every request, 60 pictures a run (400 in a backfill), 12 MB a picture. Lock: one run at a time. Stop path: disable the workflow. It reads a public site and writes only to our own store.
7. **Recovering what came before.** Dispatching the workflow with `mode: wayback` reads the same pages as the Internet Archive captured them (up to 40 snapshots a page). It keeps each picture it can still fetch from the site or the Archive, dated by the snapshot and marked `found_via = 'wayback'`.

8. **Where the smoke runs.** It runs in the new workflow's `walls` job on a bare PostgreSQL for every pull request that touches 0342. It is also one new leg of `rls-isolation.yml` against the real database, because `rls-isolation-matrix-guard` fails any smoke that no leg runs. That leg is one matrix entry. `ci.yml`, `auto-merge.yml` and the deploy lane are unchanged, since another session is reworking them.

## What was measured

| what | measured |
| --- | --- |
| 0342 applied twice on PostgreSQL 16 and the smoke | `CHURCH SITE ARCHIVE SMOKE: PASS` |
| proven to catch: Remove deletes a past event | smoke raises `a past event removed by the office must be archived, got deleted` |
| proven to catch: no content key | smoke fails on the keep |
| collector → keeper → mock kong, run twice | day 1 `kept=2`, day 2 `kept=0 seen=2`; a row before its bytes is refused |
| Vitest | `church-archive-keeps-history` and `church-archive-surface` (same flyer twice is one item; a past event removed is still in history; the words and the press tested together); the existing calendar suites green |

## Not done

- **Not yet read live.** The sandbox has no route to the site or the NAS. The first scheduled run, or a dispatch, is the first live reading, and `re-review: 2026-11-21` reads its log.
- **Before the first read, nothing is kept.** Only what the Internet Archive captured can be recovered, through one `wayback` dispatch.
- **Not wired yet:**
  - Parish Life's Past events does not link to the archive. That waits for #2809 to merge, to avoid a conflict.
  - There is no office delete button. RLS allows it.
  - `re-review: 2026-11-26` for both.

## Verification

On merge: the PR, its squash SHA, the deploy run on main's head, `site-health.yml`, the db-migrate run applying 0342, and the first `church-site-archive.yml` run's `ARCHIVE-RESULT` line.
