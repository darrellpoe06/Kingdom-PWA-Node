# The walk-through camera at 805 Prospect Apt 2 — pictures that reach both surfaces without becoming the next lockout

**Date:** 2026-09-08
**Branch:** `claude/property-photos-project-docs-cdsexr` (from `main` @ `a5e5a29`)
**Rules in force:** DR-0219 (SHOULD / ARE / GAPS before building) · DR-0303 / P40 (the list never carries the bytes) · DR-0076 §3 (proven-to-catch) · DR-0111 / DR-0236 (do the work; nothing waits) · DR-0131 (one dictation primitive) · DR-0101 (delegated property management)
**Decision record:** DR-0339

---

## What was asked

Darrell, leaving for 805 North Prospect Avenue Apt 2, Champaign, where Corion Mallory (1099) is installing a microwave and ductwork and will then rebuild the foyer stairs by the washer and dryer: photograph the rooms; have the pictures land in the property section and the rentals section; let 1099 workers add pictures; keep them from being "so big that it overruns and undermines our process"; take a picture and say a voice note that captures the information; and make sure the whole process works before he arrives.

## What the trace found (his four screenshots + the code)

| # | Finding | Where | Class |
|---|---|---|---|
| 1 | The Doors board fetched every picture's full data URL on every boot to choose one cover per door | `cloud.js loadAllPhotos` selected `storage_path` | DR-0303 shape, one walk-through away |
| 2 | The landlord's screen: `WORK BOARD · LOCKED`, `DISPATCH · LOCKED`, `MESSAGES · LOCKED`, `RENT · LOCKED` | `model.js resolveFace` locked on an empty grant list; the owner's list is empty by design | face bug, live |
| 3 | A worker could file a picture only through a tenancy; Apt 2 has none | 0153 insert arm resolves `docs.add` via `rental_tenancies` | structural gap |
| 4 | No camera button; one caption for the whole set; nothing to speak into | `DoorTabs.jsx GalleryTab` | the walk-through UX he described |
| 5 | The Real Estate strip read room / maintenance / NAS pictures, never `property_photos` | `Rentals.jsx PropertyGallery` | "both sections" not true |

## What changed

- **`infra/supabase/migrations-auto/0185-…sql`** — `thumb_path` column (not in any UPDATE grant); `user_delegated_can_rental()`; additive `rentals_delegate_read`, `property_rooms_delegate_read`, `property_photos_delegate_read`, `property_photos_delegate_insert` (`uploaded_by = auth.uid()`, `docs.add` only); overlays re-applied. 0153/0154 untouched.
- **`cloud.js`** — `PHOTO_LIST_COLUMNS` (no `storage_path`), `loadPhotoImages(ids)` bounded to 24 and refusing more, `hydrateLegacyImages` for pre-0185 rows; both list loaders use the named columns.
- **`photo-order.js`** — `pickCovers` (the board's cover rule, now pure and byte-free), `listImage`.
- **`DoorTabs.jsx`** — GalleryTab: Take a photo (`capture="environment"`, one shot) beside Choose from this phone (many); a caption per queued picture; `CaptionField` with Speak via `useVoiceDictation`; thumbnail written at upload; grid draws thumbnails; Lightbox fetches the full image by id on open; `canAdd` separate from `canManage`. DoorsBoard covers via `pickCovers` / `listImage`.
- **`model.js`** — owner face locks nothing; worker face gains My doors + Pictures on `docs.add`.
- **`PropertiesApp.jsx`** — lands on Doors; bounded cover hydration; worker `canAdd`; `loadImage` wired; the tenancy list is the landlord's only.
- **`Rentals.jsx`** — PropertyGallery reads the cloud rows by `remoteUuid`, thumbnails, full on open.
- **Gates sharpened** — `upload-inputs.test.js` (camera allowed only beside a chooser, structurally) and `ui-standards-guard.test.js` (a camera beside a `multiple` picker counts as many).
- **New test** — `property-photos-list-carries-no-bytes.test.js` (23 cases, each proven-to-catch); face and gallery cases added to existing suites.

## Evidence

- `npx vitest run` — full suite green after the gate sharpening (12,7xx tests, 0 failed; exact count on the PR).
- `npx eslint src --max-warnings 0` — clean.
- Migration guards (`migration-replay-order-guard`, `migration-return-type-guard`) and the ten CI guard scripts — all OK.
- Not verified here: the migration applied to the live database (it rides db-migrate on merge; the live-definition witness carries `user_delegated_can_rental`'s fingerprint from the file). The camera and Speak buttons on a real phone — jsdom proves the attributes and the branch, not Android's chooser. Darrell's first walk-through is the live check, per DR-0104.

## Remainder, dated

- Door-level work orders (`tenant_maintenance_requests.tenancy_id NOT NULL`) — `re-review: 2026-09-15`.
- Storefront `public_vacancy_photos` returning `thumb_path` — `re-review: 2026-09-22`.
