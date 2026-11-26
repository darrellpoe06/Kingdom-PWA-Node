# DR-1660: Every app states WCAG 2.1 AA, honestly

**Date:** 2026-11-25
**Status:** Accepted
**Tier:** B (public-facing statement in every door)
**Type:** product
**Area:** `app/src/lib/accessibility-statement.js` (new), `app/src/components/shell/AccessibilityStatement.jsx` (new), `app/src/components/shell/PersonalizeSheet.jsx`, `app/src/__tests__/accessibility-statement.test.jsx` (new), `app/src/lib/legibility-health.json`
**Sent in by:** Darrell, 2026-11-25: "Make sure WCAG 2.1 AA is being honest about ourselves and make sure we're good" and "I need references to the WCAG 2.1 AA etc inside all apps."
**Pairs with:** DR-0076 (no claim without evidence), contrast-guard, legibility-guard, DR-1657 (contrast fixes on the new look)

## Context

No app named the accessibility standard it is held to, and nothing told a reader where the app stands or how to report a barrier.

## What was measured

- axe-core 4.10.2 (WCAG 2.0 / 2.1 A and AA rules) at 390px on the rendered page, each confirmed rendered first: download door + Governor switch, Learn home, and the Watch, Read, Listen and Study lesson views: 0 violations. The first run scanned a crashed, empty page; it was discarded, and the rendered check now guards against that.
- axe could not judge contrast for text over pictures and gradients. Exact computed CSS ratios settled the solid surfaces (one real failure, fixed in DR-1657); words over photographs are not measured to pass.
- legibility-guard: 441 of 454 pages pass; 13 are tracked debt and may not get worse.

## Decision

1. **The shared "Appearance & Accessibility" sheet**, which every door opens, carries the statement: the standard by name with the W3C link, what is measured, what is not yet proven, the date checked, and a "Report a barrier" box on the feedback pipe.
2. **Its numbers are read from the guard's own file**, never typed, so the statement moves with the measurement.
3. **It never claims full compliance**; a test fails it if it does.

## Impact

- Every app references WCAG 2.1 AA and tells the truth about where it stands.

## Verification after merge

- `accessibility-statement.test.jsx`: 4 of 4. The four suites that render the sheet: 61 of 61. legibility-guard: no new violations.
- Darrell opens Appearance & Accessibility and sees the statement.

`re-review: 2026-12-09`
