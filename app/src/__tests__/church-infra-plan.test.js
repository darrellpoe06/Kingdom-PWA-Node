import { describe, it, expect } from 'vitest';
import {
  makeMilestone, validateMilestone, MILESTONES, summarizePlan,
  fairnessGateViolations, milestonesByWorkstream, verifiedComputeNodes,
} from '../lib/church-infra-plan.js';
import { SEED_DEVICES } from '../lib/church-devices.js';

describe('church-infra-plan — the fairness gate is a GATE (proven-to-catch)', () => {
  it('a recognition milestone WITHOUT the fairness gate is INVALID', () => {
    const bad = makeMilestone({ title: 'auto-door', recognition: true, requiresFairnessGate: false });
    const r = validateMilestone(bad);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/FAIRNESS/i);
  });
  it('a recognition milestone WITH the gate is valid', () => {
    expect(validateMilestone(makeMilestone({ title: 'auto-door', recognition: true, requiresFairnessGate: true })).ok).toBe(true);
  });
  it('a "verified" milestone with no evidence is INVALID (Verification Doctrine)', () => {
    expect(validateMilestone(makeMilestone({ title: 'x', status: 'verified' })).ok).toBe(false);
    expect(validateMilestone(makeMilestone({ title: 'x', status: 'verified', evidence: 'proof' })).ok).toBe(true);
  });
  it('every seeded milestone is valid AND no recognition milestone is missing the gate', () => {
    const bad = MILESTONES.filter((m) => !validateMilestone(m).ok);
    expect(bad.map((m) => m.id)).toEqual([]);
    expect(fairnessGateViolations(MILESTONES)).toHaveLength(0);
  });
});

describe('church-infra-plan — honest derivations', () => {
  it('summarizePlan: real verified count (the 4070 work) + every recognition milestone is gated', () => {
    const s = summarizePlan(MILESTONES);
    expect(s.total).toBe(MILESTONES.length);
    expect(s.byStatus.verified).toBeGreaterThanOrEqual(1);
    expect(s.recognition).toBeGreaterThanOrEqual(1);
    expect(s.gated).toBe(s.recognition);
  });
  it('reads the verified GPU nodes from the device register (the two 4070 towers)', () => {
    const nodes = verifiedComputeNodes(SEED_DEVICES);
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    expect(nodes.every((n) => n.deviceType === 'gpu-node')).toBe(true);
  });
  it('groups milestones into both workstreams', () => {
    const byWs = milestonesByWorkstream(MILESTONES);
    expect(byWs.compute.length).toBeGreaterThanOrEqual(1);
    expect(byWs.cameras.length).toBeGreaterThanOrEqual(1);
  });
});
