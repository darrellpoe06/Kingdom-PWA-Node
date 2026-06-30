# COLG Church Device / Asset Register (2026-06-29)

Unified asset register for the Church of the Living God (COLG) sovereign
infrastructure. Closes the gap named in the 2026-06-29 church-infrastructure
documentation audit: the device facts existed, but they were scattered across
per-topic runbooks and seed files with no single register. This is that single
register.

GROUNDING RULE (binding): this file records only what is grounded in an existing
repo document or a verified inventory. Anything not yet inventoried is marked
`SME-PENDING` (Darrell / Bishop Gwin to confirm on-site) and is NOT given a
fabricated value. Church-NAS holdings stay "pending inventory" until read-only
access exists. See VERIFICATION DOCTRINE (DR-0076): no claim without evidence.

The PRIMARY in-app register is the **Church > Devices** surface built in PR #413
(`app/src/components/DeviceInventory.jsx` over the `church_devices` table,
migration `0056`, staff-scoped RLS; `app/src/lib/church-devices.js` holds the
taxonomy + grounded seed feeding the capability router). This document is the
human-readable narrative companion to that surface, and the in-app source for the
"Church device inventory / asset register" milestone of the Church Infrastructure
Program (`infra/seed-data/2026-06-29-colg-church-infrastructure-program.json`).

---

## Compute

| Asset | Role | Known spec | Source | Status |
|---|---|---|---|---|
| CUDA tower A | Livestream-primary (OBS / ProPresenter); AI on idle only | GPU/CPU/RAM specs TBD (re-scoped from the earlier 4070 assumption, PR #409) | `infra/seed-data/2026-06-29-colg-compute-towers-endpoints.json` (on main); `2026-06-29-church-compute-towers-setup-runbook.md` (on main) | PARTIAL |
| CUDA tower B | Livestream-primary (OBS / ProPresenter); AI on idle only | GPU/CPU/RAM specs TBD (re-scoped, PR #409) | same | PARTIAL |
| Per-box detail | GPU SKU / CPU / RAM / PSU / storage | not yet inventoried | -- | SME-PENDING |
| Church NAS | Recordings store + replication peer | ~100 TB capacity after 5x12 TB add (~48 TB usable at SHR/RAID-5; ~36 TB at RAID-6); whole-archive best-versions ~1-2.5 TB | `infra/seed-data/2026-06-23-colg-local-infrastructure-docs.*` (on main) | CONFIRMED (capacity) / contents PENDING INVENTORY |

Note: "two CUDA towers next to the NovaStar, livestream-primary, AI-idle-only" is
the recorded posture (service-time preemption — stop AI inference during Sunday /
Wednesday services so NVENC and the LLM never contend for VRAM). The towers were
re-scoped (PR #409) away from the earlier "RTX 4070" assumption to two towers with
specs TBD; detailed per-box specs are SME-PENDING from Darrell.

## Display / video wall

| Asset | Role | Known spec | Source | Status |
|---|---|---|---|---|
| LED video wall | Sanctuary altar wall | P1.99mm, 16:9, ~2560x1440; cabinet grid + circuit-level power per the confirmed-spec runbook; spec source `app/src/lib/video-wall-spec.js` (23 tests) | `2026-06-29-colg-video-wall-install-power-data-runbook.md` (on main, PR #407); `2026-06-23-colg-video-wall-install-start-event.md` (on main) | CONFIRMED |
| NovaStar VX1000 | LED wall video processor | 6.5 Mpx load capacity; ~650k px/port; 10 ports (wall uses a subset) | `2026-06-24-sanctuary-wall-novastar-vx1000-signal-path.md` (on main) | CONFIRMED |
| Side screens | Auxiliary sanctuary displays | count / size not yet inventoried | -- | SME-PENDING |

Exact wall pitch, cabinet count, and circuit-level power math are confirmed from
datasheets in `app/src/lib/video-wall-spec.js` and the on-main install runbook
(PR #407).

## Network

| Asset | Role | Known spec | Source | Status |
|---|---|---|---|---|
| Church LAN | On-prem network for NAS + towers + wall | tailnet membership for cross-site (home + church on one Tailscale tailnet) | `2026-06-29-research-review-sustainable-headless-nas-loops.md` (on main) | PARTIAL |
| Switches / router / cabling | Backbone | make / model / port count | not yet inventoried | SME-PENDING |

## Capture / audio

| Asset | Role | Known spec | Source | Status |
|---|---|---|---|---|
| Cameras | Livestream + recording | count / model / placement | not yet inventoried | SME-PENDING |
| Sound board | FOH audio mix | make / model / channel count | not yet inventoried | SME-PENDING |

A `lib/sound-board-class.js` model exists in-app for the live-sound EQ/mix assist
spec, but the physical board's make/model is not yet recorded here.

---

## What is SME-PENDING (Darrell / Bishop Gwin to confirm on-site)

1. CUDA tower per-box specs: CPU, RAM, PSU wattage, storage, exact GPU SKU.
2. LED wall final figures once the install/power/data runbook is committed.
3. Side-screen count and sizes.
4. Network gear: switch/router make + model + port counts.
5. Cameras: count, model, placement.
6. Sound board: make, model, channel count.

When confirmed, update this table in place (perpetual-improvement: the register
gets better each pass) and flip the matching `SME-PENDING` / `PARTIAL` rows to
`CONFIRMED` with the source.

## Related records

- Program: Church Infrastructure Program (`colg-church-infra-program-2026-06`).
- Sibling project: Church Local Infrastructure (`colg-local-infra-2026-06`) — the
  content / study-to-course pipeline that RUNS ON this hardware.
- Capital-finance side: the LED wall capital project is tracked separately in the
  gated `church_capital_projects` table (migration 0030, owner/admin RLS).
