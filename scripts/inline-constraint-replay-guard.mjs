#!/usr/bin/env node
// =============================================================================
// inline-constraint-replay-guard — a replay must not re-create a constraint a
// later migration DROPPED (DR-0076 §2 gate-the-class; DR-0982)
// =============================================================================
// THE INCIDENT THIS ENDS (measured 2026-10-12).
//
// 0269 creates door_stays with CREATE TABLE IF NOT EXISTS and two INLINE
// CHECK constraints — a guest's own ask capped at 29 nights, and any stay
// capped at a year. 0276 dropped both, at Darrell's twice-stated word ("All
// number of nights accepted!!!!!!!!").
//
// Three chains replay 0269. None of them applied 0276:
//
//   * rls-isolation.yml's poe-properties leg runs against the LIVE database,
//     where CREATE TABLE IF NOT EXISTS is a NO-OP. The caps stayed dropped and
//     the omission was invisible — which is exactly why it survived.
//   * ci.yml's door-work leg and scripts/e2e/build-door-db.sh build a FRESH
//     database, so the CREATE really runs and both caps come BACK. That chain
//     ends in a state production has not been in since 2026-10-11.
//
// The booking smoke was fixed to assert the new rule and promptly failed on
// the fresh-container leg, because the product and the leg's database disagreed
// about a rule the owner had deleted. Two of the three chains were already
// wrong before the smoke ever changed; nothing was watching, because
// migration-replay-order-guard deliberately excludes tables:
//
//     "A table (CREATE TABLE IF NOT EXISTS) is not in this class; a function
//      or a policy is."
//
// That is true of the TABLE and false of its CONSTRAINTS. A function's
// re-definition overwrites; a table's re-creation is skipped — but a
// constraint declared INSIDE that CREATE is re-created on any database that
// did not have the table, and a replay chain's whole job is to land where
// production is.
//
// THE RULE: if a chain applies migration M, which declares constraint c inline
// on table T, and a LATER migration N drops c from T, then the chain must also
// apply N (or a later file that drops c). Walk the chain in its real order and
// ask what is live at the end.
//
// Deterministic, $0, no DB. Importable for vitest; CLI:
//   node scripts/inline-constraint-replay-guard.mjs
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolationLegs, shellLegs } from './migration-replay-order-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = join(ROOT, 'infra/supabase/migrations-auto');
export const E2E_BUILDER = join(ROOT, 'scripts/e2e/build-door-db.sh');

/** SQL with comments removed, so prose quoting a constraint is never read as code. */
export function stripSql(sql = '') {
  return String(sql).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

/**
 * Constraints declared INSIDE a CREATE TABLE — the ones a re-creation brings
 * back. Scans the balanced paren block after the table name, so a CONSTRAINT
 * written later in the file with ALTER TABLE is not mistaken for an inline one.
 */
export function inlineConstraints(sql = '') {
  const clean = stripSql(sql);
  const out = [];
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(clean)) !== null) {
    const table = m[1].toLowerCase();
    let depth = 1;
    let i = re.lastIndex;
    while (i < clean.length && depth > 0) {
      if (clean[i] === '(') depth += 1;
      else if (clean[i] === ')') depth -= 1;
      i += 1;
    }
    const body = clean.slice(re.lastIndex, i - 1);
    for (const c of body.matchAll(/\bconstraint\s+([a-z0-9_]+)/gi)) {
      out.push({ table, name: c[1].toLowerCase() });
    }
  }
  return out;
}

/**
 * Every ALTER TABLE … ADD/DROP CONSTRAINT, read ONE STATEMENT AT A TIME.
 *
 * Statement-split and not one regex, and this is the whole reason the first
 * version of this guard was weaker than its green suggested. A migration
 * writes the pair back to back:
 *
 *     ALTER TABLE public.door_events DROP CONSTRAINT IF EXISTS door_events_subject_check;
 *     ALTER TABLE public.door_events ADD  CONSTRAINT door_events_subject_check CHECK (…);
 *
 * A single `alter table … (.*?) add constraint` regex matches from the FIRST
 * statement all the way into the second, so rejecting it for containing a `;`
 * also throws away the real ADD it had already consumed — and `lastIndex` has
 * moved past it, so the next pass never sees it either. Measured on 0269 and
 * 0279: both reported ZERO added constraints while both plainly add one, which
 * made door_events_subject_check read as permanently dropped. Splitting first
 * removes the class, not the instance.
 */
function alterConstraints(sql = '', action = 'add') {
  const verb = action === 'add' ? /add\s+constraint\s+([a-z0-9_]+)/gi
                                : /drop\s+constraint\s+(?:if\s+exists\s+)?([a-z0-9_]+)/gi;
  const out = [];
  for (const stmt of stripSql(sql).split(';')) {
    const head = /alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(?:public\.)?([a-z0-9_]+)/i.exec(stmt);
    if (!head) continue;
    const table = head[1].toLowerCase();
    verb.lastIndex = 0;
    for (const m of stmt.slice(head.index).matchAll(verb)) out.push({ table, name: m[1].toLowerCase() });
  }
  return out;
}

/** ALTER TABLE t ADD CONSTRAINT c — a constraint put back by hand. */
export function addedConstraints(sql = '') {
  return alterConstraints(sql, 'add');
}

/** ALTER TABLE t DROP CONSTRAINT [IF EXISTS] c. */
export function droppedConstraints(sql = '') {
  return alterConstraints(sql, 'drop');
}

/** Every migration's constraint moves, keyed by filename, in replay order. */
export function constraintsByFile(dir = MIGRATIONS) {
  const files = readdirSync(dir).filter((f) => /^\d{4}-.+\.sql$/.test(f)).sort();
  const byFile = new Map();
  for (const f of files) {
    const sql = readFileSync(join(dir, f), 'utf8');
    byFile.set(f, {
      inline: inlineConstraints(sql),
      added: addedConstraints(sql),
      dropped: droppedConstraints(sql),
    });
  }
  return byFile;
}

const key = (c) => `${c.table}.${c.name}`;

/**
 * Which (table, constraint) pairs the repo's NEWEST word says are GONE, and the
 * file that said so. A pair created inline and never dropped is not in here;
 * neither is one dropped and then added back by a later file.
 */
export function goneByNewestWord(byFile = constraintsByFile()) {
  const state = new Map();   // key -> { present, file }
  for (const [file, moves] of byFile) {
    for (const c of [...moves.inline, ...moves.added]) state.set(key(c), { present: true, file, ...c });
    for (const c of moves.dropped) {
      // A file's own DROP-then-ADD (the allow-list pattern, 0279) is an ADD;
      // the loop above already ran for this file, so only re-record a drop
      // that this file does NOT follow with an add of the same name.
      if (moves.added.some((a) => key(a) === key(c))) continue;
      state.set(key(c), { present: false, file, ...c });
    }
  }
  const gone = new Map();
  for (const [k, v] of state) if (!v.present) gone.set(k, v);
  return gone;
}

/**
 * Walk ONE chain (an ordered list of filenames) and report every constraint the
 * chain leaves PRESENT that the repo's newest word says is gone.
 */
export function checkChain(files, label, byFile = constraintsByFile(), gone = goneByNewestWord(byFile)) {
  const live = new Map();   // key -> file that made it live
  for (const f of files) {
    const moves = byFile.get(f);
    if (!moves) continue;
    for (const c of [...moves.inline, ...moves.added]) live.set(key(c), f);
    for (const c of moves.dropped) {
      if (moves.added.some((a) => key(a) === key(c))) continue;
      live.delete(key(c));
    }
  }
  const problems = [];
  for (const [k, by] of live) {
    const g = gone.get(k);
    if (!g) continue;
    problems.push(
      `${label}: replays ${by}, which re-creates constraint ${k}, but never applies ${g.file}, which DROPPED it. `
      + `On a fresh database this chain ends with ${k} in force — a state production has not been in since ${g.file} landed. `
      + `Add ${g.file} to this chain after ${by}.`,
    );
  }
  return problems;
}

/** The `for f in ... ; do` migration list in the e2e door-database builder. */
export function e2eChain(text = readFileSync(E2E_BUILDER, 'utf8'), dir = MIGRATIONS) {
  const known = new Set(readdirSync(dir).filter((f) => /^\d{4}-.+\.sql$/.test(f)));
  const out = [];
  for (const line of String(text).split('\n')) {
    if (/^\s*#/.test(line)) continue;
    for (const tok of line.match(/\d{4}-[A-Za-z0-9._-]+\.sql/g) || []) if (known.has(tok)) out.push(tok);
  }
  return out;
}

export function check(byFile = constraintsByFile()) {
  const gone = goneByNewestWord(byFile);
  const problems = [];
  for (const leg of isolationLegs()) {
    problems.push(...checkChain(leg.migrations, `rls-isolation leg "${leg.feature}"`, byFile, gone));
  }
  for (const leg of shellLegs()) {
    problems.push(...checkChain(leg.steps.filter((s) => s.kind === 'apply').map((s) => s.file), `ci.yml job "${leg.job}"`, byFile, gone));
  }
  problems.push(...checkChain(e2eChain(), 'scripts/e2e/build-door-db.sh', byFile, gone));
  return problems;
}

if (process.argv[1] && process.argv[1].endsWith('inline-constraint-replay-guard.mjs')) {
  const problems = check();
  if (problems.length) {
    console.error('inline-constraint-replay-guard: FAIL\n');
    for (const p of problems) console.error(`  - ${p}\n`);
    process.exit(1);
  }
  console.log('inline-constraint-replay-guard: OK — no replay chain re-creates a dropped constraint');
}
