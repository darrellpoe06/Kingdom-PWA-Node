# DR-1522: The builder says why it is not ready

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A by the RELEASE-TIERS flowchart — additive, reversible, isolated, no new road, no new secret; it NARROWS what may ride
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0332-the-builder-says-why-it-is-not-ready.sql`, `scripts/served-lesson-queue.py`
**Measurement:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md`
**Pairs with:** DR-1514 (the shape test this does NOT weaken), DR-1518 (the sha that made the verdicts readable), DR-1519 (the branch this rules in or out), DR-0076 §8

## Context

DR-1518's field arrived at 22:11 (`census code 2b6f74894a49`), so the verdicts
were readable at last: four teachings `ready` from code that checks tags, owner
AND words, beside a builder `active` with `building now: 0`. Five records asked
better questions about the ROWS. The rows were never the problem.

## What was measured

- **The heartbeat advances while the attempts do not.** `at: 20:51:29Z` then
  `21:51:31Z`, while attempts on the three failed rows stayed **1, 1 and 2 since
  2026-11-12**. An hourly process recording no attempt is not working the queue.
- **That fits two causes with OPPOSITE fixes.** (a) `readiness()` refuses, so
  `consider()` returns at `lesson_builder.py:2545` *before* `db.pending()` — no
  row read, no attempt, `write_status()` still running. (b) readiness passes and
  `eligibility()` refuses on DR-1519's unmirrorable branch, a whitespace body.
- **Nothing in the receipt told them apart**, and `state` — the field that does —
  was one of the four withheld. The night's own refused attempt is why this is
  safe: withheld KEY NAMES against `^[a-z][a-z0-9_]{0,23}$` were refused by
  DR-1514's gate, correctly — `error_from_mary_smith` fits that shape.

## Impact

Answerable without reaching the box: a `ready` row waiting on a writer is a
credential problem; one a ready builder refuses is a words problem.

## Decision

1. **An ALLOWLIST, never a shape.** `state` is accepted only by identity against
   four literals — every value `readiness()` and `consider()` can produce — and
   what is published is the census's **own constant**, never the builder's bytes.
   DR-1514's shape test stands unweakened; this field just does not use it.
2. **Refused twice, independently** — the SQL re-checks by `= ANY(k_states)`,
   never a pattern, as 0326 rebuilds each waiting row.
3. **The reader says what it MEANS**; an absent state reads UNKNOWN.

## Verification

- 85 Python cases (13 new), 12 reader/guard cases. **Applied to a real PostgreSQL
  16.15:** four states ride verbatim; six hostile values (a member's name, a
  `/volume1` path) read **absent** with no name anywhere; `anon` still refused
  the table and may still call the function.
- **Proven to catch, five ways:** dropping a state from either allowlist; a shape
  in place of the Python identity match (it passed `waiting  on a writer`); a
  regex in place of the SQL's; the reader reading an absent state as `ready`.
- **Two bad drift tests caught before shipping** — one regex draft "found" ten
  states that do not exist, another picked up `": "` from the dict beside it. It
  parses the syntax tree now; a test that cries wolf gets deleted.
- **Not claimed:** which of (a) or (b) holds is **still unknown**; this record
  exists so the next census answers it. Nothing exercised on the NAS yet. `re-review: 2026-11-24`.
