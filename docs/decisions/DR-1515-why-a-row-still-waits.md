# DR-1515: Why a row still waits, and how many tries it has had

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A (one census field pair, one migration, one reader line; no new road, no new secret)
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0328-why-a-row-still-waits.sql`, `scripts/served-lesson-queue.py`, `app/src/__tests__/the-queue-is-readable-without-the-key.test.js`
**Measurement:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md`
**Pairs with:** DR-1514 (the builder's state), DR-1511 (the rows are named), DR-0669 (the NAS lesson builder), DR-0076 §3 (proven to catch) · found by reading 0327's own first answer

## Context

0327's first live read (06:08, run 44028543563) said the builder was `active`,
`building now: 0`, its own record 14 minutes fresh — while **three teachings had
waited five days.** So the builder was neither dead nor stuck, and the queue
still could not say why those rows sat.

## What was measured

- **`lesson_builder.eligibility()` explains it.** Past `LESSON_BUILD_MAX_ATTEMPTS`
  a row returns *left for the hourly Routine*. The handoff works **as designed**;
  those rows are the Routine's, and the Routine cannot read a body without the
  key dead since 2026-11-04. Not a builder fault at all.
- **`plain` was doing too much work:** it means only "none of the special tags",
  so an untouched row read identically to a handed-over one.
- **Two latent holes in the vocabulary guard, found by trying the break.**
  Dropping `'failed'` from `k_whys` broke nothing: the check asked whether the
  literal appeared *anywhere*, and `k_status` and the service words contain it.
  Dropping `'transient'` from `k_stalls` also broke nothing: `stall_of` returns
  a *variable*, so the harvest saw only `'other'` and `STALLS` was never read.

## Impact

A reader can now tell *the builder should take this* from *the builder handed
this to you*, over the road that needs no key. The vocabulary guard now proves
membership in the named list, which it never did for any vocabulary.

## Decision

1. **The verdict travels, the threshold does not.** `why` is one of five words;
   `attempts` is a count. `MAX_ATTEMPTS` is the builder's and its environment
   can change it — two places computing one number is how they drift.
2. **Codes, never a reason's text**, and the SQL refuses independently of the
   Python, as 0326 and 0327 do.
3. **A refused verdict reads `why unknown`,** never `ready`.
4. **The guard checks membership in the named array**, for every vocabulary.

## Verification

- 41 Python cases (9 new), 28 reader/guard cases. **Proven by breaking it:**
  dropping `'failed'` from `k_whys` now fails *verdict failed is missing from
  k_whys*, and `'transient'` fails *by_stall class transient is missing from
  k_stalls*. Both passed silently before.
- **Applied to a real PostgreSQL 16** with a hostile row: a verdict outside the
  set, `attempts: 999999`, and a `build_reason` quoting a member. `anon` got
  none of the three — the row still reported, with those fields dropped — and
  `anon` stayed refused the table.
- My own test first failed on the comment saying the threshold is *not* copied;
  it now reads code, never prose — the second time tonight.
- **Not claimed:** nothing is exercised on the NAS yet. `re-review: 2026-11-24`.
