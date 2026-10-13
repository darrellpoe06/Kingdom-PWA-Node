# DR-1000: A NAS picture joins a door, picked, never twice — the family's archive and the whole library by month, onto the listing or into the record, with no Synology sign-in

**Date:** 2026-10-13
**Status:** accepted
**Area:**
- migration 0285 (`property_photos.source`, `property_photos_source_once`), smoke `0285-nas-picture-once-smoke.sql`
- `infra/nas-property-photos/photo_server.py` (`GET /library`, `GET /library-photo`, `library_month`, `find_library_original`)
- `app/src/lib/nas-photos.js` (`fetchLibrary`, `fetchLibraryPhoto`, `nasSource`, `nasLibrarySource`, `SOURCE_RE`)
- `app/src/modules/properties/cloud.js` (`loadDoorPhotoSources`), `PropertiesApp.jsx`, `DoorTabs.jsx` (`NasShelf`), `Rentals.jsx` (the chat strip by either road)
- `scripts/e2e/door-journeys.mjs` (G2, `--break=source`), `ci.yml`, `rls-isolation.yml`, `build-door-db.sh`

**Amends:** DR-0999 (the archive on the record is now read from), DR-0906 (the two purposes offered per picture), DR-0955 (the slow-pictures thread: the read is now measured on the screen)
**Principle:** DR-0061 (reality-trace), DR-0076 (proven to catch), DR-0906 (records versus advertising), DR-0946 (a failed read is not "none"), DR-0758 (the NAS archive is never written by this), LESSONS P59 (the real server)
**Tier:** C — two new NAS routes, one new column with a unique index. Shipped through the lane with its proof; the `hold` label is the brake.

## Context

Darrell, 2026-10-13, with the Real Estate tab and Poe Properties side by side:

> "Most of the properties have pictures already on the nas... conected to the Real Estate tab... why don't they show up... they all should be in sync... End to end processes!!!"
> "The nas has all pictures period!!! All my photos are uploaded in the Synology photos app... why not just pull from there? However I'm locked out while being logged in... crazy... which is why we must build..."
> "Either photos... some other ways... Google is also backing up my photos and Amazon!!!!!"
> "The pictures have always populated slower than other sites... that is not new..."

## What was measured

Read at `6be0ef1eb` after DR-0999 landed:

- **A NAS picture could reach a door's listing only by being photographed again or picked off the phone.** The Real Estate strip read the chat archive's thumbnails and filed them into *rooms on the device* (`filePhotoToRoom`, `Rentals.jsx`), never into `property_photos`; the Poe Properties gallery had no NAS source at all. Nothing on a row said where a picture came from, so the same picture could be filed twice with nothing to say "this one is already here".
- **The whole library had no road.** The photo server served a chat archive's posts (`/property-photos`) and one picture at listing size (`/property-photo`, DR-0999); the dated photo roots (`PHOTO_ROOTS`, `{y}/{m}`) and the phone backup (`MEDIA_ROOT/<device>/<y>/<m>`, DR-0996) were readable by the server and reachable by no route. Synology Photos itself has him locked out while signed in (his screenshots), and that road is not needed: the files are on disk.
- **The Real Estate strip read same-origin only** (`fetch(propertyPhotosUrl(...))`), so under #2057 it never tried the Funnel road DR-0999 opened.
- **"Slower than other sites" had no number.** No surface said how long a NAS read took or which road answered.

## Impact

- The family re-photographs walls the NAS already holds, or carries pictures through the phone one by one.
- Every listing with an archive on the NAS still showed "no pictures" on Poe Properties.
- The slowness thread (DR-0955) stayed a feeling.

## Decision

1. **Two shelves on the family NAS, inside the door's Pictures tab (`NasShelf`), family only, when the phone holds a NAS key:** *this door's archive* (the chat channel 0284 names on the record; the old list as the fallback) and *the whole library, by month* — `GET /library?month=YYYY-MM` lists that month's pictures from the dated roots and the phone backup, read as folders, newest first; thumbnails made by the server; no Synology Photos sign-in anywhere. `GET /library-photo?name=` serves one at listing size (long edge ≤ 1920, in memory, nothing written). A name that walks the tree is refused (400).
2. **Each picture offers the two purposes DR-0906 keeps apart, and nothing else:** **Use on the listing** (advertising, `kind = 'listing'`, chosen each time it is meant) and **Keep as a record** (the record kind the form holds). The bytes come down at listing size and are filed exactly as a phone picture is — `onAdd` with `storage_path` / `thumb_path` (the archive's own thumbnail, or a 480-px copy asked of the server), the caption from the post's text, `taken_at` from the post's day.
3. **Never twice (0285):** the row carries its **source** (`nas:<archive>:<post id>` or `nas:library:<file name>`, shape-checked); **one door files one source once** by a partial unique index, so the database refuses the second copy whatever the screen shows. A sibling door may file the building's picture (its own row). Already-filed pictures read "On this door already" and offer no button; what is filed is read on its own (`loadDoorPhotoSources`, DR-0935 #5) and a failed read is *unknown*, never "none".
4. **The read is measured on the screen:** "N pictures · read in 1.8 s over the same-origin road" — DR-0955's thread gets a number and a road, per read, where the family sees it.
5. **An unreachable NAS is said, never "none"** (DR-0946); a refusal names its reason, and the one race this lane has (the deploy serving before db-migrate adds the column) reads "the database is still being updated for this; try again in a minute".
6. **The Real Estate strip reads by either road** (`nasFetch`), as DR-0999 promised for both doors.

**Not in this change, and why:** serving listing pictures as cached files instead of data URLs (DR-0955's queued item, `re-review: 2026-10-18` — a storage change on its own); the Real Estate strip filing into `property_photos` (it files into the device's rooms today; Poe Properties is the record, DR-0339); Google Photos (DR-0238/0291: the Takeout lane, never ordered; no API) and Amazon Photos (no API).

## Verification

- **`0285-nas-picture-once-smoke.sql`** (NAS PICTURE ONCE SMOKE: PASS): the family files a NAS picture with its source; the same source on the same door is refused; the sibling door may file it; a non-NAS source is refused; a stranger cannot file one. Applied twice. **Proven to catch:** with the index dropped, the smoke fails by name.
- **`photo_server.py --selftest`: 113/113**, the library over real HTTP: 401 without the bearer; the month's pictures from the folders newest first with their dates; an empty month honest-empty; a month that is not a month 400; one library picture at listing size by name; a name that walks the tree refused; an unknown name 404.
- **Unit tests:** `the-nas-pictures-join-the-listing` (6: the source shapes; the archive shelf timed and named; Use on the listing files `listing` with source, caption, thumbnail and day; Keep as a record files the form's record kind; an already-filed picture offers no second copy; the library by month with a server-made small copy; proven-to-catch: unreachable is said and a refused copy names its reason).
- **Door journeys in Chrome against the REAL `photo_server.py`:** G2 — the whole library by month lists the fixture's picture from the folders, the read timed and named; one tap files it on the listing at ≤ 1920 px with a thumbnail and its source; the tile reads "On this door already"; a second copy inserted straight into the database is refused. `--break=source` (the index dropped) is caught at G2, and its undo first removes the twice-filed rows G2 left behind so 0285's unique index can come back (a fault whose undo fails is red, whatever the step said: the next run would prove the wrong thing).
- **The nearby witness, live, four runs on 2026-10-13 (DR-0998's "not observed live" item, measured here):** the Census matched *805 N PROSPECT AVE, CHAMPAIGN, IL, 61820* every time and the rounded area is 40.125, -88.26. Overpass: an unnamed or generic (browser-like) request from a runner is refused by Apache with **406 Not Acceptable** before the interpreter runs, with or without an Accept header; a request that names itself reaches the interpreter, which answered **504 "runtime error: open64"** (its own fault) and then timed out, as did the kumi mirror. Changes landed from it: no Accept header; `nearbyAround` takes a `userAgent` the runner sets (a browser cannot, and keeps its own); the servers' own words ride in the reason; a second mirror is asked on 5xx/429; the runner waits 60 s. **Still not observed:** a real "what's nearby" list from the public servers, and whether a phone's own User-Agent is refused the way a generic one is from a runner — the witness is the instrument; re-run it when the servers are well.
- **Not observed live:** the 805 archive's pictures on Apt 1's Pictures tab on poetech.us; the library by month from the real NAS; the Funnel road answering a phone. `re-review: 2026-10-27`.
