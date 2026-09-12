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
    // Filenames, not numbers: twelve four-digit prefixes are shared by two
    // different migrations, so the number cannot order them and cannot even
    // name them apart.
    for (const leg of isolationLegs()) {
      const sorted = [...leg.migrations].sort();
      expect(leg.migrations, `leg "${leg.feature}" replays out of order`).toEqual(sorted);
    }
  });
});

describe('the guard can actually FAIL (a gate that cannot fail is theatre)', () => {
  const replaced = new Map([
    ['0100-a.sql', { file: '0100-a.sql', objects: new Set(['function:foo']) }],
    ['0110-b.sql', { file: '0110-b.sql', objects: new Set(['function:foo']) }],
    ['0120-c.sql', { file: '0120-c.sql', objects: new Set(['policy:t.p']) }],
  ]);

  it('catches a leg that replays the OLD definition and stops', () => {
    const r = check(replaced, [{ feature: 'x', migrations: ['0100-a.sql'] }]);
    expect(r.ok).toBe(false);
    expect(r.problems[0]).toMatch(/0110-b\.sql redefines the same/);
    expect(r.problems[0]).toMatch(/REVERTS it/);
  });

  it('catches a leg that lists the newer one BEFORE the older one', () => {
    expect(check(replaced, [{ feature: 'x', migrations: ['0110-b.sql', '0100-a.sql'] }]).ok).toBe(false);
  });

  it('passes when the newer one is listed after', () => {
    expect(check(replaced, [{ feature: 'x', migrations: ['0100-a.sql', '0110-b.sql'] }]).ok).toBe(true);
  });

  it('ignores migrations that share no object', () => {
    expect(check(replaced, [{ feature: 'x', migrations: ['0120-c.sql'] }]).ok).toBe(true);
  });
});

describe('what counts as a silent replacer', () => {
  it('sees CREATE OR REPLACE FUNCTION, CREATE POLICY and CREATE TRIGGER', () => {
    const objs = replacedObjects();
    const p0150 = objs.get('0150-poe-properties-app-invite-claim-and-household.sql').objects;
    expect([...p0150].some((o) => o.startsWith('function:'))).toBe(true);
    expect([...p0150].some((o) => o.startsWith('policy:'))).toBe(true);
    expect([...p0150].some((o) => o.startsWith('trigger:'))).toBe(true);
  });

  it('the two objects this incident was actually about are tracked', () => {
    const objs = replacedObjects();
    expect([...objs.get('0151-invite-by-phone-and-linked-identity.sql').objects]).toContain('function:claim_property_access');
    expect([...objs.get('0144-standings-at-will-and-the-sons-wall.sql').objects]).toContain('function:set_member_role');
  });

  // ── AND THE SECOND BLIND SPOT IN THE SAME GUARD (2026-09-12) ─────────────
  // TWELVE four-digit prefixes are shared by two different migrations. While
  // this map was keyed by the NUMBER, the second file read overwrote the
  // first, so everything the shadowed one defines was invisible. Found the
  // hard way: a prefix-keyed rewrite of the matrix silently swapped
  // books-role-wall's 0100-assistant-role-and-books-rls.sql for
  // 0100-bus-ride-requests.sql — the same collision, the other direction.
  it('does not let one migration shadow another that shares its number', () => {
    const objs = replacedObjects();
    expect(objs.has('0100-assistant-role-and-books-rls.sql')).toBe(true);
    expect(objs.has('0100-bus-ride-requests.sql')).toBe(true);
    // They are different migrations and must carry their own objects.
    const a = objs.get('0100-assistant-role-and-books-rls.sql').objects;
    const b = objs.get('0100-bus-ride-requests.sql').objects;
    expect([...a].some((o) => !b.has(o)) || [...b].some((o) => !a.has(o))).toBe(true);
  });

  // ── THE BLIND SPOT, FOUND THE THIRD TIME THIS CLASS BIT (2026-09-12) ──────
  // This guard ran green while production was broken. Measured on the live
  // database: list_instance_members had REVERTED to 0144's six columns, so
  // 0210's joined_at / last_sign_in_at / phone — shipped the night before —
  // were simply absent from poetech.us. Five legs replayed an older definer.
  //
  // The reason the pattern missed it is the sharp part: a migration that
  // changes a function's RETURN TYPE *cannot* say CREATE OR REPLACE, because
  // Postgres refuses ("cannot change return type of existing function"). It is
  // FORCED to write DROP FUNCTION + plain CREATE FUNCTION. So the one shape a
  // replacement is obliged to take was the one shape the guard could not see —
  // and a widening migration is exactly the kind you least want reverted.
  it('sees a plain CREATE FUNCTION, not only CREATE OR REPLACE', () => {
    const objs = replacedObjects();
    // 0210 and 0213 both DROP + CREATE this function; 0144 uses OR REPLACE.
    expect([...objs.get('0144-standings-at-will-and-the-sons-wall.sql').objects]).toContain('function:list_instance_members');
    expect([...objs.get('0210-the-signature-door-and-a-roster-that-says-when.sql').objects]).toContain('function:list_instance_members');
    expect([...objs.get('0213-the-roster-shows-what-the-person-told-us.sql').objects]).toContain('function:list_instance_members');
  });

  it('CATCHES the exact production regression: a leg replaying 0144 and stopping', () => {
    // The role-control leg as it actually stood while the roster was broken.
    const r = check(replacedObjects(), [{ feature: 'role-control', migrations: [
      '0111-set-member-role.sql', '0112-list-my-admin-instances.sql',
      '0130-assistant-provisioning-and-office-workspace.sql',
      '0131-stale-role-constraint-and-nullsafe-guards.sql',
      '0143-member-worker-classification.sql',
      '0144-standings-at-will-and-the-sons-wall.sql',
    ] }]);
    expect(r.ok).toBe(false);
    expect(r.problems.join('\n')).toMatch(/function:list_instance_members/);
    expect(r.problems.join('\n')).toMatch(/0210-the-signature-door/);
  });
});
