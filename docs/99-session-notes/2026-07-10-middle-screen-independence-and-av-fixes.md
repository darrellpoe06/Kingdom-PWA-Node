# Middle screen (LED wall) independent of the two side screens — and today's AV fixes (2026-07-10)

Layer 4 working artifact. **Canonical** AV note for the three-screen topology and the
2026-07-10 fixes. Governed by **DR-0166**. Grounded facts live in
`app/src/lib/church-av-devices.js`; the derived report renders in
`app/src/components/ChurchVideoWall.jsx` (Church Video Wall › **Middle screen**).

This note CONSOLIDATES the overlapping middle-screen material from
`2026-07-05-interim-obs-cuda-switcher-runbook.md` (now cross-linked to here) and does
NOT duplicate the device inventory (that is PR #706 / `church-devices.js`).

---

## 1 · Three screens, three jobs (verified on site 2026-07-10, Darrell)

- **MIDDLE screen** = the **LED wall** (Mirackle P1.99mm, 48 cabinets). Fed by the
  **wall laptop (TLC-Tech-Team, Alienware)** running **NDI Studio Monitor**
  full-screen -> **HDMI** -> **NovaStar VX1000 Pro** -> the wall.
- **TWO SIDE screens** = the sanctuary **projectors**, fed from **Proclaim**.
- **BROADCAST** (not a room screen) = **OBS on the RIGHT CUDA**
  (`livestream-main-pc`), NDI "OBS", multistreamed to **YouTube + Facebook**.

NDI sources on the church LAN the wall can point at: PTZOptics **Center-1 / Left-2 /
Right-3** (`192.168.1.123 / .127 / .126`), **NDI ProClaim**, the **iMac**
(macOS AV Output), and **OBS** (LIVESTREAM-MAIN).

> **Reconcile, don't overturn.** The planned production destination
> (camera SDI -> **ATEM** -> VX1000, the DR-0082 hybrid) is where we are going;
> the NDI-Studio-Monitor path above is what runs the middle screen **today**. Both
> are true; `SIGNAL_CHAIN` = destination, `MIDDLE_SCREEN_TOPOLOGY` = current.

## 2 · "Different settings allow for various outcomes" — how to make the wall independent

What the wall shows is set by **which NDI source the wall laptop points at**. Each
option, what it produces, and its opportunities/constraints:

| Option | Produces | Independent of sides? | Independent of broadcast? |
|---|---|---|---|
| Wall -> **OBS NDI** | Mirrors the broadcast (cameras/IMAG) | Yes (not Proclaim) | **No** (tied to broadcast) |
| Wall -> **NDI ProClaim** | Same words as the side screens | **No** (a 3rd copy of Proclaim) | Yes |
| Wall -> **a camera** | Single-camera wall | Yes | Yes |
| **RECOMMENDED — Wall -> "WALL" NDI from a SECOND OBS** | **WORDS ONLY** (Scripture, points, lyrics), Ari-driven | **Yes** | **Yes** |

**RECOMMENDED / CORRECT — the middle screen independent of BOTH:** the wall points at
a dedicated **"WALL"** NDI feed from a **SECOND OBS instance ("WALL OBS")** launched
`--portable --multi --websocket_port 4466` on the **LEFT CUDA** (`tlcmediadpt`), with
its own words/graphics sources that **Ari drives remotely** (under the guardrails).
**Darrell's stated intent: the wall carries WORDS ONLY**, separate from the cameras
AND separate from Proclaim.

- **Opportunities:** the wall becomes its own words-only surface; Ari drives it
  without touching the broadcast or Proclaim; the two OBS instances never collide
  (separate box, separate websocket port 4466).
- **Constraints:** **NOT YET BUILT** — the second OBS, the "WALL" output, and its
  sources do not exist yet; it runs on the LEFT CUDA so it never competes with the
  live encode (DR-0012); Ari driving it is gated by the AV guardrails.

**The wall laptop is a dumb endpoint:** point NDI Studio Monitor at ONE source
(recommended "WALL"), full-screen it, and set **Settings -> Application -> Run at
Windows Start** so a reboot returns to the wall feed unattended. It never switches
mid-service; all "what shows" logic lives upstream in the chosen source.

## 3 · Today's fixes (each with opportunities + constraints)

### 3.1 · NDI discovery fix (the big one)
OBS's NDI source was invisible to the wall because (i) `livestream-main-pc` is
**DUAL-HOMED** with both NICs on overlapping **/23** (wired `192.168.1.73` + Wi-Fi
`192.168.0.44`) and NDI auto-picked Wi-Fi, and (ii) an NDI **Discovery Server**
override (`"discovery":"192.168.0.11"`) **SUPPRESSED mDNS** broadcast.
**Fix** in `C:\ProgramData\NDI\ndi-config.v1.json` (`C:\ProgramData\NewTek\NDI` is a
**JUNCTION** to the same file): `"adapters":{"allowed":["192.168.1.73"]}` +
`"discovery":""` + a **FULL OBS RESTART** (a Main-Output toggle alone was NOT enough).
**Result:** "LIVESTREAM-MAIN (OBS)" became visible.
- **Opportunity:** the broadcast is now a selectable wall source; NDI hygiene on this
  box is fixed for every future source.
- **Constraint / open root cause:** the two NICs should not both be /23 — fix the
  masks in a calm moment. `re-review: 2026-07-24`

### 3.2 · OBS remote control
obs-websocket **v5 on :4455** — Ari can read scenes + switch program. Auth currently
OFF (proven-out only); **resting state re-enables auth with the password read locally
on the box, never in chat.** `re-review: 2026-07-17`
- **Opportunity:** Ari assists the operator without taking the cut; the same
  mechanism drives the future WALL OBS on :4466.
- **Constraint:** auth-off is not a shippable resting state.

### 3.3 · LED wall live over the network
`OBS NDI -> wall laptop Studio Monitor -> HDMI -> VX1000 -> wall`. The **VX1000 has
NO network video input** — one HDMI hop (the wall laptop) is required and cannot be
removed. **FEEDBACK-LOOP WARNING: never feed OBS's own NDI output back into an OBS
scene.**

### 3.4 · Node consolidated (not duplicated)
The booth **Alienware IS the wall laptop**: hostname **TLC-Tech-Team**, tailscale
`100.92.143.124`, user `it department local` (has spaces), **NDI 6 Tools** installed,
PowerPoint -> NDI via **NDI Screen Capture** (GUI-only). Enriched in
`church-devices.js` (`dev-av-booth-laptop`) — one row, not two. Device inventory
otherwise per PR #706.

## 4 · The guardrails (the Ways) — `AV_GUARDRAILS`
Humans keep the live cut · preview-then-execute · writes held while an operator is
live · kill-switch pauses on overrun (three-brakes) · no inference on the live-encode
box (DR-0012) · never an NDI feedback loop.

**NDI gotchas** (`NDI_GOTCHAS`): a multi-homed NIC lets NDI pick the wrong adapter
(pin `adapters.allowed`); a Discovery Server override suppresses mDNS (clear
`discovery`); config is read at process start (full restart required).

## 5 · Ari's responsibilities + reports (derived, not static)
- New Ari standing duty **`av-loop`** (DR-0166): serve the AV chain under the
  guardrails; keep the AV report derived.
- The AV report **derives** from the device rows: `avIndependenceReadiness()`
  classifies each option `available | unverified | not-built`;
  `ariAvCapabilities()` reports Ari's AV capabilities honestly. **NO fake-green** —
  the WALL program reads **not built** until the second OBS exists.

## 6 · Ties / open
- **DR-0166** (this note's governing decision) · **DR-0082** (ATEM hybrid destination)
  · **DR-0012** (no inference on the live box) · **DR-0076** (verification).
- Consolidates: `2026-07-05-interim-obs-cuda-switcher-runbook.md`.
- Ways review: `docs/reviews/REVIEWS.md` **REV-0049**.
- Open: build the WALL OBS (inert, three-braked); re-enable obs-websocket auth
  (`2026-07-17`); fix the dual-homed /23 NIC masks (`2026-07-24`); confirm which host
  publishes NDI ProClaim (iMac vs booth laptop) — needs eyes-on.
