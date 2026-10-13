# DR-0877 — Guest Ready is nine subtabs, not one long scroll

- **Status:** accepted
- **Tier:** A (layout of an existing surface; no data or permission change)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/modules/properties/ReadinessTab.jsx`, `app/src/__tests__/properties-readiness-render.test.jsx`
- **Principles:** PERPETUAL-IMPROVEMENT (DR-0075), COMPREHENSIVE-REVIEW-STANDARD dimension 4 (form factor), SURFACE-SAYS-TRUTH
- **Grounds:** DR-0219 (the Guest Ready board), the Ways/documentation and DR surfaces this now matches

## The word, as spoken

Darrell, 2026-10-10, with a screenshot of the Guest Ready tab:

> "Long scrolling!!!!!!! Fix it so its tabs!!!!!!!!!!!!!!!!!!!!!!!! Like the
> Ways and documentation state also the DRs.... fix it...."

and, clarifying the shape he wanted:

> "Each list as a header in subtabs... make sense...."

## What was measured

Nine areas, **165 fixed tasks** (181 once a bedroom is named), rendered as nine
stacked `Card`s in one column. Reaching the Airbnb Listing list meant scrolling
past Construction, Kitchen, Bedrooms, Bathroom, Living/Dining, Supplies, Safety
and the Final Walk-Through — every time.

The "Progress by area" grid above was **already a picker**, and it only
expanded a section further down the same scroll rather than switching to it.
The per-section collapse control was a nine-tap workaround for a layout that
should not have asked in the first place.

## Impact

This changes what renders, so two existing assertions had to change with it,
and that is stated rather than quietly adjusted: the render test counted all
181 checkboxes on open, and 165 on an empty door. Both now select **"Every
area"** first and assert the same totals there. A new case pins that "Every
area" still produces the whole list in one pass — a landlord doing a final
sweep wants exactly that, so the old behaviour is kept rather than removed.

The honest totals did not move: "0 of 181 tasks completed" is still stated at
the top, and every area subtab carries its own `done/total`. The count did not
shrink; only the column did.

## The decision

1. **Each area is a subtab**, labelled with its short name and its own
   `done/total`, with the area's full name as the header of the list below —
   exactly the shape Darrell named.
2. **"Every area" remains**, as the last tab, for a single-pass sweep.
3. **The progress cards select the subtab** they describe, and carry
   `aria-pressed`, so the picker that already looked like a picker now is one.
4. **The All / Still needed / Completed filter is untouched** — it is a
   different axis (status, not area) and it was already correct.
5. The first area is selected on open, so the tab lands on work rather than on
   a wall of checkboxes.

## Outcome

**47 green** across `properties-readiness-render` (23) and
`properties-readiness` (24). New case: "Every area still gives the whole list
in one pass" (181). Changed cases name the area they need first, which is
itself the proof that one area renders at a time — they fail without the
selection. eslint clean.

Not done, with a date: the same nine-stacked-cards shape exists on other door
tabs with long lists (Systems, Files) and was not touched here, because
Darrell pointed at this one and the pattern should be proven on it first.
`re-review: 2026-10-24`.
