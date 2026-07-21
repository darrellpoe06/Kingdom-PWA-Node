---
id: DR-0212
title: All income and All outputs as standard reports — the income-statement pair on the Imported KPI surface
status: accepted
date: 2026-07-21
tier: A
declared_by: Darrell
supersedes: none
amends: app/src/lib/finance-reports.js, app/src/components/Imported.jsx
principles: [APP-IS-PRIMARY (DR-0065), REALITY-TRACE (DR-0061/P15), VERIFICATION-DOCTRINE (DR-0076), QUALITY-OF-LIFE, DATA-AS-EMPOWERMENT]
---

## Context

Darrell, 2026-07-21 (looking at Books → Imported, the "KPI's · Standard reports"
surface): **"The KPI's should have all income on one report and all outputs
etc... standard reports."** The surface already carried analytical KPIs
(Material changes, Unusual months, Recurring payments, Top categories, Top
payees) but no complete, one-report view of each side of the ledger — the
classic income-statement pair every user expects.

## The decision

Added the **standard income/outputs pair**, leading the surface:

- **All income** — every external credit for the window, grouped by
  source/category, biggest first, with the grand total IN. On-screen panel +
  exportable preset (`allIncomeModel`).
- **All outputs (expenses)** — every external debit, grouped by category,
  biggest first, with the grand total OUT. On-screen panel + exportable preset
  (`allOutputsModel`). (The existing "Top categories" insight cut is retained;
  All outputs is the complete report with a grand-total row.)

Both lead the `KPI's · Standard reports` panel list and both are added to
`financePresets` (Reports menu), so each is viewable AND exportable
(CSV/print). Internal transfers are excluded on both — a transfer credit is not
income and a transfer debit is not an expense — and the note says so; the
numbers tie out to the IN/OUT totals in the period header (no re-derivation,
DR-0076).

## Verification (DR-0076)

- `finance-reports.test.js`: new `allIncomeModel` / `allOutputsModel` coverage —
  one-sided (income report has no debits, outputs report no credits), transfer
  credits/debits excluded, and each report's CSV net ties to its grand total;
  the preset-order assertions updated (`monthly, category, account, all-income,
  all-outputs, inc-exp, 1099`).
- `imported-render.test.jsx`: a new test mounts real income + expenses and
  asserts both panels render with their grand-total lines and tie to the
  measured $2,500 in / $500 out.
- Colors via **themeable Tailwind classes** (an initial inline-`style={{color}}`
  draft was caught by the contrast + legibility guards and converted), so both
  guards stay green.
- Full suite green. REV-0184.
