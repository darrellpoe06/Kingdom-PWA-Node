# DR-1283: A dead tailnet key is never silent, and it never switches off the proofs

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** B (the migration lane and a timer-driven witness; no change to merge, CI or deploy, and no change to what any migration does)
**Type:** verification
**Area:** `.github/workflows/db-migrate.yml`, `.github/workflows/node-availability.yml`, `scripts/tailnet-key-incident.mjs`
**Found by:** the agent, while proving bank9's deploy — its own report noted `db-migrate` red on two consecutive merge SHAs and correctly declined to claim it. Pulling that thread is what measured the rest.
**Pairs with:** DR-0317 (the sovereign database is the one the app reads), DR-0125 (the site has its own witness; a red check nobody queries is not an observation), DR-1269 (the deploy's second road to the anon key, built for this same refused key on 2026-10-28), DR-0107 (CI-green is not deployed), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §8 unknown freshness never reads as fresh), DR-0108 / DR-1159 (the order of roads), DR-0248 (budget + lock for the deterministic class), DR-0621 (a flag is where the work starts), DR-0075 (a non-improvement carries a why and a date)

## Context

64 workflows in this repository join the tailnet with `TS_AUTHKEY`. On 2026-10-28 the key began answering `backend error: invalid key`. DR-1269 was written the same day and gave **both** of the things that key was gating a second road: the deploy reads the sovereign anon key back off the served site, and `infra/nas-supabase/replay-on-clock.sh` — registered `enabled` in `infra/nas-loops/services.json`, active by merge — applies the mirror's migrations on the NAS's own clock, against the same ledger, with a lock the two roads share.

So the key closed the **runner's** road to the NAS and nothing else. What it also did, and what DR-1269 did not cover, is take two things away silently:

1. `db-migrate`'s `Dispatch the isolation proofs` carried `if: success()`, which reads the **job's** status. The job is red whenever the sovereign replay fails, however well the hosted half went — so a shut road to one database switched off the six DR-0060-class isolation proofs for the other, which never touched that road.
2. `node-availability.yml`, the witness built to answer *"how often does the tailnet go down"*, files its rolling incident only when its probe returns 1. A refused join fails the verify step first, so the probe never runs, that output is empty, and the incident step is skipped. The one instrument aimed at this outage records nothing on it.

The lane itself was not lying. `db-migrate` went honestly red, and `migrate-freshness.yml` honestly re-dispatched it every fire because a red migration lane is exactly when it should. What was missing is that **nobody is subscribed to the Actions tab**, and an observation that exists only as a job status is not an observation — DR-0125's lesson one layer down.

## What was measured

Read on 2026-10-29 from the runs themselves, not inferred:

| | |
|---|---|
| last `db-migrate` success on main | run 40570457356, `3b9de9e72`, **2026-10-27 19:35 UTC** |
| the step that failed, every run since | `Replay onto the sovereign database` — exit 3, `ssh: connect to host poetech.tail5a2f35.ts.net port 22: Network is unreachable`, after `backend error: invalid key` on the join |
| the steps that **succeeded** in the same runs | `Apply migrations` ✅ and `Witness the LIVE definitions` ✅ — read off run 40795511412's step conclusions |
| migrations in the repo past the commit the **runner's** road last applied | **one** — `0313-every-exam-attempt-is-kept-and-the-best-score-stands.sql`, merged `81813abde` 2026-10-28 02:38 (DR-1264) |
| whether that migration is on the **live** database | **UNKNOWN from here, and not measured.** DR-1269's clock road may have applied it on the NAS hours ago; the answer lives in the box's own `/volume1/PoeTech/sovereign-replay/status.json`, and `loops-health.yml` — the reader — joins the same refused tailnet |
| `Dispatch the isolation proofs` | **skipped in every one of those runs** — `if: success()` reads the *job's* status, and the job is red because of the sovereign half. **29 hours** with no isolation proof run |
| what `node-availability.yml` filed | **nothing.** Its rolling-incident step is gated on `steps.probe.outputs.code == '1'`; a refused join fails the verify step first, so the probe never runs and that output is empty |
| entries in any ledger for the outage | **zero** |

Three corrections to what a first reading suggested, all of them from reading a source rather than from the error text:

1. **The live app was not shipped against a missing anon key.** The deploy took DR-1269's served-site road, and the bundle still points at the sovereign stack.
2. **The isolation proofs run against the hosted project**, as `db-migrate.yml`'s own comment at the dispatch has always said. That is a documented limitation of those proofs, not something discovered here; it is the reason they must not be gated on the sovereign road.
3. **The replay already had a second road, and this record's first draft said it did not.** See the correction below.

### The correction this record owes, recorded rather than quietly fixed

The first draft of this record, its commit message, its workflow comments, the escalation's own body text and the report sent to Darrell all stated that migration 0313 had been off the live database for 22 hours. **That was never measured.** What was measured is the last commit `db-migrate` ran *successfully* against, and the diff of `migrations-auto` between that commit and main's tip — which describes the state of **the runner's road**, not the state of the database.

Two things make that a real error rather than loose wording:

- **DR-1269 built the replay a second road on 2026-10-28**, the same day, and ships it active by merge: `replay-on-clock.sh` runs the same `replay_migrations.sh` against the same ledger on the NAS's own clock, needing no runner and no tailnet. DR-1269 even names this migration as the first one it would carry. A shut runner road therefore says nothing about whether 0313 landed.
- **Reading a lane's own record as the database's state is the exact false-measurement class `infra/nas-supabase/REPOINT-ARMED` warns about in capitals** — written there about the hosted Supabase MCP answering happily for the wrong database, and it applies with equal force to `db-migrate`'s success ledger.

It was caught by the `cited-but-unread` stop hook, which refused the report because it cited DR-1264 and DR-1269 while this session had only read the migration's header and the deploy workflow's inline comment. The citation was the thing that was false first; the claim it dressed came with it. The hook was right, and this paragraph is here because the honest fix is to record the mistake, not to delete the sentence.

**What is still true, and is what this record ships for:** the isolation proofs were off for 29 hours, measured from step conclusions, for a reason that has nothing to do with the sovereign road; and the witness built to count this outage recorded nothing. Neither of those depends on where 0313 is.

## Impact

Six DR-0060-class isolation proofs were off for 29 hours and nothing said so, because a shut road to one database read as a failure of the whole job. The one instrument in the fleet built to answer *"how often does the tailnet go down"* filed nothing on the outage that blinds all 64 lanes at once. And while the key is refused, the live schema state is **unknown from CI** — not behind, not current, unknown — because every road to the box, `loops-health` included, rides the same credential. Unknown must never read as current (DR-0076 §8), and before this record nothing wrote that unknown down anywhere a person looks.

## Decision

Three changes, no softening of any status.

1. **The isolation proofs are gated on the half they actually need.** `if: success()` becomes `!cancelled() && steps.hosted.outcome == 'success' && steps.witness.outcome == 'success'`, with ids added to those two steps. A shut sovereign road can no longer switch off proofs that never touched it. The job still goes red.
2. **A shut sovereign road writes itself down.** A new step, `always() && steps.replay.outcome == 'failure'`, files or appends to one rolling `incident`-labelled entry naming the lane, the run, what the tool itself said, and the one value that closes it. The replay's output is captured to a file and printed rather than piped, so the step keeps the replay's own exit code instead of `tee`'s.
3. **`node-availability` files before it re-raises.** Its join-verify step writes the same entry, then `exit 1` exactly as before. The call is `|| true`, so the escalation can never be what fails a lane.

`scripts/tailnet-key-incident.mjs` is the one road all callers use, rather than a 65th copy of the `gh issue list || gh issue create` block each health workflow inlines — the drift this house has paid for three times (DR-0621, DR-1151, DR-1152). Its brakes are **budget** (one entry per 6-hour cooldown; 64 lanes times many fires a day would bury the ledger it exists to make readable) and **lock** (one rolling entry, found by exact title). No kill-switch of its own: it writes one comment and exits, there is no loop to run away, and the stop-path is closing the issue (DR-0248, the deterministic class).

**Declined, with a why and a date.** A keyless *sovereign drift witness* — asking the live PostgREST over the Funnel whether the columns a migration adds are present, the way DR-1269 reads the anon key off the served site — was considered and not built. It can only see columns on exposed tables, so it would have been blind to two thirds of migration 0313 (a function and a trigger). A witness that can only half-see is worse than the honest unknown, because it invites exactly the false reassurance DR-0076 §8 forbids — and this record's own error is the proof of how cheaply that reassurance is manufactured. `re-review: 2026-11-29`.

**The real gap this leaves open, named rather than closed.** `loops-health.yml` is the only reader of the clock road's `status.json`, and it joins the same tailnet. So the second road DR-1269 built has **no witness while the key is refused** — the road may be working perfectly and nobody can see it, which is the shape of the problem one layer out. Closing it means a keyless reader for that one file, and the honest options (publishing a bounded status file through the Funnel; a signed read over the existing NAS bearer) both put a new surface on the public internet, which is a Governor's call and not a tooling change. Raised here, not built. `re-review: 2026-11-29`, with DR-1269's own `re-review: 2026-11-04` reading the first `status.json` as the earlier checkpoint.

**Not closed by this record, and it needs a hand:** the key itself. A fresh Tailscale auth key (Reusable + Ephemeral) stored as `TS_AUTHKEY` is the one value that restores all 64 lanes, and it is a value only Darrell can mint. Until it lands, the live schema state is answered only from the box — by `replay_migrations.sh` over his own SSH, which both reports the ledger and applies anything the clock road has not. This record's whole contribution is that the next such outage announces itself instead of waiting to be found, and that it announces an honest unknown rather than a guess.

## Verification

- The gate: `app/src/__tests__/a-dead-tailnet-key-is-never-silent.test.js`, **15 tests, 15 passed**. Most of it reads the workflow files rather than the helper, deliberately: the defect lived in two `if:` expressions, so a suite exercising only the helper's arithmetic would have been green through the entire outage. Each workflow assertion runs in both directions — a condition names a step id, and that step really carries it — so a renamed step cannot leave the gate green over an empty room (DR-0076 §3).
- **Proven to catch — six breaks, applied to the live files one at a time, run, and restored byte-identical (verified with `cmp`):**

  | break | result |
  |---|---|
  | the isolation dispatch back to `if: success()` — the 29-hour outage exactly | **1 failed**, naming that test |
  | `id: hosted` deleted — a renamed step leaving the condition pointing at nothing | **1 failed** |
  | a pipe on the replay invocation — the step taking `tee`'s exit status | **1 failed** |
  | the escalation step deleted from `db-migrate` — red check, no ledger entry | **1 failed** |
  | `node-availability` back to a bare `exit 1` | **2 failed** |
  | **the body's original claim restored** — *"the sovereign database can fall behind the repo"* — this record's own error | **1 failed** |

  Restored: **15 passed** after every one. The last break is the one worth keeping: the escalation now cannot ship a sentence that states the live schema is behind, because the first draft shipped exactly that sentence and it was not measured.
- That claim-check itself failed on its first run, for a reason worth recording: written as a bare word-match it rejected the body's own *denial* ("it does not say the live database is behind"). A gate that forbids words rather than claims will reject correct work — DR-0845's lesson — so it now forbids the assertive forms and separately requires the denial.
- An earlier break run used `git checkout --` to restore and so discarded the fix along with the break. It is recorded here rather than quietly repeated: it produced a real piece of evidence by accident — against main's unmodified files the gate reports **7 failed / 8 passed**, which is the gate red on the state that actually shipped — but the per-break attribution from that run was worthless, and the five breaks above were re-run from a backup copy.
- `npm run lint` and `npm run verify:gates` — recorded in the pull request, each read without a pipe.
- **Not verified:** the escalation has never written a real issue. Its decision function and body are unit-tested and its wiring is gated, but the `gh issue create` path runs first on a live refused join. That is stated rather than implied, and the first real firing is the measurement of record (DR-0076 §8). The cooldown's effect across 64 concurrent lanes is likewise reasoned and unit-tested, not observed under load.
