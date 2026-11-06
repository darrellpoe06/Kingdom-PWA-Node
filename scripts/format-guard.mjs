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

// A guard that needs a merge base ensures its own precondition (DR-1350).
// Measured and proven in a real `git clone --depth=1`; this step used to CRASH
// -- not report "no findings" -- the moment a branch had not merged main in
// first, and BOTH of these had to be fixed, in this order:
//
// 1. THE REF WAS NEVER CREATED. actions/checkout sets a single-branch refspec,
//    so `git fetch origin main` fetches the OBJECTS and writes no
//    refs/remotes/origin/main. `origin/main` is then an unknown revision --
//    nothing to do with shallowness, which is what I assumed first and what a
//    deepen-only fix would not have touched.
// 2. ONCE THE REF EXISTS, depth 1 on both sides genuinely has NO merge base,
//    and the three-dot diff needs one. Deepening only main cannot help: HEAD
//    has no parents to meet it. Both sides are deepened.
//
// Doing it here rather than in ci.yml keeps the fix out of the workflow line
// ceiling (DR-1342), makes it work for a local run too, and puts the knowledge
// next to the command that needs it.
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const quiet = (args) => { try { git(args); return true; } catch { return false; } };
const haveMergeBase = (base) => quiet(['merge-base', base, 'HEAD']);

// `run` is injected so a test can prove the sequence without the network. The
// default shells git. Every call is tolerant: a fetch that fails is answered by
// the next merge-base check, never by an exception.
export function ensureBase(base, run = quiet) {
  const has = () => run(['merge-base', base, 'HEAD']);
  if (has()) return true;
  const branch = base.replace(/^origin\//, '');
  const spec = `+refs/heads/${branch}:refs/remotes/${base}`;
  run(['fetch', '--no-tags', '--depth=1', 'origin', spec]);
  for (const d of [50, 250, 1000]) {
    if (has()) return true;
    run(['fetch', '--no-tags', `--deepen=${d}`, 'origin', spec]);
    run(['fetch', '--no-tags', `--deepen=${d}`, 'origin']);
  }
  if (!has()) run(['fetch', '--no-tags', '--unshallow', 'origin']);
  return has();
}

export function addedSince(base) {
  if (!ensureBase(base)) {
    throw new Error(`format-guard: no merge base with ${base} even after deepening and unshallowing; cannot tell which files are new to this branch.`);
  }
  try {
    return execFileSync('git', ['diff', '--name-only', '--diff-filter=A', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch (e) {
    throw new Error(`format-guard: cannot diff against ${base}: ${String(e.message).split('\n')[0]}`);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  const bi = argv.indexOf('--base');
  const base = bi >= 0 ? argv[bi + 1] : process.env.FORMAT_GUARD_BASE || 'origin/main';
  const fix = argv.includes('--fix');
  const { js, py } = partition(addedSince(base));
  const failures = [];
  if (js.length) {
    // Prettier is the app's pinned devDependency, so it runs from app/ with the
    // paths rebased one directory up; the config is the repo's one file.
    const r = spawnSync('npx', ['--no-install', 'prettier', fix ? '--write' : '--check', '--config', '../.prettierrc.json', ...js.map((p) => `../${p}`)], {
      cwd: join(ROOT, 'app'),
      encoding: 'utf8',
    });
    if (r.status !== 0)
      failures.push(
        `prettier: ${
          (r.stdout + r.stderr)
            .split('\n')
            .filter((l) => /\[warn\]|error/i.test(l))
            .join('; ')
            .slice(0, 600) || 'not formatted'
        }`
      );
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
    console.error(
      `format-guard: ${failures.length} finding(s) on files added since ${base} (${js.length} js, ${py.length} py):\n  ${failures.join('\n  ')}\n  run: node scripts/format-guard.mjs --fix`
    );
    process.exit(1);
  }
  console.log(`format-guard: OK — ${js.length} added JavaScript file(s) formatted (prettier), ${py.length} added Python file(s) clean (ruff), since ${base}.`);
}
