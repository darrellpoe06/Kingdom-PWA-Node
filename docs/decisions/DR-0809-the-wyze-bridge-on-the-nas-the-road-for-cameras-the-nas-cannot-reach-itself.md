# DR-0809 — The Wyze bridge on the NAS: the road for cameras the NAS cannot reach itself

**Date:** 2026-10-08 · **Status:** decided; ships inactive until the Wyze sign-in file exists on the NAS, then self-activates through the lane · **Lane:** cameras · **Pairs with:** DR-0756 (go2rtc, the one restreamer), DR-0770 / DR-0777 (the kept Wyze sign-in), DR-0789 (the config written when go2rtc refuses), DR-0803 / DR-0807 (the wall says why), DR-0806 (the camera road witness)

## Context

Darrell, 2026-10-07: *"805 we have no video... however the wyze cam app works... why?!!!"* and, after the measured answer: *"Build the bridge on the NAS so 805 works... make sense?"*

## What was measured

cams-diag run 37702488586 (2026-10-07 23:28 UTC): 31 streams, 9 producing media; the ten 805 cameras addressed at `10.0.0.x` with the NAS on `192.168.1.26/24` and no route there (go2rtc: `connect failed: discovery timeout`); twelve more Wyze cameras refused with `only DTLS cameras are supported`. go2rtc's `wyze:` source speaks to a camera's LAN address and needs DTLS firmware. The Wyze app reaches every one of them because it rides Wyze's own relay.

The bridge's facts were read from its own source and docs before anything was pinned (DR-0076): image `mrlt8/wyze-bridge`, newest numbered tag **2.10.3** (Docker Hub, 2024-09-13, amd64 + arm64; `latest` points at it); sign-in variables `WYZE_EMAIL`, `WYZE_PASSWORD`, `API_ID`, `API_KEY` (`app/wyzebridge/wyze_api.py`); `NET_MODE` LAN | P2P | ANY, ANY = LAN, then P2P, then Wyze's relay (wiki *Network Connection Modes*); `ON_DEMAND` default true, `WB_AUTH` default true, `TOKEN_PATH` `/tokens/` (`config.py`); the API key accepted as `api` header or `?api=` on `/api` (`web_ui.py`); `GET /api` → `{total, available, enabled, cameras:{<uri>: {...camera fields incl. mac, nickname, connected, enabled, status}}}`; a camera's uri is its nickname with spaces as `-`, lower-cased (`wyzecam/api_models.py`); `SUBSTREAM=True` adds `<uri>-sub` at SD (wiki *Camera Substreams*).

## Decision

1. **docker-wyze-bridge runs beside go2rtc on the NAS**, in the same compose project, from `infra/nas-cameras/docker-compose.bridge.yml`: pinned `2.10.3`, `NET_MODE=ANY`, `ON_DEMAND=True`, `SUBSTREAM=True`, `WB_AUTH=True`, **loopback only** (RTSP `127.0.0.1:8555`, API `127.0.0.1:8597`; go2rtc keeps 8554, DSM keeps 5000). Nothing of it is on the LAN or the Funnel.
2. **It takes the sign-in the Cameras tab already keeps.** `cams_forwarder.py --bridge-env` derives `/volume1/PoeTech/secrets/wyze-bridge.env` (root-only) from `wyze.env`, under the bridge's names, and mints its API key and web password once. The in-app sign-in (`/setup/wyze`) refreshes it. `install.sh` adds the bridge's compose file only when that env exists, so go2rtc never waits on the sign-in.
3. **The road is chosen per camera from the source URL go2rtc already holds, with no probing and no waiting on a timeout.** A `wyze://` host outside every network the NAS sits on (`lan_networks()`: `ip -4 -o addr`, or `CAMS_LAN_CIDRS`), or a `wyze://` line without `dtls=true`, rides the bridge as `rtsp://127.0.0.1:8555/<uri>`, matched by MAC against the bridge's own listing. Every other Wyze camera stays on go2rtc's direct road (lower latency, no relay). The SD twin of a bridged camera is the bridge's `-sub`. Run every minute by the stream sampler (`ensure_bridge_roads`), and once after each sign-in.
4. **The owner's hand:** `POST /streams/<id>/road {road: bridge | direct | auto}` and `GET /streams/roads`; in the app, a Wyze tile's Why? names its road and offers *Use the Wyze bridge / Use the direct road / Let the NAS choose*; the Setup tab reads `/health.bridge` in one line.
5. **The record** (`bridge-roads.json`, root-only) keeps each camera's direct line (it carries the enr secret), road, reason and time, so a camera is handed back the moment the NAS can reach it again, and never leaves the NAS; the public view carries no URL.
6. **Brakes (the three, as build requirements):** the bridge connects a camera only while go2rtc pulls it (ON_DEMAND, the budget); the road sync is single-threaded inside the sampler and idempotent (a second pass moves nothing, the lock); a bridge that does not answer leaves every camera where it is and `/health.bridge.last.reachable` says so (the stop-path). The witness (DR-0806) already reads `/health` whole, so a bridge that goes dark is in the ledger.

## Verification after merge

- `cams-diag` after the next services-sync: `docker ps` shows `poetech-wyze-bridge`; `/health.bridge` reads `configured: true`, `last.reachable: true`, `known` ≥ 22; `/api/streams` lists `805_*` with `rtsp://127.0.0.1:8555/805-...` producers and `medias` once watched; the 805 tiles show a picture in the app.
- Gate: selftest 8n — the env derived with the bridge's names and a kept key; the LAN read minus loopback and link-local; the three rules (other-network, no-dtls, LAN+DTLS stays); the listing read by uri+MAC and refused without the key; a sync moving exactly the right cameras with their `-sub` twins, rewriting exactly their config lines, a second sync moving nothing; forced direct and forced bridge; the config rewritten when go2rtc refuses the PUT; the handler's `/health.bridge`, `/list.road`, `POST road` validation and `GET /streams/roads` without a URL.
- App gate: `cameras.test.js` (road parsed, the lines, the POST) and `cameras-render.test.jsx` (Setup's bridge line from `/health`; Why? names the road and the owner's pick posts as the owner).
- `re-review: 2026-10-15`: the stream health log for the bridged cameras (up%, drops) decides whether any LAN camera should also ride the bridge, and whether a nightly `nightly` image is worth a pin.

**First field read (2026-10-08 01:43 UTC, cams-diag 37714259877).** The bridge is up on the NAS (a new compose network appeared beside go2rtc's) and the forwarder moved the 805 cameras onto it: `805_north`'s producer is now `kind wyze, host 127.0.0.1`. go2rtc then answered `streams: user/pass not provided` and `wrong response on DESCRIBE` when it pulled the bridge's RTSP: with `WB_AUTH` on, the bridge's streams need its stream credentials, and the bare line carried none. Fixed the same hour: `bridge_source()` signs the line with `WB_USERNAME:WB_PASSWORD` from the bridge's own env; `is_bridge_source()` decides by host and port so a credentialed line is still the bridge road; the credentials never leave the NAS (root-only config and roads file, no URL in `/list`, kind and host only in `/why`, `scrub_text` masks `user:pass@`). Selftest 8n proves each of those. The next read is the proof of the picture.

## Impact

The 805 cameras, and the twelve the direct road refuses, reach the app the way the Wyze app reaches them, through the NAS, with nothing placed at 805. The direct road stays for every camera it serves well. Not verified from this session: the bridge's relay from THIS NAS to the 805 cameras in the field (the first `cams-diag` after merge is that proof).
