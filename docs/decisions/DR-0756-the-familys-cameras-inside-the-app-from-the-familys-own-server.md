# DR-0756 — The family's cameras, inside the app, from the family's own server

- **Status:** accepted
- **Tier:** B (a new family-only surface; a new PUBLIC Funnel row with a lock in front of it; no money, no schema, no church-facing change). Not the three-brakes class: request-driven, no timer, no compute until a browser asks — but a public door, so it carries bounds anyway.
- **Type:** feature + transport + governance analysis
- **Date:** 2026-10-06
- **Scope:** `infra/nas-cameras/` (docker-compose.yml, go2rtc.seed.yaml, cams_forwarder.py, poetech-cams.service, install.sh, README.md); `app/functions/cams/[[path]].js`; `infra/nas-transport/RECORDED-STATE.md` (the `/cams` row); `infra/nas-loops/services.json` (`cameras`); `.github/workflows/ci.yml` (selftest), `.github/workflows/site-health.yml` (`/cams/health` witness); `app/src/lib/cameras.js`, `app/src/components/Cameras.jsx`, `app/src/surfaces.js`, the shell (VALID, nav, render), `FeedbackCenter.jsx` (area); tests `cameras.test.js`, `cameras-render.test.jsx`.
- **Principles:** SOVEREIGN-FIRST, APP-IS-PRIMARY (DR-0065), REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), DETERMINISTIC-FIRST, DATA-AS-EMPOWERMENT, REPEATABLE-GOVERNANCE, DR-0100 (speak established fact), DR-0236 (nothing waits), DR-0248 (budget + lock), DR-0268/DR-0330 (the actuated-route class), DR-0613 (the key provisions itself).
- **Grounds:** Darrell 2026-10-06: *"I want to be able to see my wyze cam feeds inside my PoeTech App... and any system I own..."* — then, mid-build: *"Flexibility with rigorous control of the system and processes... Identify: missing information, assumptions, risks, dependencies, decisions requiring human approval, opportunities, constraints, DRs review fully, never guessed, always data driven, timeline, intuitive design — what where when how and why — what is enforced and is synchronization of each component occurring, database-driven review of workflows."* This record is the answer to both sentences; the session note `docs/99-session-notes/2026-10-06-cameras-in-the-app-governance-analysis.md` carries the long form.

## Context

The Observation board has carried a Wyze/RTSP camera REGISTRY since 2026-06-16 whose chip reads *"RTSP · registered — awaiting NAS bridge"* (`lib/observation-cameras.js`): the browser cannot play rtsp://, so the bridge was named as a follow-up and never built. The home fleet (NETWORK-SOVEREIGNTY-UCG-MAX.md §Camera infrastructure) is Wyze (primary, several), Ring (at least one), and a third brand not yet identified; DR-0050 set the church backbone as ONVIF 4K PoE with Wyze supplementary; the 2026-09-18 topology review found cameras on the flat segments. Nothing in the app showed a single frame.

## What was measured

Before choosing (DR-0076 §5), fetched and read this session, never recalled: go2rtc v1.9.14 (released 2026-01-19; Docker Hub tag `1.9.14` present, amd64+arm64) added *native* Wyze P2P (`wyze://`, no Wyze SDK, cloud touched once to list the account's cameras, then local), on top of native Ring (v1.9.9), ONVIF and RTSP; its HTTP API serves a JPEG frame, a progressive MP4 and HLS/fMP4 — the three shapes a browser can show without a player library. Progressive MP4 does not play on Safari/iOS; HLS does, natively. Tailscale publishes no Funnel bandwidth figure (*"a funnel, not a hose"*; community reports of trouble above a few Mbit/s). docker-wyze-bridge 2.10.3 remains the documented fallback for Wyze units go2rtc cannot yet speak to (Gwell models: Cam OG, Pan v4, Floodlight Pro — matching DR-0050's own "spottier" Floodlight Pro note).

## Decision

1. **ONE restreamer on the NAS: go2rtc 1.9.14, pinned, host-networked, loopback-only.** "Any system I own" is one more line in its config (`wyze://`, `ring://`, `onvif://`, `rtsp://`), never a new program. Exposure is decided by the seed config (api 127.0.0.1:1984, rtsp 127.0.0.1:8554, webrtc off). The installer seeds the config ONCE and never overwrites it (go2rtc's WebUI writes the generated Wyze lines into it).
2. **A locked door in front of it: `poetech-cams.service` (cams_forwarder.py, 127.0.0.1:8773), mounted on the PUBLIC Funnel at `/cams`.** The family bridge bearer (the one family key, DR-0613) on `/list` and `/ticket`; 90-second one-camera HMAC playback tickets on media URLs (an `<img>`/`<video>` cannot carry a header; a leaked ticket is worthless in a minute and never names another camera); an allowlist of read-only paths; a source URL (it carries credentials) NEVER leaves the box. Bounds: 2 live streams (503 at once), 300 s per live view (then it ends itself; the app says so and offers Resume), 6 snapshots in flight, per-call timeouts. `/health` passes go2rtc's OWN answer through — a dark restreamer never reads as this process's 200.
3. **The same-origin road: `app/functions/cams/[[path]].js`** over the one Funnel-proxy factory; recorded as a `/cams` row in RECORDED-STATE; actuated by `infra/nas-cameras/install.sh` through services-sync (merge = deploy, DR-0236); witnessed outside-in by site-health's `GET /cams/health`.
4. **The surface: `Cameras`, a top-level family-only tab, hidden when denied** (the home is the family's business; no version of asking ends in yes for an outsider). Snapshots by default (one frame per camera per 5 s, only while the tab is visible, fetched sequentially — the client's own brake); a tap opens full motion IN PLACE under the tile (UX-PATTERNS 2e); HLS when the device's `<video>` says it plays it, else MP4 — the device is asked, never a user agent sniffed. Every number shown is measured (frame age, fetch ms, bytes, time-to-first-frame, stalls). Every state is derived and says the way forward: no key on this device / key refused / road dark / restreamer up and empty (the two paste-ready setup steps live right there) / cameras.
5. **No camera registry in the database, by design.** The ONE source of truth is the restreamer that actually reaches the cameras; the app reads it live (P15). A second copy in Postgres would be a second truth to drift. Per-device preferences, if any later, stay device-local.

## Impact

The family sees every camera it owns in one tab of the app it already lives in, from its own server, with nothing between eye and yard but the family key. The Observation board's six-month "awaiting NAS bridge" has a road. Adding a Ring, an ONVIF or a future UniFi camera is a config line, not a project. The NAS carries one more pinned container and one more loopback service; the public Funnel carries one more locked row; the shell grows by its documented two lines.

## What only Darrell can supply, and what the record asks of no one else

Two values the repo never holds: his Wyze email/password and the API ID + API Key from the Wyze developer portal (a secret value only he holds). He places them once in `/volume1/PoeTech/secrets/wyze.env` and signs in once through the restreamer's WebUI over an SSH tunnel (both paste-ready, cd-first, in README.md and in the app's empty state). Everything else self-deploys on the next services-sync cycle. Without the Wyze values every non-Wyze system still works and the app says plainly what is missing.

## Risks named, not hidden (DR-0100)

- Funnel bandwidth is undisclosed → snapshots default, one live view at a time, 300 s ceiling, measured numbers on the surface. re-review: 2026-11-06 with the app's measured time-to-first-frame and stall counts.
- go2rtc's Wyze source is young (2026-01-19) → the sovereign choice, with docker-wyze-bridge as the documented fallback; Gwell models unsupported either way until the fleet is inventoried in the app. re-review: 2026-11-15.
- Wyze cloud is touched once per camera listing → enumeration can break if Wyze changes its API; written stream lines keep working.
- The cameras sit on flat segments (2026-09-18) → the NAS must keep LAN reach to the IoT VLAN 40 when it ships (P2P and ONVIF are LAN); recorded as a dependency of that plan.
- The Wyze password lives in plaintext inside go2rtc's root-only config (0600); go2rtc documents an `md5:` triple-hash form whose exact derivation was not verified, so it was not used (never guessed). re-review: 2026-10-20.

## Verification after merge

The merge is the deploy: services-sync installs go2rtc and the forwarder within 15 minutes and mounts `/cams` only after both answer; site-health then probes `GET /cams/health` from outside the NAS on every run, and the Cameras tab reports the live road state (up / dark / empty / cameras) with measured numbers. Darrell's two steps follow; the cameras appear on the next list refresh. Re-review dates: 2026-10-20 (Wyze password form; church Observation board on this road), 2026-11-06 (Funnel bandwidth on measured numbers), 2026-11-15 (fleet inventory, Gwell units), 2026-12-01 (recording/events).

## What is enforced, and how the pieces are synchronized (the machinery, not memory)

client → Function: `client-path-parity.test.js`. Function → Funnel → installer: `funnel-actuation-guard` (a `/cams` route must have a RECORDED-STATE row AND a `--set-path /cams` installer). Installer → baseline: `infra-transport-guard` (cites RECORDED-STATE). Installer → deploy: `services.json` (merge is the deploy). Forwarder contract: `cams_forwarder.py --selftest` (50 checks) gates merge in ci.yml; its live time brake failed its first run (a 64 KB blocking read held the check hostage) and was fixed before anything shipped — proven to catch. Surface → shell: `surface-registry-completeness`, `surface-mount-integrity`, `every-registered-surface-loads`; nav → feedback: `feedback-area-guard`; UI standards (focus ring, 36 px, aria, width) and the still screen: `ui-standards-set`, `consistency-guard`, `still-screen-motion`. Product change → record: `decision-record-guard`. Live system: site-health `GET /cams/health` from outside the NAS; the installer mounts only after both processes answer.

## Opportunities, dated

Church Observation board links its RTSP registry to the same road (the "awaiting NAS bridge" chip retires) — re-review: 2026-10-20. Recording/retention and motion events (Frigate, DR-0050's plan) are NOT in this record; go2rtc restreams, it does not record — re-review with the Ubiquiti/ONVIF step: 2026-12-01. Rename `/cams`? No: it is already sovereign-neutral.

## Links

DR-0050 (church cameras plan), DR-0061/DR-0065 (reality-trace, app is primary), DR-0076, DR-0100, DR-0236, DR-0248, DR-0268, DR-0330 (the actuated-route class this follows), DR-0613 (family key), NETWORK-SOVEREIGNTY-UCG-MAX.md, `docs/99-session-notes/2026-09-18-love-corner-network-topology-and-exposure.md`, `docs/99-session-notes/2026-10-06-cameras-in-the-app-governance-analysis.md`.
