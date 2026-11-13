# DR-1459: The comfort pass — the new surfaces measured at four widths and three text sizes

**Date:** 2026-11-12
**Status:** Accepted (Phase 4 of the Love Corner redesign; two shared primitives raised to the house floor)
**Tier:** A (geometry and heading order; no schema, no auth, no money)
**Type:** decision
**Area:** `app/src/components/SectionTabs.jsx` (the sub-tab chip), `app/src/components/shared.jsx` (TabScroll's show-all button), `app/src/components/ChurchMinistries.jsx` (family headings), `app/src/index.css` (the inline link)
**Sent in by:** Darrell's redesign brief, 2026-11-12 §8 and §10: "Large, readable text. Simple navigation... Large touch targets... Test mobile, tablet, and desktop layouts... Test accessibility and navigation with keyboard and screen readers." Pulled forward under DR-0236 after Phase 3 (DR-1458) went live.
**Pairs with:** UX-PATTERNS 2b (content scales, chrome is capped), 2g.2 (the 36px house floor, above the law's 24), DR-0315, DR-1455/1456/1458 (the surfaces measured), DR-0076 §4 (measure, do not claim)

## Context

Three new surfaces and a landing had shipped with source-level checks only. The brief asks that an eighty-year-old and a ten-year-old both find the app comfortable, and that is a geometry claim: it is true or false on a built page at a real width, not in a source file.

## What was measured

A Playwright pass over the built app served at the site root: the front door, the Youth Zone, the Institute and the Ministries landing, at 360, 390, 768 and 1440 px, at Normal, Largest and Big Print 44 text sizes, plus a forty-stop keyboard walk and the More sheet by keyboard.

| what | measured |
| --- | --- |
| horizontal overflow, 48 page-width-size combinations | 0 px in all 48 |
| reading text at Largest / Big Print (the `.lc-p` size) | 13.6 → 27.2 → 37.4 px: content scales |
| the display title (`.lc-h1`, a chrome region) at Largest | box 84 → 140 px while a paragraph went 41 → 245: capped, as 2b asks |
| keyboard walk from the hero, 40 stops | every focused button showed an outline; order follows the page |
| More sheet by keyboard | opens on Enter, closes on Escape (aria-expanded true → false), focus returns to More |
| targets under the 36px floor, before | the shared sub-tab chip at 30px (every SectionTabs `sub` row in the app); TabScroll's show-all at 33px on phones; the Youth Zone's inline Learn link at 32px wide |
| heading order, before | the Ministries landing's family titles were h3 under the page's h1 |
| targets under the floor and heading skips, after | 0 |

## Impact

Every sub-tab row in the app, not only the new ones, now clears the house floor; the show-all button on phones does too. The Ministries landing reads in order to a screen reader. Nothing moved, nothing was removed.

## Decision

1. **The sub-tab chip carries `min-h-[36px]`** (`SectionTabs.jsx`), and so does **TabScroll's show-all button** (`shared.jsx`): the house floor of 2g.2, measured rather than assumed.
2. **The Ministries landing's family titles are h2** under the page's h1.
3. **The inline Learn link in the Youth Zone is at least 36px wide.**
4. **The measurement is the record:** the probe script's findings table above is the evidence; a future pass re-runs the same measurement before claiming comfort.

## Verification after merge

DR-0107: deploy on the merged SHA, boot check green, `site-health.yml` UP. Recorded here when done.
