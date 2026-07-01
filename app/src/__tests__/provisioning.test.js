// provisioning — the repeatable plan and the evidence-based handoff gate. The
// gate's whole point is that an UNMEASURED claim never reads as a pass (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  PROVISIONING_STEPS, HANDOFF_GATES, provisioningReadiness, renewalStatus,
} from '../lib/provisioning.js';

describe('provisioning plan', () => {
  it('orders the steps from instance creation through handoff', () => {
    const ids = PROVISIONING_STEPS.map((s) => s.id);
    expect(ids[0]).toBe('instance');
    expect(ids[ids.length - 1]).toBe('handoff');
    expect(ids).toContain('isolation');
    expect(ids).toContain('seed');
  });

  it('every step ties to a real mechanism and a real verification', () => {
    for (const s of PROVISIONING_STEPS) {
      expect(s.mechanism, `${s.id}.mechanism`).toBeTruthy();
      expect(s.verify, `${s.id}.verify`).toBeTruthy();
      expect(typeof s.automatable).toBe('boolean');
    }
  });

  it('the isolation step names the real RLS predicate and the two-identity probe', () => {
    const iso = PROVISIONING_STEPS.find((s) => s.id === 'isolation');
    expect(iso.mechanism).toContain('user_in_instance');
    expect(iso.verify.toLowerCase()).toMatch(/no-leak|zero/);
  });
});

describe('provisioningReadiness — evidence-based handoff gate', () => {
  const allTrue = {
    ownerMembershipPresent: true, noLeakProbePassed: true, grantGuardGreen: true,
    starterChosenAndClean: true, ciGreenOnServedSha: true, noDeadLoops: true,
  };

  it('is ready only when every gate has passing evidence', () => {
    const r = provisioningReadiness(allTrue);
    expect(r.ready).toBe(true);
    expect(r.blocking).toHaveLength(0);
    expect(r.gates.every((g) => g.status === 'pass')).toBe(true);
  });

  it('a measured failure blocks handoff', () => {
    const r = provisioningReadiness({ ...allTrue, noLeakProbePassed: false });
    expect(r.ready).toBe(false);
    expect(r.blocking.some((g) => g.id === 'isolationProbed' && g.status === 'fail')).toBe(true);
  });

  it('an UNMEASURED signal is "unknown" and blocks — never an assumed pass', () => {
    const { noLeakProbePassed, ...partial } = allTrue;
    const r = provisioningReadiness(partial);
    expect(r.ready).toBe(false);
    const iso = r.gates.find((g) => g.id === 'isolationProbed');
    expect(iso.status).toBe('unknown');
    expect(iso.evidence).toBe('no measurement');
  });

  it('an empty signals object blocks every gate', () => {
    const r = provisioningReadiness();
    expect(r.ready).toBe(false);
    expect(r.blocking).toHaveLength(HANDOFF_GATES.length);
  });
});

describe('renewalStatus — is the instance getting better each cycle (QCHP)', () => {
  it('reports not-renewing with no cycles yet', () => {
    expect(renewalStatus([]).renewing).toBe(false);
  });

  it('a first cycle sets the baseline', () => {
    const r = renewalStatus([{ cycle: '2026-Q2', score: 80 }]);
    expect(r.renewing).toBe(true);
    expect(r.delta).toBeNull();
  });

  it('an improving or held score is renewing', () => {
    expect(renewalStatus([{ cycle: 'a', score: 80 }, { cycle: 'b', score: 85 }]).renewing).toBe(true);
    expect(renewalStatus([{ cycle: 'a', score: 80 }, { cycle: 'b', score: 80 }]).renewing).toBe(true);
  });

  it('a decline with NO stated why is not renewing (DR-0075)', () => {
    const r = renewalStatus([{ cycle: 'a', score: 85 }, { cycle: 'b', score: 78 }]);
    expect(r.renewing).toBe(false);
    expect(r.note.toLowerCase()).toContain('no stated why');
  });

  it('a decline WITH a stated why is an allowed, recorded decision', () => {
    const r = renewalStatus([
      { cycle: 'a', score: 85 },
      { cycle: 'b', score: 78, why: 'migration soak intentionally paused two loops' },
    ]);
    expect(r.renewing).toBe(false); // still flagged, but with the why surfaced
    expect(r.note.toLowerCase()).toContain('stated why');
  });
});
