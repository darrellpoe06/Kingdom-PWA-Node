# DR-1090: An overlay leaves a correct policy alone

**Date:** 2026-10-17
**Status:** accepted
**Tier:** B (the assistant and viewer walls on every instance-scoped table; the rules themselves are unchanged)
**Type:** way
**Area:**
- `infra/supabase/migrations-auto/0301-an-overlay-leaves-a-correct-policy-alone.sql` (new)
- `infra/supabase/tests/0301-overlay-leaves-correct-alone-smoke.sql` (new)
- `.github/workflows/rls-isolation.yml`: the four legs that re-apply an overlay definer end on 0301, and the smoke rides the assistant-scope leg
- `scripts/assistant-scope-guard.mjs`: redefinitions of the assistant overlay are held to 0130's shape
- Test: `app/src/__tests__/overlay-leaves-correct-alone.test.js` (new)

**Grounds:** Darrell, 2026-10-17, after the poe-properties isolation leg was reported red again and the fix deferred: **"?!!!!!!!!!!!!"**. Everything buildable now is built now (DR-0236), and a red witness is work (DR-0621).
**Principles:** DR-0076 (no claim without evidence; §3 proven-to-catch); DR-0236; DR-0621; DR-0831 (one file per transaction); DR-0241 and DR-0271 (the viewer and assistant overlays)

## Context

The rls-isolation `poe-properties` leg has failed on every run since 2026-10-14 with "out of shared memory", at 0154's call to `apply_assistant_scope_overlay()`. The leg already applies each file in its own transaction (DR-0831), so splitting files further could not help. The failure is inside a single call.

## What was measured

| | |
|---|---|
| Failing statement | `CREATE POLICY assistant_scope_update ON public.legal_documents …` inside `apply_assistant_scope_overlay()`, called by 0154 (runs 38991878844, 38858142629, 38811929364) |
| What each call did | Dropped and re-created 4 assistant policies (or 3 viewer policies) on every instance-scoped table, 233 of them. Each DROP and CREATE holds an ACCESS EXCLUSIVE lock to COMMIT |
| Files in the leg that call an overlay | 21 of 44 |
| Reproduced locally (PostgreSQL 16, 320 tables, a deliberately small lock budget, every policy already in place) | The old overlay: `ERROR: out of shared memory`. The same database with 0301: both overlays run in one transaction, exit 0 |

## Decision

1. **Compare, then rebuild only what differs.** A policy that already exists with the same command, the RESTRICTIVE kind, the role `authenticated`, and the same USING and WITH CHECK expressions is left alone, and no table is locked. A missing, stale or hand-edited policy is dropped and re-created exactly as before.
2. **Postgres decides "the same".** The wanted predicate is planted on a session-local temporary probe table and deparsed. The live policy is deparsed the same way, so the two texts match only when the expressions do. The viewer overlay probes once per capability area, not once per table.
3. **Nothing else moves.** The predicates, the verbs, the assistant allowlist (0130), the viewer participation list (0125, 0181, 0190), the capability checklist (0126) and the 0227 sweep are unchanged. The sweep now only touches a participation table that actually carries a viewer policy.
4. **Every replay ends on 0301.** The four rls-isolation legs that re-apply an older overlay definer (role-control, viewer-readonly, tlc-office, assistant-scope) now list 0301 last, so the live database never finishes a run on the blind overlay. The existing migration-replay-order guard already refuses a leg that forgets this.

## Impact

The poe-properties isolation leg can finish again. Every db-migrate that re-runs an overlay stops taking a lock on every table the family, the businesses and the church use, and locks only what it actually changes. The walls themselves are unchanged.

## Verification

- **`0301-overlay-leaves-correct-alone-smoke.sql`, on PostgreSQL 16:** PASS. It checks the following:
  - the first run stamps all seven policies on each of two scratch tables;
  - a second run re-creates none of them;
  - a loosened policy (USING true), a policy moved to PUBLIC, and a dropped policy are each put back, and exactly those three move;
  - the participation sweep holds.
- **Proven to catch, on the same database:**
  - making the comparison ignore the expression fails it ("a loosened assistant policy was left loose");
  - restoring the blind overlay fails it ("a second run re-created 14 of 14 correct policies").
- **The original failure, reproduced:** at a small lock budget the old overlay fails and 0301 passes, on the same 320 stamped tables.
- **`overlay-leaves-correct-alone.test.js` (8 tests).** It checks the following:
  - the redefinition keeps 0130's wall;
  - every DROP sits behind a compare;
  - the viewer keeps all seven exceptions and the sweep;
  - every leg that replays a definer ends on 0301.
- **Proven to catch:**
  - a widened allowlist, a dropped verb and a permissive overlay each fail the guard;
  - removing one compare fails the test.
- **Guards:** migration-replay-order now names every file a leg without 0301 would revert, and is green with it. Tenancy, assistant-scope, matrix, prose, return-type, newest-definition and replay-completeness guards pass.

**re-review:** 2026-10-20: read the next rls-isolation run's poe-properties leg on main.
