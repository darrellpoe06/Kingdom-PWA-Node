# COLG Sanctuary LED Video Wall — INSTALL + POWER + DATA runbook (on-site)

> Layer 4 working artifact. Print or paste this on site. Grounded in vendor
> datasheets (cited at the end); every number that could NOT be verified from a
> datasheet is marked **CONFIRM** with the safe conservative default. The money
> (invoice / donations) is deliberately NOT in this file — it lives only in the
> gated in-app budget (the repo is public). Date: **2026-06-29**.

---

## 0. CONFIRM ON SITE FIRST (about 60 seconds — these set everything below)

1. **Pitch:** read the label on one cabinet — it should say **P1.99** (a.k.a. ~1.9 mm). *(The app previously listed P2.97 from an early quote; the real product is P1.99 — see note at the end.)*
2. **Count the cabinets:** confirm the wall is **8 across × 6 high = 48 cabinets**.
3. **Cabinet size:** confirm each cabinet is **640 × 480 mm** (≈ 25.2" × 18.9").
4. **Power connector:** look at the power IN/OUT on a cabinet — confirm it is **Neutrik PowerCon TRUE1** (or note what it actually is + its amp rating).
5. **Data connector:** confirm **RJ45 / etherCON (Cat6)** data IN/OUT.
6. **Circuits available** behind the stage: how many **15 A** vs **20 A** dedicated circuits can you reach?

If any of 1–5 differs, the math below shifts — flag it and re-derive.

> ### ✅ CONFIRMED CHAIN (2026-06-30) — also rendered in-app (Projects tab → LED wall)
> - **LED DATA wiring:** **8 LED lines, one per COLUMN** → top cabinet of each column → daisy-chain **down its 6**. ~**510k px/line** (6 × ~85k), under the ~650k limit; **8 of 10 ports, 2 spare**. DIRECT shielded Cat6, **no switch, ever**.
> - **VIDEO IN (owned gear, replaces the NDI decoder):** program source (ATEM / presentation tower) HDMI → **KEQINX 1×8 HDMI-over-Cat6 splitter** → CAT OUT 1 → Cat6 (**≤ 70 m**) → **receiver at the wall** → HDMI → NovaStar HDMI in. CAT OUT 2–8 feed the stage TV / confidence monitors / lobby from the same source.
> - **CONTROL:** NovaStar control port → Cat6 → server-room switch (network).
> - **MAP:** arrange the 8 × 6 cabinets in **NovaLCT** over the control connection.
> - Native ~**2710 × 1508** (~4.1M px), ~85k px/cabinet (the wall-spec module carries the ~2560×1440 module-map estimate; NovaLCT confirms the exact count).
> The in-app version (documentation + staff teaching card + finish-checklist + diagram) lives on the **LED-wall capital-project record**.

> ### 🔦 FIRST LIGHT (fresh out of the box)
> **The VX1000 Pro is a controller, NOT a media player — a USB stick of videos will not play in it.** Feed it an HDMI source (a laptop in VLC full-screen is easiest). And a brand-new controller has **no screen map**, so a source lights the tiles but won't show a coherent picture until it's mapped once in **NovaLCT**.
> - **Tonight (proof of life, 5 min):** HDMI source → a VX1000 HDMI input → select that input on the panel. Expect the wall to **light up scrambled / repeated / partial — that's normal and a WIN** (power + LED data + source all live). Don't chase a clean picture tonight.
> - **Tomorrow (map it once):** Windows laptop + **NovaLCT** + USB/Cat6 to the control port. Sequence: **Connect → Receiving-card config (vendor `.rcfgx` or Smart Settings) → Screen Connection (columns = 8, rows = 6; assign each output port to its column in cable order) → Save to hardware → set brightness → feed the HDMI source.** Menu labels/advanced password vary by NovaLCT version — the vendor `.rcfgx` is the reliable path.
> - **Unblock it:** ask LED Nation tonight (1) whether the **receiving cards are pre-loaded** and (2) for the **screen config `.rcfgx`**. The in-app card carries a copy-ready message.

> ### 💻 VX1000 SOFTWARE (download + which machine)
> Download all NovaStar software: **https://www.novastar.tech/downloads/**
> - **NovaLCT** — *main configuration tool*: screen layout, Ethernet-port → cabinet mapping, brightness/chroma calibration, firmware, **RCFG** cabinet-file import. → **control-room CONFIG laptop (Windows)**.
> - **V-Can** — *live on-site control after config*: input switching, layers, presets. → **control-room OPERATOR machine (Windows)**.
> - **VICP** — *optional cloud monitoring*. → any admin machine (optional).
> **On-site first setup:** (1) connect the VX1000 via **USB Type-B** for first setup (more stable than Ethernet); (2) open NovaLCT, log in **Advanced / Synchronous** user (default password **"admin"**); (3) **Screen Configuration** → map the **8 × 6 = 48**-cabinet grid across the VX1000 output ports; (4) load the panel maker's **RCFG** if provided; (5) switch to **V-Can** for live control. *(Confirm the real control-room machines + who runs NovaLCT vs V-Can.)*

---

## 1. THE WALL (confirmed spec)

| Item | Value | Source |
|---|---|---|
| Vendor | LED Nation USA | invoice (on file, in-app budget) |
| Panel | **Mirackle P1.99 mm** fine-pitch indoor LED | mirackle.us P1.99 page |
| Cabinet size | **640 × 480 × 75 mm** (25.2 × 18.9 × 3 in) | vendor |
| Cabinet weight | **7 kg (15.2 lb)** each | vendor |
| Cabinet power | **100 W peak / 50 W average** | vendor |
| Cabinet voltage | 100–240 V, 50–60 Hz | vendor |
| Grid | **8 wide × 6 high = 48 cabinets** | derived from 16.9 × 9.4 ft |
| True wall size | **16.80 ft W × 9.45 ft H** (5120 × 2880 mm) | grid × cabinet |
| Aspect | **exactly 16:9** | grid |
| Native resolution | **≈ 2560 × 1440 px (QHD, 16:9), ~3.69 Mpx** — **CONFIRM** exact map from NovaLCT/packing list | 320×240/cab × grid |
| Total cabinet weight | **≈ 336 kg (740 lb)** of cabinets (+ frame) | 48 × 7 kg |
| Processor | NovaStar **VX1000** (6.5 Mpx load; 650k px/port; 10 ports) | NovaStar spec V1.6.0 |
| Sources | dual RTX 4070 machines → VX1000 (HDMI/DVI) → wall | display-targets.js |

---

## 2. INSTALL SEQUENCE (build order)

1. **Level the base.** Set and **level the rolling bases / floor frame first.** Fine-pitch is unforgiving on flatness — a base out of level multiplies into seam steps up the wall. Lock the casters once positioned.
2. **Build the bottom row first.** Seat the bottom row of cabinets onto the frame and align them to each other. The bottom row is the reference everything stacks on.
3. **Lock cabinet-to-cabinet AND to the frame.** Engage the **cam locks / quick-locks** between adjacent cabinets, then fix each cabinet to the support frame. Cabinets pull tight to each other so the seams close; the frame carries the load.
4. **Stack upward, one full row at a time.** Lock each new cabinet to the one below and beside it. Keep checking the wall stays **plumb** as it rises.
5. **Seam + flatness check.** Walk the face: no proud/recessed tiles, no open seams. Adjust cabinet alignment until the face is flat and seams tight **before** dressing wire.
6. **Wire DATA, then POWER.** Cat6 data daisy-chains first (VX1000 port → cabinet data-IN → next), then power daisy-chains. Keep power and data physically separated; **label every chain** to its circuit/port.

---

## 3. POWER PLAN (the math, sized to PEAK)

**Formula:** max cabinets per circuit = **(circuit watts × 0.80) ÷ 100 W peak per cabinet**.
The 0.80 is the code rule — never load a breaker past 80% continuous.

| Circuit | Capacity | Usable (80%) | **Max cabinets** |
|---|---|---|---|
| **120 V / 15 A** | 1800 W | 1440 W | **14 cabinets** |
| **120 V / 20 A** | 2400 W | 1920 W | **19 cabinets** |

**Whole wall:** 48 × 100 W = **4,800 W peak** (40 A @ 120 V) · 48 × 50 W = **2,400 W average**.

### "Is 8 cabinets to one cord safe?" — YES.
- 8 cabinets × 100 W peak = **800 W = 6.7 A** at 120 V.
- That is **well under** a 15 A breaker's 1440 W (80%) cap **and** under the PowerCon TRUE1 **16 A** cable rating. Comfortable margin (running ~45% of a 15 A circuit). **Safe.**
- Power **daisy-chains** cabinet→cabinet (power-IN → power-OUT) up to the safe max, then one feed per chain.

### Recommended layout (power, data, and the wall all line up)
Chain **one row of 8 cabinets per cord** → **6 chains** (the wall is 6 rows high).

- **Simplest + safest:** give **each row its own 15 A circuit → 6 × 15 A circuits.** Each pulls ~6.7 A (lots of headroom; survives a bad cabinet without dragging neighbors).
- **Fewer circuits (20 A):** a 20 A circuit safely carries **2 rows = 16 cabinets = 1,600 W = 13.3 A** (under the 1,920 W cap) → **3 × 20 A circuits** for the whole wall.
- **Do NOT** put 3 rows (24 cabinets, 2,400 W, 20 A) on one circuit — that's at/over the limit. Max **14 cabinets** on any 15 A, **19** on any 20 A.

---

## 4. DATA MAP (NovaStar VX1000)

- Each cabinet ≈ **320 × 240 = 76,800 px** (CONFIRM module map).
- VX1000 port cap = **650,000 px** → **650,000 ÷ 76,800 = 8 cabinets per port.**
- Map **one data port per row of 8** = **8 × 76,800 = 614,400 px/port** — fits with ~35,600 px (~5.5%) headroom.
- **6 rows → 6 data ports** of the VX1000's 10. (4 ports spare for redundancy/expansion.)
- Whole wall = **3,686,400 px (~3.69 Mpx)** — within the VX1000's **6.5 Mpx** load. ✓
- Path: **VX1000 port → Cat6 → cabinet data-IN → data-OUT → next cabinet** (daisy-chain), one chain per port.
- **Note the thin margin:** a row of 8 sits at 614k of the 650k cap. If the true module count is higher than 320×240, a row could approach/exceed 650k — then split that row (7 + 1) or add a port (you have 10). Read the real px/cabinet from NovaLCT and re-check.

---

## 5. CAMERA / SIGNAL-CHAIN INTEGRATION (two switchers, two jobs)

There are **two switchers** and they do **different jobs** — don't conflate them:

```
all cameras + sources -> ATEM Production Studio 4K  (PRODUCTION switch: cut cameras -> ONE program)
                      -> NovaStar VX1000            (SOURCE switch: place on wall, select whole source, layer, backup)
                      -> LED wall
```

### The NovaStar VX1000 — precise role (it DOES switch, at SOURCE level)
The VX1000 is the LED-wall **processor** *and* a **source-level switcher**. It:
- **Source selection** — picks which **whole input** shows on the wall (e.g. in1 = ATEM program / live service, in2 = ProPresenter / lyrics laptop, in3 = media player / backup). The operator switches the wall between whole sources.
- **Backup / failover** — primary + backup input; **falls to the backup if the main feed drops** (matters for a live Sunday).
- **Multiple signal types** — HDMI / SDI / DVI / DP inputs; connect different device outputs directly.
- **Layers / PIP** — composites **more than one input at once** (program full-screen + a graphic overlay, split, or PIP); inputs feed layers.
- **It does NOT** do multi-camera **production** switching — program/preview, transitions, keyers, a director cutting cameras. **That is the ATEM.**

> *SME-pending:* confirm the **exact VX1000 input count** and **which inputs are wired to what** at the booth (is a backup / lyrics input free?).

### The ATEM Production Studio 4K — the production switcher
- **20× 6G-SDI + 1× HDMI** inputs (21 video inputs).
- **A frame synchronizer on EVERY input** → it switches **ANY** source: Blackmagic or not, **non-genlock cameras**, or computer/graphics outputs. *(The "only Blackmagic cameras" belief is **incorrect for switching**.)*

### What IS Blackmagic-specific
- **Remote camera control (iris / focus / color) + tally**, carried over the **SDI return**. Needs a **Blackmagic camera**.
- **Non-BMD cameras switch fine** — they just don't get that remote control + tally.
- **HDMI cameras** come in through a **bidirectional SDI/HDMI micro converter**, which **also carries the control back**.

### Getting non-SDI sources in ("other devices")
| Source | Bridge | Camera control? |
|---|---|---|
| HDMI camera / computer | Bidirectional **SDI/HDMI micro converter** → ATEM SDI | Yes (converter carries it back) |
| IP camera | **NDI → SDI converter** → ATEM SDI | No |
| USB / NDI / capture | **OBS on a church tower** (software switcher) → OBS out → VX1000 | No |

> OBS already lives on the production box (the **towers are livestream-primary**), so it's the ready software-switcher path for sources the ATEM can't take directly.

---

## 6. LED OUTPUT — how the VX1000's 10 Ethernet ports drive the wall

**These RJ45 ports are NOT network.** They carry NovaStar's proprietary **LED data protocol** to the cabinets' **receiving cards**. Keep them **OFF the church LAN** (dedicated LED data lines).

**Flow:** VX1000 **scales the input → one canvas** (the whole wall image) → **slices the canvas into regions** → **each region is sent out one port** → the **receiving card in each cabinet grabs its pixel slice** and lights its section.

- **Per-port capacity ≈ 650,000 px** (Gigabit limit). **10 ports ≈ 6.5M px** total cap.
- **This wall ≈ 3.7M px** (at the 2560×1440 module map) **up to ~4.1M px** (a ~2710×1508 estimate) → **fits comfortably** under 6.5M **either way**; real headroom; **likely won't need all 10 ports.**
- **Cabinets daisy-chain off each port in strings:** port → cabinet → cabinet → … Each string is one port's slice.
- **Load-balance:** keep **no port over ~650k px**; spread cabinets across ports; **leave a spare port** for safety.
- **Mapping (NovaStar software):** **NovaLCT** for receiving-card config + the **VX1000 menu / Vision Management** — define the screen size, then **assign which cabinets belong to which port and their physical order/orientation** so the sliced regions land correctly. **Wrong order = the section tiles in the wrong place** (the same addressing step as the data-cabling sequence).

> *SME-pending:* cabinet **count + physical grid (rows × columns)** to compute per-port balancing, the mapping layout, and to leave a spare port.

---

## 7. CABLING — TWO separate jobs (and the rule that prevents a failed install)

> ### ⚠ CRITICAL: the LED output ports CANNOT pass through a network switch.
> The VX1000's 10 output ports carry NovaStar's **proprietary LED data protocol**. A network switch only speaks **TCP/IP** and **will NOT pass it**. LED output must be **POINT-TO-POINT**: processor output port → **directly** to the wall's first cabinet → daisy-chain cabinet-to-cabinet. **No switch in the LED-data path, EVER.**

**Two cabling jobs — do not confuse them:**

| Job | Through a switch? | Carries | Cable |
|---|---|---|---|
| **NETWORK** | ✅ OK | Cameras, control, internet, NDI / SDI-over-IP video between rooms | The planned **120 ft Cat6 → upstairs switch → control-room switch** serves THIS |
| **LED DATA** | ❌ **NEVER** | NovaStar output ports → wall cabinets | **Shielded Cat6 (STP)**, ≤ ~100 m / 330 ft per run, or **fiber** if longer |

> **Darrell's 120 ft run is fine for NETWORK/video** (cameras, control, internet, NDI/IP between rooms) — **but it MUST NOT carry LED data** from the NovaStar to the wall.

**Implication:** the NovaStar must be placed where it has a **direct cable shot to the wall cabinets**; its video *source* can travel over the network/switches (NDI) or a short cable.

> *SME-pending:* physical layout — LED wall vs control room (ATEM/towers) vs "upstairs"; and whether the 120 ft run is intended for LED data (must reroute) or network/video (fine).

---

## 8. PLACEMENT — NovaStar AT the wall, control tower in the control room (DECIDED)

**Decision:** NovaStar **at the wall**; the presentation / CUDA tower **stays in the control room**. Clean **control-plane / data-plane** split:

- **DATA plane (LED pixels):** NovaStar at the wall → **short shielded Cat6 DIRECT to the cabinets.** Never touches the network. (Short direct runs solve the no-switch constraint best.)
- **CONTROL plane (brightness / input-select / mapping / on-off / config):** the VX1000's **separate control Ethernet port → the LAN →** NovaStar control software (**NovaLCT / COEX / Vision Management**) on the control-room tower. **Control rides the LAN; pixel data does not.**

**Input-side vs output-side (so it's not confused):**
- **OUTPUT side** = the NovaStar **plugs into the wall**: the 10 Ethernet ports drive the cabinets directly (point-to-point shielded Cat6, no switch). **The LED wall IS the display.**
- **INPUT side** = the NovaStar takes a **video signal IN (HDMI/SDI)** from the source (presentation tower / ATEM). It **does not generate a picture itself.**
- **Full path:** source → **HDMI/SDI INTO** the NovaStar → NovaStar → **Ethernet OUT to cabinets** → wall.
- **NO monitor needed at the wall** — the LED wall is the display. A small monitor near the wall or in the booth is **optional** confidence/preview only.

**Getting the picture from the control room to the wall** (the tower can't hand HDMI across the building):

| Option | How | Cost |
|---|---|---|
| **A — NDI decoder at the wall (RECOMMENDED)** | The presentation is already **NDI** on the LAN → a small **NDI decoder** at the wall (Birddog / Magewell, or a mini-PC running NDI Studio Monitor) → **HDMI into the NovaStar**. Rides the GB switches + the 120 ft run as IP; no dedicated video cable. Same pattern as the Legion, smaller box. | One decoder |
| **B — HDBaseT extender** | HDMI-over-Cat6 extender: **TX at the tower, RX at the wall**, on a dedicated Cat6 (120 ft is well within range) → HDMI into the NovaStar. No network load, no decoder. | TX/RX pair + dedicated Cat6 |

**Publish-once NDI** (keeps wall + livestream in sync): the presentation tower publishes the presentation **once** as an NDI source on the LAN. **Two subscribers** pull it — the **wall** (NDI decoder → HDMI → NovaStar) and the **livestream/OBS boxes** (composite it into the broadcast as they do today). One source, two destinations; wall + stream stay in sync; livestream workflow unchanged.

**WALL-CORNER cabling list:**
- **LED data** — NovaStar → cabinets: DIRECT shielded Cat6, short, **no switch**.
- **Power** — NovaStar + cabinets (per the §3 power/circuit math).
- **LAN drop** — NovaStar control port → network → control software on the control-room tower.
- **Video** — **EITHER** an NDI decoder on a LAN drop → HDMI → NovaStar **(A)**, **OR** an HDBaseT RX on a dedicated Cat6 from the control room → HDMI → NovaStar **(B)**.
- **CONTROL ROOM:** the presentation tower publishes NDI + runs the NovaStar control software (+ the HDBaseT TX if Option B).

> The only two **non-network** things at the wall are the **short direct LED run** and **power**. Control and the video picture both ride the LAN.

---

## 9. WALL FEED — wall content = presentation + IMAG (one feed, switched upstream)

Wall content = **presentation** (images, announcements, slides, lyrics, **scripture/sermon-point text over a background** while preaching) **+ IMAG** (live camera during the message).

**RECOMMENDED (locked unless Darrell objects): a SINGLE "wall program" feed, switched UPSTREAM.**
Build one dedicated **"wall program" output** in the booth software (OBS / the presentation system / a tower mix) that the operator drives — announcements/images/lyrics by default, **cut to the live camera (IMAG)** during the sermon, **scripture-text-over-background** while preaching. Send that **ONE feed as NDI → ONE decoder at the wall → NovaStar.** The NovaStar does **not** switch here; it just displays the wall program.
- **Benefits:** one decoder (not two), booth-controlled, fewer failure points, matches how they already composite/switch in software.

**Wall content modes** (all produced **upstream**, operator-switched on the single wall program):
announcements/images · song lyrics · **IMAG (live camera)** · **scripture-text-over-background** for preaching. During the sermon the operator alternates **IMAG ↔ scripture-text-on-background** as the message moves.

> Scripture-text-over-background is just another **presentation scene** — produced by the presentation software (**ProPresenter** is the church standard: built-in scripture library + text-over-background templates). It rides the **same** single wall-program NDI feed — **no new hardware**, still one decoder, one feed.

**Alternative (documented, NOT recommended):** two feeds to the NovaStar (presentation + camera program), switch/layer on the VX1000 → needs **2 decoders** and makes the NovaStar the wall switcher (switching lives at the wall, not the booth).

**Buy-list:** confirm **ONE NDI decoder** for the wall (not two).

> *SME-pending:* confirm the **presentation tower software** (ProPresenter assumed) — then document the wall-program output + the sermon-text/scripture workflow in that tool.

---

## 10. SAFETY (real — load + fire, not moralizing)

- **Size for PEAK, not average.** The **100 W** maximum per cabinet sets the circuit math — not the 50 W average.
- **Never exceed 80% of a breaker** (1440 W on 15 A, 1920 W on 20 A). The tables above already apply it.
- **Mind inrush.** 48 LED power supplies switching on together draw a large surge that can trip a breaker even when the steady load is fine. **Stagger powering the chains on** (or use a power sequencer) — do not energize the whole wall at one switch.
- **Ground it properly** — bond every cabinet chassis and the frame to earth ground.
- **Permanent install → licensed electrician.** For a permanent wall, a **licensed electrician should confirm the dedicated circuits and the feed/panel capacity.** This math sizes the *load*; the electrician signs off the *building* side.

---

## 11. Quick reference card (tape it to the processor)

```
WALL:   8 wide x 6 high = 48 cabinets | 16.80 x 9.45 ft | 16:9 | ~2560x1440
CABINET: 640x480 mm | 7 kg | 100W peak / 50W avg | PowerCon TRUE1 (confirm)
POWER:  4800W peak total | 8 cab/cord = 800W = 6.7A = SAFE
        15A circuit -> 14 cab max | 20A -> 19 cab max | NEVER past 80%
        PLAN: 6 chains of 8 -> 6x15A circuits (or 3x20A, 2 rows each)
        Stagger power-on (inrush). Ground everything. Electrician signs the feed.
LED OUT: 10 RJ45 ports = LED DATA, NOT network. ~650k px/port, 6.5M total cap.
        Wall ~3.7-4.1M px -> fits, spare ports. Daisy-chain off each port.
        Map in NovaLCT (which cabinets on which port + order/orientation).
TWO SWITCHERS: ATEM = production switch (cut cameras -> ONE program).
        VX1000 = SOURCE switch (pick whole input + layer/PIP + backup). NOT cameras.
        BMD camera needed ONLY for remote control (iris/focus/color) + tally.
PLACEMENT: NovaStar AT wall, tower in control room.
        DATA plane = short DIRECT shielded Cat6 NovaStar->cabinets. NO SWITCH EVER.
        CONTROL plane = LAN -> NovaStar control port (NovaLCT on control-room tower).
        VIDEO = presentation NDI on LAN -> 1 decoder at wall -> HDMI into NovaStar.
        120ft run = NETWORK/video ONLY, never LED data.
WALL FEED: ONE "wall program" NDI, switched UPSTREAM in booth (announcements/lyrics/
        IMAG/scripture-on-background). 1 decoder. NovaStar just displays it.
CORNER:  power + NovaStar + DIRECT LED Cat6 to cabinets + 1 LAN drop (control + NDI).
```

---

## Sources / citations

- **Cabinet (P1.99, 640×480×75 mm, 7 kg, 100 W max / 50 W avg, 100–240 V):**
  Mirackle P1.99 mm indoor panel vendor spec page — https://mirackle.us/indoor-led/p1-99mm/ (verified 2026-06-29).
- **Processor (6.5 Mpx load, 650,000 px/port, 10 ports):**
  NovaStar VX1000 All-in-One Controller Specifications V1.6.0 — https://oss.novastar.tech/uploads/2024/07/VX1000-All-in-One-Controller-Specifications-V1.6.0.pdf
- **Signal path / VX1000 I/O:** `app/src/lib/display-targets.js`; session note `2026-06-24-sanctuary-wall-novastar-vx1000-signal-path.md`.
- **Switcher / camera chain (ATEM Production Studio 4K — 20× SDI + 1 HDMI, frame sync per input; camera control over SDI return is Blackmagic-specific):** Blackmagic Design ATEM specs — https://www.blackmagicdesign.com . In code: `app/src/lib/church-av-devices.js`.
- **80% continuous-load rule, inrush, grounding:** standard NEC practice for continuous AV loads; a licensed electrician confirms the building feed for a permanent install.

### CONFIRM / open items
- **Pitch reconciliation:** the in-app card listed **P2.97 mm** from an early estimate; on-site + the matching 640×480 product point to **P1.99 mm**. Confirm against the cabinet label and the LED Nation invoice line item; the app spec has been updated to P1.99 and flagged.
- **Power + data connector type and amp rating:** assumed PowerCon TRUE1 (16 A) + RJ45/etherCON Cat6 — **confirm on the actual cabinet** before trusting the per-cord max.
- **Exact pixel map (2560×1440):** derived from a 320×240 module map — confirm from NovaLCT / the packing list; the true count is the authority.
- **ATEM program → VX1000 input:** confirm whether the ATEM program feeds the VX1000 over **SDI or HDMI**, and which VX1000 input is used. Camera **control + tally** works only on **Blackmagic cameras** (or HDMI cameras via the bidirectional converter) — note which cameras on hand are BMD vs. switch-only.
- **VX1000 input count + booth wiring (§5):** confirm the **exact input count** and **which inputs are wired to what** (is a backup / lyrics input free?).
- **Cabinet count + physical grid (§6):** rows × columns to compute **per-port load balancing**, the mapping layout, and to leave a **spare port**.
- **Measured cable run (§7–8):** the **routed** path distance (up-and-over, not straight-line) from the intended NovaStar location to the wall. Under ~300 ft on shielded Cat6 = clear; longer/noisy = plan **fiber**.
- **Cabling-job split (§7):** confirm Darrell's **120 ft run is for network/video, NOT LED data** (if it was meant for LED data it must be rerouted — direct, no switch).
- **Video transport + decoder count (§8–9):** **one NDI decoder** at the wall (Option A) vs an HDBaseT extender (Option B). Buy-list assumes **one decoder**.
- **Wall feed (§9):** confirmed **presentation + IMAG**; recommended **single wall-program feed switched upstream** (not two feeds / VX1000 switching). Confirm the **presentation software** (ProPresenter assumed) for the wall-program + scripture-on-background workflow.
