# Holly Hill Equity Evaluation — Real Comps + Real Portfolio Numbers

**Date:** 2026-06-01 evening (Maui, from Darrell's phone)
**Event type:** evaluation + family-input
**Source surface:** Synology Chat (#PoeTech-PWA) — captured via wf08
**Senders:** cpoe (Christina), dpoe (Darrell)
**Status:** Initial analysis complete; awaiting (1) actual sqft per Poe Holly Hill door, (2) real lender refi quote, (3) tenant resolution at 1508 Holly Hill
**Related artifacts:** [`docs/99-session-notes/2026-06-01-holly-hill-equity-evaluation.md`](./2026-06-01-holly-hill-equity-evaluation.md) (the framework), `app/src/poe-financial-mvp-v28.jsx:165-176` (rental seed data), Synology Chat screenshots (uploads `cca990af-4078.jpg` + `9e19155f-4081.jpg`)

---

## The opportunity (from Christina, 2026-06-01 ~11:58 CDT)

Two recent neighborhood sales in Champaign IL 61820, on or adjacent to the Poe family's Holly Hill rental homes:

| Comp | Address | Sold | Sold price | Beds / Baths | Sqft | $/sqft |
|---|---|---|---|---|---|---|
| #1 | 1501 Holly Hill Dr | 04/19/26 | $175,000 | 3 / 2 | 1,419 | $123.33 |
| #2 | 1519 Hedge Rd | 05/14/26 | $170,000 | 4 / 3 | 1,632 | $104.17 |

Average: **$172,500** / **$113.75 per sqft** / **1,525 sqft**.

Christina's question (cleaned up from voice transcript): *given these recent neighborhood sales at $170-$175K, what would the Poe family's own homes appraise for? She wants to know what we own based on what is selling around us — without having to ask each time — so we can evaluate equity-out moves for debt cancellation.*

## The Poe family rental portfolio (per `app/src/poe-financial-mvp-v28.jsx:165-176`)

11 rental doors + 1 owner-occupied primary home (2111 Talans Way, not part of this analysis).

| ID | Address | Rent | Mortgage | Rate | P&I | Escrow | Status |
|---|---|---|---|---|---|---|---|
| r1 | 1508 Williamsburg | $1,100 | $88,000 | 6.50% | $556 | $180 | paying |
| **r2** | **1513 Holly Hill** | **$1,100** | **$88,000** | **6.50%** | **$556** | **$180** | **paying** |
| **r3** | **1508 Holly Hill** | **$1,400** | **$110,000** | **6.50%** | **$695** | **$220** | **LATE ($850 short)** |
| r4 | 805 Apt 1 | $850 | $70,000 | 6.50% | $442 | $150 | paying |
| r5 | 805 Apt 2 | $950 | $70,000 | 6.50% | $442 | $150 | paying |
| r6 | 805 Apt 3 | $900 | $70,000 | 6.50% | $442 | $150 | paying |
| r7 | 805 Apt 4 | $1,000 | $70,000 | 6.50% | $442 | $150 | paying |
| r8 | 440 South Street | $950 | $80,000 | 6.50% | $506 | $170 | paying |
| r9 | 1003 Koehn | $1,250 | $100,000 | 6.50% | $632 | $200 | paying |
| r10 | 1213 Koehn | $1,200 | $95,000 | 6.50% | $600 | $195 | paying |
| r11 | 709 Commercial | $1,000 | $80,000 | 6.50% | $506 | $170 | paying |

**Total portfolio mortgage balance:** $921,000
**Total monthly P&I:** ~$5,819
**Total monthly rent (actual):** ~$10,850 collected, $11,700 contracted (the $850 gap is the 1508 Holly Hill tenant)

## Direct comp application — the two Holly Hill doors

The two Christina-found comps are at 1501 Holly Hill Dr (same street) and 1519 Hedge Rd (adjacent neighborhood). They directly inform the appraisal anchor for r2 (1513 Holly Hill) and r3 (1508 Holly Hill).

**Seed-data limitation:** the rental seed does not carry sqft per door. Until Christina drops actual sqft from records, the appraisal estimate is a range based on ±10% sqft assumption versus the comp average of 1,525 sqft.

| Door | Mortgage | Conservative ($150K, 1,300 sqft @ ~$115) | Median ($170K, 1,500 sqft @ ~$113) | Optimistic ($185K, 1,650 sqft @ ~$112) |
|---|---|---|---|---|
| r2 — 1513 Holly Hill | $88,000 | Gross equity $62K | Gross equity $82K | Gross equity $97K |
| r3 — 1508 Holly Hill | $110,000 | Gross equity $40K | Gross equity $60K | Gross equity $75K |

**Note:** "Gross equity" = appraisal minus current mortgage balance. It is NOT cash you can pull. Cash-out lenders cap at typically 75% LTV on investment property.

## Cash-out math at 75% LTV (industry standard for investment-property cash-out)

| Door | At conservative $150K | At median $170K | At optimistic $185K |
|---|---|---|---|
| r2 — 1513 Holly Hill | New loan ceiling $112.5K → mortgage $88K → **$24.5K available** | $127.5K → $88K → **$39.5K available** | $138.8K → $88K → **$50.8K available** |
| r3 — 1508 Holly Hill | New loan ceiling $112.5K → mortgage $110K → **$2.5K available** | $127.5K → $110K → **$17.5K available** | $138.8K → $110K → **$28.8K available** |
| **Combined Holly Hill cash-out potential** | **$27K** | **$57K** | **$80K** |

**Median scenario: ~$57K of cash-out available against just the two Holly Hill doors.**

## What that $57K does to the consumer-debt stack

A typical American household carrying 22%+ APR consumer debt has $20K-$40K of such debt across cards, personal loans, and similar. The median Holly Hill cash-out ($57K) would:

1. **Cancel the full 22%+ APR consumer stack** with $15K-$35K left over.
2. **Cover refi closing costs** (typically 2-5% of new loan = $5K-$12K total across the two refis).
3. **Leave an emergency reserve** of $5K-$25K.

## The carrying-cost trade

Cash-out is not free equity — it replaces low-rate mortgages with higher-rate ones AND extends the balance.

| Scenario | Current 6.5% balance | New ~7.5% balance | Monthly P&I delta |
|---|---|---|---|
| r2 — at $127.5K new loan vs. $88K current | $88K @ $556/mo | $127.5K @ ~$891/mo (30yr) | **+$335/mo** |
| r3 — at $127.5K new loan vs. $110K current | $110K @ $695/mo | $127.5K @ ~$891/mo (30yr) | **+$196/mo** |
| **Combined monthly carry increase** | | | **~$531/mo** |

That **$531/mo carry increase** must be more than offset by the consumer-debt payments eliminated.

**Back-of-envelope: paying off $40K of consumer debt at 22% APR saves roughly $730-$900/mo** in minimum payments (depending on amortization). Net cash-flow improvement: roughly **+$200-$370/mo** to the family. Plus the principal stops compounding at 22% APR.

## The biblical-economics check (per CLAUDE.md "Source of Answers" rule)

The framework's central question (per [`2026-06-01-holly-hill-equity-evaluation.md`](./2026-06-01-holly-hill-equity-evaluation.md)):

> *Does this move the family toward the seven-year debt-freedom horizon (jubilee direction, Deuteronomy 15:1-2) or extend bondage in a new shape (Egypt direction, Proverbs 22:7)?*

**ESV — Deuteronomy 15:1-2:** *"At the end of every seven years you shall grant a release. And this is the manner of the release: every creditor shall release what he has lent to his neighbor. He shall not exact it of his neighbor, his brother, because the Lord's release has been proclaimed."*

**ESV — Proverbs 22:7:** *"The rich rules over the poor, and the borrower is the slave of the lender."*

**The honest read on this move:**

- **Jubilee direction:** the move cancels 22%+ APR consumer debt outright. That debt is the closest thing to modern bondage Proverbs 22:7 warns against. Eliminating it is a clear step toward the seven-year horizon.
- **Egypt direction risk:** the move increases the mortgage carry. If the cash-out is used for anything OTHER than cancelling higher-APR debt, it becomes new bondage in cheaper clothing. The discipline test is: every dollar of cash-out is earmarked, written down, traceable to a specific debt-cancellation or emergency-reserve line. No "while we are at it" spending.
- **Tenant honor:** the 1508 Holly Hill tenant is currently $850 short. Pulling equity from that property while a tenant is struggling is a separate stewardship question — the financial transaction is between the family and the lender, but the relational context with the tenant matters. Resolve the tenant situation FIRST or hold off on r3 specifically.

**Conclusion:** the move is jubilee-direction IF (a) every dollar of cash-out lands against higher-APR debt or reserve, (b) the tenant at 1508 Holly Hill is honored first, (c) the refi rate quoted is below the consumer-debt rate it cancels (current refi rates ~7-8% vs. consumer 22%+ — comfortably positive arbitrage).

## What we still need before pulling the trigger

1. **Actual sqft for r2 (1513 Holly Hill) and r3 (1508 Holly Hill)** — Christina to pull from records or county assessor. Tightens the appraisal range from ±$35K to ±$10K.
2. **A real lender quote** — rate, closing costs, term — for refi on either property. Makes the cash-flow math concrete instead of estimated.
3. **Tenant resolution at 1508 Holly Hill** — payment plan, escalation, or transition. Per `app/src/poe-financial-mvp-v28.jsx:103` and `:113-119`, this is already a flagged open project; just needs decisive movement.
4. **Comps for the other 9 doors** (805 Apts as a 4-unit, Williamsburg, Koehn, South Street, Commercial) — the Holly Hill comps only inform the two Holly Hill doors. The full portfolio cash-out potential is larger but requires neighborhood-specific comps.

## Next moves (in priority order)

1. **Christina:** drop sqft for r2 and r3 (records or county assessor — 5 minutes).
2. **Darrell:** call one lender for a real refi quote on r2 (the cleaner of the two — no tenant issue). 30 minutes including hold time.
3. **Darrell + Christina:** decide on tenant resolution path for 1508 Holly Hill.
4. **Future session:** pull comps for the next 1-2 property classes to expand the cash-out picture.
5. **System buildout (post-vacation):** add a Property-Module to the Workflow Module Library that automates the comp-based-appraisal + cash-out scenario math — make this evaluation pattern reusable for the next family or community that has rental property and a consumer-debt-cancellation question.

## Posture (Religion AND Relationship check)

This is one of the moments the system is built for. A real family decision, with real numbers, in real time, with the worldview frame holding center. The math leans toward jubilee; the discipline is in the discipline. We do not pull equity to "have options"; we pull it because there is a specific debt to cancel and a specific home to honor while we do it.

*Wire before you write. Process before you promise. Family voice before all of it. We all win. We create. Amen.*

---

**Event metadata** (for institutional-memory backfill when the Events module ships):

```
type: evaluation + family-input
title: Holly Hill comp-based equity-out evaluation
description: Christina pulled two recent neighborhood sales ($175K + $170K); Claude
  applied comps against Poe portfolio seed data; produced range-based per-door
  appraisal estimates + cash-out math + biblical-economics check. Outcome: move is
  jubilee-direction conditional on three discipline gates.
root_cause: n/a
resolution: pending (real sqft + lender quote + tenant resolution)
tags:
  workflows: [wf08, wf30, wf31]
  modules: [rentals, family-voice-loop, future-property-module]
  sector: [financial, relational]
  senders: [cpoe, dpoe]
provenance:
  who: Christina (data) + Darrell (request) + Claude (analysis)
  when: 2026-06-01 11:58 CDT (Christina) ... 18:30 CDT (analysis complete)
  source_surface: Synology Chat #PoeTech-PWA + uploads cca990af-4078.jpg + 9e19155f-4081.jpg
learnings:
  - Range-based estimates are the right level when sqft is missing; do not fake precision.
  - Cash-out math must always include the carrying-cost trade, not just gross equity.
  - The biblical-economics frame is the senior question; the math is downstream.
  - This evaluation pattern is reusable — candidate for a Property-Module in the Workflow Module Library.
related_artifacts:
  - docs/99-session-notes/2026-06-01-holly-hill-equity-evaluation.md (framework)
  - app/src/poe-financial-mvp-v28.jsx:165-176 (rental seed data)
  - uploads/cca990af-4078.jpg (Christina's Synology Chat with Zillow comps)
  - uploads/9e19155f-4081.jpg (Synology Chat capture verification)
status: open
```
