# DR-1642: What the page counts, the page can show

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (one button's color class, a second button and a count line in the Kids Zone lesson library; no schema, no data)
**Type:** decision
**Area:** `app/src/components/kids/KidsZone.jsx` (`LessonLibrary`); `app/src/__tests__/kids-buttons-are-never-colorless.test.js` (new gate)
**Sent in by:** Darrell, 2026-11-24, on the live Kids lesson library an hour after it deployed, with two screenshots: *"Saying the number of lessons with no way to see them..."*
**Pairs with:** DR-1629 (the library), DR-0381 (a hollow surface), DR-0076 §3 (a gate proven to catch), LESSONS P15

## Context

DR-1629 shipped the library showing 24 lessons with a "Show more" button for the rest. On the live page the count read 337 and nothing visible led past the first 24.

## What was measured

His screenshot shows an empty white box beside Back. In `kids-zone.css` the base `.kz-act` rule sets white text and no background; a color comes only from a second class (`plain`, `blue`, `violet`, `orange`, `green`, `teal`). The button was written `kz-act` alone: white words on a white panel. Every other `kz-act` in `components/kids/` named a color; this was the only one that did not.

Why the tests passed: they pressed the button by its test id and counted the lessons that appeared. Nothing looked at whether a person could see it. The real-browser check of DR-1629 photographed the top of the list, not its foot.

After, in Chromium on the built app at 946 px: "Show 24 more" is white on `rgb(142, 68, 240)`, 274 by 48 px; "Show all 337" is drawn in the Back button's ink-on-white; the count reads "337 Kids lessons · showing the first 24"; after Show all, 337 lessons are on the page. White on the zone's blue measured about 4.0 to 1, so blue was not used for the new button; violet measured about 4.9 to 1.

## Impact

A child or a grown-up can reach every lesson the page counts, 24 at a time or all at once, and the page says how many are on screen.

## Decision

1. "Show 24 more" is drawn in violet; "Show all N" sits beside it; the count line says how many are showing until all are.
2. A Kids Zone button always names its color. A test reads every `kz-act` in `components/kids/` and fails on one that names none.
3. A surface is looked at where its controls are, top and foot, before it is called done.

## Verification

`kids-buttons-are-never-colorless.test.js` 3 green: the stylesheet's base rule is still white with no background; every `kz-act` names a color; proven to catch on the exact line that shipped. `kids-zone-render.test.jsx` 11 green: the count line, both buttons' words, Show all reaching the total. Computed styles read in Chromium as above. After merge: the deploy run and `site-health`, then the library's foot seen on his phone (DR-0104).

## What is NOT in this record

White on the zone's blue is under 4.5 to 1 wherever `kz-act blue` is already used. `re-review: 2026-12-01`.
