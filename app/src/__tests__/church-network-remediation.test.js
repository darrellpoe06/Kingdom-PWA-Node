// @vitest-environment node
//
// church-network-remediation - the ordered patch plan for the Love Corner network.
//
// These gates guard something with physical consequences. A plan that orders
// segmentation before closing the bridge accomplishes nothing; a plan that orders a
// maintenance-window change before the reads that make it safe walks the church
// into an outage mid-service. The ordering IS the safety, so it is gated.
import { describe, it, expect } from 'vitest';
import {
  buildRemediationPlan, validatePlan, WINDOWS, REVERSIBILITY,
} from '../lib/church-network-remediation.js';
import { assessNetworkSecurity } from '../lib/church-network-security.js';
import { SEED_DEVICES, makeDevice } from '../lib/church-devices.js';

const plan = buildRemediationPlan(SEED_DEVICES);

describe('the plan is internally sound', () => {
  it('validates: no step precedes its own dependency', () => {
    expect(validatePlan(plan)).toEqual({ ok: true, errors: [] });
  });
  it('every step carries a rollback and a verification', () => {
    expect(plan.steps.length).toBeGreaterThan(0);
    for (const s of plan.steps) {
      expect(s.rollback).toBeTruthy();
      expect(s.verifies).toBeTruthy();
      expect(s.actions.length).toBeGreaterThan(0);
      expect(WINDOWS.some((w) => w.id === s.window)).toBe(true);
      expect(REVERSIBILITY.some((r) => r.id === s.reversibility)).toBe(true);
    }
  });
  it('PROVEN-TO-CATCH: validatePlan rejects a step ordered before its dependency', () => {
    const broken = {
      steps: [
        { id: 'b', dependsOn: ['a'], rollback: 'x', verifies: 'y', window: 'anytime', reversibility: 'instant' },
        { id: 'a', dependsOn: [], rollback: 'x', verifies: 'y', window: 'anytime', reversibility: 'instant' },
      ],
    };
    const r = validatePlan(broken);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/ordered before its dependency/);
  });
  it('PROVEN-TO-CATCH: validatePlan rejects a step with no way back', () => {
    const broken = {
      steps: [{ id: 'a', dependsOn: [], verifies: 'y', window: 'anytime', reversibility: 'instant' }],
    };
    expect(validatePlan(broken).ok).toBe(false);
    expect(validatePlan(broken).errors.join(' ')).toMatch(/no rollback/);
  });
});

describe('the ordering rule - nothing that can darken the sanctuary runs first', () => {
  it('starts with a read-only step', () => {
    expect(plan.steps[0].reversibility).toBe('read-only');
    expect(plan.steps[0].window).toBe('anytime');
    expect(plan.summary.startHere).toBe('identify-gear');
  });
  it('PROVEN-TO-CATCH: when a bridge EXISTS, closing it comes before segmenting', () => {
    // Building VLANs while a host still bridges two networks buys nothing - the
    // host carries traffic across whatever the firewall enforces. Tested on a
    // register that genuinely has a bridge, because the church's own /23 has none.
    const devices = [
      makeDevice({ id: 'nas', name: 'NAS', deviceType: 'nas', ipAddress: '10.1.1.10' }),
      makeDevice({ id: 'echo', name: 'Echo', deviceType: 'iot', ipAddress: '10.1.1.54' }),
      makeDevice({ id: 'gear', name: 'Gear', deviceType: 'network', ipAddress: '10.1.1.136', smeNeeded: true, confirmed: false }),
      makeDevice({ id: 'b', name: 'Bridge box', deviceType: 'server', ipAddress: '10.1.1.5', specs: { lanIpWifi: '10.2.2.5' } }),
    ];
    const p = buildRemediationPlan(devices);
    const ids = p.steps.map((s) => s.id);
    expect(ids).toContain('close-bridge');
    expect(ids.indexOf('segment-vlans')).toBeGreaterThan(ids.indexOf('close-bridge'));
    const seg = p.steps.find((s) => s.id === 'segment-vlans');
    expect(seg.dependsOn).toContain('close-bridge');
    expect(seg.dependsOn).toContain('identify-gear');
  });
  it('PROVEN-TO-CATCH: no bridge means no dangling dependency on one', () => {
    // The defect the /23 correction exposed: segment-vlans named close-bridge
    // unconditionally, so when that step stopped being generated the plan told an
    // operator to wait for a step that was not in it. validatePlan now catches it.
    const ids = plan.steps.map((s) => s.id);
    expect(ids).not.toContain('close-bridge');
    const seg = plan.steps.find((s) => s.id === 'segment-vlans');
    expect(seg.dependsOn).not.toContain('close-bridge');
    expect(validatePlan(plan).ok).toBe(true);
  });
  it('PROVEN-TO-CATCH: validatePlan rejects a dependency on a step not in the plan', () => {
    const broken = {
      steps: [{ id: 'a', dependsOn: ['ghost'], rollback: 'r', verifies: 'v', window: 'anytime', reversibility: 'instant' }],
    };
    const r = validatePlan(broken);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/not in this plan/);
  });
  it('PROVEN-TO-CATCH: the only maintenance-window step is last', () => {
    const maintenanceIdx = plan.steps
      .map((s, i) => (s.window === 'maintenance' ? i : -1))
      .filter((i) => i >= 0);
    const anytimeReadIdx = plan.steps
      .map((s, i) => (s.reversibility === 'read-only' ? i : -1))
      .filter((i) => i >= 0);
    for (const m of maintenanceIdx) {
      for (const a of anytimeReadIdx) expect(m).toBeGreaterThan(a);
    }
  });
  it('the segmentation step demands a config export before anything is touched', () => {
    const seg = plan.steps.find((s) => s.id === 'segment-vlans');
    expect(seg.actions[0]).toMatch(/[Ee]xport/);
    expect(seg.rollback).toMatch(/[Rr]estore/);
    expect(seg.blastRadius).toMatch(/EVERYTHING/);
  });
  it('the bridge step names the real host when there is one', () => {
    const devices = [
      makeDevice({ id: 'b', name: 'Bridge box', deviceType: 'server', ipAddress: '10.1.1.5', specs: { lanIpWifi: '10.2.2.5' } }),
    ];
    const p = buildRemediationPlan(devices);
    const bridge = p.steps.find((s) => s.id === 'close-bridge');
    expect(bridge).toBeTruthy();
    expect(bridge.title).toMatch(/Bridge box/);
  });
});

describe('the plan is derived, never a generic checklist', () => {
  it('PROVEN-TO-CATCH: a clean network yields no busywork', () => {
    // No IoT beside storage, no bridge, no unidentified gear, no overlay =>
    // none of those steps may appear. A hardening checklist that always prints the
    // same six items is theater.
    const clean = [
      makeDevice({ id: 'nas', name: 'NAS', deviceType: 'nas', ipAddress: '192.168.5.10', confirmed: true }),
      makeDevice({ id: 'gw', name: 'GW', deviceType: 'network', ipAddress: '192.168.5.1', confirmed: true }),
    ];
    const p = buildRemediationPlan(clean);
    const ids = p.steps.map((s) => s.id);
    expect(ids).not.toContain('segment-vlans');
    expect(ids).not.toContain('close-bridge');
    expect(ids).not.toContain('identify-gear');
    expect(ids).not.toContain('tailnet-acls');
  });
  it('each step closes a finding class that is actually present', () => {
    const present = new Set(assessNetworkSecurity(SEED_DEVICES).findings.map((f) => f.class));
    for (const s of plan.steps) {
      expect(s.closes.some((c) => present.has(c))).toBe(true);
    }
  });
  it('states the governing principle about service impact', () => {
    expect(plan.principle).toMatch(/dark sanctuary|interrupt a service/i);
  });
});
