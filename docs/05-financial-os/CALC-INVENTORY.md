# Financial Calculation Inventory — Audit Pass 1

> **Status:** IN PROGRESS, 2026-05-24. Pass 1 of the four-pass financial accuracy audit committed to before the June 1 family + church launch. Per `project_financial-accuracy-load-bearing` memory: financial calcs in this app drive real money decisions; verification is load-bearing, not aspirational.
>
> **Scope of Pass 1:** read every consequential calculation in the codebase. For each, document: what it computes, the literal formula, its inputs, its assumptions, where it surfaces in the UI, the risk class if wrong, and current verification status. No code changes in this pass.
>
> **Sources:** `app/src/poe-financial-mvp-v28.jsx` is the single MVP file. Other components in `app/src/components/` may render the outputs but the math lives in the MVP.

---

## Risk class definitions

- **CRITICAL** — wrong number directly misleads a financial decision with multi-thousand-dollar consequences (which debt to attack, whether to take on more debt, when to retire, whether rent covers mortgage).
- **HIGH** — wrong number distorts perception of financial position enough to change behavior over months (runway, buffer, cashflow trend).
- **MEDIUM** — wrong number is visible to user and could erode trust if spotted, but isn't load-bearing for individual decisions (totals, summaries, snapshot views).
- **LOW** — cosmetic or progress indicators (percent toward goal, time-since-event labels).

## Verification status

- **VERIFIED-BY-HAND** — formula matches a hand-checked unit test in Pass 2.
- **VERIFIED-AGAINST-XLSX** — output matches `Poe_Family_Financial_Control_System_v1.xlsx` on Darrell's actual numbers in Pass 3.
- **UNVERIFIED** — formula has been read and documented, but neither tested nor reconciled.
- **FLAGGED** — Pass 1 found a concern that needs explicit attention.

---

## C1 — `projectDebt` (main pressure-slider projection)

**Location:** `app/src/poe-financial-mvp-v28.jsx:634-648`

**What it computes:** Given a list of debts and a monthly extra payment available (from the pressure slider on the Big Picture dashboard), projects month-by-month total debt balance forward up to 240 months (20 years). Returns the trajectory, the month debt-freedom is reached, and total interest paid along the way.

**Inputs:**
- `debts[]` — each with `balance`, `rate` (APR as percent), `minPayment`, `leaveAlone` flag
- `monthlyExtraAvailable` — extra-principal pool per month, in dollars (from `pressureCalc.extraAvailable`)
- `currentDate`, `maxMonths = 240`

**Formula (per month, for each non-`leaveAlone` debt):**
1. Accrue interest: `balance += balance × (rate / 100 / 12)`
2. Apply minimum payment: `balance -= min(minPayment, balance)`
3. After all debts have taken their minimums, the leftover `pool = monthlyExtraAvailable` is poured at the debt with the **highest current rate** (avalanche method). Repeats up to 100 times per month or until pool is exhausted.

**Surface:** Big Picture dashboard projection chart; "Debt-free in N years" headline; "Total interest paid" figure.

**Assumptions:**
- Interest is **monthly periodic** (APR/12), not daily compounded. ⚠ See FLAG-1.
- The pressure-slider's extra is always allocated avalanche-style (math-optimal). UI does not surface this — user may expect snowball.
- Min payments are constant (do not amortize down with balance as real credit-card min payments do).
- `leaveAlone === true` excludes a debt entirely (e.g., 0% promos, the Good Leap solar loan, the car at 7.25% which the family has decided not to attack).

**Risk class:** CRITICAL. This is the calc behind the family's whole-portfolio debt-free timeline.

**Verification status:** UNVERIFIED. FLAG-1.

### FLAG-1 — Monthly vs daily compounding

Credit cards (Discover 18%, Chase 22%, Avant 30%, Credit One 27%, UIECU 22.3%) accrue interest **daily** in real life. The simple monthly-periodic model here understates interest paid over a multi-year payoff by approximately 0.5-1.5% depending on APR. On the UIECU $13,102 at 22.3% this is ~$60-120/year. Not catastrophic, but the "Total interest paid" figure is biased low. Recommendation: switch to daily periodic accrual for credit-card-class debts (rate > 10%) and keep monthly for mortgages. Pass 2 will write a test that proves the bias direction.

---

## C2 — `projectDebtSnowball` (Debts tab strategy)

**Location:** `app/src/poe-financial-mvp-v28.jsx:651-723`

**What it computes:** Like C1 but with a user-selectable sort order — snowball (smallest balance first), avalanche (highest rate first), or hybrid (sub-$1500 first, then avalanche). Also tracks the cascade of freed cashflow as each debt clears.

**Inputs:**
- `debts[]`
- `monthlyExtra` — extra-principal pool
- `sortOrder` — `'snowball'` | `'avalanche'` | `'hybrid'`
- `currentDate`, `maxMonths = 360` (30 years)

**Formula (per month):**
1. Accrue interest: same as C1.
2. Apply minimum payment to each debt. When a debt's balance hits ≤ $0.01, mark it cleared at month `m`, and **add its `minPayment` to the `freedFromSnowball` pool**.
3. Pour `monthlyExtra + freedFromSnowball` at the queue's top item per `sortOrder`. Repeat until pool is exhausted or 100 iterations.

**Surface:** Debts subtab inside Books (after the 2026-05-24 move). Months-to-debt-free figure; total interest paid; freed monthly cashflow at the end.

**Assumptions:**
- Same as C1 on interest model. Same FLAG-1.
- **Hybrid threshold $1500 is hardcoded** (line 660-664). No user control. Arbitrary cutoff; the psychological "quick win" idea has research support but the exact dollar threshold is a judgment call.
- The freed-cashflow cascade assumes the user **actually redirects** the minimum payment from a paid-off debt into the next target. In practice this requires discipline. The math gives "best case if you stay the course"; UI should disclose this.
- `safety < 100` bound on the extra-pour loop. With many small debts being cleared in one month by a large pool, could theoretically exit early. Practically rare.

**Risk class:** CRITICAL. Directly determines which debt to attack first.

**Verification status:** UNVERIFIED. FLAG-1, FLAG-2.

### FLAG-2 — Cascade assumes user discipline

When a debt clears, its `minPayment` joins the extra-pool. This is mathematically correct **only if the user redirects that freed payment**. If they absorb it back into general spending, real-world payoff takes longer than the projection shows. Recommendation: add a UI disclosure on the Debts tab saying "this projection assumes you redirect each cleared debt's minimum into the next target." Same applies to C4 (rental snowball).

---

## C3 — `projectDebtMinimumOnly` (interest-saved baseline)

**Location:** `app/src/poe-financial-mvp-v28.jsx:726-752`

**What it computes:** Baseline scenario — what happens if the user pays only minimums on every debt, no extra, forever. Used to compute the **"interest saved"** comparison shown next to the snowball projection.

**Inputs:** `debts[]`, `currentDate`, `maxMonths = 600` (50 years; some debts never pay off at minimum-only).

**Formula (per month, per debt):**
1. If not stuck: accrue interest, then apply min payment.
2. **Stuck detection:** if `pay ≤ interest × 1.01` AND `currentBalance > originalBalance × 0.99`, mark debt as stuck (will never pay off at this rate). Stuck debts skip subsequent months.
3. Return total interest paid, longest payoff in months, list of stuck debts.

**Surface:** "You'd pay $X more in interest if you only paid minimums" line on the Debts subtab.

**Assumptions:**
- Same FLAG-1 on interest model.
- **Stuck detector is conservative:** requires balance to still be > 99% of original. A debt that briefly dipped to 95% of original then plateaus would NOT be flagged stuck. FLAG-3.
- 50-year cap is plenty for most consumer debt but theoretically truncates pathological cases.

**Risk class:** HIGH. The "interest saved" number is one of the most motivational figures in the UI; if it's wrong it misleads the family on the value of the snowball discipline.

**Verification status:** UNVERIFIED. FLAG-1, FLAG-3.

### FLAG-3 — Stuck detector misses partial-progress plateaus

The `currentBalance > originalBalance × 0.99` condition means a debt that paid down 2-3% then plateaus at that level won't be flagged stuck. Edge case in practice (most stuck debts plateau within months, with no real progress made). Worth verifying against real numbers in Pass 3.

---

## C4 — `projectRentalSnowball` (Real Estate tab strategy)

**Location:** `app/src/poe-financial-mvp-v28.jsx:755-769`

**What it computes:** Snowball-style payoff projection across the 11-door rental portfolio. User picks a sort order: smallest-balance, highest-rate, or best-cashflow. Cascade math redirects each cleared mortgage's P+I (not escrow) into the next target.

**Inputs:**
- `rentals[]` — each with `rent`, `mortgage.balance`, `mortgage.rate`, `mortgage.monthlyPI`, `mortgage.escrow`
- `monthlyExtra` — extra-principal pool
- `sortOrder` — `'smallest-balance'` | `'highest-rate'` | `'best-cashflow'`
- `currentDate`, `maxMonths = 240`

**Formula (per month):**
1. Accrue interest on each rental's mortgage: `balance × (rate / 100 / 12)`.
2. Apply each rental's `monthlyPI` to its own balance.
3. Pour `monthlyExtra + freedFromSnowball` at the queue's top per sort order.
4. When a mortgage clears, its `monthlyPI` joins `freedFromSnowball`.

**Surface:** Real Estate (rentals) tab snowball projection; "All clear by [date]" headline; "Freed monthly cashflow at end" figure; cascade visualization.

**Assumptions:**
- Mortgage interest is monthly periodic, which **is correct for most US mortgages** (FLAG-1 does not apply here).
- Escrow stays constant; user keeps paying it after mortgage is cleared if property tax + insurance is still owed (correct — escrow doesn't reduce principal, and tax + insurance survive the mortgage payoff).
- `best-cashflow` sort uses `rent - monthlyPI - escrow` as the cashflow proxy. Does NOT subtract maintenance reserve, vacancy reserve, capex reserve, or property management. The real free-cashflow figure is lower; this sort is a rough heuristic, not a true ranking.
- Same FLAG-2 (cascade requires discipline).

**Risk class:** CRITICAL. Drives the 7-year-to-portfolio-free target.

**Verification status:** UNVERIFIED. FLAG-2, FLAG-4.

### FLAG-4 — `best-cashflow` sort ignores reserves

`rent - monthlyPI - escrow` overstates real free cashflow because it ignores maintenance, vacancy, capex, and PM. A rental that looks like the "best cashflow" target may actually be worse once reserves are accounted for. Pass 2 test: prove the ordering changes for the Poe Properties 11 doors when reserves are included. Pass 3 (xlsx reconciliation) is the right place to ground-truth the actual cashflow per door.

---

## C5 — `findExtraForTarget` (7-year-target backsolve)

**Location:** `app/src/poe-financial-mvp-v28.jsx:771-775`

**What it computes:** Binary search for the monthly extra needed to clear the rental portfolio in `targetYears`. Always uses smallest-balance snowball.

**Inputs:** `rentals[]`, `targetYears`, `currentDate`.

**Formula:** Binary search over [0, 50000] with 30 iterations, stopping when range < $50. For each candidate extra, simulates the full snowball and checks if it clears within target.

**Surface:** "To clear in 7 years you'd need $X/month extra" callout on the Real Estate tab.

**Assumptions:**
- Hardcoded upper bound $50,000/month — reasonable for any realistic case.
- Hardcoded smallest-balance sort — the user may have selected highest-rate or best-cashflow in the snowball widget; this backsolve ignores that choice. UI should make it clear the backsolve is snowball-only, OR re-run per user sort.

**Risk class:** HIGH. Misleading if the user is planning around a different sort order.

**Verification status:** UNVERIFIED. FLAG-5.

### FLAG-5 — Backsolve uses snowball regardless of user's selected sort

Inconsistent with the snowball widget if the user has picked highest-rate or best-cashflow. Two paths to fix: (a) thread the user's sort order into the backsolve, or (b) label the figure as "smallest-balance scenario" in the UI.

---

## C6 — `totals` aggregator

**Location:** `app/src/poe-financial-mvp-v28.jsx:1156-1181`.

**What it computes:** The whole-portfolio rollup the Big Picture dashboard depends on. Inflows (salaries + rentals), outflows (sum of `data.outflows`), net cash flow, total consumer debt, total rental mortgage debt, personal real-estate debt, opportunity totals, and "cash on hand."

**Inputs:**
- `data.inflows.salaries[]` — each with `actual`
- `data.inflows.rentals[]` — each with `rent`, `actual`, `mortgage.balance`, `mortgage.monthlyPI`
- `data.outflows` — a flat object of numeric values
- `data.debts[]` — each with `balance`, `leaveAlone` flag
- `data.opportunities[]` — each with `monthly`, `hours`
- `data.accounts[]` — each with `type`, `balance`

**Formula (key derivations):**
- `salaryActual = Σ salaries.actual`
- `rentalActual = Σ rentals.filter(rent > 0).actual` (only income-producing properties)
- `rentalExpected = Σ rentals.filter(rent > 0).rent`
- `rentGap = rentalExpected − rentalActual`
- `collectionRate = (rentalActual / rentalExpected) × 100`
- `totalInflow = salaryActual + rentalActual`
- `totalOutflow = Σ data.outflows.values()` ⚠ FLAG-6
- `netCashFlow = totalInflow − totalOutflow`
- `totalConsumerDebt = Σ debts.filter(!leaveAlone).balance`
- `totalRentalDebt = Σ rentals.filter(rent > 0).mortgage.balance`
- `totalRentalPI = Σ rentals.filter(rent > 0).mortgage.monthlyPI`
- `totalPersonalRealEstateDebt = Σ rentals.filter(rent === 0).mortgage.balance`
- `allAccountsCash = Σ accounts.filter(type ∈ {checking, savings, cash, investment}).balance` ⚠ FLAG-7

**Surface:** Every total/headline figure on the Big Picture dashboard, Books, Real Estate, and pressure slider. This is the **most-trafficked aggregator** in the app.

**Assumptions:**
- `data.outflows` is a flat numeric object — see FLAG-6.
- "Investment" accounts count as cash — see FLAG-7.
- `rent > 0` is the discriminator between rentals and personal real estate. Edge case: a rental that's currently between tenants with `rent === 0` would silently be reclassified as personal. Worth flagging in the rental UI.
- `actual` vs `rent` — `actual` is what was collected; `rent` is what was contracted. This is the right model.

**Risk class:** CRITICAL. Every downstream calc depends on these totals.

**Verification status:** UNVERIFIED. FLAG-6, FLAG-7.

### FLAG-6 — `totalOutflow` blindly sums `data.outflows`

`Object.values(data.outflows).reduce((s, x) => s + x, 0)` adds whatever values are present. If `data.outflows` ever contains a nested object, a string, or a NaN, the total silently breaks (or produces NaN that propagates everywhere). The data model should be validated, and ideally the outflows should be a typed structure (recurring obligations, taxes, debt servicing, discretionary) so we can answer "what is this $X made of?" — not just "trust this opaque sum."

### FLAG-7 — "Investment" accounts treated as cash

`CASH_TYPES = ['checking','savings','cash','investment']`. Treating investment accounts as fungible cash is questionable: a 401(k) is not spendable cash (early-withdrawal penalty + tax), a taxable brokerage has tax implications on sale, and a real-estate equity line is debt-not-cash. The Debt Snowball baseline uses this `allAccountsCash` to anchor "what can I throw at debt right now" — if it includes a 401(k), the slider lies. Recommendation: split into `liquidCash` (checking + savings + cash) and `investableEquity` (investment), and use only `liquidCash` for the debt-snowball anchor.

---

---

## C7 — `pressureCalc` (pressure slider → extra-available)

**Location:** `app/src/poe-financial-mvp-v28.jsx:1189-1195`.

**What it computes:** Translates the 0-10 "debt pressure" slider into a dollar figure — how much extra cash per month the family is committing to debt reduction. This figure feeds C1 (`projectDebt`) as `monthlyExtraAvailable`.

**Inputs:**
- `pressure` — integer 0-10, from the slider
- `data.pressureMappings[pressure]` — a per-level config: `{ rentGapClosure, discretionaryCut }` (each a percentage 0-100)
- `totals.rentGap` (from C6)
- `totals.netCashFlow` (from C6)
- `reserves.totalMonthly` (from C8)

**Formula:**
- `rentCapture = (mapping.rentGapClosure / 100) × totals.rentGap`
- `discretionaryGain = (mapping.discretionaryCut / 100) × 2000` ⚠ FLAG-8
- `grossAvailable = totals.netCashFlow + rentCapture + discretionaryGain`
- `reservesDeducted = reserves.totalMonthly`
- `extraAvailable = max(0, grossAvailable − reservesDeducted)`

**Surface:** Pressure slider section on Big Picture dashboard. The `extraAvailable` figure becomes the "extra monthly payment toward debt" used in the C1 projection — so it directly drives the **debt-free-in-N-years** headline.

**Assumptions:**
- Discretionary spending is **assumed to be $2,000/month**. Hardcoded magic number. See FLAG-8.
- "Rent capture" assumes the family can actually collect a percentage of the rent gap on demand — e.g., by enforcing collections, evicting non-payers, raising rent. This is a behavioral / operational assumption, not a math one. Reasonable for a high-pressure scenario; misleading for a low-pressure one.
- Reserves are always subtracted from gross available before extra is computed. Reasonable conservative default.
- `pressureMappings` is sourced from `data.pressureMappings` — Pass 1 has not yet read the actual mapping data to verify the percentages are calibrated correctly.

**Risk class:** CRITICAL. Drives the headline debt-free timeline.

**Verification status:** UNVERIFIED. FLAG-8.

### FLAG-8 — Discretionary spending hardcoded at $2,000/month

`(map.discretionaryCut / 100) * 2000` assumes the family has exactly $2k/month of discretionary spending the slider can target. In reality this number is family-specific. For the Poes — given the financial baseline (Inflow $25,980 / Outflow $23,264) — $2k discretionary is probably reasonable, but for a tier 1 user with $4k/month income, $2k is implausibly high. For a higher-income family it's implausibly low.

Recommendation: replace the hardcoded $2000 with `data.meta.discretionaryMonthly` (user-editable; defaulted from a percentage of inflows). Surface the assumption clearly in the slider tooltip.

---

---

## C8 — `reserves` (monthly reserve obligations)

**Location:** `app/src/poe-financial-mvp-v28.jsx:1183-1187`.

**What it computes:** Total monthly dollar amount that must be set aside for non-monthly recurring obligations, scheduled tax payments, and current incidents (one-off financial events). Used by C7 to deduct from gross-available before extra-toward-debt is computed.

**Inputs:**
- `data.recurringObligations[]` — each with `enabled`, `frequency`, `amount` (frequencies: monthly, quarterly, semi-annual, annual, etc.)
- `data.taxCalendar[]` — each with `applies`, `amount` (annual dollars)
- `data.incidents[]` — each with `amount` (dollars)

**Formula:**
- `recurringMonthly = Σ (non-monthly recurring).amount × frequencyToMonthly(amount, frequency)` ⚠ FLAG-9
- `taxItemsAnnual = Σ taxCalendar.filter(applies).amount`
- `taxMonthly = taxItemsAnnual / 12` (straight-line)
- `incidentMonthly = Σ incidents.amount` ⚠ FLAG-10
- `totalMonthly = recurringMonthly + taxMonthly + incidentMonthly`

**Surface:** Pressure-slider deductible. Indirectly visible on the Big Picture dashboard as part of the "reserved" calculation. The user may or may not see `totalMonthly` directly — needs UI audit.

**Assumptions:**
- Non-monthly recurring obligations get amortized into a monthly equivalent via `frequencyToMonthly`. Standard practice for budgeting.
- Taxes are amortized straight-line over 12 months. **Real tax obligations are lumpy** — quarterly estimated taxes hit in Apr/Jun/Sep/Jan, annual taxes hit once. Straight-line is a fine budget abstraction but misrepresents what's actually due in a given month. FLAG-9.
- **`incidents` are summed as if every incident's full amount is a recurring monthly obligation.** This is the wrong model for one-off incidents (a leaky roof repair is a one-time event, not $X every month forever). FLAG-10.

**Risk class:** HIGH. Wrong reserves figure distorts pressure-slider extra-available, which distorts the debt-free timeline.

**Verification status:** UNVERIFIED. FLAG-9, FLAG-10.

### FLAG-9 — Tax obligations straight-lined when they're actually lumpy

`taxMonthly = taxItemsAnnual / 12` is a fine "set aside this much each month for taxes" budgeting line. But the family's actual cash needs are lumpy: $X due in April, $Y due in June, etc. The pressure slider may over-allocate to debt in months where the actual tax payment is upcoming and under-allocate in months where there's no near-term tax obligation. Recommendation: surface both the straight-line monthly accrual AND the next 90 days' actual tax cash needs.

### FLAG-10 — Incidents treated as recurring monthly cost

`data.incidents.reduce((s, i) => s + i.amount, 0)` treats every incident as a perpetual monthly drain. If a $5,000 incident is logged, it's now subtracted from extra-available **every month forever**. This is almost certainly wrong. Incidents should either: (a) be one-time deductions from cash on hand, (b) be amortized over a defined repayment horizon (e.g., $5k spread over 6 months = $833/mo for 6 months only), or (c) be a separate "pending incidents reserve" line rather than a recurring deduction. This is a real bug that's likely understating extra-available — and therefore understating the family's actual ability to attack debt.

---

---

## C9 — Buffer percentage and gap

**Locations:** `app/src/poe-financial-mvp-v28.jsx:2399-2401` and `:3724-3725`.

**What it computes:**
- `bufferPct = min(100, round(bufferCurrent / bufferTarget × 100))`
- `bufferGap = max(0, bufferTarget - bufferCurrent)`

**Risk class:** LOW (cosmetic progress indicator). Math is correct and degenerate-input-safe (`bufferTarget > 0` guard).

**Verification status:** VERIFIED-BY-INSPECTION.

---

## C10 — `frequencyToMonthly` converter

**Location:** `app/src/poe-financial-mvp-v28.jsx:523`.

**What it computes:** Converts a recurring amount + frequency (monthly, quarterly, semi-annual, annual, biennial) into a monthly equivalent. Used by C8 to amortize non-monthly recurring obligations.

**Formula:**
- `monthly → amount`
- `quarterly → amount / 3`
- `semi-annual → amount / 6`
- `annual → amount / 12`
- `biennial → amount / 24`
- default → 0

**Risk class:** LOW. Simple division.

**Verification status:** VERIFIED-BY-INSPECTION. Math is correct.

---

## C11 — Practice pipeline revenue projection

**Location:** `app/src/components/Practice.jsx:243-268`.

**What it computes:** Three revenue projections in the Practice tab — "Active pipeline" (expected annual revenue from current new + in-progress leads, weighted by conversion rate), "Converted clients" (annual recurring from already-converted leads), and "If all active convert" (upside if every active lead converts).

**Formula:**
- `activePipelineAnnual = (newCount + inProgress) × (conversionRate || 50) / 100 × 150 × 12` ⚠ FLAG-11
- `convertedAnnual = converted × 150 × 12` ⚠ FLAG-11
- `upsideAnnual = (newCount + inProgress) × 150 × 12` ⚠ FLAG-11

**Stated assumption (in UI):** "~$150/session avg blended (insurance + self-pay), 1 session/week, 48 weeks/year (~$7.2K/client/yr)."

**Risk class:** HIGH. The Practice tab is Christina's pipeline view — wrong revenue projection misleads her sense of TLC Therapy Solutions' trajectory.

**Verification status:** UNVERIFIED. FLAG-11.

### FLAG-11 — Practice math contradicts its own stated assumption

The UI disclosure says ~$7,200/client/year (1 session/week × 48 weeks × $150 = $7,200). The actual formula computes `client_count × 150 × 12 = $1,800/client/year`. That's **4× lower than the stated assumption**. Either:
- (a) The formula is wrong and should be `× 150 × 48` (or equivalently `× 600 × 12` if $600 is the assumed monthly), in which case every "expected annual" figure in the Practice tab is understated by 4×.
- (b) The formula is right and the stated assumption is wrong — actual blended-per-month is $150, not the implied $600.

Most likely (a) — the disclosure text is what a clinician would expect, and the math was probably originally `× 150 × 4 × 12` with the weeks-per-month factor accidentally dropped. **Christina is the right person to confirm which is correct.** If (a): Practice revenue projections are understated by 4× across the board.

Additional sub-flag: `(conversionRate || 50)` defaults conversion rate to 50% if there's no data. Reasonable starting heuristic but the user should be told.

---

## C12 — Cart subscription totals (subscription bleed audit)

**Location:** `app/src/components/Cart.jsx:59-63`.

**What it computes:** Total monthly spend on active subscriptions, separately for `keep`, `review`, `cancel` status; total annual spend.

**Formula:**
- `totalMonthly = Σ subscriptions.filter(status === active).monthly`
- `reviewTotal = Σ subscriptions.filter(status === 'review').monthly`
- `cancelTotal = Σ subscriptions.filter(status === 'cancel').monthly`
- `annualSpend = totalMonthly × 12`

**Risk class:** MEDIUM. Misrepresenting subscription bleed could lead to wrong cancel decisions.

**Verification status:** VERIFIED-BY-INSPECTION. Math is straightforward; sums what's marked active. Assumes the user has classified each subscription correctly. Doesn't account for **annual** billing cycles — if a subscription is billed annually but stored as monthly equivalent, the math works; if stored at the annual amount with `billingCycle: 'annual'`, the math overcounts. Worth verifying. Minor flag FLAG-12.

### FLAG-12 — Cart total assumes `monthly` field is the monthly equivalent

The `subscriptions[].monthly` field is summed directly. If a user adds an annual subscription as `monthly: 600` (the annual cost) instead of `monthly: 50` (the monthly equivalent), the total is overstated by 12×. The form has a `billingCycle` field but the totaling code ignores it. Recommendation: enforce that `monthly` is always the monthly equivalent (and have the form do the division), OR sum using `frequencyToMonthly(subscription.monthly, subscription.billingCycle)` for correctness.

---

## C13 — 1099 contractor / inquiry storage

**Location:** `app/src/components/Contractors1099.jsx`.

**What it computes:** Stores per-contractor `ytdPaid`, `ytdReceived`, `monthlyExpected`. Renders these as informational figures.

**Formula:** No derived calculations beyond display formatting. Tax math (estimated quarterly payments, effective rate, withholding shortfall) is **not currently implemented** in this component.

**Risk class:** N/A for current scope — no derived math means no derivation risk.

**Verification status:** VERIFIED-BY-INSPECTION (no calc to verify).

**Gap noted:** A proper 1099 module would compute estimated quarterly taxes (federal + state, self-employment tax at 15.3%, deductions for half-SE-tax, retirement contributions, etc.). The current MVP is a tracking surface only. **Adding tax math here is a Pass 4 surface or a separate feature workstream.**

---

## C14 — Big Picture dashboard projections

**Location:** `app/src/poe-financial-mvp-v28.jsx:2210+` (BigPictureDashboard component, ~1,500 lines).

**Status:** ⏳ NOT YET INVENTORIED IN PASS 1. This component renders the Action Queue, the upcoming-events math, the rental-flag math, and many of the projection outputs computed upstream. Most of the consequential math is in upstream functions (C1-C9), but the BigPictureDashboard contains its own inline derivations for queue priority, runway labels, and the "next 90 days cashflow" outlook. Will inventory in a follow-up session as part of Pass 1 completion.

**Risk class (pre-inventory estimate):** MEDIUM-HIGH for any inline math; LOW for purely display formatting.

---

## Pass 1 status

**Documented:** C1-C13 (13 calc engines / surfaces), 12 flags identified.

**Not yet documented:** C14 (BigPicture dashboard inline math). Most consequential math is already covered by C1-C9.

**Critical findings to triage:**
- **FLAG-10** — Incidents treated as perpetual monthly drain (biases debt-free timeline pessimistic by full incident total)
- **FLAG-11** — Practice pipeline math contradicts its stated assumption (4× understatement of expected annual)
- **FLAG-7** — Investment accounts in "cash" total (misleads debt-snowball baseline)
- **FLAG-1** — Monthly vs daily compounding on credit cards (1-2% interest understatement)
- **FLAG-6** — `totalOutflow` no type guards (silent breakage risk)

Pass 1 is **substantively complete** for prioritization purposes. Pass 2 (unit tests) can begin with the critical findings above.

---

## Summary of FLAGS so far

| # | Severity | Calc | Concern |
|---|---|---|---|
| FLAG-1 | High | C1, C2, C3 | Monthly compounding on credit cards; should be daily |
| FLAG-2 | Medium | C2, C4 | Cascade assumes user redirects freed payments — UI should disclose |
| FLAG-3 | Low | C3 | Stuck detector misses partial-progress plateaus |
| FLAG-4 | High | C4 | `best-cashflow` sort ignores reserves, overstates real cashflow |
| FLAG-5 | Medium | C5 | Backsolve hardcoded to snowball regardless of user sort |
| FLAG-6 | High | C6 | `totalOutflow` blindly sums `data.outflows`; no type guards |
| FLAG-7 | High | C6 | Investment accounts treated as cash; misleads debt-snowball baseline |
| FLAG-8 | High | C7 | Discretionary spending hardcoded at $2,000/month; non-family-specific |
| FLAG-9 | Medium | C8 | Tax obligations straight-lined when actually lumpy |
| **FLAG-10** | **CRITICAL** | **C8** | **Incidents treated as perpetual monthly drain — likely real bug; understates attack capacity** |
| **FLAG-11** | **CRITICAL** | **C11** | **Practice math contradicts its own disclosure — 4× understatement of expected annual revenue** |
| FLAG-12 | Medium | C12 | Cart sums `subscriptions[].monthly` directly, ignoring `billingCycle` — annual subs entered at annual cost would overcount 12× |

Pass 2 (unit tests) will quantify each flag's impact on Darrell's actual numbers. Pass 3 (xlsx reconciliation) will surface any flags this pass missed.

## Findings call-out — FLAG-10 may warrant an immediate fix before launch

The incidents-as-perpetual-monthly bug is in C8 (`reserves`). It flows into C7 (`pressureCalc`), which feeds C1 (`projectDebt`). The chain is: every logged incident silently and permanently reduces the pressure-slider's `extraAvailable` figure → which feeds into the debt-free projection → which means the headline "Debt-free in N years" number is biased pessimistic by exactly the incidents log total per month.

For the June 1 family + church launch, this means anyone using the Debts module with an incident logged is being shown a debt-free date later than the math should produce. Before-launch fix candidates:
- (a) Change incidents to one-time deductions from cash on hand (single-month impact).
- (b) Amortize each incident over a user-specified repayment horizon (`incident.repayMonths`).
- (c) Move incidents out of `reserves` entirely and into a separate "pending obligations" line that's surfaced as a cash impact, not a monthly drain.

Recommend (a) for minimum-change-to-ship-safely, with (b) as a follow-up enhancement post-vacation.
