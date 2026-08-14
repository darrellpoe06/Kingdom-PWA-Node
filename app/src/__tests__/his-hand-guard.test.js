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

// ---------------------------------------------------------------------------
// 2026-08-14 — the guard was blind to its own subject's spelling, and to the
// place the classification actually costs Darrell an afternoon.
//
// Darrell: "now claude isn't reading the comprehensive Apps... did you this
// time?" The answer was no — COMPREHENSIVE-REVIEW-STANDARD had not been opened,
// and dimension 5 (run the DR-0108 challenge BEFORE classifying anything as
// his-hand) had been skipped while shipping infra/device-availability/RUNBOOK.md:
// six layers of paste-ready PowerShell marked "his-hand, on-site", for towers
// the remote-hands channel had reached twice that same day.
//
// TWO separate blindnesses let that scan clean:
//   1. HUMAN_ONLY matched "his hand" with a SPACE, never "his-hand" — the
//      hyphenated form the standard itself uses and runbooks actually write.
//   2. Only docs/reviews + docs/99-session-notes were scanned, so infra/
//      runbooks — where the handover happens — were never read at all.
import { findRunbookWithoutChannelChallenge } from '../../../scripts/his-hand-guard.mjs';

describe('the hyphenated spelling (the one the standard itself uses)', () => {
  it('CATCHES "his-hand" with a hyphen, not only "his hand"', () => {
    const line = 'Setup runbook (his-hand, on-site): do it yourself. re-review: 2026-09-01';
    expect(findUnjustifiedHisHand(line, 'x.md')).toHaveLength(1);
  });

  it('still catches the spaced form it always did', () => {
    const line = 'This is his hand only. re-review: 2026-09-01';
    expect(findUnjustifiedHisHand(line, 'x.md')).toHaveLength(1);
  });

  it('by-hand hyphenated too', () => {
    expect(findUnjustifiedHisHand('done by-hand. re-review: 2026-09-01', 'x.md')).toHaveLength(1);
  });
});

describe('closed history is not a live parking decision', () => {
  it('does NOT flag a ledger line that retells a by-hand call and says it was closed', () => {
    const line = 'documented as UI-only-by-hand while root-crontab-over-SSH worked - both closed. re-review: 2026-09-01';
    expect(findUnjustifiedHisHand(line, 'docs/reviews/REVIEWS.md')).toEqual([]);
  });
});

describe('runbooks are judged at DOCUMENT level (they never write re-review:)', () => {
  const paste = '# Setup\n\nThis is his-hand work.\n\n```powershell\nSet-Service -Name x\n```\n';

  it('FLAGS a runbook that hands over commands with no channel challenge', () => {
    expect(findRunbookWithoutChannelChallenge(paste, 'infra/x/RUNBOOK.md')).toHaveLength(1);
  });

  it('PASSES once the challenge names a channel', () => {
    const ok = paste + '\nThe remote-hands channel drives Layers 1-4; the tail is a secret onto a physical device.\n';
    expect(findRunbookWithoutChannelChallenge(ok, 'infra/x/RUNBOOK.md')).toEqual([]);
  });

  it('ignores a runbook with prose but NO paste blocks (nothing is handed over)', () => {
    expect(findRunbookWithoutChannelChallenge('his-hand work, described only.', 'infra/x/README.md')).toEqual([]);
  });

  it('ignores a paste block with no human-only framing', () => {
    expect(findRunbookWithoutChannelChallenge('# Deploy\n```sh\nmake\n```\n', 'infra/x/README.md')).toEqual([]);
  });

  it('never throws on junk', () => {
    for (const bad of [undefined, null, '', 42, {}]) {
      expect(() => findRunbookWithoutChannelChallenge(bad, 'x')).not.toThrow();
    }
  });
});
