---
id: DR-0640
title: The one-tab row carries the brand; on the church door the lone "Church" tab row and the collapsed row become one row, and the brand shows in both places
status: accepted
date: 2026-09-24
type: ui
declared_by: Darrell
scope:
  - app/src/components/TopNavRow.jsx (new: the shell's top nav row, and the one-tab brand row)
  - app/src/components/TextSizeControl.jsx (BrandLockup shared by both places; TextSizeEscapeHatch gains `inline`)
  - app/src/index.css (.one-tab-brand--float, the phone order of the merged row)
  - app/src/poe-financial-mvp-v28.jsx (mounts TopNavRow; 46 lines lighter)
  - scripts/chrome-layout-probe.mjs (the one-tab pass, invariants 15-18, with a self-test)
  - app/src/__tests__/one-tab-row-carries-the-brand.test.jsx, the-header-comes-back.test.js, door-name-and-unread-count.test.jsx
principles: [REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), COMPREHENSIVE-REVIEW (DR-0239)]
grounds:
  - DR-0577 — the way back from the hideaway, in words, on the left
  - DR-0438 — the comfort row is a fixed bottom bar at Largest and Big Print
  - DR-0524 — the collapsed row renders at every size
---

## Context: his words

Darrell, 2026-09-24, 5:30 pm, on his Fold (1812 px wide), in The Love Corner with the header tucked away:

> "Why does the Church tab space need that? Can we save even more space if not... can we add another Love Corner etc tag in the space? Make sense?"

Asked whether the brand should then leave the collapsed row so it is not shown twice:

> "Both places are good... why not..."

## What was measured (reality trace)

The surface is the family shell, `app/src/poe-financial-mvp-v28.jsx`, on the church door (`?lovecorner=1`, or `?view=church` installed). It is not `TlcPublicDoor.jsx`. The shell filters the top tab list with `.filter(([id]) => (!churchDoorOnly || id === 'church') ...)`, so the door's top nav holds exactly one tab.

Rendered in Chromium on `/?lovecorner=1&view=church` with the header collapsed, before the change:

| width, size | collapsed row | top nav row | Church sub-strip starts at |
|---|---|---|---|
| 1812, Normal | 45 px, in the flow, above the nav | 43 px: ← →, "Church", ⌄ | 115 px |
| 390, Normal | 74 px | 39 px | 155 px |
| 320, Normal | 85 px | 39 px | 166 px |
| 1812, Largest / Big Print | fixed bottom bar | 42 px | 72 px |

**Why the collapsed row was at the BOTTOM in his screenshot.** It is intended. At Largest (A+++) and Big Print (A44), `index.css` makes `.ts-safe-sticky .ts-escape-hatch` a fixed bottom bar (DR-0438), so the way out of big text is on screen by construction. At Normal, Large and Larger it sits in the flow above the nav. His screenshot matches the Largest / Big Print state.

## Decision

When the top tab list holds exactly one tab, the row stops being a tab row (`components/TopNavRow.jsx`):

1. **No lone tab.** Back/forward stays on the left and the header chevron on the right. The single tab is not drawn: the sub-strip below already says "Church". Screen readers still hear it, through an `sr-only` "Church" marked `aria-current="page"`.
2. **One row, not two.** At Normal, Large and Larger the collapsed row (Show header, the brand lockup, text size) is mounted inside this row, so the lone tab row and the collapsed row become one row.
3. **Both places.** At Largest and Big Print the collapsed row is the bottom bar and leaves the top row, so the top row carries the brand lockup of its own. The brand is at the top of the screen and on the bottom bar, as he asked. The two lockups are one component (`BrandLockup`), so they cannot drift apart. With the header open the row carries the lockup too.
4. **On a phone, one way back per row.** At 320 px, "Show header" and the size dropdown needed 220 px, and 187 px were left once back/forward and the chevron took theirs. So below 640 px, while the collapsed row is inside the row, the way back and the dropdown share line one, the lockup takes the full width under them, and the chevron yields to "Show header", which does the same thing on the same row. At the bottom-bar sizes nothing yields.
5. **Many tabs: nothing changes.** The family shell renders exactly the row it rendered before.

## Measured after (same page, same states)

| width, size | top row | Church sub-strip starts at | saved |
|---|---|---|---|
| 1812, Normal | 45 px (one row) | 72 px | **43 px** |
| 390, Normal | 83 px (one row) | 125 px | **30 px** |
| 320, Normal | 83 px (one row) | 125 px | **41 px** |
| 1812, Largest / Big Print | 39 px, brand row; bottom bar keeps the brand | 69 px | 3 px |
| 390, Largest | 39 px, brand row; bottom bar keeps the brand | 87 px | -1 px |

At Normal to Larger a whole row is gone at every width. At Largest and Big Print, his state in the screenshot, the collapsed row was already the bottom bar, so there was no second top row to remove. There the lone "Church" row becomes the brand row at the same height, which is the "add another Love Corner tag in the space" half of his question.

## Verification

- `scripts/chrome-layout-probe.mjs`, one-tab pass (invariants 15-18) at 320 and 390 and 1812 Normal, 390 Largest and 1812 Big Print: all hold on this build. Run against the pre-change build, it fails 13 times: every case draws a lone tab row and has no brand in the top row, and every Normal case has the collapsed row as its own row. Its self-test puts a one-tab strip back and hides the brand, and must trip at least 2.
- `one-tab-row-carries-the-brand.test.jsx` (createRoot + act, no @testing-library). Proven to catch: `loneTab()` returning null fails 6 tests; returning the first tab of any list fails 2; dropping the collapsed row's brand when it is inline fails 2, here and in `door-name-and-unread-count.test.jsx`.
