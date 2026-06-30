// Regression guard for the 2026-06-30 active-by-default sweep.
// The ledger encodes every inactive-by-default gate, classified into the four
// buckets. These tests are what make the sweep permanent: they HARD-FAIL the
// build if a works+data surface is left inactive, if an autonomous gate loses
// its brake naming, or if a broken surface is flipped on. (DR-0076.)
import { describe, it, expect } from 'vitest';
import {
  BUCKET, LEDGER, validateLedger, byBucket, fixList, counts,
} from '../lib/active-by-default-ledger.js';
import { surfaceById } from '../surfaces.js';

describe('active-by-default ledger', () => {
  it('holds every active-by-default invariant (the real ledger is clean)', () => {
    expect(validateLedger()).toEqual([]);
  });

  it('every surfaceId resolves to a real mounted surface (no painted entries)', () => {
    // Reality-Trace: an entry tagged to a surface must point at one that still
    // exists in the surface-mount registry, so a rename/removal trips here.
    for (const e of LEDGER) {
      if (e.surfaceId) expect(surfaceById[e.surfaceId], `${e.id} -> surface ${e.surfaceId}`).toBeTruthy();
    }
  });

  it('bucket 1 (works+data) entries are all active by default', () => {
    for (const e of byBucket(BUCKET.ACTIVE)) expect(e.active, e.id).toBe(true);
  });

  it('bucket 2 (autonomous) entries are all OFF and name a brake', () => {
    const two = byBucket(BUCKET.AUTONOMOUS);
    expect(two.length).toBeGreaterThan(0);
    for (const e of two) {
      expect(e.active, `${e.id} must be inactive (the Cage)`).toBe(false);
      expect(/brake|budget|lock|kill-switch|killswitch|kill switch|arm|inert|cage|dead-?man|ceiling|concurrency/i.test(e.reason), `${e.id} names a brake`).toBe(true);
    }
  });

  it('bucket 3 (safety) entries name their gate condition', () => {
    for (const e of byBucket(BUCKET.SAFETY)) {
      expect(typeof e.gate === 'string' && e.gate.trim().length, `${e.id} names its gate`).toBeTruthy();
    }
  });

  it('bucket 4 (broken) entries stay inactive and are on the fix list', () => {
    const four = byBucket(BUCKET.BROKEN);
    for (const e of four) expect(e.active, `${e.id} must stay off until fixed`).toBe(false);
    expect(fixList().map((f) => f.id).sort()).toEqual(four.map((e) => e.id).sort());
  });

  it('counts are a real tally of the ledger', () => {
    const c = counts();
    expect(c.total).toBe(LEDGER.length);
    expect(c.active + c.autonomous + c.safety + c.broken).toBe(c.total);
  });

  // Proven-to-catch (anti-theater, DR-0076): the guard must actually FAIL on the
  // exact regressions it claims to prevent. A guard that only ever passes is a lie.
  describe('proven to catch', () => {
    it('flags a works+data surface left inactive (the hedge we are removing)', () => {
      const bad = [{ id: 'hedge', label: 'x', ref: 'f.js:1', bucket: BUCKET.ACTIVE, active: false, reason: 'works with seed data but hidden for no reason' }];
      expect(validateLedger(bad)).toContain('hedge: bucket-1 (works+data) must be active by default — activate it or reclassify');
    });

    it('flags an autonomous gate that does not name a brake', () => {
      const bad = [{ id: 'loose', label: 'x', ref: 'f.js:1', bucket: BUCKET.AUTONOMOUS, active: false, gate: 'off', reason: 'just disabled for now, no detail given here' }];
      expect(validateLedger(bad)).toContain('loose: autonomous gate must name a brake (budget / concurrency lock / kill-switch / arm)');
    });

    it('flags an autonomous surface flipped active', () => {
      const bad = [{ id: 'armed', label: 'x', ref: 'f.js:1', bucket: BUCKET.AUTONOMOUS, active: true, gate: 'on', reason: 'has a budget and kill-switch but shipped active' }];
      expect(validateLedger(bad)).toContain('armed: autonomous automation must NOT be active by default (the Cage)');
    });

    it('flags a broken surface flipped on', () => {
      const bad = [{ id: 'halfbuilt', label: 'x', ref: 'f.js:1', bucket: BUCKET.BROKEN, active: true, gate: 'placeholder', reason: 'matter CRUD not built yet but turned on anyway' }];
      expect(validateLedger(bad)).toContain('halfbuilt: broken/half-built surfaces must stay inactive until fixed — do not flip on');
    });

    it('flags a lazy (un-named) reason', () => {
      const bad = [{ id: 'lazy', label: 'x', ref: 'f.js:1', bucket: BUCKET.SAFETY, active: false, gate: 'rls', reason: 'gated' }];
      expect(validateLedger(bad)).toContain('lazy: reason must be named (>= 20 chars), not lazy');
    });
  });
});
