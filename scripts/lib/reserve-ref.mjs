// =============================================================================
// reserve-ref — claim a number on origin atomically, or learn it is held
// (DR-1468)
// =============================================================================
// Reading what is free (disk, main, branches in flight) cannot stop two
// sessions that both read in the same minute and both take the same number:
// DR-1441 was taken twice on 2026-11-12, and numbers 1445 and 1449 were contested
// by open PRs the same day. A reservation is a WRITE that only one claimant can
// win. The server is the referee:
//
//   git push --force-with-lease=refs/heads/reserve/dr-NNNN: origin <sha>:refs/heads/reserve/dr-NNNN
//
// The empty value after the colon means "this ref must not exist". The first
// push creates it; any later push for the same number is refused by the
// server, and that claimant tries the next number. <sha> is an EMPTY commit on
// main (main's tree, main as parent, a message naming the branch and session),
// so the reservation changes no file and no path-filtered workflow fires on it.
//
//   reserve/dr-NNNN   a decision-record number (claim-decision-number --reserve)
//   reserve/ll-NNN    a Living Lesson number   (new-lesson.mjs)
//
// scripts/sweep-reservations.mjs deletes a reservation once main holds a
// number at or above it (keep-prs-current.yml runs it).
// =============================================================================
import { execFileSync } from 'node:child_process';

export const RESERVE_NS = 'reserve';
const IDENTITY = { name: 'number reservation', email: 'reservation@noreply.invalid' };
export const KINDS = Object.freeze({ dr: 4, ll: 0 }); // zero-padding width per kind

/** Pure. The branch name that holds a reservation. */
export function reserveBranch(kind, n) {
  if (!(kind in KINDS)) throw new Error(`unknown reservation kind '${kind}'`);
  const width = KINDS[kind];
  return `${RESERVE_NS}/${kind}-${width ? String(n).padStart(width, '0') : String(n)}`;
}

/** Pure. { kind, n } from any spelling of a reservation ref, or null. */
export function parseReserveRef(ref) {
  const m = /(?:^|\/)reserve\/(dr|ll)-(\d+)$/.exec(String(ref || '').trim());
  return m ? { kind: m[1], n: Number(m[2]) } : null;
}

const defaultRun = (cwd) => (args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60_000,
  });

/** Numbers of one kind already reserved, from the remote-tracking refs (fetch first). */
export function reservedNumbers({ kind = 'dr', cwd = process.cwd(), remote = 'origin', run = null } = {}) {
  const exec = run || defaultRun(cwd);
  let out = '';
  try {
    out = exec(['for-each-ref', '--format=%(refname)', `refs/remotes/${remote}/${RESERVE_NS}/`]);
  } catch {
    return new Set();
  }
  const held = new Set();
  for (const line of out.split('\n')) {
    const r = parseReserveRef(line);
    if (r && r.kind === kind) held.add(r.n);
  }
  return held;
}

/**
 * Numbers of one kind reserved on origin RIGHT NOW, for a gate (DR-1477).
 *
 * A CI checkout is depth 1 with a single-branch refspec, so it has no
 * refs/remotes/origin/reserve/* at all and reservedNumbers() reads nothing
 * there. This asks the server first (`git ls-remote`, one round trip, under
 * `timeoutMs`), then falls back to the remote-tracking refs, then to nothing.
 * The fallback is SAFE: an empty set excuses no hole, so a gate that cannot
 * reach origin fails exactly as it did before reservations were read.
 *
 * Returns { numbers: Set, source: 'origin' | 'tracking' | 'none', reason }.
 */
export function reservedNumbersOnOrigin({ kind = 'll', cwd = process.cwd(), remote = 'origin', run = null, timeoutMs = 8_000 } = {}) {
  if (!(kind in KINDS)) throw new Error(`unknown reservation kind '${kind}'`);
  const exec =
    run ||
    ((args) =>
      execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: timeoutMs,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      }));
  let reason = '';
  try {
    const out = exec(['ls-remote', '--heads', remote, `refs/heads/${RESERVE_NS}/${kind}-*`]);
    const numbers = new Set();
    for (const line of String(out).split('\n')) {
      const r = parseReserveRef(line.split('\t')[1] || '');
      if (r && r.kind === kind) numbers.add(r.n);
    }
    return { numbers, source: 'origin', reason: '' };
  } catch (err) {
    reason = String(err.stderr || err.message || err)
      .trim()
      .split('\n')[0];
  }
  try {
    const out = exec(['for-each-ref', '--format=%(refname)', `refs/remotes/${remote}/${RESERVE_NS}/`]);
    const numbers = new Set();
    for (const line of String(out).split('\n')) {
      const r = parseReserveRef(line);
      if (r && r.kind === kind) numbers.add(r.n);
    }
    return { numbers, source: 'tracking', reason: `origin unreachable (${reason}); read the remote-tracking refs` };
  } catch {
    return { numbers: new Set(), source: 'none', reason: `origin unreachable (${reason}) and no remote-tracking refs` };
  }
}

/**
 * Pure. Split numbers missing from a sequence into the ones a reservation holds
 * (in flight on their own branch) and the real holes. A reservation excuses a
 * hole; it never excuses a duplicate, and an empty set excuses nothing.
 */
export function holesNotReserved(missing = [], reserved = new Set()) {
  const held = [];
  const holes = [];
  for (const n of missing) (reserved.has(n) ? held : holes).push(n);
  return { held, holes };
}

/** Pure. Did a failed push fail because the ref already exists (someone else holds it)? */
export function isHeldRefusal(stderr) {
  // "cannot lock ref" is the same race lost a moment earlier: another claimant
  // was writing this very ref. Stepping to the next number is safe either way.
  return /stale info|\(fetch first\)|already exists|non-fast-forward|\[rejected\]|cannot lock ref|failed to lock/i.test(String(stderr || ''));
}

/**
 * Claim one number on the remote. Returns
 *   { ok: true, branch, sha }        this claimant now holds it;
 *   { ok: false, held: true, ... }   another claimant holds it — try the next;
 *   { ok: false, held: false, reason } the push road itself failed (proxy,
 *                                      permission, network) — stop, say so.
 * `lease: false` exists ONLY so a test can show what the lease prevents.
 */
export function claimOnRemote({ kind, n, cwd = process.cwd(), remote = 'origin', base = 'origin/main', message = '', lease = true, run = null }) {
  const exec = run || defaultRun(cwd);
  const branch = reserveBranch(kind, n);
  const ref = `refs/heads/${branch}`;
  let sha;
  try {
    const parent = exec(['rev-parse', '--verify', `${base}^{commit}`]).trim();
    const tree = exec(['rev-parse', '--verify', `${base}^{tree}`]).trim();
    const msg = message || `reserve ${branch}`;
    // A fallback identity, so a runner or a fresh clone with none configured can
    // still reserve (an identity in the environment still wins over -c).
    sha = exec([
      '-c',
      `user.name=${IDENTITY.name}`,
      '-c',
      `user.email=${IDENTITY.email}`,
      'commit-tree',
      tree,
      '-p',
      parent,
      '-m',
      `${msg}\n\nat ${new Date().toISOString()} pid ${process.pid}`,
    ]).trim();
  } catch (err) {
    return {
      ok: false,
      held: false,
      branch,
      reason: `could not build the reservation commit on ${base}: ${
        String(err.stderr || err.message)
          .trim()
          .split('\n')[0]
      }`,
    };
  }
  const args = lease
    ? ['push', '--porcelain', `--force-with-lease=${ref}:`, remote, `${sha}:${ref}`]
    : ['push', '--porcelain', '--force', remote, `${sha}:${ref}`];
  try {
    exec(args);
    return { ok: true, branch, sha };
  } catch (err) {
    const said = `${err.stdout || ''}\n${err.stderr || ''}`;
    if (isHeldRefusal(said)) return { ok: false, held: true, branch };
    return { ok: false, held: false, branch, reason: said.trim().split('\n').filter(Boolean).slice(-2).join(' | ') || String(err.message) };
  }
}

/**
 * Pure loop over an injected claim: the lowest free number at or above
 * `start`, skipping `taken`, retrying on "held" until `maxTries`.
 */
export function reserveNext({ start, taken = new Set(), tryClaim, maxTries = 25 }) {
  const skip = new Set(taken);
  let n = Math.max(1, Number(start) || 1);
  for (let i = 0; i < maxTries; i += 1) {
    while (skip.has(n)) n += 1;
    const r = tryClaim(n);
    if (r.ok) return { ok: true, n, ...r, contested: [...skip].filter((x) => x >= start && !taken.has(x)) };
    if (!r.held) return { ok: false, n, reason: r.reason || 'the reservation push failed' };
    skip.add(n);
  }
  return { ok: false, n, reason: `${maxTries} numbers in a row were already held` };
}
