# DR-1013: Every door has a map — a held door shows its town, and a pinned map names its street

**Date:** 2026-10-14
**Status:** accepted
**Area:**
- `app/src/modules/properties/AreaMap.jsx` (`MapOnRequest`: a held door with no area looks its TOWN up on the tap and draws it; `AreaMap`: a `town` mode at town zoom with no circle and no pin, and the street's own name under the pin in pin mode)
- `app/src/modules/properties/area.js` (`TOWN_ZOOM`, `streetOfLine`)
- `app/src/__tests__/the-public-shelf-shows-the-area-on-a-map.test.jsx` (27; the town map, the street label, two proven-to-catch cases)

**Amends:** DR-0997 (what the map shows follows the street: shown → pin, held → area; now held with no area → the town), DR-0935 (the area is the stranger's view; the town is the view before the family has placed the door), DR-0998 (the family's own placement still replaces the town the moment a door in the building is placed)
**Declared by:** Darrell, 2026-10-14, with three screenshots of the shelf on his Fold: *"The Show on Map link and information about the location of the property should show when we say we don't want to give out the address... why would Google maps show the exact address? Area so they only get the address afterwards... also Show on Map should be on every door/property so it's informative... It's currently not on certain doors... why? Fix it."* And on the pinned map: *"Also... highlight Prospect on the map... 150 may not be known by out of town people."*

## Context

The public shelf's map follows the street (DR-0997): a shown street is looked up and pinned on the house with a Street view link; a held street draws only the rounded area as a circle. The area lives on the door it was set on (0270) and a held door borrows its building's area (0283). A held door with no area of its own and none to borrow had nothing to draw, so the card rendered no "Show on map" at all. That is exactly the door that most needs a map, because a map is the only location it may show.

Separately, on a pinned map the OpenStreetMap tiles label North Prospect Avenue by its route number, "US 150", at block zoom. A visitor from out of town reads "US 150" and learns nothing.

## What was measured

- His first screenshot: the Apt 4 bed on the public shelf, street held ("Address shared when you apply"), no "Show on map", no "Street view". `MapOnRequest` returns null when it has neither an area nor a shown street (`AreaMap.jsx`, the line `if (!area && !shownStreet) return null`).
- His third screenshot, signed in: Apt 2 and the bed side by side; the bed's card the family sees carries the street, so the family never saw the gap.
- His fourth screenshot: the pinned map of Apt 4 on the family's view, the road labelled "US 150" by the tiles, house numbers 801 to 809 legible, the pin on the house, and no "Prospect" anywhere on the map.
- No door at 805 has an area on the live shelf, or the bed would have borrowed it (0283): the "Show on map" on Apt 2's card comes from its shown street, not from a stored area. DR-0998's automatic placement runs when the family opens the Doors board; Darrell's hand on Apt 2's area (task #56) was never needed for a shown street, so it never happened, and the held bed is the one that pays. The live database could not be read from this session (the backend is sovereign; no route from the sandbox), so this is inferred from the shelf's own rules and his screenshots, and said as such.

## Impact

- Unresolved: a held door with no area is the one door with no map, and the stranger who most needs "where, roughly" gets nothing; the family does not see it because their view carries the street.
- The call obligates: a held door's map must still never name or pin the house; the lookup on tap must carry only the town, never a street; the family's own area must win the moment it exists; a shown street's pin must say the street's name without changing what a held door's map says.

## Decision

1. **Every door has "Show on map".** A held door with no area (own or borrowed) still offers the map. On the tap, the card's own "City, State" line is looked up (the same `/geocode` road, only on the tap, DR-0977) and the town is drawn at town zoom (`TOWN_ZOOM` 12) with no circle, no pin and no Street view. The screen reader hears "Map of Champaign, Illinois. The place is somewhere in this town; the street is shared when you apply." A town the map cannot find says so and draws nothing. A card with no town at all still shows no control.
2. **The family's area replaces the town.** The moment a door in the building is placed (the family's hand, or DR-0998's automatic placement when the Doors board opens), the shelf lends the area (0283) and the card draws the circle as before. Nothing in the order of precedence changes: pin for a shown street, else the area, else the town.
3. **The pin names its street.** In pin mode `AreaMap` draws the door's street name under the pin ("North Prospect Avenue", from the address line with the house number removed) and says it aloud ("The pin is on the house, on North Prospect Avenue."). Pin mode only: a held door's map carries no street label, by construction.

Not done, and said: the live doors at 805 still have no stored area; opening the Doors board once places them (DR-0998), and until then the bed shows the town. `re-review: 2026-10-21` — confirm on the live shelf that the bed draws the circle (borrowed) rather than the town, and read the live `public_vacancies()` row for the bed's `area_lat` through the journeys' road.

## Verification

- **`the-public-shelf-shows-the-area-on-a-map` (27):** a held door with no area offers "Show on map", fetches nothing until the tap, then calls `/geocode?q=Champaign%2C%20Illinois` once, draws fifteen zoom-12 tiles with no circle, no pin, no street label and no Street view, says the town sentence, keeps "Address shared when you apply", and looks up once across hide/show; a shown street's map carries the street label and the aria sentence names it; a held door's area map and town map never carry the label (**proven to catch:** the held case asserts no `area-map-street`; the no-area case asserts the lookup carries no street and that an unfound town says so and draws nothing); a card with no town shows no control.
- Lint green on the three files; the suites that touch the map and the storefront green; the legibility health ledger regenerated.
- The live proof is the deploy of this record's merge and his Fold: the bed's card shows "Show on map" and draws Champaign; Apt 2's pinned map reads "North Prospect Avenue" under the pin.
