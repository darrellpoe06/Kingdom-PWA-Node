# DR-1016: A listing loads one picture at a time — the public picture list never carries the bytes

**Date:** 2026-10-14
**Status:** accepted
**Area:**
- `infra/supabase/migrations-auto/0290-a-listing-list-never-carries-the-bytes.sql` (`public_vacancy_photo_list(p_rental)`: the same rows in the same order as `public_vacancy_photos`, without `storage_path`, plus `has_thumb`; `public_vacancy_picture(p_rental, p_id, p_size)`: one picture's bytes, thumbnail first, only while it is in the unit's showable set)
- `infra/supabase/tests/0290-listing-bytes-smoke.sql` (LISTING BYTES SMOKE: PASS)
- `app/src/modules/properties/cloud.js` (`loadVacancyPhotos` reads the list; `loadVacancyPicture` reads one)
- `app/src/modules/properties/Storefront.jsx` (the card asks for the picture on it and the next, thumbnail first; the full image only when one is opened; each asked for once; "Loading picture n of N" while it is on its way)
- `app/src/__tests__/a-listing-loads-one-picture-at-a-time.test.jsx` (4; proven to catch)
- `.github/workflows/ci.yml`, `.github/workflows/rls-isolation.yml`, `scripts/e2e/build-door-db.sh`, `scripts/e2e/door-journeys.mjs` (0290 and its smoke wired; the journeys read a card's picture bytes and the `pictures` fault)

**Amends:** DR-0303 / 0185 (the list never carries the bytes: the rule now holds on the stranger's road too), DR-0984 / 0282 (the showable set and its order are unchanged; the wrapper reads them)
**Declared by:** Darrell, 2026-10-14: *"The data not Poe Properties seems slow... period... why can't we make it almost instant to see the images and information? It takes about 10 - 20 seconds to populate... can we fix that?"*; *"Data opening up Poe Properties Apps takes a little time to get information... images... etc... understand?"*

## Context

A listing's pictures live in the row as data URLs (0153: the insides of people's homes inherit RLS that way), compressed to 1920px at upload with a 640px thumbnail beside each (0185). On the family's side every list reads the thumbnail and the full image is fetched by id when opened (DR-0303, P40: "the list never carries the bytes"). The stranger's road was left as it was: `public_vacancy_photos` returns every showable picture WITH its full `storage_path`, and the card reads it on mount.

## What was measured

- `Storefront.jsx` mounts and calls `loadVacancyPhotos(unit.rentalId)` → `public_vacancy_photos`, which returns `storage_path` for every row (0282). The bed at 805 shows "See all 37 photos", so one card reads 37 full-size images (1920px JPEG at 0.8, on the order of 200–500 KB each, on the order of 10 MB in one response) before it can show the first; the shelf shows three cards of that building, so the same bytes are read three times. That is the 10–20 seconds on his Fold.
- 0185's own header names the class: "every LIST of photos was carrying every image's full bytes… the 2026-08-14 lockout was a list that carried 6.2 MB of base64 once per sign-in" — and ends "public_vacancy_photos, unchanged".
- The card shows ONE picture at a time (the strip steps through them), and the lightbox opens one at a time.
- The deploy's listing-share pages (`scripts/listing-share-pages.mjs`) read `public_vacancy_photos` on a runner for one picture per listed unit; the e2e `share` fault revokes it; two smokes pin it. It stays.

## Impact

- Unresolved: every card on the open shelf waits on megabytes it will not show, on every visit, by every stranger, on phone data; the shelf is the advertisement and it opens in 10–20 seconds.
- The call obligates: the showable set and its order unchanged (0282's rules are the one place that decides what a stranger may see); nothing a stranger could not already read; a picture still reachable by id only while it is showable; the family's own lists untouched.

## Decision

1. **The list never carries the bytes, on the stranger's road too.** `public_vacancy_photo_list(p_rental)` wraps `public_vacancy_photos` (the same rows, the same order, by ordinality) and returns id, caption, taken_at, from_sibling and `has_thumb`.
2. **One picture at a time.** `public_vacancy_picture(p_rental, p_id, p_size)` returns one picture's bytes: the 640px thumbnail for `'thumb'` (the full image when the upload wrote none), the full image for `'full'`; NULL for a picture outside that unit's showable set or on an unlisted door, never an error.
3. **The card asks as it goes.** It reads the list, asks for the picture on the card and the next one (thumbnails), asks for each only once, and asks for full images only when a picture is opened large — the open one first, then the rest in order so a swipe finds its picture ready. A row that already carries `storage_path` (an older list, a test) is used as it is.
4. **`public_vacancy_photos` stays** for the deploy's share pages and the pinned proofs.

Not done, and said: pictures uploaded before 0185 have no thumbnail and are answered full-size, one at a time; the family's app could write thumbnails for them on a visit to the door (`re-review: 2026-10-21`, with the measured load time on the Fold after this deploys). The family's shelf (`Rentals.jsx`, signed in) reads its own lists already (0185).

## Verification

- **0290 smoke** on a local door database built by `build-door-db.sh` (0290 applied twice, idempotent): the list has the same pictures in the same order as `public_vacancy_photos` and no `storage_path` in its result shape (read from `pg_get_function_result`); `has_thumb` follows the upload; `'thumb'` answers the thumbnail or the full image when there is none; `'full'` answers the full image; a picture outside the unit's set, an unlisted door's picture, and an unlisted door's own list each answer nothing; all as anon. LISTING BYTES SMOKE: PASS.
- **`a-listing-loads-one-picture-at-a-time` (4):** 37 pictures mount with two thumbnail reads, not 37; the next picture is already there and the one after it is asked for; nothing is asked twice; opening large asks for the open picture's full image first and the rest in order; **proven to catch:** a row that carries its bytes is never asked for; a unit with no pictures still says "Photographs coming". The applicant-sees-every-photo, shared-listing and listing-travels suites green.
- CI's door-database block applies 0290 twice and runs the smoke; the isolation matrix's poe-properties leg carries both; the journeys' database carries 0290, G3 reads the opened card's picture as real bytes, and `--break=pictures` (the single-picture road refused to anon) fails it.
- The live proof is the Fold after the deploy: the shelf shows its first pictures at once; the re-review records the measured time.
