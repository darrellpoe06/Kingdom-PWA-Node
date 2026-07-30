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
import { readFileSync, existsSync } from 'node:fs';
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
export function checkMatrix(workflowText, { migExists, smokeExists } = {}) {
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
  return problems;
}

// Run as CLI (skip when imported by the test).
if (process.argv[1] && process.argv[1].endsWith('rls-isolation-matrix-guard.mjs')) {
  const problems = checkMatrix(readFileSync(WORKFLOW, 'utf8'));
  if (problems.length) {
    console.error('rls-isolation matrix guard FAILED — dangling file reference(s):');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log('rls-isolation matrix guard: every referenced migration + smoke file exists.');
}
