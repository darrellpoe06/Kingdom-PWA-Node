#!/usr/bin/env node
// =============================================================================
// intake-autofix-scope-guard — a system fix stays inside its allowlist (DR-0622)
// =============================================================================
// The low-hanging-fruit lane (lib/intake-autofix.js) hands a note to an AI
// fixer, which pushes a `claude/intake-fix-*` branch that rides the ordinary
// lane: lint, the full suite, every guard, auto-merge on green. This guard is
// the lane's extra gate for THAT branch class only. It fails the required CI
// job unless the change is what the category promised: a small wording or
// legibility change in the app's components.
//
//   * every changed file is a component (app/src/components/**.jsx), a
//     stylesheet (app/src/**.css), or a test (app/src/__tests__/**), never the
//     monolith, a lib, a migration, a workflow, a script or a doc;
//   * at most MAX_LINES changed lines outside tests;
//   * no added line carries a link, an email address or a phone number (a
//     note's words are DATA: a fix never publishes something a sender typed);
//   * no added line touches the bright lines the categorizer excludes (money,
//     sign-in, the Word, the Godhead's names) — see NEVER_AUTOFIX.
// On any other branch it passes without looking: it is scoped to the class.
//
// Usage (CI):   node scripts/intake-autofix-scope-guard.mjs
// Self-test:    node scripts/intake-autofix-scope-guard.mjs --selftest-break
// =============================================================================
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { NEVER_AUTOFIX } from '../app/src/lib/intake-outcome.js';
import { AUTOFIX } from '../app/src/lib/intake-autofix.js';

export const MAX_LINES = 30;
const ALLOWED = [/^app\/src\/components\/[A-Za-z0-9_/.-]+\.jsx$/, /^app\/src\/[A-Za-z0-9_/.-]+\.css$/, /^app\/src\/__tests__\/[A-Za-z0-9_/.-]+$/];
const FORBIDDEN_FILE = [/poe-financial-mvp-v28\.jsx$/];
const isTest = (f) => f.startsWith('app/src/__tests__/');
const LINKISH = /(https?:\/\/|www\.|mailto:|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4})/;

/** Pure: judge a diff. files: [{ path, added: [lines], removed: [lines] }] */
export function judge(branch, files) {
  if (!String(branch || '').startsWith(AUTOFIX.BRANCH_PREFIX)) return { ok: true, skipped: true, problems: [] };
  const problems = [];
  let changed = 0;
  if (!files.length) problems.push('the branch changes nothing');
  for (const f of files) {
    if (FORBIDDEN_FILE.some((r) => r.test(f.path)) || !ALLOWED.some((r) => r.test(f.path))) {
      problems.push(`${f.path} is outside the fix scope (components, stylesheets and tests only)`);
      continue;
    }
    if (!isTest(f.path)) changed += f.added.length + f.removed.length;
    for (const line of f.added) {
      if (LINKISH.test(line)) problems.push(`${f.path} adds a link, email or phone number: ${line.trim().slice(0, 80)}`);
      if (!isTest(f.path) && NEVER_AUTOFIX.test(line.toLowerCase())) problems.push(`${f.path} touches a bright-line subject: ${line.trim().slice(0, 80)}`);
    }
  }
  if (changed > MAX_LINES) problems.push(`${changed} changed lines outside tests (the ceiling is ${MAX_LINES})`);
  return { ok: problems.length === 0, skipped: false, problems };
}

export function parseUnifiedDiff(text) {
  const files = [];
  let cur = null;
  let minusPath = '';
  for (const line of String(text || '').split('\n')) {
    if (/^diff --git /.test(line)) { cur = null; minusPath = ''; continue; }
    const minus = /^--- (?:a\/(.+)|\/dev\/null)$/.exec(line);
    if (minus) { minusPath = minus[1] || ''; continue; }
    const plus = /^\+\+\+ (?:b\/(.+)|\/dev\/null)$/.exec(line);
    // A deleted file's "+++" is /dev/null: it is judged by its old path.
    if (plus) { cur = { path: plus[1] || minusPath, added: [], removed: [] }; files.push(cur); continue; }
    if (!cur || /^(index |@@|similarity |rename |new file|deleted file)/.test(line)) continue;
    if (line.startsWith('+')) cur.added.push(line.slice(1));
    else if (line.startsWith('-')) cur.removed.push(line.slice(1));
  }
  return files;
}

function selftestBreak() {
  const br = `${AUTOFIX.BRANCH_PREFIX}abc12345`;
  const cases = [
    ['a lib file', [{ path: 'app/src/lib/giving.js', added: ['x'], removed: [] }]],
    ['the monolith', [{ path: 'app/src/poe-financial-mvp-v28.jsx', added: ['x'], removed: [] }]],
    ['a migration', [{ path: 'infra/supabase/migrations-auto/0999-x.sql', added: ['x'], removed: [] }]],
    ['a link', [{ path: 'app/src/components/Bus.jsx', added: ['<a href="https://evil.example">'], removed: [] }]],
    ['too many lines', [{ path: 'app/src/components/Bus.jsx', added: Array(31).fill('x'), removed: [] }]],
    ['a bright line', [{ path: 'app/src/components/Bus.jsx', added: ['Give to the offering'], removed: [] }]],
    ['nothing', []],
  ];
  let caught = 0;
  for (const [name, files] of cases) {
    const r = judge(br, files);
    if (!r.ok) caught += 1; else console.error(`SELFTEST MISSED: ${name}`);
  }
  const clean = judge(br, [{ path: 'app/src/components/Bus.jsx', added: ['<h2>Schedule</h2>'], removed: ['<h2>Scedule</h2>'] }]);
  if (!clean.ok) { console.error('SELFTEST: a clean one-word fix was refused', clean.problems); process.exit(1); }
  if (caught !== cases.length) process.exit(1);
  console.log(`intake-autofix-scope-guard selftest: ${caught}/${cases.length} breaks caught, the clean fix passes`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--selftest-break')) { selftestBreak(); process.exit(0); }
  const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (!branch.startsWith(AUTOFIX.BRANCH_PREFIX)) { console.log(`intake-autofix-scope-guard: ${branch} is not a system-fix branch; nothing to judge.`); process.exit(0); }
  // CI checks out one commit; fetch enough of both sides to find the merge base.
  try { execSync('git fetch --no-tags --depth=200 origin main', { stdio: 'ignore' }); } catch { /* judged against what is present */ }
  try { execSync('git fetch --no-tags --deepen=200', { stdio: 'ignore' }); } catch { /* judged against what is present */ }
  let diff;
  try {
    diff = execSync('git diff --unified=0 origin/main...HEAD', { maxBuffer: 64 * 1024 * 1024 }).toString();
  } catch {
    // No merge base: compare the trees. That can only ADD files to judge, so
    // it fails closed, never open.
    diff = execSync('git diff --unified=0 origin/main HEAD', { maxBuffer: 64 * 1024 * 1024 }).toString();
  }
  const r = judge(branch, parseUnifiedDiff(diff));
  if (!r.ok) {
    console.error(`intake-autofix-scope-guard: ${branch} is outside the system-fix scope:`);
    for (const p of r.problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`intake-autofix-scope-guard: ${branch} stays inside the fix scope.`);
}
