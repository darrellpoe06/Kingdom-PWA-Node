#!/usr/bin/env node
// =============================================================================
// format-guard — every file born into the repo is formatted; the old ones are
// not rewritten to say so (DR-1343, DR-1330 D10)
// =============================================================================
// The review measured no Prettier and no Python linter, beside an ESLint that
// runs with zero warnings. A big-bang reformat of 400,000 lines would collide
// with every branch in flight (eleven today) and move the shell's line count
// under its own ratchet, so the rule is a ratchet of its own: a file ADDED
// since the base is checked by Prettier (.js/.jsx/.mjs, the repo's
// .prettierrc.json) or by ruff (`ruff format --check` + `ruff check`, .py);
// a file that already existed is left as it is until its own turn.
//
//   node scripts/format-guard.mjs [--base origin/main] [--fix]
//
// Pure helpers exported for vitest (which files, which tool); the live run
// shells out to the pinned tools (prettier in app/package.json, ruff in
// infra/requirements-ci.txt). Proven to catch on an unformatted fixture.
// =============================================================================
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Which added paths each tool judges. */
export function partition(addedPaths) {
  const js = [];
  const py = [];
  for (const p of addedPaths) {
    if (/(^|\/)node_modules\//.test(p) || /(^|\/)dist\//.test(p) || /\.min\.js$/.test(p)) continue;
    if (/\.(js|jsx|mjs)$/.test(p) && /^(app\/src|app\/functions|scripts|backend)\//.test(p)) js.push(p);
    else if (/\.py$/.test(p) && /^(infra|backend|scripts)\//.test(p) && !/\/vendor\//.test(p)) py.push(p);
  }
  return { js, py };
}

export function addedSince(base) {
  try {
    return execFileSync('git', ['diff', '--name-only', '--diff-filter=A', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' }).split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    throw new Error(`format-guard: cannot diff against ${base} (fetch it first): ${String(e.message).split('\n')[0]}`);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  const bi = argv.indexOf('--base');
  const base = bi >= 0 ? argv[bi + 1] : (process.env.FORMAT_GUARD_BASE || 'origin/main');
  const fix = argv.includes('--fix');
  const { js, py } = partition(addedSince(base));
  const failures = [];
  if (js.length) {
    // Prettier is the app's pinned devDependency, so it runs from app/ with the
    // paths rebased one directory up; the config is the repo's one file.
    const r = spawnSync('npx', ['--no-install', 'prettier', fix ? '--write' : '--check', '--config', '../.prettierrc.json', ...js.map((p) => `../${p}`)], { cwd: join(ROOT, 'app'), encoding: 'utf8' });
    if (r.status !== 0) failures.push(`prettier: ${(r.stdout + r.stderr).split('\n').filter((l) => /\[warn\]|error/i.test(l)).join('; ').slice(0, 600) || 'not formatted'}`);
  }
  if (py.length) {
    // ruff is pinned in infra/requirements-ci.txt; `python3 -m ruff` finds that
    // one whatever else is on the PATH.
    const ruff = (args) => spawnSync('python3', ['-m', 'ruff', ...args], { cwd: ROOT, encoding: 'utf8' });
    const fmt = ruff(['format', ...(fix ? [] : ['--check']), ...py]);
    if (fmt.status !== 0) failures.push(`ruff format: ${(fmt.stdout + fmt.stderr).trim().slice(0, 600)}`);
    const chk = ruff(['check', ...(fix ? ['--fix'] : []), ...py]);
    if (chk.status !== 0) failures.push(`ruff check: ${(chk.stdout + chk.stderr).trim().slice(0, 600)}`);
  }
  if (failures.length) {
    console.error(`format-guard: ${failures.length} finding(s) on files added since ${base} (${js.length} js, ${py.length} py):\n  ${failures.join('\n  ')}\n  run: node scripts/format-guard.mjs --fix`);
    process.exit(1);
  }
  console.log(`format-guard: OK — ${js.length} added JavaScript file(s) formatted (prettier), ${py.length} added Python file(s) clean (ruff), since ${base}.`);
}
