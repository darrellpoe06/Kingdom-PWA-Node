// =============================================================================
// tenancy-guard — deterministic data-isolation gate (DR-0059 follow-on)
// =============================================================================
// The family-data exposure we keep re-discovering is a class of bug a human
// with full context would catch by reflex. This encodes that reflex as a gate
// so it never again depends on a given session noticing. Two checks, the two
// exposure classes seen so far:
//
//   A. RLS COVERAGE — every table whose CREATE TABLE declares an `instance_id`
//      column is tenant-scoped and MUST have ROW LEVEL SECURITY enabled. A
//      table without it is readable across every tenant.
//
//   B. PROVISIONING — the active join_default_instance() (the single RPC every
//      sync funnels through) must NOT hand a stranger membership in the shared
//      poe-family instance. Concretely: the family email allowlist must be
//      present, and the poe-family lookup must sit BEHIND that allowlist gate.
//      (This is the exact hole 0001/0002 closed; the guard keeps it closed.)
//
// Deterministic, $0, no-LLM. Importable (scanTenancy / checkProvisioning) so a
// vitest test can gate merges from inside the required `app — lint + vitest`
// check. Run directly for the CLI report: node scripts/tenancy-guard.mjs
// =============================================================================
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve everything against the repo root (scripts/ lives at <root>/scripts),
// so the guard works regardless of the caller's cwd (CLI from root, vitest
// from app/).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_DIR = join(ROOT, 'infra/supabase');
const MIGRATIONS_DIR = join(ROOT, 'infra/supabase/migrations-auto');

// Tables that carry instance_id but are intentionally NOT RLS-gated must be
// listed here WITH a reason. Empty by design: an exception is a decision made
// visible, never a silent omission.
const RLS_EXCEPTIONS = {
  // 'table_name': 'why this is safe without RLS',
};

const FAMILY_ALLOWLIST = [
  'darrellpoe06@gmail.com',
  'mrspoe06@gmail.com',
  'christina@tlctherapysolutions.com',
];

function readSql(dir) {
  if (!existsSync(dir)) return '';
  let out = '';
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.sql') && statSync(join(dir, f)).isFile()) {
      out += '\n' + readFileSync(join(dir, f), 'utf8');
    }
  }
  return out;
}

const stripComments = (s) => s.replace(/--[^\n]*/g, '');

// --- Check A: RLS coverage -------------------------------------------------
export function scanTenancy() {
  const sql = stripComments(readSql(SCHEMA_DIR) + readSql(MIGRATIONS_DIR));

  const tableScoped = new Set();
  const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["']?([a-zA-Z_][a-zA-Z0-9_]*)["']?\s*\(([\s\S]*?)\n\s*\)\s*;/gi;
  let m;
  while ((m = createRe.exec(sql)) !== null) {
    if (/\binstance_id\b/.test(m[2])) tableScoped.add(m[1].toLowerCase());
  }

  const rlsOn = new Set();
  const rlsRe = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?(?:public\.)?["']?([a-zA-Z_][a-zA-Z0-9_]*)["']?\s+(?:ENABLE|FORCE)\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((m = rlsRe.exec(sql)) !== null) rlsOn.add(m[1].toLowerCase());

  const missing = [...tableScoped]
    .filter(t => !rlsOn.has(t) && !(t in RLS_EXCEPTIONS))
    .sort();

  return { tableScoped, rlsOn, missing };
}

// --- Check B: provisioning isolation --------------------------------------
// Returns { ok, problems[], file } for the EFFECTIVE join_default_instance —
// the last migration (by filename order, which is how the lane applies them)
// that defines the function.
export function checkProvisioning() {
  const problems = [];
  if (!existsSync(MIGRATIONS_DIR)) {
    return { ok: true, problems: ['no migrations-auto dir (nothing to check)'], file: null };
  }
  const defining = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .filter(f => /FUNCTION\s+public\.join_default_instance/i.test(readFileSync(join(MIGRATIONS_DIR, f), 'utf8')));

  if (defining.length === 0) {
    // The base definition lives in schema-v2.1; no migration override. The
    // guard only governs overrides, so nothing to assert here.
    return { ok: true, problems: ['no migration overrides join_default_instance'], file: null };
  }

  const file = defining[defining.length - 1];
  const body = stripComments(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'));

  // The family allowlist must be intact (removing it reopens the open-join hole).
  for (const email of FAMILY_ALLOWLIST) {
    if (!body.includes(email)) problems.push(`allowlist email missing: ${email}`);
  }

  // The poe-family membership grant must sit BEHIND the allowlist gate: the
  // first allowlist email must appear before the first 'poe-family' reference.
  const firstAllow = body.indexOf(FAMILY_ALLOWLIST[0]);
  const firstPoeFam = body.indexOf("'poe-family'");
  if (firstPoeFam !== -1 && (firstAllow === -1 || firstAllow > firstPoeFam)) {
    problems.push("poe-family instance is referenced before the email allowlist gate (open-join risk)");
  }

  return { ok: problems.length === 0, problems, file };
}

// --- Check C: identity gate (DR-0074) --------------------------------------
// Real family first names (and the family device-picker) must be gated on
// VERIFIED family membership (isFamilyEmail / isFamilyMember), never on the
// mere presence of a session (authSession). A signed-in NON-family user has an
// authSession too, so an authSession-only gate renders "Darrell"/"Christina"
// to an outsider — the 2026-06-14 parishioner incident. This catches the exact
// regression: a real-name literal in PROFILES selected by a condition that
// doesn't reference family membership. Pass a string to test the catch without
// touching the real file (anti-theater proof, DR-0060).
const MONOLITH = join(ROOT, 'app/src/poe-financial-mvp-v28.jsx');
const REAL_FAMILY_NAMES = ['Darrell', 'Christina'];
const MEMBERSHIP_RE = /isFamilyEmail|isFamilyMember/;

export function checkIdentityGate(srcOverride = null) {
  const problems = [];
  const src = srcOverride != null
    ? srcOverride
    : (existsSync(MONOLITH) ? readFileSync(MONOLITH, 'utf8') : null);
  if (src == null) {
    return { ok: true, problems: ['monolith not found (nothing to check)'], names: [] };
  }

  // Isolate the PROFILES array — the surface that renders selectable identities.
  const block = src.match(/const\s+PROFILES\s*=\s*\[([\s\S]*?)\n\s*\];/);
  if (!block) {
    return { ok: false, problems: ['could not locate the PROFILES array — identity guard is stale, re-anchor it'], names: [] };
  }
  const body = block[1];

  // Non-vacuous: the real names must appear in PROFILES, or the guard is
  // matching the wrong thing (names renamed/moved — re-anchor it).
  const namesFound = REAL_FAMILY_NAMES.filter(n => new RegExp(`['"]${n}['"]`).test(body));
  if (namesFound.length === 0) {
    return { ok: false, problems: ['no real family names found in PROFILES — identity guard is stale, re-anchor it'], names: [] };
  }

  // Every real-name literal must be chosen by a condition that references
  // family MEMBERSHIP — never bare session presence, never ungated.
  for (const line of body.split('\n')) {
    if (!REAL_FAMILY_NAMES.some(n => new RegExp(`['"]${n}['"]`).test(line))) continue;
    const cond = (line.match(/name:\s*([^?]*?)\s*\?/) || [, ''])[1];
    if (!MEMBERSHIP_RE.test(cond)) {
      problems.push(`real family name not gated on family membership (DR-0074): ${line.trim()}`);
    }
  }

  // Integrity: a membership identifier used to gate the names must itself be
  // derived from isFamilyEmail, so it can't be hollowed to `= !!authSession`.
  if (/isFamilyMember/.test(body)) {
    const def = src.match(/const\s+isFamilyMember\s*=\s*([^\n;]*)/);
    if (!def) {
      problems.push('PROFILES gates on isFamilyMember but its definition was not found');
    } else if (!/isFamilyEmail/.test(def[1])) {
      problems.push(`isFamilyMember must be derived from isFamilyEmail; found: const isFamilyMember = ${def[1].trim()}`);
    }
  }

  return { ok: problems.length === 0, problems, names: namesFound };
}

// --- CLI -------------------------------------------------------------------
function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}

if (isMain()) {
  const { tableScoped, rlsOn, missing } = scanTenancy();
  const prov = checkProvisioning();
  const ident = checkIdentityGate();

  console.log('# TENANCY GUARD (deterministic data-isolation gate)\n');
  console.log('## A. RLS coverage');
  console.log(`Instance-scoped tables (declare instance_id): ${tableScoped.size}`);
  console.log(`Tables with RLS enabled:                      ${rlsOn.size}`);
  if (missing.length === 0) {
    console.log('PASS — every instance-scoped table has Row-Level Security.\n');
  } else {
    console.log(`FAIL — ${missing.length} instance-scoped table(s) WITHOUT RLS (cross-tenant readable):`);
    missing.forEach(t => console.log(`  - ${t}`));
    console.log('');
  }

  console.log('## B. Provisioning isolation');
  console.log(`Effective join_default_instance override: ${prov.file || '(none — base definition only)'}`);
  if (prov.ok) {
    console.log('PASS — family allowlist intact; poe-family grant is behind the gate.\n');
  } else {
    console.log('FAIL — provisioning can over-grant:');
    prov.problems.forEach(p => console.log(`  - ${p}`));
    console.log('');
  }

  console.log('## C. Identity gating (DR-0074)');
  console.log(`Real family names checked in PROFILES: ${ident.names.join(', ') || '(none found)'}`);
  if (ident.ok) {
    console.log('PASS — real family names render only to verified family membership.\n');
  } else {
    console.log('FAIL — identity can leak to a non-family session:');
    ident.problems.forEach(p => console.log(`  - ${p}`));
    console.log('');
  }

  const failed = missing.length > 0 || !prov.ok || !ident.ok;
  console.log(failed ? 'TENANCY GUARD: FAIL' : 'TENANCY GUARD: PASS');
  process.exit(failed ? 1 : 0);
}
