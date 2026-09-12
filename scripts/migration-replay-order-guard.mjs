#!/usr/bin/env node
// =============================================================================
// migration-replay-order-guard — a re-applied migration must never REVERT a
// newer one (DR-0076 §2 gate-the-class)
// =============================================================================
// THE INCIDENT THIS ENDS (measured live, 2026-08-27). db-migrate applied
// migration 0151, whose whole purpose was to widen claim_property_access() so a
// person invited by phone — or invited at one identity and arriving at the
// other — is recognized. Minutes later the rls-isolation matrix ran, and its
// `poe-properties` leg re-applies its own chain "idempotently" before the smoke.
// That chain listed 0150, which also carries CREATE OR REPLACE FUNCTION
// claim_property_access. The re-apply silently REPLACED the new definition with
// the old one. Every check was green, the ledger said 0151 applied, and the live
// function was the previous version — invite-by-phone quietly did not work.
//
// The rule: if an isolation leg re-applies migration M, and any LATER migration
// N replaces an object M defines, then that leg must ALSO list N (and after it),
// so a replay ends on the newest definition. Idempotent must mean converging on
// the current truth, not restoring the past.
//
// Deterministic, $0, no DB. Importable for vitest; CLI:
//   node scripts/migration-replay-order-guard.mjs
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = join(ROOT, 'infra/supabase/migrations-auto');
const WORKFLOW = join(ROOT, '.github/workflows/rls-isolation.yml');

// Objects whose re-definition SILENTLY overwrites the previous one. A table
// (CREATE TABLE IF NOT EXISTS) is not in this class; a function or a policy is.
const REPLACERS = [
  // `OR REPLACE` is OPTIONAL on purpose (widened 2026-09-12, after this guard
  // ran green while production was broken). A migration that changes a
  // function's RETURN TYPE cannot use CREATE OR REPLACE at all — Postgres
  // refuses it — so it must write DROP FUNCTION + plain CREATE FUNCTION. 0210
  // did exactly that for list_instance_members, and this guard could not see
  // it: five legs replayed 0144's older definition and silently reverted the
  // live roster to six columns. The one case where a replacement is FORCED to
  // look different was the one case the pattern missed.
  [/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi, (m) => `function:${m[1].toLowerCase()}`],
  [/CREATE\s+POLICY\s+([a-z0-9_]+)\s+ON\s+([a-z0-9_.]+)/gi, (m) => `policy:${m[2].toLowerCase()}.${m[1].toLowerCase()}`],
  [/CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([a-z0-9_]+)/gi, (m) => `trigger:${m[1].toLowerCase()}`],
];

/**
 * What each migration file REPLACES, keyed by its FILENAME.
 *
 * Keyed by filename and not by the four-digit prefix, because TWELVE prefixes
 * are shared by two different migrations — 0019, 0022, 0024, 0036, 0037, 0042,
 * 0043, 0045, 0052, 0055, 0056 and 0100. Keying by the number meant the second
 * file read simply OVERWROTE the first, so everything the shadowed one defines
 * was invisible to this guard. Found 2026-09-12 while fixing P55, when a
 * prefix-keyed rewrite of the matrix swapped books-role-wall's
 * `0100-assistant-role-and-books-rls.sql` for `0100-bus-ride-requests.sql`:
 * the same collision, in the other direction. A guard that cannot see part of
 * its own input is the P55 shape again, so it is fixed here rather than noted.
 */
export function replacedObjects(dir = MIGRATIONS) {
  const out = new Map();   // filename -> { file, objects:Set }
  for (const f of readdirSync(dir).sort()) {
    const m = /^(\d{4})-.+\.sql$/.exec(f);
    if (!m) continue;
    const sql = readFileSync(join(dir, f), 'utf8');
    const objects = new Set();
    for (const [re, key] of REPLACERS) {
      re.lastIndex = 0;
      let hit;
      while ((hit = re.exec(sql)) !== null) objects.add(key(hit));
    }
    out.set(f, { file: f, objects });
  }
  return out;
}

/** The legs, as { feature, migrations: [FILENAMES in listed order] }. */
export function isolationLegs(workflowText = readFileSync(WORKFLOW, 'utf8')) {
  const legs = [];
  const re = /- feature:\s*([\w-]+)[\s\S]*?migrations:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(workflowText)) !== null) {
    legs.push({ feature: m[1], migrations: m[2].split(/\s+/).filter(Boolean) });
  }
  return legs;
}

/** The check. Returns { ok, problems: [...] }. */
export function check(replaced = replacedObjects(), legs = isolationLegs()) {
  const problems = [];
  // Replay order is the order the files sort in, which is the order db-migrate
  // applies them — two files sharing a prefix still have a stable order between
  // them, which a number could not express.
  const names = [...replaced.keys()].sort();
  const rank = new Map(names.map((n, i) => [n, i]));
  for (const leg of legs) {
    for (const applied of leg.migrations) {
      const here = replaced.get(applied);
      if (!here) continue;
      for (const later of names) {
        if (rank.get(later) <= rank.get(applied)) continue;
        const next = replaced.get(later);
        const shared = [...here.objects].filter((o) => next.objects.has(o));
        if (!shared.length) continue;
        const listedAfter = leg.migrations.includes(later)
          && leg.migrations.indexOf(later) > leg.migrations.indexOf(applied);
        if (!listedAfter) {
          problems.push(
            `rls-isolation leg "${leg.feature}" re-applies ${here.file}, which redefines ${shared.join(', ')} — ` +
            `${next.file} redefines the same and is not listed after it, so a replay REVERTS it. ` +
            `Add ${next.file} to that leg's migrations, after ${here.file}.`
          );
        }
      }
    }
  }
  return { ok: problems.length === 0, problems };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ok, problems } = check();
  if (ok) {
    console.log('migration-replay-order-guard: OK — no isolation leg can revert a newer migration.');
    process.exit(0);
  }
  console.error('migration-replay-order-guard FAILED — a replay would restore an older definition:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
