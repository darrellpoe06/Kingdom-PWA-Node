# DR-0831 — The isolation legs apply the pre-step group atomically and every later file on its own: four legs were dying on lock exhaustion before any smoke ran

- **Status:** accepted
- **Tier:** B (a change to a proof workflow against the hosted database; no product code; the gap the old rule closed stays closed, proven by the guard)
- **Type:** fix
- **Date:** 2026-10-09
- **Scope:** `.github/workflows/rls-isolation.yml` (the apply step), `scripts/rls-isolation-matrix-guard.mjs` (`checkAtomicApply` pins the new shape), `app/src/__tests__/rls-isolation-matrix-guard.test.js` (proven to catch the old shape, the whole-chain shape, and a loose pre-step).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: a gate that cannot run is a gate that proves nothing), DR-0075 (nothing stays red silently), DR-0644 (the ledger merges resolve themselves and live PRs are kept current), HOLD-THE-HAND-OF-THE-PROCESS (DR-0621: a flag is where the work starts).
- **Grounds:** The isolation matrix run the merge of #2037 dispatched (run 283, 2026-10-09 02:14 UTC) failed on four legs, and the run before it on main (282, head 05edf9427, before #2037) failed on the same four. The role-control leg, which carries the new 0255 smoke, passed in 283.

## Context

On 2026-09-25 the legs moved to applying the pre-step and the whole chain in ONE psql transaction, because a pre-step's `DROP FUNCTION` that committed on its own left the hosted database without `public_vacancies()` for the length of the chain, and a concurrent db-migrate witness read that gap. That closed the gap and opened a different failure.

## What was measured

- Run 283, per leg, read from the logs: `product-forms` died in 0205 at `DROP POLICY IF EXISTS assistant_scope_insert ON public.tlc_job_applications` inside `apply_assistant_scope_overlay()`; `viewer-readonly` in 0212 at `CREATE POLICY assistant_scope_select ON public.obligations`; `poe-properties` in 0156 at `CREATE POLICY viewer_readonly_delete ON public.property_photos` inside `apply_viewer_readonly_overlay()`; `tlc-office` in 0193 at `CREATE POLICY assistant_scope_select ON public.choir_song_ideas`. Every one: `ERROR: out of shared memory · HINT: You might need to increase "max_locks_per_transaction"`.
- The mechanism: the two overlay functions drop and create a policy on every instance-scoped table each time a file calls them; inside one transaction every lock is held until COMMIT, so a chain of six to thirteen files that each call the overlays holds thousands of locks at once. The hosted project's lock table is a server setting the app cannot raise per session.
- Run 282 (before #2037) failed the same four legs; the other 22 legs passed in both runs, and `role-control` with the 0255 smoke passed in 283. The failures are not this merge's.
- The gap the single transaction closed is only ever between the pre-step's DROP and the first file that defines that function again. A later file that changes a function's shape drops and recreates it inside its own file (migration-return-type-guard), so a per-file transaction leaves no gap behind it.

## Impact

- Unresolved: four legs of the isolation matrix never reach their smokes, so the walls of the product forms, the viewer overlay, Poe Properties and the TLC office are unproven against the hosted database on every merge, while the matrix reads red for a reason nobody acts on.
- The call obligates: the pre-step's gap stays closed, every later file commits on its own, and the guard proves the shape rather than a comment asking for it.

## Decision

1. The apply step computes `ATOMIC_N`: for each function the pre-step drops, the index of the first file in the chain that defines it again; the atomic group is the pre-step plus the chain through the largest such index. A pre-step that drops a function no file defines again fails the leg with a plain error.
2. The atomic group runs in one `psql --single-transaction`; every file after it runs in its own `psql --single-transaction`. A leg without a pre-step applies every file on its own.
3. `checkAtomicApply` pins all of it: the pre-step never as its own psql command and always inside `ARGS`; the `${ARGS[@]}` call; the `ATOMIC_N` split; the per-file `REST` loop with `--single-transaction`; and no per-file loop straight from the matrix list.
4. `re-review: 2026-10-16` on the next scheduled isolation run: every leg green again is the proof; a leg still red names its own cause.

## Verification

- `rls-isolation-matrix-guard.test.js`: the 2026-09-25 shape (pre-step on its own, per-file chain) is caught; the whole-chain-in-one-transaction shape is caught on the `ATOMIC_N` split and the `REST` loop; the real workflow passes.
- The guard on the real workflow prints its new sentence; every other gate unchanged and green.
- After merge, measured: `rls-isolation.yml` run 284, dispatched on the merge SHA 628edeedf, completed success with 23 of 23 legs green, `product-forms`, `viewer-readonly`, `poe-properties` and `tlc-office` among them, the first all-green matrix since the one-transaction rule. Deploy 1539 for the same SHA completed success.
