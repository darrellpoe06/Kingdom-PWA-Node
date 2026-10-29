# DR-1290: The building shares one picture pool

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** B (the open shelf changes: a picture the family places from elsewhere in the building is shown on a listed door's public card)
**Type:** surface · data
**Area:** Properties · a door's Gallery and its open listing (`infra/supabase/migrations-auto/0314-the-building-shares-one-picture-pool.sql`, `app/src/modules/properties/cloud.js`, `DoorTabs.jsx`, `PropertiesApp.jsx`)
**Declared by:** Darrell, 2026-10-29, with a screenshot of a door's Listing pictures at 805 North Prospect Avenue:

> "Need to be able to show images of the entry on all doors in 805!!!!! All pictures for any apartment should be available from the same images pool... we can add which apt... however we should be able to use anything it's the same building!!!!! Fix it!!!"

**Pairs with:** DR-0963 (the landlord sees the rest of the apartment), DR-0967 (same apartment number, same place), DR-0984 (each door shows the apartment in its own order), DR-0998 (the building key), DR-1022 (borrowing goes both ways), DR-0946 (a failed read is never "none"), DR-0060 (RLS is the wall)

## Context

A door could reach only its own apartment's pictures. Two rules said so: `same_apartment` (0273), meaning the same street and the same unit number, and the trigger behind a door's own picture order (0282). The family's gallery (`loadSiblingPhotos`) and the open shelf (`public_vacancy_photos`, 0291) both drew that same line. The entry, the halls and the laundry of 805, photographed once and filed on one apartment's door, could not be used on Apt 2 at the same address. The building key that names 805 as one building already existed (DR-0998, 0283), but only the area map used it.

## What was measured

- `door_photo_order_fits` (0282) raised `the picture is not in this door's apartment` for any picture outside the apartment, and no later migration redefined it.
- `public_vacancy_photos` was last defined in 0291, which reaches siblings by `same_apartment` only.
- `loadSiblingPhotos` returns nothing for a door with no unit, and nothing outside the apartment. Seven app tests pin that, and they still pass unchanged.
- Smoke `0282-door-photo-order-smoke.sql` refused "another apartment placing Apt 4's picture", using an Apt 2 **at the same street**. That case is exactly the rule this decision changes. Run against the new rule, the original smoke fails: `another apartment placing Apt 4's picture (expected refused, got allowed)`.

## Decision

1. **The building is a pool, and it is opt-in.** A door may place any picture filed on another door of the same building: same instance, same `building_key`, and a key of at least five characters. Placing it writes one `door_photo_order` row; nothing is copied.
2. **The apartment stays automatic.** DR-0963 and 0291 are unchanged. The building is opt-in, one picture at a time, because a building's pool holds other households' apartments, and only the family can say which pictures are the shared spaces.
3. **The open shelf.** A placed picture of the listing kind shows on this door's public card while **this** door is listed and empty, even when the apartment that holds the picture is let. Placing it is the family's explicit choice for this listing. A placed record (move-in, inspection, work) shows in the family's gallery only, never to a stranger.
4. **The screen says whose each picture is.** A new card, "The rest of the building", lists every picture on the other apartments with "from <door>". It is filtered by apartment and paged 24 at a time. Each picture offers "Use on this door" or "Stop using here". The card asks for the shared spaces in plain words. Placed pictures join the door's shared card, where its arrows and cover arrange them in this door's own order (DR-0984).
5. **Never across instances.** Another family's door on the same street is refused by the trigger, and RLS governs every read and write as before.

## Impact

- Any door at 805 can show the entry, the halls and anything else photographed anywhere in the building, without photographing it again.
- No picture moves or is copied: "Stop using here" removes one row, and the picture stays on its own apartment's door.
- The 0282 smoke's refusal case now uses a door in **another building**. That refusal holds under both the old and the new rule, so the smoke stays meaningful wherever it runs. The same-building case is now held by the 0314 smoke.
- **CI:**
  - `ci.yml`'s property job gains the 0314 apply-twice-and-smoke step, as every property migration has.
  - `rls-isolation.yml` lists 0314 and its smoke beside 0310.
  - No deploy step changed.

## Verification

- **`0314-building-picture-pool-smoke.sql`**, run locally on PostgreSQL 16:
  - nothing placed shows nothing;
  - the family places the entry from a let apartment, and the shelf shows it;
  - a placed record never reaches the shelf;
  - another building, another family and a stranger are each refused;
  - a let borrower shows nothing;
  - taking the picture off takes it off the shelf.
- **Proven to catch:**
  - with 0282's trigger and 0291's function restored, it fails at `the family places the entry from Apt 3 on Apt 2 (expected allowed, got refused)`;
  - with 0314 applied again, it passes.
- **The whole `door-work` CI job, replayed locally end to end** (every property migration, applied twice, and every smoke through 0314): exit 0, every smoke PASS. The 0282, 0291, 0273, 0290 and 0314 smokes also pass re-run after 0314, which is the `rls-isolation` order.
- **`the-building-shares-one-picture-pool.test.jsx`: 12 tests.**
  - The read takes the other apartments of the building, never this door's own apartment, another building, another family or the door itself.
  - Placements count only for pool pictures.
  - A failed read is a failure, not an empty building.
  - The card says which apartment holds each picture, uses and stops using one, joins the shared card, pages, filters by apartment, and says when it could not be read.
  - Proven to catch: with the read narrowed back to the apartment, three cases fail.
- **The 14 property suites** whose module mock gained the three new functions: 15 files, 124 tests, all passing.

## Open

- The order of a placed building picture among the apartment's unarranged pictures: a placed picture carries a position, so on a bed with an unarranged apartment it leads that apartment's pictures until the door is arranged. On a whole apartment with no siblings, like Apt 2, it follows the door's own pictures. **re-review: 2026-11-12.**
