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

## 5. SAFETY (real — load + fire, not moralizing)

- **Size for PEAK, not average.** The **100 W** maximum per cabinet sets the circuit math — not the 50 W average.
- **Never exceed 80% of a breaker** (1440 W on 15 A, 1920 W on 20 A). The tables above already apply it.
- **Mind inrush.** 48 LED power supplies switching on together draw a large surge that can trip a breaker even when the steady load is fine. **Stagger powering the chains on** (or use a power sequencer) — do not energize the whole wall at one switch.
- **Ground it properly** — bond every cabinet chassis and the frame to earth ground.
- **Permanent install → licensed electrician.** For a permanent wall, a **licensed electrician should confirm the dedicated circuits and the feed/panel capacity.** This math sizes the *load*; the electrician signs off the *building* side.

---

## 6. Quick reference card (tape it to the processor)

```
WALL:   8 wide x 6 high = 48 cabinets | 16.80 x 9.45 ft | 16:9 | ~2560x1440
CABINET: 640x480 mm | 7 kg | 100W peak / 50W avg | PowerCon TRUE1 (confirm)
POWER:  4800W peak total | 8 cab/cord = 800W = 6.7A = SAFE
        15A circuit -> 14 cab max | 20A -> 19 cab max | NEVER past 80%
        PLAN: 6 chains of 8 -> 6x15A circuits (or 3x20A, 2 rows each)
        Stagger power-on (inrush). Ground everything. Electrician signs the feed.
DATA:   8 cabinets/port (650k cap) | one port per row | 6 of 10 ports used
        VX1000 -> Cat6 -> cabinet data-IN -> daisy-chain
```

---

## Sources / citations

- **Cabinet (P1.99, 640×480×75 mm, 7 kg, 100 W max / 50 W avg, 100–240 V):**
  Mirackle P1.99 mm indoor panel vendor spec page — https://mirackle.us/indoor-led/p1-99mm/ (verified 2026-06-29).
- **Processor (6.5 Mpx load, 650,000 px/port, 10 ports):**
  NovaStar VX1000 All-in-One Controller Specifications V1.6.0 — https://oss.novastar.tech/uploads/2024/07/VX1000-All-in-One-Controller-Specifications-V1.6.0.pdf
- **Signal path / VX1000 I/O:** `app/src/lib/display-targets.js`; session note `2026-06-24-sanctuary-wall-novastar-vx1000-signal-path.md`.
- **80% continuous-load rule, inrush, grounding:** standard NEC practice for continuous AV loads; a licensed electrician confirms the building feed for a permanent install.

### CONFIRM / open items
- **Pitch reconciliation:** the in-app card listed **P2.97 mm** from an early estimate; on-site + the matching 640×480 product point to **P1.99 mm**. Confirm against the cabinet label and the LED Nation invoice line item; the app spec has been updated to P1.99 and flagged.
- **Power + data connector type and amp rating:** assumed PowerCon TRUE1 (16 A) + RJ45/etherCON Cat6 — **confirm on the actual cabinet** before trusting the per-cord max.
- **Exact pixel map (2560×1440):** derived from a 320×240 module map — confirm from NovaLCT / the packing list; the true count is the authority.
