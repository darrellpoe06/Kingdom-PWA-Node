// @vitest-environment node
// =============================================================================
// A re-applied migration must never REVERT a newer one
// =============================================================================
// MEASURED LIVE, 2026-08-27, twice: db-migrate applied 0151 (invite-by-phone
// widened claim_property_access) and the rls-isolation matrix — whose legs
// re-apply their own chains "idempotently" before each smoke — put the 0150
// definition straight back. Every check was green and the live function was the
// old one. The same replay had ALSO been reverting 0144's set_member_role to
// the 0131 version for weeks: the successor and child standings (DR-0252) were
// simply not there on production, and nothing said so.
//
// The rule this pins: replay in ASCENDING migration order, and list every later
// migration that redefines the same object. Idempotent has to mean converging
// on the current truth, not restoring the past.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { check, replacedObjects, isolationLegs } from '../../../scripts/migration-replay-order-guard.mjs';

describe('the live repo', () => {
  it('no isolation leg can revert a newer migration', () => {
    const { ok, problems } = check();
    expect(ok, problems.join('\n')).toBe(true);
  });

  it('every leg lists its migrations in ascending order — the rule that makes replay safe', () => {
    for (const leg of isolationLegs()) {
      const sorted = [...leg.migrations].sort((a, b) => a - b);
      expect(leg.migrations, `leg "${leg.feature}" replays out of order`).toEqual(sorted);
    }
  });
});

describe('the guard can actually FAIL (a gate that cannot fail is theatre)', () => {
  const replaced = new Map([
    [100, { file: '0100-a.sql', objects: new Set(['function:foo']) }],
    [110, { file: '0110-b.sql', objects: new Set(['function:foo']) }],
    [120, { file: '0120-c.sql', objects: new Set(['policy:t.p']) }],
  ]);

  it('catches a leg that replays the OLD definition and stops', () => {
    const r = check(replaced, [{ feature: 'x', migrations: [100] }]);
    expect(r.ok).toBe(false);
    expect(r.problems[0]).toMatch(/0110-b\.sql redefines the same/);
    expect(r.problems[0]).toMatch(/REVERTS it/);
  });

  it('catches a leg that lists the newer one BEFORE the older one', () => {
    expect(check(replaced, [{ feature: 'x', migrations: [110, 100] }]).ok).toBe(false);
  });

  it('passes when the newer one is listed after', () => {
    expect(check(replaced, [{ feature: 'x', migrations: [100, 110] }]).ok).toBe(true);
  });

  it('ignores migrations that share no object', () => {
    expect(check(replaced, [{ feature: 'x', migrations: [120] }]).ok).toBe(true);
  });
});

describe('what counts as a silent replacer', () => {
  it('sees CREATE OR REPLACE FUNCTION, CREATE POLICY and CREATE TRIGGER', () => {
    const objs = replacedObjects();
    const p0150 = [...objs.entries()].find(([n]) => n === 150)[1].objects;
    expect([...p0150].some((o) => o.startsWith('function:'))).toBe(true);
    expect([...p0150].some((o) => o.startsWith('policy:'))).toBe(true);
    expect([...p0150].some((o) => o.startsWith('trigger:'))).toBe(true);
  });

  it('the two objects this incident was actually about are tracked', () => {
    const objs = replacedObjects();
    expect([...objs.get(151).objects]).toContain('function:claim_property_access');
    expect([...objs.get(144).objects]).toContain('function:set_member_role');
  });
});
