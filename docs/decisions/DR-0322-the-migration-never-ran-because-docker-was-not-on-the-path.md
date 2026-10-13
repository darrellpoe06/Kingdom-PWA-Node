# DR-0322 — The migration never ran because docker was not on the PATH, and the standard that would have caught it lived only in code

- **Status:** accepted
- **Tier:** B — a two-file shell fix on the NAS execution path, a new deterministic gate, and a Way written down. No app surface, no schema, no money.
- **Scope:** `.github/workflows/db-migrate.yml` (trigger paths), `infra/nas-supabase/replay_migrations.sh`, `infra/church-media-golive/choir_dates_install.sh`, `scripts/nas-docker-path-guard.mjs`, `app/src/__tests__/nas-docker-path-guard.test.js`, `docs/00-foundations/_root/INFRASTRUCTURE-PIPELINE.md` (NAS execution conventions)
- **Date:** 2026-09-02
- **Principles:** MACHINERY-OVER-MEMORY (DR-0314), VERIFICATION-DOCTRINE (DR-0076 §2/§3), EXECUTION-OUTCOME-OBSERVABILITY, PERPETUAL-IMPROVEMENT (DR-0075)

## What happened

DR-0321 merged as `e4982c6` carrying migration `0167`. The deploy proved out —
build, deploy, and the real-browser boot check all green on that SHA. The
**db-migrate** lane went red:

```
LEDGER-BEFORE=151
REPO-HEAD=e4982c64
----- replay output -----
sudo: docker: command not found
----- end replay (exit 1) -----
LEDGER-AFTER=151
```

Zero migrations applied. Not `0167` failing on its SQL — nothing ran at all, so
the ledger did not move. The app's database was left behind the repo, which the
lane correctly refused to call green (DR-0317's rule, doing its job).

## Root cause

`infra/nas-supabase/replay_migrations.sh` opened with:

```sh
DOCKER="docker"
docker ps >/dev/null 2>&1 || DOCKER="sudo -n docker"
```

DSM does not put docker on the PATH of a **non-login shell** — which is exactly
the shell an ssh command gets. So `docker ps` failed as *command not found*, and
the fallback failed identically, because `sudo` resolves against the same PATH.
`set -e` then killed the script at the first `PSQL` call.

`e4982c6` was simply the **first migration to ride the sovereign replay lane**,
which was wired into db-migrate the day before (PR #1426, `0b9eaea`,
2026-09-01). The defect was latent from that moment; this migration is what
walked into it.

## The finding that matters more than the fix

**The standard already existed — in code only.** This script's own caller,
`scripts/sovereign-replay-over-tailnet.sh`, resolves the binary correctly and
carries the comment *"DSM does not put docker on the PATH — 'sudo: docker:
command not found' is what sovereign-drift's run 33402087727 actually hit."* Ten
`scripts/nas-update-*.sh` scripts call `/usr/local/bin/docker` by absolute path.
And **nothing in `docs/` said to do any of it.**

That is DR-0314's exact class, arriving on schedule: a standard that lives only
in implementations is a coincidence, so the next sibling misses it. A wrapper
that had already been burned by this failure called a script that had not, and
neither the wrapper's comment nor the ten absolute paths could reach it.

## The decision — the three places, per DR-0314

1. **The Way.** `INFRASTRUCTURE-PIPELINE.md` gains a *NAS execution
   conventions* section: resolve `docker` before calling it, with the exact
   idiom, the reference implementations named, and the incident that produced
   the rule. It sits beside the two conventions DR-0272 already established
   (container python; the self-pulling mirror), which had no shared home before.

2. **The gate.** `scripts/nas-docker-path-guard.mjs` reads the real shell
   sources under `infra/` and `scripts/`, strips comments, and fails on a bare
   `docker` in command position. **Written BEFORE the fix and observed failing
   on the real defect** — it flagged `replay_migrations.sh:30` as it stood at
   `e4982c6`, and the unit test re-proves that on the exact original source
   rather than trusting this paragraph.

   It also found what a hand-search had missed: `choir_dates_install.sh:64`
   carried the *identical* probe-and-fallback shape in the yt-dlp wrapper it
   writes — the same bug, one command away from the same failure. Fixed here,
   because a class fix that leaves a known sibling broken is not a class fix.

3. **A named exception list, with reasons.** `PATH_IS_FINE` names
   `infra/n8n/scripts/pull-deepseek-r1.sh` and says why: it does not *assume*
   the PATH — its pre-flight `command -v docker` fails loudly before any docker
   call, so it can never misbehave silently the way the replay did, and it is a
   hand-run operator script rather than part of an automated lane. The honest
   consequence is carried rather than hidden: **on DSM it therefore refuses to
   run over a non-login ssh shell**, and resolving the binary would fix that
   too — **re-review: 2026-10-02**.

## A fourth part, found while planning the proof

`db-migrate` triggers on push to `main` only for paths under
`infra/supabase/migrations-auto/**`, `scripts/db-migrate-apply.sh`, or its own
workflow file. **The replay scripts were not among them** — so the fix for a
lane that applied *nothing* would not have re-run the lane that proves it, and
landing it would have required a human to remember to dispatch by hand.

`scripts/sovereign-replay-over-tailnet.sh` and
`infra/nas-supabase/replay_migrations.sh` are now trigger paths, by the same
reasoning that already put `db-migrate-apply.sh` there: the sovereign replay is
*how* a migration reaches the database the app actually reads (DR-0317), so a
change to it changes the lane's outcome. A lane whose own repair cannot re-run
it depends on someone remembering, and remembering is not machinery.

A useful side effect: this PR touches both files, so its own merge fires the
lane — the fix proves itself instead of being taken on trust.

## What this does NOT claim

The fix is in the repo; it is **not yet proven on the NAS**. The proof is a
db-migrate run that reaches `LEDGER-AFTER=152` with `0167` in
`public._sovereign_replay`. Until that run exists, `family_trust_records` does
not exist on the sovereign database and the Legacy Provisions surface runs
device-local only (which is its designed offline behavior — no outage, no data
loss, no cross-device sync). Stating it applied before the ledger says so would
be the exact painted-green DR-0317 closed.

## Carried

- **Prove the lane on the NAS.** Re-run db-migrate after this merges and record
  the ledger moving 151 → 152. If it stops on a *different* wall, that wall
  names itself and is the next frontier — that is the loop working.
- **The remaining NAS convention set** (sudo breadth, python-in-container
  enforcement) is real work and is NOT claimed here. One convention + one gate
  per class, as each is found — **re-review: 2026-10-02**.
