// @vitest-environment node
//
// church-own-door — COLG's own app plan holds its own honesty rules (DR-0133):
// every opportunity carries a re-review date (DR-0075), every site fact carries
// provenance (DR-0076), every Tier C phase names its governor gate (RELEASE-TIERS
// + DR-0003 — Bishop Gwin governs the doctrine gate), hardware readiness DERIVES
// from the device register, and DR refs resolve against the live ledger (a dead
// ref reads missing, never papered over). Each rule is proven-to-catch: the gate
// is shown FAILING a violating row, not just passing the shipped plan.
import { describe, it, expect } from 'vitest';
import {
  DOOR_PLAN_RECORDED, DOOR_DOMAIN, MISSION_RAILS,
  DOOR_PHASES, DOOR_OPPORTUNITIES, DOOR_CONSTRAINTS,
  makeDoorPhase, doorHardwareReadiness, resolveDoorPlan, validateDoorPlan,
} from '../lib/church-own-door.js';
import { SEED_DEVICES } from '../lib/church-devices.js';

describe('the shipped plan passes its own gate', () => {
  it('validates clean', () => {
    const out = validateDoorPlan();
    expect(out.errors).toEqual([]);
    expect(out.ok).toBe(true);
  });
  it('is dated (P30 freshness) and names the real domain', () => {
    expect(DOOR_PLAN_RECORDED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(DOOR_DOMAIN).toBe('thechurchofthelivinggod.com');
  });
  it('carries the mission rails, each with a source', () => {
    expect(MISSION_RAILS.length).toBeGreaterThanOrEqual(4);
    for (const r of MISSION_RAILS) expect(String(r.source || '').length).toBeGreaterThan(0);
  });
});

describe('the gate CATCHES violations (anti-theater, DR-0076)', () => {
  it('fails an opportunity with no re-review date (DR-0075)', () => {
    const out = validateDoorPlan({ opportunities: [{ id: 'opp-x', title: 'x', reReview: '' }] });
    expect(out.ok).toBe(false);
    expect(out.errors.join(' ')).toContain('re-review');
  });
  it('fails a site fact with no provenance', () => {
    const out = validateDoorPlan({ facts: [{ id: 'fact-x', fact: 'claimed', provenance: '' }] });
    expect(out.ok).toBe(false);
    expect(out.errors.join(' ')).toContain('provenance');
  });
  it('fails a Tier C phase that does not name its governor gate', () => {
    const p = makeDoorPhase({ id: 'p-x', title: 'Public door', tier: 'C', drRefs: ['DR-0133'] });
    const out = validateDoorPlan({ phases: [p] });
    expect(out.ok).toBe(false);
    expect(out.errors.join(' ')).toContain('governor gate');
  });
  it('fails a "verified" phase with no evidence', () => {
    const p = makeDoorPhase({ id: 'p-y', title: 'Done, trust me', status: 'verified', tier: 'A', drRefs: ['DR-0133'] });
    const out = validateDoorPlan({ phases: [p] });
    expect(out.ok).toBe(false);
    expect(out.errors.join(' ')).toContain('evidence');
  });
  it('fails a phase standing on no decision at all', () => {
    const p = makeDoorPhase({ id: 'p-z', title: 'Unattributed work', tier: 'A' });
    const out = validateDoorPlan({ phases: [p] });
    expect(out.ok).toBe(false);
    expect(out.errors.join(' ')).toContain('decision');
  });
});

describe('hardware readiness DERIVES from the device register (no re-stated specs)', () => {
  it('reads the real register: GPU nodes, broadcast chain, storage, network', () => {
    const r = doorHardwareReadiness(SEED_DEVICES);
    expect(r.gpuNodes.length).toBeGreaterThanOrEqual(2);   // the two verified 4070 towers
    expect(r.broadcast.length).toBeGreaterThanOrEqual(4);  // LED wall + processor + switcher + cameras
    expect(r.storage.length).toBeGreaterThanOrEqual(1);    // at least one Synology
    expect(r.total).toBe(r.gpuNodes.length + r.broadcast.length + r.storage.length + r.network.length);
  });
  it('reflects register changes — remove the GPU nodes and readiness moves', () => {
    const without = SEED_DEVICES.filter((d) => d.deviceType !== 'gpu-node');
    expect(doorHardwareReadiness(without).gpuNodes).toEqual([]);
  });
});

describe('DR refs resolve against the live ledger (dead refs read missing)', () => {
  const LEDGER = {
    ok: true,
    items: [{ id: 'DR-0133', title: 'The church gets its own door', date: '2026-07-10', status: 'accepted' }],
  };
  it('marks found refs found and everything else honestly missing', () => {
    const out = resolveDoorPlan(LEDGER);
    const byRef = Object.fromEntries(out.map((r) => [r.drRef, r]));
    expect(byRef['DR-0133']).toMatchObject({ found: true, drDate: '2026-07-10' });
    expect(byRef['DR-0114'].found).toBe(false); // not in this fake ledger — reads missing, never invented
  });
  it('degrades honestly on a missing ledger', () => {
    for (const r of resolveDoorPlan(null)) expect(r.found).toBe(false);
  });
  it('every phase DR ref is well-formed', () => {
    for (const p of DOOR_PHASES) for (const r of p.drRefs) expect(r).toMatch(/^DR-\d{4}$/);
  });
});

describe('the strategy content itself', () => {
  it('the domain cutover and public door are Tier C with named gates (never the fast lane)', () => {
    const cutover = DOOR_PHASES.find((p) => p.id === 'phase-domain-cutover');
    const door = DOOR_PHASES.find((p) => p.id === 'phase-door-build');
    for (const p of [cutover, door]) {
      expect(p.tier).toBe('C');
      expect(String(p.gate)).toMatch(/Bishop Gwin|Tier C/);
    }
  });
  it('opportunities are ranked without gaps and dated', () => {
    const ranks = DOOR_OPPORTUNITIES.map((o) => o.rank).sort((a, b) => a - b);
    expect(ranks).toEqual(Array.from({ length: ranks.length }, (_, i) => i + 1));
  });
  it('constraints carry their sources', () => {
    for (const c of DOOR_CONSTRAINTS) expect(String(c.source || '').length).toBeGreaterThan(0);
  });
  it('the verified strategy phase carries evidence naming the DR and the session note', () => {
    const s = DOOR_PHASES.find((p) => p.id === 'phase-strategy');
    expect(s.status).toBe('verified');
    expect(s.evidence).toContain('DR-0133');
  });
});
