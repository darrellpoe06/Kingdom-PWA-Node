// @vitest-environment node
//
// gpu-scheduler — the deterministic idle-GPU router pure core. These are the
// SAFETY gates (Verification Doctrine / "three brakes"): they fail loudly if the
// inert default ever loosens, if the bounded eligibility gate weakens, or if a
// job could route to a node that can't run it. A gate that always passes is a lie
// (proven-to-catch), so each asserts a real break it would catch.
import { describe, it, expect } from 'vitest';
import {
  JOB_TYPES, makeInertState, brakeGate, selectRunnable, routeJob,
  idleWindowOpen, localMinutesOfDay, validateJob, estimateJobCost, planRun,
} from '../lib/gpu-scheduler.js';
import { makeDevice } from '../lib/church-devices.js';

// A fully-armed, in-budget, window-open state — the ONLY state where work runs.
// streamingHold must be RELEASED explicitly here because it ships engaged
// (makeInertState defaults it true) — that default is itself under test below.
function liveState(over = {}) {
  return makeInertState({
    killSwitch: false, streamingHold: false, armed: true, gpuSchedArmed: true,
    maxJobsPerRun: 5, maxJobsPerDay: 50, jobsToday: 0, ...over,
  });
}
// An instant inside the 22:00-06:00 overnight window at UTC-5 (= 01:00 local).
const OVERNIGHT = Date.UTC(2026, 5, 29, 6, 0, 0); // 06:00 UTC = 01:00 local (-300)
const NOON_LOCAL = Date.UTC(2026, 5, 29, 17, 0, 0); // 17:00 UTC = 12:00 local (outside windows)
const CFG = { utcOffsetMinutes: -300 };

const GPU = makeDevice({ id: 'gpu', name: 'GPU', deviceType: 'gpu-node', status: 'online', capabilities: ['transcription', 'llm-inference', 'voice-clone'] });
const NAS = makeDevice({ id: 'nas', name: 'NAS', deviceType: 'nas', status: 'online', capabilities: ['storage'] });

describe('INERT default — the shipped state never runs (proven-to-catch)', () => {
  it('brakeGate(makeInertState()) is { go:false } with every brake cited', () => {
    const g = brakeGate(makeInertState(), OVERNIGHT, CFG);
    expect(g.go).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/KILL_SWITCH/);
    expect(g.reasons.join(' ')).toMatch(/not ARMED/);
    expect(g.reasons.join(' ')).toMatch(/budget unset/);
  });
  it('selectRunnable on the inert state skips EVERYTHING, runs nothing', () => {
    const queue = { items: [{ id: 'j', type: 'transcription', units: 10, approved: true, status: 'queued' }] };
    const { runnable, skipped } = selectRunnable(queue, [GPU], makeInertState(), OVERNIGHT, CFG);
    expect(runnable).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/brakes/);
  });
  it('kill-switch present overrides an otherwise-armed state', () => {
    const g = brakeGate(liveState({ killSwitch: true }), OVERNIGHT, CFG);
    expect(g.go).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/KILL_SWITCH/);
  });
});

describe('STREAMING_HOLD — the live stream is senior to everything (DR-0012)', () => {
  it('the streaming hold ships ENGAGED in the inert default', () => {
    const g = brakeGate(makeInertState(), OVERNIGHT, CFG);
    expect(g.go).toBe(false);
    expect(g.brakes.streamingHold).toBe(true);
    expect(g.reasons.join(' ')).toMatch(/STREAMING_HOLD/);
  });
  it('streaming hold alone blocks a FULLY-ARMED, in-budget, in-window state', () => {
    const g = brakeGate(liveState({ streamingHold: true }), OVERNIGHT, CFG);
    expect(g.go).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/STREAMING_HOLD engaged/);
    expect(g.reasons.join(' ')).toMatch(/DR-0012/);
  });
  it('with the hold engaged, selectRunnable runs NOTHING even for approved jobs', () => {
    const queue = { items: [{ id: 'j', type: 'transcription', units: 5, approved: true, status: 'queued' }] };
    const { runnable, skipped } = selectRunnable(queue, [GPU], liveState({ streamingHold: true }), OVERNIGHT, CFG);
    expect(runnable).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/STREAMING_HOLD/);
  });
  it('a device with status "streaming" is NEVER a routing candidate, hold or not', () => {
    const streamingBox = makeDevice({ id: 'live', name: 'Livestream PC', deviceType: 'gpu-node', status: 'streaming', capabilities: ['transcription', 'llm-inference'] });
    const { node, reason } = routeJob({ type: 'transcription' }, [streamingBox]);
    expect(node).toBeNull();
    expect(reason).toMatch(/no idle device/);
  });
});

describe('idle window — deterministic, timezone-correct', () => {
  it('localMinutesOfDay applies the offset and wraps', () => {
    expect(localMinutesOfDay(Date.UTC(2026, 5, 29, 6, 0, 0), -300)).toBe(60); // 01:00
  });
  it('open inside the overnight window, closed at local noon', () => {
    expect(idleWindowOpen(OVERNIGHT, CFG).open).toBe(true);
    expect(idleWindowOpen(NOON_LOCAL, CFG).open).toBe(false);
  });
  it('a midnight-wrapping window includes both sides of 00:00', () => {
    const cfg = { utcOffsetMinutes: 0, windows: [{ startMin: 22 * 60, endMin: 6 * 60 }] };
    expect(idleWindowOpen(Date.UTC(2026, 5, 29, 23, 0, 0), cfg).open).toBe(true); // 23:00
    expect(idleWindowOpen(Date.UTC(2026, 5, 29, 2, 0, 0), cfg).open).toBe(true);  // 02:00
    expect(idleWindowOpen(Date.UTC(2026, 5, 29, 12, 0, 0), cfg).open).toBe(false);
  });
});

describe('routeJob — capability match against the register', () => {
  it('routes a transcription job to a capable idle node', () => {
    const { node } = routeJob({ type: 'transcription' }, [NAS, GPU]);
    expect(node.id).toBe('gpu');
  });
  it('refuses when no idle node advertises the capability', () => {
    const { node, reason } = routeJob({ type: 'voice-clone' }, [NAS]);
    expect(node).toBeNull();
    expect(reason).toMatch(/no idle device/);
  });
  it('refuses a node that is offline even if it has the capability', () => {
    const offline = makeDevice({ id: 'g2', name: 'G2', deviceType: 'gpu-node', status: 'offline', capabilities: ['transcription'] });
    expect(routeJob({ type: 'transcription' }, [offline]).node).toBeNull();
  });
  it('is deterministic — same inputs pick the same node', () => {
    const a = routeJob({ type: 'transcription' }, [GPU, NAS]).node.id;
    const b = routeJob({ type: 'transcription' }, [NAS, GPU]).node.id;
    expect(a).toBe(b);
  });
});

describe('selectRunnable — THE bounded eligibility gate', () => {
  it('an UNAPPROVED job is never runnable (Darrell sets approved)', () => {
    const queue = { items: [{ id: 'j', type: 'transcription', units: 5, approved: false, status: 'queued' }] };
    const { runnable, skipped } = selectRunnable(queue, [GPU], liveState(), OVERNIGHT, CFG);
    expect(runnable).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/not approved/);
  });
  it('a DONE job never re-runs (idempotent status guard)', () => {
    const queue = { items: [{ id: 'j', type: 'transcription', units: 5, approved: true, status: 'done' }] };
    const { runnable, skipped } = selectRunnable(queue, [GPU], liveState(), OVERNIGHT, CFG);
    expect(runnable).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/only queued/);
  });
  it('an approved+queued job with a capable node RUNS when armed + in window', () => {
    const queue = { items: [{ id: 'j', type: 'transcription', units: 5, approved: true, status: 'queued' }] };
    const { runnable } = selectRunnable(queue, [GPU], liveState(), OVERNIGHT, CFG);
    expect(runnable).toHaveLength(1);
    expect(runnable[0].node.id).toBe('gpu');
  });
  it('outside the idle window, nothing runs even when armed + approved', () => {
    const queue = { items: [{ id: 'j', type: 'transcription', units: 5, approved: true, status: 'queued' }] };
    const { runnable } = selectRunnable(queue, [GPU], liveState(), NOON_LOCAL, CFG);
    expect(runnable).toHaveLength(0);
  });
  it('respects the per-run budget ceiling', () => {
    const items = Array.from({ length: 4 }, (_, i) => ({ id: `j${i}`, type: 'transcription', units: 1, approved: true, status: 'queued' }));
    const { runnable } = selectRunnable({ items }, [GPU], liveState({ maxJobsPerRun: 2 }), OVERNIGHT, CFG);
    expect(runnable).toHaveLength(2);
  });
  it('respects the daily budget remaining', () => {
    const items = Array.from({ length: 4 }, (_, i) => ({ id: `j${i}`, type: 'transcription', units: 1, approved: true, status: 'queued' }));
    const { runnable } = selectRunnable({ items }, [GPU], liveState({ maxJobsPerDay: 50, jobsToday: 49 }), OVERNIGHT, CFG);
    expect(runnable).toHaveLength(1); // only 1 left in the day
  });
});

describe('validateJob + cost', () => {
  it('catches an unknown job type', () => {
    expect(validateJob({ id: 'x', type: 'mine-bitcoin' }).ok).toBe(false);
  });
  it('cost is deterministic from units', () => {
    expect(estimateJobCost({ type: 'transcription', units: 30 })).toBe(30);
    expect(estimateJobCost({ type: 'transcription' })).toBe(1); // default 1 unit
  });
  it('every job type maps to a known capability', () => {
    for (const jt of JOB_TYPES) expect(typeof jt.requires).toBe('string');
  });
});

describe('planRun — observability without dispatch', () => {
  it('reports inert:true and zero would-run for the shipped state', () => {
    const plan = planRun({ items: [] }, [GPU], makeInertState(), OVERNIGHT, CFG);
    expect(plan.inert).toBe(true);
    expect(plan.wouldRun).toHaveLength(0);
    expect(plan.plannedCost).toBe(0);
  });
});
