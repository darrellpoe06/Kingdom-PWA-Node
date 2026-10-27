# DR-1237: The cameras are on the front page — one tile after the welcome, one predicate for who sees it, and a line read from the road

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (additive: a tile on both homes and a nav gate that admits a grant the registry already admitted; no schema, no money, no route renamed; the shell did not grow)
**Type:** surface + fix
**Area:**
- `app/src/lib/surface-access.js` (`canSeeCameras`, the one predicate)
- `app/src/lib/cameras-tile.js` (new: `CAMERAS_TILE`, `readCameraTile`, `cameraTileLine`, `latestFrameAt`)
- `app/src/components/CamerasTile.jsx` (new: the tile)
- `app/src/components/LifeHub.jsx`, `app/src/components/BigPictureDashboard.jsx` (the tile, first after the welcome, on both homes)
- `app/src/lib/nav-items.jsx` (the Cameras entry asks the predicate), `app/src/surfaces.js` (re-exports it), `app/src/poe-financial-mvp-v28.jsx:4742` (the render gate asks it; the shell's line count is unchanged at 5193)
- `app/src/lib/life-hub.js` (the "See the cameras" quick action is gone: the tile is the door, DR-1196)
- `app/src/__tests__/the-cameras-are-on-the-front-page.test.jsx` (new, 9 cases, proven to catch), `app/src/__tests__/life-hub.test.jsx` (pins moved)

**Amends:** nothing. **Grounds:** DR-0756 (the cameras in the app), DR-0778 (access is given by the owner; the grant lives on the device), DR-1210 (a worker's gift is saved on his device), DR-1046 (the Life Hub is the home), DR-1196 (no two doors to one place), DR-0061 (reality-trace), DR-0076 (measured, not claimed; proven to catch), DR-0078 (the shell cannot grow).
**Principles:** APP-IS-PRIMARY, REALITY-TRACE, VERIFICATION-DOCTRINE, ROLE-CAPABILITY-MODEL.
**Declared by:** Darrell, 2026-10-27: *"shouldn't we see the camera option on the front page inside the PoeTech App?"*

## Context

The cameras existed as a view and were reachable from four places, none of them the front page a family member lands on. The sidebar's Life group listed Cameras for `isFamilyMember` only (`nav-items.jsx:109`); the shell rendered `view === 'cameras' && isFamilyMember` (`poe-financial-mvp-v28.jsx:4742`); the Life Hub's quick action "See the cameras" was the 13th of 16, so the default airy density (8) cut it; and `HubCamera`'s own Cameras button is drawn only once the device already holds a key and a camera answers. On the home itself there was no option that said "Cameras".

The nav and the shell gate also disagreed with the registry. `surfaces.js:100` declares `requires: 'cameras'`, whose rule (DR-0778) is the family OR a grant on the device, but both gates asked the family email alone. So a 1099 worker who was given cameras in Poe Properties (DR-1210; `CameraAccess.jsx:320` saves the grant token on his device) could open the grant link and still find no Cameras entry and no Cameras view inside PoeTech.

## What was measured

**Reality trace (DR-0061).** Real reads: `GET /cams/list` with the device's credential (`cameraCredential({ bridge: bridgeToken() })`, the family key or the grant), which answers only the cameras that credential opens; `GET /cams/streams/health` with the same credential, whose per-camera `last_seen` is stamped by the forwarder's own sampler (`StreamHealth.camera()`, `cams_forwarder.py:3015`); and, for a device with no key, the unauthenticated `GET /cams/health`, whose `stream_health.cameras` and `last_sample_at` come from the same sampler's `snapshot()` (`:3030`). Real screens: `LifeHub.jsx`'s welcome section (the home, DR-1046) and `BigPictureDashboard.jsx`'s welcome panel (the Current View). Real predicate: `REQUIREMENTS.cameras.holds` (`surface-access.js:105`), already the registry's rule.

- The shell: 5193 lines before, 5193 after (`monolith-budget-guard` green). The predicate rides the existing `from './surfaces.js'` import line, and the gate line swaps `isFamilyMember` for `canSeeCameras(surfaceViewer)`.
- The new suite against three broken trees (tests kept): see Verification.
- **Not observed live.** This sandbox has no route to poetech.us or the NAS; the first live read is the re-review below.

## Impact

- A family member sees **Cameras** as the first thing after the welcome on both homes, 44px tall, with a line that says what the road says now: `3 cameras · last frame 14:05`, or `cameras not reachable from here`, or `4 cameras on the NAS · checked 14:05 · this device has no key yet`. Nothing is painted; an unknown never reads as fine.
- A worker holding a grant on his device sees the same tile, the Cameras entry in the sidebar's Life group, and the Cameras view in PoeTech, by the same rule Poe Properties used to give him the cameras.
- A tenant with no grant sees no tile and no entry: the predicate returns false and the component renders nothing.
- The quick action "See the cameras" is gone from the Life Hub, because the tile is the door (DR-1196: no action and tile open the same place). CRM moves into the family's sixteenth slot at photo density.

## Decision

One predicate, `canSeeCameras(viewer)` in `lib/surface-access.js`, decides who sees the cameras in PoeTech, and the nav entry, the shell's render gate and the front-page tile all ask it. The tile is the first element after the welcome on the Life Hub and on the Current View, opens view `cameras`, and reads its line from the camera road on mount and every minute while the page is visible. The Poe Properties Cameras tab is not changed: it is per door and per role (DR-1210), and the grant it saves on the device is what this predicate reads.

## Verification

- `the-cameras-are-on-the-front-page.test.jsx`: 9 cases on the real components and the real nav. **Proven to catch, three ways, measured:** (a) the mounts and gates reverted (shell, nav, both homes, registry) with the predicate and the tile kept: 2 of 9 fail (the nav/shell gate case; the first-after-the-welcome case); (b) the predicate put back to family-only: 3 of 9 fail (the predicate case, the nav/shell case, the grant-on-device case); (c) the line painted (`count: 31`, no frame): 3 of 9 fail (the family line, the grant line, the reader cases).
- `life-hub.test.jsx` (the moved pins), `hub-camera`, `surface-access`, `heritage-shell-navigation`, `big-picture-render`, `hub-layout`: green.
- `npm run lint` clean; `module-boundary-guard`, `monolith-budget-guard`, `decision-citation-guard`, `contrast-guard` green.
- `re-review: 2026-11-03` — read the tile on Darrell's phone and on a worker's device holding a grant; confirm the line matches the Cameras tab's own count and the forwarder's `last_seen`.
