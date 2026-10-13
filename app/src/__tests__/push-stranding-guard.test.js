// THE BASE MOVED WHILE THE BRANCH WAS VERIFIED — PROVEN IN BOTH DIRECTIONS.
// =============================================================================
// 2026-09-14. The same accident happened twice in one evening, and both times
// the push SUCCEEDED, which is what made it expensive: nothing failed, nothing
// printed, and the damage only surfaced later as a PR carrying already-merged
// commits and an INDEX.md conflict.
//
// The real timeline, from the run records:
//   23:38  verify starts on a branch based on main@ce533569
//   23:42  the delivery lane squash-merges #1566 -> main@2066e992
//   23:58  verify finishes green (971 files, 14,595 tests); the commit is pushed
//
// THIS FILE EXISTS TO KEEP ONE EARLIER MISTAKE FROM COMING BACK. The first
// attempt at this guard used `git cherry origin/main HEAD`, reasoning that a
// commit already upstream is marked `-`. Run against the REAL shape it printed
// six `+` and not a single `-` — because `git cherry` matches by patch-id, one
// commit to one commit, and a SQUASH folds many commits into one new patch that
// matches none of them. It would have passed silently on the very accident it
// was written for. That heuristic was deleted rather than shipped, and the
// tests below pin the replacement against the same real shas.
import { describe, it, expect } from 'vitest';
import { analyzeBaseDrift, remedy } from '../../../scripts/push-stranding-guard.mjs';

// The actual shas from the 2026-09-13 incident.
const BEFORE = 'ce5335690000000000000000000000000000aaaa';
const AFTER = '2066e9926ff46042851fea03674758142e4e7f32';
const stampAt = (sha) => ({ upstream: 'origin/main', sha, at: '2026-09-13T23:38:00Z' });

describe('analyzeBaseDrift — it FIRES on the real incident', () => {
  it('catches the base moving during the verify window', () => {
    const r = analyzeBaseDrift({ stamp: stampAt(BEFORE), nowSha: AFTER });
    expect(r.drifted).toBe(true);
    expect(r.ok).toBe(false);
    expect(r.unknown).toBe(false);
    expect(r.from).toBe(BEFORE);
    expect(r.to).toBe(AFTER);
  });

  it('names BOTH shas in the message, because "something changed" is not actionable', () => {
    const { reason } = analyzeBaseDrift({ stamp: stampAt(BEFORE), nowSha: AFTER });
    expect(reason).toContain(BEFORE);
    expect(reason).toContain(AFTER);
  });

  it('says plainly that the green no longer applies', () => {
    const { reason } = analyzeBaseDrift({ stamp: stampAt(BEFORE), nowSha: AFTER });
    expect(reason).toMatch(/base that no longer exists/i);
  });
});

describe('analyzeBaseDrift — it STAYS SILENT on the ordinary case', () => {
  // This half matters as much as the half above. A guard that also fires when
  // nothing is wrong gets ignored within a day, and an ignored guard is worse
  // than no guard because it looks like coverage.
  it('passes when the base held still, even far behind', () => {
    const r = analyzeBaseDrift({ stamp: stampAt(AFTER), nowSha: AFTER });
    expect(r.ok).toBe(true);
    expect(r.drifted).toBe(false);
    expect(r.unknown).toBe(false);
  });

  it('does NOT consider "the branch is behind main" a failure at all', () => {
    // The function never receives branch commits. Being behind is the normal
    // state of nearly every feature branch and is deliberately invisible here.
    const r = analyzeBaseDrift({ stamp: stampAt(AFTER), nowSha: AFTER });
    expect(r.reason).toMatch(/held still/i);
    expect(r.reason).not.toMatch(/behind/i);
  });
});

describe('analyzeBaseDrift — UNKNOWN never reads as green (DR-0076 §8)', () => {
  it('an absent stamp is UNKNOWN, not a pass', () => {
    const r = analyzeBaseDrift({ stamp: null, nowSha: AFTER });
    expect(r.ok).toBe(false);
    expect(r.unknown).toBe(true);
    expect(r.drifted).toBe(false);
  });

  it('an unreadable upstream is UNKNOWN, not a pass', () => {
    const r = analyzeBaseDrift({ stamp: stampAt(AFTER), nowSha: null });
    expect(r.ok).toBe(false);
    expect(r.unknown).toBe(true);
  });

  it('a stamp taken against a DIFFERENT upstream is UNKNOWN, never compared', () => {
    const r = analyzeBaseDrift({
      stamp: { upstream: 'origin/release', sha: AFTER },
      nowSha: AFTER,
      upstream: 'origin/main',
    });
    expect(r.unknown).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('a malformed stamp is UNKNOWN rather than throwing', () => {
    for (const bad of [undefined, {}, { sha: '' }, 'nonsense', 42]) {
      const r = analyzeBaseDrift({ stamp: bad, nowSha: AFTER });
      expect(r.unknown).toBe(true);
      expect(r.ok).toBe(false);
    }
  });

  it('is total on completely empty input', () => {
    const r = analyzeBaseDrift();
    expect(r.ok).toBe(false);
    expect(r.unknown).toBe(true);
  });
});

describe('the remedy is the replay, and it says the old green does not carry', () => {
  it('names the branch and tells you to restart from the upstream', () => {
    const out = remedy('claude/my-branch');
    expect(out).toContain('git checkout -B claude/my-branch origin/main');
    expect(out).toContain('cherry-pick');
  });

  it('says the replayed tree must be re-verified', () => {
    // The trap after a replay is assuming the pre-replay green still applies.
    // It does not: the cherry-picked tree is a different tree.
    expect(remedy('b')).toMatch(/different tree/i);
  });
});

// =============================================================================
// The stamp must land where git says, not where the path assumed (DR-0962)
// =============================================================================
// Measured 2026-10-11 running `npm run ship` from an isolated worktree, which
// is the lane shape ORCHESTRATION section 2 prescribes:
//
//   push-stranding-guard: COULD NOT STAMP — EEXIST: file already exists,
//   mkdir '/tmp/wt-pics/.git'
//
// In a worktree `.git` is a FILE holding `gitdir: ...`, so `mkdirSync` on it
// cannot succeed. The guard exited 2, which is DR-0393 decision 4 working
// exactly as written — and because it is the first link of ship's `&&` chain,
// verify, the fifteen gates and the push all silently never ran. The rule held
// and the lane was unusable; both of those are true at once.
//
// THIS TEST MAKES A REAL WORKTREE, and that is the whole point of it. The
// first version asserted only against the repository the suite runs in, where
// `<root>/.git` and the true gitdir are the SAME path — so restoring the
// broken line passed all fourteen tests. A check that cannot fail on the
// defect it was written for is theatre (DR-0076 section 3, P46). Creating the
// worktree is what makes the two paths differ, and therefore what makes the
// assertion mean something.
describe('STAMP_PATH is resolved from git, so a worktree can ship (DR-0962)', () => {
  it('PROVEN-TO-CATCH: in a real worktree the stamp avoids the .git FILE', async () => {
    const { resolveGitDir } = await import('../../../scripts/push-stranding-guard.mjs');
    const { execFileSync } = await import('node:child_process');
    const { mkdtempSync, rmSync, statSync, existsSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    const parent = mkdtempSync(join(tmpdir(), 'pssg-wt-'));
    const wt = join(parent, 'lane');
    try {
      // --no-checkout: we need the .git FILE, not 1,100 source files.
      execFileSync('git', ['worktree', 'add', '--no-checkout', '--detach', wt], {
        cwd: root, stdio: ['ignore', 'ignore', 'pipe'],
      });

      // The shape that broke it: `.git` here is a file, so the old
      // `join(cwd, '..', '.git')` could never be mkdir'd.
      const naive = join(wt, '.git');
      expect(existsSync(naive), 'no .git in the worktree at all').toBe(true);
      expect(statSync(naive).isFile(), 'this worktree has a .git DIRECTORY, so it cannot prove the bug').toBe(true);

      const resolved = resolveGitDir(wt);
      expect(statSync(resolved).isDirectory(), 'the resolved gitdir is not a directory').toBe(true);
      expect(resolved, 'the resolver handed back the .git FILE').not.toBe(naive);
      // And it is this lane's OWN gitdir, so two lanes verifying against
      // different bases cannot overwrite each other's stamp.
      expect(resolved.includes(`${join('.git', 'worktrees')}`), `not a per-worktree gitdir: ${resolved}`).toBe(true);
    } finally {
      try { execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: root, stdio: 'ignore' }); } catch { /* best effort */ }
      rmSync(parent, { recursive: true, force: true });
    }
  });

  it('in an ordinary clone it still lands in the repository .git', async () => {
    const { STAMP_PATH } = await import('../../../scripts/push-stranding-guard.mjs');
    const { execFileSync } = await import('node:child_process');
    const { statSync } = await import('node:fs');
    const { dirname } = await import('node:path');
    const gitDir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], { encoding: 'utf8' }).trim();
    expect(dirname(STAMP_PATH)).toBe(gitDir);
    expect(statSync(dirname(STAMP_PATH)).isDirectory()).toBe(true);
  });
});
