# DR-1579: Home goes home, the menu goes where it says, the header keeps its buttons

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (congregation-facing surfaces; no schema, no money moving, no new road)
**Type:** decision
**Area:** `app/src/lib/church-home-section.js`; `app/src/components/ChurchHome.jsx`, `ChromeDock.jsx`; `app/src/components/shell/LoveCornerHeader.jsx`, `LoveCornerMenus.jsx`; `app/src/index.css` (`.lch-*`); `scripts/chrome-layout-probe.mjs` (door-header invariants 19 and 20)
**Sent in by:** Darrell, 2026-11-18, from the Love Corner door on his phone (the Fold's cover screen), relayed by the lessons session with his screenshots: *"Bottom left home button should work... bring it back home... same as the logo header etc... back to the original location for the start.... When you click watch... it moves... home should go back to the top..."*; *"Messages and contacts don't work... check all of them...."*; and a screenshot of the title running under the Aa button.
**Pairs with:** DR-1484 (the church bar), DR-1499 (a door lands on what it names), DR-1483 (the header and its menu), DR-1540 (the Aa button), DR-0438 (chrome never grows), DR-1575 (the same night's sheets)

## Context

Three reports from one door, each reproduced before anything was changed: in a real Chromium on the built app for the header, and with the real components mounted together for Home and the menu.

## What was measured (before)

- **The bar lit the wrong item.** The home's strip always has an open section and published its DEFAULT (Worship), so on a page nobody had moved the bar lit **Watch**, with the Welcome hero on screen. Home set the same tab again, asked for no section and scrolled nowhere; the logo did the same.
- **The header's church tabs were dead off the Church view.** `go` set the church sub-tab alone. Subscription and Admin leave the Church view; from there the logo, every strip tab and every All-sheet tile changed nothing on screen.
- **"Messages / Contact" opened no messages.** It opened the church home's About section.
- **The title ran under the buttons.** The name's box was 55 to 107px for 132px of glyphs: **36px under the Aa button at 360px**, and under search too, from 320 to 412px, signed in and out.
- **Found by measuring, not in the report:** the bar is a chrome region (zoomed back by the text-size step) and its sizes were px, which shrink. The menu, Aa and search buttons were **20px at Largest and 13px at Big Print**.

## Impact

A member who taps Home, the logo or the church's name is at the top of the door, with one bar item lit, whichever screen they were on. Every row under their picture opens what it names, and a test fails if a row is added without a proven place. At the two largest text sizes the header's buttons are buttons again.

## Decision

1. **Home is the door's starting place.** `requestChurchHomeTop()` drops any waiting section request; a mounted home puts its strip back on its opening section; the caller scrolls the page to the top. The bar's Home and the header's logo and name all call it.
2. **The home publishes a section only once the reader asked for it or tapped it.** An untouched page publishes none, so Home lights and nothing else does.
3. **A church tab names the Church view too**, so the logo, the strip and the All sheet come back from About, Admin or Messages. The strip marks no tab while the Church is not on screen.
4. **Two rows, each going where it says:** *Messages* opens the app's Messages view (the bell's message arrivals already land there on this door); *Contact the church* opens the About section.
5. **Every size in the header bar is rem.** On a phone the name takes two lines beside its controls; under 360px search rides the menu's sheet (its first field).

## The menu, row by row

| Row | Opens | Before | Now |
|---|---|---|---|
| My Profile | the My profile dialog | worked | unchanged |
| My Church | the My Record tab | worked on the Church view only | works from any view |
| Notifications | the bell's list | worked | unchanged |
| Subscription | the About view (plans) | opened; no way back by the header | way back fixed |
| Messages / Contact | Messages; the church's contact | the About section, no messages | two rows |
| Give | the Give panel | worked | unchanged |
| Share · Install · Help | the All features sheet | worked | unchanged |
| Appearance & Accessibility | Personalize | worked | unchanged |
| Admin | the Admin view | opened; no way back by the header | way back fixed |
| Log Out | sign-out | worked | unchanged |

## Verification

- After, same harness, 320 to 412px signed in and out: nothing under any control; controls 36 to 40px at every text size; bar 58 to 61px. Signed out at 360px the tagline is cut by its own ellipsis (69 of 88px); signed in it is whole.
- `home-and-the-menu-go-where-they-say.test.jsx` (19): eight fail on the pre-fix components.
- Probe door-header pass: 9 cases, invariants 19 (the name under no control) and 20 (every control 36px or more); its selftest forces 13px buttons and requires 20 to trip.
- **Not verified:** not run on his phone. Signed-in was a stand-in session with no data behind it, so what Messages, About and Admin SHOW for a real member was not seen, only that each opens.
- **Not built here:** the picture's menu on the PoeTech door (his *"I also like the picture options in all apps especially PoeTech App"*). Today that door has `HeaderAuthButton`: the face and name open My profile, with Log out under it. `re-review: 2026-11-26`.
