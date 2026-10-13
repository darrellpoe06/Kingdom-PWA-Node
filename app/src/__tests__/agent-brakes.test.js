// =============================================================================
// agent-brakes.test.js — each brake PROVEN TO CATCH its runaway (DR-0076 §3)
// =============================================================================
// DR-0225: the three brakes are engineering deliverables proven in CI. A brake
// that has not been shown to CATCH the runaway it exists for is theater — so
// every test here stages the runaway first, then pins the brake stopping it.
import { describe, it, expect } from 'vitest';
import {
  createBudget, acquireLock, releaseLock, killSwitch, memoryStore,
  fleetOversight, BRAKE_DECLARATIONS,
} from '../lib/agent-brakes.js';

const T0 = Date.parse('2026-07-23T12:00:00Z');

describe('budget brake — a run that hits any ceiling terminates', () => {
  it('CATCHES the unit runaway: spend past the ceiling flips exceeded', () => {
    const b = createBudget({ maxUnits: 100, nowMs: T0 });
    b.spend(60);
    expect(b.exceeded(T0).exceeded).toBe(false); // under ceiling: keeps running
    b.spend(40);
    const v = b.exceeded(T0);
    expect(v.exceeded).toBe(true);
    expect(v.brake).toBe('budget');
    expect(v.reason).toMatch(/unit ceiling/);
  });
  it('CATCHES the loop runaway: turns past the ceiling terminate', () => {
    const b = createBudget({ maxTurns: 3, nowMs: T0 });
    b.turn(); b.turn();
    expect(b.exceeded(T0).exceeded).toBe(false);
    b.turn();
    expect(b.exceeded(T0).exceeded).toBe(true);
  });
  it('CATCHES the hung run: wall-clock past the ceiling terminates', () => {
    const b = createBudget({ maxWallMs: 60000, nowMs: T0 });
    expect(b.exceeded(T0 + 59000).exceeded).toBe(false);
    const v = b.exceeded(T0 + 60000);
    expect(v.exceeded).toBe(true);
    expect(v.reason).toMatch(/wall-clock/);
  });
});

describe('concurrency lock — a new fire SKIPS a live run, never stacks', () => {
  it('CATCHES the stack-up: second fire while the first holds the lock skips', () => {
    const s = memoryStore();
    const a = acquireLock(s, 'wf-x', { nowMs: T0, holder: 'run-a' });
    expect(a.acquired).toBe(true);
    const b = acquireLock(s, 'wf-x', { nowMs: T0 + 60000, holder: 'run-b' });
    expect(b.acquired).toBe(false);
    expect(b.skip).toBe(true); // skips — does not stack on the running instance
    expect(b.reason).toMatch(/still holds/);
  });
  it('a crashed run does not wedge the lane: a STALE lock is reclaimed', () => {
    const s = memoryStore();
    acquireLock(s, 'wf-x', { nowMs: T0, holder: 'crashed', staleMs: 30 * 60000 });
    const later = acquireLock(s, 'wf-x', { nowMs: T0 + 31 * 60000, holder: 'run-b', staleMs: 30 * 60000 });
    expect(later.acquired).toBe(true);
    expect(later.reclaimed).toBe(true);
  });
  it('release frees the lock for the next fire', () => {
    const s = memoryStore();
    acquireLock(s, 'wf-x', { nowMs: T0 });
    releaseLock(s, 'wf-x');
    expect(acquireLock(s, 'wf-x', { nowMs: T0 + 1000 }).acquired).toBe(true);
  });
});

describe('kill-switch — pauses on a missed heartbeat and NEVER auto-resumes', () => {
  it('CATCHES the silent hang: a missed heartbeat pauses, and the pause is sticky', () => {
    const s = memoryStore();
    const k = killSwitch(s, 'wf-x', { nowMs: T0, missedMs: 15 * 60000 });
    k.beat(T0);
    expect(k.check(T0 + 14 * 60000).paused).toBe(false); // beating: alive
    const v = k.check(T0 + 15 * 60000);
    expect(v.paused).toBe(true);
    expect(v.reason).toMatch(/missed heartbeat/);
    // Sticky: even a later beat can NOT revive it — no auto-continue (P11).
    expect(k.beat(T0 + 16 * 60000).paused).toBe(true);
    expect(k.check(T0 + 99 * 60000).paused).toBe(true);
  });
  it('an explicit trip pauses immediately with the recorded why', () => {
    const s = memoryStore();
    const k = killSwitch(s, 'wf-x', { nowMs: T0 });
    k.beat(T0);
    k.trip('repeated failures on upload step');
    expect(k.check(T0 + 1).paused).toBe(true);
    expect(k.check(T0 + 1).reason).toMatch(/repeated failures/);
  });
  it('ONLY an explicit, attributed reset resumes', () => {
    const s = memoryStore();
    const k = killSwitch(s, 'wf-x', { nowMs: T0, missedMs: 1000 });
    k.beat(T0);
    k.check(T0 + 2000); // pauses
    expect(k.check(T0 + 3000).paused).toBe(true);
    const r = k.reset('darrell', T0 + 4000);
    expect(r.paused).toBe(false);
    expect(r.resetBy).toBe('darrell');
    expect(k.check(T0 + 4500).paused).toBe(false);
  });
});

describe('fleetOversight — Ari watches the real fleet, coverage never assumed', () => {
  const wfs = [
    { file: 'wf-a.json', name: 'Photos webhook', active: true, webhooks: ['photos'] },
    { file: 'wf-b.json', name: 'Old batch', active: false, webhooks: [] },
  ];
  it('an ACTIVE member with no declared brakes is named unbraked (the P10 class)', () => {
    const o = fleetOversight({ workflows: wfs, declarations: {} });
    expect(o.counts).toEqual({ total: 2, active: 1, braked: 0, activeUnbraked: 1, whyRecorded: 0, activeNoWhy: 1 });
    expect(o.activeUnbraked[0].id).toBe('wf-a.json');
  });
  it('INTENTION is read, never invented: a recorded why carries; a missing one is a named active gap', () => {
    const withWhy = [
      { file: 'wf-a.json', name: 'Photos webhook', active: true, why: 'Carries family photo uploads to the NAS bridge.' },
      { file: 'wf-c.json', name: 'Mystery job', active: true }, // no why
    ];
    const o = fleetOversight({ workflows: withWhy, declarations: {} });
    expect(o.members.find((m) => m.id === 'wf-a.json').why).toMatch(/photo uploads/);
    expect(o.members.find((m) => m.id === 'wf-a.json').whyRecorded).toBe(true);
    expect(o.counts.whyRecorded).toBe(1);
    expect(o.counts.activeNoWhy).toBe(1);
    expect(o.activeNoWhy[0].id).toBe('wf-c.json');
  });
  it('coverage counts ONLY a full budget+lock+kill declaration — partial is not braked', () => {
    const partial = { 'wf-a.json': { budget: true, lock: true, kill: false } };
    expect(fleetOversight({ workflows: wfs, declarations: partial }).counts.braked).toBe(0);
    const full = { 'wf-a.json': { budget: true, lock: true, kill: true } };
    const o = fleetOversight({ workflows: wfs, declarations: full });
    expect(o.counts.braked).toBe(1);
    expect(o.counts.activeUnbraked).toBe(0);
  });
  it('every shipped declaration is backed by real wired code — nothing invented', () => {
    // The registry grows ONLY as real code wires the kit. Today: the
    // review-watcher (lib/review-watcher.js, proven in review-watcher.test.js).
    expect(Object.keys(BRAKE_DECLARATIONS)).toEqual(['review-watcher']);
    const d = BRAKE_DECLARATIONS['review-watcher'];
    expect(d.budget && d.lock && d.kill).toBe(true);
    expect(d.note).toMatch(/review-watcher\.test\.js/); // the proof is named
  });
});
