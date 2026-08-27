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
  [/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi, (m) => `function:${m[1].toLowerCase()}`],
  [/CREATE\s+POLICY\s+([a-z0-9_]+)\s+ON\s+([a-z0-9_.]+)/gi, (m) => `policy:${m[2].toLowerCase()}.${m[1].toLowerCase()}`],
  [/CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([a-z0-9_]+)/gi, (m) => `trigger:${m[1].toLowerCase()}`],
];

/** What each migration file REPLACES, keyed by its numeric prefix. */
export function replacedObjects(dir = MIGRATIONS) {
  const out = new Map();   // number -> { file, objects:Set }
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
    out.set(Number(m[1]), { file: f, objects });
  }
  return out;
}

/** The legs, as { feature, migrations: [numbers in listed order] }. */
export function isolationLegs(workflowText = readFileSync(WORKFLOW, 'utf8')) {
  const legs = [];
  const re = /- feature:\s*([\w-]+)[\s\S]*?migrations:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(workflowText)) !== null) {
    const nums = (m[2].match(/\b(\d{4})-/g) || []).map((s) => Number(s.slice(0, 4)));
    legs.push({ feature: m[1], migrations: nums });
  }
  return legs;
}

/** The check. Returns { ok, problems: [...] }. */
export function check(replaced = replacedObjects(), legs = isolationLegs()) {
  const problems = [];
  const numbers = [...replaced.keys()].sort((a, b) => a - b);
  for (const leg of legs) {
    for (const applied of leg.migrations) {
      const here = replaced.get(applied);
      if (!here) continue;
      for (const later of numbers) {
        if (later <= applied) continue;
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
