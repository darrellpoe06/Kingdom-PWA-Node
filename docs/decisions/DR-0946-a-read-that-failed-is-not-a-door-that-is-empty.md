# DR-0946 — A read that failed is not a door that is empty

**Date:** 2026-10-10 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `app/src/modules/properties/PropertiesApp.jsx` (`loadDoorData`), `DoorTabs.jsx` (`GalleryTab`)
**Gate:** `app/src/__tests__/an-unread-door-does-not-say-empty.test.jsx`

## Context

Darrell, 2026-10-10: **"What happened to the pictures in Apartment 2?!!!!!!!"**

## What was measured

`site-health` run 1542 in the same window: `PAGES_CODE 200`, `BACKEND_CODE 200`,
`SERVED 15bb269` matching main. `db-migrate` 666 succeeded. A read of the live
database counted all of the door's photographs, untouched.

In `loadDoorData`, all seven door reads did `x.ok ? x.rows : []`. A **failed**
read became an **empty list**, and the gallery then printed "No pictures on
this property yet." The photo list carries `thumb_path` — a base64 data URL —
so a full gallery is about a megabyte in one response, and with Pages
Functions dark (#2057) the app runs on the absolute Funnel URL, which
throttles cross-origin. The read fails; the rows are untouched on the NAS.

## Impact

The app **invented an absence and presented it as fact**, on a landlord's
move-out evidence — the records a deposit dispute turns on. This is DR-0876's
failure arriving on the surface where it costs most. It also wastes the
owner's time hunting for data that never moved.

## Decision

`loadDoorData` reports which reads failed; the gallery says so in the red
register — "These could not be loaded just now — that is not the same as there
being none. Nothing has been lost" — and never shows the empty state for a
door it could not read. RLS withholding by returning `[]` is precisely why a
failure must be told apart from it: "you may not see these" and "I could not
ask" are both different from "there are none".

## Verification

Proven to catch: removing the unread signal fails two cases. The guarantee is
preserved, not suppressed — a door that really is empty still says so.
1174 green; eslint clean. **re-review: 2026-10-17.**
