# DR-1008: A night is a stay, not a cadence — only the co-living cadences are compared

**Date:** 2026-10-13
**Status:** accepted
**Area:** `app/src/modules/properties/cadence.js` (`CADENCES`, `cadencePrices`), `app/src/modules/properties/Storefront.jsx` (the card's cadence read), `app/src/modules/properties/DoorTabs.jsx` (the editor's preview), `scripts/listing-share-pages.mjs` (`describeListing`), tests `the-true-month-beside-every-cadence`, `the-true-month-is-on-the-card`, `the-listing-travels`
**Amends:** DR-1003 (the true month beside every cadence — the night leaves the comparison)
**Declared by:** Darrell, 2026-10-13, on the live card: *"We prefer short term rentals... different business model... we want only the difference between co-living situations... not Airbnb... make sense?"*

## Context

DR-1003 put the true month beside every cadence a door is priced by, so a renter choosing between $800 a month and $200 a week sees the five-week month before it arrives. It counted the nightly price as a fourth cadence: 365 nights over 12 months. On the live shelf that printed, on the bed at 805 North Prospect and on Apt 2, *"Nightly $150 ($4,563 a month on average, $4,650 in a 31-night month)"* and then *"Monthly is the better deal: $3,813 a month less than nightly on average."*

That sentence compares two businesses, not two ways of paying for one. A short stay is booked for the nights a guest wants; nobody rents a bed by the night for a month. And the family prefers the short-stay business — the shelf was talking their own preferred offer down to every visitor.

## What was measured

- `cadence.js` `CADENCES` carried four entries; `cadencePrices` accepted `nightly` and the card, the editor preview and the share page passed `shortStay ? nightly : null` into it.
- The live card (Darrell's screenshot, 2026-10-13): Apt 2 with no monthly rent printed only the stretched night; the bed at $750/mo printed the stretched night beside it and the better-deal line against it.
- The card already carried the night on its own line: *"Short stay welcome · $150/night"* (`Storefront.jsx`). The share page's description did not.

## Impact

- Unresolved: every short-stay door on the shelf and every share preview argues against the family's own business model to the people it is shown to.
- The call obligates: the comparison stays — between the ways a co-living renter pays for the same month — and the nightly price stays on the card, by itself, with the booking calendar untouched.

## Decision

1. `CADENCES` is monthly, weekly, every two weeks. A nightly price handed to `cadencePrices` never enters the prices, the line or the deal.
2. The card, the editor preview and the share page read the three co-living cadences only. The card keeps *"Short stay welcome · $150/night"*; the share page's description gains *"Short stay $150/night"* in the same place, by itself.
3. Nothing else moves: the nightly rate column, the booking calendar, the stay desk and the night cap (0269/0276) are as they were.

## Verification

- `the-true-month-beside-every-cadence` (14): **proven to catch** — `CADENCES` is exactly the three; `cadencePrices({ nightly: 150 })` is empty; a monthly + nightly door has no line and no deal; a monthly + weekly + nightly door's line carries no night.
- `the-true-month-is-on-the-card` (5): **proven to catch** — a short-stay door's cadence line and deal carry no night, the night stays on its own line; a bed priced monthly with a night offered prints no comparison at all and the night alone.
- `the-listing-travels` (10): the share description reads *"… Weekly $200 ($867 a month on average, $1,000 in a five-week month) · Short stay $150/night · The building: …"*.
- Lint and the guards green; the ledger green.
