---
id: DR-0204
title: Month quick-compare stepper at the top of Imported — Prev · month · Next where the eye already is
status: accepted
date: 2026-07-21
tier: A
declared_by: Darrell
supersedes: none
amends: the Imported period control
principles: [INLINE-NO-JUMPING (DR-0201), ANXIETY-CLARITY-PRINCIPLE, EXCELLENCE-STANDARD, PERPETUAL-IMPROVEMENT (DR-0075)]
---

## Context

Darrell, 2026-07-21 (Imported tab, tiles + KPIs all labelled "JUNE 2026"; the month
control sits at the bottom of a long page):

> "Add convenient Previous / Current / Next month tabs on the screen so it's always
> easy to compare months by clicking Next to see the exact same view in another
> month... I hate to go too far for control over getting to another location inside
> the app... iterative, intuitive."

To compare months the family had to scroll to the bottom `‹ June 2026 ›` stepper, tap
Next, then scroll back up to read the new month's tiles/KPIs. The control was far from
the numbers it changes — the exact "too far for control" this amends.

## Reality-trace (DR-0076)

The month stepper already exists (`Imported.jsx` bottom period control): `‹` →
`setPeriod(shiftMonthKey(stepperMonth, -1))`, `›` → `+1`, center → jump to that month
view. No new month logic is needed — only the same handlers placed where the eye is.

## The decision

Add a compact **‹ Prev · [Month] · Next ›** stepper directly ABOVE the In/Out/Net
tiles (which already carry the active-month label). It reuses the exact bottom-stepper
handlers, so tapping Next re-renders the identical view — tiles, KPIs, register — for
the adjacent month **in place** (DR-0201, no scroll, no jump). The center label jumps
into month view when on a non-month period (ALL/30D), same as the existing stepper.
The bottom control keeps the full 30D / 90D / ALL / CUSTOM options; the top is the
month quick-compare only, so there is no confusing duplication of the full control.

## Opportunities & Constraints

- **Opportunity:** month-to-month comparison becomes one thumb-tap where you're
  already looking — removes a scroll-down-then-scroll-up trip (ANXIETY-CLARITY).
- **Constraint:** placed as a normal top-of-content row (not sticky) so it never
  collides with the fixed corner FABs; palette + rem sizing reuse approved tokens
  (no new contrast/consistency debt).

## Verification (DR-0076)

`imported-render.test.jsx` (+1): the top "Compare month" control renders above the
tiles; Next advances the tiles' month label (June → July) in place with June gone;
Prev twice returns to May — the same view, another month, no navigation elsewhere.
Lint + consistency + contrast + full suite green. REV-0176; memory
`feedback_top_month_stepper`.
