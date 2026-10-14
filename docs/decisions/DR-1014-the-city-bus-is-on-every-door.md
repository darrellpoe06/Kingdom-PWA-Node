# DR-1014: The city bus is on every door — the two nearest stops, by distance and route, never by corner

**Date:** 2026-10-14
**Status:** accepted
**Area:**
- `app/src/modules/properties/area.js` (`NEARBY_KINDS` gains `bus`: `node["highway"="bus_stop"]` within a mile, two kept; `busStopLabel`; `nearbyFromOverpass` reads a kind's lines nearest-first so the second stop is "Another city bus stop")
- `app/src/__tests__/every-door-is-on-the-map.test.js` (the query, the two lines, the corner name never printed, the third stop past a mile dropped)

**Amends:** DR-0998 (what is nearby any property, from OpenStreetMap around its own point: one more kind), DR-0935 (no nearby line names a street: a stop's corner name never reaches the line)
**Declared by:** Darrell, 2026-10-14: *"Bus stop location is close... add those too the properties also... People who need to ride the bus will want to know... city buses... make sense?"*

## Context

"What's nearby" lists the researched places for Champaign and, for any door, the nearest grocery, pharmacy, hospital, college, school, station, highway exit, park and airport that OpenStreetMap knows around the door's own point (DR-0998). It carried the train and intercity bus station but not the city bus, and the city bus is what a renter without a car asks first. The research note already measured it for 805: the MTD stop at Prospect & Harvard is about 175 feet away, Prospect & Vine about a tenth of a mile.

## What was measured

- `docs/99-session-notes/2026-10-10-805-north-prospect-whats-nearby.md`: the two MTD stops either side of 805 (Prospect & Harvard 40.12378, −88.25799; Prospect & Vine 40.12214), about 0.03 and 0.1 miles; the routes in the feed (30 Lavender, 7 Grey) predate the 2026-08-09 service change and are marked unverified there, re-review 2026-10-24.
- A stop's OpenStreetMap name is its corner ("Prospect & Harvard"): printing it would hand a stranger the street of a held door, and 0270's trigger refuses a nearby line that names the door's street. So the line cannot carry the name.
- Within the fixture (a Danville door): three stops, two inside a mile, one past it.

## Impact

- Unresolved: a renter who rides the bus cannot tell from the card whether a door is near a stop at all.
- The call obligates: no stop name (it names a street); distances straight-line like every other line; route numbers only as the map carries them, since the research itself calls the routes unverified for the current schedule.

## Decision

1. **Two nearest stops within a mile**, straight-line from the door's own point like every other nearby line, nearest first.
2. **Named by what they are, never by where they stand:** "City bus stop" and "Another city bus stop", with the routes the map carries ("City bus stop (routes 2, 100)") when `route_ref` is present, and nothing invented when it is not.
3. **Placed with the door** (DR-0998): the lines are worked out when the family places a door and saved with it; a door already placed gains them the next time it is placed, or the family adds a line by hand (DR-0935 §3). Nothing is asked of OpenStreetMap from a visitor's phone.

Not done, and said: the routes themselves are not verified against mtd.org here; the note's re-review (2026-10-24) covers it, and the family can correct a line.

## Verification

- **`every-door-is-on-the-map`:** the Overpass query carries `node["highway"="bus_stop"](around:1609,…)`; the Danville fixture yields `City bus stop (routes 2, 100)` then `Another city bus stop`, nearest first; the stop past a mile is dropped; **proven to catch:** no bus line carries a corner name (Oak, Main, Vine never appear in a bus line); `busStopLabel` pins the singular and the "another" forms. The map and placement suites green.
