# DR-0933 — The public shelf shows where, never the street

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: the no-account listing and the PoeTech shelf (migration 0268)
**Principle:** DR-0076 (the surface never claims what it does not do), 0158

## Context

Darrell, 2026-10-10, on the no-account listing for 805 N Prospect Apt 2:

> "Also the address shows while it says it will not show.... fix it... too"

> "Just show the location without the address... make sense... map view..."

> "Addresses are needed for 1099 and management etc..."

**SHOULD.** A stranger sees where a place is (the town, and the area on a map) and never the street. The family, managers, 1099 workers and tenants on the door keep the full address.

## What was measured

- **The listing.** 0158 made the street a per-door switch. Apt 2 was set to `public`, so its card printed "805 North Prospect Avenue · Apt 2".
- **The sentence.** `PropertiesDoor.jsx` printed "The exact address is given by a person, not published here." under every listing, unconditionally. 0158 had fixed the card's own sentence and the PoeTech tab; this page-level line, and the test that should have caught it, were missed (`properties-address-visibility.test.js` read only `PropertiesApp.jsx`).
- **The rule's one reader.** `rental_address_is_public()` has exactly one caller: `public_vacancies()`. In-app address surfaces read `rentals` under RLS and do not consult it: the door header, the dispatch text and the worker's doors.

## Impact

The public page promised one thing and did the other, about the one fact that puts a stranger at a door.

## Decision

1. **0268:** `rental_address_is_public()` answers false for every door.
   - The public shelf gives every listed door its placeable label (e.g. "1-bed multi-family in Champaign, Illinois") and no unit number.
   - The street is handed over when someone applies or books (`vacancy_address_for_applicant`, unchanged).
   - The column stays, and its old 'public' value no longer opens the street.
2. **The page's address sentence is computed from the listings it shows (`addressPromise`), never printed blind.** If a door ever shows its street, the page says so instead of promising the opposite.
3. **The door editor** no longer offers a switch that would do nothing. It states the rule.
4. **Inside the app nothing changes:** the family, managers, 1099 workers and tenants see the full address as before.
5. **The map** (an approximate area, no pin) and verified "what's nearby" lines (UIUC campus, the highway, shops) are their own task. The distances are being measured, not estimated.

## Verification

- **`0152-public-vacancy-smoke.sql`** now proves that even a door marked public shows no street and no unit.
  - Proven to catch: under the old rule it fails with "a door marked public still shows no street and no unit (DR-0933) expected 1, saw 0"; with 0268 it passes.
  - It runs in the live rls-isolation poe-properties leg, which now replays 0268.
- **`properties-address-visibility.test.js`**:
  - the public door's sentence is computed, never printed blind (proven to catch: it was printed blind);
  - what the page says for all-gated, all-shown and mixed listings, with an unknown flag never claiming the street is hidden;
  - 0268 answers false.
- **`properties-door-render.test.jsx`**: the signed-out door still states the street is not published; its fixture now carries today's server flag.
