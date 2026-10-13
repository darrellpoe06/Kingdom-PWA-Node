// =============================================================================
// A BED STILL SAYS IT IS A BED WHEN THE STREET SHOWS (DR-0983)
// =============================================================================
// 0278 exists because of one sentence Darrell typed at his own door's public
// card — "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!" — and its own answer:
// "What is being rented is a BED IN A SHARED ROOM, and that is what the card
// must say."
//
// 0280 added the street to that shelf and branched the label on whether the
// street shows, leaving 0278's descriptor in the ELSE arm. It also set
// address_visibility's DEFAULT to 'public' and UPDATEd every existing row to
// 'public' — so the ELSE arm became the exception, and a bed's headline
// reverted to the landlord-typed door name. On his door that is the exact
// string 0278 was written to replace.
//
// Measured on the live hosted database, rls-isolation run 38329136075:
//   0273-shared-home-smoke.sql: ERROR: a bed in a shared home does not say
//   shared: Room 1 - Bed A
//
// The smoke was RIGHT. These tests pin the fix, pin that a whole unit is
// untouched, and pin the gate that generalizes it.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  definedFunctions, definitionsByFile, newestDefiner, migrationsForSmoke,
  isolationLegsWithSmokes, shellSmokes, checkChain, check,
} from '../../../scripts/newest-definition-replay-guard.mjs';
import { shellLegs } from '../../../scripts/migration-replay-order-guard.mjs';
import { functionReturns, check as returnTypeCheck } from '../../../scripts/migration-return-type-guard.mjs';

const ROOT = join(__dirname, '../../..');
const mig = (f) => readFileSync(join(ROOT, 'infra/supabase/migrations-auto', f), 'utf8');
const F278 = '0278-a-bed-is-not-a-bedroom.sql';
const F280 = '0280-the-address-shows-unless-the-family-holds-it.sql';
const F281 = '0281-a-bed-still-says-it-is-a-bed-when-the-street-shows.sql';
const F282 = '0282-each-door-shows-the-apartment-in-its-own-order.sql'; // the pre-fix state predates it
const F283 = '0283-a-held-door-shows-its-buildings-area.sql'; // so does this one

// The label expression, read out of 0281 so these assertions are about the
// shipped SQL and not about a copy of it.
const label281 = () => {
  const s = mig(F281);
  const a = s.indexOf('SELECT v.id,');
  const b = s.indexOf('END AS label,', a);
  return s.slice(a, b);
};

describe('0281 puts the room/bed descriptor in front of the street branch', () => {
  it('a room or a bed is matched FIRST, before v.shown is consulted', () => {
    const l = label281();
    const bedArm = l.indexOf("WHEN v.level IN ('room', 'bed') THEN");
    const shownArm = l.indexOf('WHEN v.shown');
    expect(bedArm).toBeGreaterThan(-1);
    expect(shownArm).toBeGreaterThan(-1);
    expect(bedArm).toBeLessThan(shownArm);
  });

  it('that first arm composes the descriptor the card must say', () => {
    const l = label281();
    const arm = l.slice(l.indexOf("WHEN v.level IN ('room', 'bed') THEN"), l.indexOf('WHEN v.shown'));
    expect(arm).toContain("WHEN 'bed'  THEN 'Bed in a shared'");
    expect(arm).toContain("WHEN 'room' THEN 'Private room in a shared'");
    expect(arm).toContain("coalesce(nullif(v.property_type, ''), 'place')");
    // The descriptor never reads the landlord-typed name — that is the string
    // 0278 exists to replace.
    expect(arm).not.toContain('display_name');
  });

  it("a WHOLE UNIT keeps 0280's label exactly: its own name when shown, the bedroom count when held", () => {
    const l = label281();
    const rest = l.slice(l.indexOf('WHEN v.shown'));
    expect(rest).toContain("coalesce(nullif(v.display_name, ''), nullif(v.city, ''), 'Available unit')");
    expect(rest).toContain("CASE WHEN v.beds > 0 THEN v.beds || '-bed' END");
    // And the bed/room arms are NOT duplicated down here any more.
    expect(rest).not.toContain("'Bed in a shared'");
  });

  it('0280 is the file that moved it, and 0281 is the newest definition', () => {
    // 0280 really does gate the descriptor on v.shown — the premise of this fix,
    // read from 0280 rather than asserted.
    const s280 = mig(F280);
    const a = s280.indexOf('SELECT v.id,');
    const b = s280.indexOf('END AS label,', a);
    const l280 = s280.slice(a, b);
    expect(l280.indexOf('WHEN v.shown')).toBeLessThan(l280.indexOf("WHEN 'bed'  THEN 'Bed in a shared'"));
    // 0283 (DR-0997) redefined it again after 0281, keeping 0281's label arm;
    // the newest definer moves with the chain, the premise above does not.
    expect(newestDefiner().get('public_vacancies')).toBe(F283);
    expect(mig(F283)).toContain("WHEN v.level IN ('room', 'bed') THEN");
  });

  it('nothing else about the shelf moved: the street, the area and shared_home are unchanged', () => {
    const s = mig(F281);
    expect(s).toContain("CASE WHEN v.shown THEN nullif(trim(both ' ' from v.address), '') END AS street");
    expect(s).toContain("(v.level IN ('room', 'bed')) AS shared_home");
    expect(s).toContain('CASE WHEN v.shown THEN v.unit ELSE NULL END AS unit');
    // RETURNS shape identical to 0280's, so no DROP is needed and no return
    // type changes (migration-return-type-guard's class).
    expect(s).toContain('CREATE OR REPLACE FUNCTION public.public_vacancies()');
    expect(s).not.toContain('DROP FUNCTION IF EXISTS public.public_vacancies()');
  });

  it('writes no row and carries his sentence', () => {
    const s = mig(F281);
    expect(s).not.toMatch(/^\s*(INSERT|UPDATE|DELETE)\s/mi);
    expect(s).toContain('0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!');
  });
});

describe('every chain that runs a shelf smoke converges on the newest definition', () => {
  it('the live leg applies 0281 after 0280', () => {
    const leg = isolationLegsWithSmokes().find((l) => l.feature === 'poe-properties');
    expect(leg.migrations).toContain(F281);
    expect(leg.migrations.indexOf(F281)).toBeGreaterThan(leg.migrations.indexOf(F280));
  });

  it("ci.yml's door-work leg now applies 0278, 0280 and 0281 before its second 0273 smoke", () => {
    const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
    const second = ci.lastIndexOf('tests/0273-shared-home-smoke.sql');
    for (const f of [F278, F280, F281]) {
      expect(ci.indexOf(f)).toBeGreaterThan(-1);
      expect(ci.indexOf(f)).toBeLessThan(second);
    }
    const leg = shellLegs().find((l) => l.job === 'door-work');
    const applied = leg.steps.filter((s) => s.kind === 'apply').map((s) => s.file);
    for (const f of [F278, F280, F281]) expect(applied).toContain(f);
  });

  it('the e2e door-database builder applies 0281, and its loop still expands whole', () => {
    const sh = readFileSync(join(ROOT, 'scripts/e2e/build-door-db.sh'), 'utf8');
    expect(sh).toContain(F281);
    expect(sh.indexOf(F281)).toBeGreaterThan(sh.indexOf(F280));
    // A `#` between backslash-continued words would drop everything after it.
    for (const f of [F280, F281]) expect(sh.split(f).length - 1).toBeGreaterThanOrEqual(1);
  });

  it('the guard passes across every chain in the repository', () => {
    expect(check()).toEqual([]);
  });

  // PROVEN TO CATCH (DR-0076 §3), on the two real pre-fix states.
  it("FAILS ci.yml's leg in the exact state that was green while the live leg was red", () => {
    const byFile = definitionsByFile();
    const newest = newestDefiner(byFile);
    const leg = shellLegs().find((l) => l.job === 'door-work');
    const applied = leg.steps.filter((s) => s.kind === 'apply').map((s) => s.file)
      .filter((f) => ![F278, F280, F281, F282, F283].includes(f));
    const problems = checkChain(applied, shellSmokes().get('door-work'), 'ci.yml door-work', byFile, newest);
    expect(problems.length).toBeGreaterThanOrEqual(2);
    const all = problems.join('\n');
    expect(all).toContain('0273-shared-home-smoke.sql');
    expect(all).toContain('public_vacancies()');
    // The second divergence the guard found on its own: 0278 also redefines
    // public_vacancy_photos, and that leg never applied it either.
    expect(all).toContain('public_vacancy_photos()');
  });

  it('FAILS the live leg the moment the newest definition (0283, after 0281) is taken back out', () => {
    const byFile = definitionsByFile();
    const newest = newestDefiner(byFile);
    const leg = isolationLegsWithSmokes().find((l) => l.feature === 'poe-properties');
    const problems = checkChain(leg.migrations.filter((f) => f !== F283), leg.smokes, 'live', byFile, newest);
    expect(problems.length).toBeGreaterThanOrEqual(1);
    expect(problems.join('\n')).toContain(F283);
  });

  it('reads definitions and the newest definer honestly', () => {
    expect(definedFunctions('CREATE OR REPLACE FUNCTION public.foo(a int) RETURNS int AS $$ SELECT 1 $$;')).toEqual(['foo']);
    expect(definedFunctions('-- CREATE FUNCTION public.commented(x int)')).toEqual([]);
    expect(definedFunctions('CREATE FUNCTION public.bar() RETURNS void AS $$ $$;')).toEqual(['bar']);
    expect(migrationsForSmoke('0273-shared-home-smoke.sql')).toContain('0273-a-shared-home-says-so-on-the-shelf.sql');
    expect(migrationsForSmoke('not-a-smoke.sql')).toEqual([]);
  });

  it('says nothing about a chain that never applies the smoke\'s own migration', () => {
    const byFile = definitionsByFile();
    expect(checkChain([], ['0273-shared-home-smoke.sql'], 'empty', byFile, newestDefiner(byFile))).toEqual([]);
  });
});

// ── A GUARD THAT WAS BLIND TO ITS OWN SUBJECT. migration-return-type-guard
// exists to catch a migration changing a function's RETURNS shape without
// dropping it first. Its reader matched only `CREATE OR REPLACE FUNCTION` — and
// a return-type change CANNOT use OR REPLACE, because Postgres refuses it, so
// it must be written `DROP FUNCTION …; CREATE FUNCTION …`. The guard could not
// see the only syntax its own subject can be written in.
//
// Measured while shipping 0281: it reported `public_vacancies` changing shape
// "from 0270", three migrations stale, because 0273's, 0278's and 0280's
// definitions were all invisible to it. That is BOTH failure modes at once —
// blind to real changes (DR-0076 §3) and crying wolf on a safe one (P46).
//
// This is the identical lesson migration-replay-order-guard's own header
// records from 2026-09-12: "The one case where a replacement is FORCED to look
// different was the one case the pattern missed." It was widened there and
// never here.
describe('migration-return-type-guard sees a plain CREATE FUNCTION too', () => {
  const sh = (f, name) => functionReturns(mig(f)).find((x) => x.name === name);

  it('now sees 0280 and 0281, which it could not see before', () => {
    expect(sh(F280, 'public_vacancies')).toBeTruthy();
    expect(sh(F281, 'public_vacancies')).toBeTruthy();
    expect(sh(F278, 'public_vacancies')).toBeTruthy();
    expect(sh('0273-a-shared-home-says-so-on-the-shelf.sql', 'public_vacancies')).toBeTruthy();
  });

  it("0281's RETURNS shape is byte-identical to 0280's, so CREATE OR REPLACE is correct", () => {
    const a = sh(F280, 'public_vacancies').returns;
    const b = sh(F281, 'public_vacancies').returns;
    expect(b).toBe(a);
    expect(a.length).toBeGreaterThan(300);
  });

  it('the whole repository is clean under the widened reader — no cleanup was hidden behind the blind spot', () => {
    expect(returnTypeCheck()).toEqual([]);
  });

  // PROVEN TO CATCH, and proven that the NARROW pattern missed it.
  it('catches a later plain CREATE FUNCTION that changes a shape with no DROP', () => {
    const NARROW = /create\s+or\s+replace\s+function\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi;
    const WIDE = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi;
    const real = 'DROP FUNCTION IF EXISTS public.zz();\nCREATE FUNCTION public.zz() RETURNS TABLE (a int, b text) LANGUAGE sql AS $$ SELECT 1, \'x\' $$;';
    NARROW.lastIndex = 0; WIDE.lastIndex = 0;
    expect(NARROW.test(real)).toBe(false);     // the blind spot, reproduced
    expect(WIDE.test(real)).toBe(true);        // and closed
    // And the widened reader really extracts both shapes as different.
    const one = functionReturns('CREATE FUNCTION public.zz() RETURNS TABLE (a int) LANGUAGE sql AS $$ SELECT 1 $$;')[0];
    const two = functionReturns(real)[0];
    expect(one.name).toBe('zz');
    expect(two.name).toBe('zz');
    expect(one.returns).not.toBe(two.returns);
  });

  it('a file that DROPs before its CREATE is still allowed — the legitimate pattern', () => {
    // 0278 and 0280 both do exactly this, and neither is a violation.
    expect(returnTypeCheck().filter((v) => v.file === F278 || v.file === F280)).toEqual([]);
  });
});

describe('the smoke that caught this is left exactly as it was', () => {
  it('still demands a bed say shared — the assertion that was right', () => {
    const s = readFileSync(join(ROOT, 'infra/supabase/tests/0273-shared-home-smoke.sql'), 'utf8');
    expect(s).toContain("IF lbl !~* 'shared' THEN");
    expect(s).toContain("RAISE EXCEPTION 'a bed in a shared home does not say shared: %', lbl;");
    expect(s).toContain("IF lbl ~* '^[0-9]+-bed' THEN");
  });

  it('and still seeds the bed the way a real door now is — no address_visibility, so the default applies', () => {
    const s = readFileSync(join(ROOT, 'infra/supabase/tests/0273-shared-home-smoke.sql'), 'utf8');
    const seed = s.slice(s.indexOf('INSERT INTO rentals'), s.indexOf('-- Bed E is occupied'));
    expect(seed).toContain("'Room 1 - Bed A'");
    expect(seed).not.toContain('address_visibility');
  });
});
