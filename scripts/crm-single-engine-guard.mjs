// @vitest-environment node
//
// ONE-CRM structure guard (DR-0080 / principle ONE-CRM, DR-0076 proven-to-catch).
//
// Binding rule, declared by Darrell 2026-06-24 ("always"): there is ONE shared
// sovereign CRM backbone, and EVERY acquisition funnel + EVERY business/tenant
// (current and future) rides it via per-business CONFIG — never a per-business
// fork. A new funnel adds a PIPELINE to lib/crm-engine.js and captures through
// the crm_capture_lead() RPC; it does NOT create a second CRM / a new leads
// table / a parallel engine.
//
// This guard makes that un-forkable in CI. It FAILS the build when:
//   1. a NEW lead/CRM/pipeline TABLE appears in a migration that is not the
//      sanctioned backbone (crm_leads/crm_activities) or an explicitly
//      allowlisted, declared non-CRM/grandfathered exception — so a fork needs a
//      conscious allowlist edit + a stated reason, which is the friction we want;
//   2. the backbone itself goes missing (the engine registry or the capture
//      RPC) — so the guard can never pass vacuously.
//
// Both the table scan and the presence checks are exported pure so a test can
// prove the guard CATCHES a fork (a fake `marketing_leads` table) and PASSES on
// the real tree.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = join(ROOT, 'infra/supabase/migrations-auto');
const ENGINE = join(ROOT, 'app/src/lib/crm-engine.js');

// The sanctioned backbone tables — the ONE CRM. New funnels do NOT add to this.
export const BACKBONE_TABLES = ['crm_leads', 'crm_activities'];

// Explicitly-declared exceptions. Each MUST carry a reason. Two kinds:
//   - grandfathered: a pre-existing lead table that federates INTO the backbone
//     read-side (not a fork) and is slated to converge — never grow this set;
//   - non-crm: a table whose name trips the CRM/lead pattern but is unrelated to
//     acquisition CRM (e.g. a "lead vocalist" part). Add here with a reason
//     instead of weakening the pattern.
export const ALLOWLIST = {
  practice_leads: 'grandfathered — TLC client-acquisition leads; federated read-side via leadFromPracticeAcquisition(), slated to converge into crm_leads (DR-0080).',
  choir_song_leads: 'non-crm — a song\'s lead vocal part, not an acquisition lead.',
  inquiries: 'grandfathered — TLC pre-intake inquiries; federated read-side via leadFromInquiry(), not a separate CRM engine.',
};

// A table name "looks like" an acquisition-CRM table when it carries CRM / lead /
// pipeline / funnel / prospect / subscriber-CRM semantics. Deliberately broad so
// a fork can't sneak in under a creative name; false positives are handled by an
// explicit, reasoned ALLOWLIST entry (that friction is the point).
export function looksLikeCrmTable(name) {
  return /(^crm)|(_crm$)|(^leads$)|(_leads$)|(^pipeline)|(_pipeline$)|(^funnel)|(_funnel$)|(^prospects?$)|(_prospects?$)/i.test(name);
}

// Extract every `CREATE TABLE [IF NOT EXISTS] <name>` table name from a SQL blob.
export function tablesInSql(sql) {
  const out = [];
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z_][a-z0-9_]*)/gi;
  let m;
  while ((m = re.exec(sql)) !== null) out.push(m[1].toLowerCase());
  return out;
}

// The core decision, pure + unit-testable: given the set of declared table names,
// return the forks (CRM-looking tables that are neither backbone nor allowlisted).
export function forkViolations(tableNames) {
  const seen = new Set();
  const violations = [];
  for (const name of tableNames) {
    if (seen.has(name)) continue;
    seen.add(name);
    if (!looksLikeCrmTable(name)) continue;
    if (BACKBONE_TABLES.includes(name)) continue;
    if (Object.prototype.hasOwnProperty.call(ALLOWLIST, name)) continue;
    violations.push(name);
  }
  return violations;
}

function allMigrationSql() {
  let sql = '';
  for (const f of readdirSync(MIGRATIONS)) {
    if (f.endsWith('.sql')) sql += '\n' + readFileSync(join(MIGRATIONS, f), 'utf8');
  }
  return sql;
}

export function scan() {
  const sql = allMigrationSql();
  const tables = tablesInSql(sql);
  const violations = forkViolations(tables);

  // Presence checks — the backbone must exist, so the guard never passes vacuously.
  let engineSrc = '';
  try { engineSrc = readFileSync(ENGINE, 'utf8'); } catch { /* missing */ }
  const enginePresent = /export\s+const\s+PIPELINES\s*=/.test(engineSrc) && /export\s+const\s+BUSINESSES\s*=/.test(engineSrc);
  const capturePresent = /create\s+(or\s+replace\s+)?function\s+public\.crm_capture_lead/i.test(sql);
  const backbonePresent = BACKBONE_TABLES.every((t) => tables.includes(t));

  return { tables, violations, enginePresent, capturePresent, backbonePresent };
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { tables, violations, enginePresent, capturePresent, backbonePresent } = scan();
  console.log('# ONE-CRM STRUCTURE GUARD (DR-0080)\n');
  console.log(`Migration tables scanned: ${tables.length}\n`);
  let ok = true;
  if (violations.length) {
    ok = false;
    console.log(`FAIL — ${violations.length} table(s) look like a SECOND CRM / forked leads store:`);
    violations.forEach((v) => console.log(`      · ${v}`));
    console.log('\n  The CRM is ONE shared backbone (crm_leads). To add a funnel/business:');
    console.log('    1) add a PIPELINE config to app/src/lib/crm-engine.js (PIPELINES),');
    console.log('    2) capture through the crm_capture_lead() RPC,');
    console.log('    3) federate any pre-existing table read-side via an adapter.');
    console.log('  If a flagged table is genuinely NOT an acquisition CRM, add it to');
    console.log('  ALLOWLIST in this guard WITH a one-line reason (DR-0080 / ONE-CRM).');
  }
  if (!enginePresent) { ok = false; console.log('FAIL — the shared engine (lib/crm-engine.js PIPELINES/BUSINESSES) is missing.'); }
  if (!capturePresent) { ok = false; console.log('FAIL — the crm_capture_lead() API seam is missing from migrations.'); }
  if (!backbonePresent) { ok = false; console.log(`FAIL — backbone tables missing (need: ${BACKBONE_TABLES.join(', ')}).`); }
  if (ok) {
    console.log('PASS — one shared CRM backbone; no forked CRM/leads table; engine + capture seam present.');
    process.exit(0);
  }
  process.exit(1);
}
