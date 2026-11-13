// =============================================================================
// prettier-write — format the files a tool writes, the way format-guard checks
// them (DR-1477)
// =============================================================================
// format-guard (DR-1343) runs `npx --no-install prettier --check --config
// ../.prettierrc.json` from app/ over every JavaScript file ADDED since main.
// L307 and L308 each needed a hand `format-guard --fix` because new-lesson.mjs
// wrote its skeleton and fill-verses.mjs wrote its verses unformatted. This is
// the same command with --write, so a scaffolded or filled lesson file is in
// the shape the guard checks before anyone looks at it.
//
// It never formats a file main already holds unless asked (`force`): DR-1343's
// ratchet is "every file born into the repo is formatted, the old ones are not
// rewritten to say so", and fill-verses can be pointed at an old file.
// =============================================================================
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Pure. The argv format-guard's own check uses, with --write in place of --check. */
export function prettierArgs(paths, root = ROOT) {
  return ['--no-install', 'prettier', '--write', '--config', '../.prettierrc.json', ...paths.map((p) => relative(join(root, 'app'), resolve(p)))];
}

/** Is this path already on the base (origin/main)? Unknown reads as "yes": never reformat what might be old. */
export function onBase(path, { root = ROOT, base = 'origin/main' } = {}) {
  const rel = relative(root, resolve(path)).replaceAll('\\', '/');
  try {
    execFileSync('git', ['cat-file', '-e', `${base}:${rel}`], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    try {
      execFileSync('git', ['rev-parse', '--verify', '--quiet', `${base}^{commit}`], { cwd: root, stdio: 'ignore' });
      return false; // the base is readable and the path is not on it: a new file
    } catch {
      return true;
    }
  }
}

/**
 * Format `paths` with the repo's Prettier. Returns { ok, formatted, skipped, reason }.
 * `run` is injected by tests; the default is the real npx from app/.
 */
export function formatFiles(paths, { root = ROOT, force = false, base = 'origin/main', run = null } = {}) {
  const want = paths.filter((p) => existsSync(p));
  const skipped = force ? [] : want.filter((p) => onBase(p, { root, base }));
  const todo = want.filter((p) => !skipped.includes(p));
  if (!todo.length) return { ok: true, formatted: [], skipped, reason: '' };
  const exec =
    run ||
    ((args) => {
      const r = spawnSync('npx', args, { cwd: join(root, 'app'), encoding: 'utf8', timeout: 60_000 });
      return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}${r.error ? r.error.message : ''}` };
    });
  const r = exec(prettierArgs(todo, root));
  if (r.status !== 0) {
    return {
      ok: false,
      formatted: [],
      skipped,
      reason: `prettier did not run (${
        String(r.out || '')
          .trim()
          .split('\n')
          .slice(-1)[0] || `exit ${r.status}`
      }). Install it with \`cd app && npm ci\`, then run \`node scripts/format-guard.mjs --fix\`.`,
    };
  }
  return { ok: true, formatted: todo, skipped, reason: '' };
}
