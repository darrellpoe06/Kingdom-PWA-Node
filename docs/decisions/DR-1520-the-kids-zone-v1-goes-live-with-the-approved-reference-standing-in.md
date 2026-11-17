# DR-1520: The Kids Zone v1 goes live with the approved reference standing in

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** B (child-facing surfaces inside the church door; no schema, no auth, no RLS, no money; nothing written about a child)
**Type:** decision
**Area:** `app/src/components/kids/*` (KidsZone, TeensZone, KidsAdventure, Storybook, Theater, WordBuilder, WhoAmI, GrownUps, MemoryAndBadges, GuideArt, kids-zone.css), `app/src/lib/kids/guides.js` (`interimFor`), `app/src/lib/kids/theater.js`, `app/src/components/YouthZone.jsx`; previews in `docs/design/love-corner-kids/2026-11-17-app-preview-*.png`
**Sent in by:** Darrell, 2026-11-17: *"I want to get The Love Corner Kids Zone LIVE as soon as possible. I do not want to wait until all the artwork, animations, and future game features are completed... Remove any visible developer placeholders such as 'ART COMING,' 'SCENE COMING,' or 'INTERIM CUTOUT' from the public experience. Use the approved artwork or polished temporary designs instead."*
**Pairs with:** DR-1508 (the Kids Zone's engines and surfaces; amended here on the stand-in), DR-1456 (the Youth Zone), DR-0076 (verification), DR-0093 (no public child profile), DR-0075 (perpetual improvement), DR-0104 (review the live push)

## Context

DR-1508 §7 built the Kids Zone on one held branch and ruled that a character shot whose render had not landed shows "a labeled slot that says what is coming". On 2026-11-17 Darrell saw the running app: every interior page was dominated by hatched COMING boxes, and the lesson's quiz and the badge shelf still wore the church's night theme inside the cream world. He asked for the actual app with the approved children, then for a launch of what is built, with no developer placeholder visible to a child or a parent.

## What was measured

- Before the pass: 24 story pages, 11 tiles and headers and 2 hero scenes rendered a hatched slot; the quiz text measured `#F6ECE9` on `#241617` through the night theme's utility-class remap inside `.kz`; the Who am I? clue printed `\201C` because the stylesheet's `quotes` value was double-escaped; the Noah tile's title crossed its art.
- After: nine screens walked at 360, 390 and 414 px in Chromium: 0 elements past the viewport, 0 tap targets under 36 px; `kids-*` and `youth-zone*` suites 132 green; the UI-standards set and the legibility guard green; lint clean.

## Impact

A child opens a finished-looking zone today, with the same two approved children on every screen, and nothing on it reads as unfinished. The registry still knows which 54 renders are owed (`SHOT_LIST`, `data-needed`), so each one replaces its stand-in in place with no other change. Nothing about a child is stored (DR-0093 holds).

## Decision

1. **The stand-in is the approved reference, with nothing written on it.** `interimFor(id)` names the crop that stands in for each shot: a guide's portrait for a shot of that guide, the pair for a shot of both, the open Bible with the page's narrator for a story scene. No mark, pill or label is drawn on it. A shot nothing approved can stand in for (the teens' own guides) shows a quiet gold emblem with no words. This amends DR-1508 §7's "labeled slot".
2. **Honest statuses stay; developer statuses go.** The Theater shelf says COMING SOON for a planned episode and never IN PRODUCTION for one no one is producing; the church channel plays, on a tap, until an episode is published.
3. **The collection replaces, never redesigns.** A landed file under its shot id flips the registry and the render takes the stand-in's place; the layout, copy and data do not change for it.
4. **Launch is Darrell's word.** The PR carries `hold` until he approves the final screens; merge = deploy (DR-0054); the live push is then reviewed on a phone as a user meets it (DR-0104).

## Verification

- `kids-zone-render.test.jsx` proves every character on the home is the reference (`img[data-interim]` under `/lovecorner/kids/`) and every stand-in names a registered shot; `kids-storybooks-and-theater.test.js` pins the shelf labels and that nothing is watchable before it is published.
- The previews in `docs/design/love-corner-kids/2026-11-17-app-preview-*.png` are the running app, not a mockup.
- `re-review: 2026-12-01` — the first landed renders from batch 1, and the live review on a phone after the merge.
