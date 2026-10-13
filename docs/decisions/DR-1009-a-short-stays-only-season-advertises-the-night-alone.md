# DR-1009: A short-stays-only season advertises the night alone — two boxes, three states, and the lease prices wait for their season

**Date:** 2026-10-13
**Status:** accepted
**Area:** `infra/supabase/migrations-auto/0288-a-short-stays-only-season-advertises-the-night-alone.sql` (`public_vacancies()`, same shape as 0286), `infra/supabase/tests/0288-short-stays-only-smoke.sql` (the `poe-properties` leg, CI's door database, the journeys' database), `app/src/modules/properties/Storefront.jsx` (`vacancy-rent`, the application hidden), `app/src/modules/properties/DoorTabs.jsx` (the editor's two checkboxes, `offering-boxes`), `scripts/listing-share-pages.mjs` (`describeListing`), `scripts/e2e/door-journeys.mjs` (A3, the seed offered as `both`), tests `a-short-stays-only-season-advertises-the-night`, `properties-doors-board`, `a-bed-still-says-it-is-a-bed`
**Amends:** DR-1003 (the shelf's prices are read through the season now), DR-1008 (the night alone, in its own season), 0155 / DR-0930 (what a door is offered as: the same three values, chosen with two boxes)
**Declared by:** Darrell, 2026-10-13: *"Have a check box for if/when we offer something more than short stays... so it won't have to advertise all options specifically for the seasons we decided we want in their respective seasons... make sense?"* and *"All of the above can also be an option... so we can get the first opportunity to get revenue..."*

## Context

The family runs 805 by the season: short stays when that is the business they want, leases and longer terms when that is. A door already says what it is offered as (long-term, short-term, both; 0155), but the public shelf read the price columns whatever the offering: a door offered short-term still advertised its monthly rent and its weekly and every-two-weeks prices, so the only way to stop advertising a lease in the short-stay season was to delete the lease price — and type it back in when the season turned.

## What was measured

- `public_vacancies()` (0286): `rent`, `weekly_rate`, `biweekly_rate` selected from the row with no regard to `offering`; `nightly_rate` likewise (the card gates the night by `shortStay`).
- The card (`Storefront.jsx`): the price line printed `$X/mo` or *"Rent on request"* for every door, and Apply — no account needed on every door; a short-stays-only door therefore advertised a lease it was not offering (the Apt 2 screenshot read *"Rent on request"* over *"Short stay welcome · $150/night"*).
- The editor: a three-way select ("Lease only / Short stay only / Lease or short stay") — the information, asked backwards from how Darrell thinks about it.
- The journeys' seed door was offered `short-term` while asserting the weekly cadence line (A1): a fixture that the gate would now, rightly, break.

## Impact

- Unresolved: the shelf cannot follow the season without the family deleting and re-typing prices, and a short-stays-only door reads as a lease to strangers.
- The call obligates: nothing on the row is deleted or rewritten by the season; the night and the booking calendar keep working in every state; `both` advertises everything so the first revenue that comes is taken.

## Decision

1. **The shelf is the gate.** 0288 redefines `public_vacancies()` in 0286's shape: while `offering = 'short-term'`, `rent`, `weekly_rate` and `biweekly_rate` read NULL; `both` and `long-term` read them as stored. The row is untouched, so the season comes back with its prices.
2. **Two boxes, three states.** The editor's select becomes two checkboxes: *Short stays, by the night* and *More than short stays: leases, weekly, every two weeks*. Both ticked is `both` — said on the form as *all of the above: the first revenue that comes is taken*; nights alone is `short-term` — said as *the lease prices stay on file and are not advertised this season*; neither is `long-term`, the default a door is born with. The stored value and `buildEdit`'s change line are unchanged.
3. **The card says the season.** A short-term door's price line reads *Short stays only* (never *Rent on request*, which implies a lease), prints no cadence line, offers no application; the night and the calendar stay. The share page's description says *Short stays only* in the same place.
4. The journeys' seed door is offered `both`; A3 flips it to short stays only on the real chain and reads the card, then flips it back.

## Verification

- **Smoke (`0288-short-stays-only-smoke.sql`, `SHORT STAYS ONLY SMOKE: PASS` locally after 0288 applied twice; 0286's and 0280's smokes still pass on the redefined function):** a short-term door reads NULL for rent, weekly and every two weeks and 150 for the night, and is still on the shelf; the stored prices are untouched; `both` reads 800 / 200 / 400 / 150; `long-term` reads the lease prices.
- **`a-short-stays-only-season-advertises-the-night` (5):** the card in each of the three states, **proven to catch** both ways (`both` prints the month, the cadence, the application and the night; `short-term` prints none of the first three); the share description in two states.
- **`properties-doors-board`:** the editor's boxes set the offering; ticking the nights asks for a nightly rate and says *all of the above*; unticking the nights clears the night's pair (the DB refuses that pair) and writes `long-term`.
- **`a-bed-still-says-it-is-a-bed`:** 0288 is the newest definer of `public_vacancies()`, keeps 0281's label arm, and the live leg fails the moment it is taken back out.
- **Door journeys, A3 (Chrome, PostgREST, the real chain):** the door flipped to short stays only reads *Short stays only*, no cadence, no application, the calendar and *$150/night*; no *$800* on the page; the row still holds 800 | 200; flipped back, the cadence line returns. The fault undos replay the chain to 0288 (`--check-faults` converges).
- Lint, every guard, the ledger (Next ID DR-1010) green.
