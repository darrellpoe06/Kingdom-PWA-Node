# Money Phase 2 — answers to Christina's review (2026-10-28)

Companion to DR-1270 and the preservation checklist. Three proposals here wait on Christina's approval before anything is implemented: blocking the merge lane before a push (§2), switching the legacy Debts tab and Big Picture to the corrected engine (§3), and the settings-only snapshot publish (§4).

## 1. The full test suite — final results

Run as CI runs it, four disjoint shards (`vitest run --shard=i/4`), after a single-process run died of heap exhaustion with no test failures before the crash.

| Shard | Files | Tests | First run | After the two fixes |
|---|---|---|---|---|
| 1 | 435 | 8,077 | green | — |
| 2 | 435 | 7,388 | 1 failed | fixed; full rerun green: 435 files, 7,388 tests |
| 3 | 435 | 7,356 | green | — |
| 4 | 433 | 8,995 | 1 failed | fixed; full rerun green: 433 files, 8,995 tests |

The two failures were pins of the previous state, not defects in the new code: `demo-param-survives-nav.test.jsx` booted its nav harness on the old `calendar` default (now `overview`), and `completion.test.js` requires `app/src/lib/persistent-share.json` to match the shell's frozen budget, which the ratchet had just lowered from 5193 to 5192 (regenerated with `python3 scripts/persistent-share.py`). No expectation was changed to hide a result. Four further consistency tests were added to `debt-freedom.test.js` (§5), 27/27 passing.

## 2. Blocking the automatic merge BEFORE a push — proposal

**The lane as it stands** (`auto-open-pr.yml`, `auto-merge.yml`, read this session): a push to any `ccr-**` branch opens a PR and enables native auto-merge unless the PR already carries the `hold` label; `auto-merge.yml` additionally arms every open, non-draft, non-hold PR on each check-suite completion and disarms every hold-labeled one. A label cannot be attached before a PR exists, and a PR cannot be opened before the commits are pushed — so "push, then hold" is a race, which Christina has rightly refused.

**Recommended (no code change, fully in the owner's hands):** disable the two lane workflows in GitHub before the push, and re-enable them after the PR is marked.
1. GitHub → Actions → "Auto-open PR" → the "…" menu → **Disable workflow**. Same for "Auto-merge".
2. Push the branch (`git push -u origin ccr-acfc42eb-paa7ex`).
3. Open the PR by hand as a **Draft** and add the **`hold`** label. Draft + hold are each sufficient on their own: `auto-merge.yml` filters `isDraft == false` and `no hold label`, and `auto-open-pr.yml` leaves auto-merge OFF when the existing PR carries `hold`.
4. Re-enable both workflows. Nothing can arm this PR while it is a draft with `hold`; CI (`ci.yml`) still runs on the push and reports on the PR.

**Alternative (one small workflow change, needs its own approval because it edits the lane):** teach `auto-open-pr.yml` to skip entirely when the pushed head commit's message contains `[hold]`. Push-triggered workflows run the workflow file AT the pushed commit, so the skip takes effect on the very push that carries it. Then open the PR by hand as a draft with `hold`. Sketch:

```yaml
      - name: Honor a [hold] commit (open nothing, arm nothing)
        if: contains(github.event.head_commit.message, '[hold]')
        run: echo "held by the commit message; no PR opened, no auto-merge"; exit 0
```
(and `if: ${{ !contains(github.event.head_commit.message, '[hold]') }}` on the existing step). The deploy workflow (`deploy-cloudflare-pages.yml`) runs on `push: main` only in both routes; a development branch cannot deploy.

## 3. Switching the legacy Debts tab and the Big Picture headline to the corrected engine — exact changes and risks

**Consumers of the legacy projectors today** (all read in this session):
- Shell `poe-financial-mvp-v28.jsx:3468` `projection = projectDebt(derivedDebts, pressureCalc.extraAvailable, currentDate, 240)` → `BigPictureDashboard.jsx:604` (Consumer debt free hero), `:743-744` (Debt free in / Interest), `lib/number-trace.js:271-274` (the trace).
- Shell `:3469` `debtSnowball = projectDebtSnowball(derivedDebts, debtSnowballExtra, debtSnowballSort, currentDate, 360)` → `Debts.jsx:133-134, 178-189, 212, 427, 567-572, 711, 730-733, 763, 780` (payoff per debt via `activeDebts[].clearedAtMonth`, interest, freed cash flow, all-cleared date), `lib/debt-outcomes.js:85-110` (`debtCountdown` milestones from `clearedAtMonth`), `MoneyOverview.jsx` (debt-free date tile).
- Shell `:3470` `debtMinOnly = projectDebtMinimumOnly(derivedDebts, currentDate, 600)` → `Debts.jsx:212-213, 787`, `lib/debt-outcomes.js:41-58` (`payoffOutlook`).
- `Debts.jsx:206-209` re-runs `projectDebtSnowball` over the terms-complete subset (`partialSnowball`).
- Tests pinning the legacy numbers: `calc-engines.test.js`, `projectDebt.basic.test.js`, `lifecycle-and-flow-extract.test.js`, `flag-1-daily-compounding.test.js`, `spending-priorities.test.js`, `debt-outcomes.test.js`, `debt-trace.test.js`, `number-trace.test.js`, `pressure-real-outflows.test.js`.

**The change, kept to the documented minimum:**
1. A new adapter `app/src/lib/debt-freedom-adapter.js` with three pure functions that return the LEGACY shapes from `planDebtFreedom`: `projectDebtCompat(debts, extra, currentDate, maxMonths)` → `{ projection[{monthOffset,label,debtBalance}], debtFreeMonth, debtFreeYears, debtFreeDate, totalInterestPaid }`; `projectDebtSnowballCompat(debts, extra, sortOrder, currentDate, maxMonths)` → `{ monthlyHistory, allClearedMonth, allClearedYears, allClearedDate, activeDebts[{ id, name, rate, minPayment, originalBalance, currentBalance, clearedAtMonth, interestPaid, flag, entityId }], totalInterest, finalFreedCashFlow }`; `projectDebtMinimumOnlyCompat(debts, currentDate, maxMonths)` → `{ totalInterest, longestPayoff, stuckDebts, allCleared }`. `sortOrder` maps snowball→snowball, avalanche→avalanche, **hybrid→custom with the under-$1,500 debts first** (the corrected engine has no hybrid; the adapter builds the order).
2. Three shell lines change only the function name (`:3468-3470`), net zero lines; `Debts.jsx:8` imports the compat function; `Debts.jsx:206-209` unchanged in shape.
3. Tests: the nine files above are re-pinned to MEASURED values from the corrected engine, each with the old value and the rule that moved it in a comment (never silently). `debt-engine-audit.test.js` keeps the legacy engine's numbers as the record of what changed.

**Compatibility risks, each with its handling:**
- **Dates move later and interest changes.** Removing the partial-month double count (defect A) pushes payoffs later by up to a month per cleared debt; typed `loan`/`mortgage` debts above 10% APR move from daily to monthly accrual (defect B), paying less projected interest; cards at or below 10% move from monthly to daily, paying more. The Big Picture hero and the Debts band will show different numbers after the switch. Handling: the DR for the switch records the before/after on the seed world, and the TraceableNumber traces name the engine.
- **A debt without known terms leaves the headline.** The legacy headline projected unknown terms at 0% / $0 (defect D). After the switch it is excluded by name; `Debts.jsx` already carries the `needsTerms` / `partialSnowball` path, and Big Picture's hero must render "add terms on N debts" when `excluded.length > 0` instead of a date — a one-line copy change in `BigPictureDashboard.jsx:604`.
- **Horizon exhaustion.** Legacy returned a dated month at 240/360 (defect C). The adapter returns `allClearedDate: null` and `debtFreeDate: null` with `allClearedMonth: null`; `Debts.jsx:763` and `BigPictureDashboard.jsx:604, 743` must render "not within N years" for null — three small render guards.
- **`finalFreedCashFlow`.** Legacy summed every cleared debt's minimum. The adapter sums `minPayment` over cleared debts, identical meaning.
- **`debtMinOnly.stuckDebts`.** Legacy marked a debt stuck after one month when its payment barely covered interest. The adapter marks a debt stuck when, at the horizon, its balance is at or above its start (a measured outcome, not a heuristic). `payoffOutlook` and the Debts copy read `stuckDebts.length` only.
- **Performance.** `compareStrategies` runs four plans; the shell runs three. Measured on the seed world (15 debts, 289 months) each plan completes well under a frame, so no memoization change is needed beyond the existing `useMemo`s.
- **Rentals.** `projectRentalSnowball` (and its duplicate in `Rentals.jsx:58`) is a separate engine for the rental portfolio and is out of this switch's scope.

## 4. Settings-only snapshot publish — proposal

**The gate today** (`poe-financial-mvp-v28.jsx:1942-1955`): the family snapshot pushes only when `authSession && !isAnyDemoMode && snapshotPulledRef.current && (!isPublicHost() || authHydrated) && !remainderIsSeed(data)`. `remainderIsSeed` (`:863-880`) reads `recurringObligations, taxCalendar, events, capexItems` and answers true while every row in them is a seed id. A family whose only real edits are `data.moneyPlan` therefore never publishes.

**Proposed correction (two small edits, no schema change, no new table):**
1. In the push condition, replace `!remainderIsSeed(data)` with `(!remainderIsSeed(data) || hasRealMoneyPlan(data))`, where `hasRealMoneyPlan = (d) => !!(d && d.moneyPlan && d.moneyPlan.updatedAt)`. The other guards stay exactly as they are: signed in, not demo, pull completed, hydrated on a public host, the 15-second throttle.
2. When the publish happens on the moneyPlan basis while the remainder is still seed, the payload must NOT carry the seed scaffolding: pass `stripSeedScaffolding(data)` (the existing `:892` helper, which keeps synced rows and user rows and drops pure seed/demo rows) to `buildSnapshotPayload` in that branch. The snapshot a second device then adopts holds the settings and any real rows, never "240 Cedar Ln".

**How seed and demonstration data stay out:**
- `SEED_DATA` (`:218`) and `EMPTY_WORLD` (`:533`) carry no `moneyPlan` key, and the demo personas are built from `SEED_DATA` (`:772`), so a `moneyPlan.updatedAt` can only exist after a person typed a setting; `patchMoneyPlan` stamps it.
- Demo, picker and reviewer modes never reach the push (`:1919` returns before the save effect; `!isAnyDemoMode` in the condition; reviewer mode loads `EMPTY_WORLD` and never writes).
- The payload builder already strips every table-synced list, notes, directives and photo bytes (`snapshot-sync.js:3-12, 36-40`); edit 2 strips the seed remainder on top.
- The pull side is unchanged: a device still protected by rule 2 (real un-joined world, no marker) adopts nothing.

**Residual risk, named:** a family that has typed only settings and still has the seed `recurringObligations` would, after edit 2, publish a snapshot WITHOUT those seed obligations; a second device that was still on seed adopts it and loses the sample obligations — which is the intended outcome (seed scaffolding is not the family's data), and the first device's own seed rows are untouched locally. Verification before shipping: a vitest over `buildSnapshotPayload(stripSeedScaffolding(SEED_DATA + moneyPlan))` asserting no seed id survives and the plan does; and a two-device walk on the dev branch.

## 5. The Debt Freedom screen uses the corrected engine, and its figures agree

- `app/src/components/money/MoneySections.jsx:38` imports `compareStrategies, thisMonthPayments, STRATEGIES, INTEREST_METHODS` from `lib/debt-freedom.js`; nothing under `components/money/` imports `lib/lifecycle-and-flow.js` (grep, this session). The comparison table, the "this month" table, the per-debt table and the schedule all read ONE `planDebtFreedom` result (`:263-266`).
- Agreement is now tested (`debt-freedom.test.js`, the last describe, 4 cases): each debt's payoff month is the first schedule month where its balance reaches zero and it never reappears with a balance; per-debt totals equal the schedule's sums and every month's row balances to the cent (`start + interest + fees − minimum − extra − lump = end`); the month after a debt clears, its full minimum appears as extra on the next debt in order (A's $100 + the recurring $60 land on C as $160); and `compareStrategies` returns exactly what `planDebtFreedom` returns for the same strategy. 27/27 passing.

## 6. Screenshots

`money-phase-2-preview.pdf` (15 captioned pages, desktop and phone, with an index page) was sent to Christina alongside the individual PNGs. The seed world's Safe to Spend reads $0 with an "Estimate" badge and a named shortfall because the sample ledger is 166 days stale and no pay schedule is entered — the honest reading of that data.

## 7. Existing functionality — confirmation

- All twelve legacy sub-tabs mount with identical props (`money-nav.test.js` holds each id to one section and to a live `booksView === '<id>'` branch; `money-overview-render.test.jsx` reaches each one's tab row; the Accounts and Transactions screenshots show two of them inside their sections).
- Financial records: no mutator changed; the engines only read; `moneyPlan` is the only new key and it is additive.
- Imports: the one Upload button and panel are in place on every tab (`books-upload-every-tab.test.jsx`, 15/15); the Tx importer, bulk import, intake pipeline and verified-ledger sync are untouched files.
- Permissions: the Financial PIN gate wraps the whole section; the Imported gate hides the tab and its guard now returns to the Overview; tiers, family membership, entity visibility and RLS are untouched.
- Deep links: every legacy `?sub=` resolves (`nav-history.test.jsx` 33/33); seven new ones added; the default is `overview`.
- Reports: the Imported report library, Taxes, 1099s and Forecast are untouched; the Reports section reuses `finance-reports.js` presets.

## 8. Recommended safest next step

1. Christina disables the two lane workflows (§2, recommended route), I push, she or I open the PR as a draft with `hold`, she re-enables the workflows, and CI runs on the branch for a second, independent confirmation of the shard results.
2. She reviews the preview PDF and the PR diff; nothing merges.
3. If approved: the engine switch (§3) and the sync correction (§4) each ship as their own small PR with their own DR, so each can be reviewed and reverted alone.
