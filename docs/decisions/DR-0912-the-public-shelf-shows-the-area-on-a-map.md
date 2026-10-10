# DR-0912 — The public shelf shows the area on a map, and what is nearby, never the street

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: the no-account listing, the door editor (migration 0270)
**Principle:** DR-0910 (the street is never on the open shelf), DR-0076 (measure, don't claim), DR-0100 (state established fact plainly)

## Context

Darrell, 2026-10-10, on the no-account listing for 805 N Prospect Apt 2:

> "Just show the location without the address... make sense... map view..."

> "How many miles away from the UIUC campus is the apartment... less than 5 miles I believe... however figure it out... make sense?"

> "And highway is less than a quarter mile... etc..."

> "Shops... etc..."

**SHOULD.** A stranger sees where a place is: the area on a map and real distances to campus, the highway, town and the shops. They never see the street (DR-0910). The family sets it without the street ever leaving their hands.

## What was measured

- **The distances** (`docs/99-session-notes/2026-10-10-805-north-prospect-whats-nearby.md`).
  - **Method:** straight-line from the parcel point 40.123364, -88.25828, checked against the street centerline and the MTD stops either side. Sources: MTD GTFS, Overture Maps 2026-09-23.1, Wikipedia.
  - **Campus:** about 1.7 mi to the nearest edge (ECE Building) and about 2.0 mi to the Main Quad. "Less than 5 miles" is true; "about 2 miles" is the accurate figure.
  - **Highway:** North Prospect Avenue is US-150, so the door is on a US highway. The interstate (I-74, Exit 181) is about 0.7 mi away, not under a quarter mile.
  - **Shops:** Target 1.3 mi, Meijer 1.5 mi, Schnucks 1.2 mi.
- **The code reproduces the research.** `nearbyFrom()` computes exactly those figures from the same point. The test pins them.
- **Where the exact point could leak.** The database could hold it, the page could print it, or the request could carry it. The smoke covers the database, and the unit test and the browser journey (C2) cover the page and the request.

## Impact

The listing answers "where is it" with a map and measured miles, and still never hands a stranger the street. The two figures Darrell estimated are now on the record with their measured values: campus about 2 mi; the interstate about 0.7 mi.

## Decision

1. **Migration 0270.** `rentals.area_lat`, `area_lng` and `nearby`.
   - **Rounding.** The trigger `rentals_area_rounded` snaps the area to a 0.005-degree grid, about 550 m by 425 m at Champaign. The house can be anywhere in its cell, at most about 350 m from the stored point, and the listing's circle has a 600 m radius. So the house is always inside the circle and never pinpointed. Nobody can read back the exact point, family included, because it is never stored.
   - **Nearby shape.** `nearby` holds at most 12 lines of `{label, miles}`. Each label is 1 to 80 characters, miles run from 0 to 100, and no other keys are allowed (no coordinate rides in).
   - **The street.** A line containing the door's street name is refused.
   - **Area without the other half.** A latitude without a longitude, or the reverse, is refused.
   - **The shelf.** `public_vacancies()` is dropped and recreated to return the area, rounded again on the way out, and the lines.
2. **The device does the rounding** (`area.js`). The family pastes a point from any map app: plain coordinates, or a Google Maps link with `@lat,lng` or `q=`. The distances are worked out from the exact point once, and only the rounded area is sent. Nothing is geocoded, so the street is never sent to a search service.
3. **The places.** Twelve cited places, chosen so none is cut by the 12-line cap: the Main Quad, the ECE Building, Parkland, I-74 Exit 181, downtown, Illinois Terminal, Target, Meijer, Schnucks, Carle, OSF Sacred Heart, and Willard Airport.
   - A door more than 15 miles from a place gets no line for it, so a Danville door gets none.
   - No place label names a street; a test enforces it.
   - The family can take lines off and add their own. A line naming the street is flagged before saving and refused by the database.
4. **The map is no library.** It draws OpenStreetMap tiles at zoom 14 (5 x 3 `<img>` tiles) with one SVG circle and visible attribution, as the OSM tile policy requires.
   - The screen reader hears "Map of the area in Champaign, Illinois. The place is inside the circle, about 0.7 miles across. The street is not shown."
   - The CSP already allows `https:` images.
   - The end-to-end run answers tile requests itself, so CI never calls OpenStreetMap.
5. **The new columns are read on their own** (`loadDoorArea`), never added to the main `rentals` read. Deploy and db-migrate run side by side, and the 2026-10-10 local run showed that the main read failing on a column the database lacks costs every family read.
6. **Not published, by the research's own verdict:** the MTD bus routes, because the feed predates the 2026-08-09 service change, and the driving times, because they come from the next-door listing.
   - The family can add either as their own line once checked.
   - **re-review: 2026-10-24** (verify the routes at mtd.org).

## Verification

- **The smoke** (`infra/supabase/tests/0270-area-map-smoke.sql`) passes locally on a database built by `scripts/e2e/build-door-db.sh`. **Proven to catch:** each break fails it by name.
  - rounding removed → "the exact point was kept"
  - both-or-neither dropped → "a latitude with no longitude"
  - the shape CHECK dropped → "nearby that is not a list"
  - the street rule removed → "a nearby line that names this door's street"
  - the label checks removed → "a nearby line with no words"
- **vitest** `the-public-shelf-shows-the-area-on-a-map.test.jsx`, 15 tests. It covers rounding, the paste formats, the distances against the research, no street in any place label, the map's 15 tiles and its 82 px circle, the card printing no coordinate, the editor saving only `40.125, -88.26`, a street line blocking the save, and an unreadable area offering nothing to overwrite.
  - **Proven to catch:** with the street rule disabled, 2 tests fail; with rounding disabled, 2 tests fail.
- **End to end** (DR-0911):
  - **E1:** the family pastes a Google Maps link in the real door editor and saves. The database reads `40.12500,-88.26000` and 12 lines, the first "I-74 at Exit 181".
  - **C2:** the next stranger sees 15 tiles and "University of Illinois Main Quad about 2.0 mi". The page source holds neither the street nor `40.1233` / `88.2582`.
  - **The fifth fault** (`--break=area`: the trigger refuses every area) fails E1, as it must.
- **Screenshots read:**
  - `E1-area-editor.png`: the circle, the twelve lines, "Only the area is saved".
  - `C2-area-map.png`: the circle above "What's nearby · straight-line", and no street on the card.
