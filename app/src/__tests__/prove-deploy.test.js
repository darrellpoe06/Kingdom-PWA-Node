// @vitest-environment node
// =============================================================================
// A deploy is proved for ONE sha, or it is UNKNOWN (DR-1210)
// =============================================================================
// MEASURED ON MY OWN WATCHER, 2026-10-22. The deploy proof DR-0107 requires was
// written by hand five times in one night, and the fourth copy lied: it looked
// for the deploy by SCANNING the 20 most recent runs, the run scrolled out of
// that window under the night's volume, so it printed `deploy=none` forty
// times, FELL OUT OF ITS WAIT LOOP, dispatched the site probe anyway, reported
// "UP · fresh" and exited 0. Read from its tail it said the deploy was proved.
// It had never seen one. The real state was a deploy still QUEUED with the
// freshness healer firing — the site up, one merge behind.
//
// DR-0107 exists because poetech.us served a stale build for nine hours. A
// false deploy proof hides precisely the thing that rule was written to catch,
// which makes it worse than no proof at all.
//
// So the cases below are weighted at the two ways a proof lies: taking a green
// run that belongs to a DIFFERENT commit, and letting a spent wait budget read
// as success.
import { describe, it, expect } from 'vitest';
import {
  verdictOf, exitCodeOf, afterBudget, PROVED, FAILED, UNKNOWN, DEPLOY_WORKFLOW,
} from '../../../scripts/prove-deploy.mjs';

const SHA = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);
const run = (over = {}) => ({
  name: DEPLOY_WORKFLOW, head_sha: SHA, status: 'completed', conclusion: 'success', ...over,
});

describe('verdictOf — one sha, three outcomes', () => {
  it('a completed successful deploy for THIS sha is the only pass', () => {
    const v = verdictOf([run()], SHA);
    expect(v.verdict).toBe(PROVED);
    expect(v.why).toMatch(/completed successfully on a{40}/);
  });

  it('PROVEN-TO-CATCH: a green deploy of a DIFFERENT commit proves nothing — the scan bug', () => {
    // This is the exact shape my watcher fell for: it searched recent runs and
    // would have taken any green deploy it found. On a busy night that is
    // somebody else's commit, and the answer is confidently wrong.
    const v = verdictOf([run({ head_sha: OTHER })], SHA);
    expect(v.verdict, 'another commit deploying is not evidence about this one').toBe(UNKNOWN);
    expect(v.why).toMatch(/no Deploy \(Cloudflare Pages\) run exists for a{40}/);
    expect(v.why, 'and it says the other runs exist, so the reader is not left guessing why').toMatch(/1 run\(s\) of it exist for OTHER commits/);
  });

  it('a queued or in-progress deploy is UNKNOWN, never a pass and never a failure', () => {
    for (const status of ['queued', 'in_progress', 'waiting', 'pending']) {
      const v = verdictOf([run({ status, conclusion: null })], SHA);
      expect(v.verdict, status).toBe(UNKNOWN);
      expect(v.why).toMatch(new RegExp(`is ${status}, not completed`));
    }
  });

  it('a deploy that ended any other way is FAILED, and names how it ended', () => {
    for (const conclusion of ['failure', 'cancelled', 'timed_out', 'startup_failure']) {
      const v = verdictOf([run({ conclusion })], SHA);
      expect(v.verdict, conclusion).toBe(FAILED);
      expect(v.why).toMatch(new RegExp(`ended ${conclusion}, which is not a success`));
    }
  });

  it('other workflows on the same sha are not the deploy', () => {
    // CI being green says nothing about the site having advanced (DR-0054:
    // merge = deploy, and the deploy is a separate run that can silently stop).
    const v = verdictOf([
      { name: 'CI', head_sha: SHA, status: 'completed', conclusion: 'success' },
      { name: 'Deploy freshness (heal a missed deploy)', head_sha: SHA, status: 'completed', conclusion: 'success' },
    ], SHA);
    expect(v.verdict, 'CI green and the healer running are not a deploy').toBe(UNKNOWN);
  });

  it('an empty or malformed list is UNKNOWN, not an error and not a pass', () => {
    expect(verdictOf([], SHA).verdict).toBe(UNKNOWN);
    expect(verdictOf(null, SHA).verdict).toBe(UNKNOWN);
    expect(verdictOf([null, undefined], SHA).verdict).toBe(UNKNOWN);
  });
});

describe('afterBudget — the fall-through, which is the bug isolated', () => {
  it('PROVEN-TO-CATCH: a spent budget is UNKNOWN even though the loop ended', () => {
    // The hand-written loop ended its iterations and CONTINUED as though the
    // condition had been met. Ending is not succeeding.
    const v = afterBudget({ verdict: UNKNOWN, why: 'the deploy for a… is queued, not completed' });
    expect(v.verdict).toBe(UNKNOWN);
    expect(v.why).toMatch(/wait budget ran out/);
    expect(v.why, 'it says plainly that this is not a proof').toMatch(/NOT a proof/);
    expect(v.why, 'and names the consequence the reader needs').toMatch(/older build/);
  });

  it('PROVEN-TO-CATCH: a spent budget with NOTHING observed is still UNKNOWN', () => {
    // The worst version: forty reads that found nothing, then fall through.
    expect(afterBudget(null).verdict).toBe(UNKNOWN);
    expect(afterBudget(undefined).why).toMatch(/NOT a proof/);
  });

  it('a verdict already reached is carried through unchanged', () => {
    const proved = { verdict: PROVED, why: 'x' };
    expect(afterBudget(proved)).toBe(proved);
    const failed = { verdict: FAILED, why: 'y' };
    expect(afterBudget(failed)).toBe(failed);
  });
});

describe('exitCodeOf — "I do not know" is not "it broke"', () => {
  it('maps the three outcomes to three codes', () => {
    expect(exitCodeOf(PROVED)).toBe(0);
    expect(exitCodeOf(FAILED)).toBe(1);
    expect(exitCodeOf(UNKNOWN)).toBe(2);
  });

  it('PROVEN-TO-CATCH: nothing unrecognised maps to 0', () => {
    // A typo'd or future verdict must not become a pass by default. Every
    // branch that is not an explicit PROVED exits non-zero.
    for (const v of ['PROVED', 'ok', '', null, undefined, 'succeeded']) {
      expect(exitCodeOf(v), `${String(v)} must not read as proved`).not.toBe(0);
    }
  });
});
