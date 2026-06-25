# Sanctuary altar LED wall + NovaStar VX1000 — signal path (2026-06-24)

Layer 4 working artifact. The COLG sanctuary video-wall capital project is materializing
(gear arriving). This pins the **display target**, the **corrected signal path**, and
the **native-resolution** the Presenter/NDI work renders to. Companion to the
presenter-replaces-ProPresenter roadmap (`2026-06-24-presenter-replaces-propresenter-roadmap.md`).

## The wall (primary output target)

- **New ALTAR / sanctuary LED video wall** — **9 ft (H) × 12 ft (W)**, **1.9 mm** pixel
  pitch, driven by a **NovaStar VX1000** all-in-one video processor + controller.
- **Native resolution (derived):** ~**1925 × 1444** (≈ **4:3**, ~**2.78 Mpx**). Design
  canvas **1920 × 1440**. *Estimate — confirm the EXACT pixel map from the NovaStar
  screen config (NovaLCT) / LED module datasheet; the true count snaps to the cabinet
  grid.* (Encoded honestly in `lib/display-targets.js`, `exact:false`.)
- Well within the VX1000's load capacity (6.5 Mpx; max canvas 10240 × 8192).

## Corrected signal path — the wall is HDMI/DVI from the VX1000, NOT NDI-direct

**Important correction.** The VX1000 has **no native NDI input**. Its inputs are
2× HDMI 1.4 (+loop), 2× DVI / "HDMI 4.1" (+loop), 1× 3G-SDI (+loop), 2× 10G optical fiber.

**Two lanes — keep them straight:**

1. **Wall lane (HDMI/DVI):**
   `Presenter PC --HDMI/DVI--> NovaStar VX1000 --> wall`
   The presenter PC outputs HDMI/DVI **directly** into a VX1000 input; the VX1000 maps to
   the LED grid and drives the wall (1-frame latency, genlock, stepless scaling).
   **Use the DVI / "HDMI 4.1" higher-bandwidth input for ~1920×1440@60** (HDMI 1.4 tops
   ~1080p60 / 4K30). To put an **NDI** source on the wall, decode it first
   (NDI→HDMI converter) into a VX1000 input — the VX1000 itself won't ingest NDI.

2. **NDI production-LAN lane (IP routing):**
   `cameras / production --NDI--> LAN`, `Presenter --OBS Browser Source + DistroAV (#322)--> NDI --> switcher / streaming PC / side-screen players`.
   **NDI = LAN transport** for camera/production feeds + sending the presenter program to
   the switcher and other screens over IP. It does **not** feed the VX1000 directly.

So: **the wall = HDMI from the VX1000; NDI = production-LAN routing.** Both true at once.

## Render at native resolution — especially images

The Presenter output renders to the wall's **native res/aspect** (configure the presenter
PC's HDMI/DVI output, or the OBS Browser Source, to ~1920×1440 / 4:3). On a 1.9 mm wall
**every pixel shows**, so:

- **`imageProgram` / `imageItem` shipped** — a full-bleed image cue (sermon graphic,
  worship background) renders **edge-to-edge at native quality** (`NdiProgramOutput`
  image branch, object-fit contain/cover, optional caption).
- **Authoring rule (binding for crisp media):** feed **high-res source images** at or
  above the wall native res; **never upscale** a small asset onto the wall
  (`display-targets.IMAGE_AUTHORING_RULE`). High-res in → amazing out.

## Optional (secondary, NOT the LHF): app-driven VX1000 control

The VX1000 exposes **RJ45 PC-control + USB** (NovaLCT / NovaStar control SDK-API) and
**10 user presets**. The app *could* optionally manage the wall per service/scene from
the master Sunday program — recall a preset, brightness/chroma, genlock, input/layer
switch. Spec'd in `display-targets.VX1000_CONTROL` as an **optional enhancement** with
live-production guardrails (read-only status first, explicit operator confirm, never
auto-switch mid-service — Cage / three-brakes posture). **Not** on the presenter-
replacement critical path.

## What shipped this increment

- `app/src/lib/display-targets.js` — the wall + side-screens + VX1000 facts + corrected
  `SIGNAL_PATH` + honest `nativeResEstimate()` + `IMAGE_AUTHORING_RULE` + `VX1000_CONTROL`
  (all data/pure; the doc + any surface read from it so the claim never drifts).
- `app/src/lib/ndi-output.js` — `imageProgram()` builder + `?kind=image` parse support.
- `app/src/components/NdiProgramOutput.jsx` — full-bleed image render branch.
- `app/src/lib/worship-presenter.js` — `imageItem()` first-class set-list cue + program
  mapping + master-program adapter + parity-map entry.
- `app/src/__tests__/display-targets.test.js` — proven-to-catch: the not-NDI-direct
  signal path, the honest never-exact native res, and the end-to-end image cue path.

## Updated LHF call (for this materializing wall)

Unchanged in spirit, sharpened by the hardware: the **lowest-effort, highest-value win**
is the **Presenter program output → the existing switcher + the side screens over NDI**,
**and** the **Presenter PC → HDMI/DVI → VX1000 → the new wall** as the main screen, both
rendered at the wall's native res. The wall is fed HDMI/DVI (not NDI); NDI routes the
production LAN. No GPU required for any of this (the VX1000 does the LED processing).
