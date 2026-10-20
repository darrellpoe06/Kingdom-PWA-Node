# DR-1120: Immich comes home by the Way: the phones' photos backed up to our own pool, behind the family key, with a door that says why and a witness that says where the install stands

**Date:** 2026-10-19
**Status:** accepted
**Tier:** B (a new self-deploying NAS service and a new public Funnel path, both behind the family key; additive, request-driven, no timer)
**Type:** infrastructure
**Area:**
- `infra/nas-immich/` (`docker-compose.yml`, `immich_forwarder.py`, `poetech-photo-backup.service`, `install.sh`)
- `infra/nas-loops/services.json` (the `immich` entry, registered last) and `infra/nas-loops/loops/funnel_watchdog.py` (the `/photo-backup` mount healed with the sovereign rows)
- `infra/nas-transport/RECORDED-STATE.md` (the `/photo-backup` row)
- `app/functions/photo-backup/[[path]].js`, `app/public/_routes.json`, `app/src/lib/native-shell.js`, `infra/cf-roads-worker/worker.js` and `wrangler.toml` (the same-origin road and its second door)
- `app/src/lib/photo-backup.js`, `app/src/components/PhotoBackupStatus.jsx`, mounted in `OpenSourceCandidates.jsx` on the Infra Plan
- `.github/workflows/immich-health.yml` (the witness) and `.github/workflows/ci.yml` (the forwarder's selftest gates merge)
- `scripts/system-flow-registry.mjs` (the app node, the witness, the NAS rider and `http:photo-backup`)
- `app/src/lib/open-source-candidates.js` (Immich built; Jellyfin and Audiobookshelf from hold to pilot), `app/src/__tests__/a-service-comes-home.test.js` (Immich on the Way)

**Amends:** DR-1119's two holds (Jellyfin, Audiobookshelf), whose premise was wrong (below). Carries out DR-1119's Immich pilot by THE-WAY-A-SERVICE-COMES-HOME. Grounds: DR-0076, DR-0756 (the locked-door forwarder), DR-0770 (the running process follows the code), DR-1000 (a 200 is not an answer), DR-0266 (pinned images), DR-0236 (nothing waits).
**Declared by:** Darrell, 2026-10-19: *"Bring Immich home by the Way now."* Then, on the dated items: *"No waiting for later.... why?!!!!!!"* And on the holds: *"Why can't we use them for our audio tts... etc..."*

## Context

DR-1119 weighed the home-server video's four jobs and named Immich the pilot: the household pays Google One (2 TB) because the phones back up every new photo and video in the background, and Immich does that job onto our own pool with the files kept as plain folders. The Way was written the same day, and this is the first service to walk it from birth.

**Two premises corrected.**
- DR-1119 said "nothing backs the phones up except Google". Not so: the app has its own pick-and-verify lane (`PhoneBackup.jsx` → `media-backup.js` → `photo_server.py`, files under `/volume1/PoeTech/phone-backup`), and the Synology backups feed the albums. What neither can do is the background job: a PWA cannot reach the camera roll unless a person picks files (`2026-06-11-photo-sovereignty-and-phone-backup.md`). That is the gap Immich fills, and it is exactly what the 2 TB plan is paid for. The register row says so now; the existing lanes stay as they are.
- DR-1119 held Jellyfin and Audiobookshelf on "no library named". Darrell: "Why can't we use them for our audio tts... etc..." The libraries exist in the code: the lesson readings the NAS voice makes (`/volume1/PoeTech/voice-lite`), the spoken lessons with transcripts (`/volume1/PoeTech/lesson-voice`), and the harvested sermon and worship video (`/volume1/PoeTech/yt-dlp`, `/volume1/docker/ytzero/downloads`). Both are pilots on the NAS now, next by the Way in this session; no bill is behind either, so the gain is reach.

## Decision

What was built, step by step:

1. **Weigh it.** Done in DR-1119 at v3.3.3 (`d2dac658`). The row now carries `builtRef: 'DR-1120'`.
2. **Own the files.** The library at `/volume1/PoeTech/immich` (the pool, beside the pick-and-verify lane), the database at `/volume1/docker/immich/postgres`, the model cache at `/volume1/docker/immich/model-cache`. The installer makes all three; nothing lives inside a container alone.
3. **One door, locked.** Immich binds `127.0.0.1:2283`; its machine-learning, valkey and postgres containers publish no port. `immich_forwarder.py` on `127.0.0.1:8801` is the only door: `GET /health` open; every `/api/*` path (any method) needs `X-Family-Key: <family bridge bearer>`, is passed byte for byte with the key stripped, and Immich's own login still stands behind it; Immich's pages are 404. The key rides its own header because Immich uses `Authorization` for its sessions; the Immich app carries custom proxy headers (`mobile/lib/domain/models/config/network_config.dart`, `customHeaders`; the setting is "Custom proxy headers" under Advanced). Brakes: 6 requests in flight, 4 GB per body (chunked bodies refused with 411), 600 s, and uploads paused while the pool has under 50 GB free. Road: `/photo-backup` in `REHOMED_ROUTES`, `_routes.json`, the roads Worker, `RECORDED-STATE.md`, the Funnel watchdog.
4. **It installs itself, and the running code follows the repo on every path.** `services.json` entry (last; its first pull is the largest on the box). `install.sh` makes the folders, then calls `forwarder_follows_code` BEFORE any step that can stop it (the pool floor, docker, compose, Immich's ping), so a dark Immich still gets a door that says why, and once more at the end (idempotent: the unit and the code stamp are compared, not rewritten). A position rule for the gate was tried and dropped: by position alone it cannot tell a dependency check from the door's own prerequisites, so the rule stays "one function, called from more than one path". Then: the pool measured and refused under 50 GB; the database password seeded once; compose up on pinned digests; Immich's ping awaited 180 s; the forwarder's `/health` must be 200; only then the Funnel mount.
5. **It says why.** `/health` reasons, each in words: the library folder missing; the pool under the floor with the numbers; Immich not answering on loopback; Immich answering its ping wrongly. A refused upload is answered from the headers alone and never read.
6. **A witness that says where the install stands.** `immich-health.yml`, daily and on dispatch: `/health`, then one real question through the door with the family key (`GET /api/server/version`, the version must match what `/health` saw). On a failure it prints first: the box's checkout, running vs repo forwarder code, the library folder and its top-level count, the pool's free space, whether `immich.env` was seeded, the unit's state, Immich's ping on loopback, the containers' states and last lines. Ledger: the rolling `photo-backup-incident` issue.
7. **It shows in the app.** `PhotoBackupStatus` on the Infra Plan: the live `/health` verbatim (Immich's version and the pool's free GB, or the NAS's reason), the four phone steps in the Immich app's own words, the server URL and header name, and a Copy button for the family key this device holds (the key is never printed). The app reads `/health` through the same-origin route; a phone's Immich app talks to the Funnel path directly, because the same-origin proxy buffers bodies and a video is larger than its cap.
8. **It seeds the next.** The library is the input the family albums read next (the property-photos server reading `/volume1/PoeTech/immich` as it reads the Synology folders), and the proof that lets the Google plan's storage be cancelled: one phone's new shot found in the library.

## What was measured

- `immich_forwarder.py --selftest`: 38 checks, all proven to catch (a page passed through, a key missing, wrong, or offered as a bearer, the key reaching Immich, a body over the cap or without a length read, an upload under the pool floor, a 7th request queued, a foreign origin echoed, a dark Immich read as up). A 1 MB upload reaches the fake Immich byte for byte.
- `install.sh` under stubs: with no docker, the unit is written and the forwarder restarted and stamped BEFORE the installer stops; with the pool under the floor, it stops after the restart and starts nothing.
- Image digests resolved from ghcr.io for `immich-server:v3.3.3` and `immich-machine-learning:v3.3.3`; valkey and postgres by the digests the release's own compose carries.
- `photo-backup-road.test.jsx`: 11 tests (state from `/health`, the phone steps name the forwarder's own header and the Funnel URL, the panel copies the key without printing it, the whole wiring, the compose pinned on loopback, the installer's order, the CI selftest).
- `a-service-comes-home.test.js`: Immich on the Way with every readable part; a single call placed after a stop still fails the gate.

## Impact and what is still open

- Nothing runs until services-sync pulls this merge and the first image pull finishes (it may take two cycles). Then `/health` says where it stands, and `immich-health.yml` is dispatched to read it.
- **One step is a person's, by its nature:** the Immich app on a phone is set up once, with the header and the key copied from the panel; a value typed onto a physical device is not a channel the NAS can drive. The panel carries the steps.
- The Google plan's storage is cancelled only after one phone's new shot is found in the library (DR-0076), not before.
- Jellyfin and Audiobookshelf come home next, in this session, by the same Way.

## Verification

- `immich_forwarder.py --selftest` OK (38); `photo-backup-road.test.jsx` 11; `a-service-comes-home.test.js` 9; `open-source-candidates.test.jsx` 16 (8 / 1 / 4, built: Vane, Immich); `research-road.test.jsx` 16; the route test 31. Lint, YAML and JSON parses, and the gate scripts: see the session note.
