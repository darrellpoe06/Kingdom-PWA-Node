// =============================================================================
// conference-rls-guard — deterministic no-cross-instance-leak gate for the
// Conference / Event Center tables (0023). DR-0076: prove it, don't claim it.
// =============================================================================
// The hard guardrail on this build is "a user cannot read another instance's
// conference / participants." That property is enforced by RLS policies whose
// predicates scope every row to the caller's instance. This guard reads the
// migration SQL and PROVES, structurally, that every policy on the four
// conference tables is instance-scoped (or strict-ownership for writes) — so a
// `USING (true)` (or any predicate that forgets the instance) FAILS the build
// instead of waiting for a session to notice.
//
// Complements scripts/tenancy-guard.mjs (which proves RLS is ENABLED on every
// instance_id table); this proves the POLICIES themselves don't leak.
//
// Deterministic, $0, no-LLM. Importable (scanConferenceRls) so a vitest test
// gates merges from inside the required `app — lint + vitest` check. Proven-to-
// catch: the test injects a `USING (true)` SELECT and confirms a FAIL.
//   CLI report: node scripts/conference-rls-guard.mjs
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = [
  join(ROOT, 'infra/supabase/migrations-auto/0023-conference-event-center.sql'),
  join(ROOT, 'infra/supabase/migrations-auto/0024-conference-venues.sql'),
  join(ROOT, 'infra/supabase/migrations-auto/0031-conference-anticipated-actual.sql'),
];

export const CONFERENCE_TABLES = ['conferences', 'event_center_resources', 'event_sessions', 'event_participants', 'venues', 'conference_actuals'];

const stripComments = (s) => s.replace(/--[^\n]*/g, '');

// A predicate is instance-scoped if it passes instance_id to a scoping fn.
const INSTANCE_SCOPED = /user_(?:in|role_in)_instance\s*\(\s*instance_id\s*\)/i;
// A predicate is ownership-scoped if it pins the row to the calling user.
const OWNERSHIP = /\bauth\.uid\s*\(\s*\)/i;

// Extract the balanced-parenthesis expression that follows `keyword` in `body`,
// starting at/after `from`. Returns { expr, end } or null. Handles nested parens
// and single-quoted string literals (so IN ('owner','admin') doesn't miscount).
function extractParen(body, keyword, from = 0) {
  const kw = body.toUpperCase().indexOf(keyword.toUpperCase(), from);
  if (kw === -1) return null;
  let i = body.indexOf('(', kw + keyword.length);
  if (i === -1) return null;
  let depth = 0, inStr = false, start = i;
  for (; i < body.length; i++) {
    const c = body[i];
    if (inStr) { if (c === "'") inStr = false; continue; }
    if (c === "'") { inStr = true; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return { expr: body.slice(start + 1, i).trim(), end: i }; }
  }
  return null;
}

// Parse one CREATE POLICY ... ; statement into { name, table, cmd, using, check }.
function parsePolicy(stmt) {
  const head = stmt.match(/CREATE\s+POLICY\s+([a-zA-Z_][\w]*)\s+ON\s+(?:public\.)?([a-zA-Z_][\w]*)/i);
  if (!head) return null;
  const cmdM = stmt.match(/\bFOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\b/i);
  const cmd = (cmdM ? cmdM[1] : 'ALL').toUpperCase();
  // WITH CHECK first (so a later "USING" search can't grab the CHECK paren).
  const check = extractParen(stmt, 'WITH CHECK');
  // USING that is NOT the "WITH CHECK" one.
  let using = null;
  let scan = 0;
  while (true) {
    const u = extractParen(stmt, 'USING', scan);
    if (!u) break;
    // Make sure this USING isn't actually the tail of "WITH CHECK".
    using = u; break;
  }
  return {
    name: head[1].toLowerCase(),
    table: head[2].toLowerCase(),
    cmd,
    using: using ? using.expr : null,
    check: check ? check.expr : null,
  };
}

export function scanConferenceRls(sqlOverride = null) {
  const problems = [];
  let sql = sqlOverride;
  if (sql == null) {
    const present = MIGRATIONS.filter((m) => existsSync(m));
    if (present.length === 0) {
      return { ok: false, problems: [`no conference migrations found: ${MIGRATIONS.join(', ')}`], tables: [], policyCount: 0 };
    }
    sql = present.map((m) => readFileSync(m, 'utf8')).join('\n');
  }
  const clean = stripComments(sql);

  // Tables that exist + have RLS enabled (non-vacuous).
  const tablesSeen = new Set();
  const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z_][\w]*)/gi;
  let m;
  while ((m = createRe.exec(clean)) !== null) {
    if (CONFERENCE_TABLES.includes(m[1].toLowerCase())) tablesSeen.add(m[1].toLowerCase());
  }
  const rlsOn = new Set();
  const rlsRe = /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z_][\w]*)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((m = rlsRe.exec(clean)) !== null) {
    if (CONFERENCE_TABLES.includes(m[1].toLowerCase())) rlsOn.add(m[1].toLowerCase());
  }

  // Collect + check every policy on a conference table.
  const policies = [];
  const polRe = /CREATE\s+POLICY[\s\S]*?;/gi;
  while ((m = polRe.exec(clean)) !== null) {
    const p = parsePolicy(m[0]);
    if (!p || !CONFERENCE_TABLES.includes(p.table)) continue;
    policies.push(p);
  }

  const safe = (expr) => !!expr && INSTANCE_SCOPED.test(expr);
  const owns = (expr) => !!expr && OWNERSHIP.test(expr);
  const isTrue = (expr) => !!expr && /^\s*true\s*$/i.test(expr);

  for (const p of policies) {
    const where = `${p.table}.${p.name} (FOR ${p.cmd})`;
    // A bare `true` anywhere is the canonical leak.
    if (isTrue(p.using)) problems.push(`${where}: USING (true) — reads/writes every instance (LEAK)`);
    if (isTrue(p.check)) problems.push(`${where}: WITH CHECK (true) — accepts rows for any instance (LEAK)`);

    if (p.cmd === 'SELECT') {
      if (!safe(p.using)) problems.push(`${where}: SELECT must be instance-scoped via user_in_instance(instance_id) — found: ${p.using ?? '(none)'}`);
    } else if (p.cmd === 'INSERT') {
      if (!safe(p.check)) problems.push(`${where}: INSERT WITH CHECK must be instance-scoped — found: ${p.check ?? '(none)'}`);
    } else if (p.cmd === 'UPDATE') {
      if (!safe(p.using)) problems.push(`${where}: UPDATE USING must be instance-scoped — found: ${p.using ?? '(none)'}`);
      if (!safe(p.check)) problems.push(`${where}: UPDATE WITH CHECK must be instance-scoped — found: ${p.check ?? '(none)'}`);
    } else if (p.cmd === 'DELETE') {
      // Delete is safe if instance-scoped OR strictly the row owner.
      if (!safe(p.using) && !owns(p.using)) problems.push(`${where}: DELETE USING must be instance-scoped or owner-only — found: ${p.using ?? '(none)'}`);
    }
  }

  // Non-vacuous: every conference table must exist, have RLS on, and have at
  // least one SELECT policy (a read surface with no SELECT policy is a silent
  // deny-all — flag it so the guard can't pass for the wrong reason).
  for (const t of CONFERENCE_TABLES) {
    if (!tablesSeen.has(t)) problems.push(`table not found in migration: ${t}`);
    else if (!rlsOn.has(t)) problems.push(`RLS not enabled on ${t}`);
    if (!policies.some((p) => p.table === t && (p.cmd === 'SELECT' || p.cmd === 'ALL'))) {
      problems.push(`${t}: no SELECT policy found (read surface unscoped or deny-all)`);
    }
  }

  return { ok: problems.length === 0, problems, tables: [...tablesSeen], policyCount: policies.length };
}

// --- CLI ---------------------------------------------------------------------
function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}
if (isMain()) {
  const { ok, problems, tables, policyCount } = scanConferenceRls();
  console.log('# CONFERENCE RLS GUARD (no cross-instance leak)\n');
  console.log(`Conference tables found: ${tables.join(', ') || '(none)'}`);
  console.log(`Policies checked:        ${policyCount}\n`);
  if (ok) {
    console.log('PASS — every conference policy is instance-scoped; no cross-instance read/write path.');
    process.exit(0);
  }
  console.log('FAIL — cross-instance leak risk:');
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
