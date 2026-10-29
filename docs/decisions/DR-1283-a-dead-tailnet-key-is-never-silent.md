# DR-1283: A dead tailnet key is never silent, and it never switches off the proofs

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** B (the migration lane and a timer-driven witness; no change to merge, CI or deploy, and no change to what any migration does)
**Type:** verification
**Area:** `.github/workflows/db-migrate.yml`, `.github/workflows/node-availability.yml`, `scripts/tailnet-key-incident.mjs`
**Found by:** the agent, while proving bank9's deploy — its own report noted `db-migrate` red on two consecutive merge SHAs and correctly declined to claim it. Pulling that thread is what measured the rest.
**Pairs with:** DR-0317 (the sovereign database is the one the app reads), DR-0125 (the site has its own witness; a red check nobody queries is not an observation), DR-1269 (the deploy's second road to the anon key, built for this same refused key on 2026-10-28), DR-0107 (CI-green is not deployed), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §8 unknown freshness never reads as fresh), DR-0108 / DR-1159 (the order of roads), DR-0248 (budget + lock for the deterministic class), DR-0621 (a flag is where the work starts), DR-0075 (a non-improvement carries a why and a date)

## Context

64 workflows in this repository join the tailnet with `TS_AUTHKEY`. On 2026-10-28 the key began answering `backend error: invalid key`, and DR-1269 was written the same day to give the **deploy** a second road to the sovereign anon key — read off the served site, which already ships that public key — so the site kept deploying.

Nothing gave the **database replay** a second road, and nothing gave the outage a ledger.

`db-migrate` applies every migration twice over: first to `SUPABASE_DB_URL`, the hosted project, and then — because `infra/nas-supabase/REPOINT-ARMED` exists — onto the sovereign database over the tailnet. That second half is the one that matters to a reader. REPOINT-ARMED says it in capitals: **while that file exists, the hosted project is not the live database.** The replay is the step that keeps the live schema level with the repo, and it is the step a refused key stops.

So the shape of the failure was: the lane went red every run, correctly, for a reason no re-run could heal; `migrate-freshness.yml` re-dispatched it on every fire, also correctly, because a red lane means production is behind the repo; and the only record of any of it was a red check in the Actions tab that nobody queries.

## What was measured

Read on 2026-10-29 from the runs themselves, not inferred:

| | |
|---|---|
| last `db-migrate` success on main | run 40570457356, `3b9de9e72`, **2026-10-27 19:35 UTC** |
| the step that failed, every run since | `Replay onto the sovereign database` — exit 3, `ssh: connect to host poetech.tail5a2f35.ts.net port 22: Network is unreachable`, after `backend error: invalid key` on the join |
| the steps that **succeeded** in the same runs | `Apply migrations` ✅ and `Witness the LIVE definitions` ✅ — read off run 40795511412's step conclusions |
| migrations in the repo but not on the live database | **one** — `infra/supabase/migrations-auto/0313-every-exam-attempt-is-kept-and-the-best-score-stands.sql` |
| when it merged | `81813abde`, **2026-10-28 02:38 UTC** (DR-1264, PR #2456) — **22 hours** unapplied |
| what it holds | a column and a `CHECK` on `public.learner_lesson_records`, plus `learner_lesson_records_exam_ledger()` and its trigger |
| `Dispatch the isolation proofs` | **skipped in every one of those runs** — `if: success()` reads the *job's* status, and the job is red because of the sovereign half. **29 hours** with no isolation proof run |
| what `node-availability.yml` filed | **nothing.** Its rolling-incident step is gated on `steps.probe.outputs.code == '1'`; a refused join fails the verify step first, so the probe never runs and that output is empty |
| entries in any ledger for the outage | **zero** |

Two corrections to what a first reading suggested, both from measurement rather than from the error text:

1. **The live app was not shipped against a missing anon key.** The deploy took DR-1269's served-site road. The bundle still points at the sovereign stack.
2. **The isolation proofs run against the hosted project**, as `db-migrate.yml`'s own comment at the dispatch has always said. That is a documented limitation of those proofs, not something discovered here; it is the reason they must not be gated on the sovereign road.

## Impact

A merged migration sat off the live database for 22 hours while the app's shipped code wrote against the schema it adds, and the six isolation proofs — the DR-0060-class data-isolation gates — were off for 29 hours. Both were visible only as a red check. The one instrument in the fleet built to answer *"how often does the tailnet go down"* recorded nothing, on the outage that blinds all 64 lanes at once.

This is DR-0125's lesson one layer down. The lane was not lying — `db-migrate` went honestly red, and `migrate-freshness` honestly kept re-dispatching. What was missing is that **nobody is subscribed to the Actions tab.** An observation that exists only as a job status is not an observation.

## Decision

Three changes, no softening of any status.

1. **The isolation proofs are gated on the half they actually need.** `if: success()` becomes `!cancelled() && steps.hosted.outcome == 'success' && steps.witness.outcome == 'success'`, with ids added to those two steps. A shut sovereign road can no longer switch off proofs that never touched it. The job still goes red.
2. **A shut sovereign road writes itself down.** A new step, `always() && steps.replay.outcome == 'failure'`, files or appends to one rolling `incident`-labelled entry naming the lane, the run, what the tool itself said, and the one value that closes it. The replay's output is captured to a file and printed rather than piped, so the step keeps the replay's own exit code instead of `tee`'s.
3. **`node-availability` files before it re-raises.** Its join-verify step writes the same entry, then `exit 1` exactly as before. The call is `|| true`, so the escalation can never be what fails a lane.

`scripts/tailnet-key-incident.mjs` is the one road all callers use, rather than a 65th copy of the `gh issue list || gh issue create` block each health workflow inlines — the drift this house has paid for three times (DR-0621, DR-1151, DR-1152). Its brakes are **budget** (one entry per 6-hour cooldown; 64 lanes times many fires a day would bury the ledger it exists to make readable) and **lock** (one rolling entry, found by exact title). No kill-switch of its own: it writes one comment and exits, there is no loop to run away, and the stop-path is closing the issue (DR-0248, the deterministic class).

**Declined, with a why and a date.** A keyless *sovereign drift witness* — asking the live PostgREST over the Funnel whether the columns a migration adds are present, the way DR-1269 reads the anon key off the served site — was considered and not built. It can only see columns on exposed tables, so it would have been blind to two thirds of migration 0313 (a function and a trigger), and the escalation above already makes the existing honest red signal readable. A witness that can only half-see would invite exactly the false reassurance DR-0076 §8 forbids. `re-review: 2026-11-29`.

**Not closed by this record, and it needs a hand:** the key itself. A fresh Tailscale auth key (Reusable + Ephemeral) stored as `TS_AUTHKEY` is the one value that restores all 64 lanes, and it is a value only Darrell can mint. Until it lands, migration 0313 reaches the live database by DR-0108's second road — his own SSH, pasted — and this record's whole contribution is that the next such outage announces itself instead of waiting to be found.

## Verification

- The gate: `app/src/__tests__/a-dead-tailnet-key-is-never-silent.test.js`, **15 tests, 15 passed**. Most of it reads the workflow files rather than the helper, deliberately: the defect lived in two `if:` expressions, so a suite exercising only the helper's arithmetic would have been green through the entire outage. Each workflow assertion runs in both directions — a condition names a step id, and that step really carries it — so a renamed step cannot leave the gate green over an empty room (DR-0076 §3).
- **Proven to catch — five breaks, applied to the live workflow files one at a time, run, and restored byte-identical (verified with `cmp`):**

  | break | result |
  |---|---|
  | the isolation dispatch back to `if: success()` — the 29-hour outage exactly | **1 failed**, naming that test |
  | `id: hosted` deleted — a renamed step leaving the condition pointing at nothing | **1 failed** |
  | a pipe on the replay invocation — the step taking `tee`'s exit status | **1 failed** |
  | the escalation step deleted from `db-migrate` — red check, no ledger entry | **1 failed** |
  | `node-availability` back to a bare `exit 1` | **2 failed** |

  Restored: **15 passed** after every one.
- An earlier break run used `git checkout --` to restore and so discarded the fix along with the break. It is recorded here rather than quietly repeated: it produced a real piece of evidence by accident — against main's unmodified files the gate reports **7 failed / 8 passed**, which is the gate red on the state that actually shipped — but the per-break attribution from that run was worthless, and the five breaks above were re-run from a backup copy.
- `npm run lint` and `npm run verify:gates` — recorded in the pull request, each read without a pipe.
- **Not verified:** the escalation has never written a real issue. Its decision function and body are unit-tested and its wiring is gated, but the `gh issue create` path runs first on a live refused join. That is stated rather than implied, and the first real firing is the measurement of record (DR-0076 §8). The cooldown's effect across 64 concurrent lanes is likewise reasoned and unit-tested, not observed under load.
