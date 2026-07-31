---
id: DR-0258
title: Two installable apps on one origin need DISJOINT install scopes — The Love Corner moves to /lovecorner/
status: accepted
date: 2026-07-31
tier: C
declared_by: Darrell (the 2026-07-31 install screenshots + "why it won't let me install both")
supersedes: the DR-0227 runtime manifest-link swap (retired)
builds_on: [DR-0133 (the church's own door), DR-0174 (install identity), DR-0227 (boot brand manifest), DR-0076 (verification doctrine), DR-0219 (spec-conformance review)]
principles: [VERIFICATION-DOCTRINE, REALITY-TRACE, MACHINERY-OVER-MEMORY (DR-0250)]
---

## Context

Darrell, 2026-07-31, with five screenshots from his fold: *"Comprehensive
review of the PoeTech App build and why it won't let me install both the Love
Corner App and claude keeps saying it's fixed even though it's not."*

The screenshots show Chrome on Android at `poetech.us/poetech-app/?view=admin`
→ menu → "Install and create shortcut" → **"This app is already installed —
Click to open the app instead."** The Love Corner is installed on the device;
PoeTech cannot be installed beside it. Two prior fixes (DR-0227's boot-time
manifest-link swap; the 2026-07-30 per-face dismissal keys) each fixed a real
bug — and neither unblocked the install, which is exactly the "keeps saying
it's fixed" credibility failure DR-0100 warns about.

## The SHOULD/ARE (DR-0219)

**SHOULD:** PoeTech and The Love Corner install side by side on one device as
two apps with their own names and icons (DR-0133/DR-0174).

**ARE (measured, `file:line`):** every installable manifest on the origin
shared ONE scope — `manifest.webmanifest` (`scope: /poetech-app/`),
`manifest-lovecorner.webmanifest` (`scope: /poetech-app/`, id
`/poetech-app/?view=church`), plus `manifest-moore` / `manifest-tlc` (same
scope). Chrome's install machinery treats a URL inside an installed app's
scope as belonging to THAT app — distinct `id`s did not save it (the
screenshots are the proof: ids differed and Chrome still said "already
installed"). Two aggravators: (1) the DR-0227 identity swap ran in a React
effect AFTER page load, and install identity is a page-load property —
mid-session `<link rel=manifest>` swaps are flaky by spec; (2) the
`/lovecorner/` door meta-refreshes in 0 seconds to `/poetech-app/…`, so no
user ever sat on a page whose static HTML linked the church manifest.

## Decision

1. **Disjoint scopes, one per installable app.** The Love Corner's manifest
   becomes `id: /lovecorner/`, `scope: /lovecorner/`,
   `start_url: /lovecorner/app/?view=church&lovecorner=1`. PoeTech keeps
   `/poetech-app/`. Neither scope contains the other.
2. **Each installable face is a SERVED PAGE whose static HTML links its own
   manifest.** A second Vite MPA input (`app/lovecorner/app/index.html`)
   serves the same app (same `/src/main.jsx`, same absolute
   `/poetech-app/assets/…` bundles) at `/lovecorner/app/` with
   `manifest-lovecorner` linked in markup. The DR-0227 runtime swap is
   RETIRED — post-split it would have made the in-app Church tab
   un-installable as PoeTech.
3. **The share door stays the church's front page** (`/lovecorner/` —
   previews as the church in a texted link) and now refreshes into
   `/lovecorner/app/…`, inside the church's own scope. `SHARE_DOOR_URL`, the
   QR posters, and the aliases are unchanged.
4. **In-app navigation stays in scope by construction:** `nav-history.js`
   `urlFor()` preserves `window.location.pathname`; auth redirects use
   `location.origin + location.pathname`. Verified, not assumed.
5. **The gate for the class (proven-to-catch):** `lovecorner-door.test.js`
   now FAILS if the church scope and the PoeTech scope ever overlap again, if
   the church app page stops linking its manifest statically, or if the vite
   config stops building the page. `pwa-prompts-render.test.jsx` pins that no
   runtime manifest swap survives.

## Migration (honest costs)

- **Existing Love Corner installs keep working** but carry the FROZEN old
  identity (scope `/poetech-app/`) — on those devices they still block the
  PoeTech install sheet. One-time step per device: uninstall the old Love
  Corner app, install PoeTech from `poetech.us/poetech-app/`, install The
  Love Corner from `poetech.us/lovecorner/`. Known installed base at this
  date: Darrell's own devices plus at most a handful of congregation phones.
- **Moore Divahs and TLC Therapy share the same collision class**
  (`scope: /poetech-app/` with runtime swaps in their door components). Not
  changed in this pass: Moore has a real installed customer base whose
  update path a scope change would freeze (a migration decision for the
  Governor), and TLC's door is still Tier-C-held. Both get the same
  split pattern this DR proves out — **re-review: 2026-08-07**.
- The Supabase auth redirect allow-list must cover
  `https://poetech.us/lovecorner/app/` for sign-in FROM the church app
  (dashboard value — verify on the first live sign-in from the new scope;
  part of the same re-review).

## Verification

Structural: the disjoint-scope gate + static-link pins + vite-input pin run in
CI on every merge. On-device (only provable on real hardware, DR-0076 §8):
after deploy, the install sheet at `/poetech-app/` must offer **PoeTech** and
at `/lovecorner/app/` must offer **The Love Corner**, with both installable on
one device. Until that on-device pass is reported, this DR claims the
structural fix only — never "it's fixed on your phone."
