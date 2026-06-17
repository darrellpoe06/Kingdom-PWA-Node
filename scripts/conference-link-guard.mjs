// =============================================================================
// conference-link-guard — deterministic link-safety / no-leak gate for the
// conference registration -> optional account on-ramp (0027 + 0032).
// DR-0076: prove it, don't claim it. DR-0060: proven-to-catch.
// =============================================================================
// The funnel links a public conference registration to a PoeTech account WITHOUT
// opening any new read surface on the roll. This guard reads the migration SQL and
// PROVES, structurally, that:
//
//   1. linked_user_id was added to conference_public_registrations.
//   2. claim_conference_registration is SECURITY DEFINER, sets linked_user_id to
//      auth.uid() (the CALLER — never a client value), only touches UNCLAIMED rows
//      (linked_user_id IS NULL — never hijacks), and is NOT executable by anon.
//   3. get_my_conference_registrations is SECURITY DEFINER, filters strictly to
//      auth.uid() (never returns the roll), and is NOT executable by anon.
//   4. The TABLE itself gains NO new anon read/write: no policy grants anon
//      SELECT/UPDATE/DELETE, no SELECT USING (true), and an owner/admin-scoped
//      SELECT still gates the roll.
//
// A break in any of these FAILS the build instead of waiting for a live session to
// notice. Complements conference-rls-guard (0023/0024 tables) + tenancy-guard.
//
// Deterministic, $0, no-LLM. Importable (scanConferenceLink) so a vitest gates
// merges inside the required `app — lint + vitest` check.
//   CLI report: node scripts/conference-link-guard.mjs
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = [
  join(ROOT, 'infra/supabase/migrations-auto/0027-conference-public-registration.sql'),
  join(ROOT, 'infra/supabase/migrations-auto/0032-conference-registration-account-link.sql'),
];

export const REG_TABLE = 'conference_public_registrations';

const stripComments = (s) => s.replace(/--[^\n]*/g, '');

const SELF_SCOPE = /linked_user_id\s*=\s*auth\.uid\s*\(\s*\)/i;        // sets/filters to the caller
const UNCLAIMED  = /linked_user_id\s+IS\s+NULL/i;                       // unclaimed-only
const DEFINER    = /SECURITY\s+DEFINER/i;
const TRUE_PRED  = /^\s*true\s*$/i;
const OWNER_ADMIN = /user_role_in_instance\s*\(\s*instance_id\s*\)\s+IN\s*\(\s*'owner'\s*,\s*'admin'\s*\)/i;

// Slice the text belonging to one CREATE [OR REPLACE] FUNCTION public.<name>:
// from its header to the next CREATE ... FUNCTION, a DELETE statement, or the end.
// The function's own REVOKE/GRANT lines sit inside this slice.
function functionSlice(sql, name) {
  const re = new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+(?:public\\.)?${name}\\b`, 'i');
  const m = re.exec(sql);
  if (!m) return null;
  const start = m.index;
  const rest = sql.slice(start + m[0].length);
  const nextRe = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b|DELETE\s+FROM\b/i;
  const nm = nextRe.exec(rest);
  const end = nm ? start + m[0].length + nm.index : sql.length;
  return sql.slice(start, end);
}

// Within a function slice, is EXECUTE reachable by anon? (granted to anon, or not
// revoked from PUBLIC while still default-granted). We require: NOT granted to anon
// AND revoked from PUBLIC AND granted to authenticated.
function execAnonSafe(slice) {
  const grantsAnon = /GRANT\s+EXECUTE[^;]*\bTO\b[^;]*\banon\b/i.test(slice);
  const revokesPublic = /REVOKE\s+(?:ALL|EXECUTE)[^;]*\bFROM\b[^;]*\bPUBLIC\b/i.test(slice);
  const grantsAuthed = /GRANT\s+EXECUTE[^;]*\bTO\b[^;]*\bauthenticated\b/i.test(slice);
  return { ok: !grantsAnon && revokesPublic && grantsAuthed, grantsAnon, revokesPublic, grantsAuthed };
}

// Minimal CREATE POLICY parser (cmd + roles + using/check), reused shape from
// conference-rls-guard. Roles come from the TO clause.
function extractParen(body, keyword, from = 0) {
  const kw = body.toUpperCase().indexOf(keyword.toUpperCase(), from);
  if (kw === -1) return null;
  let i = body.indexOf('(', kw + keyword.length);
  if (i === -1) return null;
  let depth = 0, inStr = false; const startP = i;
  for (; i < body.length; i++) {
    const c = body[i];
    if (inStr) { if (c === "'") inStr = false; continue; }
    if (c === "'") { inStr = true; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return body.slice(startP + 1, i).trim(); }
  }
  return null;
}

function parsePolicy(stmt) {
  const head = stmt.match(/CREATE\s+POLICY\s+([a-zA-Z_][\w]*)\s+ON\s+(?:public\.)?([a-zA-Z_][\w]*)/i);
  if (!head) return null;
  const cmdM = stmt.match(/\bFOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\b/i);
  const cmd = (cmdM ? cmdM[1] : 'ALL').toUpperCase();
  // The TO clause lists roles; capture up to the next clause keyword.
  const toM = stmt.match(/\bTO\s+([\s\S]*?)(?:\bUSING\b|\bWITH\s+CHECK\b|;)/i);
  const roles = toM ? toM[1].split(',').map((r) => r.trim().toLowerCase()).filter(Boolean) : [];
  return {
    name: head[1].toLowerCase(),
    table: head[2].toLowerCase(),
    cmd,
    roles,
    using: extractParen(stmt, 'USING'),
    check: extractParen(stmt, 'WITH CHECK'),
  };
}

export function scanConferenceLink(sqlOverride = null) {
  const problems = [];
  let sql = sqlOverride;
  if (sql == null) {
    const present = MIGRATIONS.filter((m) => existsSync(m));
    if (present.length === 0) {
      return { ok: false, problems: [`no conference migrations found: ${MIGRATIONS.join(', ')}`], policyCount: 0 };
    }
    sql = present.map((m) => readFileSync(m, 'utf8')).join('\n');
  }
  const clean = stripComments(sql);

  // 1. linked_user_id column added.
  if (!/ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?linked_user_id\b/i.test(clean)) {
    problems.push('linked_user_id column not added to conference_public_registrations');
  }

  // 2. claim_conference_registration — self-scoped, unclaimed-only, definer, no anon.
  const claim = functionSlice(clean, 'claim_conference_registration');
  if (!claim) {
    problems.push('claim_conference_registration function not found');
  } else {
    if (!DEFINER.test(claim)) problems.push('claim_conference_registration must be SECURITY DEFINER');
    if (!SELF_SCOPE.test(claim)) problems.push('claim must set linked_user_id = auth.uid() (the caller) — never a client value');
    if (!UNCLAIMED.test(claim)) problems.push('claim must restrict to linked_user_id IS NULL (unclaimed-only — never hijack a claimed row)');
    const ex = execAnonSafe(claim);
    if (!ex.ok) problems.push(`claim EXECUTE must be revoked from PUBLIC + granted to authenticated only (anon-reachable: ${ex.grantsAnon}, revokesPublic: ${ex.revokesPublic}, grantsAuthed: ${ex.grantsAuthed})`);
  }

  // 3. get_my_conference_registrations — auth.uid()-filtered, definer, no anon.
  const getMy = functionSlice(clean, 'get_my_conference_registrations');
  if (!getMy) {
    problems.push('get_my_conference_registrations function not found');
  } else {
    if (!DEFINER.test(getMy)) problems.push('get_my_conference_registrations must be SECURITY DEFINER');
    if (!SELF_SCOPE.test(getMy)) problems.push('get_my must filter WHERE linked_user_id = auth.uid() (never the whole roll)');
    const ex = execAnonSafe(getMy);
    if (!ex.ok) problems.push(`get_my EXECUTE must be revoked from PUBLIC + granted to authenticated only (anon-reachable: ${ex.grantsAnon}, revokesPublic: ${ex.revokesPublic}, grantsAuthed: ${ex.grantsAuthed})`);
  }

  // 4. Table policies: no new anon read/write, no SELECT USING (true), roll still
  //    owner/admin-scoped.
  const policies = [];
  const polRe = /CREATE\s+POLICY[\s\S]*?;/gi;
  let m;
  while ((m = polRe.exec(clean)) !== null) {
    const p = parsePolicy(m[0]);
    if (p && p.table === REG_TABLE) policies.push(p);
  }
  let hasOwnerAdminSelect = false;
  for (const p of policies) {
    const where = `${p.table}.${p.name} (FOR ${p.cmd})`;
    const anon = p.roles.includes('anon');
    if (['SELECT', 'UPDATE', 'DELETE'].includes(p.cmd) && anon) {
      problems.push(`${where}: grants anon ${p.cmd} on the roll (LEAK) — anon must stay INSERT-only`);
    }
    if (p.cmd === 'SELECT') {
      if (p.using && TRUE_PRED.test(p.using)) problems.push(`${where}: SELECT USING (true) — exposes the whole roll (LEAK)`);
      if (p.using && OWNER_ADMIN.test(p.using)) hasOwnerAdminSelect = true;
    }
  }
  if (policies.length && !hasOwnerAdminSelect) {
    problems.push(`${REG_TABLE}: no owner/admin-scoped SELECT policy found — the roll read must stay owner/admin-only`);
  }

  return { ok: problems.length === 0, problems, policyCount: policies.length };
}

// --- CLI ---------------------------------------------------------------------
function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}
if (isMain()) {
  const { ok, problems, policyCount } = scanConferenceLink();
  console.log('# CONFERENCE LINK GUARD (registration -> account on-ramp, no-leak)\n');
  console.log(`Registration-table policies checked: ${policyCount}\n`);
  if (ok) {
    console.log('PASS — link is self-scoped + unclaimed-only; no new anon read/write on the roll.');
    process.exit(0);
  }
  console.log('FAIL — link/leak risk:');
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
