# DR-1600: The picture at the PoeTech door's top right, and its menu

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (the family app's header on every screen; no schema, no money moving, no new road)
**Type:** decision
**Area:** `app/src/components/HeaderAuthButton.jsx`, `TopNavRow.jsx`; `app/src/components/shell/AccountMenu.jsx` (new), `LoveCornerMenus.jsx`, `PersonalizeSheet.jsx`; `app/src/lib/poetech-account-rows.js` (new); `app/src/poe-financial-mvp-v28.jsx` (existing lines only, 5171 unchanged); `app/src/index.css` (`.acct-*`); `scripts/door-account-probe.mjs` (new), `scripts/chrome-layout-probe.mjs`
**Sent in by:** Darrell, 2026-11-19, with a screenshot of poetech.us/poetech-app/?view=admin on his tablet beside the Love Corner's open account menu on his phone: *"What happened to the image in the top right corner of PoeTech App for getting access like the Love Corner App?"*; earlier, *"I also like the picture options in all apps especially PoeTech App... too make sense?"*
**Pairs with:** DR-1579 (the Love Corner menu, row by row; this is its `re-review: 2026-11-26` item), DR-1483 (the Love Corner header), DR-1046 (the header opens tucked away), DR-0342 (My profile), DR-0438 (chrome never grows)

## Context

His screenshot was the **collapsed** header: "Show header", the brand, "Text size". Since DR-1046 a device with no saved choice opens that way. The account (`HeaderAuthButton`: the face and name opening My profile, Log out under it) rendered only inside the **open** header's wrapping controls row, so on the header most people see there was no picture at all, and when open it sat wherever the row's wrapping put it, not at the top right.

## Decision

1. **The picture sits at the top right, open or collapsed.** Open: a round 40px picture (and the name from `sm` up) outside the wrapping controls row, as the header's last item. Collapsed: the picture alone in the tab row, right of the tabs and left of the chevron; that row never moves to the big-text bottom bar, so it stays at the top at every text size. Signed out, both places show the same Log in box, now at least 36px tall.
2. **One menu frame for every door.** The Love Corner's menu is now `shell/AccountMenu.jsx`, with rows passed in as data. The Love Corner hands in its ten rows unchanged; the PoeTech door hands in its own.
3. **A row is offered only where it has a real place.** `lib/poetech-account-rows.js` names each row's destination; a view row appears only when that view is in the reader's own tab list (`lib/nav-items.jsx`), so the menu never opens a door the tab row would not.
4. **The PoeTech menu floats over the page.** Inside the header (a `.ts-chrome-region`, zoomed back by the text-size step) px and vw sizes shrink; drawn in a layer on `<body>` with px sizes it holds one size at every step, stays inside the screen, scrolls when short on room, and carries the theme.
5. **Personalize on this door resets to PoeTech's look** (Heritage, DR-1046), not the church's, and says so.

## The menu on the PoeTech door, row by row

| Row | Opens | When shown |
|---|---|---|
| My Profile | the My profile dialog (picture, name, house) | always (signed in) |
| My Church | Church → My Record | the reader has the Church tab |
| Messages | Messages | the reader has the Messages tab |
| Subscription | About (the plans) | the reader has About |
| Appearance & Accessibility | Personalize My App (theme, text size, voice, speed) | always |
| Admin | Admin | the reader has the Admin tab (governors) |
| Log Out | sign-out | always |

**Left out, each with its reason:** Give and Contact the church (the church's own rows; this is not its door); Notifications (the bell beside the picture in the open header is the one list); Share · Install · Help (their controls sit in the open header). A test keeps each out, and a test fails if a row is added without a proven place.

## What was measured

Real Chromium, the built app (`VITE_SUPABASE_URL` = the CI stub), `?view=overview`, signed in through the e2e stand-in and signed out.

- **Before the menu was made to float (CI subset, 8 cases):** 5 of 8. Menu rows 29px at Larger and 22px at Largest and Big Print; at Big Print 390px the menu 118px wide and 37px above the top of the screen.
- **After (CI subset):** 8 of 8. Picture 40x40px in every case; open header 12px from the right edge on a phone, collapsed 41 to 45px (the chevron's width); menu inside the screen, rows 44px or more, the first and last rows the topmost thing at their centers. Signed out, the Log in box 53-54x36px.
- **Full matrix:** FULL_MATRIX_LINE
- **Beside the sidebar (from 1024px):** the tab strip steps aside there (DR-1046), so nothing in the collapsed row grew and it packed left: the chevron sat at x=377 of 1812px on `main` (x=438 with the picture beside it). The picture's slot now takes the slack (`ml-auto`), so the picture and the chevron hold the right edge: chevron right edge 1812 of 1812px after.
- **Harness corrections found on the way (not app changes):** a signed-in first visit stacks the Arrivals list, the profile picker and the welcome card over the page, so the probe starts past all three as a person would; tabs scrolled out of the tab strip were counted as under the picture until boxes were clipped to their scrolling ancestors.

## Verification

- `poetech-door-account-picture.test.jsx`: 19 tests; run against the pre-change `HeaderAuthButton`, `TopNavRow` and shell, 8 of the then-15 failed (the rest are pure row rules with no old version, and the "nothing else changes" guards).
- `home-and-the-menu-go-where-they-say.test.jsx` (DR-1579, 19) still passes with the Love Corner menu on the shared frame.
- The layout probe (`chrome-layout-probe.mjs`) runs the 8-case subset on every push; its selftest shrinks the picture to 13px and throws the menu 400px off screen, and requires A2 and A4 to trip. Run here: it tripped four (control 13x13px, picture 13x13px, menu at -400..-128px, menu covered), and the probe's own verdict was `SELFTEST-BREAK OK`.
- **Found, not fixed here (pre-existing on `main`):** the layout probe's hideaway selftest breaks the tab strip at 1812px, where the sidebar has replaced the strip, so it trips nothing (`main`'s build, same break: header 1580/1580). At 768px the same break trips invariant 12 only (header 2696/768), and the pass requires two, so the break itself needs redesigning, not just a new width. It belongs to the hideaway pass's owner, not this feature. `re-review: 2026-12-03`
- The Love Corner menu was checked for the same shrink: it is drawn beside its bar, not inside the zoomed region, so it is not affected.
- **Not verified:** not run on his tablet or phone. Signed in is a stand-in with no data behind it: each row is proven to open its surface, not what a real member sees there. The stand-in is not a governor, so the Admin row was seen in the unit tests only, not in the browser. `re-review: 2026-12-03`
