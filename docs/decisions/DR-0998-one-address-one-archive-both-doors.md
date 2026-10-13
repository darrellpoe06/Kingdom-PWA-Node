# DR-0998: One address, one archive, both doors — the record is held whole once, picked never typed, and the NAS answers over whichever road is open

**Date:** 2026-10-13
**Status:** accepted
**Area:**
- migration 0284 (`rentals.photo_channel`, `rentals.address_held_at`)
- `address.js` (new, pure), `hold-the-record.js` (new, pure)
- `nas-photos.js` (`nasFetch`, `nasRoad`, `fetchChannels`, `fetchListingPhoto`, `chatChannelFor`), `property-photo-edit.js`
- `cloud.js` (`loadDoorAreas` areas, `loadDoorArchives`), `rentals-sync.js`, `rental-write.js`
- `DoorTabs.jsx` (`EditRental`), `PropertiesApp.jsx`, `Rentals.jsx`
- `infra/nas-property-photos/photo_server.py` (`/channels`, `/property-photo`, CORS, `PHOTO_CHAT_FIXTURE`)
- `.github/workflows/deploy-cloudflare-pages.yml` (`UNLOCK_NAS_PHOTOS_BASE`), `scripts/e2e/door-journeys.mjs` (G1)

**Amends:** DR-0339 (one store, two surfaces), DR-0160 (the structure syncs: now on an edit too), DR-0758 (the strip reads both stores: now by either road)
**Principle:** DR-0061 (reality-trace), DR-0076 (proven to catch), DR-0906 (records versus advertising), DR-0935 (the area, never the point), DR-0967 (cleaned, never fuzzy), LESSONS P59 (test the real service)
**Tier:** C — new routes on the NAS photo server and new columns. Shipped through the lane with its proof; the `hold` label is the brake.

## Context

Darrell, 2026-10-13, with the Real Estate tab beside Poe Properties on his Fold:

> "Most of the properties have pictures already on the nas... conected to the Real Estate tab... why don't they show up and why don't the addresses reflect each record... they all should be in sync... correct? End to end processes!!!"
> "End to end testing.... not fake testing... we need to make sure we can operate well"
> "Drop down with addresses... instead of letting someone else mistyped"
> "Hold the whole address so everyone can see the correct pattern for each property"
> "The nas has all pictures period!!! All my photos are uploaded in the Synology photos app... why not just pull from there? However I'm locked out while being logged in"
> "Photo shows nothing..." (with the live Real Estate tab on 805 Apt 1: *"Photo bridge not reachable (photo bridge answered 400). Nothing changed."*)

## What was measured

Read from his screenshots and the code at `a2a388243`, with the two reports that fed this (LESSONS-LEARNED, the rentals / photos / `property_photos` decision history):

- **Which archive a property has lived in a hardcoded list in the app** (`nas-photos.js` `PROPERTY_CHANNELS`, keyed by the Real Estate slug) for 9 of 13 doors. The other 4 fell back to `r.name`, which fails the server's `SAFE_CHANNEL` (spaces), so they had no archive on either surface. **His screenshot proves it live:** 805 Apt 1 is not in the list, the app sent "805 North Prospect Avenue Apt 1, Champaign, Illinois, 61820" as the channel, and the NAS answered **400** — which also proves the road to the photo server was open from his phone; the name was the failure, not the road.
- **Addresses:** `1508 Williamsburg, Champaign, IL, 61821` is one field; `709 Commercial St, IL` has no town; Bed B's street carries `Apt 4` while Apt 2's does not (DR-0967:91-95). The two surfaces parse differently.
- **Real Estate "Coords"** are exact points from a map pick, kept on the device and never synced (`rentals-sync.js:23-26`); the cloud has unused `latitude/longitude` (0153). Poe Properties holds only the rounded `area_lat/area_lng` (0270). Every card read "Set address" while the other door had placed the house.
- **`/nas-photos` during #2057:** every Pages Function answers the app's own HTML; `/sb` and `/cams` carry a Funnel base and `/nas-photos` did not, so both doors' archive reads returned "not JSON" on a phone.
- **No NAS route returned a full-size picture;** every route serves a ~20 KB thumbnail or a 480 px downscale.
- **A Real Estate edit to an already-linked door dropped unit, building, room and level** (`rental-write.js localPatchToCloud`), so DR-0160's "the structure syncs" held only for the first upload.
- **The photo server had no test that ran the server** (LESSONS P59).

## Impact

- The family could not see the NAS pictures on a Poe Properties door, and on Real Estate four properties showed none.
- A unit typed on a linked door in Real Estate never reached Poe Properties.
- Nothing could match records reliably, so nothing could be built on "the same property" across the two doors.

## Decision

1. **The whole address, in parts, held once.** The cloud `rentals` row is the one record: `address` (house number + street), `unit`, `city`, `state`, `zip`. `address.js` is the one parser and the one formatter: `805 North Prospect Avenue, Apt 2, Champaign, Illinois 61820` on both doors. `addressNeeds` says what is missing ("address needs the town") on the card instead of looking finished.
2. **Repaired once, by the family's app, through the edit path.** `hold-the-record.js` decides; `PropertiesApp` applies through `updateRental` with a trace in the notes. Only blanks are filled, nothing set is overwritten, a line with no town is left alone and flagged, a unit already different from the one in the street (Bed B in Apt 4) is left alone. `address_held_at` marks a row done. It runs **before** the map placement, so the placement reads the repaired address.
3. **Picked, never typed.** The street field on both doors offers the family's known buildings (`<datalist>`); an exact pick fills town, state and zip. The archive is a `<select>` filled by the NAS's own list (`GET /nas-photos/channels`, with picture counts). When the NAS cannot be reached the current name is shown and kept; nothing is typed.
4. **The archive on the record.** `rentals.photo_channel` (0284, CHECK = the server's `SAFE_CHANNEL`). The nine hardcoded mappings are written onto their rows once; **a door with no archive of its own takes its building's** — the first sibling with the same `buildingKey` (0283's rule, the unit folded out) that names one, so 805 Apt 1, Apt 2 and Bed B all read `805NProspect` with a trace "named from the building"; a street with no archive anywhere takes nothing (cleaned, never fuzzy). `chatChannelFor` reads the record first and keeps the list as the fallback until every row carries its own. Read on its own (`loadDoorArchives`), never in the main rentals read (DR-0935 #5).
5. **The structure syncs on an edit too.** `localPatchToCloud` carries unit, building, room, level and the archive. `photo_channel` is written only when set, so a row never names a column the database may not yet have.
6. **Real Estate shows the same area.** "Map:" reads the cloud's rounded area by `remoteUuid` ("On the map · area") and offers the same `MapOnRequest` as Poe Properties; "Set address" only when neither the area nor a device point exists. No exact point is synced (DR-0996 §4).
7. **The NAS answers over whichever road is open.** `nasFetch` takes the same-origin path whole (`/nas-photos/channels`), so the client-path parity scan sees every route the app calls (its first run on this change caught three bare paths); it tries same-origin and, when the answer is not the server's, the Funnel base the deploy's unlock step sets (`VITE_NAS_PHOTOS_BASE`, unset in every normal build). `nasRoad()` says which answered and the surfaces print it. The photo server answers CORS for `https://poetech.us` (and `PHOTO_CORS_ORIGINS`), the way the camera forwarder had to.
8. **Two new NAS routes, read-only against the archive:** `GET /channels` and `GET /property-photo?channel&id&max` (one picture at listing size, long edge ≤ 1920, JPEG q85, ≤ 6 MB, in memory; nothing on the NAS is written). `PHOTO_CHAT_FIXTURE` replaces the Synology Chat reads with a file so the **same server** runs in the selftest and the Chrome journeys.

**Not in this change, and why:** copying NAS pictures onto a listing (the next change, with "Use on the listing" / "Keep as a record" per picture, DR-0906); the whole-library-by-date road ("the nas has all pictures period"), which the next change adds as `/library` routes with no Synology Photos sign-in; serving listing pictures as cached files (DR-0955's queued item, re-review 2026-10-18); Google Photos (DR-0238 / DR-0291: the Takeout lane, never ordered as of 2026-08-11; no API exists).

## Verification

- **`0284-archive-on-the-record-smoke.sql`** (ARCHIVE ON THE RECORD SMOKE: PASS): the family names an archive and reads it back; a channel with a space and a slash is refused by the database; a stranger cannot name it; the open shelf never carries it. Applied twice. **Proven to catch:** with the CHECK dropped, the smoke fails by name.
- **`photo_server.py --selftest`: 68/68**, now including the real server over real HTTP: `/healthz`; `/channels` 401 without the bearer and the sorted list with counts (unsafe names dropped); the fixture's picture listed with its thumbnail; one picture at listing size with its long edge ≤ 1920; 404 for an unknown id; the bearer on the picture route; preflight from poetech.us echoed, from elsewhere refused; a cross-origin GET answered.
- **Unit tests:** `the-whole-address-held-once` (13: his four record shapes, the repair fills blanks only and never half-repairs, the dropdown); `the-record-is-held-whole` (13: the repairs on his records including Apt 1 and Bed B taking the building's archive and a street with none taking nothing, the building's archive read from what the database already holds, the sync both ways, `nasFetch` by road with the outage case, `fetchChannels` / `fetchListingPhoto`, `chatChannelFor`); `the-door-editor-picks-not-types` (3: the datalist, the archive select from the NAS's list, the unreachable case, the save with its summary); `the-family-places-its-doors` re-pinned (held first, then placed). Each refusal is proven to catch by mutation.
- **Door journeys in Chrome, against the REAL `photo_server.py`: 11/11.** G1: the second door (`1508 Williamsburg, Champaign, IL, 61821` in one field) is held in its parts by the family's app on its first visit, with the trace in its notes and `1508Williamsburg` written from the old list; the editor's archive select lists the fixture's channels with counts from the real server; the address line reads the one pattern; a pick lands `805NProspect` on the row. E1 now proves the wrong-house refusal end to end: the second door is looked up by its repaired parts, the recorded answer is 805's house, so it is refused a place.
- **Full vitest suite in four shards** on this tree with the map change (#2148): one finding, the parity scan on the three bare NAS paths, fixed by spelling the route whole.
- **Not observed live:** the 13 rows repaired on poetech.us (Apt 1's "photo bridge answered 400" is the first thing to re-read after the deploy); the archive list from the real NAS; the Funnel road answering a phone. `re-review: 2026-10-27`.
