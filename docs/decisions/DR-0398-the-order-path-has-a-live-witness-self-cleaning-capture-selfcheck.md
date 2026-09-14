# DR-0398 — The order path has a live witness: a self-cleaning capture self-check

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (an additive SECURITY DEFINER function + an outside-in probe step; no schema change, no money, no customer-facing surface — a witness)
- **Type:** business
- **Scope:** `infra/supabase/migrations-auto/0218-…sql` (`door_capture_selfcheck`), `.github/workflows/site-health.yml` (order-path step), `app/src/__tests__/door-capture-selfcheck.test.js`
- **Closes:** the MooreDivahs open item #1 (live verification of the order path — DR-0374/0376/0377 re-review 2026-09-20), with machinery instead of a manual check
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), EXECUTION-OUTCOME-OBSERVABILITY, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS

## Directive

Darrell, 2026-09-14: *"MooreDivahs App get done… 1. Solution? Too!!!"* — on the live-verification item — with the standing priority *"the fix being done in a way that is sustainable and effective… must be sustainable and perpetual."* Approved the approach: *"1. Okay."* A one-time manual test is not perpetual; a standing witness is.

## The gap traced (DR-0061)

Sterling's order was refused by the database for the whole life of the door and nobody knew (DR-0374). Two things now guard it, and a third was missing:
- **Build time:** `crm-pipeline-parity.test.js` fails CI if the JS and SQL pipeline allowlists drift — the exact cause. Solid, but it only sees the code.
- **Runtime, the shell:** `site-health.yml` probes up/fresh/backend/gallery from outside — but **never the order path**.
- **Missing:** a LIVE/deploy regression — the sovereign backend missing a migration, a grant/RLS change, the RPC unreachable — is invisible to a build-time test and to every existing probe. That is the class that stayed silent for months.

## Decision — a self-cleaning round-trip the outside-in probe calls

1. **`door_capture_selfcheck(p_instance_slug, p_pipeline)`** (migration 0218): it calls the **real** `crm_capture_lead` through the same path a customer's order takes, captures the returned uuid, and **deletes that row** — then returns `{ok:true}`, or `{ok:false, stage, detail}` when `crm_capture_lead` raises.
2. **Faithful — no second allowlist.** It does NOT re-implement the pipeline check; a second copy of that registry is precisely what cost Sterling (DR-0374). A regression in the real allowlist, or in the instance pin, surfaces here because it runs the real function.
3. **Self-cleaning by construction.** A PostgREST RPC is one transaction, so no probe row can survive: success → captured and deleted together; refusal → the `EXCEPTION` block's savepoint rolls the insert back. Never a seed row in Shay's numbers, nothing to sweep.
4. **anon-callable, inert to abuse.** `REVOKE ALL … FROM PUBLIC` then `GRANT EXECUTE … TO anon` so the runner walks the app's own public path with the anon key. Every call is one insert + its own delete — no persistent effect, no other row touched.
5. **The probe never cries wolf.** `site-health.yml` step 9 calls it against `poetech.us/sb` (the real backend the app uses), **gated on the backend being up** (step 7 owns a down backend), with one retry. Only a clean capture-stage refusal is `add_fail` (the DR-0374 regression, on the incident ledger); an auth/unreachable/absent answer is **NOT MEASURED** (a probe-config or backend condition), never an order incident — the "a witness that cries wolf gets deleted" discipline site-health already holds.

## Verification (DR-0076)

**Behavior proven live on the hosted DB (2026-09-14)**, run inside a rolled-back check and again returning the values: `door_capture_selfcheck('moore-divahs','moore-orders')` → `{"ok":true}`; `('moore-divahs','bogus-pipeline')` → `{"ok":false,"stage":"capture","detail":"crm_capture_lead: unknown pipeline bogus-pipeline"}`; `('no-such-instance',…)` → the unknown-instance refusal; and **`crm_leads` count 0 → 0 across three round-trips** — self-cleaning is measured, not asserted.

**Source-gate** (`door-capture-selfcheck.test.js`, 6): the migration routes through the real `crm_capture_lead` and carries **no** copied allowlist, self-deletes with a `ROW_COUNT` check, catches the refusal as `ok:false`, and is `REVOKE`-then-`GRANT`-anon; and site-health wires it with the loud-refusal + never-cry-wolf branches.

## Honest limits (DR-0100 / DR-0104)

- The function is created on the **hosted** DB (this session) and ships to **both** DBs through `db-migrate` + the sovereign replay; it is **not yet observed answering on `poetech.us/sb`** — the probe reports NOT MEASURED until the migration replays to the sovereign backend, then starts measuring. First live green is the next scheduled site-health run after the sovereign replay.
- The probe uses site-health's existing `SB_ANON` against `poetech.us/sb`. If that key is not the sovereign anon key, the selfcheck reads NOT MEASURED (never a false incident) — a one-line secret fix, flagged here rather than assumed. **re-review: 2026-09-21** — confirm a real green order-path line in a site-health run.
