# DR-1484: The door's bar carries seven tabs, and the home reads in the picture's order

**Date:** 2026-11-13
**Status:** Accepted (Phase C of the shell redesign)
**Tier:** A (navigation chrome and the homepage's order; no schema, no auth, no money)
**Type:** decision
**Area:** `app/src/lib/church-tabs.jsx` (`CHURCH_BOTTOM_NAV`), `app/src/components/ChromeDock.jsx`, `app/src/components/lovecorner/LoveCornerHome.jsx`, `app/src/index.css`, two inline edits in the shell
**Sent in by:** Darrell's two pictures of 2026-11-13 (seven dock tabs; the homepage's order) and the audit's two dock findings (the Watch tab never lit; Giving Book rendered nothing when locked).
**Pairs with:** DR-1483 (the header; All Features carries every tab, so the bar needs no More), DR-0677 (one list of church tabs), DR-1455 (the front door), DR-0076 §4

## Context

The door's bar carried Home · Watch · Word · Give · More, and the homepage ran hero → cards → doors → week → Learning Zone → Youth → ministries → Institute. The picture Darrell approved draws seven tabs and a different order: eight doors in a row, a Customize strip, the Learning Zone and the Kids & Youth Zone side by side, the Institute banner, then Ministries · Upcoming events · Family & community. Two bugs rode along: the dock read a section the shell never passed, so Watch never lit; and a non-office visitor to Giving Book got a blank page instead of a locked surface.

## What was measured

| what | measured |
| --- | --- |
| the bar on the built app | 7 buttons at 360 px and 390 px, one row, no horizontal scroll (the measurement is in the PR) |
| Watch | lights on the Worship section and Home yields to it; Events the same on Service times (test) |
| the homepage's order | doors → Customize → pair → Institute → trio, asserted by test-id order |
| the Customize strip | one event opens the Personalize sheet (test, and on the built app) |
| suites | dock 7, home 12, church-tabs, header, comfort pass green |

## Impact

On the door's phone bar: Home · Watch · Bible · Events · Give · Ministries · Institute, each 40 px wide so seven fit a 360 px phone beside the reader's slot; no More (the header's All Features sheet lists every tab) and no second bell (the header's never collapses). The homepage reads as drawn. Giving Book shows a locked surface to a visitor. The family app's bar is untouched.

## Decision

1. **`CHURCH_BOTTOM_NAV` is the seven tabs of the picture;** Give is the existing give button in its place; Bible opens Scripture; Events opens the home's Service times.
2. **The shell passes `churchHomeSection` to the dock**, and Home lights only while no bar tab claims the open section.
3. **The home's eighth door is TLC Institute;** Connect lives on as the Family & community card.
4. **The Customize strip asks the header for the sheet by one event**, so the home holds no second copy of it.
5. **Giving Book locks instead of vanishing** for a non-office visitor.

## Verification after merge

Recorded on merge: the PR, the squash SHA, the deploy run with BOOT OK, and `site-health.yml` UP (DR-0107 / DR-0125).
