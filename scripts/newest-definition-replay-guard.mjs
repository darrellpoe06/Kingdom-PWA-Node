#!/usr/bin/env node
// =============================================================================
// newest-definition-replay-guard — a chain that runs a smoke must converge on
// the definition PRODUCTION has (DR-0076 §2 gate-the-class; DR-0983)
// =============================================================================
// THE INCIDENT THIS ENDS (measured live 2026-10-13T00:52:28Z, rls-isolation run
// 38329136075).
//
// 0278 exists because Darrell typed one sentence at his own door's public card:
// "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!" Its answer, in its own words:
// "What is being rented is a BED IN A SHARED ROOM, and that is what the card
// must say." 0280 then added the street to the same shelf and branched the
// label on whether the street shows — putting 0278's descriptor in the ELSE
// arm. 0280 also set that column's DEFAULT to 'public' and UPDATEd every
// existing row to 'public', so the ELSE arm became the exception and a bed's
// headline reverted to the landlord-typed door name: on his door, the exact
// string 0278 was written to replace.
//
// TWO GUARDS WERE ALREADY WATCHING AND NEITHER COULD SEE IT:
//
//   * migration-replay-order-guard asks whether a replay REVERTS a newer file.
//     0280 is newer than 0278, the files are in ascending order, the RETURNS
//     shape is unchanged and it still calls rentable_level_of. Nothing to
//     report. The revert is in the BODY's branching, which no shape check sees.
//   * ci.yml's door-work leg runs 0273's smoke but stopped applying the chain
//     at 0273 — three migrations behind production's public_vacancies(). So the
//     one leg built on a FRESH database was asserting against a composition the
//     live database left behind, and it was GREEN while the live leg failed the
//     same smoke on the same commit.
//
// THE RULE, which is about the END of a chain rather than its order: if a chain
// applies migration M and runs M's smoke, then for every function M defines,
// that chain must also apply the NEWEST migration that defines the same
// function. A smoke is an assertion about a function's behaviour; asserting it
// against a definition three migrations stale proves nothing about the product
// and — worse — reads as proof.
//
// This is the complement of migration-replay-order-guard, not a duplicate:
// that one says "do not go backwards", this one says "arrive".
//
// Deterministic, $0, no DB. Importable for vitest; CLI:
//   node scripts/newest-definition-replay-guard.mjs
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolationLegs, shellLegs } from './migration-replay-order-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = join(ROOT, 'infra/supabase/migrations-auto');
const TESTS = join(ROOT, 'infra/supabase/tests');
export const CI_WORKFLOW = join(ROOT, '.github/workflows/ci.yml');

/** Functions a migration DEFINES (CREATE, with or without OR REPLACE). */
export function definedFunctions(sql = '') {
  const clean = String(sql).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
  const out = new Set();
  for (const m of clean.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi)) {
    out.add(m[1].toLowerCase());
  }
  return [...out];
}

/** filename -> the functions it defines, in replay (filename) order. */
export function definitionsByFile(dir = MIGRATIONS) {
  const files = readdirSync(dir).filter((f) => /^\d{4}-.+\.sql$/.test(f)).sort();
  const byFile = new Map();
  for (const f of files) byFile.set(f, definedFunctions(readFileSync(join(dir, f), 'utf8')));
  return byFile;
}

/** function name -> the LAST migration in replay order that defines it. */
export function newestDefiner(byFile = definitionsByFile()) {
  const newest = new Map();
  for (const [file, fns] of byFile) for (const fn of fns) newest.set(fn, file);
  return newest;
}

/**
 * Which migration(s) a smoke belongs to, by its four-digit prefix. Returned as
 * a list because twelve prefixes are shared by two migrations in this
 * repository; a smoke's claim covers whichever of them the chain applies.
 */
export function migrationsForSmoke(smoke, byFile = definitionsByFile()) {
  const p = /^(\d{4})-/.exec(smoke);
  if (!p) return [];
  return [...byFile.keys()].filter((f) => f.startsWith(`${p[1]}-`));
}

/**
 * The isolation matrix's legs WITH their smoke lists. isolationLegs() in
 * migration-replay-order-guard returns only {feature, pre, migrations} — it has
 * never needed the smokes — so this reads the same block again rather than
 * widening that guard's contract for one caller.
 */
export function isolationLegsWithSmokes(workflowText = readFileSync(join(ROOT, '.github/workflows/rls-isolation.yml'), 'utf8')) {
  const legs = isolationLegs(workflowText);
  const re = /- feature:\s*([\w-]+)[\s\S]*?smokes:\s*"([^"]*)"/g;
  const smokes = new Map();
  let m;
  while ((m = re.exec(workflowText)) !== null) {
    if (!smokes.has(m[1])) smokes.set(m[1], m[2].split(/\s+/).filter(Boolean));
  }
  return legs.map((l) => ({ ...l, smokes: smokes.get(l.feature) || [] }));
}

/** Smoke filenames a shell job runs, in order. */
export function shellSmokes(workflowText = readFileSync(CI_WORKFLOW, 'utf8')) {
  const known = new Set(readdirSync(TESTS).filter((f) => /\.sql$/.test(f)));
  const heads = [...workflowText.matchAll(/^ {2}([a-z][a-z0-9-]*):[ \t]*$/gm)].map((m) => ({ at: m.index, job: m[1] }));
  heads.push({ at: workflowText.length, job: '' });
  const out = new Map();
  for (let i = 0; i < heads.length - 1; i += 1) {
    const body = workflowText.slice(heads[i].at, heads[i + 1].at);
    const smokes = [];
    for (const line of body.split('\n')) {
      if (/^\s*#/.test(line)) continue;
      for (const m of line.matchAll(/infra\/supabase\/tests\/([A-Za-z0-9._-]+\.sql)/g)) {
        if (known.has(m[1])) smokes.push(m[1]);
      }
    }
    if (smokes.length) out.set(heads[i].job, smokes);
  }
  return out;
}

/**
 * Check ONE chain: the files it applies, the smokes it runs, and whether every
 * function asserted by a smoke is at its newest definition by the end.
 */
export function checkChain(applied, smokes, label, byFile = definitionsByFile(), newest = newestDefiner(byFile)) {
  const appliedSet = new Set(applied);
  const problems = [];
  const seen = new Set();
  for (const smoke of smokes) {
    for (const m of migrationsForSmoke(smoke, byFile)) {
      if (!appliedSet.has(m)) continue;                 // the chain never applies it
      for (const fn of byFile.get(m) || []) {
        const n = newest.get(fn);
        if (!n || n === m || appliedSet.has(n)) continue;
        const k = `${label}|${smoke}|${fn}`;
        if (seen.has(k)) continue;
        seen.add(k);
        problems.push(
          `${label}: runs ${smoke}, which asserts ${fn}() as ${m} defines it, but the chain never applies ${n} — `
          + `the newest definition of ${fn}(). This chain converges on a definition production left behind, so the smoke's `
          + `pass says nothing about the live function. Add ${n} to this chain (and anything between that redefines ${fn}).`,
        );
      }
    }
  }
  return problems;
}

export function check(byFile = definitionsByFile()) {
  const newest = newestDefiner(byFile);
  const problems = [];
  for (const leg of isolationLegsWithSmokes()) {
    problems.push(...checkChain(leg.migrations, leg.smokes, `rls-isolation leg "${leg.feature}"`, byFile, newest));
  }
  const smokesByJob = shellSmokes();
  for (const leg of shellLegs()) {
    const applied = leg.steps.filter((s) => s.kind === 'apply').map((s) => s.file);
    problems.push(...checkChain(applied, smokesByJob.get(leg.job) || [], `ci.yml job "${leg.job}"`, byFile, newest));
  }
  return problems;
}

if (process.argv[1] && process.argv[1].endsWith('newest-definition-replay-guard.mjs')) {
  const problems = check();
  if (problems.length) {
    console.error('newest-definition-replay-guard: FAIL\n');
    for (const p of problems) console.error(`  - ${p}\n`);
    process.exit(1);
  }
  console.log('newest-definition-replay-guard: OK — every chain that runs a smoke converges on the newest definition it asserts');
}
