# Church live-production switcher architecture -- OBS-as-switcher vs keep-the-ATEM (research-review)

**Date:** 2026-06-29
**Status:** PROPOSED -- pending Darrell's confirmation. Nothing here is final; this is the evenhanded layout + a recommended path for him to choose on purpose.
**Decision record:** [DR-0082](../decisions/DR-0082-church-live-production-switcher-architecture.md)
**Context:** The left Lenovo Legion was bridging NDI -> HDMI into the ATEM Production Studio 4K, and that bridge is the CURRENT broken incident -- the live camera switch into the ATEM is down. This review traces the real signal chain, lays out OBS-as-switcher vs keeping the ATEM evenhandedly, and surfaces the reframe that resolves the outage without forcing the all-or-nothing choice.

> **VERIFY-NOT-CLAIM (DR-0076).** The device list below is recorded as provided in this session. Items not read off the real rack are marked **[TO CONFIRM]**: exact ATEM model variant, the VX1000 program-input wiring, and whether the LED wall currently shows IMAG (switched camera program) or graphics-only. Those three change the wiring detail, not the decision.

---

## 1. The real signal chain (as recorded this session)

| Device | Role | Outputs | State |
|---|---|---|---|
| **3x PTZOptics 4K cameras** | Stage cameras | **SDI AND NDI simultaneously** | Working |
| **1x Blackmagic camera** | Stage camera | **SDI only** | Working |
| **ATEM Production Studio 4K** | Hardware live switcher | SDI/HDMI program out | Up, but **starved** -- its camera feed depends on the broken bridge |
| **Left Lenovo Legion** | NDI -> HDMI bridge into the ATEM | HDMI into an ATEM input | **BROKEN -- the current incident** |
| **Right CUDA tower** | OBS for the online broadcast | Pulls camera NDI; streams online | Working (pulls NDI fine) |
| **Presentation tower** | Graphics (lyrics/Scripture/lower-thirds) | Publishes **NDI** | Working |
| **NovaStar VX1000** | LED-wall processor | HDMI/DVI/3G-SDI in -> wall | Working (wall driven) |

**The break, precisely:** the cameras already reach OBS natively over NDI (that path works). The ONLY thing the Lenovo Legion bridge was doing was converting camera NDI -> HDMI so the ATEM (which has no native NDI input) could see a camera. When that PC/bridge fell over, the ATEM lost its source -- a single fragile software hop became the single point of failure for the hardware switcher. This is the exact PC/OS-reliability failure class the rest of this review weighs.

---

## 2. The decision -- evenhanded

### Option A -- OBS as the switcher (all-NDI, software)

**Pros**
- **Flexibility + graphics.** Unlimited scenes, layers, transitions, web/graphics sources, the presentation tower's NDI composited inline. Far past what a hardware switcher does.
- **Cost-free.** No new hardware; it is already running on the right CUDA tower for the broadcast.
- **Sovereign.** Runs on owned towers, on the church LAN, no vendor box in the path (SOVEREIGN-FIRST, COST-DISCIPLINE).
- **Single pane.** One surface switches the program, builds graphics, and streams.

**Cons**
- **PC/OS reliability -- the current failure class.** A software switcher inherits exactly the fragility that just took the program down: an OS hiccup, a driver update, a GPU contention spike, and the **whole program is gone**, not one input.
- **NDI latency.** Encode -> network -> decode adds latency. For **IMAG** (the wall/screens magnifying the live stage) that lag breaks lip-sync with the room -- the congregation sees the speaker's mouth and the screen disagree.
- **Crash = total outage.** A hardware switcher losing one input degrades; a software switcher crashing is a black program. On a Sunday that is unacceptable.

### Option B -- Keep the ATEM (hardware switcher)

**Pros**
- **Boots instantly, does not crash.** Purpose-built appliance; no OS to wedge.
- **~Zero latency, frame-synced.** Genlocked hardware cutting; IMAG stays in sync with the room.
- **Purpose-built for live cutting.** The thing it is best in the world at.

**Cons**
- **Less flexible graphics.** Nowhere near OBS for layered/web/animated graphics.
- **No native NDI -- needs a bridge.** Which is the current break. *This con is what the reframe below removes.*

---

## 3. The reframe that dissolves the false choice

**The PTZOptics cameras output SDI AND NDI at the same time.** That is the key fact the broken-bridge framing was hiding (SURFACE-PREMISE):

- Run **camera SDI -> ATEM** directly. The ATEM gets every PTZOptics camera **natively**, over its preferred transport, with **no NDI bridge at all.** The fragile NDI -> HDMI Lenovo Legion hop is **deleted, not repaired** -- you stop maintaining the thing that broke.
- Run **camera NDI -> OBS** as it already does. OBS keeps every camera natively over *its* preferred transport.
- The Blackmagic camera is SDI-only -> it already belongs on the ATEM SDI inputs.

Both switchers get all cameras natively over the transport each was built for. There is no either/or forced by the cabling -- the cameras feed both at once.

---

## 4. Recommended -- the HYBRID (each tool does what it is best at)

```
                 +-------------------+        SDI (native, low-latency, genlocked)
  PTZOptics #1 --|  SDI out          |--------------------------------+
  PTZOptics #2 --|  (+ NDI out)      |                                |
  PTZOptics #3 --|                   |                                v
                 +---------+---------+                        +---------------+
                           |                                  |     ATEM      |
  Blackmagic ----SDI------------------------------------------|  Production   |
                           |  NDI out (same cameras,          |  Studio 4K    |
                           |  simultaneous)                   |  (live cut)   |
                           v                                  +-------+-------+
                 +-------------------+                                |
                 |   Church LAN      |                       program out (SDI/HDMI)
                 |   (NDI fabric)    |                                |
                 +----+---------+----+              +-----------------+-----------------+
                      |         |                   |                                   |
              camera NDI   graphics NDI             v  (PRIMARY: direct video cable)    v (ALT: NDI)
                      |    (presentation       +---------+                         [NDI encoder]
                      v     tower)             | NovaStar|                              |
                +-----------+   |              |  VX1000 |<--- SDI/HDMI program ---------+
                |    OBS     |<--+              +----+----+      (IMAG wants this path)   |
                | (right     |                      |                              [NDI decoder]
                |  CUDA      |                       v                                   |
                |  tower)    |                  LED WALL                                 |
                +-----+------+              (IMAG and/or graphics [TO CONFIRM])          |
                      |                                                                  |
                      v                                                                  |
                ONLINE BROADCAST                  (NDI-to-wall only for non-IMAG / -------+
                (stream + graphics)                where a frame of latency is fine)
```

**Roles in the hybrid:**
- **ATEM = the live camera switcher**, fed by **camera SDI**. Low-latency, frame-synced, reliable, and -- critically -- **it fixes the current outage** by removing the NDI bridge entirely.
- **OBS = graphics + streaming**, pulling **camera NDI** + the presentation tower's **graphics NDI**, compositing and pushing the **online broadcast**. It keeps everything it is good at and is no longer load-bearing for the in-room program.
- **The LED wall** gets the program from the ATEM.

### Wall feed -- the honest detail (reconciles with the prior AV decision)

The task framing of "ATEM program -> NDI/decoder -> NovaStar -> wall" works, but **it is the second-best path for IMAG.** The prior sanctuary-AV decision (`dc-colg-av-signal-path-presenter-vx1000`, seed 2026-06-24) already established that the **direct video cable to the VX1000 is simplest, lowest-latency, and most reliable**, and that NDI is LAN routing, not the wall-direct feed. That holds here:

- **If the wall shows IMAG** (magnifying the live stage), feed it **ATEM program -> SDI/HDMI -> VX1000 -> wall directly.** NDI's encode -> net -> decode latency is exactly what you do NOT want on IMAG -- it desyncs the screen from the room. **[TO CONFIRM: does the wall currently show IMAG?]**
- **The NDI encoder -> decoder -> VX1000 path is valid only** for non-IMAG content (a graphics-only wall, or a remote wall where a cable run is impractical and a frame or two of latency is acceptable).

So the recommended wall feed is **direct SDI/HDMI from the ATEM program**, with the NDI-to-wall path documented as the fallback for the cable-impractical / graphics-only case.

---

## 5. The OBS-only path remains valid -- state the tradeoff plainly

Going **all-OBS** (Option A, retiring the ATEM) is a legitimate choice **if and only if** sovereignty + a single software pane outweigh latency + reliability for this room. That is a real, defensible priority -- but it is a **deliberate trade**, not a free upgrade:

- You gain: one sovereign surface, max graphics flexibility, no hardware box.
- You accept: the program now rides PC/OS reliability (the exact class that just failed), and IMAG inherits NDI latency.

If Darrell wants the all-software pane on purpose, the mitigations are explicit: a **dedicated, locked-down switching PC** (no updates, no other load, no GPU contention -- separate from the AI-worker tower per DR-0012 role separation), a **hot standby**, and accepting the IMAG latency or moving IMAG off the wall. The recommendation is the hybrid; the all-OBS path is named here so the choice is made with eyes open, not by omission.

---

## 6. What this ties to

- **NDI incident record** -- this review is the architecture response to the broken NDI -> HDMI -> ATEM bridge (the live camera switch outage).
- **Church device inventory** (lane `local_5a07180f`) -- the cameras, ATEM, towers, VX1000, and the new SDI runs belong as rows there; the inventory is where the real per-device specs + the [TO CONFIRM] items get pinned.
- **LED-wall install runbook** (lane `local_65bfcc0f`, `docs/99-session-notes/2026-06-29-colg-video-wall-install-power-data-runbook.md`) -- the VX1000 -> wall power/data path the program feeds into.
- **Prior AV signal-path decision** (`dc-colg-av-signal-path-presenter-vx1000`, seed `infra/seed-data/2026-06-24-colg-sanctuary-av-gpu-docs.json`) -- direct-cable-to-the-wall, NDI-is-LAN-routing; this review extends it to the camera-switching layer.
- **GPU/role separation** (DR-0012) -- a software switching PC, if chosen, stays separate from the AI-worker tower; live/creative has absolute priority.

---

## 7. Reality-trace -- real vs needs-confirmation (DR-0076)

**Real / recorded this session:** the device list and roles in section 1; the break being the NDI -> HDMI -> ATEM Lenovo Legion bridge; that the PTZOptics cameras output SDI + NDI simultaneously; that OBS already pulls camera NDI successfully; that the VX1000 has SDI/HDMI/DVI inputs (prior seed 2026-06-24).

**Needs Darrell's confirmation before it is final:**
1. **Approve the architecture** -- hybrid (recommended), or deliberate all-OBS, or hold the bridge. PROPOSED until he chooses.
2. **Exact ATEM model variant** -- input count + connector mix decides how the four cameras land on it. [TO CONFIRM]
3. **Wall source** -- IMAG vs graphics-only vs both -- decides direct-SDI vs NDI-decoder for the wall feed. [TO CONFIRM]
4. **Physical SDI runs** -- cable lengths camera -> ATEM and ATEM -> VX1000 (3G-SDI is good to ~100m on quality cable; confirm runs). [TO CONFIRM]

Until he chooses, the hybrid wiring is executable on paper; the SDI re-cabling finalizes the moment the architecture is approved and the [TO CONFIRM] items land.

## His-hand quick checklist (after approval)

1. [ ] Approve: hybrid / all-OBS / hold (section 7.1).
2. [ ] Confirm ATEM model + input map; confirm wall source (IMAG vs graphics).
3. [ ] Cable **camera SDI -> ATEM** (all 3 PTZOptics + the Blackmagic) -- this alone restores the switch and retires the Lenovo Legion bridge.
4. [ ] Keep **camera NDI -> OBS** as-is (no change).
5. [ ] Cable **ATEM program -> SDI/HDMI -> VX1000** (direct) for the wall; NDI-decoder path only if a cable run is impractical.
6. [ ] Decommission / repurpose the Lenovo Legion bridge; record the change in the church device inventory.
7. [ ] Soak alongside the broadcast before the next service; confirm IMAG sync on the wall.
