# DR-1022: Borrowing goes both ways — a door shows its own pictures and the apartment's, in every direction (0291)

**Date:** 2026-10-14
**Status:** accepted
**Area:**
- `infra/supabase/migrations-auto/0291-borrowing-goes-both-ways.sql` (`public_vacancy_photos`: own showable pictures first, then every sibling door's in this door's own order; no level gate, no "only while it has none")
- `infra/supabase/tests/0291-borrowing-both-ways-smoke.sql` (BORROW BOTH WAYS SMOKE: PASS)
- `app/src/modules/properties/DoorTabs.jsx` (the family's Pictures heading says what is this door's and what is shared below it)
- `.github/workflows/ci.yml`, `.github/workflows/rls-isolation.yml`, `scripts/e2e/build-door-db.sh` (0291 and its smoke wired after 0290)
- `app/src/__tests__/the-rest-of-the-apartment.test.jsx` (+1)

**Amends:** DR-0952 / 0273 (a room or bed borrowed the apartment's pictures only while it had none of its own, and a whole unit never borrowed), DR-0978 / 0278, DR-0984 / 0282 (the door's own order of what it borrows: unchanged, now applied to every sibling picture), DR-0963 (the family's gallery already read both; now the stranger's card agrees)
**Declared by:** Darrell, 2026-10-14, after adding three foyer pictures to Apt 4 B: *"they got rid of the ones already there... I didn't want or think that could or should happen!!!!!!!!!! I wanted to simply add 3 images!!!!! Now it wont show the 40 pictures only the 3!! WHY?!!!!!!FIX IT!!!!"*; the rule: *"Borrowing should be able to do both and back and forth... should be able to see what we want to see... Make sense?"*

## Context

0273 let a stranger's card for a bed in a shared home borrow the apartment's listing pictures from a sibling door; 0278 and 0282 kept the rule and gave the borrowing door its own order of them. The borrow was a FALLBACK: `siblings` carried `WHERE NOT EXISTS (SELECT 1 FROM mine)`, and only a room or a bed could borrow. The family's own gallery (DR-0963, `loadSiblingPhotos`) never had that gate: it reads the rest of the apartment for any door with a unit, always, and shows it under "Shared with this apartment (N)".

## What was measured

- On his Fold (screenshot, 2026-10-14 20:42): Apt 4 B's gallery reads "PICTURES (3)" with the three new foyer pictures, and the buttons above read "Tick all 40 shown" and "Move 40 to listing" — 3 of this door's own plus the 37 the shelf witness counts on the bed (public-shelf-witness 38583109219: `bed|…|37` twice). Nothing was deleted: the 37 sit on the door that holds them, under the "Shared with this apartment (37)" card further down the same screen. The heading above said only "3".
- The stranger's card is the half that subtracted. On the local door database (0290 applied), the new smoke's first case failed against the old function exactly as the live bed did: `Bed B with one of its own shows [foyer:false] (expected its foyer, then Bed A's three)`. So the public listing for Apt 4 B went from 37 pictures to 3 the moment its first own picture was uploaded.
- Nothing in the showable rules changed: listing kind, not archived, the owning door listed and empty; 0290's wrappers (`public_vacancy_photo_list`, `public_vacancy_picture`) read `public_vacancy_photos` and inherit whatever it returns.

## Impact

- Unresolved: adding one picture to a bed takes the apartment's advertising off that bed's public card; the family reads "PICTURES (3)" over a door that still shows 40 and concludes 37 were lost.
- The call obligates: nothing a stranger could not already see (the same showable set, per door, per instance); never across instances; never for a door without a unit (a house must not borrow the next house at the same address — `same_apartment` already refuses an empty unit key); nothing copied; `from_sibling` says which is which; the door's own order of what it borrows kept (0282); the family's "no move is needed" promise kept (DR-0971).

## Decision

1. **Both ways, always (0291).** Within one apartment every listed door's public pictures are its OWN showable pictures first (its sort_order), then every sibling door's showable pictures in this door's own order (`door_photo_order`), then the owning door's order, newest first on a tie. The `NOT EXISTS (mine)` gate and the room/bed gate are gone; `same_apartment` and the same-instance rule stay. The bed sees the unit's; the unit sees the bed's foyer; two beds see each other's.
2. **The family's heading says what is what.** "Pictures (3 of this door · 37 shared with the apartment, below)" when the apartment lends any; "Pictures (N)" when it lends none. The shared card below is unchanged.
3. **No data moves.** The three foyer pictures stay on Apt 4 B; the 37 stay where they are; both doors advertise with all 40.

Not done, and said: the family cannot yet order the own-first boundary (a borrowed cover before an own picture); the own group always leads. `re-review: 2026-10-21`, with the live count on Apt 4 B's public card after this deploys and db-migrate applies 0291 (expected 40).

## Verification

- **0291 smoke, on the local door database (PostgreSQL 16, 0290 applied):** run BEFORE 0291 it FAILS on the live case (`Bed B with one of its own shows [foyer:false]`); 0291 applied twice (idempotent); run after: `BORROW BOTH WAYS SMOKE: PASS` — Bed B with one picture shows its foyer then Bed A's three; Bed A shows its three then the foyer; the whole unit shows the beds' four, all borrowed; Apt 2 at the same street shows none; a house with no unit borrows nothing from the next house; an unlisted sibling lends nothing; 0290's list wrapper reads the same rows in the same order. 0282's and 0290's smokes still PASS after 0291.
- `the-rest-of-the-apartment` (+1): the heading names both counts when the apartment lends, and only its own when it does not. Proven to catch by the heading pin against the old text.
- Wired: ci.yml's door-database block (applied twice, smoke grepped), the rls-isolation poe-properties leg (migrations and smokes), `build-door-db.sh`; the four migration guards (replay order, newest definition, return type, matrix) green.
- **Live proof owed:** after the merge, db-migrate applies 0291 on hosted and the sovereign replay; the public-shelf witness's `photos_offered` for the two beds must read 40 (it reads `public_vacancy_photos`), and Darrell's Fold shows the bed card with 40.
