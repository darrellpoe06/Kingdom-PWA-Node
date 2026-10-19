// @vitest-environment node
// =============================================================================
// The shell asks the ROLE who governs — not the email allowlist (DR-1106 wiring)
// =============================================================================
// DR-1106 shipped the model (lib/family-standing.js, 17 cases) and said plainly
// that the shell's isGovernor call sites were NOT yet rewired. This is that
// slice, and these are its gates.
//
// THE DEFECT, measured before the wiring: every Governor affordance in the shell
// was bound to `isFamilyEmail` or to `isFamilyMember` (which is that same email
// allowlist). Migration 0144 moved Darrell Jr to the 'child' role and raised the
// RLS wall on 2026-08-23, but his address stayed on the list — so the client
// handed a minor the Admin console, the governance station, the Relationships
// capability panel and the Projects governor controls, over rows the database
// denies. Over-trusted by the app, locked out by the data, at the same time.
//
// These cases hold the wiring shut in three places, because the hole can reopen
// in three different ways:
//   1. a new isGovernor binding written from the address again (the scanner)
//   2. the standing computed from the address instead of the database role
//   3. the ROLE SEAM narrowed so a child can no longer read his own role —
//      which would send every child back down the allowlist fallback path and
//      silently make him a governor again. That one is the quiet one.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const SHELL = join(ROOT, 'app', 'src', 'poe-financial-mvp-v28.jsx');
const SEAM = join(ROOT, 'infra', 'supabase', 'migrations-auto', '0130-assistant-provisioning-and-office-workspace.sql');

const shellSrc = () => readFileSync(SHELL, 'utf8');
const seamSql = () => readFileSync(SEAM, 'utf8');

// Every `isGovernor` binding in the shell, as written. Covers both the JSX prop
// form (isGovernor={...}) and the object-literal form (isGovernor: ...).
function governorBindings(src) {
  const out = [];
  const rx = /isGovernor\s*(?:=\{|:\s)([^,}\n]{0,120})/g;
  let m;
  while ((m = rx.exec(src)) !== null) {
    out.push({ index: m.index, expr: m[1].trim() });
  }
  return out;
}

// The scanner: an isGovernor binding may not be derived from an email address.
// `isGov` — the shell's single role-derived term — is the sanctioned one; a tier
// or local-dev clause beside it is fine, those are not addresses.
// `isFamilyMember` IS the allowlist under another name, so it is rejected in
// this position even though it stays legitimate for membership.
function scanGovernorWiring(src) {
  const problems = [];
  const bindings = governorBindings(src);
  if (!bindings.length) problems.push('no isGovernor binding found at all — the scanner is checking nothing');

  for (const b of bindings) {
    if (/isFamilyEmail\s*\(/.test(b.expr)) {
      problems.push(`an isGovernor binding reads the email allowlist directly: ${b.expr}`);
    }
    if (/\bisFamilyMember\b/.test(b.expr)) {
      problems.push(`an isGovernor binding reads isFamilyMember (the allowlist under another name): ${b.expr}`);
    }
    if (!/\bisGov\b/.test(b.expr)) {
      problems.push(`an isGovernor binding names no role-derived term: ${b.expr}`);
    }
  }

  // `isGov` itself must be the composed rule, fed the DATABASE role, with the
  // allowlist only ever in the `allowlisted:` fallback position.
  if (!/import\s*\{[^}]*\bgovernsHere\b[^}]*\}\s*from\s*'\.\/lib\/instance-role\.js'/.test(src)) {
    problems.push('the shell does not import governsHere from the role seam');
  }
  const decl = src.match(/const isGov = governsHere\(\{[^}]*\}\)/);
  if (!decl) {
    problems.push('the shell does not derive isGov from governsHere');
  } else {
    if (!/role:\s*instanceRoleState\.role/.test(decl[0])) {
      problems.push(`isGov does not take its role from the database read: ${decl[0]}`);
    }
    if (!/allowlisted:/.test(decl[0])) {
      problems.push('isGov does not pass the allowlist in the fallback position');
    }
    if (!/reviewerMode/.test(decl[0])) {
      problems.push('isGov does not pass reviewerMode, so the preview lens could govern');
    }
    if (!/signedIn:/.test(decl[0])) {
      problems.push('isGov does not pass the session, so a visitor could govern');
    }
  }

  return { ok: problems.length === 0, problems };
}

describe('no Governor affordance in the shell is bound to an email address', () => {
  it('the real shell passes', () => {
    const { ok, problems } = scanGovernorWiring(shellSrc());
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it('it is checking something: the shell really has several isGovernor bindings', () => {
    // A scanner over an empty set passes vacuously. This pins the population.
    expect(governorBindings(shellSrc()).length).toBeGreaterThanOrEqual(8);
  });

  it('CATCHES the exact pre-wiring form (isFamilyEmail in an isGovernor slot)', () => {
    const old = shellSrc().replace(
      'isGovernor: isGov',
      'isGovernor: !!authSession && !reviewerMode && isFamilyEmail(authSession.user?.email)'
    );
    const { ok, problems } = scanGovernorWiring(old);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/reads the email allowlist directly/);
  });

  it('CATCHES the allowlist under its other name (isFamilyMember)', () => {
    const old = shellSrc().replace('isGovernor={isGov}', 'isGovernor={isFamilyMember}');
    const { ok, problems } = scanGovernorWiring(old);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/isFamilyMember \(the allowlist under another name\)/);
  });

  it('CATCHES isGov being computed from the address instead of the role', () => {
    const old = shellSrc().replace(
      /const isGov = governsHere\(\{[^}]*\}\)/,
      'const isGov = governsHere({ signedIn: !!authSession, reviewerMode, allowlisted: isFamilyMember })'
    );
    const { ok, problems } = scanGovernorWiring(old);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/does not take its role from the database read/);
  });

  it('CATCHES the reviewer lens being dropped from the rule', () => {
    const old = shellSrc().replace(
      /const isGov = governsHere\(\{[^}]*\}\)/,
      'const isGov = governsHere({ signedIn: !!authSession, allowlisted: isFamilyMember, role: instanceRoleState.role })'
    );
    expect(scanGovernorWiring(old).problems.join(' ')).toMatch(/does not pass reviewerMode/);
  });

  it('CATCHES the import being dropped', () => {
    const old = shellSrc().replace(/import \{ useInstanceRole, governsHere \}[^\n]*\n/, '');
    expect(scanGovernorWiring(old).problems.join(' ')).toMatch(/does not import governsHere/);
  });
});

describe('the role seam serves EVERY role — narrowing it would re-open the hole', () => {
  // my_default_instance_role() is how a signed-in person learns their own role.
  // list_my_admin_instances() (0112/0221) is admin-scoped and CANNOT serve a
  // child; if the shell's seam were ever narrowed the same way, a child's role
  // would read as null, the standing would fall back to the allowlist, and he
  // would be a governor again — with nothing failing. Hence this gate.
  const fn = () => {
    const sql = seamSql();
    const at = sql.indexOf('FUNCTION public.my_default_instance_role()');
    expect(at, 'my_default_instance_role must exist in 0130').toBeGreaterThan(-1);
    const end = sql.indexOf('$$;', at);
    return sql.slice(at, end);
  };

  it('has no role filter at all', () => {
    expect(fn()).not.toMatch(/im\.role\s+(not\s+)?in\s*\(/i);
  });

  it('selects the caller own role for the caller own membership', () => {
    const body = fn();
    expect(body).toMatch(/'role',\s*im\.role/);
    expect(body).toMatch(/im\.user_id = auth\.uid\(\)/);
  });

  it('is executable by any authenticated person, not only an admin', () => {
    expect(seamSql()).toMatch(/GRANT EXECUTE ON FUNCTION public\.my_default_instance_role\(\) TO authenticated/);
  });

  it('CATCHES the admin-only narrowing (the 0112 shape applied to this seam)', () => {
    const narrowed = seamSql().replace(
      "WHERE im.user_id = auth.uid() AND i.instance_type <> 'church'\n      ORDER BY CASE WHEN i.instance_type = 'family'",
      "WHERE im.user_id = auth.uid() AND i.instance_type <> 'church' AND im.role IN ('owner','admin')\n      ORDER BY CASE WHEN i.instance_type = 'family'"
    );
    expect(narrowed).not.toBe(seamSql());   // the replacement really landed
    const at = narrowed.indexOf('FUNCTION public.my_default_instance_role()');
    const body = narrowed.slice(at, narrowed.indexOf('$$;', at));
    expect(body).toMatch(/im\.role\s+in\s*\(/i);   // which the gate above rejects
  });

  it('and the admin-scoped RPC is still admin-scoped, so the two are not confused', () => {
    // Stated as a fact of the tree, not a recollection: this is WHY the shell
    // reads my_default_instance_role and not list_my_admin_instances.
    const sql = readFileSync(join(ROOT, 'infra', 'supabase', 'migrations-auto',
      '0221-the-space-picker-can-name-the-door-it-belongs-to.sql'), 'utf8');
    expect(sql).toMatch(/im\.role IN \('owner','admin'\)/);
  });
});

describe('what the wiring deliberately leaves alone', () => {
  it('membership and seed data still come from the address — by decision, not oversight', () => {
    // DR-1106: an email CAN make you a member. isFamilyMember still gates which
    // tabs render and which world seeds; the database is the wall behind them.
    // If this ever becomes a problem it will be a new decision, not a silent
    // drift, so the current state is pinned rather than assumed.
    const src = shellSrc();
    expect(src).toMatch(/const isFamilyMember = !reviewerMode && isFamilyEmail\(/);
    expect(src).toMatch(/navItems\(\{[^)]*isFamilyMember/);
  });

  it('the Admin nav tab and the Admin console read the SAME role-derived flag', () => {
    // Otherwise a child sees a tab that opens onto a locked panel — the painted
    // empty tab the shell's own assistant-scope comment exists to avoid.
    const src = shellSrc();
    expect(src).toMatch(/navItems\(\{[^)]*isGovernor: isGov/);
    expect(src).toMatch(/isGovernor=\{!reviewerMode && \(isGov \|\| \(!isPublicHost\(\) && !authSession\)\)\}/);
    const nav = readFileSync(join(ROOT, 'app', 'src', 'lib', 'nav-items.jsx'), 'utf8');
    expect(nav).toMatch(/!reviewerMode && \(isGovernor \|\| \(!isPublicHost\(\) && !authSession\)\)/);
    // and nav-items still defaults to the allowlist for callers that do not
    // pass it, so this change could not quietly hide Admin somewhere else.
    expect(nav).toMatch(/isGovernor = isFamilyMember,/);
  });
});
