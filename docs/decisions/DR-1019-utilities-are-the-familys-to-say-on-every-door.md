# DR-1019: Utilities are the family's to say, on every door — all paid for the shared rooms, the tenant's own on a whole unit, and a season can change it

**Date:** 2026-10-14
**Status:** accepted
**Area:**
- `app/src/modules/properties/DoorTabs.jsx` (the door editor's "Utilities" select, three states; `utilitiesWord` / `utilitiesValue` / `rentalPatchOut` turn the word back into the column)
- `app/src/modules/properties/Storefront.jsx` (a door whose tenant pays says "Not included: the tenant pays their own utilities.")
- `scripts/listing-share-pages.mjs` (the share page's one line says "All utilities paid" or "Tenant pays utilities")
- `app/src/__tests__/utilities-are-the-familys-to-say.test.jsx` (6; proven to catch)

**Amends:** DR-0952 / 0273 (utilities as a listed fact with three states on the card — now the family can SET the fact on any door), the co-living split (`coliving.js` `ROOM_DEFAULTS.utilitiesIncluded = true` stays the default for a new room or bed)
**Declared by:** Darrell, 2026-10-14: *"All utilities paid for the shared room tenants... single person renting a whole unit pays their own utilities... make sense?"*; *"Currently... it may change in the future... however we eat that cost..."*

## Context

0273 made utilities a listed fact: `rentals.utilities_included` (true / false / NULL) rides `public_vacancies()`, and the card prints "All utilities paid." for true, "Utilities are not included." for false, nothing for NULL (DR-0076: unsaid stays unsaid). Darrell's rule today: the shared-room (bed and room) tenants have every utility paid, the family eats that cost; a single person renting a whole unit pays their own; and the rule may change with a season.

## What was measured

- `utilities_included` is written in exactly one place: `coliving.js` `buildRoom` sets it to `ROOM_DEFAULTS.utilitiesIncluded` (true) when a unit is split into rooms and beds. The door editor (`EditRental`, DoorTabs.jsx) has no field for it; `grep utilities_included app/src` finds the split and the card's read and nothing else.
- So every bed and room made by the split already says "All utilities paid." (the rule holds there by accident of the default), a whole unit says nothing (NULL) and cannot be made to say "the tenant pays", and no door's fact can change when the season does — which is the half of the rule Darrell named: "it may change in the future".
- The share page (`describeListing`) never said the fact at all.
- The card's "not included" line said what is NOT, never who pays.

## Impact

- Unresolved: a stranger reading a whole unit at 805 is not told the one cost that changes the month; the family cannot change the shared rooms' fact when the season does without a database hand.
- The call obligates: three states, never two (0273's rule — unsaid is not "not included"); the word on the editor and the boolean in the column; the co-living default unchanged; nothing on the public shelf that the family did not say.

## Decision

1. **The door editor says it.** "Utilities (said on the listing)": Not said / All utilities paid / The tenant pays their own utilities. The editor works in words (`all paid`, `tenant pays`, blank) so the change summary reads as a sentence ("Utilities: (blank) → tenant pays"), and `rentalPatchOut` turns the word back into `utilities_included` true / false / NULL before the save. A bed made by the split opens reading "all paid".
2. **The card says who pays.** false now prints "Not included: the tenant pays their own utilities."; true and NULL unchanged.
3. **The share page says it too**, after the prices: "All utilities paid" / "Tenant pays utilities"; NULL says nothing.
4. **The data is the family's hand, not a default.** The whole units at 805 (and elsewhere) are set to "The tenant pays their own utilities" on the Doors board, by Darrell, one per door; the beds and rooms already carry "all paid" from the split. No migration, no sweep: a blanket "every unit's tenant pays" would be a guess on doors this record did not read (DR-0076 §8).

Not done, and said: a family-wide default ("my shared rooms are always all paid") that a new split or a new door inherits by the family's own setting rather than the code's constant; `re-review: 2026-10-21`, with the live count of doors still NULL after Darrell's pass.

## Verification

- **`utilities-are-the-familys-to-say` (5):** the word ↔ column mapping (unsaid stays unsaid); the patch leaves the editor as the column; a whole unit's editor opens "Not said", is set to tenant pays, and the save carries `{ utilities_included: false }` with the sentence "Utilities: (blank) → tenant pays"; a bed opens "all paid", Nothing changed stays disabled until touched, and clearing it saves NULL; the share page's three answers. **Proven to catch:** with DoorTabs.jsx, Storefront.jsx and listing-share-pages.mjs stashed and the test kept, the suite fails (no select, no exported helpers, no share-page line); restored, 5 pass.
- `a-shared-home-says-so` (the card's three states; /not included/ still matches), `properties-doors-board`, `the-listing-travels`, `a-short-stays-only-season-advertises-the-night` green (65 across the five suites); lint; the 20 gates.
