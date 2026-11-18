# DR-1524: Which writer is missing

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A by the RELEASE-TIERS flowchart — additive, reversible, isolated, no new road, no new secret
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0333-which-writer-is-missing.sql`, `scripts/served-lesson-queue.py`
**Measurement:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md`
**Pairs with:** DR-1522 (the field this sharpens), DR-1514 (the closed set that refused this until it was declared), DR-0108 (a readable value is never a paste for his hand)

## Context

DR-1522's first live answer, **23:25:22Z: `state: waiting on a writer`** —
settling what five records had circled: the seven waiting teachings are real,
eligible and his own, and the builder had never looked at one.

## What was measured

- **One word for three writers.** It cannot tell *none configured* from *one
  configured and failing* (a lapsed sign-in) — a setup, or one login.
- **`readiness()` already knows, per writer** — but its entry is
  `{writer, kind, family, primary, ok, why, configured}` and two must never
  ride: `why` is the probe's own words (live: *"claude at /usr/local/bin/claude
  but NOT signed in"*) and `writer` is a **name** out of `lesson-writers.json`,
  which a person may have set to anything.
- **The alternative was a paste for his hand**, which DR-0108 forbids for a
  readable value: the one tool that shows it rides the dead ssh road.

## Impact

The remedy is nameable without reaching the box: a configured-but-failing
`cli-local` is one login; three unconfigured writers are a setup.

## Decision

1. **The entry is REBUILT from three fields, never filtered.** A filter keeps
   whatever it did not think to remove; `kind` rides by identity against
   `WRITER_KINDS`, `ok` and `configured` only as booleans, and every other field
   is dropped unexamined.
2. **Refused twice, independently** — the SQL rebuilds it too, by
   `array_position(k_kinds, ...)`, never a pattern.
3. **The hoist is stated, not discovered.** The census writes it inside
   `status`; the receipt publishes it at `builder.writers`. Both depths pinned.

## Verification

- 100 Python cases (16 new), 28 reader/guard cases. **Applied to a real
  PostgreSQL 16.15** with the live readiness payload, a member's name in `writer`
  and a path in `why`: three entries published as `kind`/`ok`/`configured`, a
  fourth of unknown kind refused, and **every hostile string absent from the
  whole receipt**, the keys `why`, `writer`, `family`, `primary` with them.
- **Proven to catch, four ways:** passing the entry through instead of rebuilding
  it (which leaked all three names at once); matching `kind` by a shape; naming
  `why` in the migration's rebuild; the reader asking a writer for `why`.
- **DR-1514's closed set refused this until it was declared** — the whole value
  of a closed set; the widening is deliberate and commented. And a time-bomb of
  mine was caught: DR-1522's reader fixture hardcoded a census stamp, so it went
  red an hour later when the reader rightly called it stale. Relative now.
- **Not claimed:** nothing is exercised on the NAS yet, and *which* writer is
  failing is still unknown until a census carries this. `re-review: 2026-11-24`.
