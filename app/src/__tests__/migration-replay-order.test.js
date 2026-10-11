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
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  check, replacedObjects, isolationLegs, checkReplayShapes, functionShapes, functionShapesByFile,
  shellLegs, checkShellReplayShapes,
} from '../../../scripts/migration-replay-order-guard.mjs';

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


// =============================================================================
// THE FOURTH BLIND SPOT: ci.yml REPLAYS MIGRATIONS TOO (DR-0956)
// =============================================================================
// Measured 2026-10-11, ci.yml `door-work` red on PR #2112. The leg applies
// 0273 — which widens public_vacancy_photos()'s RETURNS TABLE with DROP +
// CREATE — and then re-applies 0153/0154 for the 0271 smoke. 0154's CREATE OR
// REPLACE carries the four-column shape and Postgres refused it outright:
// "cannot change return type of existing function ... Use DROP FUNCTION
// public_vacancy_photos(uuid) first."
//
// THE RULE WAS ALREADY WRITTEN AND ALREADY ENFORCED — on the other file. This
// guard caught the identical collision on rls-isolation.yml when 0273 was
// built, so the fix went only where the guard could see and the second leg
// shipped red. That is this guard's own header three times over: "a guard that
// cannot see part of its own input is the P55 shape again."
//
// The shell check is POSITIONAL, and stricter than the matrix one: a matrix leg
// has only a leg-level `pre`, while a shell leg's drops and applies interleave
// in one readable order, so a drop counts only where it actually falls.
describe('ci.yml replay legs are read too, in the order the shell runs them', () => {
  const byFile = new Map([
    ['0100-a.sql', { shapes: [{ name: 'f', returns: 'table(a text)' }], drops: new Set() }],
    ['0110-b.sql', { shapes: [{ name: 'f', returns: 'table(a text,b text)' }], drops: new Set(['f']) }],
    ['0105-same.sql', { shapes: [{ name: 'f', returns: 'table(a text)' }], drops: new Set() }],
  ]);
  const leg = (steps) => [{ job: 'door-work', steps }];
  // Resolved from this file, not the runner's cwd, which differs between a
  // local run and CI.
  const MIG = join(dirname(fileURLToPath(import.meta.url)), '../../../infra/supabase/migrations-auto');
  const apply = (file) => ({ kind: 'apply', file });

  it('PROVEN-TO-CATCH: a newer shape, then an older one, with no drop between', () => {
    const r = checkShellReplayShapes(byFile, leg([apply('0100-a.sql'), apply('0110-b.sql'), apply('0100-a.sql')]));
    expect(r.ok).toBe(false);
    expect(r.problems.join('\n')).toMatch(/job "door-work" applies 0100-a\.sql/);
    expect(r.problems.join('\n')).toMatch(/cannot change return type/);
  });

  it('passes once a drop falls BETWEEN them — position is the whole point', () => {
    const r = checkShellReplayShapes(byFile, leg([
      apply('0100-a.sql'), apply('0110-b.sql'), { kind: 'drop', name: 'f' }, apply('0100-a.sql'),
    ]));
    expect(r.ok, r.problems.join('\n')).toBe(true);
  });

  it('a drop AFTER the clash does not excuse it — a matrix pre could not tell these apart', () => {
    const r = checkShellReplayShapes(byFile, leg([
      apply('0100-a.sql'), apply('0110-b.sql'), apply('0100-a.sql'), { kind: 'drop', name: 'f' },
    ]));
    expect(r.ok).toBe(false);
  });

  it('a file that drops what it defines may be replayed back to back (0273 does)', () => {
    const r = checkShellReplayShapes(byFile, leg([apply('0100-a.sql'), apply('0110-b.sql'), apply('0110-b.sql')]));
    expect(r.ok, r.problems.join('\n')).toBe(true);
  });

  it('a same-shape redefinition needs no drop', () => {
    expect(checkShellReplayShapes(byFile, leg([apply('0100-a.sql'), apply('0105-same.sql')])).ok).toBe(true);
  });

  it('reads BOTH shell forms — the inline path and the `for f in` list', () => {
    const yml = [
      'jobs:',
      '  door-work:',
      '    steps:',
      '      - run: |',
      '          for f in 0153-property-timeline-photos.sql 0154-photo-captions-editable-and-archivable.sql; do',
      '            psql -f "infra/supabase/migrations-auto/$f"',
      '          done',
      '          psql -f infra/supabase/migrations-auto/0273-a-shared-home-says-so-on-the-shelf.sql',
      '          psql -c \'DROP FUNCTION IF EXISTS public.public_vacancy_photos(uuid);\'',
      '          psql -f infra/supabase/migrations-auto/9999-not-a-real-migration.sql',
      '  other:',
      '    steps:',
      '      - run: echo nothing',
      '',
    ].join('\n');
    const legs = shellLegs(yml, MIG);
    expect(legs.map((l) => l.job)).toEqual(['door-work']);
    expect(legs[0].steps).toEqual([
      // The `for f in` list, read from the line that names the files...
      { kind: 'apply', file: '0153-property-timeline-photos.sql' },
      { kind: 'apply', file: '0154-photo-captions-editable-and-archivable.sql' },
      // ...and the inline path, both in the order the shell runs them.
      { kind: 'apply', file: '0273-a-shared-home-says-so-on-the-shelf.sql' },
      { kind: 'drop', name: 'public_vacancy_photos' },
      // 9999 is absent: only a file that really exists counts, so a filename
      // in prose or a typo cannot invent a step.
    ]);
  });

  it('a commented-out line is not a step', () => {
    const yml = 'jobs:\n  j:\n    run: |\n      # psql -f infra/supabase/migrations-auto/0153-property-timeline-photos.sql\n';
    expect(shellLegs(yml, MIG)).toEqual([]);
  });

  it('the live repo: ci.yml has replay legs at all, so this check is not idle', () => {
    const legs = shellLegs();
    expect(legs.length).toBeGreaterThan(0);
    const dw = legs.find((l) => l.job === 'door-work');
    expect(dw, 'door-work is the leg this incident was about').toBeTruthy();
    expect(dw.steps.filter((s) => s.kind === 'apply').length).toBeGreaterThan(10);
  });

  it('the live repo: no ci.yml leg replays a function under two shapes without dropping it', () => {
    const r = checkShellReplayShapes(functionShapesByFile(), shellLegs());
    expect(r.ok, r.problems.join('\n')).toBe(true);
  });

  it('the live repo: door-work really does carry two shapes of public_vacancy_photos', () => {
    // If this ever stops being true the rule above is idle and the test says so
    // rather than passing quietly.
    const live = functionShapesByFile();
    const a = live.get('0154-photo-captions-editable-and-archivable.sql').shapes.find((s) => s.name === 'public_vacancy_photos');
    const b = live.get('0273-a-shared-home-says-so-on-the-shelf.sql').shapes.find((s) => s.name === 'public_vacancy_photos');
    expect(a.returns).not.toBe(b.returns);
    const dw = shellLegs().find((l) => l.job === 'door-work');
    const files = dw.steps.filter((s) => s.kind === 'apply').map((s) => s.file);
    expect(files).toContain('0154-photo-captions-editable-and-archivable.sql');
    expect(files).toContain('0273-a-shared-home-says-so-on-the-shelf.sql');
    expect(dw.steps.some((s) => s.kind === 'drop' && s.name === 'public_vacancy_photos')).toBe(true);
  });

  it('the leg ends where it is supposed to: 0273 goes on again after the replay', () => {
    // A passing replay is not the same as a converged chain. Replaying 0154
    // leaves the shelf back at four columns, so a door would silently stop
    // borrowing its sibling's pictures; measured on PostgreSQL 16.15, the
    // from_sibling column was GONE at that point.
    const dw = shellLegs().find((l) => l.job === 'door-work');
    const files = dw.steps.filter((s) => s.kind === 'apply').map((s) => s.file);
    const last154 = files.lastIndexOf('0154-photo-captions-editable-and-archivable.sql');
    const last273 = files.lastIndexOf('0273-a-shared-home-says-so-on-the-shelf.sql');
    expect(last273).toBeGreaterThan(last154);
  });
});
