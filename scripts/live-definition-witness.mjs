#!/usr/bin/env node
// =============================================================================
// live-definition-witness — the database gets its own outside-in witness
// (DR-0125 applied to the schema; DR-0076 §1 evidence-not-claims)
// =============================================================================
// THE INCIDENT THIS ENDS (measured live, 2026-08-27, the SECOND occurrence).
// The ledger said 0151 applied at 00:22:03. The live claim_property_access did
// not contain my_identity_emails — it was still the 0150 definition. The same
// was true of set_member_role, back to its pre-0144 shape with neither the
// 'successor' nor the 'child' arm. Every check was green.
//
// The replay-order guard (scripts/migration-replay-order-guard.mjs) stops the
// isolation matrix from CAUSING that revert. It cannot detect one that already
// happened, and it cannot see a revert from any other source — a hand-run
// statement, a restored backup, a leg added in another branch.
//
// And db-migrate can never HEAL one: it skips a file whose checksum already
// reads 'applied'. So once a definition is reverted, the ledger swears it is
// current and the lane never touches it again. The receipt outlived the fact.
//
// This is the same lesson as site-health, one layer down: every safeguard
// watched the PIPELINE, none ever asked the DATABASE what it actually holds.
//
// WHAT IT CHECKS. For every function defined by more than one migration, the
// newest definition wins. The tokens that appear in that newest body and in NO
// earlier body are exactly what distinguishes new from old — so if the live
// body is missing one, the live database is running a definition older than the
// one the repo shipped. Nothing is hand-maintained: the expectations are
// derived from the migration files, so they cannot rot.
//
//   claim_property_access -> my_identity_emails   (0151 over 0150)
//   set_member_role       -> 'successor', 'child' (0144 over 0131)
//
// Both real reverts fall out of the derivation; neither was written down.
//
// Only the function BODY is compared. Postgres re-renders a function's header
// (argument types, SET clauses) but stores the dollar-quoted body verbatim, so
// the body is the one region where a repo-vs-live comparison is exact rather
// than a formatting guess.
//
// Deterministic. The derivation is pure and unit-tested with no database; the
// live comparison is fed the rows psql returns. CLI (plan only, no DB):
//   node scripts/live-definition-witness.mjs
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = join(ROOT, 'infra/supabase/migrations-auto');

// A token has to be substantial enough to mean something. Single letters and
// SQL noise words would produce expectations that are true by accident.
const MIN_TOKEN = 4;

// Words that appear in almost every plpgsql body. Requiring them would pass
// against a reverted definition just as readily as a current one, which is the
// anti-theater rule (DR-0076 §3): an expectation that cannot fail is a lie.
const NOISE = new Set([
  'begin', 'end', 'then', 'else', 'elsif', 'return', 'select', 'insert', 'update',
  'delete', 'from', 'where', 'exists', 'null', 'true', 'false', 'and', 'not',
  'into', 'values', 'declare', 'raise', 'exception', 'using', 'when', 'case',
  'coalesce', 'lower', 'upper', 'public', 'auth', 'uid', 'text', 'uuid', 'boolean',
  'plpgsql', 'language', 'security', 'definer', 'stable', 'volatile', 'returns',
  'create', 'replace', 'function', 'this', 'that', 'with', 'left', 'join', 'inner',
]);

/** Strip SQL comments so a rewritten comment never becomes an expectation. */
export function stripComments(sql = '') {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

/**
 * Every `CREATE OR REPLACE FUNCTION public.<name>` in one migration, with the
 * dollar-quoted body Postgres will store verbatim.
 */
export function functionBodies(sql = '') {
  const out = [];
  const re = /create\s+or\s+replace\s+function\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const name = m[1].toLowerCase();
    const rest = sql.slice(m.index);
    // The body is whatever sits between the first dollar-quote tag and its twin.
    const open = /\$([a-z0-9_]*)\$/i.exec(rest);
    if (!open) continue;
    const tag = `$${open[1]}$`;
    const bodyStart = open.index + tag.length;
    const bodyEnd = rest.indexOf(tag, bodyStart);
    if (bodyEnd === -1) continue;
    out.push({ name, body: rest.slice(bodyStart, bodyEnd) });
  }
  return out;
}

/** Identifiers and quoted literals a body carries, lowercased and de-noised. */
export function tokensOf(body = '') {
  const clean = stripComments(body);
  const words = clean.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  // Only well-formed single-line literals. A body full of `format(...)` calls
  // has quotes that pair across newlines and produce token soup — an
  // expectation nobody can read is an expectation nobody can trust.
  const literals = (clean.match(/'[a-zA-Z0-9_.@:/ -]{4,60}'/g) || []).map((s) => s.toLowerCase());
  const set = new Set();
  for (const w of words) {
    const lw = w.toLowerCase();
    if (lw.length >= MIN_TOKEN && !NOISE.has(lw)) set.add(lw);
  }
  for (const l of literals) {
    const inner = l.slice(1, -1);
    if (inner.length >= MIN_TOKEN && !NOISE.has(inner)) set.add(l);
  }
  return set;
}

/** Migration files in applied order — the same ascending order the lane uses. */
export function migrationFiles(dir = MIGRATIONS) {
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
}

/**
 * The expectations, derived. For each function defined by more than one
 * migration, the tokens unique to the NEWEST body — the fingerprint that a
 * reverted definition cannot have.
 */
export function deriveExpectations(dir = MIGRATIONS) {
  const byName = new Map();
  for (const file of migrationFiles(dir)) {
    const sql = readFileSync(join(dir, file), 'utf8');
    for (const { name, body } of functionBodies(sql)) {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push({ file, body });
    }
  }

  const expectations = [];
  for (const [name, defs] of byName) {
    if (defs.length < 2) continue; // one definition can never have been reverted
    const newest = defs[defs.length - 1];
    const earlier = defs.slice(0, -1);
    const newestTokens = tokensOf(newest.body);
    for (const prior of earlier) {
      for (const t of tokensOf(prior.body)) newestTokens.delete(t);
    }
    if (newestTokens.size === 0) continue; // a pure reformat distinguishes nothing
    expectations.push({
      name,
      definedBy: newest.file,
      supersedes: earlier.map((d) => d.file),
      markers: [...newestTokens].sort(),
    });
  }
  return expectations.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Compare the derived expectations against what the live database returned.
 * `live` maps function name -> its definition text, or an array of them when
 * the name is overloaded (each signature is its own pg_proc row). An overloaded
 * name passes when ANY signature carries the newest body — that one is present,
 * which is the thing being asked.
 */
export function findReverted(expectations, live = {}) {
  const failures = [];
  for (const exp of expectations) {
    const raw = live[exp.name];
    if (raw === undefined) continue; // not queried — say nothing rather than guess
    const defs = (Array.isArray(raw) ? raw : [raw]).filter((d) => d !== null && d !== '');
    if (defs.length === 0) {
      failures.push({ ...exp, reason: 'absent from the live database', missing: exp.markers });
      continue;
    }
    // Every marker is unique to the newest body, so one missing is already a
    // definition older than what shipped.
    let best = null;
    for (const def of defs) {
      const hay = stripComments(def).toLowerCase();
      const missing = exp.markers.filter((t) => !hay.includes(t));
      if (missing.length === 0) { best = null; break; }
      if (best === null || missing.length < best.length) best = missing;
    }
    if (best !== null) {
      failures.push({
        ...exp,
        reason: `live definition is older than ${exp.definedBy}`,
        missing: best,
      });
    }
  }
  return failures;
}

/** The names the live query needs to fetch. */
export function functionsToQuery(expectations) {
  return expectations.map((e) => e.name);
}

/** Read stdin to the end — the live rows psql hands us. */
function readStdin() {
  return new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => { buf += d; });
    process.stdin.on('end', () => resolve(buf));
  });
}

const isMain = process.argv[1] && process.argv[1].endsWith('live-definition-witness.mjs');

// --names prints the function names the live query must fetch, space separated.
if (isMain && process.argv.includes('--names')) {
  console.log(functionsToQuery(deriveExpectations()).join(' '));
  process.exit(0);
}

// --check reads `[{"name":..,"def":..}, ...]` on stdin (what the psql step
// produces) and exits non-zero on any live definition older than the repo's.
if (isMain && process.argv.includes('--check')) {
  const raw = await readStdin();
  const expectations = deriveExpectations();
  let rows;
  try {
    rows = JSON.parse(raw || '[]');
  } catch {
    console.error('live-definition-witness: could not parse the live rows on stdin.');
    process.exit(2);
  }
  const live = {};
  for (const r of rows) {
    const n = String(r.name).toLowerCase();
    if (!live[n]) live[n] = [];
    live[n].push(r.def ?? null);
  }
  // A function the repo expects but the query never returned is absent, not
  // unknown — unknown freshness must never read as fresh (DR-0076/DR-0125).
  for (const e of expectations) if (!(e.name in live)) live[e.name] = null;

  const failures = findReverted(expectations, live);
  if (failures.length === 0) {
    console.log(`live-definition-witness: ${expectations.length} function(s) checked; the live database matches the newest migration for every one.`);
    process.exit(0);
  }
  console.error(`::error::live-definition-witness: ${failures.length} live definition(s) are OLDER than what the repo shipped.`);
  for (const f of failures) {
    console.error(`  ${f.name} — ${f.reason}`);
    console.error(`    newest migration: ${f.definedBy}`);
    console.error(`    missing from live: ${f.missing.join(', ')}`);
    console.error(`    heal: delete from public._schema_migrations where filename='${f.definedBy}'; then re-run db-migrate.`);
  }
  process.exit(1);
}

if (isMain) {
  const expectations = deriveExpectations();
  if (expectations.length === 0) {
    console.log('live-definition-witness: no function is defined by more than one migration yet.');
    process.exit(0);
  }
  console.log(`live-definition-witness: ${expectations.length} function(s) carry a newest-definition fingerprint\n`);
  for (const e of expectations) {
    console.log(`  ${e.name}`);
    console.log(`    newest: ${e.definedBy}  (supersedes ${e.supersedes.join(', ')})`);
    console.log(`    must contain: ${e.markers.slice(0, 8).join(', ')}${e.markers.length > 8 ? ` (+${e.markers.length - 8} more)` : ''}`);
  }
  console.log(`\nNames to query live: ${functionsToQuery(expectations).join(' ')}`);
}
