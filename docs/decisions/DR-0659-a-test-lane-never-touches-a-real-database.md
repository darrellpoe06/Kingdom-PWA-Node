# DR-0659 — A test lane never touches a real database: the isolation proofs run on a throwaway copy, and every lane that does reach one is on a register

- **Status:** accepted
- **Tier:** B (changes where a proof lane runs and adds a gate on every workflow; nothing the app reads changes)
- **Type:** fix + gate
- **Date:** 2026-09-25
- **Scope:** `.github/workflows/rls-isolation.yml`, `.github/workflows/db-migrate.yml` (takes the baseline before dispatching the proofs), `.github/workflows/sovereign-read.yml` (`baseline` mode), `.github/workflows/ci.yml`, `scripts/test-db-baseline-over-tailnet.sh` (new), `scripts/test-db-throwaway.sh` (new), `scripts/live-db-reach-guard.mjs` (new), `app/src/__tests__/live-db-reach-guard.test.js` (new), `scripts/system-flow-registry.mjs`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: proven-to-catch, measure), HOLD-THE-HAND-OF-THE-PROCESS (DR-0621), SPEC-CONFORMANCE (DR-0219)
- **Grounds:** db-migrate run 36090407494 on ea3bbdf9 failed at step 5, "Witness the LIVE definitions", in job 107931432308: `public_vacancies — absent from the live database`. The coordinator, 2026-09-25: *"the deeper finding is that an rls-isolation TEST leg ran DROP FUNCTION and re-applied a migration chain against the LIVE production database. That's the real defect: a test lane must never mutate production."* Then: *"Proceed with the throwaway database; it's strictly safer and changes nothing the app reads."*

## Context

**What happened.** The rls-isolation poe-properties leg (run 36090083009) applied its chain from 03:28:37 to 03:29:18. Its pre-step committed `DROP FUNCTION public_vacancies()` on its own, and 0152 to 0161 then rebuilt the function one file at a time. The witness query ran from 03:28:37.99 to 03:28:40.87 and read the function as absent. #1826 made each leg's pre-step and chain one transaction. That closed the gap, but a test lane still wrote to a real database.

**Which database.** rls-isolation used `secrets.SUPABASE_DB_URL`, which `db-migrate.yml` itself describes as the HOSTED project. The app has read the sovereign database on the NAS since `infra/nas-supabase/REPOINT-ARMED` landed on 2026-08-19. So:

- **No visitor met the gap.** No visitor reads the hosted `public_vacancies`.
- **The app's database was never affected.** sovereign-read run 36091611307 (what=definitions) shows `public_vacancies` at 0158's body (md5 d3c44795…) on the database the app reads. `review_member_lesson`, `member_lesson_outbox` and `mark_member_lesson_messaged` match 0238's bodies.
- **How often.** rls-isolation finished 234 runs from 2026-08-03 to 2026-09-25. 149 of them came after the poe-properties pre-step was added on 2026-09-06 (ce70d01a). Each of those 149 left hosted without `public_vacancies` for the length of the chain. All of them fall after the repoint.

**Why a dump and not a replay of the files.** A fresh database cannot be built by running `migrations-auto` from 0001. `infra/nas-supabase/replay_migrations.sh` measured this: v2.1 renamed live tables in place, v2.2.1 depended on v2.8, and the dashboard era left hand-applied state. The sovereign database itself was built from a dump for that reason.

## Decision

1. **The proofs run on a throwaway database.** `scripts/test-db-throwaway.sh` gives each rls-isolation leg its own database on the runner:
   - It starts `supabase/postgres` and runs `supabase/gotrue` once to migrate the `auth` schema. The images are read from `infra/nas-supabase/docker-compose.yml`, so the proofs and the NAS cannot drift apart. Today that is 15.8.1.060 and v2.177.0.
   - It asserts the same platform pieces the NAS replay asserts (extensions and the `auth.*` helpers).
   - It restores the newest baseline strictly: any restore error fails the leg.
   - The leg then applies its chain, pre-step and all files in one transaction (#1826, kept), and runs its smokes.
   - rls-isolation names no secret and no live host. Nothing is shared between legs any more, so `max-parallel` goes from 1 to 6.
2. **The baseline is the live shape and nothing personal.** `scripts/test-db-baseline-over-tailnet.sh` produces it:
   - It runs `pg_dump --schema-only --schema=public` against the database the app reads, plus the `instances` rows (slugs and names), which the smokes look up by slug.
   - No person's record, message, money or document crosses. Every other table arrives empty. pg_dump only reads.
   - db-migrate takes the baseline after the replay and before it dispatches the proofs, so the proofs test the schema that merge produced. It is uploaded as the `test-db-baseline` artifact (30-day retention).
   - `sovereign-read` with `what=baseline` takes the same dump by hand.
3. **A gate.** `scripts/live-db-reach-guard.mjs` runs in CI and has two rules:
   - **A test lane reaches no live database, and no live host at all.** A test lane is any workflow that runs `infra/supabase/tests/`, restores the throwaway database, or is named for isolation, smoke or e2e. The same rule applies to the scripts it runs, and a test lane can never be registered.
   - **Every other workflow that reaches a live database is on the register below,** with the database it reaches and why it may. An unregistered reach fails the build, and so does a stale registration.
   - `live-db-reach-guard.test.js` shows the guard catching: a leg pointed back at `SUPABASE_DB_URL`, a test lane that joins the tailnet or runs `live-sql.sh`, a reach through a called script, an unregistered new lane, a registered test lane, and a stale entry.
4. **The exemptions.** db-migrate, sovereign-replay and the named data-sync lanes stay exempt. Each exemption carries its reason in the guard's `REGISTER`. The register below lists them all.

## The register: every workflow that reaches a live database (2026-09-25)

The **Writes** column comes from reading the code. Where I did not read every line, it says so and carries a re-review date.

| Workflow | Database | Writes? | Line-checked |
|---|---|---|---|
| db-migrate | both | **yes**: applies migrations to hosted, replays them onto sovereign; reads for the witness and the baseline | yes |
| sovereign-replay | sovereign | **yes**: replays migrations (`replay_migrations.sh`) | yes |
| sovereign-read | sovereign | no: read-only queries and `pg_dump` | yes |
| corpus-reconcile | hosted | **yes**: `psql --single-transaction -f scripts/out/choir-sermons-backfill.sql` (line 88) | yes |
| intake-autofix | sovereign | **yes**: `apply` mode runs `apply.sql` over the tailnet (line 103) | yes |
| push-outbox-drain | sovereign | **yes**: `UPDATE public.push_outbox` (`push-outbox-drain-over-tailnet.sh` lines 74, 83, 84) | yes |
| system-flow-proof | sovereign | **yes**: `INSERT INTO` its own readings (`system-flow-proof.mjs` line 103) | yes |
| video-stats | sovereign | **yes**: `INSERT INTO` the reach figures (`video-stats-feed.mjs` line 52) | yes |
| rls-isolation | none | throwaway container only, from this record | yes |
| sovereign-content-sync | sovereign | yes by purpose (a data-sync lane) | no; re-review: 2026-10-09 |
| nas-storage-sync | sovereign | yes by purpose (a data-sync lane, service role) | no; re-review: 2026-10-09 |
| nas-user-rescue | sovereign | yes by purpose (repairs auth rows) | no; re-review: 2026-10-09 |
| nas-email-door | sovereign | yes by purpose (files arriving mail) | no; re-review: 2026-10-09 |
| feedback-fixed | sovereign | yes by purpose (marks feedback fixed) | no; re-review: 2026-10-09 |
| nas-clock | sovereign | POSTs with the service role and runs psql inside `supabase-db` | no; re-review: 2026-10-09 |
| push-sender-credentials | sovereign | installs credentials with the service role | no; re-review: 2026-10-09 |
| nas-health | sovereign | health probes inside `supabase-db`; an `INSERT INTO` at line 465 | no; re-review: 2026-10-09 |
| sovereign-drift | both | compares the two databases; believed read-only | no; re-review: 2026-10-09 |
| voice-intake-health | sovereign | monitor through `live-sql.sh`; believed read-only | no; re-review: 2026-10-09 |
| harvest-health | both | monitor through `live-sql.sh`, still names the hosted secret; believed read-only | no; re-review: 2026-10-09 |
| ops-queue-health | both | monitor through `live-sql.sh`, still names the hosted secret; believed read-only | no; re-review: 2026-10-09 |
| transcript-backfill | hosted | a backfill lane; a first scan found no write statement in the workflow itself | no; re-review: 2026-10-09 |

"Believed read-only" is not a finding. Those rows are dated so the belief is either confirmed by reading the code or corrected.

## Proof

Filled in as it is measured, in this PR:

- **rls-isolation on the throwaway database:** the run IDs below.
- **The guard catching a leg pointed back at the secret:** `live-db-reach-guard.test.js`, "CATCHES a leg pointed back at the secret".
- **The one-transaction apply, exercised for real on the container:** every leg's apply step. The poe-properties and role-control legs carry pre-steps.

## Consequences

- **The hosted project now gets fewer writes.** The isolation proofs no longer write to it. db-migrate still applies migrations there until hosted is retired (tracked under DR-0075).
- **A proof now depends on a baseline artifact.** If none exists, the leg fails and says how to take one. It never falls back to a live database.
- **Three smokes still check production facts,** such as "the live office has an owner" (0193 and 0195). On a schema-only copy those facts are absent by design. How that is handled is recorded in the Proof section once measured.
