# Holly Hill Equity-Out Evaluation — Framework (Pre-Data)

**Triggered by Darrell + Christina, 2026-06-01:** Two comparable homes near the Holly Hill rentals just sold for **$170K and $175K**. They're evaluating whether to pull equity out of the rental portfolio to cancel/consolidate consumer debt. Christina is gathering the data review (screenshots inbound).

**Status:** Scaffolding only. The math runs when the screenshots arrive. TBDs are explicit; nothing fabricated.

---

## 1. The opportunity

Two recent comps in the same Champaign-Urbana neighborhood as the Poe Properties Holly Hill doors sold at $170K and $175K. That's a real signal. If the rental portfolio's current market value is meaningfully above what it was last appraised at, there's equity sitting in the doors that could be redeployed — most usefully against the high-APR consumer debt stack that's costing the family real money every month.

The question is not "can we pull equity?" — the cash-out math almost always *works* on paper for landlords with appreciated portfolios. The question is **whether doing it lifts the family toward freedom or extends bondage in a new shape**. Real comps × real mortgage balances × real consolidation targets × biblical-economics test. That's this document.

The family already has the analytical engine for this question wired into the app: the **Real Estate tab** in the Family OS has a market valuation block that computes estimated equity per property (market value − mortgage balance), and a **rental snowball** that projects portfolio payoff timelines under different sort orders. We don't have to build the math; we have to feed it real inputs.

---

## 2. What we need from Christina's screenshots — checklist

Mark each item as we get it.

### Per-property (for every door in Poe Properties)

- [ ] Property address (full, with unit if applicable)
- [ ] Current mortgage balance
- [ ] Mortgage interest rate (APR)
- [ ] Mortgage term remaining (months)
- [ ] Monthly P+I (principal + interest)
- [ ] Monthly escrow (taxes + insurance)
- [ ] Monthly PITI (P+I + escrow)
- [ ] Current monthly rent (lease amount)
- [ ] Current monthly rent **collected** (actual, in case of partial or late)
- [ ] Occupancy / vacancy status
- [ ] Last appraised value (date + amount)
- [ ] Tax-assessed value (current year, from county assessor)
- [ ] Any second liens, HELOCs, or judgments on the property
- [ ] Any recent or deferred capex (roof, HVAC, foundation, water heater)

### Portfolio-level

- [ ] Total number of doors at Poe Properties (Christina onboarding doc says **11 doors** as of 2026-05-25 — confirm)
- [ ] Any cross-collateralized loans (one note secured by more than one property)
- [ ] Current LLC / title structure (single LLC, multiple LLCs, personal title)
- [ ] Insurance carrier + per-property premium

### The comps Christina found

- [ ] Comp 1 address, sale price ($170K reported), sale date, sqft, beds/baths, condition
- [ ] Comp 2 address, sale price ($175K reported), sale date, sqft, beds/baths, condition
- [ ] How comparable are these to OUR Holly Hill doors (sqft delta, bed/bath match, condition delta)?
- [ ] Any other recent comps within 0.5 mi in last 6 months

### Refinance / cash-out terms we'd be quoted

- [ ] Investment-property cash-out rate range from a real lender (2026-06 environment — likely 7-9% for non-owner-occupied)
- [ ] Lender's max LTV for investment property cash-out (typically 70-75%)
- [ ] Estimated closing costs (typically 2-5% of new loan)
- [ ] Loan term offered (15 vs 20 vs 30)

### Consolidation targets — what we'd pay off

Pulled from `app/src/poe-financial-mvp-v28.jsx:182-209` (seed data — Christina to confirm which are current). Listed APR-descending, attackable only (excluding `leaveAlone`):

| Creditor | Balance (seed) | APR | Min payment | Confirm? |
|---|---:|---:|---:|---|
| UMB | $1,563 | 34.99% | $100 | [ ] |
| Avant | $967 | 30.0% | $30 | [ ] |
| Credit One | $558 | 27.0% | $60 | [ ] |
| Synchrony | $956 | 27.0% | $34 | [ ] |
| 1st Mid CC Biz | $7,308 | 25.49% | $224 | [ ] |
| AMEX (small) | $1,608 | 24.74% | $86 | [ ] |
| **UIECU** (ATTACK FIRST flag) | **$13,102** | **22.3%** | **$300** | [ ] |
| Chase | $9,948 | 22.0% | $285 | [ ] |
| Citi | $600 | 22.0% | $34 | [ ] |
| Discover | $8,961 | 18.0% | $215 | [ ] |
| US Bank Biz | $2,000 | 18.0% | $86 | [ ] |
| Busey | $1,920 | 18.0% | $85 | [ ] |
| Upgrade | $18,000 | 14.0% | $644 | [ ] |
| Figure | $52,000 | 11.0% | $748 | [ ] |
| Light Stream (ends 9/2028) | $18,491 | 10.0% | $603 | [ ] |
| AMEX (B) | $3,548 | 9.99% | $124 | [ ] |
| AMEX | $558 | 9.99% | $24 | [ ] |
| Empower | $5,000 | 8.0% | $169 | [ ] |
| **TOTAL ATTACKABLE (≥ 8% APR)** | **~$146,088** | — | **~$3,869/mo mins** | — |

Notes from current seed:

- **Leave alone (low-rate, long-term):** Good Leap solar $102K @ 2.0% (ends 2047), SBA Loan $9K @ 1.0% (ends 2050). Per `d20` / `d21` `leaveAlone: true` flag. Do NOT consolidate these — replacing 2% money with 7-9% money is the wrong direction.
- **0% promo balances:** Aunt Leah $3K, Affirm $1,056, AMEX DP $18,813 (0% × 36mo), COT CC Biz $9K, Divvy CC Biz $6K. Don't refinance these unless the promo is about to expire — they're currently free money.
- **Auto loan:** Car at 7.25% / $40,544. Marginally below a likely cash-out rate; don't include unless the refi rate beats 7.25% net of closing-cost amortization. The family has already decided to leave it alone (per CALC-INVENTORY C1 FLAG-1 note).

---

## 3. The evaluation framework — math we'll run when data lands

### 3.1 Equity available per property

For each rental:

```
estimated_market_value = comp-anchored value (use $170K-175K range or
                         a per-property adjustment if condition or sqft differs)
gross_equity            = market_value − current_mortgage_balance
LTV_cap                 = 0.75  (75%, standard investment-property cash-out cap;
                                 lender may offer 70% or 80% — confirm)
max_new_loan            = market_value × LTV_cap
cash_out_available      = max_new_loan − current_mortgage_balance
                          (floor at 0 — properties already above LTV produce no cash-out)
```

**Seed-data illustration (replace with real numbers when received):**

| Property | Seed balance | Comp-anchored value | Gross equity | Max new loan (75%) | Cash-out available |
|---|---:|---:|---:|---:|---:|
| r1 1508 Williamsburg | $88,000 | $170K (assumed) | $82,000 | $127,500 | **$39,500** |
| r2 1513 Holly Hill | $88,000 | $172K (mid) | $84,000 | $129,000 | **$41,000** |
| r3 1508 Holly Hill | $110,000 | $175K (higher) | $65,000 | $131,250 | **$21,250** |
| r4 805 Apt 1 | $70,000 | TBD | TBD | TBD | TBD |
| r5 805 Apt 2 | $70,000 | TBD | TBD | TBD | TBD |
| (6 more doors per onboarding) | TBD | TBD | TBD | TBD | TBD |
| **Portfolio total (seed, 5 doors illustrative)** | **$426,000** | — | — | — | **~$101,750+** |

The illustrative cash-out across just the three Holly Hill / Williamsburg comps is ~$102K — already enough on paper to wipe **the entire ≥ 22% APR consumer stack ($34,800 across UMB / Avant / Credit One / Synchrony / 1st Mid / AMEX small / UIECU / Chase / Citi)** AND clear Discover, US Bank Biz, Busey, and Upgrade.

But that's *gross* cash-out before closing costs and before the math of "did the new payment go up by more than the old debt service went down."

### 3.2 Net monthly cash-flow change

For each property being refinanced:

```
old_PI                  = current monthly P+I on that mortgage
new_loan_amount         = current_balance + cash_out_amount
new_PI                  = amortize(new_loan_amount, new_rate, new_term_months)
delta_PI                = new_PI − old_PI    (positive = payment increased)

old_debt_service_freed  = sum of min payments on debts being paid off
net_monthly_change      = old_debt_service_freed − delta_PI
                          (positive = freed cash flow / negative = the move costs more
                           per month than it cancels)
```

**Sensitivity to refi rate:** the difference between a 7% and an 8.5% investment-property cash-out rate on a $100K incremental balance over 20 years is ~$85/mo. Material. Lock the actual quoted rate before deciding.

### 3.3 Break-even on closing costs

```
total_closing_costs     = sum across all refis  (2-5% of new loan amounts)
months_to_break_even    = total_closing_costs / monthly_net_cash_flow_improvement
```

If break-even is < 24 months AND the family plans to hold the properties >= 5 years, the math passes. If break-even is > 60 months, the closing costs are eating most of the win.

### 3.4 Rental snowball impact (already wired in the app)

The Real Estate tab runs `projectRentalSnowball` (`app/src/poe-financial-mvp-v28.jsx:755-769`, documented in `docs/05-financial-os/CALC-INVENTORY.md` §C4). Today it projects payoff under three sort orders (smallest-balance / highest-rate / best-cashflow) given current balances + an extra-principal pool.

After cash-out, the rental balances go UP (we're trading consumer debt for mortgage debt secured by the rentals). The freed monthly cash flow from canceled consumer debt becomes the new `monthlyExtra` for the rental snowball. The seven-year-portfolio-free target (C5 `findExtraForTarget`) re-runs against the new balances + new extra.

**Critical comparison to make:** does the rental portfolio still clear in 7 years under the new structure, or does cash-out push the payoff date out? The seven-year cycle is not arbitrary; it's anchored in Deuteronomy 15 (see §4 below). Pushing portfolio-free *past* the seven-year horizon is a real cost the math must surface.

### 3.5 Sensitivity table — the cases we run

Run the full math under five scenarios:

| Scenario | Comp value | Refi APR | Vacancy | What it tests |
|---|---|---|---|---|
| Base | $170K avg | 7.5% | current | Most-likely case |
| Comp soft | **$153K** (−10%) | 7.5% | current | Comp regression |
| Rate jump | $170K | **8.5%** (+1%) | current | Rate environment shift |
| Tenant gap | $170K | 7.5% | **one door 60 days unpaid** | Income shock |
| Combined stress | $153K | 8.5% | one door 60 days unpaid | All three at once |

If the move still produces positive net cash flow AND the rental snowball still clears within 7-8 years in the **combined-stress** scenario, the decision is robust. If it only works in the base case, the family is leveraging into a thin margin of safety.

---

## 4. The biblical-economics check

The math can be perfect and the move can still be wrong. This is the test that sits *senior* to the math.

### 4.1 What Scripture says about debt structurally

> **ESV — Proverbs 22:7:** *"The rich rules over the poor, and the borrower is the slave of the lender."*

Debt is *structurally* a bondage relationship. Not metaphorically. The Hebrew word for "slave" here (עֶבֶד / *eved*) is the same word used of indentured servants in Leviticus 25. Borrowing voluntarily places the family under the lender's authority for the term of the loan — and that authority is real (rate changes, call provisions, foreclosure rights on investment property are not friendly).

> **ESV — Romans 13:8:** *"Owe no one anything, except to love each other, for the one who loves another has fulfilled the law."*

Paul's standing direction is debt-free as the normal Christian posture. The verse doesn't forbid borrowing in every case (the apostles assumed commerce continued), but it sets the gravitational pull of the Christian life *away from* leverage and *toward* freedom from creditors.

### 4.2 The seven-year cycle — the timing question

> **ESV — Deuteronomy 15:1-2:** *"At the end of every seven years you shall grant a release. And this is the manner of the release: every creditor shall release what he has lent to his neighbor. He shall not exact it of his neighbor, his brother, because the LORD's release has been proclaimed."*

Yahweh's economy never had perpetual debt. It built a seven-year ceiling into the structure. Debt that wasn't paid in seven years was *cancelled*, not refinanced. The pattern teaches: borrow only what can be paid in seven years; structure life so the ceiling is plausible.

The family's existing seven-year rental-portfolio-free target (per CALC-INVENTORY C5 and Christina-onboarding hero metrics) is downstream of this pattern, whether named that way or not. **Equity-out that pushes the portfolio-free date past seven years is fighting the foundation the family has already chosen.**

### 4.3 Counting the cost

> **ESV — Luke 14:28:** *"For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it?"*

Jesus's framing of any consequential decision: sit down, count the cost, then act. This document IS the count. The sensitivity table (§3.5) is the count under stress. The screenshots from Christina are the foundation of the count.

### 4.4 The four questions to hold while reviewing the data

1. **Direction:** Does this move the family *toward* debt-freedom (jubilee direction) or *toward* more leverage in a new shape (Egypt direction)? The number to watch: total household debt before vs after. If after > before, name it as such; refinancing isn't reducing.
2. **Margin of safety:** Does the cash-flow math still work under the combined-stress scenario (§3.5)? If "yes," the decision has biblical-prudence shape. If "only in the base case," the family is presuming on conditions God may not grant.
3. **Seven-year horizon:** Does the rental-portfolio-free date stay within seven years after the move, or does cash-out push it out? Borrowing-with-jubilee-built-in is closer to the pattern than borrowing-with-no-end-in-sight.
4. **Lift the family AND create** (per `GOVERNANCE-EXECUTION-ADVISORY.md`): does this free margin for *creative* work (PoeTech build-out, ministry, sabbatical-cadence, kids' college) or just refinance present obligations into a longer tail? Margin that's reinvested into creation passes the standing test. Margin that disappears into lifestyle does not.

### 4.5 The standing rule on translations

These verses are quoted from ESV per `docs/00-foundations/_root/SCRIPTURE-REFERENCE-STANDARD.md`. None are paraphrased. Any verse the family wants to verify against KJV / NIV / AMP / Strong's before deciding is available — flag it and we'll pull the cross-references.

---

## 5. How this gets processed through the PoeTech App

### 5.1 The surface already exists — partially

The family already has most of the infrastructure for this evaluation built into the Family OS:

- **Rentals module** (`app/src/components/Rentals.jsx`) — the per-property card includes a **Market Valuation & Property Info** block (`PropertyDetails`, lines 68-389) with a manual market-value field, RentCast prefill connector (lines 274-288), Zillow / Realtor / Redfin / Trulia / county-records lookup links (lines 120-126), and an **Estimated Equity** display (line 362: `value − mortgage`).
- **Snowball math** (`projectRentalSnowball`, `Rentals.jsx:18-32` and the canonical `poe-financial-mvp-v28.jsx:755-769`) — already projects portfolio payoff under three sort orders, with the freed-cashflow cascade modeled correctly per CALC-INVENTORY §C4.
- **Seven-year backsolve** (`findExtraForTarget`, `poe-financial-mvp-v28.jsx:771-775`) — already computes the monthly extra needed to clear the portfolio in N years.
- **Debt tab** (`app/src/components/Debts.jsx`) — already runs the consumer-debt snowball with snowball / avalanche / hybrid sort orders.

### 5.2 The surface that's missing — equity-out scenario modeling

What the app does NOT have today (and what this evaluation will probably justify building post-vacation):

- **Refi scenario model.** Given (a) which properties to refi, (b) cash-out amount per property, (c) new rate, (d) new term, (e) closing costs, project the *new* per-property mortgage balance + payment + the freed cash flow from canceled consumer debts, and re-run both snowballs side-by-side against the current trajectory.
- **Comp anchor field on the Rentals card.** Today market value is a single number with a source string. A first-class comps table (one address + sale price + date + sqft + beds/baths per row, with a derived per-sqft adjustment) would let the family update valuations as new comps land.
- **Combined-stress dashboard.** The sensitivity table in §3.5 is something the app should be able to render natively — not just for this decision but for any future leverage decision. Add to the post-vacation build queue.

Per `BUSINESS-PROCESS-CONNECTIONS.md`: this evaluation is a real-world decision wired to a real question; the answer needs a wired surface to live in. **Action:** add "Equity-Out Scenario Modeler" to the post-vacation buildout list as a Real-Estate-tab subtab. Five-question test:

1. *What does it invite?* — a family contemplating any equity-leverage decision (cash-out refi, HELOC, sale-and-redeploy).
2. *What pipeline carries it?* — the existing `projectRentalSnowball` + `projectDebtSnowball` engines, fed by a new scenario object.
3. *Who governs incoming volume?* — Darrell + Christina alone for the Poe instance; landlord-tier customers gate themselves later.
4. *What's the visible promise?* — "Count the cost before you borrow."
5. *Timeline commitment* — first scaffold within 30 days of vacation return if this decision proceeds.

### 5.3 Sovereign storage

Per `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`: the scenario data — comps, refi quotes, consolidation targets — lives in the family's sovereign storage (Supabase for the live app, NAS for the archival copy). Not shared with any lender, vendor, or analytics platform. The lender sees only what's required for underwriting; the family's full picture stays the family's.

---

## 6. Open questions for Darrell + Christina

Most questions resolve when the screenshots arrive. The genuinely open ones — ones the data can't answer:

1. **The "why now" — is there a triggering event?** Is this comp signal alone, or is there a debt-stress trigger (a rate adjustment, a 0% promo expiring, a card maxing) that's pulling the timing? If the latter, treat this as urgent and confirm in the data. If the former, the math can sit a week to be sure.
2. **Refi vs HELOC posture** — does Darrell prefer a clean cash-out refinance (single new mortgage replacing the old, longer commitment, lower rate) or a HELOC (line of credit, variable rate, can be paid down and reused)? The math differs; ask the lender for both quotes if possible.

Everything else — current balances, rates, rents, comps, lender terms — comes from the screenshots.

---

## 7. Decision posture (working draft, refines when data lands)

The family is operating from strength: a real portfolio, real comps, a real engine for processing the numbers, and a real biblical-economics frame for evaluating them. Most landlords in this position chase the cash-out reflexively and discover the bondage shape of the new debt five years later. The Poes have the discipline to count the cost before they sign — both the financial cost and the spiritual cost.

The default posture going into the data review: **lean toward the move if and only if it (a) measurably reduces total household interest burden, (b) preserves or accelerates the seven-year portfolio-free target, (c) survives the combined-stress scenario with positive net cash flow, and (d) frees margin that's clearly directed into creative / Kingdom work rather than dissolving into lifestyle creep.** Three of four is a maybe. Four of four is a yes. Two or fewer is a no, regardless of how attractive the gross cash-out number looks.

Math runs when the data arrives. Document updates with real numbers + final recommendation in the same file (this section becomes "Decision recorded"). Sources cited per `SCRIPTURE-REFERENCE-STANDARD.md`.

---

**File:** `docs/99-session-notes/2026-06-01-holly-hill-equity-evaluation.md`
**Author:** Claude (advisory per `GOVERNANCE-EXECUTION-ADVISORY.md`).
**Status:** Framework only — pre-data.
**Next:** Christina's screenshots → fill the checklist → run the math → update §3 tables + §7 decision.
