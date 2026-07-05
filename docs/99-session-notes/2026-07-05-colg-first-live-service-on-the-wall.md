# COLG — First full live service on the LED wall (2026-07-05)

**Church of the Living God — The Love Corner · Main sanctuary**
On site: Darrell + media team (Clifton on the switcher box). Guided live from the
cloud session. **Two days after first-light commissioning, the wall carried a
complete Sunday service.** In-app: rendered on the Video Wall project surface
("First full live service · 2026-07-05") from `app/src/lib/led-wall-golive.js`.

> **VERIFY-NOT-CLAIM (DR-0076).** Everything here is OBSERVED on site (from the
> session photos) or marked **[TO CONFIRM]** where inferred. The two questions
> that gate the lower-thirds build are recorded as OPEN, not guessed.

---

## The milestone (observed)

- **Wall live:** the "Celebrate" full-frame service graphic **and** live IMAG of the stage.
- **Two side projection screens** magnifying the speaker (camera IMAG), in sync with the room.
- **PTZOptics cameras** cutting live; congregation gathered, service in full flow.
- **Streaming** to **YouTube** (YouTube Studio) and **Facebook Live** simultaneously.
- **Proclaim** running the service order **"Giver's Creed for July"** (the giving segment).

## Booth as-built (observed 2026-07-05)

Devices were **moved this session to support the wall**; this is the layout as it
stood during the live service. Exact "what moved where" is an open item.

| Device | Role | Notes |
|---|---|---|
| **Software switcher** (Program/Preview multiview) | Live program switch + stream | Multiview labels sources by NAME — "Proclaim", "Local Back Camera 1", Preview, Program — which reads like a software (NDI) switcher, not the ATEM. **[TO CONFIRM which carries the live Program cut.]** |
| **Proclaim** | Lyrics/Scripture/giving slides | Booth laptop; feeds the wall (HDMI -> VX HDMI-3 = Preset 1) and is a named switcher source. |
| **PTZOptics 4K cameras** | Stage cameras (SDI + NDI) | Browser PTZ control (Presets 1-9, Exposure/Image/Color). Control IPs seen ~192.168.1.125 / .126. **[TO CONFIRM]** |
| **CUDA tower — RTX 4070** | GPU worker / OBS-streaming box | The sovereign lower-third NDI bridge (OBS + DistroAV) would live here — confirm it is not the box repurposed for the wall. **[TO CONFIRM]** |
| **Lenovo Legion tower** | GPU worker / former NDI->HDMI bridge | The left box from the DR-0082 incident. Present at the desk. **[TO CONFIRM]** |
| **Blackmagic ATEM Production Studio 4K** | Hardware switcher (legacy) | ATEM Software Control 8.1.1 installed on the booth box this session. |
| **Yamaha TF5 console** | Front-of-house audio | Separate from the video path. |

## ATEM switcher software — resolved (keep this)

- **Need:** **ATEM Software Control** — the app that drives the ATEM Production Studio 4K.
- **Installed:** **ATEM Switchers 8.1.1** ("Install ATEM v8.1.1"), on the booth box (Windows user `creed`).
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
path** — it rides over the camera, composited by the switcher. It does **NOT** go
on the LED wall (the wall is full-frame Proclaim graphics / IMAG). The lower-third
lives wherever the Program/Preview switch lives.

**Two questions that pick the path (answer on site):**
1. What is doing the live **Program cut** — the ATEM hardware, or switcher software on a tower (the Legion or the RTX 4070 box)?
2. What device **moved where** to support the wall? (If the moved box ran OBS + DistroAV, the sovereign NDI lower-third bridge may be down.)

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
