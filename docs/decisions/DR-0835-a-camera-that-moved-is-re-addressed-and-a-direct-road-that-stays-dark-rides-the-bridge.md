# DR-0835 — A camera that moved is re-addressed, and a direct road that stays dark rides the bridge

- **Status:** accepted
- **Tier:** A (the NAS forwarder's own road record and go2rtc config; nothing new on the LAN or the Funnel; the three brakes DR-0809 §6 set still hold: the bridge connects only on demand, the sync is single-threaded and idempotent, a bridge that does not answer moves nothing)
- **Type:** fix
- **Date:** 2026-10-09
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`bridge_cameras` carries `ip`; `readdress`, `failing_cameras`, `CONNECT_FAILURE`, `DIRECT_RETRY_SECONDS` 3600, `DIRECT_DEAD_SECONDS` 300, `DIRECT_DRY_TRIES` 3; `StreamHealth.dry_tries` and `unreachable_cameras`; `ensure_bridge_roads` re-addresses, moves `direct-unreachable`, holds the hand-back for the retry window, `retrying-direct`; `sync_bridge_roads` feeds it the breaker and the health; `roads_public` carries `readdressed` and `why`; selftest section 8o).
- **Principles:** DR-0809 (the bridge is the road for cameras the NAS cannot reach itself; the record keeps each camera's direct line), DR-0776 (a camera that keeps failing is rested; the breaker is the witness this reuses), DR-0799 (the stream health is read from go2rtc's own numbers), DR-0076 (the next cams-diag is the proof, named below), DR-0100 (what is established and what is still open are told apart).
- **Grounds:** Darrell, 2026-10-09: *"And its working in Wyze!!!!!!!!! Fix that!!!!!!!!!!!!! We should have video!!!!!!!!!!!"*

## Context

DR-0809 chose a camera's road from its address alone: outside the NAS's networks or without DTLS, the bridge; otherwise go2rtc's direct `wyze://` line. A direct line dials the address written into it. Cameras take DHCP leases; a camera that moved is dialled at the old address for ever and go2rtc answers *discovery timeout* on every try, while the Wyze app, which asks Wyze where the camera is, shows it fine. Nothing in the forwarder ever asked where the camera is today, and nothing ever concluded that a direct road that never answers should try the other road.

## What was measured

- cams-diag run 37879231884 (03:26 UTC): go2rtc on `basketball_cam` and `front_cam`: *wyze: connect failed: discovery timeout*; the bridge's own listing names 59 streams with `connected=False` and two connected (`great-room`, `kitchen-2`), and it carries each camera's `ip` as Wyze reports it.
- camera-health run 37879234248, every stream probed: 9 of 31 answer a frame; silent on the direct road among the house cameras: `basketball_cam`, `front_cam`, `front_yard`, `front_driveway_door`, `basement_living_room`, `outside_7`, `outside_front_door`, `poebasement`, `kitchen_cam`, `living_room`, `east_north_cam`, `north_east_cam`.
- The bridge's log at 22:2x CDT: `IOTC_ER_DEVICE_OFFLINE` for the 805 cameras, Kitchen Cam, Living Room, North East Cam and Outside Front Door, as in DR-0809's sixth read; Wyze's peer service still tells the bridge those are off its network.
- The forwarder as it was: `bridge_road_wanted` read only the host and `dtls=`; `ensure_bridge_roads` handed a bridged camera back the moment its recorded direct line looked LAN-and-DTLS; the breaker's reason and the stream health were never consulted for a road.

**First field read (2026-10-09 04:17 UTC, cams-diag 37883164647).** services-sync restarted the forwarder at 23:16:08 CDT with this record's code, and its first sync wrote: `bridge-road: front_cam re-addressed from 192.168.1.13 to 192.168.1.15, where Wyze says it is today`. One of the twelve silent house cameras had taken a new lease; the direct line now dials the address the camera holds. `basketball_cam` is still at `192.168.1.62` on the direct road (its address did not move) and still answers 0 bytes in 5 s; it rides the bridge only once the breaker trips on three connect-class failures or the health reads it watched and dark for 300 s, neither of which a single diag probe produces. The next camera-health run is the read for that.

## Impact

- Unresolved: a camera that moved stays dark on the direct road until someone rewrites a line on the NAS by hand, and a direct road that never connects is never given the bridge's relay, which is the road the Wyze app itself takes.
- The call obligates: every sync re-addresses from Wyze's own word and judges a road by whether it answers, not by its address alone; a road moved for being dark is tried again on a clock, so a camera that comes back is found within the hour. The open question stays open: a camera Wyze's peer service calls offline is reached by neither road, and that is measured on the bridge's own log, not assumed.

## Decision

1. **The address Wyze reports today is the address dialled.** The bridge's listing carries `ip`; a direct `wyze://` line whose host differs is rewritten to it, its SD twin with it, and the record keeps `readdressed {from, to, at}`. A bridged camera's kept direct line follows too, so the hand-back dials where the camera is.
2. **A direct road that stays dark rides the bridge as `direct-unreachable`.** Dark is measured two ways: the snapshot breaker tripped on a connect-class reason (`discovery timeout`, `connect failed`, `i/o timeout`, `no route`, `connection refused`, `network is unreachable`), or the stream health reading someone watching with no byte arriving for 300 s over at least 3 tries. The record carries go2rtc's own words as `why`.
3. **No hand-back on the address alone.** A camera parked for being unreachable stays on the bridge for `DIRECT_RETRY_SECONDS` (3600), then the direct road is tried again (`retrying-direct`); if it is dark again the breaker or the health moves it back within minutes. Forced roads (DR-0809 §4) are never touched.
4. **The public view says so** (`/streams/roads`, `/why`): `readdressed` and `why`, never a URL.
5. **Open, named narrowly (DR-0100 tier 2):** why the Wyze app shows cameras whose peer-service answer to the bridge is `IOTC_ER_DEVICE_OFFLINE`. The next field read decides whether re-addressing and the relay reach any of the twelve silent house cameras; the 805 cameras are reached by neither road while Wyze reports them offline.

## Verification

- `cams_forwarder.py --selftest`, section 8o (14 checks): `readdress` moves the host and nothing else and leaves the same, an empty, a bad address, an rtsp line and a bridge line alone; a tripped breaker on a connect-class reason names the camera, an auth error or an untripped one does not; the health counts dry tries and names only the watched camera with no byte for the dead window, never a streaming or an idle one or one nobody tried lately; the bridge's listing carries the address; a camera listed at a new address is re-addressed on the direct road, twin included, and stays direct, the record saying where it was and is; a LAN camera whose direct road keeps failing rides the bridge with the reason, the time and go2rtc's words; inside the retry window it stays, even when still dark; after the window the direct road is tried again at the current address; the public view carries the re-address and no URL. Every earlier section still passes (ALL CAMS FORWARDER CHECKS PASSED).
- **Owed after merge (DR-0076):** services-sync installs the forwarder; cams-diag on `basketball_cam` then prints either `re-addressed from ... to ...` or `now rides the Wyze bridge ... (direct-unreachable: ...)` in the forwarder's log and a frame with bytes, or the bridge's own `IOTC_ER_DEVICE_OFFLINE` for that camera, which is the one answer this record cannot change.
- `re-review: 2026-10-16`: the roads record read whole (`/streams/roads`): how many cameras were re-addressed, how many ride the bridge as `direct-unreachable`, and how many `retrying-direct` hand-backs held.
