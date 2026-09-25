#!/usr/bin/env node
// =============================================================================
// rls-isolation-matrix-guard — every migration + smoke file the rls-isolation
// matrix names by string must EXIST on disk (DR-0076 proven-to-catch;
// DR-0239 gate-the-class).
//
// WHY: .github/workflows/rls-isolation.yml references each leg's migrations and
// smokes as bare filenames in the matrix. A rename, a typo, or a deleted smoke
// leaves the reference dangling — and because the matrix runs ONLY when
// db-migrate dispatches it against the real production DB (not in the app CI
// job), a broken reference is invisible until a prod dispatch fails, or worse
// looks green because the leg was never exercised. This guard makes a dangling
// reference RED at PR time, in the required `app — lint + vitest` check, before
// any prod dispatch. Added 2026-07-30 with the books-role-wall leg (REV-0216):
// that leg is the first proof that 0082/0100's own "adversarial LIVE RLS test"
// re-review item is discharged — the guard keeps it, and every sibling leg,
// from silently losing its files.
//
// PROVEN-TO-CATCH (DR-0076 Section 3): the unit test points the checker at a
// matrix leg naming a nonexistent smoke and REQUIRES a finding; the real
// workflow must produce none.
// =============================================================================
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const WORKFLOW = join(REPO, '.github/workflows/rls-isolation.yml');
const MIG_DIR = join(REPO, 'infra/supabase/migrations-auto');
const TEST_DIR = join(REPO, 'infra/supabase/tests');

// parseLegs(workflowText) -> [{feature, migrations:[], smokes:[]}]. A small,
// dependency-free line parser (js-yaml is not a repo dep, and we won't add one
// for a build guard). The matrix format is simple + stable: each leg is a
// `- feature:` line followed by `migrations:` and `smokes:` lines whose values
// are space-separated filenames, quoted or bare. Comment (#) lines are ignored.
export function parseLegs(workflowText) {
  const legs = [];
  let cur = null;
  const val = (line, key) => {
    const m = line.match(new RegExp(`^\\s*${key}:\\s*(.*)$`));
    if (!m) return null;
    return m[1].trim().replace(/^["']|["']$/g, '').trim();
  };
  for (const raw of String(workflowText).split('\n')) {
    const line = raw.replace(/\t/g, '  ');
    if (/^\s*#/.test(line)) continue; // comment
    const feat = line.match(/^\s*-\s*feature:\s*(.+?)\s*$/);
    if (feat) {
      cur = { feature: feat[1].replace(/^["']|["']$/g, ''), migrations: [], smokes: [] };
      legs.push(cur);
      continue;
    }
    if (!cur) continue;
    const migs = val(line, 'migrations');
    if (migs != null) { cur.migrations = migs.split(/\s+/).filter(Boolean); continue; }
    const smokes = val(line, 'smokes');
    if (smokes != null) { cur.smokes = smokes.split(/\s+/).filter(Boolean); }
  }
  return legs;
}

// checkMatrix(workflowText) -> string[] of problems (empty = clean). Pure so the
// unit test can feed a crafted workflow without touching disk for the parse.
export function checkMatrix(workflowText, { migExists, smokeExists, smokesOnDisk } = {}) {
  const problems = [];
  const legs = parseLegs(workflowText);
  if (legs.length === 0) {
    return ['rls-isolation.yml has no matrix legs (jobs.isolate.strategy.matrix.include)'];
  }
  const migCheck = migExists || ((f) => existsSync(join(MIG_DIR, f)));
  const smokeCheck = smokeExists || ((f) => existsSync(join(TEST_DIR, f)));
  for (const leg of legs) {
    const feature = leg.feature || '(unnamed leg)';
    if (leg.migrations.length === 0) problems.push(`leg "${feature}": no migrations named`);
    if (leg.smokes.length === 0) problems.push(`leg "${feature}": no smokes named`);
    for (const m of leg.migrations) {
      if (!migCheck(m)) problems.push(`leg "${feature}": migration not found — infra/supabase/migrations-auto/${m}`);
    }
    for (const s of leg.smokes) {
      if (!smokeCheck(s)) problems.push(`leg "${feature}": smoke not found — infra/supabase/tests/${s}`);
    }
  }

  // ── THE INVERSE, and it is the half that bit (LESSONS P53) ────────────────
  // The check above asks: does every file a leg NAMES exist? The one below asks
  // the question that actually goes wrong: does every smoke that EXISTS get
  // run by some leg? A smoke nobody runs is not a weak proof, it is no proof —
  // and it is indistinguishable, from the repo, from a thorough one. It sits
  // there with a header full of assertions, and the assertions never execute.
  //
  // Locked at ZERO on 2026-09-12, when there were zero: the cheapest possible
  // moment to make a standard permanent is before the first regression (the
  // icon-label precedent in ui-standards-guard). Every one of the 33 smokes in
  // the repo was named by a leg at that moment.
  // Read the real directory ONLY on a real run. A caller that injected
  // smokeExists is feeding a CRAFTED matrix, and scanning the repo's 33 real
  // smokes against a two-line fixture would report 32 orphans that are not —
  // which is what happened the first time this was written, caught by the two
  // tests that already existed.
  let files = [];
  if (smokesOnDisk) files = typeof smokesOnDisk === 'function' ? smokesOnDisk() : smokesOnDisk;
  else if (!smokeExists) {
    try { files = readdirSync(TEST_DIR).filter((f) => f.endsWith('.sql')); } catch { files = []; }
  }
  const named = new Set(legs.flatMap((l) => l.smokes));
  for (const f of [...files].sort()) {
    if (!named.has(f)) {
      problems.push(`ORPHAN SMOKE — infra/supabase/tests/${f} exists and NO leg runs it, so it proves nothing`);
    }
  }
  return problems;
}

// ── ONE TRANSACTION PER LEG (2026-09-25, db-migrate run 36090407494) ────────
// Each leg re-applies its chain against SUPABASE_DB_URL (the hosted project,
// which db-migrate's apply step and live-definition witness also use; the app
// has read the sovereign database since REPOINT-ARMED). When the pre-step
// (a DROP FUNCTION) committed on its own and the chain rebuilt the function
// file by file, that database had NO such function for the length of the
// chain: the witness of a concurrent db-migrate read "public_vacancies —
// absent from the live database" while the poe-properties leg was mid-chain,
// and failed the run. The apply must be ONE psql --single-transaction that
// carries the pre-step and every migration, so other sessions see the old
// definition until COMMIT and the newest after, never nothing.
export function checkAtomicApply(workflowText) {
  const problems = [];
  const text = String(workflowText || '');
  // Only shell lines count; the explanation in comments may name the old shape.
  const code = text.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
  if (/psql[^\n]*-c\s+"\$PRE"/.test(code)) {
    problems.push('the leg pre-step runs as its own psql command, so its DROP commits before the chain rebuilds the object; carry it inside the chain\'s single transaction (ARGS+=(-c "$PRE"))');
  }
  const loop = /for\s+mig\s+in[\s\S]*?\bdone\b/.exec(code);
  if (loop && /\bpsql\b/.test(loop[0])) {
    problems.push('the leg applies each migration in its own psql transaction; a chain that drops and rebuilds a function leaves the database without it between files. Apply the whole chain in ONE psql --single-transaction');
  }
  if (!/psql\s+"\$DBURL"\s+--single-transaction[^\n]*"\$\{ARGS\[@\]\}"/.test(code)) {
    problems.push('no single psql --single-transaction call carries the leg\'s pre-step and chain ("${ARGS[@]}")');
  }
  return problems;
}

// Run as CLI (skip when imported by the test).
if (process.argv[1] && process.argv[1].endsWith('rls-isolation-matrix-guard.mjs')) {
  const wfText = readFileSync(WORKFLOW, 'utf8');
  const problems = [...checkMatrix(wfText), ...checkAtomicApply(wfText)];
  if (problems.length) {
    console.error('rls-isolation matrix guard FAILED:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log('rls-isolation matrix guard: every referenced migration + smoke file exists, and every smoke on disk is run by a leg, and each leg applies its pre-step and chain in one transaction.');
}
