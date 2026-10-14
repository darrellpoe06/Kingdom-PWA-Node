# DR-1017: A late sweep asks whether the work was already done — the migrate poll reads db-migrate's runs for main's tip before it dispatches

**Date:** 2026-10-14
**Status:** accepted
**Area:**
- `.github/workflows/auto-merge.yml` (`migrate_if_tip_migration`: a tip that touched a migration is dispatched only when db-migrate has no run for that exact sha)
- `app/src/__tests__/migration-dispatch-lane.test.js` (+1; proven to catch)
- `scripts/place-doors.mjs` (every miss says why: per-building geocode and nearby verdicts, each missed door by address, unit and town; carried in the same PR)

**Amends:** DR-1012 (the heal loops look eight times after the last armed PR leaves — and a loop that STARTS late must not repeat work the other roads did), DR-0697 / P62 (exact identity, not list order: the deploy poll asked "is there a run for main's tip"; the migrate poll now asks the same)
**Declared by:** the lane's own measurement, 2026-10-14, while proving #2165 (DR-1015 / DR-1016)

## Context

A GITHUB_TOKEN merge fires no push workflows (DR-0107), so three roads dispatch the deploy and db-migrate for a merged tip: the person-started sweep's heal loops (auto-merge.yml), the deploy's own post-step, and the CI-completion hooks (deploy-freshness, migrate-freshness; DR-1012). Each is a net under the others. The deploy poll (`deploy_if_stale`) asks, before it dispatches, whether a deploy run already exists FOR main's exact tip (P62). The migrate poll (`migrate_if_tip_migration`) asked only two things: is this tip new to me, and did it touch `infra/supabase/migrations-auto/`. The settled-tip re-check step beneath it has the "already ran against this tip" guard (pinned since 2026-08-28); the poll function never did.

## What was measured

- Sweep 38580006680 (person-started, #2165's second push) was created 14:22:57Z. Its two heal jobs did not START until 14:46:13 and 14:46:17 — 23 minutes queued. GitHub reports no reason; the repository's CI runs 19 jobs per push and #2167's CI was running at the same time, so the plan's concurrent-job ceiling is the likely cause (not verified from the API).
- In that gap #2165 merged as `882852a03` (14:35), Deploy 38581909605 went green with the boot-check (14:38:44), and db-migrate ran green TWICE for that sha: 38581924041 (14:35:47) and 38582084345 (14:36:52). Each db-migrate dispatches an rls-isolation matrix behind it: 38582281757 (14:38:11) and 38582626171 (14:40:31) were both still queued at 14:48.
- At 14:46:19 the late sweep's migrate poll read "main tip `882852a03` touched a migration" and dispatched db-migrate 38583488982 — the third run for one sha, with a third rls-isolation matrix to follow. The deploy poll, started the same second, dispatched nothing: it found the deploy run for the tip.
- db-migrate is idempotent (0290 applied=0 on the second run; the sovereign replay ledger stays 294/290) and single-flight (`concurrency: db-migrate`), so nothing broke. The cost is minutes of runner, the NAS replay, and a 40-minute matrix per spare dispatch — and the matrix holds the `rls-isolation` group, so the proof of the real change waits behind copies of itself.

## Impact

- Unresolved: every sweep that starts after the other roads have finished repeats db-migrate once per migration-carrying tip, and the isolation proof queues behind it. The later the sweep starts, the more certain the repeat.
- The call obligates: a MISSED migration is still the worse failure (code live against a schema it never got, the DR-0831 class); an unreadable answer must not read as done (DR-0076 §8); the three roads stay redundant.

## Decision

1. **The poll asks before it dispatches.** When main's tip touched a migration, `migrate_if_tip_migration` reads `actions/workflows/db-migrate.yml/runs?head_sha=<tip>&per_page=1`. A run for that exact sha, of ANY status, means another road got there first: the poll records the tip as handled and stands down. The same question `deploy_if_stale` asks of the deploy, now asked of db-migrate.
2. **Unreadable reads as not done.** A failed read empties the answer and the dispatch happens; db-migrate's idempotence and single-flight make the spare run cheap, and a missed one is the expensive case.
3. **The re-check step and migrate-freshness are unchanged**; they already carried the guard.
4. **Every miss says why** (same PR; DR-1015's first live run, 38582219189, placed 6 of 12 doors and named the other six by id alone): the placer prints, per building, `no match: <reason>`, `NOT THIS HOUSE (matched "...")`, or `matched "..."; nearby N line(s) / FAILED: <reason>`, and each missed door's address, unit and town (or NO CITY). An unexplained miss is an unverified claim (DR-0076).

Not done, and said: the 23-minute queue itself. If the concurrent-job ceiling is the cause, the fix is fewer CI jobs per push (the PostgreSQL walls as one job, or the shards as two), which is a CI shape decision with its own measurement; `re-review: 2026-10-21`, with the queue times of the next five sweeps read from the API (`created_at` against the first job's `started_at`).

## Verification

- **`migration-dispatch-lane` (30):** the poll function reads db-migrate's runs for `$main_sha` BEFORE `gh workflow run db-migrate.yml`, stands down on `[ "$already" = "$main_sha" ]`, and empties the answer on a failed read. **Proven to catch:** with the workflow change stashed and the test kept, the pin fails (`the poll must ask for a db-migrate run FOR main's exact tip: expected -1 to be greater than -1`); restored, 30 pass.
- The four suites that read auto-merge.yml (deploy-freshness-lane, keep-prs-current-lane, lesson-inbox-bell, migration-dispatch-lane) green; the workflow parses (PyYAML); the 20 gates green.
- **DR-0107 proof:** this PR's own second push starts a person-started sweep that runs this copy of the poll. This PR carries no migration, so the guard's live proof is the NEXT migration-carrying merge: its sweep's heal-migrate log must read either "dispatching db-migrate" exactly once or "already has a run for it — standing down", and db-migrate must show ONE run for that sha. Read at the re-review.
