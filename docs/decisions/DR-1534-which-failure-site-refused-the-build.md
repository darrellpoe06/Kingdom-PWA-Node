# DR-1534: Which failure site refused the build

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A — one word widened on a read-only public receipt; no new road, no new secret, no write path
**Type:** orchestration
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0334-which-failure-site-refused-the-build.sql`, `scripts/served-lesson-queue.py`
**Pairs with:** DR-1360 (the keyless road), DR-1507 (shape, not only size), DR-1515 (why a row still waits), DR-1522 / DR-1524 (identity, never a shape), DR-0076 §8 (unknown is never an answer), DR-0621 (hold the hand of the process)
**Session note:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md` §10

## Context

Run 44242079320, 2026-11-18 05:12Z, the eighth consecutive read of this road
with the tailnet shut: **`Failed because -- other: 6, transient: 1`**, the
oldest of the six waiting 5 d 16 h. 0322 added that field so a failure count
could be acted on; for six of seven rows its answer is `other` — "not one of
the two classes that retry themselves", which sends nobody anywhere.

## What was measured

- **Four hands, one word.** A missing writer is a login; a refused draft a
  teaching to re-write; a red test code; a push token a credential — all `other`.
- **The builder names its site every time, in its own prose.** Every
  `BuildFailed` and both `_run_job` failures open with an authored literal
  (`lesson_builder.py:487, 1055, 1135, 1147, 1506, 2641, 2643`;
  `lesson_gates.py:471`). One cannot be named this way: `:1029` tags a crash
  `<ExceptionType>: <message>`, an opening that is a class name, not a literal.
- **A second, separate wrong answer, found while reading:** `why_of` asked
  `stall_of(row) == "rate-limited"`, but `lesson_builder.rate_limited()` treats
  `transient` identically and allows `MAX_ATTEMPTS + RATE_LIMIT_RETRIES` tries,
  so a `transient` row at 2 attempts read `failed` — and a reader comparing
  against MAX_ATTEMPTS=2 called exhausted a row still owed two tries.

## Impact

`other: 6` becomes a named job per class, on a road that needs no key; the
seven rows waiting now are re-classed by the NAS's next 15-minute census.

## Decision

1. **Eight builder literals → seven class words**, matched on the reason's
   FRONT only. What is published is the census's own constant, so the row's
   string never rides and its tail — which can quote a gate error carrying a
   person's words — is not read at all. Identity, never a shape (DR-1522).
2. **`other` stays, and keeps its meaning**: a site this road does not know.
   Narrower than the builder, never wider; the limit is published, not hidden.
3. **The reader prints the job, in fix order** — `no-writer` first, because
   every later class presupposes a draft that got written.
4. **Both self-healing classes** now answer `why_of`.

## Verification

- **Proven to catch, by two independent gates:** dropping `no-writer` from
  0334's `k_stalls` fails `the-queue-is-readable-without-the-key` by name and
  the census suite's allowlist case. Before this the JS gate could not see a
  site class at all — `STALLS` does not hold them, `stall_of` returns a
  variable. Also proven on a re-worded builder message, and on a leak.
- 113 census cases (13 new) + 12 keyless-road cases green; ruff clean. 0334 is
  generated from 0333 on disk, body verbatim, two lines changed, and diffed.
- **Not claimed:** nothing is measured LIVE yet. `re-review: 2026-11-25`.
