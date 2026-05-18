# PoeTech Family OS · KPI Dictionary

Every metric the app shows, what it means, how it's computed, and what good looks like. Sorted by where you'll see it in the app.

> **Use this** when you see a number and want to know "is that good?" Each entry has a green-band / amber-band / rust-band breakdown.

---

## Big Picture · Action Queue

### Open items by urgency
- **What it shows:** Counts of Changes (⚡), Incidents (!), Projects (◆) currently open.
- **Good:** 0–2 Incidents + 0 Changes + 0 overdue. Means the household is current on its commitments.
- **Watch:** 3–5 Incidents OR 1+ overdue items. Time to allocate a focused session this week.
- **Bad:** 5+ Incidents, 1+ Change open >24 hrs, or anything overdue >3 days. Something's slipping — re-prioritize or escalate to Project.

## Big Picture · Family Capacity

### Capacity %
- **What:** Sum of active projects' `hoursPerWeek` ÷ sum of skill profiles' `hoursPerWeek`.
- **Computed:** `committed / available × 100`.
- **Green (<80%):** Healthy. Room to take on opportunities.
- **Amber (80–100%):** Tight. New projects prompt to add as TBD.
- **Rust (>100%):** Over-committed. Stop adding work; consider promoting/parking active items.

## Big Picture · Hero metrics

### Net cash flow
- **What:** Monthly income minus monthly expenses across all entities.
- **Good:** Positive and increasing month-over-month.
- **Watch:** Positive but flat for >6 months — opportunity to raise income or cut.
- **Bad:** Negative. Pressure slider must move up + reserves get tapped.

### Debt-free date (consumer)
- **What:** Projected month consumer debt hits zero at current pressure setting.
- **Good:** ≤7 years (the Sabbath horizon).
- **Watch:** 7–10 years — viable but slow.
- **Bad:** >10 years OR moving back month-over-month — pressure must increase or income must change.

### Rentals owned-free date
- **What:** Projected month all rental mortgages clear at current snowball setting.
- **Good:** ≤7 years.
- **Watch:** 7–12 years — sustainable if cash flow is steady.
- **Bad:** >12 years OR a single mortgage payoff dragging long past portfolio average.

## Big Picture · Buffer Fund

### % funded
- **What:** Current balance ÷ target balance.
- **Good:** ≥60% — meaningful float for month-start mortgage timing.
- **Watch:** 30–60% — partial protection.
- **Bad:** <30% — month-end cash crunch likely; first $500/mo should land here.

### Suggested target
- **Computed:** ~1 month of total rental P&I, rounded to nearest $500. Fallback $5,000.
- **Editable** at any time via the Edit target button.

## Books · Accounts

### All Accounts Total Cash
- **What:** Sum of checking + savings + cash + investment account balances.
- **Good:** ≥1× monthly outflow (1 month emergency cushion).
- **Watch:** 0.5–1× monthly outflow.
- **Bad:** <0.5× monthly outflow OR negative — overdraft risk.

### Debt Accounts Total
- **What:** Sum of credit-card + loan account balances (typically negative).
- **Track:** Month-over-month direction is more important than absolute. Should trend toward zero at the pressure setting chosen.

## Books · Transactions

### 30/60/90 forecast — Gap vs. cushion
- **What:** Projected balance at +30 / +60 / +90 days, vs. the $1,000 cushion line.
- **Good (bold black):** Balance ≥ cushion in all three windows.
- **Watch (plain rust):** Below cushion at +60 or +90 — start covering with transfers proactively.
- **Bad (bold rust):** Below zero at +30 — immediate transfer needed.

### Trailing 30/60/90 actuals
- **What:** Net cash movement over the prior 30/60/90 days (from settled transactions).
- **Sanity check:** If forward projection drops faster than prior-90 actuals, you're projecting tighter than reality (or you've got an unusual squeeze coming).

## Debts

### Total consumer debt
- **What:** Sum of all non-mortgage debt principal.
- **Good:** Decreasing month-over-month, attacking highest-interest first (avalanche) or smallest-balance (snowball).
- **Bad:** Increasing OR unchanged for 2+ months.

### Weighted avg interest rate
- **What:** Total interest cost ÷ total balance.
- **Good:** <10%.
- **Watch:** 10–18%.
- **Bad:** >18% — refinance / consolidation conversation.

### Years to debt-free
- **What:** Same as Big Picture hero metric. Tied to pressure slider.

## Real Estate

### Rent collection rate
- **What:** Actual collected ÷ Expected rent (across income-producing rentals).
- **Good:** ≥95%.
- **Watch:** 85–95% — one tenant likely late.
- **Bad:** <85% — multiple tenants late OR vacancy.

### Rent gap (monthly)
- **What:** Expected minus actual rent. Dollar amount of "money on the table."
- **Good:** $0 (all rents in).
- **Bad:** Any gap >7 days into the month — needs Tenant Not Paying action.

### Mortgage payoff cascade (years)
- **What:** Years until all 11 doors are paid off at current snowball.
- **Good:** ≤7 years.

### Per-property evaluator
- **Cap rate:** NOI ÷ purchase price. Strong ≥8%, OK 5–8%, weak <5%.
- **Cash-on-cash:** Annual cash flow ÷ down payment (assumed 20%). Strong ≥10%, OK 6–10%, weak <6%.
- **1% rule:** Monthly rent ÷ purchase price. Pass if ≥1%.
- **DSCR (Debt Service Coverage):** NOI ÷ annual debt service. Lenders want ≥1.25. Tight 1–1.25. Below 1 = property can't pay itself.
- **GRM (Gross Rent Multiplier):** Price ÷ annual rent. Lower = better.

### Per-property equity
- **What:** Market value − mortgage balance.
- **Source:** User updates market value manually after using the Zillow/Realtor/Redfin lookup links + the "save value?" prompt.

## Projects

### Capacity utilization
- **Same metric** as Big Picture Family Capacity. Visible per-project breakdown in workload forecast.

### Projects by status
- **What:** Counts in planning / active / ending-soon / complete / on-hold / TBD.
- **Watch:** Many TBD = you're seeing more opportunities than you can do — good problem, but make sure nothing rotting on the parking lot.

## Projects · Inventory & Capital Forecast

### Month-by-month outflow (12 months)
- **What:** Sum of open capex items' costs bucketed by `purchaseTargetDate` month.
- **Gap vs. net cash:** Net cash flow − month's outflow.
- **Good (bold black):** Gap ≥ 0 every month.
- **Watch (amber):** 1–2 months with negative gap — push dates or save harder.
- **Bad (rust):** 3+ months negative — restructure spend or income before committing.

### Savings prompts per item
- **What:** Required monthly set-aside = (cost − current available cash) ÷ months until target.
- **Good (✓):** Fits at current net cash flow.
- **Watch (⚠ tight):** Per-item ask > current net.
- **Bad (⚠ overdue):** Target date past, lump sum needed now.

## Practice (TLC)

### Inquiries by status
- **What:** Counts in new / contacted / scheduled / converted / declined / nurture.
- **Good:** New + Contacted < 10 (you're following up promptly).
- **Bad:** New > 10 OR Contacted > 5 sitting >7 days = leads going stale.

### Conversion rate
- **What:** Converted ÷ Closed.
- **Good:** ≥40%.
- **Watch:** 25–40%.
- **Bad:** <25% — re-look at intake script or pricing.

### Pipeline revenue (estimated annual)
- **What:** (Active inquiries × conversion rate × $150 avg/session × 1 sess/wk × 48 wks).
- **Use:** Forward-looking practice value at current funnel.

## Markets

### Watchlist
- **What:** Day price + day change% per ticker, with arrow + sign + color.
- **Good (green ▲):** Day change > 0.
- **Bad (rust ▼):** Day change < 0.

### Cap
- **Foundation tier:** 5 tickers.
- **PoeTech+ and above:** unlimited.

## Dev/Ops

### Personalized options per profile
- **What:** Number of opportunity matches from the curated library.
- **Foundation tier:** 1 per profile.
- **PoeTech+:** 3 per profile.
- **Family and above:** 6 per profile (full library access).

### Pipeline value
- **What:** Sum of `monthly` across active opportunities for each person.
- **Use:** Visibility into latent income — not a commitment.

## Dev/Ops · Capacity (when "Wrap me with the tech" fires)

### Per-opportunity capacity check
- **What:** Adding this opportunity's hours/wk to current committed → resulting %.
- **<80%:** Auto-add active.
- **80–100%:** Prompt with TBD option.
- **>100%:** Strong prompt to use TBD.

## Voice Ops (Phase 1, when deployed)

### Calls this month
- **What:** Count of voicemails received across Poe Properties + PoeTech lines.
- **Use:** Trend visibility + cost projection.

### Monthly voice cost (estimated)
- **Computed:** (numbers × $1.15) + (call minutes × $0.0085) + (transcript minutes × $0.05).
- **Good:** <$15/mo.
- **Watch:** $15–$30/mo.
- **Bad:** >$30/mo with no corresponding business growth.

---

## How to use this dictionary

1. **You see a number you don't recognize** → search this file for the metric name → read the "What" and "Good/Watch/Bad" lines.
2. **You want to know if you're trending well** → look at the "Good" bar, compare to your current value, identify the gap.
3. **You're an SME reviewing** → use as the spec for "what the app should be showing and why." If a value doesn't match the "Good" definition in real life and the app says it's fine, that's a bug.

## Update cadence

Update this file whenever a new metric ships in the app. Every new tile / widget / forecast = one new section here.
