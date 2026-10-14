# DR-1018: The bus stop says how close, from the agency's own feed — a short walk reads in feet, and a runner reads the MTD schedule

**Date:** 2026-10-14
**Status:** accepted
**Area:**
- `app/src/modules/properties/area.js` (`roundMiles` keeps the hundredth under a tenth of a mile; `feetText`; `milesText` reads a short walk in feet)
- `scripts/bus-witness.mjs` (reads a GTFS feed: every stop within a half-mile walk of a looked-up house, grouped by station, in feet, with each route's name, days and buses on its busiest day, and the feed's own window)
- `.github/workflows/bus-witness.yml` (dispatch only; fetches the MTD feed on a runner, the first address that answers with a zip, and prints which)
- `scripts/place-doors.mjs`, `scripts/nearby-witness.mjs`, `.github/workflows/place-doors.yml` (the runner waits two minutes for Overpass; the placer's ceiling is 20 minutes)
- `scripts/system-flow-registry.mjs` (the witness has its place)
- `app/src/__tests__/the-city-bus-says-how-close.test.js` (8; proven to catch)

**Amends:** DR-1014 (the city bus on every door: the two nearest stops from OpenStreetMap, routes as the map carries them, "verify at mtd.org" left as a re-review), DR-0998 (a short walk is no longer rounded up to "about 0.1 miles")
**Declared by:** Darrell, 2026-10-14: *"I'm sure there is a bus stop closer than a mile away... I believe out front... or really close... find out so we can tell our potential clients..."*

## Context

DR-1014 put the city bus on every door's "What's nearby" from OpenStreetMap: the two nearest stops within a mile of the door's own point, named "City bus stop (routes …)" with whatever `route_ref` the map carries, never the corner name. The mile is the SEARCH radius, not the distance; the research note (`docs/99-session-notes/2026-10-10-805-north-prospect-whats-nearby.md`) had already measured the MTD stop at Prospect & Harvard at about 175 feet from 805, and Prospect & Vine at about a tenth of a mile. Two things were left loose: the card's distance text rounded any short walk UP to "about 0.1 miles" (`roundMiles` floored at a tenth), which is not what "out front" reads like; and the routes came from the map, not the agency, with the note's own caution that MTD changed service on 2026-08-09 and the feed it read (2026-05-17 to 2026-08-08) was stale.

## What was measured

- `roundMiles(0.033)` → `0.1`; `milesText(0.1)` → "about 0.1 miles". A stop 175 feet away read as a tenth of a mile.
- The cloud sandbox cannot reach mtd.org, developer.mtd.org, transitapp.com or mobilitydatabase.org (DNS: ENOTFOUND, 2026-10-14 15:00), so the current routes cannot be read from here. A GitHub runner reaches them (the nearby witness reads Overpass from one; site-health reads poetech.us).
- nearby-witness 38585240741 (dispatched 14:58 to read 805's live lines) matched the house on the Census and then timed out on Overpass at 60 s; its own probe of the same query as a bare GET answered HTTP 200 in about 30 s. A runner's patience was the limit, not the server. The placer's first run (38582219189) used the same 60 s and missed 6 of 12 doors; its "every miss says why" trace (#2167, merged 14:59) will say whether this is the cause.
- MTD's GTFS has been published at developer addresses that have changed over the years; which one answers today is not known from the sandbox.

## Impact

- Unresolved: a renter without a car reads "about 0.1 miles" for a stop out front, and the route numbers on the card are the map's, unverified against the agency since the service change.
- The call obligates: no corner name on the public card (it names a held door's street; 0270 refuses it); the exact point never printed; read-only, dispatch-only, one runner, a ceiling; the feed's date window said so a stale feed never reads as today (DR-0076 §8).

## Decision

1. **A short walk reads in feet.** Under a tenth of a mile the card says "about N feet" in 25-foot steps ("about 175 feet"), and the saved distance keeps the hundredth so the feet survive the save; a tenth and up reads in miles as before.
2. **A runner reads the agency's own feed.** `bus-witness.yml` fetches the MTD GTFS (the addresses MTD has used, tried in order; the one that answered is printed; a URL input overrides), looks the address up as the placer does, and prints every stop within a half-mile walk: the station's name, the feet, each route with its days ("Mon–Fri", "Sat, Sun", "every day") and buses on its busiest day, the feed window, and the count of holiday exceptions it did not apply. Read-only.
3. **A runner waits two minutes for Overpass**, on the placer and the nearby witness; the placer's ceiling is 20 minutes (8 lookups × up to 2 minutes).
4. **The card's wording is unchanged**: still "City bus stop (routes …)", still no corner name. The feed is the witness's to read; what the family publishes from it is written on the door by hand or by the placer's next run.

Not done, and said: the card does not yet carry the days a route runs; when the witness has read the current feed, the family's line can say "City bus stop out front (route 30, weekends; route 7, weekdays)" and the placer could read the feed itself (`re-review: 2026-10-21`, with the witness's first live reading and which feed address answered).

## Verification

- **`the-city-bus-says-how-close` (8):** feet under a tenth ("about 175 feet"; "about 25 feet" floor), miles at a tenth and up, the hundredth kept by `roundMiles`; the CSV reader on quoted names; a station's platforms grouped under the station's own name, nearest first, a far stop excluded; each route's days and busiest-day count; the report's window, exceptions and lines; zero stops for a house with none. **Proven to catch:** the first run of the suite failed on the grouped name ("Prospect & Harvard (SW)" for "Prospect & Harvard") and the fix is the station-row name.
- `every-door-is-on-the-map` (14) green with the rounding change; `the-lane-places-the-doors` (5) green; lint; the 20 gates incl. interconnect-guard with the witness placed.
- **Live, owed to the re-review:** bus-witness dispatched on main for 805 after this merges; its log names the feed address that answered, the window, and the stops in feet with routes and days. nearby-witness re-dispatched with the two-minute wait.
