#!/usr/bin/env node
// =============================================================================
// gpu-scheduler.mjs — the INERT idle-GPU job runner (brake-gated I/O shell)
// =============================================================================
// The thin node-side runner around the pure deterministic core in
// app/src/lib/gpu-scheduler.js. It reads the device manifest + the approved job
// queue + the brake-state flag files, asks the SAME proven core what (if
// anything) would run, logs the decision to an append-only event log, and — by
// design — DISPATCHES NOTHING. Dispatch is a guarded stub that refuses until
// Darrell deliberately wires the GPU endpoints and arms it (Tier C, attended).
//
// This is the "inert / brake-gated scaffolding" deliverable. It proves the loop
// end-to-end (read state -> plan -> log) without ever putting load on a GPU.
//
// THE THREE BRAKES (CLAUDE.md "Autonomous Automation Requires Three Brakes"):
//   1. KILL-SWITCH   — infra/gpu-scheduler/state/KILL_SWITCH present => engaged.
//                      Ships present. Nothing runs while it exists.
//   2. STREAMING_HOLD — state/STREAMING_HOLD present => a live stream is in
//                      progress; the CUDA towers are reserved for the stream
//                      (DR-0012). Nothing runs while it exists. Ships present.
//   3. ARMED + GPU_SCHED_ARMED — both flag files must be present (master +
//                      dedicated scheduler arm). Ship absent.
//   4. BUDGET        — GPU_SCHED_MAX_JOBS_PER_RUN / _PER_DAY env > 0. Unset = 0
//                      = missing brake = inert.
//   PLUS single-flight lock (state/run.lock dir; a second run SKIPS) and the
//   append-only event log (state/events.jsonl).
//
// Run plan-only (the default, safe):   node scripts/gpu-scheduler.mjs
// Even with --run, dispatch is stubbed: node scripts/gpu-scheduler.mjs --run
// =============================================================================
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  planRun, makeInertState, makeEvent, DEFAULT_IDLE_WINDOWS,
} from '../app/src/lib/gpu-scheduler.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BASE = join(ROOT, 'infra', 'gpu-scheduler');
const STATE = join(BASE, 'state');
const wantRun = process.argv.includes('--run');

function readJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}
function flag(name) { return existsSync(join(STATE, name)); }
function envInt(name) { const n = Number(process.env[name]); return Number.isFinite(n) ? n : 0; }

function logEvent(ev) {
  try {
    mkdirSync(STATE, { recursive: true });
    writeFileSync(join(STATE, 'events.jsonl'), JSON.stringify(ev) + '\n', { flag: 'a' });
  } catch (e) { console.warn('[gpu-scheduler] event log write failed:', e.message); }
}

function nowIso() { return new Date().toISOString(); }

// Build the brake state from the flag files + env. KILL_SWITCH present => engaged.
function loadState() {
  return makeInertState({
    killSwitch:    flag('KILL_SWITCH'),
    streamingHold: flag('STREAMING_HOLD'),
    armed:         flag('ARMED'),
    gpuSchedArmed: flag('GPU_SCHED_ARMED'),
    lockHeld:      false,
    maxJobsPerRun: envInt('GPU_SCHED_MAX_JOBS_PER_RUN'),
    maxJobsPerDay: envInt('GPU_SCHED_MAX_JOBS_PER_DAY'),
    jobsToday:     readJson(join(STATE, 'jobs-today.json'), { count: 0 }).count || 0,
  });
}

// Single-flight lock: atomic mkdir. A second run that finds it held SKIPS.
function acquireLock() { try { mkdirSync(join(STATE, 'run.lock')); return true; } catch { return false; } }
function releaseLock() { try { rmdirSync(join(STATE, 'run.lock')); } catch { /* best effort */ } }

function main() {
  const devices = readJson(join(BASE, 'devices.json'), []);   // exported from the register; [] when not yet exported
  const queue   = readJson(join(BASE, 'queue.json'), { items: [] });
  const state   = loadState();
  const idleCfg = { utcOffsetMinutes: envInt('GPU_SCHED_TZ_OFFSET_MIN') || -300, windows: DEFAULT_IDLE_WINDOWS };

  if (state.killSwitch) {
    logEvent(makeEvent('inert', 'KILL_SWITCH engaged — no run', state, nowIso()));
    console.log('[gpu-scheduler] INERT: KILL_SWITCH engaged. Nothing runs.');
    return;
  }

  if (state.streamingHold) {
    logEvent(makeEvent('streaming_hold', 'STREAMING_HOLD engaged — live stream in progress, CUDA towers reserved (DR-0012) — no run', state, nowIso()));
    console.log('[gpu-scheduler] STREAMING HOLD: a live stream is in progress. The left/right CUDA towers are reserved for the stream (DR-0012). Nothing runs.');
    return;
  }

  const haveLock = acquireLock();
  if (!haveLock) {
    logEvent(makeEvent('locked', 'single-flight lock held — skipped', state, nowIso()));
    console.log('[gpu-scheduler] SKIP: another run holds the single-flight lock.');
    return;
  }

  try {
    const plan = planRun(queue, devices, state, Date.now(), idleCfg);
    logEvent(makeEvent('plan', `inert=${plan.inert} wouldRun=${plan.wouldRun.length} reasons=[${plan.gate.reasons.join('; ')}]`, state, nowIso()));

    console.log(`[gpu-scheduler] devices=${devices.length} queued=${(queue.items || []).length}`);
    console.log(`[gpu-scheduler] brakes go=${plan.gate.go} :: ${plan.gate.reasons.join(', ') || 'all clear'}`);
    console.log(`[gpu-scheduler] would run ${plan.wouldRun.length} job(s); planned cost ${plan.plannedCost}`);
    for (const s of plan.skipped) console.log(`  - skip ${s.id}: ${s.reason}`);

    if (!wantRun) { console.log('[gpu-scheduler] plan-only (no --run). Exiting.'); return; }

    if (!plan.gate.go) {
      logEvent(makeEvent('halt', `--run requested but brakes not go: ${plan.gate.reasons.join('; ')}`, state, nowIso()));
      console.log('[gpu-scheduler] --run requested but brakes are NOT go. Nothing dispatched.');
      return;
    }

    // DISPATCH STUB — deliberately not implemented. Even fully armed, this
    // scaffold refuses to put load on a GPU. Wiring the endpoints
    // (ollama:11434 / voice-studio:8770 / whisper-gpu:8771) and turning this
    // into a live dispatch is Darrell's deliberate, attended step (Tier C).
    for (const r of plan.wouldRun) {
      logEvent(makeEvent('dispatch_stub', `job=${r.jobId} type=${r.type} node=${r.node} — DISPATCH NOT WIRED (inert scaffold)`, state, nowIso()));
      console.log(`[gpu-scheduler] WOULD dispatch ${r.jobId} (${r.type}) -> ${r.node} — dispatch not wired (inert scaffold).`);
    }
    console.log('[gpu-scheduler] Dispatch is a stub in this scaffold; no GPU load was created.');
  } finally {
    releaseLock();
  }
}

main();
