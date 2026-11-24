# DR-1636: A long price wraps below the title, never squeezes it

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (layout of one card in the Store; no data, no price, no checkout change)
**Type:** decision
**Area:** `app/src/components/Storefront.jsx`
**Sent in by:** Darrell, 2026-11-24, two screenshots of `poetech.us/poetech-app/?view=store` on his phone, build 96863eb
**Pairs with:** DR-0239 (form factor measured, not eyeballed), DR-0075 (micro-upgrades to feel and flow), DR-0076

## Context

The Store's course cards must read on a phone; a price label must never take the title's room.

## What was measured

On his screenshot, each PoeTech+ course card ("Sovereign A.I.: Why We Build Local", "Project Management: Count the Cost") gave about half its width to the price "Included with PoeTech+ ($39/mo)". The title, its line, the walk-through count and the buttons sat in the other half, several words to a line ("Walk- / throughs / recorded: 0 / of 101."). The free courses beside them read normally.

Cause: the card's top row was `flex items-start` with the title column `flex-1` and the price unbounded. A long price takes its full text width before the title column gets any.

## Decision

The row wraps:
- The title column keeps at least 11 rem (`min-w-[11rem] flex-1`).
- The price sits at the right (`ml-auto text-right`).
- When both do not fit, the price drops to its own line under the title instead of squeezing it.

A short price ("Free", "$9.99") stays beside the title.

## Impact

Until it ships, the paid courses read worst on the screen most people use. The call obligates any card row with a long label to wrap, not squeeze.

## Verification

- `storefront.test.jsx` and the legibility guard pass (11 cases).
- Measured in Chromium on the built app (title width, title lines):

| width | before | after |
| --- | --- | --- |
| 360 | 77 px, 4 lines | 272 px, 1-2 lines, price below |
| 412 | 91 px, 4 lines | 324 px, 1 line, price below |
| 768 / 1024 | not measured before | 292-296 px, 1 line |

  Free cards are unchanged (240-292 px). The before-build reproduced his screenshot, so the measure catches the fault.
- On the live build: once deployed, the same store link shows the PoeTech+ titles at full card width. `re-review: 2026-11-25`.
