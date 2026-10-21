# DR-1197: A door shows its pictures to its people — the Properties tab reviewed end to end for its tenant, household and 1099 worker

**Date:** 2026-10-21
**Status:** accepted
**Tier:** C for §1 (RLS: migration 0309 widens the tenant's and household's read to the door's listing pictures and rooms, carried with its proof on a real PostgreSQL in CI and on the live database, DR-0225); A for §2–§5 (the preview, the application, two honest lines)
**Type:** product (privacy) + data wall + surface
**Area:**
- `infra/supabase/migrations-auto/0309-a-door-shows-its-pictures-to-its-people.sql` (new): `rentals.pictures_shared_with_door`, `door_shares_pictures_with()`, `property_photos_door_people_read`, `property_rooms_door_people_read`
- `infra/supabase/tests/0309-door-pictures-smoke.sql` (new), run twice-applied in `ci.yml`'s door-work leg and on the live database in `rls-isolation.yml`'s poe-properties leg
- `app/src/modules/properties/preview.js` (new): the "seen as" mirror of the read policies
- `app/src/modules/properties/DoorPictures.jsx` (new): the tenant's and household's Pictures tab
- `app/src/modules/properties/PropertiesApp.jsx`: the preview stands on one door; the `pictures` tab; the offline line on the not-reached card
- `app/src/modules/properties/DoorTabs.jsx`: the landlord's per-door switch on the edit form; the board's "advertised with no listing pictures" notice
- `app/src/modules/properties/model.js` (the tab), `cloud.js` (the column rides the rentals read), `intake.js` (the mandatory screening fields)
- Tests: `a-door-shows-its-pictures-to-its-people.test.js`, `the-preview-is-one-door-through-their-wall.test.js`, `properties-work-on-any-door.test.jsx` (seven cases added), `properties-intake.test.js`, `a-slow-road-is-not-a-dead-one.test.jsx`, `every-poe-properties-page-is-reportable.test.jsx`

**Amends:** 0153's read policy (DR-0941 era) on one point: a tenant and their household now read the door's LISTING pictures and its rooms while the landlord's switch is on; 0153's guard on condition pictures stands. DR-1155 / the `viewAs` preview of 2026-10-21 on one point: the preview is one door, through that person's wall, not the owner's board behind another face.
**Grounds:** DR-0076 §3 (a gate ships proven to catch) and §8 (the card names its cause), DR-0061 (the surface a reader meets), DR-0330 (a door that reaches nothing is a lie), DR-0946 (could not read is never there are none), DR-0104 (reviewer mode is not a key), DR-0219 (SHOULD → ARE → GAPS → CLOSE), UX-PATTERNS 2e (open in place), 2f.2 (a dropdown never dead-ends), 2g (36px, focus, a glyph carries its name).
**Declared by:** Darrell, 2026-10-21, from the Properties tab on the TV, in four messages: *"when we go through to look at it as a tenant, as a person that lives in the home, or as a 1099 worker, the photos don't align with that person's perspective... the properties can't even be pulled up at all... If the 1099 worker needs to be able to see the pictures in that specific apartment, the drop down needs to work effectively within that specific apartment."* — *"the available now, looking for a place in the properties tab... is not publishing well."* — *"we do need their last landlord's name and phone number directly from them... that should be mandatory and previous address. And their monthly rent that they paid should be mandatory as well."* — *"We have images on multiple doors, and those images should be able to be seen by the people we are adding to the system, or if we decide we want them to... Make sure that the critical path is explicitly doing exactly what it needs to do."*

## Context

**SHOULD.** A tenant, a household member and a 1099 worker open the Properties app and see the place they live in or work on: its pictures, room by room, and nothing of any other door. The owner, looking "as" one of them from the PoeTech tab, sees exactly what that person would. A visitor on the front door sees every advertised door with its listing pictures. An application tells the landlord who the applicant rented from, how to reach them, where they lived before, and what they paid.

**ARE, traced in the code and on the TV's screenshot.**

1. **The data wall withheld every door-level picture from a tenant.** 0153's read policy gives a tenant and their household only pictures with `tenancy_id` = theirs (`infra/supabase/migrations-auto/0153-property-timeline-photos.sql:183`). The apartment's own pictures — the listing shots, the rooms — have no tenancy and stayed the landlord's alone; `property_rooms_read` (0153:126) was management-only, so a tenant's room dropdown could never name a room. A delegated worker reads door-level pictures and rooms since 0185 (`0185-...sql:106`). The tenant's face had no Pictures tab at all (`model.js` TENANT_TABS).
2. **The "seen as" preview changed only the face.** `PropertiesApp.jsx:286-290` said so by design: "Only the FACE changes." The data stayed the owner's: the door picker listed every door (`doorChoices`, line 552), the worker's My doors board drew every door with every picture, the Pictures tab drew the whole apartment including the rest of the building (`sharedPhotos`). That is the misalignment Darrell saw.
3. **The not-reached card on the TV was the honest answer to a device with no road.** The footer in his screenshot read OFFLINE (NetworkStatus's probes, `navigator.onLine` false); the app had loaded from its cache and the card showed every spine read `not-reached` (the 6 s ceiling, `lib/bounded-read.js`), with the one background retry (DR-0950) also unanswered. The card named the reads and said what the database said; it did not say the device itself was offline, so it read as a server fault.
4. **"Available now" draws only what is advertised, with only listing shots.** `public_vacancies()` (0288) lists a door only when `listed_at IS NOT NULL`, it is not the family's own home, and no tenancy on it is active; `public_vacancy_photos()` (0291) returns only `kind = 'listing'` pictures of that door and its apartment-mates. The board's Advertise button sets `listed_at` (`PropertiesApp.jsx` setListing). A door advertised with pictures filed under any other kind is advertised with a blank card, and nothing on the board said so.
5. **The application asked for the previous landlord and the rent, but did not require them.** `intake.js`: `currentAddress.landlordName / landlordPhone / monthlyRent` and every `previousAddress` field were optional; `validateApplication` refuses only required fields.

**GAPS.** Five, named above. **CLOSE.** Below, each with its proof.

## What was measured

| what | before | after |
|---|---|---|
| what a tenant reads of their door's pictures (0309 smoke, real PostgreSQL) | their own tenancy's only | + the door's listing shots and its rooms while the switch is on; never a turn shot; nothing of another door |
| the household member | as the tenant | as the tenant |
| the delegated worker | the door's pictures (0185) | unchanged, switch or no switch |
| a stranger | nothing | nothing |
| the smoke, proven to catch | — | a policy leaking the turn shot fails it: "expected 1, read 2" |
| tabs on the tenant's face | 9 | 10 (Pictures), 27 surfaces in the module, 28 feedback keys |
| doors a tenant preview stands on | the owner's whole board | one (chosen in the bar), no door picker over the board |
| pictures the tenant preview draws on 1003 Koehn Dr (two doors, four pictures) | 4 | 2: the listing shot and the tenancy's own |
| doors the 1099 preview's My doors draws | every door | the one they are sent to |
| mandatory screening fields | 0 of the landlord/rent/previous-address set | 10 (both landlords' name and phone, both rents, the previous street, city, state, ZIP) |
| the not-reached card on an offline device | names the reads only | + "This device says it is offline right now" |
| an advertised door with no listing pictures | silent | the board says so where Advertise is, in both views |

## Decision

1. **A door shows its listing pictures and its rooms to its tenant and household, while the landlord allows it (0309).** The switch is per door, `pictures_shared_with_door`, ON by default ("or if we decide we want them to"); the edit form carries it as a word, with the sentence under it saying what the database will do. Condition pictures of other tenancies stay closed (0153's reason stands); a worker's delegated read and the owner's are untouched by the switch. The tenant's face gains a **Pictures** tab (`DoorPictures.jsx`): read-only, the door resolved by `door_of_my_tenancy`, a room dropdown that names this apartment's rooms and nothing else, a picture that opens in place, and three honest states (door not known, could not read, nothing shared).
2. **The "seen as" preview is one door, through that person's wall.** `preview.js` mirrors the read policies — the way `model.js` mirrors 0150, stated so the duplication is a decision — and `PropertiesApp` cuts doors, rentals, pictures, orders and the per-door read to what that role would read on the chosen door. A **Their door** chooser in the bar picks the door; the ordinary picker then shows the one tenancy or the one door. Who is really signed in never changes: `realRole` and every write read the raw lists, so a work order filed from the preview is still the landlord's.
3. **The screening application requires who they rented from, how to reach them, what they paid, and where they lived before.** `intake.js` marks the ten fields required; the validator refuses without them; the form shows the asterisk.
4. **The not-reached card names the device when the device is the reason.** When `navigator.onLine` is false the card says so, so a person does not chase the server for a cable.
5. **The board says when an advertised door has no listing pictures,** in both the grid and the list, where the Advertise button is — because the public card draws only listing shots, and a visitor must never be the one to find the blank.

## Impact

A tenant opening Poe Properties sees the pictures of the place they live in, room by room, and nothing of the neighbours. Darrell can hold a door's pictures back with one choice on its edit form. Looking "as" a tenant or a worker from the PoeTech tab now shows him exactly what that person sees on one door, which is the whole reason the preview exists. An applicant cannot submit without telling him who they rented from and what they paid. The TV's card, next time, will say the TV is offline.

## Verification

- **The data wall, on a real PostgreSQL 16 in this sandbox:** the door-work leg's full chain (`scripts/door-work-ci-bootstrap.sql`, the schema files, every migration the leg lists, 0309 applied twice) ran to exit 0 with `DOOR PICTURES SMOKE: PASS`; with the listing filter removed from the policy the smoke failed on "the tenant reads only the listing shot among D's door-level pictures (expected 1, read 2)"; restored, it passed again. CI runs the same leg, and `rls-isolation.yml` runs the smoke on the live database.
- **The app:** `properties-work-on-any-door` 24 cases (seven added: the tenant's Pictures tab with the room dropdown and in-place open, the two honest states, the landlord's face without it, the one-door tenant preview and its pictures, choosing the other door, the one-door worker board, the preview's write still the landlord's, the board notice both ways); `the-preview-is-one-door-through-their-wall` (the 0309 scenario in JavaScript, every wrong sight asserted absent); `a-door-shows-its-pictures-to-its-people` (the switch word, the migration text, the smoke and both CI legs pinned); `properties-intake` (the ten required fields and the validator refusing without one); `a-slow-road-is-not-a-dead-one` (the offline line, and its absence online); `every-poe-properties-page-is-reportable` (27 surfaces, 28 keys). Lint 0.
- **Not seen rendered:** this sandbox has no route to poetech.us; the live pass on his phone and the TV is his, after deploy (DR-0104). On the TV, the first check is the footer: OFFLINE means the device, not the server.

## What this does not do

- It does not open condition pictures (turn, move-in, move-out, damage, inspection) of other tenancies to a tenant; 0153's reason stands and the smoke pins it.
- It does not change what a visitor sees: the public card still draws listing shots only. If Darrell wants other kinds on the card, that is a new decision.
- It does not put a worker's own Pictures tab through the preview's room dropdown beyond what GalleryTab already does on one door; the worker's gallery is that door's, read-only on the rest. `re-review: 2026-10-28` with the live pass: whether the worker's Pictures tab wants the same read-only room view the tenant has.
