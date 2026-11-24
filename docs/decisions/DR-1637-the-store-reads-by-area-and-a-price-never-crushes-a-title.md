# DR-1637: The store reads by area, and a price never crushes a title

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (how the store's shelf is laid out; no price, product, checkout or entitlement changed on a Tier C surface)
**Type:** decision
**Area:** `app/src/components/Storefront.jsx`
**Sent in by:** Darrell, 2026-11-24, two screenshots of `poetech.us/poetech-app/?view=store` with no words, then *"Keep in mind the DRs"*. Read against his words of the same hour: *"Not a scroll of death... sections"* and *"a place to go for more information the same courses"*.
**Pairs with:** DR-1449 (the storefront; Tier C), DR-1448 (the product line), DR-1633 (areas first), DR-0432 (departments derived), DR-0076

## DRs reviewed

- **DR-1449**: one public surface; the server's answer is what is for sale; one catalog entry shape. Nothing here touches `store-catalog.js`, `store-pricing.js`, the checkout request or the delivery path.
- **DR-1448**: a course's access is free for a spiritual department and PoeTech+ otherwise, derived. The label is unchanged; only where it is drawn moved.

## What was measured

On his screen (946 px wide, two columns): a course whose price reads "Included with PoeTech+ ($39/mo)" had its title set one word to a line; forty-five course cards ran in one scroll. In `Storefront.jsx` the price sat beside the title in a flex row with nothing holding the title's width.

After, on the built app: at 946 px the narrowest course title is 349 px of a 445 px card; at 390 px, 270 of 366; page scroll width equals the viewport at both. Eight courses show, with twelve area buttons whose counts add to 45, and "Show the other 37 courses". `storefront.test.jsx` 8 green (the sizes included); `the-sovereign-storefront.test.js` 17 green, unchanged.

The store says 45 courses and Learn says 51: the store reads the 45 registered courses, and Learn also mounts the six Eternal Algorithms courses, which are built apart and never reach the shelf.

## Impact

A visitor reads every course's title whole, sees the areas at a glance, and reaches any course in two taps. What is for sale, and at what price, is exactly as it was.

## Decision

1. A price of ten characters or fewer sits beside the title; a longer one sits under the subtitle. One price per item.
2. The course shelf opens on eight courses with a button for the rest, and a row of area buttons, each the courses' own department with its count. An area shows all of its courses.
3. A course opened by a shared link is never hidden behind the button.
4. The shelf is set to be read (his words after the first fix: *"The words look condensed... Can't read the title of the book as good... it should be easy and nice on the eyes"*). Measured before, at 946 px and 390 px: titles 16 px, subtitles 11 px italic, descriptions 12 px, counts 11 px, buttons 36 px tall. After: a book's title 22 px, a course's 19 px, descriptions 15 px with relaxed leading, subtitles 14 px upright, the smallest words 13 px, buttons 44 px, more room in and between cards; two columns begin at 768 px, not 640. All in rem, so large print still scales it; a test refuses any card text under 0.8125rem and any italic class.

## What is NOT in this record

The six Eternal Algorithms courses are not on the store's shelf. Adding them puts new listings on a public Tier C door and needs their access tier read first. `re-review: 2026-12-01`.
