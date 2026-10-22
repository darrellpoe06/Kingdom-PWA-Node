# 2026-10-21 — The Properties tab reviewed end to end for its tenant, household and 1099 worker

**Decision record:** DR-1199
**Source:** Darrell, from the Properties tab on the TV: the pictures did not align with a tenant's or worker's perspective; the properties could not be pulled up; "Available now" was not publishing well; the screening must require the previous landlord, previous address and rent; images on the doors should be seen by the people added to the system, or when the family decides.

## What was found (ARE)

- A tenant read only their own tenancy's pictures (0153); every door-level picture and every room was the landlord's alone, and the tenant's face had no Pictures tab.
- The "seen as" preview changed only the face; the data stayed the owner's whole board.
- The TV's card was honest about the reads and silent about the device: the footer read OFFLINE.
- "Available now" draws only advertised doors (`listed_at`, no active tenancy, not the family's home) and only `listing` pictures; a door advertised with none had a blank card and nothing said so.
- The previous landlord, phone, rent and previous address were asked for, not required.

## What was built

| piece | file |
|---|---|
| the data wall: the per-door switch, the tenant's and household's read of listing pictures and rooms | `infra/supabase/migrations-auto/0309-a-door-shows-its-pictures-to-its-people.sql` |
| its proof, in both CI legs | `infra/supabase/tests/0309-door-pictures-smoke.sql`, `ci.yml` (door-work), `rls-isolation.yml` (live) |
| the tenant's Pictures tab, room by room, read-only, honest states | `app/src/modules/properties/DoorPictures.jsx`, `model.js`, `PropertiesApp.jsx` |
| the landlord's switch on the edit form | `app/src/modules/properties/DoorTabs.jsx`, `cloud.js` |
| the preview mirror: one door, through that person's wall; the Their-door chooser | `app/src/modules/properties/preview.js`, `PropertiesApp.jsx` |
| the mandatory screening fields | `app/src/modules/properties/intake.js` |
| the offline line on the not-reached card; the board's no-listing-pictures notice | `PropertiesApp.jsx`, `DoorTabs.jsx` |

## What was measured

- The door-work chain ran locally on PostgreSQL 16: exit 0, `DOOR PICTURES SMOKE: PASS`; the smoke fails when the policy leaks a turn shot ("expected 1, read 2").
- Gates: `properties-work-on-any-door` 24, `the-preview-is-one-door-through-their-wall`, `a-door-shows-its-pictures-to-its-people`, `properties-intake`, `a-slow-road-is-not-a-dead-one`, `every-poe-properties-page-is-reportable` — all green; lint 0.

## What this does not do yet

- Nobody has seen it rendered; the live pass on the phone and the TV is the stewards' after deploy (DR-0104). On the TV, check the footer first: OFFLINE means the device.
- The worker's own Pictures tab keeps GalleryTab; whether it wants the tenant's read-only room view is `re-review: 2026-10-28`.

## Addendum — who sees what, and the 1099 worker's cameras (DR-1198)

Darrell then asked for workers to be given more than tenants or short stays (the basement camera; pictures), said a gift to a worker on Apt 2 "would not work", and asked that all access per user be evaluated. Traced: every leg of a gift already accepts any cameras for a worker (the NAS grammar; 0266's trigger checks the menu only for an ask); a delegated worker already reads every picture on the door. What failed was legibility: the app said "pick at least one camera" for a bad id and `write-failed` for a database refusal. Built: `access-matrix.js` + `AccessMatrix.jsx` on the People tab; `badCameraIds` and the NAS's own code and the database's message in the refusal; the 0266 smoke gives a worker five cameras, three off the menu (fresh PostgreSQL 16: PASS).
