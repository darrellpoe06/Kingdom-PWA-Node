// =============================================================================
// gpu-scheduler — deterministic idle-GPU opportunistic job router (pure core)
// =============================================================================
// Declared by Darrell 2026-06-29. The church CUDA GPUs (2x RTX 4070) sit idle
// overnight and between services. This is the router that queues heavy jobs
// (voice clone, harvest transcription, batch local-LLM) to run ONLY when a
// capable node is free, the idle window is open, AND every Cage brake is go.
//
// DETERMINISTIC-FIRST (project-deterministic-first-ai-only-necessary): the
// scheduler/queue is PLAIN CODE — no LLM, no model call decides anything here.
// The GPU runs the AI job only when it is the necessary work, and only when the
// brakes pass. Routing is a capability match against the device register
// (church-devices.js capabilities[]) — the register is the single source of
// which node can take which job.
//
// THE CAGE (feedback-no-autonomous-automation-without-brakes; CLAUDE.md
// "Autonomous Automation Requires Three Brakes"). Modeled exactly on the
// cap-resume brakeGate. SHIPS INERT — makeInertState() is the shipped default:
//   1. KILL-SWITCH present  => engaged => nothing runs (global panic stop)
//   2. STREAMING_HOLD present => live stream in progress => nothing runs
//      (DR-0012: never load a CUDA tower while it is in the live chain)
//   3. ARMED absent          => disarmed
//   4. GPU_SCHED_ARMED absent => no scheduler consent (dedicated second arm)
//   PLUS budget ceilings = 0 (unset = missing brake = inert)
//   PLUS single-flight lock (a second run that finds the lock held SKIPS)
//   PLUS append-only event log (observability — every decision recorded)
// Arming is reserved for Darrell, attended (Tier C). This file NEVER dispatches;
// it only DECIDES and PLANS. The .mjs runner does the (still brake-gated) I/O.
//
// PURE (no React, no fs, no network) so the gate proves it (Verification
// Doctrine, DR-0076): the inert default and the bounded-eligibility gate are
// machine-checked by gpu-scheduler.test.js (proven-to-catch).
// =============================================================================
import { GPU_JOB_CAPABILITIES } from './church-devices.js';

// --- Job types ---------------------------------------------------------------
// Each heavy job maps to ONE required capability (matched against device caps).
// `unitCost` is a deterministic cost-per-unit estimate (no model guessing) used
// for the budget ceiling; `unitLabel` documents what `units` counts.
export const JOB_TYPES = [
  { id: 'voice-clone',   requires: 'voice-clone',   unitLabel: 'samples',         unitCost: 1 },
  { id: 'transcription', requires: 'transcription', unitLabel: 'media-minutes',   unitCost: 1 },
  { id: 'batch-llm',     requires: 'llm-inference', unitLabel: 'prompts',         unitCost: 1 },
  { id: 'video-encode',  requires: 'video-encode',  unitLabel: 'clip-minutes',    unitCost: 1 },
];
export const JOB_TYPE_IDS = JOB_TYPES.map((j) => j.id);

export function jobTypeOf(id) {
  return JOB_TYPES.find((j) => j.id === id) || null;
}

// A device counts as "idle / free" for batch work in these operational states.
// 'streaming' is DELIBERATELY not here (DR-0012): a box in the live chain —
// the LEFT (tlcmediadpt) or RIGHT (livestream-main-pc) CUDA tower while a
// service streams — is never a batch-job target, whatever else says go.
export const IDLE_STATES = ['online', 'standby'];

// --- Inert state (the shipped default) ---------------------------------------
// Every brake engaged/absent. brakeGate(makeInertState()) MUST be { go:false }.
export function makeInertState(overrides = {}) {
  return {
    killSwitch:    true,   // present => engaged (global stop). Ships engaged.
    streamingHold: true,   // present => live stream in progress => nothing runs (DR-0012). Ships engaged.
    armed:         false,  // master arm absent
    gpuSchedArmed: false,  // dedicated scheduler arm absent
    lockHeld:      false,  // single-flight lock not held by another run
    maxJobsPerRun: 0,      // 0 = unset = missing brake
    maxJobsPerDay: 0,      // 0 = unset = missing brake
    jobsToday:     0,
    ...overrides,
  };
}

// --- Idle window (deterministic, timezone-correct via explicit offset) --------
// cfg = { utcOffsetMinutes, windows: [{ startMin, endMin }] } where *Min are
// minutes-of-day in local time. A window with endMin <= startMin wraps midnight
// (e.g. 22:00->06:00). Pure: derived from epoch + offset, no Intl/clock.
export const DEFAULT_IDLE_WINDOWS = [
  { startMin: 22 * 60, endMin: 6 * 60 },  // 22:00 -> 06:00 overnight
  { startMin: 13 * 60, endMin: 15 * 60 }, // 13:00 -> 15:00 between-services lull
];

export function localMinutesOfDay(nowMs, utcOffsetMinutes = 0) {
  const totalMin = Math.floor(nowMs / 60000) + utcOffsetMinutes;
  return ((totalMin % 1440) + 1440) % 1440;
}

export function idleWindowOpen(nowMs, cfg = {}) {
  const offset = Number.isFinite(cfg.utcOffsetMinutes) ? cfg.utcOffsetMinutes : 0;
  const windows = Array.isArray(cfg.windows) ? cfg.windows : DEFAULT_IDLE_WINDOWS;
  const m = localMinutesOfDay(nowMs, offset);
  for (const w of windows) {
    const { startMin, endMin } = w;
    const inWin = endMin > startMin
      ? (m >= startMin && m < endMin)            // same-day window
      : (m >= startMin || m < endMin);           // wraps midnight
    if (inWin) return { open: true, reason: `within idle window ${fmt(startMin)}-${fmt(endMin)}` };
  }
  return { open: false, reason: 'outside all idle windows' };
}
function fmt(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const mm = String(min % 60).padStart(2, '0');
  return `${h}:${mm}`;
}

// --- Validation --------------------------------------------------------------
export function validateJob(job) {
  const errors = [];
  if (!job || typeof job !== 'object') return { ok: false, errors: ['job is not an object'] };
  if (!job.id) errors.push('job.id is required');
  if (!JOB_TYPE_IDS.includes(job.type)) errors.push(`unknown job type "${job.type}"`);
  if (job.units != null && !(Number(job.units) >= 0)) errors.push('job.units must be >= 0');
  return { ok: errors.length === 0, errors };
}

// --- Cost (deterministic) ----------------------------------------------------
export function estimateJobCost(job) {
  const t = jobTypeOf(job?.type);
  if (!t) return 0;
  const units = Number(job?.units);
  return (Number.isFinite(units) && units > 0 ? units : 1) * t.unitCost;
}

// --- Routing: capability match against the device register -------------------
// Pick the node that can run a job: active, in an IDLE_STATES status, and whose
// capabilities include the job's required capability. Deterministic — lowest
// sortOrder wins, then slug, so the same inputs always pick the same node.
export function routeJob(job, devices) {
  const t = jobTypeOf(job?.type);
  if (!t) return { node: null, reason: `unknown job type "${job?.type}"` };
  if (!GPU_JOB_CAPABILITIES.includes(t.requires)) {
    return { node: null, reason: `"${t.requires}" is not a dispatchable GPU job capability` };
  }
  const candidates = (devices || [])
    .filter((d) => d.active !== false
      && IDLE_STATES.includes(d.status)
      && Array.isArray(d.capabilities) && d.capabilities.includes(t.requires))
    .sort((a, b) => (a.sortOrder - b.sortOrder) || String(a.id).localeCompare(String(b.id)));
  if (candidates.length === 0) {
    return { node: null, reason: `no idle device advertises "${t.requires}"` };
  }
  return { node: candidates[0], reason: `routed to ${candidates[0].name} (${t.requires})` };
}

// --- The Cage: brakeGate (mirrors cap-resume brakeGate) ----------------------
// Returns { go, reasons[], budget, brakes }. go === true ONLY when every brake
// passes. With makeInertState() this is always { go:false } — proven-to-catch.
export function brakeGate(state, nowMs, idleCfg) {
  const s = state || {};
  const reasons = [];
  const killEngaged = s.killSwitch === true;
  const streamingHold = s.streamingHold === true;
  const armed = s.armed === true;
  const schedArmed = s.gpuSchedArmed === true;
  const lockFree = s.lockHeld !== true;
  const perRun = Number(s.maxJobsPerRun) || 0;
  const perDay = Number(s.maxJobsPerDay) || 0;
  const jobsToday = Number(s.jobsToday) || 0;
  const budgetOk = perRun > 0 && perDay > 0 && jobsToday < perDay;
  const window = idleWindowOpen(nowMs, idleCfg);

  if (killEngaged) reasons.push('KILL_SWITCH engaged');
  if (streamingHold) reasons.push('STREAMING_HOLD engaged — live stream in progress; CUDA towers reserved (DR-0012)');
  if (!armed) reasons.push('not ARMED');
  if (!schedArmed) reasons.push('GPU_SCHED not armed');
  if (!lockFree) reasons.push('single-flight lock held by another run');
  if (perRun <= 0) reasons.push('per-run budget unset (0)');
  if (perDay <= 0) reasons.push('per-day budget unset (0)');
  if (perDay > 0 && jobsToday >= perDay) reasons.push(`daily budget exhausted (${jobsToday}/${perDay})`);
  if (!window.open) reasons.push(window.reason);

  const go = !killEngaged && !streamingHold && armed && schedArmed && lockFree && budgetOk && window.open;
  return {
    go,
    reasons,
    budget: { perRun, perDay, jobsToday, remaining: Math.max(0, perDay - jobsToday) },
    brakes: { killEngaged, streamingHold, armed, schedArmed, lockFree, budgetOk, windowOpen: window.open },
  };
}

// --- The bounded gate: selectRunnable ----------------------------------------
// THE safety gate. A job is runnable ONLY when ALL hold:
//   - the global brakeGate is go (else NOTHING runs — every job skipped)
//   - the job is approved === true (explicit; Darrell sets it)
//   - the job status is 'queued' (a 'done'/'running' job never re-runs — idempotent)
//   - a capable idle node exists (capability match)
//   - the per-run budget still has headroom
// Returns { runnable: [{ job, node }], skipped: [{ id, reason }] }. Deterministic.
export function selectRunnable(queue, devices, state, nowMs, idleCfg) {
  const items = Array.isArray(queue?.items) ? queue.items : [];
  const gate = brakeGate(state, nowMs, idleCfg);
  if (!gate.go) {
    return { runnable: [], skipped: items.map((j) => ({ id: j.id, reason: `brakes: ${gate.reasons.join(', ')}` })), gate };
  }
  const runnable = [];
  const skipped = [];
  let used = 0;
  const perRun = gate.budget.perRun;
  const dayRemaining = gate.budget.remaining;
  for (const job of items) {
    const v = validateJob(job);
    if (!v.ok) { skipped.push({ id: job.id, reason: v.errors.join('; ') }); continue; }
    if (job.approved !== true) { skipped.push({ id: job.id, reason: 'not approved' }); continue; }
    if (job.status !== 'queued') { skipped.push({ id: job.id, reason: `status is "${job.status}" (only queued runs)` }); continue; }
    if (used >= perRun) { skipped.push({ id: job.id, reason: 'per-run budget reached' }); continue; }
    if (used >= dayRemaining) { skipped.push({ id: job.id, reason: 'daily budget reached' }); continue; }
    const { node, reason } = routeJob(job, devices);
    if (!node) { skipped.push({ id: job.id, reason }); continue; }
    runnable.push({ job, node });
    used += 1;
  }
  return { runnable, skipped, gate };
}

// --- Plan (what ships): observability WITHOUT dispatch -----------------------
// A deterministic, side-effect-free summary of what WOULD run and why each job
// is skipped. This is what the in-app surface + the inert runner display. It
// dispatches nothing; armed dispatch lives behind the .mjs runner's brake check.
export function planRun(queue, devices, state, nowMs, idleCfg) {
  const sel = selectRunnable(queue, devices, state, nowMs, idleCfg);
  return {
    inert: !sel.gate.go,
    gate: sel.gate,
    wouldRun: sel.runnable.map((r) => ({ jobId: r.job.id, type: r.job.type, node: r.node.name, cost: estimateJobCost(r.job) })),
    skipped: sel.skipped,
    plannedCost: sel.runnable.reduce((sum, r) => sum + estimateJobCost(r.job), 0),
  };
}

// --- Event shaping (append-only JSONL; the runner writes, this shapes) --------
export function makeEvent(event, detail, state, nowIso) {
  const s = state || {};
  return {
    ts: nowIso,
    agent: 'gpu-scheduler',
    event,
    armed: s.armed === true,
    kill_switch: s.killSwitch === true ? 'engaged' : 'clear',
    detail: String(detail || '').slice(0, 1000),
  };
}
