# DR-1455: The Love Corner's front door — red, black, white with a touch of gold, the real Bishop, and the Institute's own card

**Date:** 2026-11-12
**Status:** Accepted (Phase 0 and 1 of the redesign built; Phases 2–6 named with their gates)
**Tier:** B (the church's own front door; COLG-facing identity; no schema, no auth, no money)
**Type:** decision
**Area:** `app/src/components/lovecorner/LoveCornerHome.jsx`, `app/src/components/ChurchInstitute.jsx`, `app/src/lib/{church-tabs.jsx,home-week.js,church-institute.js,church-home-section.js,lovecorner-palette.js}`, `app/src/components/{ChurchHome.jsx,ChromeDock.jsx}`, `app/src/surfaces.js`, `app/src/lib/nav-history.js`, `app/public/lovecorner/`, `app/src/index.css`
**Sent in by:** Darrell, 2026-11-12, the redesign brief ("The Love Corner — Where Love Lives"), then three words the same day: the Institute gets "its own prominent, beautifully designed featured card"; "make the colors red black white with a touch gold"; and the real logo and Bishop Gwin's photograph, attached. Mockup approved: "Perfect keep going."
**Pairs with:** DR-1060 (the church's red, measured), DR-0099 (red is the Blood), DR-0258 (the church's own install scope), DR-0677 (derived, not a second list), DR-1428 (a lesson link opens in the app the lesson belongs to), the 2026-11-12 Institute note, DR-0076 (measure, never claim), DR-0061 (reality-trace)

## Context

The church face had the right data and twenty tabs in one scrolling strip, with no front door a child, a visitor or an eighty-year-old would recognize as theirs. The brief asked for a mobile-first homepage around the existing tabs, keeping every one of them, with the Institute featured, the Word as a Learning Zone, a Youth Zone, and a bottom bar. The mockup and plan went first (session note of the same date); the build followed approval.

## What was measured

| what | measured |
| --- | --- |
| emblem gold / purple / red pixels (lovecorner-icon-512.png) | 2,789 / 4,207 / 1,754 |
| text pairs the homepage draws, lowest AA ratio | 9 pairs, all ≥ 5.64 (gold ink on gold tint 6.1) |
| forbidden pairs, proven failing | gold on red 2.47; deep gold on white 3.53 |
| registered Learn courses the Institute can open today | 4 of 45 |
| shell line count before / after | 5186 / 5186 |
| new tests / touched existing suites | 58 green / 321 green |
| built app on a 390×844 phone | front door, dock, seal 160px and portrait 480px loaded |

## Impact

A child, a visitor and an eighty-year-old now land on one front door with the Bishop, the next service and eight doors, on a phone bar of five. Every one of the twenty tabs is still reachable in at most two taps, by test. The Institute is visible from the homepage and says only what is true.

## Decision

1. **The palette is red, black and white with a touch of gold, measured from the emblem** (`lib/lovecorner-palette.js`): the heart's red deepened to carry words (`#C03222`, DR-1060), the ring's black, the field's white, the cross's gold `#CFA63C`. Gold text sits on black only (8.14:1); on white and red gold is a fill under ink. Every text pair the homepage draws is pinned at AA by `lovecorner-palette.test.js`, with the two forbidden pairs proven to fail.
2. **The front door mounts ABOVE the Church home's existing sections**, which are unchanged: hero (the Love Corner Experience seal and Bishop Gwin's portrait, his real files at web sizes, never generated), Watch gated by the same `liveStatus` the pinned bar uses, the day-aware feature cards and week strip from the church record (`lib/home-week.js`; announced events filtered to the future, the honest card when none), eight quick doors, the Learning Zone, the Youth Zone door, four ministry groups, and the Institute's featured card with two buttons.
3. **One list of Church sub-tabs** (`lib/church-tabs.jsx`) feeds the strip, the phone's bar and its More sheet. The church door's bar is Home · Watch · Word, with Give and More; More lists every gated sub-tab, grouped. Inside PoeTech the platform bar is unchanged. `church-tabs.test.js` is the preservation gate: every valid sub survives, proven-to-catch.
4. **The Institute is its own surface** (`churchView 'institute'`, display name "TLC Theological Institute", code id `institute` because `tlc` is the therapy practice here). Only the four registered Learn courses are listed as available; programs without one read Planned; enrollment stays closed until the office's settings read confirmed and open (`launchState`); the credential note disclaims accreditation and degrees, and a test forbids any claim to the contrary.
5. **Doors open in place**: a section door asks the Church home for a section through `lib/church-home-section.js`, and the home's strip runs controlled, so Watch, Prayer, Events and Connect never fly the screen (UX-PATTERNS 2e).

## What is NOT in this record

The Youth Zone surface with badges derived from learner rows (Phase 2), the grouped Ministries landing (Phase 3), the senior comfort and a11y pass beyond the rings and floors kept here (Phase 4), the Institute's enrollment schema (Slice B, Tier C) and tuition (Slice C, the Bishop's word) — each named in the session note with its gate. `re-review: 2026-11-19` for Phase 2 to have started.

## Verification after merge

DR-0107, done 2026-11-12: #2644 squash-merged as `a4cc5593` at 21:40Z; the lane dispatched Deploy (Cloudflare Pages) run 43312569540 on that SHA, green at 21:46Z, its real-browser boot check reading BOOT OK on poetech.us, pages.dev, the Moore door and `?view=church` (the tab that now mounts the front door). DR-0125: `site-health.yml` run 43313591668 at 21:47Z: verdict UP, served build `a4cc559` = main, fresh. The phone-level walk of the live door (the portrait, the Institute card opening its surface) is the DR-0104 reviewer pass Darrell makes on his own phone; the sandbox has no route to the site.
