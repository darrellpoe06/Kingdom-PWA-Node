# DR-0776 — Live in every tile, and the link measured, not pre-empted

- **Status:** accepted
- **Tier:** A (app behaviour; one default cap raised; a read-only measurement added to `/health`)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`MAX_LIVE` 32; `live_note` / `live_snapshot`; `/health` gains `live_open`, `live_bytes_per_s`; selftest), `app/src/lib/cameras.js` (`loadLiveTiles` / `saveLiveTiles`, `liveTileBudget`, `liveTrafficLine`), `app/src/components/Cameras.jsx` (`TileLive`, the toggle, the traffic chip), tests.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: measure, don't claim), DR-0774 (sight; the caps are mechanisms), DR-0075 (perpetual improvement), DR-0065 (the app is the artifact)
- **Grounds:** Darrell 2026-10-07: *"Live views... all the time... I should see the seconds moving and wind blowing... etc...."*, and the same hour: *"Why do we need Tailscale if it's all local... ?!!! We should have the best camera streaming..."*

## Context

After DR-0774 the tab had sight: frames every five seconds in every tile, full motion one tap away, a wall for several. Darrell's tinyCam grid shows motion in every cell; a frame every five seconds is a slideshow beside it. He asked for the obvious thing: live, everywhere, always.

## What was measured

- The screenshot at 06:58 local: every tile a still ("frame 13 m ago" on the old build), a timestamp burned into each by the camera; the next still comes five seconds later at best.
- tinyCam: every cell a running stream.
- `/health` could not say how many live streams were open or how many bytes were crossing the Funnel; the one real unknown (Tailscale Funnel relay throughput, undisclosed) had no instrument.
- His link: 1 Gbps symmetric fiber; the NAS and the cameras share one LAN at that house.

## Impact

Without this the tab is a picture frame, not a window; the family glances and leaves. With it the tab shows the house as it is, and the number that decides how far that scales is on screen instead of guessed at.

## Decision

1. **Every reachable camera's tile is a live player by default.** `TileLive` is the reconnecting player stripped to the picture; a camera that has no picture yet keeps the snapshot road so its reason shows and recovery is noticed; a camera that gives up through all its reconnects drops back to that road with its reason. The choice is a per-device toggle ("Live in every tile · on/off"), default on.
2. **The NAS's live cap rises to 32** (one per camera and then some) and stays a mechanism in `/health`.
3. **The link is measured.** The forwarder counts every byte it hands a live viewer (MP4 bodies, HLS segments) in a ten-second window and reports `live_open` and `live_bytes_per_s` in `/health`; the tab shows "N live streams · X Mbit/s through the Funnel". A cap, if the Funnel ever needs one, is set from this number.
4. **The live-tile budget** is the NAS cap minus the wall; tiles past it fall back to frames.

## Why Tailscale is in the road at all, and the better road at home (answered, DR-0777 builds it)

The app is served from poetech.us over HTTPS. A browser on that page may not call plain `http://192.168.1.26` (mixed content), and the house has no port opened on its router. Tailscale Funnel is the one road from that public page into the house without opening a port: the request leaves the house to Tailscale's ingress and comes back in. At home that is a detour, and the Funnel's throughput is the one limit we do not control. The best streaming at home is direct: the NAS serving the same camera road over HTTPS on the LAN under a name we own, and the app taking that road whenever it answers and the Funnel only when away. That is DR-0777, the next decision, built in this session.

## Verification

- Forwarder selftest: default `MAX_LIVE` 32; the ten-second window drops old samples and reports bytes per second; an open stream is counted; `/health` carries both fields.
- `cameras.test.js`: live tiles default on, remembered off, broken store tolerated; the budget is cap minus wall, never negative, 32 when unsaid; the traffic line reads in the right unit.
- `cameras-render.test.jsx`: with the default on, each camera tile is a live player with its own ticket, no snapshot is polled for them, the header shows "2 live streams · 2.0 Mbit/s through the Funnel", the toggle falls back to frames every 5 s and the choice is kept on the device. The first draft of the live-tile set rebuilt a `Set` on every frame and restarted the sweep in a loop; the suite caught it (a 5 s timeout) before anything shipped, and the sets are now keyed by content.

## Follow-ups

- DR-0777: the LAN-direct HTTPS road, chosen automatically at home.
- The Funnel number on the OpsBoard beside the uptime strip. `re-review: 2026-10-21`.
