---
id: DR-0166
title: The middle screen is independent of the side screens; and every fix closes its own loop, in-app, with no static data
date: 2026-07-10
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [church, all]
grounds: [APP-IS-PRIMARY, NO-STATIC-DATA, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, WAYS-REVIEW, THREE-BRAKES, COMMUNITY-FIRST]
source: session-2026-07-10-middle-screen-independence-and-av-fixes
---

## Context

Darrell, 2026-07-10, declared a binding process (emphatic, "Period."): every fix or
feature must **close its own loop** — documentation + added to the Ways +
opportunities AND constraints named + Ari's responsibilities updated + in-app
reports updated to reflect it — **ALL INSIDE THE POETECH APP**, with **NO STATIC
DATA** (derive from real state; never hardcode a snapshot that rots), and keep
consolidating overlapping material until it is clean.

The concrete work that triggered it: the sanctuary carries THREE display surfaces,
and Darrell wanted the **MIDDLE screen (the LED wall) documented as independent of
the two side screens**, plus the AV fixes landed today captured with their
opportunities and constraints. Verified on site 2026-07-10:

- **Middle screen** = the LED wall, fed by the **wall laptop (TLC-Tech-Team,
  Alienware)** running **NDI Studio Monitor** full-screen -> HDMI -> **NovaStar
  VX1000 Pro** -> wall.
- **Two side screens** = the sanctuary **projectors**, fed from **Proclaim**.
- **Broadcast** = **OBS on the RIGHT CUDA** (`livestream-main-pc`), NDI "OBS",
  multistreamed to YouTube + Facebook — a separate lane, not a room screen.

This RECONCILES with (does not overturn) the planned production destination
(camera SDI -> ATEM -> VX1000, the DR-0082 hybrid): `SIGNAL_CHAIN` is where we are
going; `MIDDLE_SCREEN_TOPOLOGY` is what runs today. Both true.

## Decision

### 1 — The middle screen is independent; the wall shows what its source shows

"Different settings allow for various outcomes": what the wall shows is chosen by
which NDI source the wall laptop points at. Enumerated in
`app/src/lib/church-av-devices.js` `WALL_FEED_OPTIONS`, each with its opportunities
and constraints:

- **OBS NDI** -> wall mirrors the broadcast (cameras). Independent of Proclaim,
  NOT of broadcast.
- **NDI ProClaim** -> wall shows the same words as the side screens. NOT
  independent of Proclaim.
- **A camera** -> single-camera wall.
- **RECOMMENDED / CORRECT** -> wall points at a dedicated **"WALL"** NDI feed from
  a **SECOND OBS ("WALL OBS", `--portable --multi --websocket_port 4466`) on the
  LEFT CUDA** with its own words/graphics sources that Ari drives. This makes the
  middle screen independent of **BOTH** the side screens (Proclaim) **AND** the
  broadcast/cameras. **Darrell's intent: the wall carries WORDS ONLY**, separate
  from cameras and from Proclaim.

The wall laptop is a **dumb endpoint**: it points at ONE source once, never
switches mid-service, and auto-starts NDI Studio Monitor at Windows start.

### 2 — Today's AV fixes, captured with opportunities + constraints

Grounded facts in `church-av-devices.js` (`NDI_DISCOVERY_FIX`,
`OBS_REMOTE_CONTROL`, `LED_WALL_OVER_NETWORK`) and the device rows:

- **NDI discovery fix (the big one).** OBS's NDI source was invisible because
  (i) `livestream-main-pc` is DUAL-HOMED with both NICs on overlapping /23 (wired
  `192.168.1.73` + Wi-Fi `192.168.0.44`) and NDI auto-picked Wi-Fi, and (ii) an NDI
  Discovery Server override (`"discovery":"192.168.0.11"`) SUPPRESSED mDNS. Fix in
  `C:\ProgramData\NDI\ndi-config.v1.json` (`C:\ProgramData\NewTek\NDI` is a
  JUNCTION to the same file): `"adapters":{"allowed":["192.168.1.73"]}` +
  `"discovery":""` + a **FULL OBS restart** (a Main-Output toggle was not enough).
  Open root cause: the two NICs should not both be /23 (`re-review: 2026-07-24`).
- **OBS remote control.** obs-websocket v5 on `:4455` — Ari reads scenes + switches
  program. Auth currently OFF; resting state re-enables auth with the password read
  locally on the box, never in chat (`re-review: 2026-07-17`).
- **LED wall live over the network.** OBS NDI -> wall laptop Studio Monitor -> HDMI
  -> VX1000. The VX1000 has NO network video input, so one HDMI hop is required.
  Never feed OBS's own NDI output back into an OBS scene (feedback loop).
- **New node consolidated.** The booth Alienware IS the wall laptop
  (`TLC-Tech-Team`, `100.92.143.124`, NDI 6 Tools, PowerPoint -> NDI via Screen
  Capture) — one machine, enriched in the register, not a duplicate row. Device
  inventory otherwise per PR #706 (referenced, not duplicated).

### 3 — The AV guardrails (the Way)

`AV_GUARDRAILS`: humans keep the live cut; preview-then-execute; writes held while
an operator is live; kill-switch (three-brakes); no inference on the live-encode
box (DR-0012); no NDI feedback loop. `NDI_GOTCHAS`: multi-homed NIC picks the wrong
adapter; a Discovery Server override suppresses mDNS; config is read at process
start (full restart required).

### 4 — Ari's responsibilities + reports update, DERIVED not static

- New Ari standing duty `av-loop` (ari-notes.js) — serve the AV chain under the
  guardrails, and keep the AV report derived.
- The AV report DERIVES from the device rows: `avIndependenceReadiness(devices)`
  classifies each wall option `available | unverified | not-built`, and
  `ariAvCapabilities(devices)` reports Ari's AV capabilities with honest states.
  **NO fake-green:** the recommended WALL OBS is `built:false` in the data, so it
  can only read `not-built` until the second OBS actually exists.

### 5 — This reinforces the existing loop-closure Way (no new competing rule)

The "every fix closes its own loop in-app, no static data, keep consolidating" Way
already lives on `main` as Ari's `ways-updater` duty (DR-0158) and the NO-STATIC-DATA
program (DR-0121). This DR does not re-invent it — it PRACTICES it end-to-end: the
documentation (this DR + the consolidated session note), the Ways (REV-0049 + the
newly-registered AV-GUARDRAILS / NO-STATIC-DATA principle rows), the opportunities
AND constraints (named on every option + fix), Ari's responsibilities (the `av-loop`
duty), and the derived in-app report (the Middle screen section) all land in the same
change. AV-GUARDRAILS is the one genuinely new durable rule registered here.

## Rationale

- **APP-IS-PRIMARY / ONE-APP** — the capability and its report land in the app,
  where the family and media team meet it.
- **NO-STATIC-DATA / VERIFICATION-DOCTRINE** — status is derived from the device
  rows; unbuilt/unconfirmed reads UNVERIFIED, never a painted pass.
- **WAYS-REVIEW** — the guardrails and NDI gotchas are extracted as durable Ways;
  the ways-review is REV-0049.
- **THREE-BRAKES** — the WALL OBS + any Ari AV automation ships inert, on the left
  CUDA, under budget + lock + kill-switch.
- **COMMUNITY-FIRST** — a words-only wall serves COLG's congregation directly.

## Consequences

- `church-av-devices.js` gains `MIDDLE_SCREEN_TOPOLOGY`, `WALL_LAPTOP_ENDPOINT`,
  `WALL_FEED_OPTIONS`, today's-fix facts, `AV_GUARDRAILS`, `NDI_GOTCHAS`, and the
  derived `avIndependenceReadiness` / `ariAvCapabilities` (proven-to-catch).
- `church-devices.js` — the booth/wall Alienware row is enriched + consolidated
  (TLC-Tech-Team), and `livestream-main-pc` carries the NDI fix + obs-websocket.
- The Church Video Wall surface renders a derived "Middle screen — independent"
  section; the interim OBS switcher runbook is consolidated under the new canonical
  session note.
- WALL OBS + Ari AV automation remain pending, inert, three-braked.

## Links

- Spine: `app/src/lib/church-av-devices.js` (+ `app/src/__tests__/church-av-devices.test.js`)
- Devices: `app/src/lib/church-devices.js` (booth/wall Alienware + livestream-main-pc)
- Ari: `app/src/lib/ari-notes.js` (`av-loop` duty)
- Render: `app/src/components/ChurchVideoWall.jsx` (Middle screen section)
- Session note: `docs/99-session-notes/2026-07-10-middle-screen-independence-and-av-fixes.md`
- Ways review: `docs/reviews/REVIEWS.md` REV-0049
- Grounds: DR-0082 (ATEM hybrid destination), DR-0012 (no inference on the live box),
  DR-0076 (verification), DR-0121 (no static data), DR-0158 (Ari's ways-updater — the
  loop-closure Way this practices), DR-0108 (ways review), DR-0120 (Ari's derived
  record), the three-brakes rule
- New principle registered: AV-GUARDRAILS (PRINCIPLES.md)
