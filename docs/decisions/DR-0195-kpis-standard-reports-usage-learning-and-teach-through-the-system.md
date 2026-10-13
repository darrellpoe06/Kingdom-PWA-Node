---
id: DR-0195
title: KPIs · Standard Reports — collapsed, usage-ranked (Ari learns the most-used), and teaching what's under the hood
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: restructures the Books → Imported insight panels; introduces the report-usage learning helper and the Teach-Through-the-System Way
principles: [APP-IS-PRIMARY (DR-0065), REALITY-TRACE (DR-0061 / P15), PERPETUAL-IMPROVEMENT (DR-0075), VERIFICATION-DOCTRINE (DR-0076), THREE-BRAKES (autonomy — N/A here, see Constraints)]
---

## Context

Darrell, 2026-07-20, on the Books → Imported tab (screenshots): the three
money-insight panels (Material changes, Unusual months, Recurring payments) sat
always-open at the top and ate the whole upper real-estate before the filters and
register. Across several messages:

> "Add those sections at the top as standard reports that are sorted to and not take
> up all the top real-estate."
> "Any known standard KPI reports so even sorting isn't needed after Ari recognition
> of the reports that are being used mostly... a learning method for Ari — the
> standard reports grow based on needs assessment and use."
> "Always keep our sorted, of course — just iterative, getting better everywhere."
> "KPIs — Standard Reports."
> "We want to teach with the systems as much as possible... titles, locations, and
> names should reflect their business practices... the tabs should be teaching what
> is under the hood."

## The decision

**1. Group the KPI panels under one collapsible "KPIs · Standard reports" header,
collapsed by default.** The three data-driven panels move inside one disclosure and
show ONE at a time, so they no longer dominate the top of the tab. Collapsed, it is a
single compact strip naming the reports + count; one tap expands it. (`Imported.jsx`.)

**2. Rank the reports BY USAGE so the most-used surfaces first — "even sorting isn't
needed."** A device-local, deterministic frequency counter (`lib/report-usage.js`)
records each time a report is opened/selected and reorders a KNOWN registry
(`STANDARD_REPORTS`) by count DESC, stable on registry order for ties. The most-used
becomes the default-shown report. This IS "Ari's recognition" of what the family uses
— a frequency ranking, not a black box. The manual selector stays (sorted, keep it),
so the family can always pick.

**3. The registry is KNOWN and GROWS by need.** `STANDARD_REPORTS` is an explicit
list; new KPIs are added there (+ their panel) as needs are assessed — order is only
the tiebreak, use decides the rest. Iterative by design (DR-0075).

**4. Teach what's under the hood (the Teach-Through-the-System Way).** The expanded
panel carries a one-line explainer — *"These KPIs read live from your ledger — no
static numbers — and reorder by what you open most, so your most-used report stays on
top."* — so the surface teaches its own mechanism (live data + the learning).

## The Way — Teach Through the System (declared by Darrell 2026-07-20)

**The platform teaches through its own surfaces. Titles, names, and locations reflect
the real business practice, and each tab teaches what is happening under the hood.**
A surface is not just a display — it is a lesson in how the system actually works, so
using PoeTech makes the family more able to run the system themselves. This is the
sibling of APP-IS-PRIMARY (DR-0065): the app is the primary artifact AND the primary
teacher. Applied first here (the KPIs explainer); it is a standing lens for every
surface going forward — where a name or a number appears, it should name the real
practice and, where useful, teach its mechanism. `re-review: 2026-10-20` to assess
where else it should be applied (recorded per DR-0075, not a silent drop).

## Opportunities & Constraints

### Opportunities
- The register + filters are reachable without scrolling past three tall panels.
- The family's most-used KPI is on top automatically (personalized per device); less
  hunting.
- The KPI set is explicit and extensible — a new report is one registry entry + panel.
- The surface self-explains (teach-through-the-system), lowering the anxiety of "what
  is this number?" (ANXIETY-CLARITY-PRINCIPLE).
- Deterministic + device-local: no server call, no timer, no autonomous compute.

### Constraints (named honestly, with dates)
- **Usage is device-local, not a synced house ranking** — each browser learns its own
  order. A shared family ranking needs a synced store (RLS-scoped). `re-review:
  2026-10-20`.
- **The learning is frequency-only** — no recency decay, seasonality, or an actual
  Ari-authored recommendation yet. A richer needs-assessment model is a future
  iteration (and any version that SPAWNS compute on a timer is Tier C under the
  three-brakes rule — this frequency counter is not that class). `re-review:
  2026-10-20`.
- **"Grow based on needs assessment" is currently manual** — a human adds the KPI to
  the registry; an automated proposer is future work.
- **Collapsed-by-default hides the numbers until opened** — a deliberate real-estate
  tradeoff; the header names the reports + count so the value isn't invisible.

## Verification (DR-0076)

- `report-usage.test.js` (7 cases): usage-DESC ranking with stable tiebreak, bump +
  persist, fail-soft on a throwing store, malformed/hostile stored values dropped,
  empty-id no-op, registry integrity.
- `imported-render.test.jsx` (new case): real mount proves collapsed-by-default (top
  reclaimed), expand-on-tap, the teaching microcopy renders, tab-select swaps the
  report AND the usage is learned + persisted (Recurring outranks Material after one
  use).
- Lint clean; the imported/reports suites (95 cases) green. Recorded in memory as
  `feedback_kpis_standard_reports_usage_learning` and
  `feedback_teach_through_the_system`.
