# DR-0995: The map follows the street — a pin and Street View when it is shown, the building's area when it is held

**Date:** 2026-10-13
**Status:** accepted
**Area:**
- migration 0283 (`building_key`, `public_vacancies`)
- `AreaMap.jsx` (`AreaMap` pin, `MapOnRequest`)
- `area.js` (`streetViewUrl`, `PIN_ZOOM`)
- `scripts/e2e/door-journeys.mjs` (C2, H1)

**Amends:** DR-0977 (what "Show on map" and the link out do), DR-0935 (where a door's area comes from)
**Principle:** DR-0061 (reality-trace), DR-0076 (proven to catch), DR-0967 (cleaned, never fuzzy)

## Context

Darrell, 2026-10-13, with a screenshot of the live shelf on his Fold (Apt 2 beside the bed in Apt 4):

> "Show on map is supposed to be giving the area without the address... when the address is not shown... however maps when the address is showing can be the direct link to the street view... make sense?"

## What was measured

Read from the screenshot and from `AreaMap.jsx` / `public_vacancies()` at `a2a388243`:

- **Apt 2, street shown.** "Show on map" drew the rounded 600 m circle (`MapOnRequest`: `shown = area || found?.area`), the same picture a held door gets. The house was never on the map.
- **Apt 2's link.** "Open in Maps" was `maps/search/?query=<address>`, a search result rather than Street View.
- **The bed in Apt 4, street held.** No "Show on map" at all. The area lives on the door it was set on (Apt 2, via the area editor, 0270). The bed stored none, and a held door has no street to look up, so `MapOnRequest` returned nothing. The door that may show ONLY the area was the one that could not show it.
- **The real addresses** (DR-0971, DR-0983): Apt 2 is `805 North Prospect Avenue` / `Apt 2`; Apt 4's beds are `805 North Prospect Avenue Apt 4` / `Apt 4`. With the unit folded out (`street_key`, 0273), they are one building.

## Impact

- **A visitor to a shown street** could not see which house it was, or look at it, without retyping the address into another app.
- **A visitor to a held door** saw no map at all. The area exists to answer "where, roughly?", and that question had no answer on that card.
- **Privacy.** Nothing more exact than the town reached a held card before or after this change. The borrowed area is the same rounded grid point.

## Decision

1. **Street shown → the house.**
   - "Show on map" looks the address up (the existing `findPoint`, only when tapped) and draws a **pin on the house** at zoom 17 (`PIN_ZOOM`). This holds even when a rounded area is stored.
   - If the lookup fails, the stored area is drawn and the card says *"… This is its area."*
2. **Street shown → Street View.**
   - "Open in Maps" becomes **"Street view"**: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=LAT,LNG` (`streetViewUrl`), which is Google's documented URL, needs no key, and opens the Maps app on a phone.
   - **Once the house has been found**, the link is a plain anchor into Street View.
   - **Before that, one tap is enough.** A tab is opened inside the tap, so no pop-up blocker refuses it. The house is then looked up, and the tab is sent into Street View, or to the address in Maps if it cannot be found.
   - **If the tab is blocked**, the link becomes Street View and the card says *"Street view is ready: tap it again."*
3. **Street held → the area, and only the area.**
   - Still a circle, with no pin, no point and no link out.
   - **A door that stored no area of its own gets its building's area** in `public_vacancies()` (0283), along with the nearby lines that go with it. The building is any door of the **same family** whose `building_key` matches. That key is `street_key` (the unit folded out), cut at the first unit designator.
   - A door's own area always wins.
   - Cleaned, never fuzzy: `805 N Prospect Ave` is not `805 North Prospect Avenue` (DR-0967).
4. **No exact point is stored, ever** (0270).
   - The pin's point lives only in the visitor's tab, for a street the family chose to show.
   - 0283 keeps 0281's RETURNS shape exactly, so it uses `CREATE OR REPLACE` with no `DROP`.

## Verification

- **`0283-building-area-smoke.sql`** (BUILDING AREA SMOKE: PASS) checks:
  - a held bed in `… Apt 4` draws its building's area 40.125, −88.26 and lines, with `street` null and `unit` null;
  - Apt 5's own area wins;
  - another family on the same street lends nothing;
  - `Ave` is not guessed to be `Avenue`;
  - `building_key` on the four real address shapes.
- **Proven to catch:**
  - With 0281's definition back, step 1 fails (`<NULL>,<NULL>`).
  - With the family check removed, step 3 fails by name.
  - **It also caught a bug of mine before any push:** `jsonb_typeof(NULL) = 'array'` is NULL, and NULL sorts first under `DESC`. The bed took Apt 5's area instead of Apt 2's. It is fixed with `coalesce(…, false)`.
- **Neighbouring smokes** 0270, 0273, 0280 and 0282 pass on the chain through 0283, applied twice.
- **`the-public-shelf-shows-the-area-on-a-map.test.jsx`** (25 tests) covers:
  - pin, not circle, for a shown street with a stored area;
  - zoom-17 tiles;
  - the Street View href once found;
  - the fallback to the area;
  - the one-tap tab opened BEFORE the lookup is sent;
  - the not-found tab sent to Maps;
  - a blocked tab;
  - a held street never given a pin or Street view.
- **Each of those cases is proven to catch:**
  - The circle for a shown street fails 2 tests.
  - Opening the tab after the lookup fails 1.
  - Street view on a held door fails 2.
- **Door journeys** in Chrome over the built chain: **10/10**.
  - **C2:** a held street shows the circle, no pin and no Street view.
  - **H1:** the street is shown, then "Show on map", one lookup for `805 North Prospect Avenue, Champaign, Illinois`, a pin and no circle, and Street view at `40.123364,-88.258280`.
- **Not observed live:**
  - the bed's card on poetech.us drawing the building's area;
  - Street view opening the Maps app on the Fold.

  `re-review: 2026-10-27`.
