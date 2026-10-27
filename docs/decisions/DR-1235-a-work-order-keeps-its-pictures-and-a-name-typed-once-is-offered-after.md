# DR-1235: A work order keeps its pictures, a note carries them, and a name typed once is offered after

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (additive: two nullable columns and a widened anchor CHECK on property_photos, two additive RLS arms for the assigned worker, one new table with one writer RPC, a control on the triage detail, a datalist on the gallery's caption boxes; no gate relaxed, no lane touched, no money; 23 vitest cases + one SQL smoke proven to catch)
**Type:** surface + schema
**Area:**
- `infra/supabase/migrations-auto/0310-a-work-order-keeps-its-pictures-and-a-name-typed-once-is-offered-after.sql` (new — `property_photos.note_id` / `incident_ref`, the anchor CHECK widened to a work order or an incident, `user_is_assigned_to_request()`, `property_photos_work_order_read` / `_insert`, `picture_names` + `user_may_name_pictures()` + `remember_picture_name()`)
- `infra/supabase/tests/0310-work-order-pictures-smoke.sql` (new — rolls back; `WORK ORDER PICTURES SMOKE: PASS`)
- `.github/workflows/ci.yml` (door-work leg: 0310 twice, then the smoke), `.github/workflows/rls-isolation.yml` (poe-properties leg lists 0310 and its smoke), `scripts/e2e/build-door-db.sh` (0310 in the replay)
- `app/src/lib/work-order-pictures.js` (new, pure — the names on offer, the row a picture becomes, the pictures of an entry / a note)
- `app/src/components/WorkOrderPictures.jsx` (new — `AddPictures`, `PictureNamePicker`, `PictureStrip`)
- `app/src/components/WorkOrderTriage.jsx` (the pictures read with the queue; thumbnails under each note and on the work order; the `pictures` action; `photoOps` injected)
- `app/src/modules/properties/cloud.js` (`loadWorkOrderPhotos`, `WORK_ORDER_PHOTO_COLUMNS`)
- `app/src/modules/properties/picture-names.js` (new — `loadPictureNames`, `rememberPictureName`, `NAMES_OPS`; its own module so the suites that mock cloud.js are untouched)
- `app/src/modules/properties/DoorTabs.jsx` (`CaptionField` offers the remembered names; `GalleryTab` remembers a saved caption)
- `app/src/lib/work-order-triage.js` (`fromRequest` keeps each note's id)
- `app/src/__tests__/a-work-order-keeps-its-pictures.test.jsx` (new — its gate)

**Amends:** nothing. **Grounds:** DR-1213 (the triage), DR-1215 (acting in place on a work order), DR-0065 (one record, surfaced where the person is), DR-0303 (a list never carries the bytes), DR-0937 (pictures as proof on a job), DR-1199 (0309, the pattern this migration follows).
**Principles:** APP-IS-PRIMARY, REALITY-TRACE, VERIFICATION-DOCTRINE, HOLD-THE-HAND.

## Context

Darrell, 2026-10-27, from his phone on Big Picture → Work order triage, standing on #13 ("Exhaust Fan and microwave installation inside apartment 2", CHECK IT, "Coreyon is working on this…", submitted, Coreyon Mallory, "none → photos"): *"Need to be able to upload pictures to the workorders and notes for images"* and *"also when adding a new name for an image it should be automatically one of the options moving forward."*

Two asks. A picture on a work order, and a note that carries pictures — the worker's before/after on his job note, the owner's check with a photo. And wherever a picture is given a name from a list, a name typed once becomes one of the offered names for every later picture, persisted, not for one session on one phone.

## What was measured

1. **The record already existed and nothing wrote it.** `property_photos` (0153) carries `request_id` — the column comment says *"optional: a work order's before/after"* — and the kinds `work-order-before` / `work-order-after`. `grep` across `app/src` for a write of `request_id` into `property_photos`: none. The triage's **Add a note** (`WorkOrderTriage.jsx`, `REQUEST_OPS.note`) writes `tenancy_notes` only; an incident's note goes to its lifecycle log (`poe-financial-mvp-v28.jsx` `_logNote`). The worker's own job picture goes to `request_documentation.image_data` (`PropertiesApp.jsx` `attachPhoto`, 0264) — a second store the door's wall never reads.
2. **A picture had no column for the note it rides on and no anchor for a building's work order.** 0153's `property_photos_has_an_anchor` is `rental_ref IS NOT NULL OR tenancy_id IS NOT NULL`; a Real Estate incident on a building's foyer (DR-1216, `linkedTo.type = 'building'`) has neither, and the shell keys incidents by a text id (`in-1761500000000`, `addIncident`).
3. **The worker a job was GIVEN TO could not file.** 0153's insert arm reaches an enabled worker on a tenancy (`tenancy_worker_access`, 0075) and 0185's a delegate with `docs.add` on the door. `tenant_maintenance_requests.assigned_to` (0062) — the column the triage's **Give it to** sets — was in no policy on `property_photos`.
4. **The name memory was one phone, one session.** `DoorTabs.jsx` `rememberedKind` / `rememberKind` keep the last KIND in `localStorage`; captions are free text with no memory at all; the only persisted picker list is `property_rooms`, per door.
5. **The "none → photos" line** is `door_events` on `proof_required` (0264, `proof.js` `PROOF_OPTIONS`): the job was marked *pictures required for payment* — and the owner had no way to attach any from the screen that said so.
6. **The smoke caught a real hole on the first run.** `user_may_name_pictures()` as first written returned NULL for a stranger (`NULL IN (...)` is NULL; `IF NOT NULL` does not raise), so a stranger's `remember_picture_name()` went through: `WORK ORDER PICTURES SMOKE FAIL: a stranger names nothing (expected write-succeeds=f, got t)`. `coalesce(..., false)` closed it; the smoke then passed on a fresh PostgreSQL 16 built from the door-work leg's exact chain (bootstrap, schemas, 0052…0185, then 0260…0309 and 0310 each applied twice).

## Impact

A picture on a work order lived nowhere the owner could put it, so proof stayed on the worker's phone and "pictures required for payment" could not be met from the triage. The record that would have shown it on the door's wall (DR-0065: one record, surfaced where the person is) existed and sat empty. A name given to a picture was lost the moment the phone changed.

## Decision

1. **The picture lives in `property_photos`** — the same wall the door's move-out set hangs on — with `request_id` (a Poe Properties work order) or `incident_ref` (a Real Estate incident), `rental_ref` when the work order is on a door (so it shows on the door's wall too), and `note_id` when it rides a note. The anchor CHECK accepts a work order or an incident. No second write to the NAS: the door pictures do not make one, so neither does this.
2. **The assigned worker is a person the wall knows.** `user_is_assigned_to_request()` (SECURITY DEFINER, as `user_is_enabled_worker`); he reads the job's pictures and files his own, `uploaded_by` himself, on that job only — no UPDATE arm, as a delegate. Whoever may read the work order reads its pictures (the tenant whose door it is sees the before/after). The owner, the household and the delegate are untouched (0153, 0185, 0309).
3. **The screen is the triage detail** (Big Picture → Work orders → open one): **Take a picture** (44px, `capture=environment`, one shot — the upload-inputs gate, DR-0339) / **Choose from this phone** (several at once); the name chips; an optional note the pictures ride; thumbnails under each note and on the work order; tap opens the full picture. The note is written first with an id made on the device; the pictures name it. A refused picture is counted and said, never claimed (DR-0076).
4. **A name typed once is offered after.** `picture_names`: one row per name per instance, matched without case or stray spaces (`name_key` generated), `remember_picture_name()` its only writer (adds, or counts a reuse). Offered: the six defaults in their order, then every remembered name A→Z; the derived kind (`kindForPictureName`) satisfies 0153's CHECK, which stays a guard, not a label. The gallery's caption boxes list the same names and remember a saved caption.

## Verification

- `infra/supabase/tests/0310-work-order-pictures-smoke.sql` — proven to catch (item 6 above) and green on the fresh chain; CI runs it in the door-work leg (0310 applied twice first) and on the live database in rls-isolation's poe-properties leg. `migration-replay-order-guard`, `inline-constraint-replay-guard`, `newest-definition-replay-guard`: OK.
- `app/src/__tests__/a-work-order-keeps-its-pictures.test.jsx` — 23 cases: the names' order and case-fold, the row a picture becomes (an incident never names a note — caught on the first run and fixed), the migration and both CI legs pinned at the text, the triage mounted (the note's picture under the note, the 44px camera control, a new name remembered once a picture carrying it is saved, a refused store said as not saved with the name not remembered, an incident's picture on the family instance, a failed read said as unknown, tap-to-open), the gallery's datalist and its remembered caption.
- The live push: open #13 on the phone, take one picture with the note "fan in, microwave mounted", see the thumbnail under the note and on 805 Apt 2's Pictures tab; Coreyon, signed in as the assigned worker, files the after picture from his job. re-review: 2026-11-10 — whether `request_documentation.image_data` (the worker's older road) should fold into this record so one wall holds every job picture.
