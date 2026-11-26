# DR-1681: The new look is measured at every text size, and big print never squeezes a title or a row

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every member's Learn and lesson screen at large text; no schema)
**Type:** fix
**Area:** `scripts/learn-structures-probe.mjs` (new), `app/src/components/learn-studio/learn-studio.css`, `lesson-experience.css`
**Sent in by:** Darrell, 2026-11-26: "Font size impacts etc... through the structures thoroughly", after the record card squeezed its words ("Long skinny letters... looks weird").
**Pairs with:** DR-1678 (Your record in the new look), DR-1679 (every theme), DR-0147 (Big Print 44)

## Context

The chrome probe measures the header and the classic reader at several text sizes; nothing measured the new look's own structures, which is how a squeezed record card reached a phone.

## What was measured

A real-Chromium sweep on the built app at 390 px (Normal, A+, A++, A+++, Big Print 44) and 360 px (Big Print 44), on the Learn home, the Relationships section, a lesson's cover, Read and Study: 24 surfaces. Normal through A+++: no sideways scroll and no squeezed words anywhere. At Big Print 44, four findings:
- The lesson cover title (`.ls-cover-title`) at 77 px on a 342 px column: 1,440 px tall, about four letters a line; the same for the lesson screen title (`.le-title`, 1,521 px).
- At 360 px, the course shelf cards (`.ls-mini-title`, fixed at 62% of the screen) squeezed each title to about 175 px, about four letters a line.

## Decision

1. **Titles never run four letters a line**: the cover and lesson titles are capped at the larger of 1.15 rem and 9 vw. At normal sizes nothing changes; at big print a title stays a little above the body text.
2. **Rows wrap at big text**: a compact row's words move below the thumbnail when there is no room beside it (`flex-wrap`, the body's basis 11em).
3. **A shelf card grows with the text** (`min(max(240px, 13em), 86%)`).
4. **The sweep is a standing instrument**: `node scripts/learn-structures-probe.mjs [dist]` exits 1 on any sideways scroll or squeezed text block, at every text size.

## Impact

- Big Print 44 readers get readable titles and rows on a phone.

## Verification after merge

- Measured 2026-11-26 on the rebuilt app: `learn-structures-probe: 24 surface(s) measured across 6 size/width cases ... OK -- no sideways scroll, no squeezed words, at every text size.` (before: 4 findings at Big Print 44).
- Live: Learn at A44 on a phone; the cover title reads in a few lines and the course rows show the title under the picture.

`re-review: 2026-12-03`
