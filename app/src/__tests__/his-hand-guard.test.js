// his-hand-guard — proven-to-catch (DR-0076 Section 3): a review line that
// parks work as human-only WITHOUT a DR-0108 channel justification must be
// caught; a justified line and a bare narrative line must pass.
import { describe, it, expect } from 'vitest';
import { findUnjustifiedHisHand } from '../../../scripts/his-hand-guard.mjs';

describe('his-hand-guard — DR-0108 capability re-sync (COMPREHENSIVE-REVIEW-STANDARD dim 5)', () => {
  it('CATCHES a bare human-only carry with no channel justification', () => {
    const bad = 'the NAS bearer rotation is Darrell’s hand — re-review: 2026-08-01';
    const f = findUnjustifiedHisHand(bad, 'x.md');
    expect(f.length).toBe(1);
  });
  it('PASSES when the human tail is justified against the channels', () => {
    for (const s of [
      'rotation is channel-drivable via nas-rotate-bearer; only the secret-onto-device typing is Darrell’s hand — re-review: 2026-08-01',
      'flip the flag in the Supabase Studio dashboard by hand — re-review: 2026-08-06',
      'this is a bright line only Darrell decides — re-review: 2026-08-06',
    ]) {
      expect(findUnjustifiedHisHand(s, 'x.md').length, s).toBe(0);
    }
  });
  it('IGNORES historical narrative that merely mentions by-hand with no active re-review carry', () => {
    const narrative = 'Findings: the board misread a busy lane; the deploy was done by hand that night.';
    expect(findUnjustifiedHisHand(narrative, 'x.md').length).toBe(0);
  });
});
