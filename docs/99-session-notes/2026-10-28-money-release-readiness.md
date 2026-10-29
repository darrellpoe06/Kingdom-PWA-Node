# Money redesign — release readiness (2026-10-28)

**Decision record:** DR-1280 (items 1–10). **PR:** #2464, branch `money/phase-2-safe-to-spend`, Draft + `hold` until Christina's final approval.
**Ask (Christina, 2026-10-28):** *"Please prepare the Money redesign for production release... Once these checks pass, provide a concise release summary identifying any remaining risks and ask for my final approval to merge and deploy."*

Every line below is a measurement on the real artifact or a `file:line` in this branch (DR-0076). Nothing here is a claim on the agent's word.

## The nine checks

### 1. Preview isolation complete; no test data can modify production

- **Code.** On any preview host (`*.vercel.app`, a Pages branch alias) the data client is built against a stub that reaches nothing (`app/src/lib/preview-isolation.js` → `resolveSupabaseConfig`; used by `lib/supabase.js`, `lib/public-rpc.js`, `lib/auth-providers.js`). Before the client is built, every identity-carrying key is purged from the preview origin (`purgePreviewForeignState`: `sb-*-auth-token`, `poetech-chat-bridge-token`, `poe-current-profile`, `poe-snapshot-marker`), so the by-shape session readers (`supabase.js readPersistedSession`, `session-handoff.js hasPersistedSession`, `Imported.jsx hasOwnerSession`) find nothing. The app boots a **test household**: the fictional family seed, saved on that device only under `poe-financial-v28-test-household` (never the real key), any real snapshot the origin kept removed first (`purgePreviewSnapshots`), no session possible, sign-in hidden, a banner with **Start over**. The four self-fetching tabs (Owed, Plan, Taxes, 1099s) show the notice instead of fetching.
- **Pinned.** `preview-isolation.test.js` (10 cases: hosts, resolver, every connection module, persona, storage key, the shell's gates, the purges) and `money-test-household.test.jsx` (3) and `sample-mode-tabs.test.jsx` (6).
- **Measured on the built artifact.** `scripts/preview-isolation-probe.mjs`: a real Chromium opens the build under a `*.vercel.app` hostname carrying a PLANTED production session token, a planted NAS bridge token, a planted profile and marker, and a planted "real" snapshot (sentinel entity) in IndexedDB and localStorage, then watches every request. **14/14 checks passed** (`probe-local/report.json`): banner shown; no sign-in control; sentinel never rendered; every planted token purged; the planted snapshot removed from both stores; Safe to Spend renders the fictional household; an entry saves under the test key stamped `preview-test-household`, survives a reload, and Start over returns the household to the seed; a `?login=1` attempt reaches nothing; **zero requests to poetech.us, *.pages.dev, *.ts.net, *.supabase.co, or any NAS road**; no request carried the production project ref. Hosts seen: the preview origin, cloudflare (turnstile asset), youtube (the embedded player).
- **On the live preview (measured from a GitHub runner, `.github/workflows/preview-isolation-probe.yml`).** Run 40789995381 on `8fe3796a`: the browser never reached the app. The only hosts contacted were `vercel.com`, `accounts.google.com`, `google.com`, Vercel's scripts and Sentry, which is Vercel Deployment Protection's sign-in wall. **Zero requests reached poetech.us, `*.pages.dev`, `*.ts.net`, `*.supabase.co` or any NAS road**, and none carried the production project ref. The probe now names its landing page and fails with that cause instead of scoring a sign-in page as the app (15/15 locally with the landing check). Run 40792644967 on `3a713d28` could not measure at all: Vercel refused the build (`api-deployments-free-per-day`, the 100/day cap) and the probe correctly refused to test an older build. **Conclusion:** the outside-in measurement of the app itself rests on the local build under a `*.vercel.app` hostname (15/15); the live preview is additionally behind Vercel's own sign-in.
- **The incident's footprint on production, measured.** Rows created in production today: `accounts` 1 (the Test Debt, id `f4fe402b-f25c-4f88-a780-d63a4d5b91ca`, 0 linked transactions, still present, awaiting Christina's separate approval to delete), `transactions` 0, `entities` 0, `contractors_1099` 0. The family snapshot pushed at 17:08 UTC today carries **zero demo-only record ids** (a structural check of every list in the payload against the 294 ids that exist only in the demo datasets). Two older snapshots from other instances (June, August) each carry 5 demo-only recurring-obligation rows that predate this work and were not touched.

### 2. Existing features and Darrell's other projects intact

- **Footprint** (vs `origin/main`): 47 files, +5069 / −82. Nothing under `infra/`, no migration, no `.sql`, no workflow in the merge/CI/deploy lane changed (the one new workflow is dispatch-only and read-only). Outside Money the touched app files are the four self-fetching tabs (a `demo` prop), `ChromeDock.jsx` / `lib/chrome-dock.js` (the Money dock mode below 1024px, gated on `nav.money`), the three connection modules (the resolver, a no-op on production), `access-gate.js` (re-exports), `nav-history.js` / `surfaces.js` (the Money sections), `Imported.jsx` (one preview-only line), the storage shim (`remove()` added, `get`/`set` unchanged), and the shell (12 `isIsolatedPreview()` reads, all false on production; 5186 lines, under the 5192 budget).
- **Preservation checklist:** `2026-10-28-money-feature-preservation-checklist.md`, 22 rows ticked (every tab, deep link, import, sync, permission).
- **Suite:** see check 4; the full suite exercises every other surface.

### 3. Existing records preserved

- The deploy is static assets; no schema or data migration runs. Table sync, snapshot sync and RLS are unchanged (`snapshot-sync.js` `TABLE_SYNCED_KEYS` untouched).
- On production hosts the device store key is still `poe-financial-v28` (`previewStorageKey('poetech.us')`, pinned), and the loader's legacy-key fallback chain is unchanged there.
- **Baseline row counts** (production, read-only, 2026-10-28 UTC evening), the numbers to compare against after deploy and before any rollback decision:

| table | rows |
|---|---|
| accounts | 4 (includes the Test Debt row) |
| transactions | 2949 |
| entities | 6 |
| contractors_1099 | 3 |
| family_snapshots | 3 |
| debts, budget_goals, obligations (+lines/settlements/documents), recurring_obligations, tax_calendar, payments, rent_payments, home_accounts, transaction_noise, report_snapshots | 0 |

### 4. Full automated suite

- `npm run lint` clean; `verify:gates` every guard OK.
- **CI on `3a713d28`: all 21 checks green** (run 40792650099: lint + guards, the four Vitest shards, selftests + build + probes, the chrome-layout probe, door journeys end to end, every PostgreSQL wall suite). The branch merges cleanly with `main` at `58356461`.
- **What the suite caught on the way, and the fixes:** (1) `reviewer-mode.test.js` pins the shell's public-host boot line word for word, and the first cut of the test household had edited it; the line is restored exactly and the preview branch sits on the line above it, so reviewer and public behavior are byte-identical to `main`. (2) `completion.test.js` requires the dashboard ledger (`persistent-share.json`) to carry the re-frozen budget (5186); regenerated. (3) The interconnect guard required the new probe workflow to be placed in the flow registry; registered as read-only with the preview declared an outside source. (4) A local run that read `rental-portfolio.test.js` while `main` was being merged into the tree failed two cases; rerun on the settled tree, 13/13, and CI is green on it.

### 5. Safe to Spend labels estimates, stale data, and missing details

- `lib/safe-to-spend.js:541-547`: status is `verified` only when every input is; `estimate` when the ledger is stale (newest entry older than `staleDays`, default 14: `ledgerFreshness` lines 425-435), when any income timing is inferred, or when any due day is assumed; `unavailable` with the reason when the scope has no spendable account. Every reason is a sentence on the card (`confidence.reasons`), and the amount's label and source line carry the status (`MoneyOverview.jsx`, `sts-simple`).
- Missing figures are named, never invented: the guided setup lists what is missing (Required / Optional), and the engine's breakdown reconciles to the cent (`safe-to-spend.test.js`, 26 cases; `money-functional-audit.test.js` cases 1.1–1.7).
- **Fixed 2026-10-29 (DR-1280 item 11):** a bill paid in the ledger (early or partly) is settled automatically and never counted twice; a bill marked paid before its payment posts stays counted and is named, so Safe to Spend never reads high; twice-a-month pay lands on the 1st & 15th; partial payments show what is paid and what is left.

### 6. Adding, editing, deleting works

Measured on the real app path (private host: the family seed, no session, saved on the device) against the built artifact, `crud-audit.cjs`, **13/13**: add an account → appears, survives a reload, is in the saved snapshot; edit its balance → shows, survives a reload (saved balance 2000); delete it → gone, gone after a reload and from the saved snapshot. Add a transaction → appears, survives a reload; edit its amount (−50) → saved; delete it → gone after a reload. A debt rate entered on the Debts tab survives a reload. Zero page errors.

### 7. Save and synchronize; what does not synchronize

What reaches the family cloud, and when (unchanged by this PR; read from the shell and `snapshot-sync.js`):

| data | road | condition |
|---|---|---|
| accounts, debts, transactions, entities, contractors (1099), projects, inquiries, incidents | per-table sync (RLS-scoped rows) | signed in AND the household's `numericSyncVerifiedAt` is set (it IS set on the family instance) |
| budget goals | `goals-sync.js` table rail | signed in |
| **moneyPlan** (pay schedule, cushion, due days, bill statuses, strategy), recurring obligations, tax calendar, events, capex, pressure, snowball settings, theme | `family_snapshots` remainder | signed in AND the remainder is not seed scaffolding (`remainderIsSeed`, shell line 863) — true for the family, whose remainder holds real rows. The family snapshot has never carried `moneyPlan` yet (measured: `has_money_plan = false` on all three instances); it will ride the first push after release. |
| report usage ranking, recurring-payment decisions, learned import de-duplication, the Money rail collapsed state | **this device only** (localStorage) | never synchronized — by design, these are per-device conveniences |
| the preview test household | this device only, under its own key | never synchronized, never on production hosts |

**Clearly identified, does not synchronize for a settings-only household (DEFECT-4):** a brand-new household whose only entries are in Settings (no real recurring obligation, tax item, event or capex row) never publishes its snapshot, so its Money settings stay on the device. The Poe family is not in that state. A one-line fix exists (treat `moneyPlan.updatedAt` as a real row) and awaits separate approval (DR-1280 item 6).

### 8. Recoverable backup and rollback

- **What this deploy can and cannot damage.** It changes the served bundle only. No table, policy, function or row changes. The data layer's exposure is limited to what the app already does when a signed-in family member edits records.
- **Backup (proposed, needs Christina's approval because it writes to production):** before the merge, copy the financial tables into a dated backup schema inside the production database: `create schema money_backup_20261028; create table money_backup_20261028.accounts as table public.accounts;` and the same for `transactions`, `entities`, `contractors_1099`, `family_snapshots`, `budget_goals`, `debts`, `recurring_obligations`, `tax_calendar`, `obligations`. It is a plain copy, no policy, invisible to the app, restorable row-by-row with `insert ... select`. Row counts after the copy are compared to the baseline table above. (Supabase Pro's own daily backups also exist on the project; they are Darrell's dashboard, not reachable from here.)
- **Rollback of the code (no approval needed beyond the ask):** (a) fastest: Cloudflare Pages → `poetech-app` → Deployments → *Rollback to this deployment* on the deployment before the merge (Darrell's dashboard; instant); (b) by the lane: `git revert <merge sha>` on a `fix/revert-money-redesign` branch, pushed — the lane merges it on green and deploys (~3–6 minutes), proven by a real deploy run and `site-health.yml` (DR-0107 / DR-0125).
- **Rollback of data, if ever needed:** `insert into public.<table> select * from money_backup_20261028.<table> where id = ...` for the affected rows; the baseline counts say what "as before" was.

### 9. Fictional data separate from real records

- The sample (`?demo=`) never persists and never syncs (shell gates on `isAnyDemoMode`; demo-only ids are filtered from every upload, `DEMO_ONLY_IDS`).
- The preview test household lives under its own storage key on its own origin and cannot reach any cloud.
- On production hosts a fresh family device starts from the family's own cloud snapshot, never the sample (the 2026-06-11 hydration rule, unchanged).

## Remaining risks for the release summary

1. **The live site's data road.** `main`'s deploy still points the bundle at the absolute Tailscale Funnel URL (the 2026-10-09 stopgap, `deploy-cloudflare-pages.yml`), which the browser now refuses cross-origin — Darrell's Properties storefront read fails with "Failed to fetch". Money's signed-in sync and the self-fetching tabs ride the same client. The one-line revert to `poetech.us/sb` is committed on `fix/sb-same-origin-road` (not pushed: it auto-merges and deploys, and touches a shared workflow). **Recommended first step.**
2. **DEFECT-1** (paid bills still projected → Safe to Spend can read low). Small fix, separate approval.
3. **DEFECT-4** (settings-only households never publish). Does not affect the family. One line, separate approval.
4. **The legacy Debts tab and Big Picture** still read the old debt engine; Debt Freedom reads the corrected one. The two can disagree on a payoff date until the switch is approved (DR-1280 item 6 / re-review 2026-11-11).
5. **The Test Debt row** stays in production until Christina approves its deletion.
6. **Vercel's preview cap** can turn the `Vercel` commit status red; it is cosmetic (measured 2026-10-21) and never evidence about the live site.
