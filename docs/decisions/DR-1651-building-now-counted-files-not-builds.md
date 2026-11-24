# DR-1651: `building now` counted files, not builds

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A — one derived count on a read-only receipt; no road, no secret, no write, no SQL
**Type:** orchestration
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/nas-loops/test_lesson_queue_census.py`
**Pairs with:** DR-1610 (the same class: a surface contradicting itself), DR-1514 (the builder's own state), DR-0239, DR-0621, DR-0076 §3 and §8
**Session note:** `docs/99-session-notes/2026-11-24-both-roads-shut-then-the-queue-named-its-rows.md`

## Context

Three receipts in a row, with the raised attempt budget live: `building now: 17`
at 21:05, then **24** at 22:05 — while nine rows waited and **not one attempt
count changed in two hours**. A reader is told two dozen teachings are being
written while nothing is being written.

## What was measured

- **`building` was `len(os.listdir(locks))`** (`:723` before this change) — every
  file in the directory, stale or not.
- **The builder never claims those files are builds.** `acquire_row_lock()`
  (`lesson_builder.py:885`) writes `"<pid> <unix seconds>"` and treats a lock as
  broken when the pid is gone OR it is older than `BUILD_MAX_SECONDS + 120`. A
  build the budget kills never reaches `release_row_lock()`, so its file stays
  and the next pass simply breaks it.
- **So the count named builds the builder had already written off**, and the
  growth, 17 → 24 in an hour with zero progress, is the accumulation rate of
  killed builds — not a stampede, and not 24 live processes (`PARALLEL` is 3).

## Impact

`building now` becomes the number of builds that are running. The leaked files
remain harmless and self-breaking; what is fixed is the receipt telling the
truth about them.

## Decision

1. **Count only live locks**, by asking the builder's OWN question of the
   builder's OWN two fields: the pid is alive and the lock is within
   `BUILD_MAX_SECONDS + 120`. The two can never disagree about which locks are
   stale.
2. **Unreadable or malformed answers "not live"** — the count is "builds running
   now", so a file nobody can account for is not one.
3. **`read: false` still carries the unreadable-directory case** (DR-0076 §8): a
   directory nobody can list stays `null`, never 0. A directory that lists and
   holds only dead locks is a real 0.
4. **Still the count, never the names** — a lock is named for its row, and that
   constraint is unchanged.

## Verification

- **153 cases green** (3 new). Proven to catch three ways, each failing by name:
  counting every file again → 3 fail; dropping the age ceiling → 2; dropping the
  pid check → 3. A case pins the ceiling to the builder's own 2700 + 120.
- **Lint improved:** ruff 0.17.3 at 7 findings for these two files, down from 9
  on `origin/main`.
- **Not claimed:** nothing is measured live. The NAS takes this on its next
  services-sync pull, so the next receipt is the proof. `re-review: 2026-12-01`.
