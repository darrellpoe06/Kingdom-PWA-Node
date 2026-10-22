# DR-1211: Each asset works end to end — its address held whole from evidence, and its money in its books

**Date:** 2026-10-22
**Status:** accepted
**Tier:** B (real-world records: the doors' addresses on the live database, and rental income in the family's books; no schema change)
**Type:** data + orchestration (a Way, DR-0108)
**Area:**
- `app/src/modules/properties/complete-address.js` (new), `scripts/complete-addresses.mjs` (new), `.github/workflows/complete-addresses.yml` (new; dispatched by every deploy, then dispatches `place-doors.yml`)
- `app/functions/geocode.js` (an OpenStreetMap answer carries its parts)
- `app/src/components/Rentals.jsx` (the title prints the one address line; the card prints the asset's books for the year)
- `app/src/modules/properties/model.js`, `cloud.js`, `PropertiesApp.jsx`, `app/src/components/RentLedger.jsx`, `app/src/lib/transactions-sync.js`, `app/src/poe-financial-mvp-v28.jsx`

**Grounds:** Darrell, 2026-10-22, with Poe Properties beside Real Estate: *"The property addresses from the Properties tab are correct... the ones in the Real Estate are not complete... fix the addresses... Each asset should work end to end."* Then: *"Money added to this tab needs to also go to books for each asset... also should be synced with the assets tab"*, *"Uploads and reports need to reflect the rental money"*, *"The asset begin in one place or two... however after it should show up in the places it makes sense to get and give data"*, *"Why can't the research space do it?!"* and *"Make sure we have good workflows that are repeatable and efficient and effective."*
**Principles:** VERIFICATION-DOCTRINE (measure before changing; proven to catch), DETERMINISTIC-FIRST, APP-IS-PRIMARY, HOLD-THE-HAND-OF-THE-PROCESS

## Context

An asset (a door) begins in Poe Properties or Real Estate. Both read the same cloud `rentals` row, and the money taken in on either tab is meant to land in the books, tied to that asset. Neither held: Real Estate showed short addresses ("1003 Koehn Dr, Danville, IL"; "1513 Holly Hill" with "address needs the house number"), and the books held none of the rent.

## What was measured

All on the live database, from the runner (the sandbox has no route to it), printing shapes and counts only, because run pages are public:

- **The addresses** (`rentals-address-probe`, run 39717503181): 13 rows, all in `poe-properties`. The five doors at 805 North Prospect Avenue are whole. Eight are not, in the ONE record both tabs read: no ZIP on either Koehn door or on 440 South Street; 1508 Holly Hill has no ZIP and no street type; 1508 Williamsburg and 709 Commercial name no town; 1513 Holly Hill's address field holds only a town.
- **Whether the whole forms live elsewhere** (`address-search-probe`, every text column of every public table): no row anywhere carries a ZIP after any of the eight. The towns that ARE on record: Danville for 1003 Koehn and 1513 Holly Hill, in each door's own edit trail.
- **The first dry run** (run 39718050197) let a door with no town be asked in each family town and completed when one answered. It answered 1513 Holly Hill in Champaign, where the door's own trail says Danville, and could not find 1508 Holly Hill in Danville at all. So "the only town that answered" is not the door's town. That rule was removed.
- **The second dry run** (run 39718768484): 4 of 8 completed from a Census match that is this house in its own town (both Koehn doors, 440 South Street, 2111 Tala); both Holly Hill doors not found by the map, and the research road answered 503 (its tower was asleep); 1508 Williamsburg and 709 Commercial name no town anywhere.
- **The books** (same probe): `transactions.linked_to_id uuid` and `linked_to_kind text` exist (since schema v1) and 0 of 3,555 rows name an asset; `rent_records` holds 3 rows, all naming their door, and none has ever been posted (no `rent-…` row in the books); `rent_payments` holds 0.
- **The category**: Properties posted rent as `'Rental Income'`, the label. The books keep slugs (`BooksTransactions.jsx` `TX_CATEGORIES`), so a posted rent would have counted as "other" in every report.

## Impact

- **Unresolved:** a door's address is incomplete wherever it is shown, mapped or filed; the map cannot place it; and rent taken in never reaches the books, so no total, report, export or tax picture of the rental money is true.
- **The call obligates:** an address part is written only from evidence that is THIS house (house number, street, town); a door's town comes from its own record or edit trail, never from whichever town answers; every rent entry names its asset, its business and the books' category, once; and every path is a standing workflow, not a one-off.

## Decision

**Addresses, from evidence, by a repeatable lane.** `complete-addresses.yml` runs after every deploy (`write=true`), completes what it can prove, and then dispatches `place-doors.yml`, so the map places doors from whole addresses (one chain, never a race). For each door that wants completing:
1. The door's town is its city, or, when its address lost its street, the town its own edit trail last set (`trailTown`).
2. The road the map trusts (Census, then OpenStreetMap) is asked in that town. A match counts only with the same house number, the same street (or the same street with the type the record left off) and the same town; the street type and direction are then written in full from the USPS table.
3. When the map cannot find the house, the research road is asked, and the lane reads each source page itself, from a public address only (the runner sits on the tailnet, so private, loopback, link-local and tailnet addresses and redirects into them are refused). A page is evidence only when it shows this house in its own town with a ZIP; two pages that disagree are no answer; the research road's own words are never the evidence.
4. A ZIP or town the family typed is never overwritten. Each write is a guarded UPDATE that matches only the values read, stamps `updated_at` (so every device's merge takes the whole address) and appends the app's own edit trace to the door's notes.
5. A door with no town on record is left as it is and says so: the town is the one value only the family holds.

**The one address line, on both tabs.** Real Estate's title prints `formatBuilding`, the formatter Poe Properties uses, so a door cannot read two ways once its ZIP lands.

**Rent in the books, per asset, once.** A rent entry is `category: 'rental-income'`, `entityOverride` = the door's business, `linkedToKind: 'rental'` + `linkedToId` = the door's uuid; the books sync sends and reads `linked_to_kind`/`linked_to_id` (a uuid only). Inside the PoeTech app the owner's Properties posts every confirmed, unposted rent record across all doors by itself (`loadUnpostedRent`, at most 60 a pass), each once (`rent-<record>` and `posted_tx_id`). Real Estate's rent ledger posts each payment through the same `books.postEntry`. A payment already in the books for the same asset, amount and month (entered on the other tab) is not posted again. Each Real Estate card shows the books' total for that asset this year.

## Verification

- `an-address-is-completed-from-evidence.test.js` 20/20 (placeholders only, no real address): proven to catch a wrong house number, street, direction or town; two ZIPs; the town that merely answered; a door with no town; a page whose words are only the research road's; a value that could break its quotes; a run past its budget.
- `the-rent-goes-to-the-books-of-its-asset.test.js` 12/12: the category slug (proven against the books' own list), the asset link (uuid only), the double-post guard, the Real Estate payment entry, the per-asset total, the wiring.
- Existing suites touching these files green (`properties-door`, the transactions-sync suites, the address and map suites); lint 0; `verify:gates` 0.
- Live: the lane writes on the first deploy after merge, and its trace (by door, never an address) is read before this is called done; the Holly Hill doors depend on the research road's tower being awake; 1508 Williamsburg and 709 Commercial need their town.
- Not built here, named: an "Assets" page of its own (none exists in the app; the asset's money now shows on its Real Estate card and in the books by its link), and Schedule E by property from the books' asset link. `re-review: 2026-10-29`.
