#!/usr/bin/env node
// =============================================================================
// table-name-reuse-guard — a migration never CREATEs a table another one did
// =============================================================================
// THE INCIDENT (2026-10-10, db-migrate run 38091870801 after #2096). 0262
// created `public.record_events` for the door's event clock. 0052 had created a
// DIFFERENT `record_events` years earlier, the generic history log behind
// Inventory and Books. On the live database `CREATE TABLE IF NOT EXISTS` was
// silently skipped, the next statement asked for a column the old table does
// not have ("column subject does not exist"), and the replay stopped with
// 0262-0270 unapplied while the app that needs them was already deployed.
// No CI leg saw it: the CI chains never applied 0052.
//
// IF NOT EXISTS makes a reused name a silent no-op, never an error, so the
// only reliable catch is to refuse the reuse itself: every table name is
// created by exactly one migration file. A reviewed exception names its reason.
//
// Deterministic, no database. Importable for vitest; CLI exits 1 on a finding.
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIG_DIR = join(ROOT, 'infra/supabase/migrations-auto');

// Reuses that predate this guard, each reviewed. Never add one to make a red
// build green: rename the new table instead.
export const KNOWN = Object.freeze({
  lesson_versions: '0240 and 0243 both create it with different shapes; predates this guard. Review tracked separately.',
});

const CREATE = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?([a-z_][a-z_0-9]*)"?\s*\(/gi;

/** {table: [files that CREATE it]} from {file: sql}. Comments are ignored. */
export function tableCreators(sources) {
  const out = {};
  for (const [file, sql] of Object.entries(sources)) {
    const text = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const seen = new Set();
    for (const m of text.matchAll(CREATE)) seen.add(m[1].toLowerCase());
    for (const t of seen) (out[t] ||= []).push(file);
  }
  return out;
}

/** Findings: a table created by more than one file and not a known, reviewed reuse. */
export function reuseFindings(sources, known = KNOWN) {
  return Object.entries(tableCreators(sources))
    .filter(([t, files]) => files.length > 1 && !known[t])
    .map(([table, files]) => ({ table, files: files.sort() }));
}

export function repoSources(dir = MIG_DIR) {
  const out = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) out[f] = readFileSync(join(dir, f), 'utf8');
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = reuseFindings(repoSources());
  if (findings.length) {
    for (const f of findings) console.error(`table-name-reuse-guard: "${f.table}" is created by ${f.files.join(' AND ')} — IF NOT EXISTS makes the later one a silent no-op on any database that ran the first. Rename the new table.`);
    process.exit(1);
  }
  console.log(`table-name-reuse-guard: OK — every table is created by exactly one migration (${Object.keys(KNOWN).length} reviewed exception).`);
}
