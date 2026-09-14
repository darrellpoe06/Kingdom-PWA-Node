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
