# DR-1304: The porch button is not under the picture tabs — the only control on the front door's big picture could not be pressed

**Date:** 2026-11-03
**Status:** Accepted
**Tier:** A (one CSS rule on the Poe Properties front door; no data, no schema, no money, no change to who may open a camera — the NAS still decides that, DR-1176)
**Type:** fix
**Area:** `app/src/components/PoePropertiesWelcome.jsx` (`.pp-cam-open` in `WELCOME_CSS`), `app/src/__tests__/the-porch-button-is-not-under-the-picture-tabs.test.js` (new, 3 cases, one proven-to-catch)
**Found by:** Darrell, 2026-11-03, on his phone, with a screenshot of the Poe Properties door: *"The button to open the porch camera is too close to the picture tab... user's can't open the camera it's too close!!!!!!!!!! Fix it!!!!!!!!!"*
**Pairs with:** DR-1176 (the big picture can be the porch — the button this record moves), DR-1236 (the big picture rotates the advertised apartments — the tabs it collided with), DR-0061 (reality-trace: observe the surface the user actually uses), DR-0076 (§3 proven-to-catch, §4 measure don't claim), DR-0239 (form factor is MEASURED, dimension 4)

## Context

DR-1176 put one control on the front door's big picture: **Open the porch, live**, bottom-left of the frame, for a device whose credential opens a front-of-house camera. Six days later DR-1236 made the same frame a carousel of the advertised apartments and put a row of picture tabs along its bottom edge — one 44px tap target per picture, the full width of the frame, at `z-index:3`.

The two records never met. The button stayed where DR-1176 left it, at `z-index:2`, bottom-left, 36px tall and 0.6rem off the bottom edge. The tab row is 44px tall and anchored at the bottom. Every pixel of the button was under the tab row, and the tab row was on top. A tap on **Open the porch, live** opened the second picture.

Darrell's screenshot shows exactly this: the button sits on the tab bars with the second bar lit red, and the words of the first slide's caption run under it.

## What was measured

In a real Chromium, with `WELCOME_CSS` as shipped and the carousel markup HeroCarousel draws (12 pictures, caption, tab row), at two viewports. Sample points: the button's centre and the midpoint of each of its four edges, read with `elementFromPoint`; then a real `mouse.click` at the centre, with a capturing listener recording who received it.

| viewport | button box (px from top) | tab row box | rects overlap | sample points received by | real click received by |
|---|---|---|---|---|---|
| 390x844, before | 172–208 | 173–217 | yes | tab, tab, tab row, tab, tab (0 of 5 on the button) | a picture tab |
| 1440x900, before | 268–304 | 270–314 | yes | tab, tab, tab row, tab, tab (0 of 5 on the button) | a picture tab |
| 390x844, after | 26–62 | 173–217 | no | button, 5 of 5 | the button |
| 1440x900, after | 26–62 | 270–314 | no | button, 5 of 5 | the button |

Not "too close". **Fully covered.** The only control DR-1176 shipped on this frame had been unreachable since DR-1236 landed, on every width.

## Impact

For six days, from the merge of DR-1236 to this fix, no tenant, household member or owner could open the porch from the front door on any device: the one control that promotes the service (DR-1176, *"the camera stream shows how access works"*) answered every tap by changing the picture. Nothing was lost on the NAS side — no ticket was minted, no slot spent — because the press never reached the button. The cost was entirely a promise shown and not kept, on the first screen every applicant, tenant, worker and owner meets.

The lesson for the ledger: two records that each measured their own control on the same frame never measured the frame together. DR-1176's suite proves the button renders and opens the stream; DR-1236's suite proves the tabs render and switch the slide. Neither could see the other's box, because jsdom has no geometry. This is the layout-defect class the chrome-layout probe exists for, and the probe cannot reach this button on CI's runner (no camera credential there), so the standing guard is the CSS-fact gate below plus a one-time measurement in Chromium. A future control added to this frame is added to that test's map of its edges first.

## Decision

**The porch button moves to the top-left corner of the frame and stacks above everything in it.** `.pp-cam-open` is now `top:0.6rem; left:0.6rem; z-index:4` (fixed-unit rem, as every frame length in this stylesheet is).

Why that corner and not a nudge: the frame's edges are already spoken for. The brand band is top-right. The caption and the tab row are the whole bottom edge. The live player's own chips are bottom-left ("waiting for the first picture"), top-right ("reconnected") and bottom-right (the direct-road chip). Top-left is the one corner nothing else claims, in both states of the frame — photograph and live. `z-index:4` is above the tab row's 3, so the button wins a tap even if a future frame shrinks until they meet.

Nothing else moves. The caption, the tabs, the band, the photograph, and the words under the frame are byte-for-byte what DR-1176 and DR-1236 shipped. Who may open a camera is unchanged: the NAS still returns only the credential's own cameras and refuses every other ticket.

## Verification

- `app/src/__tests__/the-porch-button-is-not-under-the-picture-tabs.test.js` — **3 tests, 3 passed.** It pins the two CSS facts that made the collision: the tab row owns the bottom edge full-width at 44px, so the button is anchored `top` (never `bottom`) and its `z-index` exceeds the tab row's.
- **Proven to catch (DR-0076 §3):** the suite rewrites the rule back to what shipped before (`bottom`, `z-index:2`) and requires the check to report *same edge*; it rewrites `z-index:4` to `3` and requires *stacked under*. Both trip.
- jsdom cannot measure geometry, so the geometry was measured once in Chromium (table above) and the CSS facts are the standing gate. The chrome-layout probe cannot stand this watch: on CI's runner the door holds no camera credential, so the button is never offered there. Said, not assumed.
- `the-big-picture-can-be-the-porch` (23), `the-words-alone-grow` (6, the fixed-unit sweep over this stylesheet) and `poe-properties-front-page` (12) all pass; `eslint` clean on both touched source files.
- **Not observed on poetech.us.** This sandbox has no route to the live site. Darrell's screenshot is the before; the after is the measurement above and the lane's deploy.
