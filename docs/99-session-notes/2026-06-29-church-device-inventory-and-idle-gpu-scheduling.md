# Church Device Inventory + Idle-GPU Opportunistic Scheduling — research-review & design

**Date:** 2026-06-29
**Author:** Claude (advisory), at Darrell's direction
**Layer:** 4 (working artifact) · feeds the in-app surface + the inert scheduler scaffold
**Status:** SHIPPED (inventory surface live) + INERT (scheduler scaffold, unarmed)

---

## 1. What was asked

Two connected things, research-first where there was a design choice
([[feedback-research-first]]):

1. **Church Device Inventory** — a real asset register *inside the PoeTech app*
   for inventory control of church resources: the NAS (DS1621xs), the 2× RTX 4070
   GPU machine(s), the NovaStar VX1000 processor, the LED video wall, network
   gear, cameras/security, the sound board, media-team rigs — each with type,
   location, specs, status, owner/steward, and the job capabilities it can run.
   Gated/role-scoped (church infra = not public). Tied to the LED-wall capital
   project and the church-infrastructure record so they share *one* inventory.

2. **Idle-GPU opportunistic scheduling** — use the church CUDA GPUs when idle
   (overnight, between services) as a compute pool. A deterministic job router
   queues heavy jobs (voice clone, harvest transcription, batch local-LLM) to run
   only when the GPUs are free. Strictly deterministic-first (the scheduler is
   plain code, no LLM); the GPU runs AI jobs only when they are the necessary
   work. Behind the Cage brakes (budget + lock + kill-switch + observability),
   ships inert. The inventory's capability fields feed the router.

---

## 2. Research-review — what already existed (so we don't duplicate)

Three parallel reads of the codebase established the real base. Key findings:

### Systems-of-record / inventory base (migration 0052, `lib/inventory.js`)
- `inventory_items` + append-only `inventory_movements` + `record_events` —
  a **consumable stock ledger**: on-hand DERIVED from the movement ledger
  ("how many LED panels / HDMI cables do we have"). Generic `createTableSync`
  controller, `record-history.js` versioning.

### The LED-wall + church-infra records (already tracked)
- `church_capital_projects` + `church_capex_budget_lines` (migration 0030);
  the wall is slug **`sanctuary-video-wall`**, status `installing`, surfaced by
  `ChurchVideoWall.jsx` (staff-gated, money server-side only).
- NovaStar VX1000 spec + signal path (2026-06-24 session note): Presenter PC →
  HDMI/DVI → VX1000 → wall; **no native NDI input**.
- GPU node stack (`infra/church-gpu-node`, staged): RTX 4070 (12 GB) running
  `ollama:11434` (qwen2.5:14b Q4), `voice-studio:8770` (XTTS-v2),
  `whisper-gpu:8771` (faster-whisper). DR-0012: no inference on the stream-encode
  box during a live service.
- NAS SME pipeline (`infra/nas-sme-pipeline`): Synology **DS1621xs**, 8 cores,
  CPU-only faster-whisper INT8 + local Ollama. Slow on CPU (batch overnight).

### The Cage brakes (reuse exactly)
- `scripts/lib/resume-queue.mjs` + `cap-resume.mjs` `brakeGate` — the proven
  three-brake pattern: file-flag inert state (KILL_SWITCH present, ARMED absent),
  budget ceilings (unset = 0 = missing brake), single-flight lock (atomic mkdir),
  append-only JSONL event log. `selectEligible` = approved-only + status guard
  (idempotent). Pure cores, proven-to-catch tests (DR-0076).

---

## 3. The key design decision: a device register is NOT the inventory ledger

The obvious-but-wrong move (and the one a quick pass would make) is to reuse
`inventory_items` with `category='infrastructure'`. **Reality-trace (P15) says no.**

| `inventory_items` (0052) | `church_devices` (this work, 0056) |
|---|---|
| Consumable **quantity** ledger | One row per **identified asset** |
| On-hand DERIVED from append-only movements | Mutable operational **status** (online/offline) |
| "How many HDMI cables" | "*The* DS1621xs, located X, can run Y" |
| No capability concept | **`capabilities[]`** is the whole point — it feeds the router |

A device is a singular, versioned asset with status and capabilities — a
different primitive. So `church_devices` is a **sibling table**, not a fork of the
inventory ledger. It **links** the LED wall to the existing capital project by
slug (`capital_project_slug = 'sanctuary-video-wall'`) rather than duplicating it,
and reuses `record_events` for edit history. One inventory, no duplicates.

This is the through-line: a surface is a live view of real state (DR-0061/0065),
and the capability field is the seam where the register *drives* the scheduler.

---

## 4. What shipped — Church Device Inventory

- **Migration `0056-church-device-inventory.sql`** — `church_devices` table, RLS
  scoped to the church instance (read owner/admin/member; write owner/admin/member;
  hard-delete owner/admin), GIN index on `capabilities`, realtime, reuses
  `engagement_touch_updated_at`. **Needs his-hand apply to the cloud** (below).
- **`lib/church-devices.js`** (pure) — taxonomy (12 device types, 6 statuses, 10
  capability tokens with a `gpuJob` flag marking the dispatchable subset),
  `makeDevice` normalizer, `validateDevice`, derivations (`summarizeDevices`,
  `capabilityIndex`, `devicesByType`, `smeNeededDevices`, `mergeSeedAndRows`), and
  **`SEED_DEVICES`** — the real known COLG register grounded in the research, with
  every unconfirmed spec flagged `sme_needed:true / confirmed:false`.
- **`lib/church-devices-sync.js`** — gated fetch + CRUD (mirrors `video-wall-sync`
  access + generic `table-sync`). `getDeviceAccess` resolves canSee/canEdit;
  sensitive fields (serial/IP) gated to editors.
- **`components/DeviceInventory.jsx`** — self-contained surface, Church → Devices
  (staff-gated). **Registry** tab: devices by type, status, specs, capability
  chips, capital-project link, honest SME flags. **Compute Pool** tab: the
  capability index (which node can take which job) + the live INERT scheduler
  state. UiIcon (no emoji), Video-Wall visual tokens (passes contrast/legibility).
- Wired into `surfaces.js`, the Church nav strip, the render switch, and the
  feedback-area map (so the feedback-coverage gate stays green).

---

## 5. What shipped — Idle-GPU scheduler (INERT scaffold)

Deterministic-first ([[project-deterministic-first-ai-only-necessary]]) and
behind all three brakes ([[feedback-no-autonomous-automation-without-brakes]]):

- **`lib/gpu-scheduler.js`** (pure, no LLM) — the router core. `JOB_TYPES` each
  map to one required capability; `routeJob` is a deterministic capability match
  against the device register; `idleWindowOpen` is a timezone-correct
  (explicit-offset) overnight/between-services window; `brakeGate` mirrors
  cap-resume; `selectRunnable` is the bounded gate (approved + queued + capable
  node + budget + brakes-go); `planRun` is side-effect-free observability.
  **`makeInertState()` is the shipped default — `brakeGate` of it is `{go:false}`,
  asserted by a proven-to-catch test.**
- **`scripts/gpu-scheduler.mjs`** — the thin runner: reads device manifest + queue
  + brake-flag files, asks the same pure core what would run, logs to an
  append-only event log, and **dispatches nothing** (dispatch is a guarded stub).
  Even `--run` refuses while inert.
- **`infra/gpu-scheduler/`** — `state/KILL_SWITCH` ships **present** (engaged),
  ARMED/GPU_SCHED_ARMED absent, budgets unset; an example queue (one unapproved,
  one done — both illustrate the gate); a README runbook for Darrell's deliberate,
  attended arming (Tier C). Verified: the runner prints `INERT: KILL_SWITCH
  engaged. Nothing runs.`

### Why this is safe to ship now
It is **Tier C** in nature but **inert** in fact: three brakes engaged, no
dispatch code, no timer, no auto-activation. Nothing turns on without Darrell's
attended arming. This honors the 2026-06-06 runaway-compute lesson (P10/P11/P12).

---

## 6. What needs Darrell — exact specs (SME) + his-hand deploy

### Specs to confirm (flagged in the register, not fabricated)
- **NAS DS1621xs** — exact RAID config (usable TB) and final physical location.
- **GPU nodes** — host make/model of each box; exact VRAM of the *second* 4070.
- **Yamaha QL** — QL1 vs QL5.
- **Network gear** — switch/router make/model + topology (a walk-through).
- **Cameras / capture** — camera + switcher + streaming-PC models.

Once read off the hardware, set the device's `confirmed:true` / `sme_needed:false`
(edit in-app once signed in as staff, or in the DB).

### His-hand deploy (apply migration 0056 to the cloud)
The PWA syncs against Supabase; the new table must exist there. From PowerShell:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
gh workflow run db-migrate.yml --ref main
```

(Or apply `infra/supabase/migrations-auto/0056-church-device-inventory.sql` in the
Supabase SQL editor.) Until applied, the surface still renders the seed baseline
from `localStorage`; staff-added device rows sync only after the table exists.

### Arming the scheduler — NOT now
See `infra/gpu-scheduler/README.md`. Tier C, attended, never while traveling.

---

## 7. Through-lines honored

- **The app is the primary artifact** — both halves surface *inside* the app
  (Registry + Compute Pool), not just in repo files.
- **Reality-trace / verification doctrine** — real table, real screen, honest SME
  flags; the scheduler never claims a job ran; the inert default is gated.
- **One inventory, no duplicates** — links the LED-wall capital project by slug.
- **Deterministic-first + three brakes** — the router is plain code; the AI runs
  only the necessary work, only when armed and free.
