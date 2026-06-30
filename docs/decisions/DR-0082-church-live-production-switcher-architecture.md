---
id: DR-0082
title: Church live-production switcher -- hybrid (ATEM cuts cameras over SDI, OBS does graphics+stream over NDI); cameras feed both natively
date: 2026-06-29
status: proposed
supersedes: []
superseded-by: null
tier: C
entities: [church]
grounds: [SURFACE-PREMISE, RESEARCH-FIRST, VERIFICATION-DOCTRINE, COMMUNITY-FIRST, SOVEREIGN-FIRST, COST-DISCIPLINE, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS]
source: 2026-06-29 session -- NDI -> HDMI -> ATEM bridge outage; research-review docs/99-session-notes/2026-06-29-church-live-production-switcher-architecture.md
---

## Context
The left Lenovo Legion was bridging camera **NDI -> HDMI** into the **ATEM Production Studio 4K**, and that bridge is the **current broken incident** -- the live camera switch is down. The cameras already reach **OBS** (right CUDA tower) natively over NDI and that path works; the ONLY job of the bridge was converting NDI -> HDMI so the ATEM (no native NDI input) could see a camera. One fragile software hop became the single point of failure for the hardware switcher.

## Decision
**PROPOSED, pending Darrell's confirmation -- not final.** Adopt a **hybrid**, enabled by a reframe:

- **Reframe (removes the false choice):** the 3x PTZOptics 4K cameras output **SDI AND NDI simultaneously.** So run **camera SDI -> ATEM** (native -- *deletes* the NDI bridge that broke, does not repair it) AND **camera NDI -> OBS** (as today). The Blackmagic camera is SDI-only and already belongs on the ATEM. Both switchers get all cameras natively over their preferred transport.
- **ATEM = the live camera switcher**, fed by SDI -- low-latency, frame-synced, reliable; this is what fixes the outage.
- **OBS = graphics + streaming**, pulling camera NDI + the presentation tower's graphics NDI; pushes the online broadcast. No longer load-bearing for the in-room program.
- **LED wall** = ATEM program **direct via SDI/HDMI -> NovaStar VX1000** (lowest latency; required if the wall shows IMAG). The NDI-encoder/decoder-to-wall path is the documented fallback only for graphics-only / cable-impractical cases.

**What we did NOT decide:** we did NOT retire the ATEM for an all-OBS software switcher, and we did NOT commit the exact ATEM input map or the wall source (IMAG vs graphics) -- those are [TO CONFIRM] and Darrell's call.

## Rationale
**WE CHOSE the hybrid over all-OBS, BECAUSE** a software switcher inherits exactly the PC/OS-reliability failure class that just took the program down (a crash is a *black* program, not one lost input), and NDI's encode -> net -> decode latency desyncs IMAG from the live room -- both unacceptable on a Sunday. **WE CHOSE camera-SDI-to-the-ATEM over fixing the NDI bridge, BECAUSE** the cameras emit SDI natively in parallel, so the right fix deletes the broken hop rather than maintaining it (SURFACE-PREMISE: the "must bridge NDI to the ATEM" premise was false). **WE KEPT OBS for graphics + stream, BECAUSE** that is where software flexibility and sovereignty pay off without sitting in the critical live path. The **all-OBS path stays valid IF** single-software-pane + sovereignty are judged to outweigh latency + reliability for this room -- a deliberate trade, stated plainly so the choice is made on purpose, not by omission.

## Consequences
- Restoring the switch is a **re-cabling**, not new gear: camera SDI -> ATEM (retires the Lenovo Legion bridge); keep camera NDI -> OBS; ATEM program -> SDI/HDMI -> VX1000.
- Extends the prior AV signal-path decision (`dc-colg-av-signal-path-presenter-vx1000`, seed 2026-06-24: direct-cable-to-wall, NDI-is-LAN-routing) to the camera-switching layer; consistent, not a reversal.
- Tier C (COLG-facing live-service surface; cannot risk a blank wall). If the all-OBS path is later chosen, the switching PC stays a dedicated/locked box separate from the AI-worker tower (DR-0012 role separation) with a hot standby.
- Reversible: the ATEM and OBS both remain; the choice is which carries the in-room program. [TO CONFIRM] items (ATEM model/input map, wall source, SDI run lengths) finalize the wiring once Darrell approves.

## Links
Research-review: `docs/99-session-notes/2026-06-29-church-live-production-switcher-architecture.md`. Related: [DR-0012] (GPU/role separation), prior AV decisions in `infra/seed-data/2026-06-24-colg-sanctuary-av-gpu-docs.json`. In-app: `infra/seed-data/2026-06-29-colg-live-switcher-architecture.json` (discussions under project `colg-local-infra-2026-06`). Lanes: church inventory `local_5a07180f`, LED-wall runbook `local_65bfcc0f`.
