# DR-0577 — The header comes back: the tab-row wrapper shrinks again, and the way back is in words

- **Status:** accepted
- **Tier:** A
- **Type:** fix (post-incident)
- **Date:** 2026-09-23
- **Scope:** `app/src/components/shared.jsx` (TabScroll's wrapper may shrink: `min-w-0 flex-1`); `app/src/components/TextSizeControl.jsx` (the tucked-away row carries a "Show header" button on the left); `app/src/poe-financial-mvp-v28.jsx`, `app/src/components/TlcPublicDoor.jsx` (both mounts wire it); `scripts/chrome-layout-probe.mjs` (the hideaway pass: invariants 12–14 at five widths, self-test breaks the wrapper); `app/src/__tests__/the-header-comes-back.test.js` (10 source pins)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §4 measure, §3 proven-to-catch), DR-0061 (observe the running surface), DR-0276 rule 3 (chrome is always reversible), DR-0565 (the change that introduced it), DR-0524
- **Grounds:** Darrell, 2026-09-23, on his Fold: *"It's hard to get to the edges of the app anymore?!!!!!!!! What happened to the features?!!!!!!"*; then *"Lost the whole header?!!!!!!!!!!!"*; then *"PoeTech App!!!!!!!!! Fix it now!!!!!!"*; and, when the cause was named, *"We were just making sure these buried tabs showed also..."*

---

## What he saw

The header was **tucked away** (the hideaway state, `poe-header-collapsed = 1` on his device): no wordmark, no account row, no voice or theme controls — only the text-size row and the tab strip. The one control that brings the header back is the chevron pinned to the right of the tab strip, and on his screen the tab strip ran off the right edge with no chevron in sight. Both messages were one defect.

## What caused it — measured, not guessed

DR-0565 (#1734, the evening before) added the Show-all control to `TabScroll`, and to place that control beside the scroll box it wrapped the box in a `w-full` div. Inside the header's nav row that wrapper is a **flex item**, and a flex item's `min-width` defaults to `auto` — the min-content width of its contents, which for a row of `nowrap` tabs is every tab laid end to end. So at any width where the tabs did not fit, the wrapper refused to shrink, the nav row grew past the viewport, and everything pinned to the row's right edge went with it. The scroll box inside never measured itself as overflowing either (its client width equalled its content), so the top nav never showed the very Show-all control the wrapper was added for.

Reproduced in a real Chromium against the built app at the Fold's 1812px, header collapsed:

| | before | after |
|---|---|---|
| nav row scroll width | 1953 px | 1812 px |
| hideaway chevron, right edge | 1953 px (x = 1912) | 1812 px |
| top nav shows Show-all | no | yes |

## What changed

1. **The wrapper may shrink.** `min-w-0 flex-1 w-full` on TabScroll's wrapper. In a block parent the pair is inert and `w-full` still fills; in the header's flex row it restores the shrink the scroll box relies on. The chevron returns to the screen and the top nav's Show-all appears when the tabs overflow — which is what "making sure these buried tabs showed also" meant.
2. **The way back is in words, on the left.** A way back that depends on an edge is not a way back. The tucked-away row (`TextSizeEscapeHatch`, the one thing that always renders while the header is hidden) now carries a **Show header** button with the chevron icon, `mr-auto` so it sits on the side the tab row never pushes off. Both header mounts pass the toggle in.
3. **The browser proves it, and can fail.** `chrome-layout-probe.mjs` gains the hideaway pass: with the header collapsed, at 360 / 768 / 1440 / 1812 / 1920 px, the header never runs past the screen, the chevron's right edge is on screen, the Show-header button is on screen, and an overflowing tab row offers Show-all. The self-test forces the wrapper to 2600px (the pre-fix shape) and must trip at least two invariants; measured: it trips two.

## A finding recorded, not fixed here

`TlcPublicDoor` and the PoeTech shell share one `localStorage` key for the hideaway. Tucking the TLC door's header tucks the PoeTech header on the same device. Whether that is intended (one preference per device) or a leak (one door's choice bleeding into another) is a decision, not a bug fix. `re-review: 2026-10-01`.

## Limits, stated

- The probe measured the built app in the sandbox; the fix is on his phone only after the lane deploys it. The proof he can make: tuck the header, and the **Show header** button is on the left of the text-size row, at every width.
- The row of top-level tabs is still wider than most screens. Show-all now appears on it; whether the top nav should wrap by default on a phone is the standing anti-sprawl question (the 2026-06-26 revert of the cluster nav), not this record.
