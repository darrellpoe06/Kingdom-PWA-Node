# DR-0758 — A family member adds and removes photos on an address

- **Status:** accepted (built, proven in the suite; the NAS half needs one redeploy, named below)
- **Tier:** B (a write and a recoverable removal on real family photos; no table, no money, no new door, no change to who may read or write photos)
- **Type:** feature
- **Date:** 2026-10-06
- **Scope:** `app/src/lib/property-photo-edit.js` (new, pure), `app/src/components/PropertyPhotoActions.jsx` (new), `app/src/components/Rentals.jsx` (`PropertyGallery` mounts both and merges the second store), `infra/nas-property-photos/photo_server.py` (`GET /property-uploads`, `POST /property-photo-remove`, 13 new selftest checks), `app/src/lib/feature-registry.json` (the `property-photos` surface and three controls), `app/src/__tests__/property-photos-add-and-remove.test.jsx` (new), `app/src/__tests__/feature-presence.test.jsx` (the walk), `docs/decisions/INDEX.md`.
- **Principles:** REALITY-TRACE (DR-0061 / P15 — the real store named before a line was written), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), VERIFICATION-DOCTRINE (DR-0076 — proven-to-catch, and the surface says the truth), DR-0691 (the confirm copy is tested with the behavior), DR-0726 (every control registered), DR-0218 (zero-n8n — the sovereign Python road only), P68 (a control lives where its scope lives).
- **Grounds:** Christina, 2026-10-06, relayed by Darrell verbatim: *"I would like to be able to delete and add photos to the different addresses in Real Estate."* Darrell: *"From Christina... needed features..."*

## Context

**SHOULD.** From Real Estate → a property card → PHOTOS, a signed-in family member can put a photo on THAT address and take one off it, against the real sovereign NAS photo service, with the strip reflecting both at once.

**ARE, before this (the reality-trace, run out loud first).** `app/src/components/Rentals.jsx:2199` renders `PropertyGallery` for `recTab === 'photos'`; the header she is looking at is `Rentals.jsx:263`, `Property Photos · oldest → latest · <n> in the archive`. Those photos are **rows in the NAS's Synology Chat postgres** — `posts` joined to `channels` on the channel name, filtered to `is_image` (`infra/nas-property-photos/photo_server.py`, `query_rows`). The address is tied to its photos by **channel name**, mapped from the property slug in `PROPERTY_CHANNELS` (`app/src/lib/nas-photos.js:97`, `'r-1508hh' → '1508HH'`). The thumbnail is then resolved off disk by the chat file's own name against the phone-backup DCIM roots (`_premade_thumb`, `_find_original`). The strip had no write of any kind and no removal.

**The premise this surfaced, before any code.** The bytes of an archive photo are the family's **phone backup**; the record is **Synology Chat history**. Those are two systems of record this app does not own, and a `DELETE` button in a PWA must not destroy either one. Meanwhile the existing sovereign write road — `POST /nas-photos/upload { dest, filename, dataUrl }` — already writes real files into `<upload_root>/<dest>/`, and passing the property's channel name as `dest` gives every address its own real folder. So "add" and "remove" are not symmetric operations over one store; they are two stores.

## What was measured (SHOULD → ARE → GAPS, DR-0219)

**GAPS.**
1. There was no way to add a photo to an address at all.
2. There was no removal of any kind.
3. `GET /property-photos` reads chat postgres only, so a photo uploaded with `dest=<channel>` would have landed correctly on the NAS and been **invisible** in the strip — the gap that made "add" alone a lie.
4. The photo server had **no delete endpoint**. Measured by reading it: `do_POST` answered only `/upload` and 404'd everything else.

**Measured after.** `python3 photo_server.py --selftest`: **54/54** checks (41 before, 13 new). `npx vitest run src/__tests__/property-photos-add-and-remove.test.jsx`: **48 tests**. `npx eslint src`: clean. The feature-presence gate walks the new `property-photos` surface: **19 tests**, including its own proven-to-catch.

## Impact

Christina adds one or more photos off the camera roll to the address she is looking at, and they appear in that address's strip with no manual refresh. She takes a photo off the address, after a confirm that names it. Nothing she presses destroys a picture: an added photo **moves** into that address's `.trash/` on the NAS, and an archive photo is only **taken off this address** — the Synology Chat message and the phone-backup original are untouched and can be brought back. Who may read or write photos did not change: the same per-device family bridge key, the same `/nas-photos` same-origin road, the same path containment.

## Decision

1. **Add** reuses the existing sovereign road with the address's own destination — `uploadPlan` picks the original bytes when the NAS keeps them and they fit, the reduced copy otherwise, and the per-file line **says which happened**. No second road, no new credential.
2. **The strip reads both stores.** A new `GET /nas-photos/property-uploads?dest=<channel>` returns that address's added photos and its hidden-id list; `applyPropertyPhotoEdits` merges them with the chat archive.
3. **Removal is recoverable by construction**, and the two kinds are different on purpose:
   - `kind: 'added'` → the NAS `os.replace`s the file into `<dest>/.trash/`. Never an unlink.
   - `kind: 'archive'` → the NAS appends the chat post id to `<dest>/.hidden.json`, so it stops showing at this address on every family device. The post and the original stay.
4. **The confirm names the photo and says which removal it is** — it does not imply an erase that never happens.
5. **The new endpoint is guarded exactly like `/upload`** and nothing is loosened: same bearer token (constant-time compare), same `SAFE_DEST`, same `safe_upload_path` containment, a 64 KiB request cap, a bounded hidden list, and a trash path that only exists for a name that already resolves inside that property's own folder. Traversal, slashes and bad dests are refused by the same checks the upload already used.
6. **Room, maintenance and Poe Properties pictures get no Remove here** — they are removed where they live (P68). Only tiles the NAS can actually act on carry the control.
7. **Pure logic has no React.** Validation, destination, merge, confirm copy and every failure message live in `app/src/lib/property-photo-edit.js` with an injectable network.

## Verification

- **Proven-to-catch, DR-0691 (watched fail, by hand, 2026-10-06).** The confirm copy promises *"Cancel keeps the photo exactly where it is."* The test presses **Cancel** and asserts the NAS was never asked, nothing was reported, and the tile is unchanged. Making the button ignore the answer (`ask(...)` without the `return`) fails that test by name — `expected "spy" to not be called at all, but actually been called 1 times` — and nothing else in the file. Restored; 48/48 green.
- **Proven-to-catch, the NAS half (watched fail, 2026-10-06).** Changing `os.replace(target, tpath)` to `os.remove(target)` fails `removing an added photo MOVES it (bytes still on the NAS)` — 53/54. Restored; 54/54.
- **Never a silent failure.** Every refusal path is a named test with a whole sentence: no family key, no folder name, no bytes, no id, bad kind, offline, 401/403, 413, 415, 400, 500, 502/503, and `not-found`. Each is asserted to be longer than 25 characters and free of `undefined` / `null` / `[object`.
- **The missing endpoint is said out loud, not swallowed.** A `404`/`405` on the removal reads: *"this NAS is still running the older photo service, which has no removal endpoint yet... Redeploying `infra/nas-property-photos` on the NAS turns this on; adding photos already works."* Pinned by a test, and by a render test on the real button.
- **Controls registered (DR-0726).** A new `property-photos` surface with `property-photo-add`, `property-photo-add-door` and `property-photo-remove`, each found by `data-testid` in a real render by the presence gate's own walk.
- **Guards:** `business-systems-guard`, `legibility-guard --check`, `interconnect-guard`, `monolith-budget-guard` and `npm run verify:gates` green; full `npx vitest run` and `npx eslint src` green.

**Open, with its named blocker.** The NAS half ships in the repo but the NAS must be **redeployed** for removal to work — `GET /property-uploads` and `POST /property-photo-remove` do not exist on the running service until `infra/nas-property-photos/photo_server.py` is deployed and the service restarted. Until then, **adding photos already works** (it rides the unchanged `/upload`), the strip simply shows no added photos, and a removal says the sentence above rather than failing quietly. `re-review: 2026-10-20` — if the redeploy has not happened by then, the services-sync manifest lane carries it.
