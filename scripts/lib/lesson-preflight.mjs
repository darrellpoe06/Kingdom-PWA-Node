// =============================================================================
// lesson-preflight — the two setup steps every lesson builder did by hand
// (DR-1477; the shared helper DR-1474 decision 4 parked until it had its own
// proven-to-catch pass)
// =============================================================================
// 1. A SHALLOW CLONE IS REFUSED, with the one command that fixes it. The lesson
//    gates read history (derive-lesson-dates, the order test), and on a shallow
//    clone they fail as if the CONTENT were wrong (DR-1467). The check is git's
//    own `rev-parse --is-shallow-repository`, which reads the shared repository,
//    so it is right inside a `git worktree` too, where `test -f .git/shallow`
//    always reads clean because .git there is a file (DR-1474).
// 2. A WORKTREE WITH NO app/node_modules IS LINKED to the main checkout's, and
//    says so; with no main checkout to link to, it says `cd app && npm ci`.
//    Every builder brief carried this as a hand step.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { existsSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const UNSHALLOW = 'git fetch --unshallow origin';

const gitRun = (cwd) => (args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20_000 }).trim();

/** { shallow: true | false | null, reason }. null = git could not say; that is not "not shallow". */
export function shallowState({ cwd = process.cwd(), run = null } = {}) {
  try {
    const out = (run || gitRun(cwd))(['rev-parse', '--is-shallow-repository']);
    if (out === 'true') return { shallow: true, reason: '' };
    if (out === 'false') return { shallow: false, reason: '' };
    return { shallow: null, reason: `git answered '${out}'` };
  } catch (err) {
    return {
      shallow: null,
      reason: String(err.stderr || err.message || err)
        .trim()
        .split('\n')[0],
    };
  }
}

/**
 * Make sure `<cwd>/app/node_modules` exists. Returns { ok, action, target, fix }:
 *   action 'present'  it was already there;
 *   action 'linked'   it was missing, and is now a symlink to the main checkout's;
 *   action 'missing'  nothing to link to: `fix` is the one command.
 */
export function ensureNodeModules({ cwd = process.cwd(), run = null, link = symlinkSync, exists = existsSync } = {}) {
  const own = join(cwd, 'app', 'node_modules');
  if (exists(own)) return { ok: true, action: 'present', target: own, fix: '' };
  let main = null;
  try {
    const common = (run || gitRun(cwd))(['rev-parse', '--path-format=absolute', '--git-common-dir']);
    main = dirname(resolve(cwd, common));
  } catch {
    main = null;
  }
  const theirs = main ? join(main, 'app', 'node_modules') : null;
  if (theirs && resolve(theirs) !== resolve(own) && exists(theirs)) {
    link(theirs, own, 'dir');
    return { ok: true, action: 'linked', target: theirs, fix: '' };
  }
  return { ok: false, action: 'missing', target: own, fix: 'cd app && npm ci' };
}

/** Both steps, in order. Returns 0 to go on, 1 to stop; every outcome is said. */
export function preflight({ cwd = process.cwd(), log = console.log, err = console.error, run = null, link, exists } = {}) {
  const s = shallowState({ cwd, run });
  if (s.shallow === true) {
    err('preflight: this clone is SHALLOW, and the lesson gates read history (DR-1467, DR-1474). Fix it with:');
    err(`  ${UNSHALLOW}`);
    return 1;
  }
  if (s.shallow === null) {
    err(`preflight: could not tell whether this clone is shallow (${s.reason}). Run \`${UNSHALLOW}\` if it is, then try again.`);
    return 1;
  }
  const nm = ensureNodeModules({ cwd, run, link, exists });
  if (nm.action === 'linked') log(`preflight: app/node_modules was missing in this worktree; linked it to ${nm.target}`);
  if (!nm.ok) {
    err(`preflight: app/node_modules is missing and there is no main checkout to link it to. Install it with:`);
    err(`  ${nm.fix}`);
    return 1;
  }
  return 0;
}
