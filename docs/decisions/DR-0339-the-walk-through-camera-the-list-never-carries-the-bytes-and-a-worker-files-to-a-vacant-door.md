# DR-0339 — The walk-through camera: the picture list never carries the bytes, and a 1099 worker can file to a vacant door

- **date:** 2026-09-08
- **status:** accepted
- **tier:** B (one additive migration — a column and delegate-only RLS arms; no money, no public surface widened; the front door is unchanged)
- **decides:** how a picture taken on a walk-through reaches both property surfaces without becoming the next egress lockout; who may file one; what the landlord's own face is allowed to lock
- **pairs-with:** DR-0303 / P40 (the list never carries the bytes), DR-0101 / migration 0075 (delegated property management, the capability vocabulary), DR-0124 (property records read images-first and chronological), DR-0131 (one dictation primitive), DR-0076 §3 (proven-to-catch), DR-0061 P15 (a surface is a live view of real state), DR-0331 (spoken input captured for meaning)
- **source:** Darrell, 2026-09-08, on his way to 805 North Prospect Avenue Apt 2, Champaign — Corion Mallory (1099) is installing a microwave and ductwork there, then rebuilding the foyer stairs by the washer and dryer: *"take pictures of the rooms... upload these into the app inside of the property section as well as inside of the other section for rentals... our ten ninety nine workers are able to add pictures. And we don't want them to be so big that it overruns and undermines our process... I can take a picture and then say a voice note of some sort, and it captures the information."*

## SHOULD / ARE / GAPS (DR-0219), run before a line was written

**SHOULD.** The Poe Properties door carries the pictures (`property_photos`, 0153–0161); the Real Estate record reads images first and chronological (DR-0124); a 1099 worker holds "Add job documentation" (0075: `docs.add`); no list carries image bytes (DR-0303); a spoken caption rides the one dictation primitive (DR-0131).

**ARE — traced on the live app (his four screenshots) and in code.**

1. The Pictures tab worked for the landlord: many files at once, compressed to 1280px JPEG (`lib/image.js`), stored as a data URL in the row. No camera button; the caption was one line for the whole set; no way to speak it.
2. **The Doors board read every picture's full bytes on every boot** — `loadAllPhotos` selected `storage_path` for every photo on every door to choose one cover per door. Zero pictures on the board today; fifty after a walk-through; that is the DR-0303 shape, and it was one afternoon away.
3. **The landlord's own screen said `WORK BOARD · LOCKED`, `DISPATCH · LOCKED`, `MESSAGES · LOCKED`, `RENT · LOCKED`.** `resolveFace` locked any tab whose capability was not in the person's grant list; the owner's grant list is empty *because* the database grants him everything as an instance member (his `ROLE_CEILING` is `[]` for that reason). An empty list was read as "not turned on".
4. **A worker could file a picture only through a tenancy.** The 0153 insert arm resolves `docs.add` through `rental_tenancies`; Apt 2 is between tenants, which is exactly when the turn is done, so Corion had no path — and no way even to see the door (`rentals_member_read` is instance membership only).
5. **The Real Estate strip did not read the cloud pictures at all** — room photos on the device, maintenance shots, the NAS chat archive; never `property_photos`.

**GAPS → all closed below.** Nothing carries a `re-review:` date; everything was buildable now (DR-0236).

## Decision 1 — The list never carries the bytes (the DR-0303 rule applied to pictures)

Migration **0185** adds `property_photos.thumb_path`: a ~320px JPEG data URL written beside the image at upload, roughly a tenth of the bytes. Every list — the Doors board's covers, the door's gallery grid, the Real Estate strip — reads `PHOTO_LIST_COLUMNS`, which names `thumb_path` and **never** `storage_path`. The full image is read in exactly one place (`loadPhotoImages`), by id, bounded to one batch (24), and refuses more rather than truncating silently. Pictures from before the column (there are none on the live board today) are hydrated once, bounded, so an older gallery never goes blank. `thumb_path` is deliberately absent from every UPDATE grant: it is as frozen as the image it stands for, by omission rather than a further trigger arm.

## Decision 2 — The camera, and a caption you can say

The form now has **Take a photo** (`capture="environment"` — the back camera in one tap; a desktop browser ignores it and offers files) beside **Choose from this phone** (`multiple`, no capture). Every queued picture gets its own caption box, and every caption box gets **Speak** where the browser can hear (the shared `useVoiceDictation`, push-to-end, five-minute brake), or stays type-only where it cannot. A picture taken through the camera here is stamped `taken_at = now` because that is when the shutter fired; one picked from storage is left undated rather than given an invented time (DR-0076).

Two standing gates spoke to this and were **sharpened, not loosened**: `upload-inputs.test.js` (no `capture` since the 2026-07-05 camera-only receipt bug) now allows a camera input **only** when a plain image chooser stands beside it in the same file and the camera takes one shot — checked structurally, so a camera-only surface still fails; `ui-standards-guard.test.js` (image pickers take many) counts a camera beside a `multiple` picker as many. The gates' own text asked for exactly this: "if a surface ever genuinely needs live capture, record it and adjust this gate to allowlist that one input."

## Decision 3 — A worker files to the DOOR he is sent to, tenant or no tenant

0185 adds `user_delegated_can_rental(rental uuid, capability)` — 0075's own shape (STABLE, SECURITY DEFINER, `setting = 'allow'`, `scope_ref = slug OR '*'`), resolved through `rentals` instead of `rental_tenancies` — and three **additive** policies: the delegated person may **read** the door (`rentals_delegate_read`), read its rooms, read its pictures, and **insert** a picture as himself (`uploaded_by = auth.uid()`) on `docs.add`. No door-level UPDATE or DELETE for a delegate: he files evidence; he does not re-caption or archive the landlord's record. The 0153/0154 policies are not rewritten, so nothing that was true is loosened, and the public surface (`public_vacancy_photos`, listing kind only) is untouched.

The worker's face gains **My doors** (the doors board, read-only) and **Pictures** (may add, may not arrange or archive), both gated on `docs.add` and both saying why when shut. The landlord grants it where he always has: People → invite → "I do the work (1099)" → *Add job documentation*.

## Decision 4 — The landlord is never locked out of his own tabs

`resolveFace('owner', …)` locks nothing. A lock is for a delegate whose landlord has not said yes; the landlord is the one who says it. Because the landing tab was "first unlocked", and Doors was first only because Work board was wrongly locked, the landing tab is now **Doors** whenever the face has it, and first-unlocked otherwise.

## Decision 5 — One store, two surfaces

The Real Estate `PropertyGallery` now reads the same `property_photos` rows by the record's `remoteUuid` (the cloud `rentals.id` the sync already carries), thumbnails only, into the same oldest→latest strip beside the room, maintenance and NAS pictures, labelled *Poe Properties · kind*; the full image is fetched by id when opened. A picture taken on the door appears in both places because it is one row, not two uploads.

## Proven-to-catch (DR-0076 §3)

`property-photos-list-carries-no-bytes.test.js` (23 cases): putting `storage_path` back in the list columns, restoring `select('*')` in either list loader, raising or dropping the batch bound, drawing `storage_path` in the grid, dropping `thumb_path` from the migration or granting UPDATE on it, removing the door-level `docs.add` arm or its `uploaded_by` check, or rewriting a 0153/0154 policy — each fails a named case. `properties-door.test.js`: an owner with no grants has zero locked tabs; a worker with `docs.add` has Doors and Pictures, and without it sees why they are shut. `properties-qr-gallery-files.test.jsx`: the camera input exists and takes one shot, the chooser takes many, Speak appears only where the browser can hear, a worker who may add gets no Remove/Cover/Edit, and opening a picture is the first and only time the full image is asked for. The two sharpened gates fail on a camera with no chooser beside it.

## What this does NOT do (honest remainder, each with its reason)

- **Work orders still hang on a tenancy** (`tenant_maintenance_requests.tenancy_id NOT NULL`, 0055). Corion's three jobs on a vacant Apt 2 are documented today as pictures (`work-order-before` / `work-order-after`, captioned by voice) and as Systems events (the microwave, the ductwork); a door-level work order is a schema change to a table five policies share. *re-review: 2026-09-15* — a `rental_ref` anchor on work orders, the same move 0153 made for pictures.
- **The public storefront still reads `storage_path`** through `public_vacancy_photos` — bounded already to listing shots of advertised, empty doors. *re-review: 2026-09-22* — add `thumb_path` to that function's return (a return-type change, so it needs the DROP the 0185-era guard requires).

## Consequences

Every list in the app that shows a picture reads a thumbnail; the full image is a deliberate, single, bounded fetch. A worker sent to an empty apartment can see it and document it from his phone the day he is sent. The landlord's screen never locks the landlord out. The migration rides db-migrate on merge; the live-definition witness will carry the new function's fingerprint from the file itself.
