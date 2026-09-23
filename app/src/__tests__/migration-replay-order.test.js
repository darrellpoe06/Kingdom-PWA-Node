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
import { check, replacedObjects, isolationLegs, checkReplayShapes, functionShapes, functionShapesByFile } from '../../../scripts/migration-replay-order-guard.mjs';

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

// ── THE THIRD BLIND SPOT (2026-09-23): listed in order, refused anyway ───────
// rls-isolation ran 8 of 9 red because the role-control leg re-applied 0112's
// narrow list_my_admin_instances() on a database 0221 had already widened.
// Ordering was correct; the older file was simply refused. The leg must drop
// the function in its pre-step, and this guard now says so.
describe('a leg that replays a function under two RETURNS shapes must drop it first', () => {
  const narrow = 'CREATE OR REPLACE FUNCTION public.f() RETURNS TABLE (a uuid, b text) LANGUAGE sql AS $$ select 1 $$;';
  const wide = 'DROP FUNCTION IF EXISTS public.f();\nCREATE FUNCTION public.f() RETURNS TABLE (a uuid, slug text, b text) LANGUAGE sql AS $$ select 1 $$;';
  const same = 'CREATE OR REPLACE FUNCTION public.f() RETURNS TABLE (a uuid, b text) LANGUAGE plpgsql AS $$ begin end $$;';
  const byFile = new Map([
    ['0100-a.sql', { shapes: functionShapes(narrow), drops: new Set() }],
    ['0110-b.sql', { shapes: functionShapes(wide), drops: new Set(['f']) }],
    ['0105-same.sql', { shapes: functionShapes(same), drops: new Set() }],
  ]);

  it('reads a plain CREATE FUNCTION as well as CREATE OR REPLACE, with the RETURNS normalized', () => {
    expect(functionShapes(wide)).toEqual([{ name: 'f', returns: 'table(a uuid,slug text,b text)' }]);
    expect(functionShapes(narrow)[0].returns).toBe('table(a uuid,b text)');
  });

  it('PROVEN-TO-CATCH: the 0112/0221 shape — ordered correctly, no pre-drop — is named', () => {
    const r = checkReplayShapes(byFile, [{ feature: 'x', pre: '', migrations: ['0100-a.sql', '0110-b.sql'] }]);
    expect(r.ok).toBe(false);
    expect(r.problems[0]).toMatch(/re-applies 0100-a\.sql, which defines f\(\)/);
    expect(r.problems[0]).toMatch(/cannot change return type/);
    expect(r.problems[0]).toMatch(/DROP FUNCTION IF EXISTS public\.f/);
  });

  it('passes once the leg\'s pre drops the function', () => {
    const r = checkReplayShapes(byFile, [{ feature: 'x', pre: 'DROP FUNCTION IF EXISTS public.f();', migrations: ['0100-a.sql', '0110-b.sql'] }]);
    expect(r.ok, r.problems.join('\n')).toBe(true);
  });

  it('a same-shape redefinition needs no drop (dropping needlessly discards grants)', () => {
    expect(checkReplayShapes(byFile, [{ feature: 'x', pre: '', migrations: ['0100-a.sql', '0105-same.sql'] }]).ok).toBe(true);
  });

  it('the pre is read from the workflow text', () => {
    const legs = isolationLegs('      matrix:\n        include:\n          - feature: role-control\n            pre: "DROP FUNCTION IF EXISTS public.g();"\n            migrations: "0100-a.sql"\n          - feature: bare\n            migrations: "0100-a.sql"\n');
    expect(legs.map((l) => [l.feature, l.pre])).toEqual([['role-control', 'DROP FUNCTION IF EXISTS public.g();'], ['bare', '']]);
  });

  it('the live repo: no leg replays a function under two shapes without dropping it', () => {
    const r = checkReplayShapes(functionShapesByFile(), isolationLegs());
    expect(r.ok, r.problems.join('\n')).toBe(true);
  });

  it('the live repo: the incident pair IS two shapes of one function, so the rule is exercised, not idle', () => {
    const byFileLive = functionShapesByFile();
    const a = byFileLive.get('0112-list-my-admin-instances.sql').shapes.find((s) => s.name === 'list_my_admin_instances');
    const b = byFileLive.get('0221-the-space-picker-can-name-the-door-it-belongs-to.sql').shapes.find((s) => s.name === 'list_my_admin_instances');
    expect(a.returns).not.toBe(b.returns);
    const role = isolationLegs().find((l) => l.feature === 'role-control');
    expect(role.pre).toMatch(/list_my_admin_instances/);
  });
});
