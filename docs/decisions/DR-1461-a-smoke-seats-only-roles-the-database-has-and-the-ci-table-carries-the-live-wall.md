# DR-1461: A smoke seats only roles the database has — and the CI bootstrap table carries the live wall

**Date:** 2026-11-13
**Status:** Accepted (a finding from the matrix run after #2651, worked the same session; DR-0621)
**Tier:** A (a test fixture and a CI bootstrap; no app code, no live schema)
**Type:** decision
**Area:** `infra/supabase/tests/0319-one-person-one-house-smoke.sql`, `scripts/withdraw-ci-bootstrap.sql`
**Sent in by:** the `rls-isolation.yml` matrix run 43339993126 on `a6fddb15`, its `one-person-one-house` leg red; red identically on the previous run (43306996415, 917a8d05e). Pulled forward under DR-0236 and HOLD-THE-HAND-OF-THE-PROCESS: a flag is where the work starts.
**Pairs with:** DR-1407 (0319, the smoke's owner), DR-0100 (the eight-role wall on `instance_members`), DR-0131 (the stale twin of that wall), DR-0076 §3 (proven-to-catch), DR-0644 (the matrix is the live witness)

## Context

The 0319 smoke seats its second person as `renter` on a third house, as the seat 0319 must never carry. `renter` has never been an `instance_members` role: the wall's newest definition (0100) lists owner, admin, member, viewer, specialist, child, successor and assistant, and renters live in their own table (0123). The bare-Postgres CI job passed because the bootstrap table it builds carries no role constraint at all, so the smoke proved its point on a table the live database does not have, and the one witness that runs on the real database was red for two runs with nobody reading it.

## What was measured

| what | measured |
| --- | --- |
| the matrix leg, two runs | `0319-one-person-one-house-smoke.sql:39: ERROR: new row for relation "instance_members" violates check constraint "instance_members_role_check"` |
| the live wall's role list, newest definition (0100) | eight roles, no `renter` |
| 0319's carry rule | `f.role IN ('owner','admin','member')`: a `viewer` seat is as uncarried as a `renter` seat |
| locally, the bootstrap table given the eight-role wall, the smoke as it was | the matrix's exact error reproduced at line 39 (the fix catches) |
| the smoke with `viewer`, same table | `ONE PERSON ONE HOUSE SMOKE: PASS` |
| the whole CI step on a fresh database with the edited bootstrap | 0304 smoke PASS, 0319 smoke PASS |

## Impact

The matrix's `one-person-one-house` leg goes green on its next dispatch with no change to the migration or the live wall. Any future smoke that seats a role the database refuses now fails on the bare-Postgres job too, before it reaches the matrix.

## Decision

1. **The smoke seats `viewer`, not `renter`,** on the third house: the same uncarried, untouched seat, in a role the database has.
2. **`scripts/withdraw-ci-bootstrap.sql` builds `instance_members` with the live eight-role CHECK** (0100's list), so the CI table refuses what the real one refuses.
3. **A red matrix leg is a finding with a date, never a known-red.** This one is closed the day it was read.

## Verification after merge

DR-0107, done 2026-11-13: #2652 squash-merged as `6765b972` at 01:23Z; Deploy (Cloudflare Pages) run 43344591091 on that SHA green. The matrix, `rls-isolation.yml` run 43347774242 dispatched on that SHA: every leg green, `one-person-one-house` green at 01:50Z on the real database (red on the two runs before), `institute-roll` green at 02:03Z.
