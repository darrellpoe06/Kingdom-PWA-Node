# LED Wall Commissioning — 2026-07-03 (First Light)

**Church of the Living God — The Love Corner · Main sanctuary**
On site: Darrell + helper. Guided live from the cloud session. Same-night result:
the wall ran as one screen and played live sermon video ("Level Up 2026") full-wall.

---

## The wall, as built (all measured on site — DR-0076)

| Fact | Value | Provenance |
|---|---|---|
| Cabinets | 48 — 8 columns x 6 rows | counted + mapping overlay |
| Cabinet pixel map | 320 x 240 px | NovaLCT Receiving Card Size readout |
| Native screen | **2560 x 1440**, single screen | NovaLCT screen config; saved to receiving cards |
| Cabinet | Mirackle P1.99mm, 640 x 480 mm | delivered panels / vendor spec |
| Processor | **NovaStar VX1000 Pro** | front-panel badge + LCD |
| Data map | **8 of 10 ports; one port per column, ports 1-8 left→right facing the wall; each cable enters the TOP cabinet (Receiving Card 1) and daisy-chains DOWN to card 6** | mapping overlay + NovaLCT screen connection |
| Control path | Booth Alienware laptop → USB → VX1000 Pro (NovaLCT 5.9.1) | live session |
| Video input | Booth laptop HDMI → **VX input HDMI-3** (3840x2160@59.94, scaled by the VX) | VX LCD |
| Service state | **Preset 1** = one layer, HDMI-3, Full Screen scaling | saved on the VX |

## The lesson that cost three hours (keep forever)

**Every symptom was on the INPUT side. The map and the cables were right from the start.**

The wall showed scrambled desktop fragments + black right columns for hours. The
cabling was checked, the screen map was drawn and re-sent 5+ times — no change,
because none of that was broken. The actual causes, in the order they hid:

1. **A dead layer stacked on top** — Layer 1 bound to an input with *No signal*,
   compositing black over everything.
2. **The live layer windowed, not full-screen** — Layer 2 held the laptop feed as
   a Custom-size window (2560x1440 at X=315) instead of Full Screen scaling.
3. **Test-pattern modes left on** — both the receiving-card test (NovaLCT) and the
   VX front-panel TEST pattern can paint the wall; while either is active, **no
   input can appear no matter what else you fix.**

**Diagnostic order for any future "wall looks wrong": LAYERS first, screen map
second, cables last.** The receiving-card Test Pattern is the clean discriminator:
if the pattern renders continuous across all cabinets, the map + cabling are
proven good and the problem is 100% input/layer side.

## Sunday morning (the whole procedure)

1. Power on wall + VX1000 Pro + booth laptop.
2. Press **PRESET → 1** on the VX front panel.
3. Done. (Brightness standard: ~50% for services.)

## If the picture ever misbehaves

1. **TEST key** on the VX → make sure Test Pattern / Mapping are **Off**.
2. **Layer check** (VX LCD): exactly ONE layer active, Input Source = the HDMI
   showing a live resolution, Scaling Mode = Full Screen. Close any layer that
   says "No signal."
3. Only then look at NovaLCT (map: 8 cols x 6 rows of 320x240) — and cables last;
   they have never been the problem.

## Punch list (open items)

- [ ] **Dark LED modules** — a few individual modules dark; positions photographed.
      Vendor warranty swap (LED Nation USA). Snap-in parts, ~10 min each.
- [ ] **EDID nicety** — the VX input advertises a mode list without 2560x1440, so
      the laptop outputs 4K and the VX scales. Works fine; for 1:1 pixels set a
      custom input EDID of 2560x1440 (VX Input Settings → EDID). `re-review: 2026-07-20`
- [ ] **NovaLCT config backup to NAS** — exported locally on the booth laptop
      during commissioning; copy to the NAS church share. `re-review: 2026-07-10`
- [ ] **Tactical RMM agent** on the control-room tower (livestream-main-pc) —
      identify who operates it (prior IT vendor?). Feeds the network-infrastructure
      project. `re-review: 2026-07-10`

## Same-night companions

- **Claude Code residents installed + signed in (Claude Max):** the AV booth
  Alienware and the control-room CUDA tower (`livestream-main-pc`, RTX 4070 12 GB,
  driver 595.95). Each carries a CLAUDE.md role file written on the machine.
- **faster-whisper pipeline** install started on the tower (Python 3.12 + ffmpeg +
  faster-whisper; no PyTorch needed — CTranslate2 wheel). Resumes at the next
  approval prompt on the machine.
- **Remote access:** tower is Windows 11 Home → no native RDP hosting. Path chosen:
  **RustDesk over Tailscale** (direct IP `100.72.5.90`, permanent password,
  no public relay). Tailnet verified: livestream-main-pc, poetech (NAS),
  kingdom-home, darrells-z-fold7, tlcrackstation.

*Recorded per LESSONS-LEARNED discipline: incident → extracted principle →
forward fix. The extracted principle (layers-first diagnostic order) is encoded in
`video-wall-spec.js` (`COMMISSIONING`, `DATA_AS_BUILT`) and shown on the Video
Wall surface timeline.*
