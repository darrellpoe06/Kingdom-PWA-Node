# DR-0599 — Books → Plan is reviewed end to end: the fetch is bounded, scoped and retryable, the footer names the release and not the demo, the provisions ledger back-fills on sign-in, and both tables get a live cross-household proof

- **Status:** accepted
- **Tier:** A (four reader-side fixes and two smokes; no schema, no transport, no money; RLS unchanged and now proven live)
- **Type:** fix + review
- **Date:** 2026-09-24
- **Scope:** `app/src/components/FamilyPlan.jsx` (`fetchNewestPlan`, `planFetchError`, `PLAN_FETCH_TIMEOUT_MS`; `usePlan` bounded by an AbortController, pinned to the resolved instance, with a Try again control); `app/src/lib/release-meta.js` (new) + `app/src/poe-financial-mvp-v28.jsx` (the saved snapshot's meta takes the release fields from the seed); `app/src/components/LegacyProvisions.jsx` (`initialSync` on mount); `infra/supabase/tests/0138-family-plans-isolation-smoke.sql` + `0167-family-trust-records-isolation-smoke.sql` (new) and `.github/workflows/rls-isolation.yml` (product-forms leg); tests `family-plan-fetch-bounds.test.jsx`, `release-meta.test.js`, `legacy-provisions-backfill.test.jsx` (new); the review itself: `docs/99-session-notes/2026-09-24-books-plan-tabs-end-to-end-review.md`
- **Principles:** SPEC-CONFORMANCE (DR-0219), REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), SURFACE-SAYS-TRUTH (DR-0239), NOTHING-WAITS (DR-0236), DO-NOT-RE-ASK (DR-0111)
- **Grounds:** Darrell 2026-09-24, screenshot of Books → Plan → Dashboard: *"Are these tabs workflows working end to end? Flexibility with rigorous control of the system and processes... Identify: missing information, assumptions, risks, dependencies, decisions requiring human approval, opportunities, constraints, DRs review fully, never guessed, always data driven, timeline?, intuitive design what where when how and why, what is enforced and is synchronization of each component occurring, database driven review of workflows."*

## Context

The Plan tab reads one `family_plans` row under RLS and renders eight worksheets and the Legacy Provisions ledger beside them. The review traced every sub-tab from the screenshot to the row, the policy, the sync path and the gate (`file:line` throughout, in the session note). Four things did not hold and one label lied:

1. The fetch had no timeout and no fallback: a request that never answered left "Loading the family plan…" on screen indefinitely (the DoD rule on async routines was not met).
2. The query had no instance filter; RLS was the only wall, so a member of two households would receive the newest row across both.
3. The footer under a real plan read "SAMPLE · FAMILY OF 4": the demo persona's `meta.releaseLabel`, saved by a device that first hydrated from the demo object and merged back over real data on every load.
4. Legacy Provisions never called `initialSync`, so a record made signed out, or whose insert failed after its retries, stayed on one device for ever; beneficiaries never left the device at all.
5. Neither `family_plans` nor `family_trust_records` had a live cross-household SELECT proof in the isolation matrix (0206's smoke proved only that another household cannot import).

## What was measured

| what | measured |
| --- | --- |
| dashboard numbers | real: `family_plans.plan` jsonb under `user_in_instance` RLS (0138); a repo-wide grep for the screenshot's values finds only test fixtures and built bundles |
| painted | one thing: the footer label, `poe-financial-mvp-v28.jsx:5152` reading the demo persona's meta |
| sync | plan: one fetch on mount, no realtime; provisions: subscribe + upload + delete, no back-fill; beneficiaries local only |
| enforcement | the render/journey/engine/import suites in CI (58 tests re-run green with the new ones); `rls-isolation.yml` dispatch-only with no SELECT smoke for either table |
| after this DR | plan fetch bounded at 8 s with an honest error and Try again (pinned by a hung-request test that exercises the abort path); instance filter applied when the shell has resolved one (pinned); footer takes `releaseLabel`, `releaseNote`, `appVersion` from the seed on every hydration (pinned against the demo persona); provisions back-fill on mount, skipped signed out, failure logged not thrown (pinned); two smokes added to the product-forms leg, replay-order guard OK |

## Decision

1. Every async read on a Books surface carries an explicit bound and a structural fallback; `fetchNewestPlan` is the pattern (AbortController, named error, retry).
2. A per-instance query names its instance when the shell has resolved one; RLS remains the wall (DR-0060), never the only line.
3. The release fields of `data.meta` describe the app and are always taken from the seed; a family's snapshot never carries a demo label into the footer.
4. A local-first table sync that uploads on add also back-fills on mount (`initialSync`), or it is not a sync.
5. A table the app stands on has a live cross-household SELECT smoke in the isolation matrix, not only policy text.
6. Carried with a why and a date (in the session note): the bills-import surface (Tier B, `hold`; re-review 2026-10-01), beneficiaries sync (DR-0322; re-review 2026-10-08), the plan writable in the app (product; re-review 2026-10-08).

## Verification

- `family-plan-fetch-bounds` 5/5, `release-meta` 3/3, `legacy-provisions-backfill` 3/3, `family-plan-render` and the six neighbouring suites green in one run; lint 0.
- `scripts/migration-replay-order-guard.mjs`: OK with the two smokes added.
- `rls-isolation.yml` dispatched on this branch after the push; the product-forms leg must print both `… ISOLATION SMOKE: PASS` lines. If 0167's smoke raises "relation does not exist", that is the DR-0322 answer and is recorded here rather than assumed.
- After merge: DR-0107 deploy proof; DR-0104 live review of the Plan tab on a phone: the footer must read the release, and a plan must load inside the bound.
- re-review: 2026-10-01 — the bills-import button (Tier B) and whether any hung-fetch error was ever shown (the error text is greppable in site-health's DOM read).
