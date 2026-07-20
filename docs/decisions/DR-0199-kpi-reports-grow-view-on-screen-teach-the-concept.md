---
id: DR-0199
title: KPI reports — grow the set, view on screen (not download-to-see), and teach the concept
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: extends DR-0195 (KPI panel) + DR-0197 (full list); refines the #967 Reports menu
principles: [APP-IS-PRIMARY (DR-0065), REALITY-TRACE (DR-0061 / P15), TEACH-THROUGH-THE-SYSTEM (DR-0195), ANXIETY-CLARITY-PRINCIPLE, VERIFICATION-DOCTRINE (DR-0076)]
---

## Context

Darrell, 2026-07-20, across several messages on Books → Imported:

> "KPI's ... not KPIS ... ignorant looking text to explain something obvious." →
> "I want the explanations for our learners... context." →
> "Add any standard KPI's we can to the current list of three." →
> "I don't want users to have to download the KPI's just to see the reports
> results... make it auto sort to the KPI and then allow the option as usual." →
> "In Groups can have KPIs... opportunities and constraints."

## The decisions

**1. Header reads "KPI's", never the mangled "KPIS".** The `uppercase` transform
turned "KPIs" into "KPIS" (ignorant-looking). Fixed on BOTH surfaces — the
on-screen panel header and the Reports-menu group header — to render "KPI's" in
proper case (no uppercase transform, curly apostrophe).

**2. The explainer teaches the CONCEPT for learners, not the obvious mechanics.**
Was: "these read live... and reorder by what you open most" (narrated the UI). Now:
"KPI means *key performance indicator* — the few numbers that tell you the most
about your money at a glance," then names what each report reveals. Keeps
teach-through-the-system (DR-0195); drops the condescending mechanics narration.

**3. Grow the KPI set.** Added two standard KPIs, computed from the SAME windowed
external rows the register shows (transfers excluded, DR-0076 — no re-derivation):
- **Top categories** — where the money goes (spending by category, biggest first,
  each with its % of spend).
- **Top payees** — who you pay most (spending by payee, biggest first, with count).
Both registered in `STANDARD_REPORTS` so the usage-ranking (DR-0195) orders them,
and both show the FULL list and grow to any (DR-0197). The set now grows as needs
arise — the registry is the seam.

**4. A KPI is meant to be SEEN, not downloaded to see.** The #967 Reports menu
offered KPI results as CSV/PRINT only — you had to download to see them. Added a
**View** action on each KPI menu item that opens the on-screen KPI panel to that
report and scrolls to it (`kpi-material` → the panel's `material`); CSV/PRINT stay
as the option "as usual." This wires the Reports menu (#967) to the on-screen panel
(DR-0195) — one source, seen where the user is (APP-IS-PRIMARY).

## Groups can have KPIs — opportunities & constraints (Darrell's brainstorm)

The GROUP BY control (Month / Payee / Category / Account) already reorganizes the
register with in/out/net subtotals per group — those subtotals ARE mini-KPIs.

- **Opportunity:** grouping by Category is the "Top categories" KPI inline; by Payee
  is "Top payees." A light enhancement — sort groups by size + show each group's
  % of the window total in its header — would make every GROUP BY view read as a
  KPI without a new surface. The data is already computed.
- **Constraint:** don't duplicate or clutter. The KPI panel is *curated top-of-page
  insight*; the GROUP BY is the *full register, reorganized*. Decorating every group
  header with KPI framing risks noise, and the % basis differs (window vs group).
  So: NOT built this pass — captured as a scoped next step (`re-review: 2026-10-20`,
  DR-0075). The two new KPIs (categories/payees) already deliver the insight the
  grouping would surface; the group-header enhancement is additive polish.

## Verification (DR-0076)

`Imported.jsx` (topCategories/topPayees useMemos over `grouped.windowed`, transfer-
excluded; `viewKpi` opens+scrolls the `kpiPanelRef` panel), `report-usage.js`
(registry +2), `ReportActions.jsx` (View action for KPI presets, header fix).
Proven-to-catch: `imported-render.test.jsx` (+ Top categories/payees computed from
real spend; KPI panel), `report-actions-render.test.jsx` (+ View opens on screen /
CSV stays / non-KPI has no View). Lint + consistency-guard (rem, not px) + full
suite green. REV-0171; memory `feedback_kpi_reports_grow_and_view_on_screen`.
