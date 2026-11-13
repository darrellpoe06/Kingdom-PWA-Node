# DR-1509: The coloring page is a picture, not a form

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (the same derived page, redrawn; no schema, no data, no route change)
**Type:** decision
**Area:** `app/src/lib/coloring-page.js` (the picture library, `sceneElements`, `sheetElements`, the sheet), `app/src/components/ColoringSheet.jsx` (`SheetSvg` reads the same element list), `app/src/__tests__/a-coloring-page-for-every-lesson.test.js` (the reviewed shapes re-pinned after a look)
**Sent in by:** Darrell, 2026-11-13, with a screenshot of a live sheet (a thin outline title, a reference, three words, a bare cross and crown on white): *"We can do way better than this... can't we?!!!!!!!!!! Better"*
**Pairs with:** DR-0865 (the page is derived from the lesson, never retyped), DR-0866 (it fits the paper; the shapes were looked at; proven to catch), DR-0459 (the verse verbatim), DR-0075 (perpetual improvement), DR-0076 §4 (measure, don't claim)

## Context

The sheet was honest and unprintable to love: every word was the lesson's own, every verse verbatim, and the picture was four icons floating on white with a title in 1.5px outline. A child was handed a form. Darrell said so from the live app.

## What was measured

- The old sheet drew text runs and 100×100 icons at a computed scale, nothing else: no frame, no scene, no writing lines, one stroke weight for titles and words alike (`coloringSvg`, before).
- Every one of the 309 Living Lesson sheets was rendered in Chromium after the redraw and its widest text run measured: the first pass put 2 sheets 4px past the ink area with the bold rounded title face; with the title fitted to 28px less than the ink area, the widest run ends at 722px, the ink area's edge, on 0 sheets past it.
- The 16 shapes were rendered on one contact sheet and looked at (DR-0866's rule): no faces, no gesture that reads wrong, every piece with several closed regions.

## Impact

Without this, the one piece of the lesson a six-year-old receives looked unfinished and taught nothing about care. With it the same derived content arrives as a coloring-book page: a framed sheet with a name line, the title in bubble letters inside a banner, the reference set bold, the verse in dotted trace letters on a dashed writing line, a composed scene (two hills, a path, sun, clouds, grass and flowers, with the lesson's own pieces standing on the ground or hanging in the sky), and the words to trace in boxes on writing lines. Nothing about a lesson is retyped; the derivation (`coloringPage`) is untouched.

## Decision

1. **The page is drawn from one element list.** `sheetElements(page)` yields rects, lines, paths and text runs in order; the printable string and the React sheet both read it, so they cannot drift.
2. **Pieces carry a place.** Each symbol says `sky` or `ground`; `sceneElements` composes hills, a corner sun (unless the lesson's own sun is in the sky), clouds, two far birds when no sky piece is present, a dotted path, grass and flowers, then stands the ground pieces on the hills and hangs the sky pieces above, each with a white backing so the hill line does not cut through a shape a child is coloring.
3. **The title is bubble letters, the verse and the words are traced.** A rounded bold at 2.6px stroke with `paint-order: stroke` for the title; dotted strokes on dashed writing lines for the verse and the five words.
4. **The model stays the gate; Chromium is the witness.** `EM` stays 0.58 and the gate still measures every run against the full ink area; the title is fitted with 28px of slack for its wider face, and the real render across all 309 sheets is recorded above.
5. **No character is drawn here.** The two guides' line-art for the sheets is a render of the approved reference (`girl-lineart`, `boy-lineart` in the artwork brief), never a drawing in this file.

## Verification

- `a-coloring-page-for-every-lesson.test.js` 28 green (verbatim verse, derived words, the fit gate over every sheet, the reviewed-shapes gate re-pinned after the look); `the-coloring-page-can-be-reached.test.jsx` 13 green; lint 0; `format-guard` OK.
- Measured in Chromium: 309 sheets, widest run 722px against a 722px ink edge, 0 past it. Two real sheets rendered and read: "Ten Healed, One Made Whole" and "How Long Before It Came?".
- **Not yet verified:** a print on paper from a phone; the live reviewer walk after merge (DR-0104). `re-review: 2026-11-20`.
