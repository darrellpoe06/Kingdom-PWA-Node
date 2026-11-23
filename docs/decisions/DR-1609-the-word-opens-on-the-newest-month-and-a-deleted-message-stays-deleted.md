# DR-1609: The Word opens on the newest month, and a deleted message stays deleted

**Date:** 2026-11-23
**Status:** Accepted
**Tier:** A (app surface; one additive migration; one NAS rider filter)
**Type:** fix
**Area:** The Word (`Pulpit.jsx`), the shared filing office (`RecordsLog.jsx`), `infra/nas-supabase/content_sync.py`, migration 0340
**Pairs with:** DR-1606 (Learn opens on Latest), DR-0061 (surfaces are live views), DR-0076

## Context

Darrell, 2026-11-19, on The Word: *"Fix the Word tab so all months can collapse and open... initially have all videos be the default with months showing and only the latest month or video open so the new users can tell."* Then: *"Letting users know we have videos all the way back to 2014 with a glance and a scroll."* And: *"my private edited [message]... when I deleted it it never leaves... fix it too."*

## What was measured

- `RecordsLog.jsx` on main 136786f kept a `collapsed` Set that began empty, so every month opened at once, and The Word opened on the newest month alone, not All. Nothing on the page said how far back the library goes.
- The app's delete of a `choir_sermons` row works (0011's owner/admin delete policy; realtime refreshes the list). But `content_sync.py` (services.json `content-sync`, every 6 hours, `--commit`) inserts into sovereign every content row the hosted project holds and sovereign lacks, by primary key. A row deleted on sovereign is exactly such a row, so the next run put it back.

## Decision

1. **The Word opens on All, every month a folder, only the newest open.** `RecordsLog` takes `defaultPeriod`, `openNewestOnly` and `yearIndex`. Newest is the month holding the latest record by date, whatever the sort. Each month opens and closes; "Open all months / Close all months" does both at once. A single month always stays open. Other filing offices keep today's behaviour (all props default off).
2. **The span at a glance.** A line above the months, "Every message from October 2014 to November 2026 · N in all", read from the records themselves, and a strip of year chips: a tap opens that year's months and scrolls to the first.
3. **A deleted message stays deleted.** Migration 0340 adds `content_tombstones (table_name, row_id)`, closed to anon and authenticated. An AFTER DELETE trigger on `choir_sermons` writes the tombstone; an AFTER INSERT trigger clears it, so a deliberate restore of the same id is never blocked. `content_sync.py` drops every planned insert whose id is tombstoned and reports `deleted_held_back`. If the table cannot be read, the run says so (`tombstones_unread`) and carries on as before.

## Verification

`records-log-render.test.jsx` gains 8 cases: opens on All with only the newest open; each month toggles; newest by date under an oldest-first sort; Open/Close all; one month stays open; the span line and a year chip opening 2023; no year strip unless asked; The Word passes the props. Four fail with the RecordsLog change reverted. `content_sync.py --selftest` 61/61, two new checks on the filter. Lint clean.

## Not done

The draft Darrell already deleted was put back before the tombstone existed, so it has to be deleted once more after this lands and 0340 applies; from then on it stays gone. The tombstone covers `content_sync` only. The YouTube loaders key on `video_id` and could still re-add a deleted published video; none has been reported. `re-review: 2026-12-07`.
