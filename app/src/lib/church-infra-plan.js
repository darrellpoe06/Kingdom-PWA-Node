// =============================================================================
// church-infra-plan — the COLG "next project" plan: sovereign compute rig + cameras
// =============================================================================
// Declared by Darrell 2026-07-08: the church wants to install security cameras and
// build a local LLM on a 5x RTX 3090 rig. This gives that next project a HOME in
// the app (Projects > Church > Infra Plan, staff-gated) with REAL specs — not a
// painted plan.
//
// REALITY-TRACE (DR-0061 / P15): verified hardware is READ from the device register
// (church-devices.js — single source of truth), so this surface never re-states or
// fabricates it. Planned hardware (the 5x3090 rig, the cameras) is flagged
// `planned`, honestly, and carries the open question ("is 5x3090 enough for
// life-like video?") as an UNVERIFIED note pending the video research — never
// painted as decided.
//
// THE FAIRNESS GATE IS A GATE, NOT A LABEL (VISION-FAIRNESS-STANDARD; DR-0060
// judgment-as-a-gate). Any milestone that touches PERSON recognition / auto-door
// MUST carry the fairness requirement, or validateMilestone() FAILS. A "verified"
// milestone MUST carry evidence (Verification Doctrine, DR-0076). Both are
// machine-checked by church-infra-plan.test.js (proven-to-catch).
//
// PURE (no React, no network). The surface (ChurchInfraPlan.jsx) renders it.
// =============================================================================
import { SEED_DEVICES } from './church-devices.js';

// --- The binding fairness requirement -----------------------------------------
// VISION-FAIRNESS-STANDARD. Non-negotiable for any face/person recognition or the
// auto-door. Surfaced on every recognition milestone; enforced by validateMilestone.
export const FAIRNESS_GATE = {
  id: 'vision-fairness-standard',
  label: 'VISION-FAIRNESS-STANDARD (binding)',
  bar: 'accuracy parity within 5 percentage points across skin tones',
  rules: [
    'family-data-first calibration',
    'per-task evaluation (not one global number)',
    'six-month audit cadence',
    'errors default to the safe side',
    'any fairness failure routes to the family voice',
  ],
};

// --- Milestone status ---------------------------------------------------------
export const MILESTONE_STATUSES = [
  { id: 'planned',     label: 'Planned',     tone: 'idle' },
  { id: 'in-progress', label: 'In progress', tone: 'attention' },
  { id: 'verified',    label: 'Verified',    tone: 'good' },
  { id: 'blocked',     label: 'Blocked',     tone: 'problem' },
];
export const STATUS_IDS = MILESTONE_STATUSES.map((s) => s.id);
export function statusTone(id) { return (MILESTONE_STATUSES.find((s) => s.id === id) || {}).tone || 'idle'; }
export function statusLabel(id) { return (MILESTONE_STATUSES.find((s) => s.id === id) || {}).label || id || 'Unknown'; }

export const WORKSTREAMS = [
  { id: 'compute', label: 'Sovereign compute rig', icon: 'sliders' },
  { id: 'cameras', label: 'Security cameras',       icon: 'monitor' },
];
export function workstreamLabel(id) { return (WORKSTREAMS.find((w) => w.id === id) || {}).label || id; }

export function makeMilestone(p = {}) {
  return {
    id:                  p.id || 'ms',
    title:               (p.title && String(p.title).trim()) || 'Untitled milestone',
    workstream:          WORKSTREAMS.some((w) => w.id === p.workstream) ? p.workstream : 'compute',
    status:              STATUS_IDS.includes(p.status) ? p.status : 'planned',
    recognition:         p.recognition === true,          // touches person recognition / auto-door
    requiresFairnessGate: p.requiresFairnessGate === true, // must be true when recognition is true
    evidence:            p.evidence ?? null,               // what PROVES it (required to be 'verified')
    notes:               p.notes ?? null,
    sortOrder:           Number.isFinite(p.sortOrder) ? p.sortOrder : 0,
  };
}

// --- Gate (proven-to-catch) ---------------------------------------------------
export function validateMilestone(m) {
  const errors = [];
  if (!m || typeof m !== 'object') return { ok: false, errors: ['milestone is not an object'] };
  if (!m.title || !String(m.title).trim()) errors.push('title is required');
  if (!STATUS_IDS.includes(m.status)) errors.push(`unknown status "${m.status}"`);
  if (!WORKSTREAMS.some((w) => w.id === m.workstream)) errors.push(`unknown workstream "${m.workstream}"`);
  // The binding rule, as a gate: recognition/auto-door work cannot proceed without
  // the fairness standard attached.
  if (m.recognition === true && m.requiresFairnessGate !== true) {
    errors.push('recognition / auto-door milestone MUST require the VISION-FAIRNESS-STANDARD gate');
  }
  // Verification Doctrine: "verified" is not a status you can claim without proof.
  if (m.status === 'verified' && !m.evidence) {
    errors.push('a "verified" milestone needs evidence (Verification Doctrine)');
  }
  return { ok: errors.length === 0, errors };
}

// --- Verified hardware, READ from the device register (single source of truth) --
export function verifiedComputeNodes(devices = SEED_DEVICES) {
  return (devices || []).filter((d) => d.deviceType === 'gpu-node');
}

// --- The PLANNED sovereign rig (honest: aspirational, not purchased) -----------
export const PLANNED_RIG = {
  id: 'rig-5x3090',
  name: 'Sovereign LLM + Vision rig — 5x RTX 3090 (PLANNED)',
  status: 'planned',
  specs: {
    gpus: '5x NVIDIA RTX 3090 — 24 GB each = 120 GB total VRAM',
    purpose: 'Sovereign local LLM (shard a 70-120B model across the 120 GB) + security-camera vision (on-prem, no cloud) + image/media generation.',
    caveat: 'PER-CARD 24 GB bounds a single video render unless multi-GPU inference (xDiT/USP) is used — 120 GB is NOT automatically one big video. "Life-like movies" quality is likely still a cloud frontier with 2026 open weights. UNVERIFIED — video + rig-sizing research in flight; do not purchase against this until it lands.',
  },
  confirmed: false,
};

// --- The plan (milestones) — honest status, evidence where real ----------------
export const MILESTONES = [
  makeMilestone({
    id: 'ms-4070-verified', workstream: 'compute', status: 'verified',
    title: 'Two RTX 4070 towers online — build + CUDA verified',
    evidence: '2026-07-08 headless SSH from kingdom-home: npm ci + vite build PASS on both; torch 2.6.0+cu124 CUDA=True on tlcmediadpt (RTX 4070). nvidia-smi confirmed 12 GB.',
    sortOrder: 10,
  }),
  makeMilestone({
    id: 'ms-local-llm', workstream: 'compute', status: 'in-progress',
    title: 'Sovereign local LLM serving (Ollama)',
    evidence: 'RIGHT box (livestream-main-pc) Ollama live: qwen2.5:14b @ 45 tok/s + qwen2.5-coder + nomic-embed. LEFT box qwen2.5:14b pulled; headless persistence pending.',
    notes: 'DR-0012: keep AI off the livestream box during services. The 5x3090 rig is the durable home for a bigger model.',
    sortOrder: 20,
  }),
  makeMilestone({
    id: 'ms-flux-image', workstream: 'compute', status: 'in-progress',
    title: 'Sovereign image generation (FLUX.1-schnell) on tlcmediadpt',
    evidence: '2026-07-08: Python 3.12 + torch cu124 (CUDA=True) installed on the LEFT box. ComfyUI + Q4 GGUF weights + first image = remaining. FLUX.1-schnell is Apache-2.0 (commercial-safe), verified by research.',
    sortOrder: 30,
  }),
  makeMilestone({
    id: 'ms-3090-rig', workstream: 'compute', status: 'planned',
    title: 'Build the 5x RTX 3090 sovereign rig — spec + purchase',
    notes: 'Right-sized for a big local LLM + camera vision + image/short-video. NOT proven sufficient for cinematic "life-like movies" — verify against the video/rig research before buying.',
    sortOrder: 40,
  }),
  makeMilestone({
    id: 'ms-cameras-onprem', workstream: 'cameras', status: 'planned',
    title: 'Install sovereign security cameras — footage stays on-prem',
    notes: 'Lineage: docker-wyze-bridge (existing sovereign-camera work). No cloud camera service; the church owns its footage (DATA-AS-EMPOWERMENT).',
    sortOrder: 50,
  }),
  makeMilestone({
    id: 'ms-camera-vision', workstream: 'cameras', status: 'planned',
    title: 'Run camera vision on the sovereign rig (no cloud camera AI)',
    notes: 'The 5x3090 rig is the brain for the cameras too — detection/recognition runs on-prem, so footage never leaves the building.',
    sortOrder: 60,
  }),
  makeMilestone({
    id: 'ms-recognition-autodoor', workstream: 'cameras', status: 'planned',
    title: 'Person recognition / auto-door',
    recognition: true, requiresFairnessGate: true,
    notes: 'BINDING: must pass VISION-FAIRNESS-STANDARD (skin-tone parity) before it can ship. Errors default to the safe side; any fairness failure routes to the family voice.',
    sortOrder: 70,
  }),
];

// --- Derivations (surface + tests share) --------------------------------------
export function summarizePlan(milestones = MILESTONES) {
  const list = milestones || [];
  const byStatus = {};
  for (const s of STATUS_IDS) byStatus[s] = 0;
  let recognition = 0; let gated = 0;
  for (const m of list) {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    if (m.recognition) recognition += 1;
    if (m.requiresFairnessGate) gated += 1;
  }
  return { total: list.length, byStatus, recognition, gated };
}

// Every recognition milestone that is MISSING its gate (must always be empty — the
// surface renders this as a red banner if it ever isn't).
export function fairnessGateViolations(milestones = MILESTONES) {
  return (milestones || []).filter((m) => m.recognition === true && m.requiresFairnessGate !== true);
}

export function milestonesByWorkstream(milestones = MILESTONES) {
  const out = {};
  for (const w of WORKSTREAMS) out[w.id] = [];
  for (const m of milestones || []) (out[m.workstream] || (out[m.workstream] = [])).push(m);
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.sortOrder - b.sortOrder);
  return out;
}
