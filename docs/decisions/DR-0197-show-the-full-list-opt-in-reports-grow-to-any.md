---
id: DR-0197
title: Show the full list — an opt-in report shows ALL its rows and grows to whatever the data becomes
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: uncaps the KPI · Standard Report lists on Books → Imported
principles: [PERPETUAL-IMPROVEMENT (DR-0075), REALITY-TRACE (DR-0061 / P15), ANXIETY-CLARITY-PRINCIPLE]
---

## Context

Darrell, 2026-07-20 (screenshot of the live Recurring payments KPI showing 8 rows
+ "＋ 24 more recurring patterns"):

> "we want the full list of 24 to show up on its tab... And grow to any that
> becomes... a part of what should be listed because of the frequency of
> payments... And all low hanging fruit continuously... Ways and documentation."

The KPI · Standard Reports (DR-0195) were originally three always-open panels, so
each capped its list (recurring `slice(0,8)`, unusual months `slice(0,6)`) to save
the shared top real-estate. But they are now **collapsed by default and shown one
opt-in report at a time** — so the real-estate reason for the cap is gone, and a
truncated list hides real obligations the family needs to see.

## The decision — the Way

**An opt-in report (one the user expanded and selected) shows its FULL list, and
the list grows to whatever the data becomes — no fixed cap.** The truncation was a
real-estate compromise; once a surface is opt-in and one-at-a-time, the compromise
is unnecessary and the full, honest list wins.

- **Recurring payments** and **Unusual months** now render every row (was 8 / 6).
  The count + total header stays (e.g. "32 patterns · $5,868/cycle"), so the size
  is still summarized at a glance.
- **Grow to any that becomes** — the list is bound to the data, not a constant; if
  the detector finds 40 patterns, 40 show.
- This pairs with REALITY-TRACE (P15): a "＋ N more" that hides real rows is a soft
  form of the same problem the audit chases — the surface should show the real
  state, not a curated slice of it.

## Low-hanging fruit, continuously (standing practice)

Darrell: *"all low hanging fruit continuously."* A `slice(0, N)` + "＋ N more" on an
**opt-in / drill-in** surface is low-hanging fruit — sweep it to the full list as
it's found, as a standing habit (DR-0075), not a one-off. (This does NOT mean
uncapping passive at-a-glance alerts or always-visible summaries where a cap is a
deliberate real-estate choice — those keep their "＋ N more" until the surface
itself becomes opt-in.) The test: *is the list behind an explicit user choice to
view this report?* If yes, show all.

## Opportunities & Constraints

- **Opportunity:** the family sees every recurring obligation and every unusual
  month — no hidden tail. Directly serves the scared-parent clarity standard
  (ANXIETY-CLARITY): what/when/why/how, in full.
- **Constraint:** a very long list makes the report tall — acceptable because it is
  opt-in (the user selected that tab) and the page scrolls; a future nicety is an
  in-report max-height scroll if any list gets unwieldy (`re-review: 2026-10-20`,
  DR-0075 — ship the full list now, refine the container later if needed).

## Verification (DR-0076)

Uncapped `recurring.map` / `anomalies.map` in `app/src/components/Imported.jsx`
(removed `slice(0,8)` + the "＋ N more" line, and `slice(0,6)`). Lint clean;
imported-render + recurring-payments suites green; full suite green. REV-0168.
