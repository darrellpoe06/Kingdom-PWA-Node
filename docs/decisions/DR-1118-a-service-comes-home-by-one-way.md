# DR-1118: A service comes home by one Way: it installs itself on every path, says why in plain words, and its witness says where the install stands; the home-server video's four jobs weighed

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (a Way written down, a gate over files already in the repo, three register rows; nothing installed, nothing timer-driven)
**Type:** orchestration
**Area:**
- `docs/00-foundations/_root/THE-WAY-A-SERVICE-COMES-HOME.md` (the Way), routed in `docs/CONTEXT.md`, registered as **SERVICE-COMES-HOME** in `PRINCIPLES.md`, and named in `app/src/lib/required-reading.js`
- `app/src/__tests__/a-service-comes-home.test.js` (the gate over `infra/nas-loops/services.json`)
- `app/src/lib/open-source-candidates.js` (Immich, Jellyfin and Audiobookshelf; Vane carries `builtRef`), `app/src/components/OpenSourceCandidates.jsx` (the header counted from the rows), `app/src/__tests__/open-source-candidates.test.jsx`
- `docs/00-foundations/_root/LESSONS-LEARNED.md` (the 2026-10-19 entry; P73)

**Amends:** nothing. Grounds: DR-0621 (hold the hand), DR-1099 (the register and its gate), DR-1101 (the road that stumbled), DR-1000 (a 200 is not an answer), DR-0756 (the locked door), DR-0770 (the running process follows the code), DR-0076, DR-0075, DR-0108.
**Declared by:** Darrell, 2026-10-19: *"Fix our processes and create a way."* Sent with a summary of a home-server video (replace about $1,000 a year of subscriptions with one machine you own; Jellyfin, Immich, Audiobookshelf, cameras kept on your own network; the raw files on your own disk are the asset and each app is only the interface).

## Context

The night before, the research road (DR-1101) came home and could not answer. Its stumbles were process, not code, and each was found by a measurement:

| Time (UTC) | What the witness measured | What was wrong |
|---|---|---|
| 02:12 | `/health 200`, `/ask 504` after 180 s; qwen2.5:14b on the NAS CPU could not answer "Say OK." in 150 s | the installer had handed the model work to the NAS's own processor and never tried the designated AI worker |
| 03:09, after #2257 | still `/ask 504`; the box on #2257; `ollama.url` empty; the forwarder running the OLD code | the installer exited at "no tower" before the step that moves the running code, so the new reason was never started |
| 03:29, after #2258 was pushed | the witness now printed the checkout, the chosen tower, running vs repo code, and both towers timing out from the NAS | until then the witness could say only that it failed |
| 04:04, after #2258 merged | `/health 503` in 0.3 s: "No AI tower was answering when the research road last looked; it looks again every 15 minutes." | honest, in seconds; the towers themselves are off or asleep |

"Fix our processes" is those three fixes. "Create a way" is writing them once so the next service walks past them. The video names four jobs; they are weighed against what we run, the same way DR-1099 weighed its ten.

## What was measured

**The bills.** The inbox, last twelve months: one subscription in the video's class, Google AI Plus (2 TB) (Google One), $9.99 a month, charged on the 14th (a trial from 2026-01-19, paid since 2026-08-14). No receipt from Netflix, Hulu, Disney, Spotify, Audible, Plex, Prime Video or Apple TV. So of the four jobs, one has a bill behind it.

**The three tools**, each shallow-cloned at its latest release and read, never run (the same method as DR-1099):
- **Immich v3.3.3** (`d2dac658…`): AGPL-3.0; its own login; the machine-learning image defaults to CPU (`machine-learning/Dockerfile`, `ARG DEVICE=cpu`); egress to `tiles.immich.cloud` for maps, Hugging Face for models on first use, GitHub for a release check (`server/src/services/server.service.ts`); metrics only under `IMMICH_TELEMETRY_INCLUDE`; media at `UPLOAD_LOCATION` as plain folders; pinned Postgres (vectorchord) and Valkey in its compose.
- **Jellyfin v12.2** (`ca0f16eb…`): GPL-2.0; its own login and sessions; no telemetry found; metadata providers (TMDb among them) are the only egress and only when on; a test suite in the repo.
- **Audiobookshelf v2.37.1** (`3563d494…`): GPL-3.0; its own login; no telemetry found; metadata from audnex, Google Books, Open Library, iTunes and FantLab only on a lookup; port 13378 in its compose; the library is a folder.

**What we already run.** Cameras: `infra/nas-cameras` (go2rtc behind the family key, DR-0756), live in the app. Photos: `infra/nas-property-photos` serves the app's property and family albums from the Synology phone backups; nothing backs the phones up except Google. Films and audiobooks: nothing; the sermon archive has its own road.

**Our services against the Way.** `infra/nas-loops/services.json` holds 24 services, 23 enabled. Read from their files on 2026-10-19: one (research) has every part the gate can read; cameras lacks only a witness that says where the install stands; the other 21 lack between one and three of a witness, a restart that follows the code, and a door that answers `/health`. Every installer exists and parses.

## Decision

1. **The Way is written**: `THE-WAY-A-SERVICE-COMES-HOME.md`, eight steps, each leaving a proof: weigh it; own the files; one door, locked; it installs itself and the running code follows the repo on every path; it says why; a witness that says where the install stands; it shows in the app; it seeds the next.
2. **The gate holds every service to it**: `a-service-comes-home.test.js`. Every enabled installer exists and parses. A service on the Way has a witness with the standing lines, a door with a `reason`, and a restart that is one function called from more than one path. A service born before the Way is listed with exactly what it lacks (the list must match the files) and one audit date, **2026-11-15**; a passed date fails the build. A new service must be on one list or the other. Proven to catch: the old installer (one call), a witness without the standing lines, a stale ledger entry.
3. **The video's four jobs**: cameras already home; **Immich: pilot on the NAS** (it does the storage half of the one bill in the class, and the files stay ours as folders); **Jellyfin: hold** (no bill, no library named; re-read 2026-12-01); **Audiobookshelf: hold** (no bill, no shelf named; re-read 2026-12-01). The register's header on the Infra Plan is now counted from the rows (which record weighed how many; which are built) instead of saying "none is installed" while the research road exists.

## Impact

- Nothing new runs. Immich's pilot is a dated step by the Way (re-review 2026-11-08): measure the pool, register, install, forwarder, witness, surface, then prove one phone's backup landed before the Google plan's storage is cancelled.
- The 22 services born before the Way (the 21 read that night, and `db-backup`, born the same day by another session, DR-1113, which the gate caught on the merge) are not fixed tonight. They are listed with what they lack, and the gate makes that list keep telling the truth; the audit lands by 2026-11-15, in order of blast radius.
- Hold is not no: Jellyfin and Audiobookshelf wait on a library and a shelf, with dates.

## Verification

- `a-service-comes-home.test.js`: 9 tests, green on the first run, so the ledger matched the files as read.
- `open-source-candidates.test.jsx`: counts 6 / 3 / 4, the three rows under DR-1118, only Vane marked built; the header text asserted.
- `research-road.test.jsx`, lint and the gate scripts: see the session note.
