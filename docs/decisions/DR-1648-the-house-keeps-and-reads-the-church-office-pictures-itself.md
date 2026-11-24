# DR-1648: The house keeps and reads the church office's pictures itself

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** C (a vendor-spend step moves onto the NAS clock; COLG-facing; no schema)
**Type:** ways
**Area:** `infra/nas-church-archive/install.sh` (new), `infra/nas-church-archive/.gitignore` (new), `infra/nas-loops/services.json`, `.github/workflows/church-site-archive.yml`, `scripts/church-calendar-read.mjs`, `scripts/system-flow-registry.mjs`, `app/src/__tests__/church-archive-on-the-nas.test.js` (new); removed `scripts/church-site-archive-over-tailnet.sh`, `scripts/church-calendar-reads-over-tailnet.sh`
**Sent in by:** Darrell, 2026-11-24, on the runner road: "They are fixed...!!!!!!!" then "No more auth keys..."
**Pairs with:** DR-1360 (the NAS initiates every road), DR-1596 (what the office posts is kept), DR-1644 (every event lives on its day), DR-1427 (content-sync, the same move), DR-0248 (brakes)

## Context

DR-1596 and DR-1644 put the keeping and the reading of the office's pictures on a GitHub runner that joined the tailnet to reach the NAS. The first dispatched run after DR-1644 merged (run 45471005945, 19:31Z) read the website correctly — the November 2026 calendar, the October letter, the Battle Cry Sunday flyer and one more flyer — and then died at the join: no OAuth client is set and the auth key answers "invalid key: API key does not exist". That is the design, not a fault: DR-1360 retires the runner road ("a system we do not control is support, never a necessity"), and Darrell's "No more auth keys" is that standard applied. Every scheduled run since DR-1596 merged had died the same way, so nothing was ever kept and nothing read.

## What was measured

- Run 45471005945: collect `pages: calendar read, letters-from-bg read, current-events read, previous-events read`; `pictures: 4`; join failed 5 of 5 attempts, `invalid key: API key does not exist`; the keep, pull, read and file steps never ran.
- The NAS already calls Anthropic for the lesson builder from `/volume1/PoeTech/secrets/anthropic-api-key.txt` (`infra/nas-lesson-builder/lesson_writer.py:59`), so reading on the NAS adds no new kind of credential.
- The reader and collector import Node built-ins only; both run on the NAS with no package install (run here with no `node_modules`).

## Decision

1. **The NAS does the whole pass** as a `services.json` rider on the already-armed services-sync clock (the content-sync pattern, DR-1427; zero new DSM entries; merge is the deploy): collect the site with the app's own parser, keep each new picture, pull the kept calendars and flyers not yet read, read each once, file the events on their days. Every step runs on the NAS against its own Supabase; nothing reaches in.
2. **Brakes.** Stamp-gated to one pass per 6 hours; per-step timeouts totalling 450 s under the 480 s rider ceiling; at most 3 pictures read a pass at 60 s each, stopping after 2 failures with nothing read; a lock directory per pass. Stop-paths: `enabled: false` (a PR) for the pass, `CHURCH_CALENDAR_READ=off` in `church-archive.env` for the read only; no key file makes the read a named no-op. The key is exported to the reader only for its step and never printed.
3. **The runner keeps only what needs no road.** `church-site-archive.yml` loses its schedule and every step that reached the NAS; dispatched, it prints what the website holds from outside (a witness); on a pull request it proves 0342 and 0343. The two runner road scripts are removed.

## Impact

- **Until this merges and services-sync installs it, nothing is kept or read.** After that, the first pass keeps the four pictures the site holds and reads the November calendar and the two flyers.
- **With no key file at the path above, pictures are kept but no event reaches its day**; the pass says so in `state/church-archive.out`. The key file is the one the lesson builder already uses; if it is absent, placing it is Darrell's step.
- **Wayback backfill is not on the NAS pass** (it is slow and one-off). Past months come in by the office's "Add a flyer or calendar from before" upload, read the same way. `re-review: 2026-12-15`

## Outcome

- `church-archive-on-the-nas.test.js` (7): the steps run in order; no key = named no-op; the key is handed to the reader alone and never printed; three pictures a pass; the 6-hour gate and the lock proven to catch (each removed, its test fails); `CHURCH_CALENDAR_READ=off` stops the read only; a failing step reds the pass and the later steps still run.
- Rehearsed against a mock database: the gate, the lock, read-off and no-key paths all as designed.
- **After merge:** read `infra/nas-church-archive/state/church-archive.out` through the loops-health witness, then the Times calendar on Tue Nov 24 (NA Meeting, 9:00 AM, Café), Nov 15 (Battle Cry Sunday) and Nov 29 (Communion). `re-review: 2026-11-26`
