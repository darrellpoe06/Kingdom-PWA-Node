# DR-1158: A reconnect hangs up the old stream first — a detached video element keeps downloading, so every blink added a live view

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a bug fix in the tab's live player; no NAS change; no schema; no money)
**Type:** bug fix (the camera road, DR-1097 nineteenth read)

**Area:** `app/src/components/Cameras.jsx` (`hangUp(el)`: pause, drop the source, clear `srcObject`, `load()`; called at the top of both live players' `open()` and in both `endedOnItsOwn` paths), `app/src/__tests__/cameras-render.test.jsx` (+1 proven-to-catch case).

**Principles:** DR-1097 (the camera road is measured, read by read); DR-0776 (measure, do not claim; proven to catch); DR-0799 (a tile is tended; a frozen picture reconnects); DR-0833 (a live view comes back by itself, never a hand); DR-0125 (the runner is the team's eye).
**Declared by:** Darrell, 2026-10-21 04:58 UTC, six screenshots of the Cameras tab with no words: every NAS-road tile black ("Reconnecting in 24 s (the browser could not open this stream)", "the picture froze for 10 s", "no picture after 20 s", "reconnected 10×") while the Wyze WebRTC tile played.

---

## Context

The blink DR-1097's sixteenth to eighteenth reads chased was measured from the NAS outward: the forwarder keeps how each live view ended, cams-diag reads 90 s of the phone's road, and both said the road carries a stream. What neither could show was how many streams one phone was holding open at once.

## What was measured

- **The road, at the time of the screenshots** (cams-diag run 39547175167, 05:01 to 05:05 UTC, 805 north, the phone's own asks through the Funnel): frame 200 in 7.0 s; a ticket; live MP4 first byte at 1.5 s, 8.4 MB over 90 s, longest gap 1.5 s, media clock 1.003× the wall, still flowing at 90 s. Loopback the same. The road was fine for one viewer.
- **The camera witness** (run 39546501024, 04:54 UTC): 13 of 13 cameras answered a frame on the NAS, none silent.
- **The NAS's own ledger of live ends, read at 05:01 and 05:05:** about 33 live views ended together at roughly 04:59:30, all "viewer-left" (the tab hung up), with lengths from 92 s to 404 s, and the SAME camera open many times over at once: 805 north 217 s, 243 s, 285 s, 355 s and 391 s; the east floodlight 145 s, 167 s, 203 s, 263 s and 404 s; the north-east camera 222 s, 248 s, 288 s and 362 s. Six tiles, one phone, thirty-three streams. The forwarder's `MAX_LIVE` is 32.
- **The code path:** when a tile's view ends on its own (`error`, `ended`, the freeze rule, the first-frame clock), `endedOnItsOwn` flips `ended`, the `<video>` is no longer rendered, and `open()` later sets a new `src` with a new nonce on a NEW element (`key={st.src}`). The old element was unmounted and never told to stop. A detached media element keeps its download running; the tile's cleanup (`pause`, `removeAttribute('src')`, `load()`) ran only on unmount of the whole tile or when it was released behind the large view.

So each reconnect added a stream rather than replacing one. Six tiles reconnecting ten times is sixty downloads through one Funnel to one phone; the pictures froze under the load, the freeze rule reconnected again, and the grid cascaded to black while a single probe of the same road flowed for 90 s.

## Decision

Before any reconnect, and the moment a view ends on its own, the tile hangs up the element it has: pause, drop the source, clear `srcObject`, `load()`. The same in both live players (the tile and the large view) and at the top of `open()` as a backstop. Nothing else changes: the reconnect cadence (DR-0833), the roads, the tickets and the NAS are as they were.

## Impact

A tile holds at most one live download at a time. The Funnel carries six streams for six tiles, not thirty-three. The NAS ledger should show, per camera, one open view per watching device.

Deferred, with a why and a date: a NAS-side brake (at most N concurrent live views per camera, the newest replacing the oldest) would protect against any future tab that misbehaves the same way. It is not in this change because it edits the forwarder's live loop under load and deserves its own selftest and a cams-diag run with the grid open, and shipping it beside the root-cause fix would blur which change healed the grid. `re-review: 2026-10-23` — read the live-ends ledger after a day with this build: if any camera still shows overlapping views from one phone, the brake ships then.

## Verification

- `cameras-render.test.jsx` (40): PROVEN TO CATCH — with `hangUp` stashed out, the new case fails ("the broken element was not paused and reloaded without a source"); with it, the broken element is paused and reloaded with no source and the reconnect opens a new element. The thirty-nine existing cases, including the reconnect cadence and the first-frame deadline, still pass.
- `cameras.test.js`, `camera-window-keeps-the-picture.test.jsx`, `feature-presence.test.jsx`: green. Lint 0.
- The live proof is the NAS ledger on the deployed build: `GET /cams/streams/health` `live_ends` with the grid open on Darrell's phone, one view per camera.
