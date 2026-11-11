# DR-1424: Learn is a quick link under Soul, so the lessons and courses open in one tap

**Date:** 2026-11-11
**Status:** Accepted
**Tier:** A (navigation chrome; no data, no schema, no new section)
**Type:** feature
**Area:** `app/src/lib/nav-items.jsx` (`NAV_QUICK_LINKS`, `navGroups`), `components/ChromeDock.jsx` (More), `components/shell/SideNav.jsx` (laptop rail), the shell's two nav handlers
**Sent in by:** Darrell, 2026-11-11, with a screenshot of the phone's More menu (Soul: Church, Study, Library, Academy). He asked for the Learn tab, the lessons and courses, as a quick link there too.
**Pairs with:** DR-1046 (one nav list, three places), DR-0065 (build it in the app), DR-0076 (press it, see where it went)

## Context

Learn is not a section of its own. It is Church's Learn tab (`view: 'church'`, `churchView: 'learn'`). Reaching it from More took two taps: Church, then Learn in Church's tab strip. The section ids are a contract read by `VALID_VIEWS`, `FEEDBACK_AREAS` and the deep-link parser, so a new `learn` id would have broken that contract.

## What was measured

- **Where Soul is drawn.** `NAV_GROUPS` (`nav-items.jsx:201`) feeds both the phone's More menu (`ChromeDock`, through `navForDock`) and the laptop rail (`SideNav`).
- **The gate.** Church's Learn tab is in its tab strip with no gate of its own, and `access-gate.js:79` allows `learn` on the church door. Anyone who can open Church can open Learn.
- **The shell budget.** Both handlers changed on their existing lines. `monolith-budget-guard` reads 5185 lines, holding the frozen 5185.

## Impact

A reader taps More, then Learn under Soul, and lands on the lessons and courses. On a laptop, Learn sits under Soul in the rail. While Learn is open, the button is marked as the current page.

## Decision

- **A quick link is a door, not a section.** `NAV_QUICK_LINKS` holds `{ key: 'learn', group: 'soul', view: 'church', churchView: 'learn' }`. `navGroups` attaches each link to its group as `links`, and only when the section it opens is in the reader's list. So it is gated exactly as Church is, and the nav contract gains no id.
- **Order.** It comes after Academy, so the four buttons he already knows do not move.
- **Routing.** The More menu calls `onNavigate('church', null, 'learn')`, and the shell sets Church's tab before the view. The rail calls `onQuickLink(q)`, which does the same.

## Verification

`learn-is-a-quick-link-under-soul.test.jsx` runs 8 cases on the real components:

- Soul holds Church, Study, Library and Academy, and then Learn, which opens Church on Learn.
- No quick-link key enters `navItems()`.
- The church door alone still gets Learn.
- **Proven to catch:** with Church out of the reader's list, or on an assistant account, no Learn door is drawn.
- **The More menu, pressed.** The Soul row's button order ends with Learn. Pressing it calls `onNavigate('church', null, 'learn')` and closes More, and it reads as current while Learn is open.
- **The laptop rail, pressed.** It calls `onQuickLink` with Church and Learn.
- **The shell's source.** It routes both handlers to `setChurchView`, and Church renders `ChurchLearn`.

Along with the neighbouring nav suites, 74 of 74 pass. `contrast-guard`, `legibility-guard`, `feedback-area-guard`, `interconnect-guard` and both budget guards pass.

**Not verified here:** the signed-in More menu in a real browser. Signed out, localhost serves the public front door, which has no dock. It is the first item in the post-deploy live review (DR-0104).
