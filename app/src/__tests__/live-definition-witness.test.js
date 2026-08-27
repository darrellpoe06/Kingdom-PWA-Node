// =============================================================================
// live-definition-witness — proven-to-catch (DR-0076 §3)
// =============================================================================
// A gate that always passes is itself a lie. These tests hold the witness
// against the TWO REAL REVERTS measured on production 2026-08-27, using the
// actual shapes the live database had at 01:17 UTC, before the repair at 01:22:
//
//   claim_property_access — the 0150 body, no my_identity_emails
//   set_member_role       — the 0131 body, no 'successor' and no 'child' arm
//
// Both must be caught from expectations DERIVED from the migration files, with
// nothing about either incident written into the witness by hand.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  stripComments,
  functionBodies,
  tokensOf,
  deriveExpectations,
  findReverted,
  functionsToQuery,
} from '../../../scripts/live-definition-witness.mjs';

const mig = (name, body) =>
  `create or replace function public.${name}(p_id uuid)\nreturns boolean\nlanguage plpgsql\nsecurity definer\nas $$\n${body}\n$$;`;

describe('parsing a migration', () => {
  it('reads the dollar-quoted body Postgres stores verbatim', () => {
    const [fn] = functionBodies(mig('claim_property_access', 'begin return true; end;'));
    expect(fn.name).toBe('claim_property_access');
    expect(fn.body).toContain('return true');
  });

  it('finds every function a single migration defines', () => {
    const sql = `${mig('one', 'begin end;')}\n${mig('two', 'begin end;')}`;
    expect(functionBodies(sql).map((f) => f.name)).toEqual(['one', 'two']);
  });

  it('ignores a rewritten comment so prose never becomes an expectation', () => {
    expect(stripComments('a -- note\nb /* block */ c')).not.toContain('note');
    expect(tokensOf('begin -- calls my_identity_emails\n return 1; end;')).not.toContain('my_identity_emails');
  });

  it('drops noise words that would pass against any body at all', () => {
    const t = tokensOf('begin select coalesce(auth.uid(), null) into v_thing; end;');
    expect(t.has('select')).toBe(false);
    expect(t.has('coalesce')).toBe(false);
    expect(t.has('v_thing')).toBe(true);
  });

  it('takes single-line literals and refuses quote-soup across newlines', () => {
    const t = tokensOf(`begin\n  execute format('alter table %I', r.tbl);\n  raise exception 'no-verified-identity';\nend;`);
    expect(t.has("'no-verified-identity'")).toBe(true);
    for (const tok of t) expect(tok).not.toContain('\n');
  });
});

describe('deriving what to check, from the migrations themselves', () => {
  const dir = undefined; // the module resolves the migrations dir from its own location

  it('fingerprints claim_property_access with 0151 over 0150', () => {
    const exp = deriveExpectations(dir).find((e) => e.name === 'claim_property_access');
    expect(exp).toBeTruthy();
    expect(exp.definedBy).toMatch(/^0151-/);
    expect(exp.supersedes.some((f) => f.startsWith('0150-'))).toBe(true);
    // The marker nobody wrote down: 0151's whole purpose.
    expect(exp.markers).toContain('my_identity_emails');
  });

  it('fingerprints set_member_role with 0144 over its three predecessors', () => {
    const exp = deriveExpectations(dir).find((e) => e.name === 'set_member_role');
    expect(exp).toBeTruthy();
    expect(exp.definedBy).toMatch(/^0144-/);
    expect(exp.supersedes.length).toBeGreaterThanOrEqual(3);
    expect(exp.markers).toContain("'child'");
    expect(exp.markers).toContain("'successor'");
  });

  it('says nothing about a function only one migration ever defined', () => {
    // Such a function cannot have been reverted TO anything, so an expectation
    // would be noise rather than a check.
    const names = deriveExpectations(dir).map((e) => e.name);
    expect(names).not.toContain('my_identity_emails');
  });

  it('every derived expectation carries at least one marker', () => {
    for (const e of deriveExpectations(dir)) expect(e.markers.length).toBeGreaterThan(0);
  });

  it('names the functions the live query has to fetch', () => {
    const names = functionsToQuery(deriveExpectations(dir));
    expect(names).toContain('claim_property_access');
    expect(names).toContain('set_member_role');
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('the two reverts that actually happened on production', () => {
  const expectations = deriveExpectations();
  const expFor = (n) => expectations.find((e) => e.name === n);

  it('CATCHES claim_property_access reverted to the 0150 definition', () => {
    // The measured live shape at 01:17 UTC: a claim function with no
    // my_identity_emails in it at all.
    const reverted = `CREATE OR REPLACE FUNCTION public.claim_property_access()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $function$
begin
  select lower(email) into v_email from auth.users where id = auth.uid();
  update property_access_invites set claimed_at = now() where lower(email) = v_email;
end;
$function$`;
    const failures = findReverted(expectations, { claim_property_access: reverted });
    expect(failures).toHaveLength(1);
    expect(failures[0].name).toBe('claim_property_access');
    expect(failures[0].missing).toContain('my_identity_emails');
    expect(failures[0].definedBy).toMatch(/^0151-/);
  });

  it('CATCHES set_member_role reverted to the pre-0144 definition', () => {
    // The 0131 shape: the role vocabulary without the DR-0252 standings.
    const reverted = `CREATE OR REPLACE FUNCTION public.set_member_role(p_user uuid, p_role text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $function$
begin
  if p_role not in ('owner','admin','member','viewer','assistant') then
    raise exception 'bad-role';
  end if;
  update instance_members set role = p_role where user_id = p_user;
end;
$function$`;
    const failures = findReverted(expectations, { set_member_role: reverted });
    expect(failures).toHaveLength(1);
    expect(failures[0].missing).toEqual(expect.arrayContaining(["'child'", "'successor'"]));
  });

  it('PASSES once the newest definition is what is live', () => {
    const exp = expFor('claim_property_access');
    const current = `CREATE OR REPLACE FUNCTION public.claim_property_access() AS $function$
begin
  ${exp.markers.join(' ')}
end;
$function$`;
    expect(findReverted([exp], { claim_property_access: current })).toEqual([]);
  });

  it('treats a function missing from the live database as absent, never as fine', () => {
    // public_vacancies had never been created; unknown must not read as fresh.
    const exp = expFor('claim_property_access');
    const failures = findReverted([exp], { claim_property_access: null });
    expect(failures).toHaveLength(1);
    expect(failures[0].reason).toContain('absent');
  });

  it('stays silent about a function it was never given, rather than guessing', () => {
    expect(findReverted(expectations, {})).toEqual([]);
  });

  it('does not fire on a definition that merely reformats the newest body', () => {
    const exp = expFor('set_member_role');
    const reformatted = `CREATE OR REPLACE FUNCTION public.set_member_role() AS $function$\nBEGIN\n\n  ${exp.markers.join('\n  ')}\n\nEND;\n$function$`;
    expect(findReverted([exp], { set_member_role: reformatted })).toEqual([]);
  });

  it('ignores a marker that appears only inside a comment in the live body', () => {
    const exp = expFor('claim_property_access');
    const commentedOut = `CREATE OR REPLACE FUNCTION public.claim_property_access() AS $function$
begin
  -- ${exp.markers.join(' ')}
  return null;
end;
$function$`;
    expect(findReverted([exp], { claim_property_access: commentedOut })).toHaveLength(1);
  });
});

describe('an overloaded function name', () => {
  const expectations = deriveExpectations();
  const exp = expectations.find((e) => e.name === 'set_member_role');
  const current = `AS $function$ begin ${exp.markers.join(' ')} end; $function$`;
  const old = `AS $function$ begin raise exception 'bad-role'; end; $function$`;

  it('passes when any one signature carries the newest body', () => {
    expect(findReverted([exp], { set_member_role: [old, current] })).toEqual([]);
  });

  it('fails when no signature does, and reports the closest miss', () => {
    const failures = findReverted([exp], { set_member_role: [old, old] });
    expect(failures).toHaveLength(1);
    expect(failures[0].missing).toEqual(expect.arrayContaining(["'child'"]));
  });

  it('treats an all-null array as absent', () => {
    const failures = findReverted([exp], { set_member_role: [null] });
    expect(failures[0].reason).toContain('absent');
  });
});
