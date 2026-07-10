# 2026-07-08 — Church LAN device inventory (real network scan)

**Layer 4 working note.** Captures the method and full result of a real network scan
of the Church of the Living God (COLG) LAN, and records how the readings were folded
into the PoeTech device register.

## Why

The register (`app/src/lib/church-devices.js`) carried the sanctuary AV core (NAS,
both CUDA/GPU towers, the VX1000, the LED wall, the FOH console) but the stage
cameras, the ATEM switcher, the second Synology, and the rest of the LAN were either
guessed at or absent. The NDI-camera control IPs in particular were a `~192.168.1.125
/ .126` **guess** (`led-wall-golive.js`) that a real scan could correct. This note is
the "documentation" Darrell asked for alongside the register update.

## Method

- **Scope:** the church LAN, two subnets — `192.168.0.0/24` and `192.168.1.0/24`
  (both live; gateway/DHCP is the pfSense at `192.168.0.1`).
- **Discovery:** host sweep + service/port probe + mDNS/Bonjour (`_blackmagic._tcp`,
  NDI `macOS AV Output`, AirPlay/Spotify) + SSDP, plus SSH reachability checks on the
  known towers and cameras.
- **Confidence rule (Verification Doctrine, DR-0076):** every row carries a
  `provenance` field — `scan-confirmed 2026-07-08` for a real reading, or
  `needs-eyes-on` for a device seen but **not** positively identified. Where the scan
  could not determine a make/model it is left **UNSURE** in the register — no model
  number was invented.

## Full table

### CONFIRMED — scan-confirmed 2026-07-08

| Device | IP(s) | Type | Notes |
|---|---|---|---|
| PTZOptics 4K "Center-1" | `192.168.1.123` | camera | NDI + SDI, SSH-enabled |
| PTZOptics 4K "Right-3" | `192.168.1.126` | camera | NDI + SDI, SSH-enabled |
| PTZOptics 4K "Left-2" | `192.168.1.127` | camera | NDI + SDI, SSH-enabled |
| Blackmagic ATEM Production Studio 4K | `192.168.0.60` | switcher | Advertises `_blackmagic._tcp`, **NOT** NDI → confirms **no native NDI input** |
| iMac "TLCs-iMac" | `192.168.1.102` (+ `.155`) | media-rig (Apple) | Publishes NDI "macOS AV Output"; Proclaim host / graphics-output Mac; exact model UNSURE |
| OBS / livestream PC "livestream-main-pc" | LAN `192.168.1.73` (wired) + `192.168.0.44` (Wi-Fi); Tailscale `100.72.5.90` | gpu-node | RTX 4070; Elgato Stream Deck attached |
| Left CUDA "tlcmediadpt" | LAN `192.168.1.75`; Tailscale `100.69.19.13` | gpu-node | RTX 4070; Blackmagic HDMI device attached |
| Synology RackStation "tlcrackstation" | `192.168.0.100` | nas | **LIVE** on the church LAN — corrects the earlier "offline 23d" tailnet reading; exact model UNSURE |
| pfSense firewall / gateway / DHCP | `192.168.0.1` | network | Gateway/DHCP for both subnets; appliance hardware UNSURE |
| IP security camera 1 (PSIA/CGI) | `192.168.1.18` | security | Make/model UNSURE |
| IP security camera 2 (PSIA/CGI) | `192.168.0.133` | security | Make/model UNSURE |
| Printer / MFP 1 | `192.168.0.200` | printer | Make/model UNSURE |
| Printer / MFP 2 | `192.168.0.205` | printer | Make/model UNSURE |
| Amazon Echo / Alexa (2) | `192.168.0.54`, `192.168.1.192` | iot | Exact models UNSURE |
| AirPlay / Spotify speakers (3) | `192.168.1.4`, `192.168.0.57`, `192.168.1.178` | iot | Exact models UNSURE |

### NEEDS-EYES-ON — seen on the scan, not positively identified

| Device | IP(s) | Type | Why unconfirmed |
|---|---|---|---|
| Netgear network gear | `192.168.0.136`, `192.168.0.137` | network | Vendor reads Netgear; role (switch / AP / router) NOT confirmed |
| Possible UniFi APs | `192.168.0.245`, `192.168.1.200` | network | Look like UniFi access points; NOT confirmed |
| Yamaha device (possible QL console) | `192.168.0.155` | audio-console | Possible QL; `led-wall-golive.js` also records a Yamaha **TF5** at FOH — QL vs TF5 unresolved |
| Yamaha console + FOH desk | — | audio-console | Exact console (QL1/QL5 vs TF5) to confirm on site |
| **NovaStar VX1000 Pro management IP** | **NOT FOUND** | led-processor | The VX1000 management/control IP did **not** answer on the scan — currently driven by NovaLCT over USB from the booth laptop, so a LAN management IP may be unconfigured. Needs eyes-on to read/assign it. |

## Corrections this scan made

1. **NDI stage cameras** — the old `~192.168.1.125 / .126` guess is replaced by the
   scan-confirmed `.123` (Center-1), `.126` (Right-3), `.127` (Left-2). Corrected in
   both the register and `led-wall-golive.js`.
2. **ATEM = no native NDI** — it advertises `_blackmagic._tcp`, not NDI. Confirms the
   architecture already documented in `church-av-devices.js`: NDI sources must bridge
   to SDI upstream; the ATEM takes SDI/HDMI only.
3. **RackStation is up** — `tlcrackstation` is LIVE at `192.168.0.100`; the earlier
   "offline 23d" was a lapsed *Tailscale* presence, not a downed box.
4. **Two LAN subnets** — `192.168.0.0/24` + `192.168.1.0/24`, pfSense gateway at
   `192.168.0.1`.

## Where it landed

- `app/src/lib/church-devices.js` — new inventory rows + a first-class `provenance`
  field on `makeDevice`; existing rows (GPU nodes, VX1000, FOH console, network core)
  corrected/annotated.
- `app/src/lib/church-av-devices.js` — the `ATEM` object now carries the scan facts
  (`scan.ipAddress` / `scan.mdns` / `scan.nativeNdi`).
- `app/src/lib/led-wall-golive.js` — PTZ camera-IP guess corrected.
- Tests extended in `church-devices.test.js` + `church-av-devices.test.js`
  (proven-to-catch: the IP corrections, the provenance discipline, and the
  no-fabricated-model rule all fail loudly if reverted).

## Open follow-ups (needs eyes-on)

- Read the NovaStar VX1000 Pro LAN management IP (or assign one) — not on the scan.
- Confirm the FOH Yamaha console (QL1/QL5 vs TF5) and its IP (`192.168.0.155`?).
- Identify the Netgear gear (`.136/.137`) and the possible UniFi APs (`.245`,
  `1.200`) at the network closet.
- Read exact models for the iMac, the RackStation, the IP security cameras, the
  printers, and the smart speakers.
