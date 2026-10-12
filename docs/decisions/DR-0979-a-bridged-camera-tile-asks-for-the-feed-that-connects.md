# DR-0979: A bridged camera's tile asks for the feed that connects

**Date:** 2026-10-12
**Status:** accepted
**Area:** `infra/nas-cameras/cams_forwarder.py` (`sd_source`, `ensure_bridge_roads`)
**Amends:** DR-0809 (a bridged camera's SD twin was the bridge's `-sub` stream)
**Principle:** DR-0076 (measure, then prove to catch), DR-0108 (review our ways)

## Context

Darrell, 2026-10-12: "Wyze cams work through wyze with no issues or failed streaming video... why not ours!!!?!!!!!!". With it he sent a screenshot of the Wyze app showing Front Door View, Front Cam, Garage Doors, Basketball Cam and a fifth camera, all live between 07:16 and 07:17.

So the cameras, their firmware and Wyze's cloud were healthy at that moment. The failure is on our road.

## What was measured

- **cams-diag run 37980447085 (2026-10-09 19:32 UTC).** 30 of 31 cameras ride the wyze-bridge road; only `front_cam` is on go2rtc's direct road. Every `-sub` the bridge tried timed out at the camera:
  - `[front-door-view-sub] [-13] IOTC_ER_TIMEOUT`
  - `basketball-cam-sub`, `outside-7-sub` and `garage-front-yard-sub` failed the same way.
- **The wall asks for those feeds.** Any wall of more than one camera asks each tile for its `<id>_sd` (`app/src/lib/cameras.js`). For a bridged camera, `_sd` was `<uri>-sub` (`sd_source`, DR-0809). A wall of bridged cameras therefore asked only for the one feed that never connected.
- **camera-health run 38244680618 (2026-10-12 11:45 UTC).** `front_cam` (direct) answered in 315 ms with 130,771 bytes. `basketball_cam` (bridged) answered nothing after 5,010 ms.

## Impact

Every tile on the wall for 30 of 31 cameras waited on a stream that never arrived, while the Wyze app showed the same cameras live. One opened camera (the main stream) could work while the wall around it stayed dark.

## Decision

1. **`sd_source()` on a bridge line returns the bridge's main stream**, and an old `-sub` line reads back to main.
   - A substream is a second session to the camera.
   - The main stream is the session the bridge already holds, and the bridge serves several readers from one session.
   - A tile is small on the screen either way.
2. **The road sync moves a stored `-sub` twin to the main stream once.** It is judged from the path of the URL go2rtc reports, so a line with credentials cannot loop. It is reported as `sd_main`.

## Not changed here (each measured, each with its owner)

- **Cold start on every request.**
  - The bridge runs `ON_DEMAND=True`, so each 5 s snapshot and each reconnect starts the camera session from nothing. go2rtc gives up at about 5 s, and "Timed out connecting" appears in the same log.
  - Keeping cameras warm costs NAS and home bandwidth (DR-0806 measured 2.03 MB/s for 16 streams), so it needs a per-camera measurement first.
  - re-review 2026-10-19, with a fresh cams-diag after this change lands.
- **Browser straight to the Funnel.**
  - The live app calls the Funnel address cross-origin because Cloudflare has invoked no Pages Function since 2026-10-09 (#2057).
  - This is Cloudflare-side; no code here reaches it.
- **Cameras the NAS cannot reach directly** (DR-0807/0809). These are cameras on 192.168.4/7/11.x, cameras at 805 on 10.0.0.x, and twelve cameras whose firmware lacks DTLS. They need Darrell's hands:
  - firmware updates in the Wyze app;
  - a route from 192.168.1.26 to those subnets;
  - an always-on Tailscale node at 805.

## Verification

- `cams_forwarder.py --selftest`: **368 checks, ALL PASSED**. Two checks were re-pinned to the main stream, and two were added:
  - an old `-sub` twin is moved with exactly one call and nothing else moves;
  - once on main, the twin is left alone (no loop).
- **Proven to catch:** with `sd_source` put back on `-sub`, five checks fail by name.
- **Not yet observed live.** The proof is the next cams-diag after the NAS takes this file (services-sync), showing bridged `_sd` streams reading the main path and wall tiles drawing frames. re-review 2026-10-19.
