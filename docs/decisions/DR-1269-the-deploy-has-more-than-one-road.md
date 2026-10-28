# DR-1269 — The deploy has more than one road: the served site speaks the key the NAS cannot, and the database replays its own mirror on the NAS clock

**Status:** accepted (both roads built, proven in CI; the first proves itself live on this record's own merge)
**Tier:** B (the deploy lane and the migration lane)
**Date:** 2026-10-28
**Entities:** `scripts/served-anon-key.py`; `.github/workflows/deploy-cloudflare-pages.yml` (the key step); `infra/nas-supabase/replay-on-clock.sh`; `infra/nas-supabase/replay_migrations.sh` (the lock); `infra/nas-loops/services.json` (`sovereign-replay`); `.github/workflows/loops-health.yml`; `scripts/system-flow-registry.mjs`; `app/src/__tests__/the-deploy-has-more-than-one-road.test.js`
**Grounds:** REVIEW-OUR-WAYS (DR-0108: a stated "only his hand" is a premise to challenge), RUNNER-REACHES-THE-NAS (DR-1159), PROVE-THE-DEPLOY (DR-0107), THE-SITE-HAS-ITS-OWN-WITNESS (DR-0125), VERIFICATION-DOCTRINE (DR-0076), THREE-BRAKES (DR-0247/0248), SELF-DEPLOY-MANIFEST (DR-0236), PERPETUAL-IMPROVEMENT (DR-0075)

## Context

**Sent in by:** Darrell, 2026-10-28, on being handed a key to mint: *"Is there another way?! Why do we only have this one way?! We are supposed to have multiple ways and solutions... Build ways that fit our requirements... the solution has to be assessed and researched and if we find a Way we can use we test it."*

From **01:46 UTC on 2026-10-28** the GitHub runner's Tailscale auth key was refused by Tailscale's control plane, five times per run, before any packet reached the NAS:

```
backend error: invalid key: API key k17y78NVwb11CNTRL not valid
ssh: connect to host poetech.tail5a2f35.ts.net port 22: Network is unreachable
```

The same key had joined fine at 01:00:54 (deploy run 40612360523). DR-1267 read the second line and called the NAS unreachable; the first line is the fault, and Darrell's own phone showed the NAS online on the tailnet at 04:35 (poetech, 100.70.190.47). The NAS was up the whole time, pulling main every 15 minutes through the services-sync mirror.

**The single road, measured.** The deploy bakes the sovereign backend's anon key into the bundle, and since DR-0310 that key came from ONE place: `ssh` to the NAS over the tailnet, reading `/volume1/docker/supabase/.env`. A merged migration reached the sovereign database by ONE road: `db-migrate.yml`, the same tailnet, running `replay_migrations.sh` over `ssh`. One refused key closed both at once. Seven deploy runs and two db-migrate runs failed identically (40616994554, 40617650583, 40619344798, 40620814648, 40622151738, 40643669463; 40622110299), the site served `32d7d51` for over five hours while main carried Living Lesson 270, the library census, the exam ledger and two more records, and migration 0313 was not on the sovereign database. The site stayed UP, boot-checked, throughout: stale, never down.

**The DR-0108 challenge, run.** The road to the KEY ITSELF is genuinely his: a Tailscale auth key is minted only in the admin console, and the NAS holds no Tailscale API token. But the two things the key was gating are not his, because neither needs the tailnet at all:

- The anon key is **public by nature**. Every browser that opens poetech.us downloads it inside the app's own JavaScript; `site-health.yml` has read the served bundle since 2026-09-03 to learn which backend the app truly calls (DR-0125). The served site can speak the key the NAS cannot.
- The migration files are **already on the box**. The services-sync mirror pulls main every 15 minutes (DR-0236); `replay_migrations.sh` and its ledger live on the NAS. Only the *trigger* came from outside.

## What was measured

**Road one — the served site speaks the key** (`scripts/served-anon-key.py`, called by the deploy's key step when the NAS does not answer). It fetches the shell, every hashed asset it names (up to 40), and selects the anon key the way the witness reads the backend. It REFUSES rather than guesses, with a distinct exit per reason: no hashed assets (10); no chunk carries the sovereign gateway URL, so the served build is not repoint-armed and its key would be the wrong backend's (11); no anon key (12); more than one distinct anon key (13); the shell unreachable (14). A hosted project's key carries a `ref` claim and the sovereign gateway's does not, so when both are in a bundle the sovereign one is chosen. Only counts go to stderr; the key goes to stdout once and is masked by the step. The deploy names the road it took (`anon key road: nas-over-tailnet | served-site`) in its log and summary; the tailnet join no longer ends the job (`continue-on-error`), and the refusal when BOTH roads fail keeps DR-0107's shape: the live site keeps its current build. **Proven on a served fixture (6 cases):** the happy path prints the key once with counts only beside it; hosted-beside-sovereign picks the sovereign; an un-armed build, a service-role-only build, two anon keys, an empty shell and an unreachable shell each refuse with their own code and print no key.

**Road two — the database replays its own mirror** (`infra/nas-supabase/replay-on-clock.sh`, registered `enabled` in `services.json` beside `db-backup`). Every services-sync cycle it runs the SAME `replay_migrations.sh` against the SAME ledger (`public._sovereign_replay`), so a migration applies once whichever road reaches it first, and in steady state costs a few psql calls. Brakes, deterministic class (DR-0248): a 420 s wall clock inside the 480 s installer ceiling; a lock directory that clears itself once older than the wall clock; `REPLAY_MAX_PER_RUN` inside the replay. Exit 0 applied or nothing to apply; exit 1 a migration FAILED (the cycle reds, the way db-migrate reds); exit 3 could not run this cycle, DEGRADED and named. It writes `status.json` (`at, ok, rc, applied, ledger, frontier, head, busy`) and a bounded `replay.log`; `loops-health.yml` reads the ledger, lists the loop with the others and reds on `ok:false`. `replay_migrations.sh` itself now holds a lock both roads respect (`.replay.lock`, self-clearing after 30 min), taken before docker is even looked for, so the runner's road and the clock's road never run at the same moment. **Proven against a fake replay (7 cases):** apply writes the ledger and exits 0; a FAILED migration exits 1 with the frontier named; a replay that cannot run exits 3; a hung replay is killed at the wall clock and recorded as timed out (rc 124); a live lock is "already in progress" and a stale one is cleared; a missing replay script is a loud 1; and the real `replay_migrations.sh` with the lock held prints BUSY and exits 0 without touching docker.

**The graph and the witness:** `interconnect-guard` places the rider (`service:sovereign-replay`, 37 NAS riders, 0 findings), `loops-health` reads what it writes, `started-by-record` sees it enabled, `nas-docker-path-guard` and `replay-completeness-guard` unchanged and green.

## Impact

- **A refused tailnet key no longer stops a deploy.** The next merge after this record is the live proof (DR-0107): its deploy run on main walks the served-site road, and site-health reads SERVED == MAIN.
- **A merged migration lands within one services-sync cycle of the mirror's pull, with no runner, no tailnet and no hand.** 0313 (`quiz_history`) is the first; the Class record's ledger fills the moment it does.
- **Honest limits, named.** The served-site road can only ever repeat the key the site already ships; a *rotated* sovereign key still needs the NAS road, which is why the NAS is asked first. The runner's tailnet key is still a value only Darrell can mint, and every other tailnet workflow (nas-health, lessons-sync, announce-bearer-sync and the rest) stays closed until he does; what changed is that the two roads the family feels, the build and the schema, no longer wait on it. `re-review: 2026-11-04` — read the first clock-road `status.json` on the box through loops-health and the first served-site deploy's summary line.
- **The correction DR-1267 needs:** the fault was the key, not the NAS; recorded on #2404 with the run ids.

## Decision

Two roads, both self-driving, both proven, both active by merge: the deploy reads the public client key back from the served site when the NAS does not answer over the tailnet, and the NAS applies its mirror's migrations on its own clock. The order of roads for the key stays as DR-1159 wrote it; this record adds the roads for what the key was gating, so that a single refused credential can never again take the build and the schema down together.

## Verification

- `the-deploy-has-more-than-one-road.test.js` — 18 cases: the selector on a served fixture (6, every refusal distinct), the deploy lane's order of roads and masking (2), the installer against a fake replay (7), the shared lock on the real replay (1), the witness and the registry (2).
- `interconnect-guard` 0 findings; `system-flow-graph`, `started-by-record`, `a-missing-ledger-is-not-a-fresh-one`, `nas-docker-path-guard`, `sovereign-migration-parity`, `the-local-app-carries-the-house-address`, `services-sync-guard`, `nas-loops`, `site-health` and the lane suites green; `workflow-list-order-guard` OK; lint clean.
- Live: the deploy run on this record's merge SHA, its `anon key road` line, and site-health's SERVED == MAIN after it.
