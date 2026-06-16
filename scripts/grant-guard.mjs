// =============================================================================
// grant-guard — deterministic "authenticated can reach its tables" gate
// =============================================================================
// The 2026-06-16 Choir incident was a class of bug a human would catch by
// reflex: a table shipped with Row-Level Security + correct policies, but the
// `authenticated` role had NO table privilege, so every read/write 403'd with
// Postgres code 42501 ("permission denied for table ...") BEFORE RLS ever ran.
// This encodes the reflex as a gate so it can never again depend on a session
// noticing.
//
// THE PROPERTY: every instance-scoped table (one whose CREATE TABLE declares an
// `instance_id` column — the same set tenancy-guard governs for RLS) must be
// reachable by the `authenticated` role via a DML grant. A grant path is either:
//   - a blanket `GRANT ... ON ALL TABLES IN SCHEMA public TO ... authenticated`, or
//   - an explicit per-table `GRANT ... ON [public.]<table> TO ... authenticated`.
// AND, to be recurrence-proof, an `ALTER DEFAULT PRIVILEGES ... ON TABLES TO
// ... authenticated` must exist so FUTURE tables inherit the grant.
//
// Complements tenancy-guard (RLS is ENABLED) and conference-rls-guard (the
// POLICIES don't leak). Those two together mean: granting `authenticated`
// table access is leak-safe — RLS filters every row to the caller's instance.
// This guard proves the third leg: the grant is actually present.
//
// Deterministic, $0, no-LLM. Importable (scanGrants) so a vitest test gates
// merges from inside the required `app — lint + vitest` check. Proven-to-catch:
// the test feeds SQL that creates an instance table with no grant and confirms
// a FAIL. CLI report: node scripts/grant-guard.mjs
// =============================================================================
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_DIR = join(ROOT, 'infra/supabase');
const MIGRATIONS_DIR = join(ROOT, 'infra/supabase/migrations-auto');

// Instance-scoped tables intentionally NOT granted to authenticated must be
// listed here WITH a reason. Empty by design (an exception is a visible decision).
const GRANT_EXCEPTIONS = {
  // 'table_name': 'why authenticated is intentionally denied table access',
};

const stripComments = (s) => s.replace(/--[^\n]*/g, '');

function readSqlConcat(dir) {
  if (!existsSync(dir)) return '';
  let out = '';
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.sql') && statSync(join(dir, f)).isFile()) {
      out += '\n' + readFileSync(join(dir, f), 'utf8');
    }
  }
  return out;
}

// A GRANT statement targets `authenticated` if the role list between TO and the
// statement end names it. We test each GRANT's role list, not the whole file,
// so a GRANT ... TO service_role elsewhere never counts as authenticated cover.
const grantTargetsAuth = (grantBody) =>
  /\bto\b[^;]*\bauthenticated\b/i.test(grantBody);

// Scan SQL (defaults to schema + all migrations) for the grant property.
// Pass `sqlOverride` to test the catch without touching real files.
export function scanGrants(sqlOverride = null) {
  const raw = sqlOverride != null
    ? sqlOverride
    : readSqlConcat(SCHEMA_DIR) + readSqlConcat(MIGRATIONS_DIR);
  const sql = stripComments(raw);

  // Instance-scoped tables (mirror tenancy-guard's table detection).
  const tableScoped = new Set();
  const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["']?([a-zA-Z_][a-zA-Z0-9_]*)["']?\s*\(([\s\S]*?)\n\s*\)\s*;/gi;
  let m;
  while ((m = createRe.exec(sql)) !== null) {
    if (/\binstance_id\b/.test(m[2])) tableScoped.add(m[1].toLowerCase());
  }

  // Blanket grant: GRANT <privs> ON ALL TABLES IN SCHEMA public TO ... authenticated
  let blanketAuthGrant = false;
  const allTablesRe = /GRANT\s+[\s\S]*?\bON\s+ALL\s+TABLES\s+IN\s+SCHEMA\s+public\s+([\s\S]*?);/gi;
  while ((m = allTablesRe.exec(sql)) !== null) {
    if (grantTargetsAuth('to ' + m[1])) { blanketAuthGrant = true; break; }
  }

  // Default privileges restored for authenticated (recurrence-proofing).
  let defaultPrivAuth = false;
  const defPrivRe = /ALTER\s+DEFAULT\s+PRIVILEGES[\s\S]*?\bGRANT\s+[\s\S]*?\bON\s+TABLES\s+([\s\S]*?);/gi;
  while ((m = defPrivRe.exec(sql)) !== null) {
    if (grantTargetsAuth('to ' + m[1])) { defaultPrivAuth = true; break; }
  }

  // Explicit per-table grants to authenticated.
  const explicit = new Set();
  const perTableRe = /GRANT\s+[\s\S]*?\bON\s+(?:TABLE\s+)?(?:public\.)?["']?([a-zA-Z_][a-zA-Z0-9_]*)["']?\s+(TO[\s\S]*?);/gi;
  while ((m = perTableRe.exec(sql)) !== null) {
    if (grantTargetsAuth(m[2])) explicit.add(m[1].toLowerCase());
  }

  // A table is covered if the blanket grant exists OR it has an explicit grant.
  const uncovered = [...tableScoped]
    .filter((t) => !(t in GRANT_EXCEPTIONS))
    .filter((t) => !blanketAuthGrant && !explicit.has(t))
    .sort();

  // ok requires: all instance tables reachable AND the default-privilege
  // recurrence guard present (so the next table can't regress silently).
  const ok = uncovered.length === 0 && (blanketAuthGrant || explicit.size > 0) && defaultPrivAuth;

  const problems = [];
  if (uncovered.length) {
    problems.push(
      `authenticated has NO table grant on instance-scoped table(s): ${uncovered.join(', ')} ` +
      `(every read/write will 403 with code 42501 before RLS runs)`,
    );
  }
  if (!blanketAuthGrant && explicit.size === 0) {
    problems.push('no GRANT ... TO authenticated found at all — the role cannot reach any table');
  }
  if (!defaultPrivAuth) {
    problems.push(
      'no ALTER DEFAULT PRIVILEGES ... ON TABLES TO authenticated — future tables will ship grant-less (recurrence risk)',
    );
  }

  return { tableScoped, blanketAuthGrant, defaultPrivAuth, explicit, uncovered, ok, problems };
}

function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}

if (isMain()) {
  const r = scanGrants();
  console.log('# GRANT GUARD (authenticated can reach its tables)\n');
  console.log(`Instance-scoped tables (declare instance_id): ${r.tableScoped.size}`);
  console.log(`Blanket GRANT ... ON ALL TABLES TO authenticated: ${r.blanketAuthGrant ? 'yes' : 'no'}`);
  console.log(`Explicit per-table grants to authenticated:       ${r.explicit.size}`);
  console.log(`ALTER DEFAULT PRIVILEGES ... TO authenticated:    ${r.defaultPrivAuth ? 'yes' : 'no'}\n`);
  if (r.ok) {
    console.log('PASS — every instance-scoped table is reachable by authenticated; future tables inherit the grant.');
  } else {
    console.log('FAIL:');
    r.problems.forEach((p) => console.log(`  - ${p}`));
  }
  process.exit(r.ok ? 0 : 1);
}
