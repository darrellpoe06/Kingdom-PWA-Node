# DR-1483: The Love Corner door wears one header, and opens by night

**Date:** 2026-11-13
**Status:** Accepted (Phase A + B of the shell redesign; Darrell's "Go" on the previews)
**Tier:** B (front-door chrome and the door's default theme; no schema, no auth, no money)
**Type:** decision
**Area:** `app/src/components/shell/LoveCornerHeader.jsx`, `LoveCornerMenus.jsx`, `PersonalizeSheet.jsx`, `app/src/lib/theme-css.js` (the `night` theme, `CHURCH_DEFAULT_THEME`), `app/src/index.css`, the shell's one conditional mount
**Sent in by:** Darrell's shell brief, 2026-11-13 ("one beautiful, professionally designed mobile app"), his two pictures (the arrangement; "I still want the red black white and gold, but this is the design type"; "This one instead with the red colors"), and "Go" on the previews.
**Pairs with:** DR-1455 (the front door), DR-1060 (the church's red and white; the cream theme stays), DR-0524 (a device that chose keeps its choice), DR-0677 (one list of church tabs), DR-0076 §4, the audit note `docs/99-session-notes/2026-11-13-the-love-corner-shell-redesign-audit-and-previews.md`

## Context

The door's top carried 290 px of chrome above the hero signed out: the finance strip, a collapsible header with the brand in up to six places, the "free to read" line and two tab rows. Every control in it is real and stays; its presentation was the family app's, not the church's.

## What was measured

| what | measured |
| --- | --- |
| the built app at 390 px, signed out, before | 290 px above the hero; 36 controls in the top rows |
| after | the header is 67 px; the hero begins at 113 px; scroll width 390, no overflow |
| the All Features sheet | 14 tabs signed out, the same `churchSubTabs` list the dock draws, in its six groups; picking one closes the sheet and routes |
| Personalize | 12 theme cards, the registry's count; picking the cream Love Corner wrote `poe-theme-pref=lovecorner` and repainted |
| the Night theme | every class Midnight remaps, Night remaps (test); contrast guard PASS; legibility guard PASS with the baseline re-frozen so the app's existing inline-color debt is tracked under the second dark theme too, not counted as new |
| the shell | 5,178 → 5,174 lines; the budget re-frozen at 5,174 |
| suites | header render 8, Night 5, and the theme, door, dock, legibility and budget suites green |

## Impact

On the door only: menu · brand · search · bell · picture; the profile menu; the All Features sheet; Personalize My App; the finance strip and the hero's duplicate brand row gone. The family app's header is untouched. The door opens in the Night theme; the cream one is one tap away.

## Decision

1. **One header on the door, mounted where the old one was, only when `churchDoorOnly`.** Every old control has a named new place (the audit's §4a).
2. **`night` joins the registry beside `lovecorner`** with Midnight's whole remap table in the house's values (page #120909, card #241617, fill #8E2217, ink #F6ECE9, gold #E4B93E as text, #CFA63C as a fill under ink). `CHURCH_DEFAULT_THEME` is `night`; the family app keeps Heritage (DR-1046).
3. **Search is one box over church tabs and the course catalog**, reading only those registries.
4. **The Modal portals outside the themed wrapper**, so each sheet carries `data-theme` itself. A finding for the fix list: every themed modal in the app has this gap.

## Verification after merge

Recorded on merge: the PR, the squash SHA, the deploy run with BOOT OK, and `site-health.yml` UP (DR-0107 / DR-0125).
