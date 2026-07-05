# COLG — 2026-07-05 on-site: service online, LED wall held on Freeze

**Church of the Living God — The Love Corner · Main sanctuary**
On site: Darrell + media team (Clifton on the switcher box). Guided from the cloud
session. Sunday service ran with the **online broadcast live**; the **LED wall was
held FROZEN on a holding graphic** while the install continues toward network
control from the control room. In-app: rendered on the Video Wall project surface
("On-site · 2026-07-05 · service online, wall on Freeze") from
`app/src/lib/led-wall-golive.js`.

> **VERIFY-NOT-CLAIM (DR-0076) — a correction is the record.** An earlier draft of
> this note (and the app card) read the wall as showing **live IMAG**. That was an
> INFERENCE from the session photos and it was **WRONG**. Darrell corrected it on
> site: the wall was **frozen on a holding graphic the entire service**; the IMAG
> was on the **side screens**. This is the corrected ground truth. This is exactly
> the guessing-from-a-surface the Verification Doctrine exists to catch.

---

## What actually happened (ground truth — Darrell, on site)

- **LED wall: FROZEN** on a holding thumbnail (a still from BG) via the **NovaStar
  Freeze button** — held there until the network-control install is finished, so
  the wall can be run **from the control room over the network.** NOT driven live.
- **IMAG** (the magnified stage) was on the **two side projection screens** — not
  the LED wall.
- **Online broadcast live** to **YouTube** (YouTube Studio) and **Facebook** at once.
- **Proclaim** ran the service order **"Giver's Creed for July"** (giving segment).

## Booth device roles (as stated by Darrell 2026-07-05)

Devices were **moved this session to support the wall.** The two CUDA towers split
Proclaim (left) from the online broadcast (right); the wall is fed from a laptop
and held on Freeze.

| Device | Role | Notes |
|---|---|---|
| **Left CUDA tower** | Proclaim host | Runs Proclaim; its output feeds the **right tower for the ONLINE broadcast ONLY** — **not** the local (side) screens, **not** the LED wall. |
| **Right CUDA tower** | Online broadcast | Streams to YouTube + Facebook. The **Blackmagic ATEM software was moved here and STOPPED WORKING** — not functioning now (troubleshoot). |
| **LED wall feed** | Laptop -> NovaStar (FROZEN) | Wall driven from a laptop device feed into the NovaStar, held on **Freeze**. Goal: control the VX1000 from the control room over the network — its control NIC has no IP yet (network-infra project). |
| **Blackmagic ATEM Production Studio 4K** | Hardware switcher (software down) | Its ATEM Software Control (moved to the right tower) stopped working, so it is not driving anything right now. **[TO CONFIRM]** |
| **PTZOptics 4K cameras** | Stage cameras (SDI + NDI) | Browser PTZ control (Presets 1-9). Control IPs seen ~192.168.1.125 / .126. **[TO CONFIRM]** |
| **Yamaha TF5 console** | Front-of-house audio | Separate from the video path. |

## ATEM switcher software — right package found; currently DOWN

- **Need:** **ATEM Software Control** — the app that drives the ATEM Production Studio 4K.
- **Installed:** **ATEM Switchers 8.1.1** ("Install ATEM v8.1.1"). It was then **moved
  to the RIGHT CUDA tower and STOPPED WORKING** — not functioning now. **Troubleshoot
  after service:** confirm the switcher is seen (USB/LAN, ATEM Setup discovery,
  firmware match) and that no other app on the right tower is holding the device.
- **Ruled out first (real dead-ends this session):**
  - **Blackmagic Camera 8.1.1** — camera control/firmware (URSA/Pocket/Studio). Wrong.
  - **ATEM Switchers SDK 8.1.1** — a developer kit (~3 MB), not the control app. Wrong.
- **Three-second rule:** if the download says **"Camera"** or **"SDK"**, or it is
  **under ~100 MB**, it is wrong. The real ATEM Software Control package is **~1+ GB**
  and its folder ships the **"Production Studio Switchers Manual."**
- **Version:** 8.1.1 is older than the current 10.2.1, but for the **Production
  Studio 4K (legacy unit)** it is a correct/safe match (its package includes the
  Production Studio Switchers Manual; newer releases sometimes drop old switchers).
  Confirm the switcher connects before updating.
- **Official download only:** blackmagicdesign.com/support -> ATEM Production Switchers.

## Lower thirds — OPEN (deferred to after service by Darrell)

**Principle (settled):** a lower-third is a **keyed overlay on the PROGRAM/stream
path** — it rides over the camera, composited by whatever switches that program. It
does **NOT** go on the LED wall. For the **online broadcast** it keys on the **right
CUDA tower** (where the stream is composited).

**Two questions that pick the path (answer on site):**
1. For the **online broadcast** (right CUDA tower): what composites it — **OBS**, or the **ATEM software** (currently down)? The lower-third keys there.
2. For the **local screens / wall** (a separate path from the online broadcast): what drives them once the wall is on network control, and does a lower-third belong there at all?

**Paths (pick once answered):**
- **Software switcher (most likely):** add the lower-third as an overlay layer/input with alpha (transparent PNG or keyed NDI source), toggle on/off over program. No new gear.
- **ATEM hardware:** **Downstream Keyer (DSK)** — load the lower-third PNG (with alpha) into a Media Player, assign DSK1, cut with the DSK ON AIR button.
- **Sovereign PoeTech route (already built, #322 / `ndi-output.js`):** `?output=1&kind=lower-third&name=…&role=…` -> OBS Browser Source (transparent) -> DistroAV NDI `POETECH (Lower-Third)` -> key in the switcher. Needs OBS + DistroAV on a box not repurposed for the wall.

## Booth resident (Claude Code)

A Claude Code resident was installed on the booth box (`creed`) this session
(native Windows installer; signed in with Claude Max) so future setup can be
driven **on the machine** — the cloud session has no network path to the church
LAN. **Guardrail (DR-0012 + three-brakes):** no autonomous AI load on the live
switching box during service; hands-on, operator-watched only. **[TO CONFIRM the
resident is signed in and reachable over Tailscale.]**

## Ties to

- **DR-0082** (switcher architecture — the interim/hybrid) and PR #601's interim runbook.
- **First-light commissioning** `2026-07-03-led-wall-commissioning.md` (VX Preset 1, layers-first).
- **NDI program-output** `2026-06-24-ndi-program-output-lhf.md` (the `?output=1` lower-third route).
- **DR-0012** (GPU/role separation — live has absolute priority on the switching box).
- Data + tests: `app/src/lib/led-wall-golive.js`, `app/src/__tests__/led-wall-golive.test.js`.
