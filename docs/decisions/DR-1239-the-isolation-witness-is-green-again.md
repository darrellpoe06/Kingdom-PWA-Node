# DR-1239: The isolation witness is green again — a smoke read the whole hosted inbox as if it were its fixture, and the witness had no clock and no ledger

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `.github/workflows/rls-isolation.yml`, `infra/supabase/tests/0304-withdraw-my-words-smoke.sql`, `scripts/system-flow-registry.mjs`
**Follows:** DR-1142 (your words can be withdrawn), DR-0771 (a lesson that waits too long rings again), DR-0125 (the site has its own witness), DR-0514 (every run is recorded)

## Context

Darrell, 2026-10-27: *"How is the new person or users able to see our assets
and not just their own or what we allow?!"* The repository's standing answer
is `rls-isolation.yml`: 27 legs, one per feature, each replaying that
feature's migration chain against the hosted database and running its
isolation smoke inside a transaction that rolls back. A leak RAISEs and the
leg goes red.

The last two runs on `main` were red. Nothing had said so.

## What was measured

**Every dispatch since 0304 merged was red on the same leg, and only that leg.**
Runs 342 (2026-10-20 22:24Z), 343, 344, 345 and 346 (2026-10-22 00:21Z), one
failed job each: `isolate — withdraw-my-words`, at the smoke's line 158:

> `FAIL: the sweep alarmed 34e76,d0304,b724e (expected only the waiting row d0304)`

Run 341, the last green, predates the leg. So the leg has never been green on
the hosted database.

**The two extra suffixes are not the fixture's.** The smoke writes five rows,
`…a0304` to `…e0304`; `34e76` and `b724e` are real rows in the hosted inbox —
two of the fifteen waiting teachings DR-1219 found the same week, old enough
to be stale. The smoke's `pg_temp.swept()` aggregated every id
`lesson_inbox_stale_sweep()` returned, over the whole table.

**The sweep did not regress.** `git log -S lesson_inbox_stale_sweep` names two
files, 0252 and 0304, and nothing after. The function running on the hosted
database is 0304's own definition, which the leg re-applies before the smoke.

**Reproduced locally, red first, on PostgreSQL 16 the way `ci.yml`'s
`withdraw-walls` job builds it** (the two bootstrap files, 0304 applied
twice):

| venue | before the fix | after the fix |
| --- | --- | --- |
| empty inbox but for the fixture (ci.yml's venue) | PASS | PASS |
| one other house's stale waiting lesson present (the hosted venue) | **FAIL: the sweep alarmed d0304,34e76** | PASS |
| the sweep's `withdrawn` exclusion removed (proven to catch) | — | **FAIL: the sweep alarmed a0304,d0304** |

**Why five days of red told no one.** The workflow's `on:` was
`workflow_dispatch` alone — it ran only when db-migrate dispatched it after a
migration merge, so a red stayed as red as the last merge left it, and it
wrote to no ledger: no label, no issue, no comment. The OpsBoard incident strip
reads the `incident` label; this witness had never written one. The two
witnesses that watch the lesson loop (DR-1219) and the site (DR-0125) both
file; the one that answers Darrell's question did not.

No door, pictures or properties leg was red on any of the five runs. The
isolation answer itself was never in doubt; the witness's *voice* was.

## Impact

A smoke that runs in two venues — an empty throwaway database in `ci.yml` and
the hosted database in `rls-isolation.yml` — must assert on **its own rows**,
never on the whole table, or it passes in the venue that proves nothing and
fails in the venue that matters. The 0304 smoke was green in `withdraw-walls`
(required, every PR) and red on the real database (nobody watching) for the
whole life of the feature.

A witness with no schedule and no ledger is not a witness. It is a check that
runs when something else remembers to run it and whose result is read when
someone remembers to look.

## Decision

1. **The smoke reads the sweep for its own house only.** `pg_temp.swept()` now
   joins `agent_inbox` and keeps rows where `instance_id` is the fixture's
   house. The sweep itself still walks the whole inbox (it has no scope
   parameter, and changing a live function's signature is not this record's
   subject); whatever it does to other rows rolls back with the transaction.
   The withdrawn row, the not-a-lesson reading and the waiting control are
   all in the fixture's house, so the regressions the smoke exists to catch
   still show — proven above.
2. **The witness has a clock.** `schedule: '47 13 * * *'` — daily, thirteen
   minutes before 14:00 UTC (12 letters in `rls-isolation`, mod 29, plus one),
   beside the other daily witnesses. The concurrency group already serialises
   it against a db-migrate dispatch; `cancel-in-progress: false` means neither
   cancels the other.
3. **The witness writes its ledger.** A `ledger` job, `needs: isolate`,
   `if: always()`, counts the run's `isolate` jobs through the API and, when
   any is not `success`, opens or comments on one rolling issue labelled
   `incident` + `rls-isolation-incident` — the count, the leg names and the
   run link, never a row or an id from the database — and fails. The next
   all-green run comments and closes it. A run with no `isolate` jobs at all
   fails the ledger too: unknown never reads as healthy (DR-0076 §8).
4. **The registry says so.** `rls-isolation` now declares the dispatch read,
   the `gh:incident` write and `ops-surface` as its seed, so the OpsBoard
   incident strip carries this witness beside site-health and the
   lesson-builder witness (interconnect-guard: 0 broken).

## Verification

- Local: red → green → proven-to-catch, the table above.
- `scripts/rls-isolation-matrix-guard.mjs`: clean.
- `scripts/interconnect-guard.mjs`: 13/13 loops wired, 0 broken.
- The 26 vitest suites that read `rls-isolation.yml` or the registry: 448 passed.
- The workflow parses with both jobs; `permissions` carries `issues: write`.
- **After merge:** `rls-isolation.yml` is dispatched on `main` and all 27 legs
  are read; the ledger job's first green is the proof the witness can speak.
  `re-review: 2026-10-29` — confirm the first *scheduled* run fired (event
  `schedule`, around 13:47 UTC on 2026-10-28) and that it closed nothing it
  should not have.

**Limits, named:** the ledger counts jobs; it does not read smoke output, so
"which line" is still in the leg's log. The schedule is a request to GitHub,
not a guarantee of the minute (site-health measured ~67 min for a 10-min
cron; a daily request is honoured within the hour in practice).

**Grounds:** VERIFICATION-DOCTRINE, HOLD-THE-HAND
