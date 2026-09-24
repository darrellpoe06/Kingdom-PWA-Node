# 2026-09-24 — Books → Plan: are the tabs' workflows working end to end?

Darrell 2026-09-24 (screenshot of Books → Plan → Dashboard): *"Are these tabs workflows working end to end? Flexibility with rigorous control of the system and processes... Identify: missing information, assumptions, risks, dependencies, decisions requiring human approval, opportunities, constraints, DRs review fully, never guessed, always data driven, timeline?, intuitive design what where when how and why, what is enforced and is synchronization of each component occurring, database driven review of workflows."*

Method: DR-0219 (SHOULD → ARE → GAPS → CLOSE), traced read-only through the code, the migrations, the tests and the decision records, with `file:line` for every claim. Nothing below is guessed; where a thing could not be verified from the repository it is listed under "Not verified" and left open.

## 1. The surface, and what it reads

| sub-tab | what it SHOULD do (documented intent) | what it ARE (the real implementation) |
| --- | --- | --- |
| The Plan | Show the family's written plan, newest row, RLS-scoped (`app/src/lib/surface-help.js:35-40`) | `app/src/components/FamilyPlan.jsx:133-137` — `from('family_plans').select('title, plan, updated_at').order('updated_at' desc).limit(1)`. RLS on the table: `infra/supabase/migrations-auto/0138-family-plans-document.sql:26-40`, four policies gated by `user_in_instance(instance_id)`. The plan narrative renders from the row. |
| Dashboard | Show the plan's metrics and reconciled items (only when the row has them) | `FamilyPlan.jsx:260-284` — `dash.metrics[].metric/amount` tiles, `dash.reconciled` table. Every number on Darrell's screenshot (Operating cash $25,000 … Christy's 0% loan $25,000; the seven reconciled items) is in the `family_plans.plan` jsonb. A repo-wide grep for those values finds only test fixtures (`family-plan-render.test.jsx:56-70`), docs and built bundles. **The numbers are real rows, not painted.** |
| Debt Tracker · Monthly Budget · Cash & Catch-up · Payoff Checkpoints · Bill Calendar | Worksheets of the same plan, each its own tab (the "death scroll" fix, `FamilyPlan.jsx:120-124`) | `FamilyPlan.jsx:286, 306, 345, 360, 375` — each reads its key of the same row (`plan.debtTracker`, `plan.monthlyBudget.*`, `plan.cashPlan`, `plan.payoffSchedule`, `plan.billCalendar.*`). Display-only: nothing in the UI writes to them. |
| Legacy Provisions | The constitution the trust points at, the spendthrift review, the produce-before-you-take ledger; records kept on the device and synced to the family (`surface-help.js:35-40`, DR-0321) | `components/LegacyProvisions.jsx` — local stores `poetech-family-trust-entries-v1` / `-people-v1` (`lib/family-trust-store.js:45-54`); remote table `family_trust_records` through `createTableSync` (`lib/family-trust-sync.js:20-66`; RLS `0167-…sql:93-118`); `addEntry → upload` (771-775), `removeEntry → deleteRow` (777-783), subscribe + merge (752-757). |
| LESS / ALL | Not a Plan feature: the generic tab-overflow control | `components/shared.jsx:279-346` (`TabScroll`), used by `SectionTabs.jsx:41,88`. |
| Footer "SAMPLE · FAMILY OF 4" | Should name the served release | `poe-financial-mvp-v28.jsx:5152` renders `data.meta.releaseLabel`; the string is the demo persona's (`lib/demo-data.js:36`). Signed-in hydration merges `{...d, ...parsed.data}` over the demo object (`:1686-1688`); a saved snapshot without `meta` keeps the demo meta. **That label is the one painted thing on the screenshot**, and it sits under real plan numbers. |
| RESET TO SEED DATA | Reset the shell's demo/seed data | `poe-financial-mvp-v28.jsx:3493` — `confirm` then `setData(SEED_DATA)`; shown when `isFamilyMember || isAnyDemoMode` (5153). It replaces the in-memory shell `data` and the local key `poe-financial-v28` (1904-1921). It does **not** touch `family_plans` or `family_trust_records`; the family snapshot push is blocked while data is seed (1931). |

## 2. Synchronization: is each component actually syncing?

| component | mechanism | measured behaviour |
| --- | --- | --- |
| The plan (all six worksheets) | one fetch on mount (`FamilyPlan.jsx:128-147`, `useEffect([])`) | no realtime channel, no refetch, no local cache; a second family device sees a new plan on its next mount, not live |
| Plan → obligations | `plan_bills_import` (`0206-…sql:47-184`) reads the newest `family_plans` row and inserts into `obligations`; dry-run by default, repeat-safe, owner/admin only (DR-0364) | **not wired to any UI** — grep of `app/src` (non-test) finds no caller |
| Legacy Provisions entries | `table-sync.js`: `upload` (signed-in only, `withUploadRetry` 3 tries 250/500/1000 ms, `upload-retry.js:51-60`); `subscribe` = fetch-all + `postgres_changes` filtered by `instance_id`, 400 ms debounce, resync on reconnect (`table-sync.js:489-563`) | live between signed-in devices; **`initialSync` is never called** by `LegacyProvisions`, so an entry made while signed out, or whose upload failed after three retries, stays on that device for ever |
| Legacy Provisions beneficiaries | local store only (`LegacyProvisions.jsx:762-769`) | never synced |
| Articles and questions | ship with the app (`lib/family-trust.js:39-51`) | true to the About copy |

## 3. What is enforced (the gates), and where the machinery is thin

- **Enforced in CI on every push/PR** (`.github/workflows/ci.yml:20-22, 107, 142`): `family-plan-render.test.jsx` (narrative first, each tab reachable with workbook numbers, blanks shown as "—" never "$0", no empty tabs, the empty state, the error state); `legacy-provisions-render.test.jsx` (7); `legacy-provisions-journeys.test.jsx` (7; line 164 checks the `books:plan` help copy against what renders); `family-trust.test.js` (44); `legacy-provisions-course.test.js` (16); `plan-import.test.js` (11, reads the SQL of 0206); `help-freshness`, `ui-standards-guard:140`, the `table-sync-*` and `upload-retry` tests; `tenancy-guard` (RLS required on every table with `instance_id`); `rls-isolation-matrix-guard.mjs`.
- **Live RLS proof is dispatch-only** (`.github/workflows/rls-isolation.yml`). Its product-forms leg includes `smokes/0206-plan-import-smoke.sql`, whose only cross-household check is that another household cannot *import* (155-157). **No smoke tests a cross-household SELECT on `family_plans` directly, and none covers `family_trust_records` at all** (`0167` appears in no file under `infra/supabase/tests`).
- **Row count witness:** `nas-health.yml:410` reports `family_plans` row counts; DR-0309 re-dumps the baseline so the NAS carries the plan row.

## 4. The structured findings

**Missing information**
- The live value of `family_plans.plan` (only the database holds it; the sandbox cannot query production).
- Whether the device's saved snapshot has `meta` at all (the footer label depends on it).
- Whether `rls-isolation.yml` has passed recently, and whether migration 0167 is applied on hosted and on the NAS (DR-0322 says the table was not proven on the NAS).

**Assumptions the code makes**
- One instance per signed-in user: the plan query has no `instance_id` filter (`FamilyPlan.jsx:133-137`); a member of two instances would receive the newest row across both.
- The network answers: `usePlan` has no timeout and no AbortController; a hung request leaves "Loading the family plan…" on screen indefinitely (`:156-157`). This breaks the DoD rule that every async routine carries an explicit timeout and a structural fallback.
- The plan is authored elsewhere (assistant-ingested, DR-0359): the tab is a reader, and nothing on it says how the row gets updated.

**Risks**
- Trust: a real dashboard under a footer that says "SAMPLE" reads as fake to a family member and as real to a guest (surface-says-truth, DR-0239).
- Silent data loss on Legacy Provisions: an entry created offline is never back-filled (no `initialSync`); beneficiaries never leave the device.
- Isolation: `family_plans` and `family_trust_records` have no live cross-household SELECT proof, only policy text.

**Dependencies**
- `family_plans` (0138) and `family_trust_records` (0167) applied on both databases; `user_in_instance` / `user_role_in_instance`; the realtime channel for the trust table; `table-sync.js` and `upload-retry.js`.

**Decisions requiring human approval**
- None of the closes below moves money, schema, transport or the front door (Tier A). The one Governor-class question is product: should the plan become *writable in the app* (a form that edits `family_plans.plan`) or stay assistant-ingested? Recommended default: stay a reader this week, wire the import button, and put "how this row is updated" on the About panel.

**Opportunities**
- Wire `plan_bills_import` to a button on the Bill Calendar tab (dry-run first, then apply), so the 61 dated bills reach `obligations` from the app (DR-0364 built the function; the surface is missing).
- A realtime subscription on `family_plans` so a plan update reaches every family device without a remount.

**Constraints**
- The sandbox has no route to poetech.us or the databases; live values are proven by the runner (`site-health.yml`, `rls-isolation.yml`) and the NAS health report, never by the agent's word.
- RLS remains the real data gate (DR-0060); nothing here may weaken it.

**DRs reviewed**
- DR-0076 (the "blank is not zero" rule the tab cites at `FamilyPlan.jsx:13`); DR-0309 (baseline re-dump carries the plan row); DR-0321 (Legacy Provisions mounts inside Books → Plan whether or not a plan exists); DR-0322 (`family_trust_records` not proven on the NAS; provisions stay on the device until it is); DR-0323 (Ways review of Legacy Provisions); DR-0359 (the $11,700 rental income is the plan's JSON, not the property records); DR-0364 (bills import: dry-run, repeat-safe, owner/admin). DR-0320 mentions provisions once and was not examined.

**Timeline**
- Same session (DR-0236): the four code closes below, tests first, on the working branch.
- On merge: DR-0107 deploy proof, then DR-0104 live review of the Plan tab on a phone width.
- Dispatch `rls-isolation.yml` with the new smokes and record the run id.

**Intuitive design (what · where · when · how · why)**
- *What:* one reader over one row, plus a ledger. *Where:* Books → Plan, seventh sub-tab, eight worksheet tabs. *When:* on mount, once. *How:* Supabase select under RLS; local store plus table sync for the ledger. *Why:* so the family's written plan and the trust's provisions live where the family already looks, not in a spreadsheet. The gap in intuition: the tab never says when the plan was last updated by whom (the row has `updated_at`; the tab reads it but the worksheets do not show provenance), and the footer contradicts the content.

## 5. CLOSE — what is built now, and what carries a why + re-review date

| gap | close | status |
| --- | --- | --- |
| No timeout / fallback on the plan fetch | bound the fetch (AbortController, 8 s) and render the error state with a retry, reusing the pattern in `lib/access-metrics-sync.js:121-160` | building this session |
| Plan query not scoped to the current instance | add `.eq('instance_id', instanceId)` from `useInstanceRole()` when the id is loaded (RLS still the gate) | building this session |
| Footer says "SAMPLE · FAMILY OF 4" over a real plan | the label reads from the signed-in snapshot's meta; when the shell data is the demo persona but the member is signed in, the footer names the real release (`SEED_DATA.meta.releaseLabel`) | building this session |
| Legacy Provisions never back-fills offline entries | call `initialSync` after subscribe when signed in, so pending local rows upload | building this session |
| No cross-household SELECT smoke for `family_plans` / `family_trust_records` | add both to the rls-isolation product-forms leg; dispatch the workflow; record the run | building this session |
| Bills import has no surface | a dry-run button on the Bill Calendar tab for owners/admins | why: touches `obligations` rows (real money the family tracks) — Tier B per RELEASE-TIERS; ships behind the `hold` label for Darrell's eye. re-review: 2026-10-01 |
| Beneficiaries local-only | why: DR-0322 holds provisions on the device until the trust table is proven on the NAS. re-review: 2026-10-08 with the NAS parity read |
| Plan not writable in the app | why: product decision above; recommended default recorded. re-review: 2026-10-08 |

## Not verified (left open, not guessed)

- The live `family_plans` row equals the screenshot values (no database access from the sandbox).
- The device snapshot's `meta` (the footer's cause is inferred from `:1686-1688`, not observed).
- Recency of a green `rls-isolation.yml` run; whether 0167 is applied on hosted and NAS.
- Whether a reset cascades any remote deletes on table-synced lists.
