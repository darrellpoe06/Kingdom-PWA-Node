# DR-1015: The lane places the doors — every door with an address advertises its area and amenities, with no phone session involved

**Date:** 2026-10-14
**Status:** accepted
**Tier:** C (a runner writes to the database the app reads; bounded, single-instance, pausable; proven by the first run on 805 and the bed's card)
**Type:** orchestration
**Area:**
- `scripts/place-doors.mjs` (`doorsFromJson`, `placeDoors` with the app's own `placeDoorsOnTheMap`, `updatesSql`: one guarded UPDATE per placed door, the same note the app's edit path writes)
- `scripts/place-doors-over-tailnet.sh` (read the doors with no area from the sovereign database, place them on the runner, write them back one statement at a time; every count said)
- `.github/workflows/place-doors.yml` (dispatch; dispatched by the deploy after success; budget, lock, kill)
- `.github/workflows/deploy-cloudflare-pages.yml` (the `place-doors` dispatch job beside lessons-sync and camera-health)
- `app/src/modules/properties/place-on-map.js` (a nearby line naming the BUILDING's street is dropped for every door in it, the unit folded out)
- `app/src/__tests__/the-lane-places-the-doors.test.js` (5; proven to catch)

**Amends:** DR-0998 (the family's app places its doors; now the lane does too, with the same rules, and the family's own placement always wins), DR-0935 (no nearby line names a street: now checked against the building, not only the door)
**Declared by:** Darrell, 2026-10-14, with the shelf on his Fold: *"What's nearby should be on all of them!!! Why not!!? Just not the address!!! Stop misunderstanding..."*; *"When we choose not to disclose that... other than that... we are advertising!!!"*; *"We want potential clients to know its in this area... and these are the Amenities... So potential clients know what to expect!!!"*

## Context

A held door's public card may show its area and its nearby lines, never its street (DR-0933, DR-0935). Both are worked out once from the exact point and saved on the door (0270) or borrowed from its building (0283). DR-0998 made the family's own app do that placement in the background when an owner opens it. On his Fold today the bed at 805 drew the town (DR-1013) and no "What's nearby": nothing at 805 had ever been placed, so there was nothing to borrow, and the stranger saw a town and a price where the area and its amenities are the advertisement.

## What was measured

- His screenshot: Apt 2 (street shown) with the pinned map and twelve nearby lines worked out on the tap from the found point; the bed (street held) with the town map, no list, "Address shared when you apply".
- `PropertiesApp.jsx`: the DR-0998 placement runs for `role === 'owner'`, once a session, and swallows every failure (`.catch(() => {})`). It depends on `/geocode`, a Pages Function.
- site-health 38541355485 (09:18Z today): "NO PAGES FUNCTION IS RUNNING", day 4, #2057 — `/geocode` answers the SPA shell. `findPoint` then falls through to OpenStreetMap directly from the phone, and whether that, the house-number check, Overpass and the save all succeeded in his sessions is unobservable from here: the path has no witness and leaves no trace when it fails.
- The runner side is proven: nearby-witness 38455401607 (2026-10-13) looked 805 up and listed what is near it from a GitHub runner; sovereign-replay-over-tailnet.sh runs SQL inside the NAS's `supabase-db` from a runner every db-migrate.
- `rentals` carries `address`, `unit`, `city`, `state` (0156), `area_lat`, `area_lng`, `nearby`, `notes`; `rentals_area_rounded` rounds the area and refuses a nearby line naming the door's street (0270).
- In the placement's own filter, a bed whose address folds its unit in ("805 North Prospect Avenue Apt 4") has a street name of "North Prospect Avenue Apt 4", which "Target on North Prospect Avenue" slips past: measured by the new suite's first run (three lines kept for the bed where two were expected).

## Impact

- Unresolved: every held door whose building the family's phone never managed to place advertises nothing but a town; the stranger cannot see the area or its amenities, which is the whole reason the street may be held.
- The call obligates: the same rules as the app (the house must match by number and town; the area rounded; no line naming the street; the family's own area never overwritten); bounded cost; every count said; the exact point never written.

## Decision

1. **The lane places doors.** `place-doors.yml` reads every door with an address and no area from the sovereign database over the tailnet, runs the app's own `placeDoorsOnTheMap` on the runner (geocode via the app's own `geocode.js`, nearby via `nearbyAround` with a named user-agent, bus stops included per DR-1014), and writes one UPDATE per placed door, each its own statement, guarded (`WHERE … AND area_lat IS NULL`) so a door the family has placed is never touched. The note on the door reads as the app's would: "[date] Edited — Placed on the map from its address (automatic): …".
2. **After every successful deploy, and on dispatch.** The deploy dispatches it explicitly (a `workflow_run` on a token-started deploy never fires). Brakes: at most 8 lookups a run and a 10-minute timeout (budget), one instance (lock), `PLACE_DOORS_ENABLED='false'` pauses it (kill).
3. **The building's street is the line it may never name.** The placement drops a nearby line that names the street of ANY door in the building, the unit folded out, for every door in it.
4. **DR-0998's in-app path stays** as the first mover when it works; this is the healer that makes the advertisement true whether or not a phone session ever succeeded.

Not done, and said: the in-app placement still fails silently; `re-review: 2026-10-21` — give it a trace (the Doors board says "not on the map yet: why") or retire it in favour of the lane; and read three held doors on the live shelf for area + nearby after this runs.

## Verification

- **`the-lane-places-the-doors` (5):** only doors with a uuid and an address are taken; one building is looked up once and both its doors placed with the rounded area, the exact point never reaching SQL; a line naming the building's street is dropped for the bed too (**proven to catch:** three lines where two were expected on the first run, before the building check); a house the lookup cannot confirm is left as it is; **proven to catch:** an injected id, a non-numeric or off-earth coordinate, a note that could close its quote each produce no SQL, a line past 100 miles is dropped and a label is cut at 80; the workflow carries dispatch, the three brakes, no cron, the tailnet step and the script; the deploy dispatches it.
- `every-door-is-on-the-map` and `the-family-places-its-doors` green with the building-street check.
- **Live proof, in the ledger row once observed:** the first run's summary (doors read, buildings looked up, placed, written), then the bed's card on the Fold: the circle, "What's nearby" with the bus stops, "Address shared when you apply".
