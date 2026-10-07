# DR-0804 — Review of our streaming ways: every source, every browser road, every transport; what we have, what works where, what is next — and the camera road's witness after every change

- **Status:** accepted
- **Tier:** A for the witness (a read-only workflow against the NAS and a rolling issue); the review itself decides nothing that moves without its own record
- **Type:** orchestration (DR-0108 Ways review) + feature (the witness)
- **Date:** 2026-10-07
- **Scope:** `.github/workflows/camera-health.yml` (new), this record, `docs/reviews/REVIEWS.md` (REV-0256), `app/src/lib/help-content.js`.
- **Principles:** DR-0108 (review our ways), DR-0107 / DR-0125 (prove the deploy, prove the site; the runner is the eye), DR-0776 (the link measured, not pre-empted), DR-0782 (the live road chosen from what worked), DR-0798 (the stream health log), DR-0799 (SD for grids), DR-0621 (hold the hand of the process)
- **Grounds:** Darrell 2026-10-07: *"Review all options for streaming that we may or may not have currently that could also work... we want to perfect our way of doing this and make sure we have all best options available"* and *"ways that updates don't break the connections and if they do we fix them expedited based on them being prioritized"*; *"How can we use our infrastructure to support this platform ability to create a solid solution?"*

## Context — the ways, reviewed

**Sources (camera → NAS), what go2rtc 1.9.14 speaks and what we use:**

| source | in the app today | works where | note |
| --- | --- | --- | --- |
| Wyze (`wyze://`, native P2P, DTLS) | sign-in once (DR-0770); 31 streams | the camera's own LAN or a routed subnet; **23 of 31 resting** at 22:49 UTC: the 805 house (10.0.0.x) and the 192.168.4/7/11.x cameras time out on discovery from the NAS at 192.168.1.26; two report "only DTLS cameras are supported" (firmware, Gwell models) | the SD substream (`subtype=sd`) is now a twin per camera (DR-0799) |
| Ring (`ring:`) | sign-in in the app (DR-0803) | wherever Ring's cloud reaches | two-way audio supported by go2rtc |
| ONVIF / RTSP / RTSPS / RTMP | the add form (DR-0803) | the NAS's network; UniFi Protect speaks rtsps | the sovereign PoE backbone of DR-0050 |
| HTTP snapshot / MJPEG | the add form | anywhere the NAS can fetch | frames only |
| HomeKit (`homekit://`) | not in the app | needs pairing on go2rtc's own HomeKit page; a device pairs with one ecosystem | next, when a HomeKit camera is in the house |
| Google Nest (`nest:`) | not built | WebRTC Nest cameras only, through Google Device Access | not until someone can verify it (DR-0803) |
| Google sign-in to Wyze/Ring | not a road the makers offer | — | set the maker's own password once; said on the forms |

**Browser roads (NAS → the screen), what go2rtc offers and what we use:**

| road | in the app | latency | works where | note |
| --- | --- | --- | --- | --- |
| progressive MP4 (`/api/stream.mp4`) | yes (DR-0756; the default on Chrome/Firefox/Android) | a few seconds | everywhere but Safari/iOS | now tended: freeze watch + live edge (DR-0799) |
| HLS fMP4 (`/api/stream.m3u8?mp4`) | yes (Safari, iOS, Fire TV) | 6–10 s | native players | the ticket rides every segment line |
| MSE over WebSocket (`/api/ws`) | **no** | about 1 s | Chrome, Firefox, Android, Fire TV Silk | needs a WebSocket through the Pages Function and the Funnel; the strongest next road |
| WebRTC (`/api/webrtc`) | **no** | under 1 s | on the LAN at once; through the Funnel only with a TURN relay | the right road for a LAN-direct origin |
| frames every 5 s (`/api/frame.jpeg`) | yes (the always-works road) | n/a | everywhere | the fallback and the probe |
| camera's own substream | yes (DR-0799 `_sd`) | — | Wyze | lighter on the camera's uplink, the home upload and the TV |

**Transports (the house → the screen):**

| transport | today | measured | note |
| --- | --- | --- | --- |
| Cloudflare Pages Function → Tailscale Funnel → forwarder | the only road | 16 live streams, 2.03 MB/s (≈16 Mbit/s) leaving the house at 22:49 UTC; a 12 s ticket POST timed out under it (DR-0802) | every stream, even for a Firestick in the same room, goes out and back over the home upload |
| LAN-direct origin (Caddy on the NAS; the app tries it first at home) | **no** | — | removes the upload bottleneck for every device at home; the next transport record |
| cameras on other subnets (192.168.4/7/11.x, the 805 house at 10.0.0.x) | unreachable from the NAS | 23 resting | a route from the NAS or a restreamer placed on that network |

**Witnesses:** site-health proves the site (DR-0125); cams-diag reads the NAS on dispatch (DR-0774); the stream health log keeps an hour per camera (DR-0798). Nothing proved the cameras after a change.

## What was measured

The tables above are the measurement: every row names its basis (go2rtc's v1.9.14 source and README, cams-diag run 37698554749, the records cited). The witness: `camera-health.yml` reads `/health`, `/streams/health`, `/recording` and `/api/streams` on the NAS, probes one frame from every camera that is recording or has a watcher, and compares with the last witness kept in the rolling issue.

## Decision

1. **The camera road has a witness after every change.** `camera-health.yml` runs after each deploy completes, every 30 minutes, and on dispatch. It keeps its last witness in the rolling `camera-incident` issue and compares: fewer cameras answering, go2rtc listing fewer streams, the forwarder dark, the forwarder running a hash that is not the one on disk, or the sampler silent is a **regression**.
2. **A regression is fix-now.** The issue gains the `priority:cameras` label and a comment with the numbers, and the run fails so it is seen. In the lane that label outranks every other item: the agent fixes forward or reverts the change that broke the road before anything else, and the next witness run clears the label. This is the expedited, prioritized fix Darrell asked for, as machinery.
3. **The next roads, in order, each its own record:** (a) MSE over WebSocket as the browser road for Chrome/Android/Fire TV — needs the WebSocket passed through the Pages Function and the Funnel; (b) a LAN-direct origin for devices at home, which also opens WebRTC; (c) a route to the other subnets or a restreamer on them. `re-review: 2026-10-14` for (a) and (b) with a week of the health log; (c) is Darrell's network to decide.
4. **What stays:** progressive MP4 and HLS as the two roads Auto chooses between (DR-0782), tended (DR-0799); SD twins for grids; the frame road as the always-works fallback.

## Verification after merge

- `camera-health.yml` runs after this deploy; its first run creates the `Camera road witness` issue with the first witness; the second run compares.
- `re-review: 2026-10-14`: the issue's history shows every deploy's witness; any regression carried the label and was closed by a fix within the day.

## Impact

- **Family:** an update that breaks a camera is caught within the half hour and fixed first.
- **Lane:** one more read-only workflow; one rolling issue; no NAS change.
