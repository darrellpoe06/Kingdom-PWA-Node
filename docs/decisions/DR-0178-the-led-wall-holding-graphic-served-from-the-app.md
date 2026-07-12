# DR-0178 — The Sanctuary LED wall holding graphic, served from the app

- **Status:** accepted (Tier A — the church's OWN supplied art on a static full-screen page; no doctrine surface, no schema, no money, no auth)
- **Scope:** `app/public/lovecorner/wall/get-up.png` (the church's graphic), `app/public/lovecorner/wall/index.html` (the full-screen wall page), `app/src/__tests__/lovecorner-door.test.js` (proven-to-catch)
- **Date:** 2026-07-12
- **Principles:** APP-IS-PRIMARY (the app serves the wall, not a loose file), SPOKEN-TEACHINGS-BUILD-INPUT (church-supplied art is build input, always captured), AI-FOUNDATION-INTERNAL-OPERATIONS (a click today is a URL tomorrow), VERIFICATION-DOCTRINE (DR-0076), COMMUNITY-FIRST

## Directive

Darrell 2026-07-12, supplying the church's "Get Up!" series graphic (the CGLG emblem
with the church's own series art): *"This is for the Led Wall can you add this into
the laptop behind the wall?"*

## Reality-trace

The Sanctuary LED wall (LED Nation / Mirackle P1.99, 8×6 cabinets, ~16:9) is fed from
a laptop → NovaStar VX1000 (`lib/led-wall-golive.js`); during install it was held
**FROZEN on a still holding graphic**. There was **no app-served wall display** — wall
media resolves from a configurable base (`MEDIA_BASE_KEY`), and the holding graphic was
a loose still. The cloud sandbox has **no route to the church LAN / the laptop**
(con-no-sandbox-route), so the agent ships the app-side artifact and the human drives
the physical laptop → NovaStar step (Drive-Don't-Delegate: hardware the agent can't reach).

## Decision

1. **The church's graphic is a committed asset** — `public/lovecorner/wall/get-up.png`
   (the church's own "Get Up!" art, 1536×1024), part of the app and versioned, not a
   loose file that lives only on one laptop.
2. **The app serves the wall** — `public/lovecorner/wall/index.html` is a full-screen
   holding-graphic page: pure black field, the graphic centered and **letterboxed
   (`object-fit: contain`)** so nothing is cropped on the 16:9 wall (the source is 3:2),
   no scrollbars, cursor hidden, `noindex`, CSP-safe (no inline JS). The laptop behind
   the wall opens `poetech.us/lovecorner/wall/` fullscreen (F11) and feeds it to the
   NovaStar — **swappable** (drop a new PNG, point the `<img src>` at it).
3. **Proven-to-catch (DR-0076):** the render test pins that the graphic file exists, the
   page points at the real asset, letterboxes on black, and carries no `<script>` — so
   the wall graphic can't silently 404 or regress to a cropped/cluttered frame.

## Color note (DR-0099)

The graphic uses red heavily. Color Theology reserves **true red** only in the platform's
**own Scripture color code** (the in-app highlight palette, the Inductive/Precept markers).
This is the **church's own supplied series art**, not a platform Scripture-color surface —
so the reservation does not apply and the church's artwork is honored unaltered.

## Opportunities and constraints (routed)

- **Opportunity:** generalize to a swappable wall-playlist (multiple holding graphics,
  a schedule) served from the app — re-review `2026-07-26`.
- **Constraint (held):** the physical laptop → NovaStar feed + un-freeze is the family's
  hand; the agent cannot reach it and does not claim to have verified the wall itself
  (only that the page + asset deploy — the family's on-site look confirms the wall).

## Supersedes / pairs

Pairs with the Love Corner door set (DR-0174/0176/0177) and `lib/led-wall-golive.js`
(the wall's as-built state). No supersession.
