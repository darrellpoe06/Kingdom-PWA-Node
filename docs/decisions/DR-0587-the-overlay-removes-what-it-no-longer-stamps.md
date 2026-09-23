# DR-0587 — The overlay removes what it no longer stamps: a DROP in a migration cannot win against a proof that re-runs the old CREATE a minute later

- **Status:** accepted
- **Tier:** B (a migration to both databases; redefines one policy-stamping function; edits one proof workflow's leg list)
- **Type:** orchestration
- **Date:** 2026-09-23
- **Scope:** `infra/supabase/migrations-auto/0227-the-overlay-removes-what-it-no-longer-stamps.sql`; `.github/workflows/rls-isolation.yml` (viewer-readonly leg lists 0227 last)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — the fix is read off the catalog after the apply, not assumed from the apply's green), SPEC-CONFORMANCE (DR-0219), REVIEW-OUR-WAYS (DR-0108)
- **Grounds:** DR-0583 (0225 came home; the three policies were the whole remaining gap); DR-0347 / 0190 (a redefinition carries every earlier exception); db-migrate run 35910766350; nas-health run 35913232731; hosted `pg_policies` read at 20:05Z

## What was measured

| when | where | what |
| --- | --- | --- |
| 19:40:37Z | db-migrate 35910766350 (hosted) | `0226` applied: `DROP POLICY` ×3 on `push_subscriptions`, `NOTIFY`, ledger row 232 written |
| 19:41:18Z | same run | sovereign replay: `applied 1 this run, ledger 232/228` (the box now holds every file); `rls-isolation` dispatched |
| 20:00:31Z | nas-health 35913232731 | `cutover-sync: post-repoint {"go": false, "schema_missing_by_name": {"rls_policies": ["push_subscriptions.viewer_readonly_delete", "…insert", "…update"]}}` — the same three |
| 20:05Z | hosted `pg_policies` (direct read) | all three present on `push_subscriptions`, predicate `user_role_in_instance(instance_id) IS DISTINCT FROM 'viewer'` with no capability clause — 0125's shape, not 0190's |

**The cause, read from the lane.** `rls-isolation.yml` runs after every db-migrate apply and its `viewer-readonly` leg replays `0125 → 0126 → 0130 → 0131 → 0144 → 0181 → 0190 → 0210 → 0211 → 0212 → 0213` against the same hosted database, "idempotent". 0125's text defines `apply_viewer_readonly_overlay()` without `push_subscriptions` in its participation list (the table did not exist until 0181) and runs it, stamping the three policies onto `push_subscriptions`. 0181 and 0190 redefine the function with the table excluded and run it again — but the overlay only creates on the tables it loops over; it never removes from a table it has since excluded. So the leg put the three back sixty seconds after 0226 dropped them, and would after every future apply. The predicate shape on hosted (pure deny, no `has_capability`) is 0125's signature and confirms which text stamped them.

## Decision

1. **The overlay finishes by sweeping its own exclusions.** 0227 redefines `apply_viewer_readonly_overlay()` with 0190's body verbatim (the same seven participation tables — the lineage test pins the list as a superset of every earlier one — and 0126's capability predicate) plus a final loop that drops `viewer_readonly_insert / update / delete` from every participation table that exists. The last definition to run in any replay therefore leaves the excluded tables clean, whatever an earlier text stamped a moment before. Generic over the list, so the class cannot recur when the list grows.
2. **The proof leg ends on the sweeping definition.** `rls-isolation.yml`'s viewer-readonly leg lists 0227 last. The leg still replays 0125 (and still stamps), and then removes what it stamped before the smokes run.
3. **0226 stays as written.** Its DROP was correct and is what the sweep now keeps true; nothing is rewritten (DR-0011).

## Gates

Local, all PASS against 0227: tenancy (Check E — RESTRICTIVE, `'viewer'`, every participation exception kept), viewer-overlay-lineage (the last definition carries every earlier table and the capability predicate), rls-isolation-matrix guard (every listed file exists, no orphan smoke), migration-replay-order, replay-completeness, smoke-sql-language, migration-return-type, assistant-scope. CI runs the same set on the push.

## Verification after merge

db-migrate applies 0227 on hosted, dispatches rls-isolation; after the viewer-readonly leg completes, a direct read of hosted's `pg_policies` for `push_subscriptions` must list no `viewer_readonly_*`, and the next nas-health cutover line must read `post-repoint {"go": true, …}` with `schema_missing_by_name` empty. If the three return, the leg order or another leg is stamping them and the names say which.

## Also measured in the same read (carried, not decided here)

- **The nas-health clock never fires on schedule.** Every run in the workflow's history is `workflow_dispatch`; the `23 */6 * * *` slots at 06:23Z, 12:23Z and 18:23Z today did not fire. The 00:23Z slot is the next witness (check-in armed for 00:40Z). If it does not fire, the schedule is a claim and not a witness (DR-0582 §4's open item), and the workflow file's `on.schedule` is the first thing to read.
- **Four stale rows in the box's replay ledger** name renamed files (`0168`/`0169-legal-document-shelves.sql`, `0170`/`0171-push-subscriptions-and-the-live-signal.sql`). Bookkeeping only; the replay prints the safe cleanup itself.
