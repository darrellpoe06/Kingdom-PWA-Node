# Interim switcher — OBS on the CUDA tower carries the switch + Proclaim feed (2026-07-05)

> **CONSOLIDATED (2026-07-10, DR-0166).** The current, canonical middle-screen
> topology + wall-feed options + AV guardrails now live in
> [`2026-07-10-middle-screen-independence-and-av-fixes.md`](2026-07-10-middle-screen-independence-and-av-fixes.md)
> (grounded in `app/src/lib/church-av-devices.js`, rendered in the Church Video Wall
> › Middle screen tab). This runbook is retained as the dated 2026-07-05 record of
> the interim OBS switch; where it and the canonical note overlap, the canonical
> note governs. Since then verified: the wall is fed by the wall laptop
> (TLC-Tech-Team) NDI Studio Monitor → HDMI → VX1000 (not only Proclaim-direct), and
> OBS's NDI became LAN-visible after the 2026-07-10 discovery fix.

Layer 4 working artifact + on-site runbook. Darrell on site at COLG today; the live
camera switch is still down (the Lenovo Legion NDI -> HDMI bridge into the ATEM —
the incident DR-0082 responds to). The endorsed end state is the **hybrid**
(camera SDI -> ATEM; DR-0082, still PROPOSED pending the ATEM input map + SDI runs).
**Today's fix is the interim:** the **right CUDA tower (`livestream-main-pc`, RTX 4070,
Win 11 Home)** runs **OBS as the switcher for now** — the deliberate all-OBS path
DR-0082 names in section 5, taken on purpose, WITH its mitigations, until the SDI
re-cable lands.

> **This does not reverse DR-0082.** The hybrid stays the destination; this is the
> stopgap that restores the switch today with zero new cabling, using the path that
> already works (camera NDI -> OBS was never broken).

---

## 1 · The interim signal map

```
PTZOptics #1/#2/#3 --NDI--> church LAN --NDI--> OBS on the CUDA tower  (WORKS today)
Proclaim (presentation) ----NDI-------> OBS scene                      (enable below)
OBS program ---------------------------> online stream                 (as today)
OBS program --fullscreen projector/HDMI--> KEQINX Cat6 extender --> VX1000 input
                                                                    (OPTIONAL — only if
                                                                     the wall shows the
                                                                     switched program)
Booth Alienware laptop --HDMI--> VX1000 HDMI-3 = PRESET 1              (UNCHANGED —
                                                                     stays the wall's
                                                                     safety path)
```

**Honest limit:** the **Blackmagic camera is SDI-only** — it has no NDI and cannot
reach OBS without the ATEM or a capture device. In this interim it is **out of the
switch**. The 3 PTZOptics carry the service. (This is a named cost of the interim,
resolved by the DR-0082 SDI re-cable.)

## 2 · On the CUDA tower (livestream-main-pc)

1. **Clear the box (DR-0012 — live has absolute priority).** Close everything that
   is not OBS: no whisper/faster-whisper runs, no Ollama, no builds, no browser tab
   farms. The Claude Code resident stays idle during service.
2. **OBS + NDI plugin present?** OBS already runs the broadcast on this box.
   Confirm the **DistroAV (obs-ndi)** plugin is installed (Tools menu shows
   "DistroAV / NDI Output settings"). If missing, install DistroAV + NDI runtime
   (free; distroav.org / GitHub releases).
3. **Scenes — one per source, plus mixes:**
   - `CAM 1`, `CAM 2`, `CAM 3` — each an **NDI Source** picking the PTZOptics feed.
   - `PROCLAIM` — the Proclaim NDI output (section 3), full-frame.
   - `CAM + LOWER THIRD` / `PIP` — camera + Proclaim keyed/cornered as needed.
4. **Hotkeys = the cut bar.** Settings -> Hotkeys: bind `1`–`5` to "Switch to scene"
   for the five scenes above. Studio Mode if the operator wants preview/program.
5. **Do not update anything today.** No OBS upgrade, no Windows Update reboot, no
   driver change on a service day (DR-0082 mitigation: locked-down switching box).

Ready-to-paste check on the tower (PowerShell, from anywhere):

```powershell
Test-Path "C:\Program Files\obs-studio\bin\64bit\obs64.exe"
Get-ChildItem "C:\Program Files\obs-studio\obs-plugins\64bit" | Where-Object Name -match "ndi|distro"
```

First line `True` = OBS installed; second line listing a DistroAV/NDI dll = plugin
present. If OBS itself is missing: `winget install OBSProject.OBSStudio` (then the
DistroAV installer from its releases page — it is not reliably on winget).

## 3 · Proclaim -> the chain (the "Proclaim fix")

Proclaim is the current presentation software (confirmed by the go-live pipeline —
the Proclaim team's .docx archive, `infra/church-media-golive/README.md`).
Two lanes, use both:

1. **Proclaim -> the wall (unchanged, already saved):** the booth laptop running
   Proclaim feeds **HDMI -> VX1000 HDMI-3**, and **PRESET 1** on the VX front panel
   is that path full-screen. If the wall shows slides/lyrics, **nothing changes** —
   press PRESET 1 and done (commissioning note 2026-07-03).
2. **Proclaim -> OBS (for the stream + lower-thirds):** enable Proclaim's **NDI
   output** (Proclaim: Settings -> On Air / display settings -> NDI). **[VERIFY on
   the machine — NDI is a Proclaim Pro-plan feature; if this plan doesn't carry it,
   fallback = a display-capture of the Proclaim output monitor, or the PWA's own
   `?output=1` program route (`2026-06-24-ndi-program-output-lhf.md`).]** Then the
   `PROCLAIM` scene in OBS picks it up as an NDI Source like any camera.

## 4 · The wall feed — pick ONE for today

- **Default (recommended today): wall stays on PRESET 1** (Proclaim direct via
  HDMI-3). The wall shows graphics/lyrics; OBS switches cameras for the **stream
  only**. Zero new wiring, zero latency risk, the safety path stays primary.
- **Only if the wall must show the switched camera program (IMAG):** send the OBS
  **Fullscreen Projector (program)** out the tower's HDMI to a free VX1000 input —
  the control-room video lane is the **KEQINX 1x8 HDMI-over-Cat6 extender** path
  (turnkey runbook step 8, <= 70 m). Save it as **PRESET 2** on the VX so the booth
  can flip PRESET 1 <-> 2 from the front panel. **Named cost:** NDI + software adds
  latency — IMAG lip-sync will lag the room slightly (DR-0082's stated trade).

## 5 · If the wall misbehaves — layers FIRST (the 3-hour lesson)

1. **TEST key** on the VX -> Test Pattern / Mapping **Off**.
2. **Layers:** exactly ONE active layer, source = an input showing a live
   resolution, scaling = Full Screen. Close any "No signal" layer.
3. Map (NovaLCT, 8 cols x 6 rows of 320x240) second; cables last — they have never
   been the problem. (`2026-07-03-led-wall-commissioning.md`)

## 6 · Sunday procedure (interim, whole thing)

1. Power: wall + VX1000 Pro + booth laptop + CUDA tower.
2. VX front panel: **PRESET 1** (wall = Proclaim, ~50% brightness).
3. Tower: open OBS only; confirm the 3 camera NDI sources + Proclaim scene show
   live; start the stream.
4. Operator cuts on hotkeys `1`–`5` (or Studio Mode).
5. **Hot standby is PRESET 1 itself:** if OBS ever dies mid-service, the wall never
   flinches (it is not downstream of OBS in the default wiring), and the stream
   restarts with OBS. That is why the default keeps the wall on the direct path.

## 7 · What this ties to / [TO CONFIRM]

- **DR-0082** (hybrid PROPOSED; this is its section-5 interim, mitigations applied).
- **DR-0012** (role separation — no AI load on the switching box during service).
- Commissioning as-built: `2026-07-03-led-wall-commissioning.md` (VX presets, HDMI-3,
  layers-first). Turnkey path: `2026-07-01-colg-onsite-session-turnkey-runbook.md`
  (KEQINX video lane). NDI program route: `2026-06-24-ndi-program-output-lhf.md`.
- **[TO CONFIRM on site]:** Proclaim plan carries NDI output? Which VX input is free
  for the tower HDMI (if IMAG is wanted)? PTZOptics NDI source names as OBS sees
  them? These pin into the device inventory (lane `local_5a07180f`).
- **Exit condition for the interim:** the DR-0082 SDI re-cable (camera SDI -> ATEM)
  — at which point the ATEM resumes the in-room cut, OBS returns to graphics +
  stream, and the Blackmagic camera rejoins. `re-review: 2026-07-19`
