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
// ci.yml replays migrations too, in shell rather than a matrix (see THE FOURTH
// BLIND SPOT below). A guard that reads one of its two inputs is not a guard.
const CI_WORKFLOW = join(ROOT, '.github/workflows/ci.yml');

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
  const re = /- feature:\s*([\w-]+)([\s\S]*?)migrations:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(workflowText)) !== null) {
    const pre = /\bpre:\s*"([^"]*)"/.exec(m[2]);
    legs.push({ feature: m[1], pre: pre ? pre[1] : '', migrations: m[3].split(/\s+/).filter(Boolean) });
  }
  return legs;
}

// ── THE THIRD BLIND SPOT (measured live 2026-09-23, rls-isolation runs 8 of 9
// red): the role-control leg lists 0112 AND 0221 in order, exactly as the
// check above requires — and still fails every time. 0221 widened
// list_my_admin_instances()'s RETURNS TABLE (it added slug) with DROP + CREATE,
// so the live database carries the wide shape; the leg then RE-APPLIES 0112,
// whose CREATE OR REPLACE carries the narrow shape, and Postgres refuses it:
// "cannot change return type of existing function". Listing the newer file
// after the older one keeps a replay from REVERTING — it does not keep the
// older file from being REFUSED. A leg that replays two shapes of one function
// must drop it first (matrix.pre), the way books-role-wall and poe-properties
// already do; this check makes that a rule instead of a memory.

/** Every function definition in one migration, with its normalized RETURNS. */
export function functionShapes(sql = '') {
  const clean = sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
  const out = [];
  const re = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(clean)) !== null) {
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < clean.length && depth > 0) {
      if (clean[i] === '(') depth += 1;
      else if (clean[i] === ')') depth -= 1;
      i += 1;
    }
    const bodyAt = clean.slice(i).search(/\bas\s*\$|\blanguage\b/i);
    if (bodyAt === -1) continue;
    const ret = /\breturns\b([\s\S]*)$/i.exec(clean.slice(i, i + bodyAt));
    const returns = (ret ? ret[1] : '').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').replace(/\s*\(\s*/g, '(').replace(/\s*\)\s*/g, ')').trim().toLowerCase();
    out.push({ name: m[1].toLowerCase(), returns });
  }
  return out;
}

/** The functions a SQL text drops (a migration's own DROP, or a leg's pre). */
export function droppedFunctions(sql = '') {
  const clean = sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
  const out = new Set();
  const re = /drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?([a-z0-9_]+)/gi;
  let m;
  while ((m = re.exec(clean)) !== null) out.add(m[1].toLowerCase());
  return out;
}

/** filename -> { shapes: [{name, returns}], drops: Set } for every migration. */
export function functionShapesByFile(dir = MIGRATIONS) {
  const out = new Map();
  for (const f of readdirSync(dir).sort()) {
    if (!/^\d{4}-.+\.sql$/.test(f)) continue;
    const sql = readFileSync(join(dir, f), 'utf8');
    out.set(f, { shapes: functionShapes(sql), drops: droppedFunctions(sql) });
  }
  return out;
}

/**
 * The check: a leg that replays a function under two RETURNS shapes must drop
 * it in its pre-step, or the older file is refused on a database that already
 * carries the newer shape. Returns { ok, problems }.
 */
export function checkReplayShapes(byFile = functionShapesByFile(), legs = isolationLegs()) {
  const problems = [];
  for (const leg of legs) {
    const preDrops = droppedFunctions(leg.pre || '');
    const finalShape = new Map();   // name -> returns of the LAST listed definition
    for (const f of leg.migrations) {
      for (const s of (byFile.get(f) || { shapes: [] }).shapes) finalShape.set(s.name, { returns: s.returns, file: f });
    }
    for (const f of leg.migrations) {
      const entry = byFile.get(f);
      if (!entry) continue;
      for (const s of entry.shapes) {
        const last = finalShape.get(s.name);
        if (!last || last.file === f || last.returns === s.returns) continue;
        if (entry.drops.has(s.name) || preDrops.has(s.name)) continue;
        problems.push(
          `rls-isolation leg "${leg.feature}" re-applies ${f}, which defines ${s.name}() with one RETURNS shape, ` +
          `after ${last.file} changed it — on a database already at ${last.file} Postgres REFUSES the replay ` +
          `("cannot change return type of existing function"). Add "DROP FUNCTION IF EXISTS public.${s.name}(...);" to that leg's pre.`
        );
      }
    }
  }
  return { ok: problems.length === 0, problems };
}

// ── THE FOURTH BLIND SPOT (measured 2026-10-11, ci.yml `door-work` red on
// PR #2112): this guard reads ONE FILE, rls-isolation.yml, and ci.yml replays
// migrations too. The `door-work` leg applies 0273 — which widens
// public_vacancy_photos()'s RETURNS TABLE with DROP + CREATE — and then
// RE-APPLIES 0153/0154 for the 0271 smoke, and 0154's CREATE OR REPLACE
// carries the four-column shape. Postgres refused it exactly as the third
// blind spot's note predicts: "cannot change return type of existing
// function... Use DROP FUNCTION public_vacancy_photos(uuid) first."
//
// The rule was already written and already enforced — on the other file. The
// guard caught this same collision on rls-isolation when 0273 was built and
// the fix went only where the guard could see, so the second leg shipped
// broken. That is this guard's own header, three times over: "a guard that
// cannot see part of its own input is the P55 shape again." A gate that cannot
// see a surface is not protecting it (DR-0076 section 3).
//
// A ci.yml leg is plain shell — `for f in A.sql B.sql; do psql ... $f; done` —
// not a matrix, so it needs its own reader. What it gains in exchange is a
// POSITIONAL check, stricter than the matrix one: the matrix only knows a
// leg-level `pre`, while a shell leg's drops and applies are interleaved in one
// readable order, so a drop counts only where it actually falls.

/** The files a ci.yml shell job applies and the functions it drops, IN ORDER. */
export function shellLegs(workflowText = readFileSync(CI_WORKFLOW, 'utf8'), dir = MIGRATIONS) {
  const known = new Set(readdirSync(dir).filter((f) => /^\d{4}-.+\.sql$/.test(f)));
  // Jobs are the two-space keys of the top-level `jobs:` map.
  const heads = [...workflowText.matchAll(/^ {2}([a-z][a-z0-9-]*):[ \t]*$/gm)].map((m) => ({ at: m.index, job: m[1] }));
  heads.push({ at: workflowText.length, job: '' });
  const legs = [];
  for (let i = 0; i < heads.length - 1; i += 1) {
    const body = workflowText.slice(heads[i].at, heads[i + 1].at);
    const steps = [];
    // Line by line, because that IS the execution order: a `for f in ...` list
    // sits on the line above the psql that consumes it, and a bare filename in
    // such a list is as real an apply as one written with its full path.
    for (const line of body.split('\n')) {
      if (/^\s*#/.test(line)) continue;
      for (const tok of line.match(/\d{4}-[A-Za-z0-9._-]+\.sql/g) || []) {
        if (known.has(tok)) steps.push({ kind: 'apply', file: tok });
      }
      for (const m of line.matchAll(/drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?([a-z0-9_]+)/gi)) {
        steps.push({ kind: 'drop', name: m[1].toLowerCase() });
      }
    }
    if (steps.some((s) => s.kind === 'apply')) legs.push({ job: heads[i].job, steps });
  }
  return legs;
}

/**
 * The positional check: walk a shell leg in its real order, carrying the shape
 * the database is actually at. An apply that carries a DIFFERENT shape than
 * what is live, with no DROP of that function since, is the refusal.
 *
 * A file's OWN drop counts (0273 drops before it creates), which is why a leg
 * may apply 0273 twice in a row and stay green.
 */
export function checkShellReplayShapes(byFile = functionShapesByFile(), legs = shellLegs()) {
  const problems = [];
  for (const leg of legs) {
    const live = new Map();   // function name -> { returns, file }
    for (const step of leg.steps) {
      if (step.kind === 'drop') { live.delete(step.name); continue; }
      const entry = byFile.get(step.file);
      if (!entry) continue;
      for (const s of entry.shapes) {
        const at = live.get(s.name);
        if (at && at.returns !== s.returns && !entry.drops.has(s.name)) {
          problems.push(
            `ci.yml job "${leg.job}" applies ${step.file}, which defines ${s.name}() with one RETURNS shape, ` +
            `after ${at.file} in the same job left the database at a different one — Postgres REFUSES it ` +
            `("cannot change return type of existing function"). Drop it first in that job, before ${step.file}: ` +
            `psql -c 'DROP FUNCTION IF EXISTS public.${s.name}(...);'`
          );
        }
        live.set(s.name, { returns: s.returns, file: step.file });
      }
      for (const d of entry.drops) if (!entry.shapes.some((s) => s.name === d)) live.delete(d);
    }
  }
  return { ok: problems.length === 0, problems };
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
  const order = check();
  const shapes = checkReplayShapes();
  const shell = checkShellReplayShapes();
  const ok = order.ok && shapes.ok && shell.ok;
  const problems = [...order.problems, ...shapes.problems, ...shell.problems];
  if (ok) {
    console.log('migration-replay-order-guard: OK — in rls-isolation AND ci.yml, no replay leg can revert a newer migration, and none replays a function under two RETURNS shapes without dropping it first.');
    process.exit(0);
  }
  console.error('migration-replay-order-guard FAILED — a replay would restore an older definition:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
