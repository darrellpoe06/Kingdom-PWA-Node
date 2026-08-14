// lessons-gate-coverage — proven-to-catch (DR-0076 §3): a NEW lesson with no
// gate citation must fail; a cited one and a grandfathered one must pass. This
// is the meter that makes "failures become deterministic engineering" (DR-0239)
// an ENFORCED, shrink-only citation number rather than an assertion.
import { describe, it, expect } from 'vitest';
import { findUnguardedPrinciples, coverage, UNCITED_BASELINE } from '../../../scripts/lessons-gate-coverage.mjs';

describe('lessons-gate-coverage — every lesson names its gate or its why-no-gate', () => {
  it('CATCHES a NEW uncited principle (no gate, no why-no-gate)', () => {
    const doc = '- **P99 — a brand-new lesson.** It describes a failure but names no machine check at all.';
    const { fresh } = coverage(doc);
    expect(fresh.some((g) => g.id === 'P99')).toBe(true);
  });
  it('PASSES a lesson that cites a gate, and one that states why no gate is possible', () => {
    const gated = '- **P98 — a lesson.** Fix: guarded by foo-guard.mjs, proven-to-catch in foo.test.js.';
    expect(findUnguardedPrinciples(gated).some((g) => g.id === 'P98')).toBe(false);
    const disc = '- **P97 — an unwritten-backlog lesson.** No gate can see it; the control is declaration-time discipline.';
    expect(findUnguardedPrinciples(disc).some((g) => g.id === 'P97')).toBe(false);
  });
  it('is a real, non-empty grandfather baseline (shrink-only, like the monolith ratchet)', () => {
    expect(UNCITED_BASELINE.size).toBeGreaterThan(0);
  });

  // THE METER MUST NOT PAINT ITS OWN NUMBER (DR-0303, 2026-08-14).
  //
  // Writing P40 — which cites two test files and ends "pairs with P31, P26,
  // P15" — silently "healed" P15, P26 and P31, none of which had gained a
  // citation. The line filter credited every principle NAMED on a line with the
  // gate belonging to the principle that OWNED it. Correcting it moved the
  // honest figure from 22/40 (55%) to 12/40 (30%): roughly ten principles had
  // been counted as cited on a neighbour's evidence.
  //
  // This is P38's own failure recurring inside P38's own instrument — its first
  // version read "19% coverage" off the terse index summaries and had to be
  // rebuilt against the real artifact. A meter that flatters itself is worse
  // than no meter, because it is trusted.
  describe('a cross-reference is not a citation', () => {
    it('does not credit a principle named in ANOTHER principle\'s declaration line', () => {
      const doc = [
        '- **P50 — an uncited lesson.** It names no machine check whatsoever.',
        '- **P51 — a gated lesson.** Gate: fifty-one-guard.mjs, proven-to-catch in fifty-one.test.js. Pairs with P50.',
      ].join('\n');
      const gaps = findUnguardedPrinciples(doc);
      expect(gaps.some((g) => g.id === 'P50'), 'P50 borrowed P51\'s gate').toBe(true);
      expect(gaps.some((g) => g.id === 'P51')).toBe(false);
    });

    it('does not credit a principle listed on a **Cross-refs:** see-also line', () => {
      const doc = [
        '- **P52 — an uncited lesson.** It names no machine check whatsoever.',
        '**Cross-refs:** DR-0303, P52, `something-real.test.js`, a-real-guard.mjs.',
      ].join('\n');
      expect(findUnguardedPrinciples(doc).some((g) => g.id === 'P52')).toBe(true);
    });

    it('still credits a real incident-body line that NAMES the principle and its gate', () => {
      // The legitimate case the line filter exists for must keep working. Note
      // the line has to mention the id — the filter is per-line, so a Fix line
      // that never says "P53" was never evidence for P53 in the first place.
      // (My first draft of this case asserted otherwise and failed, which is
      // the check doing its job on the test rather than the code.)
      const doc = [
        '- **P53 — a lesson.** The narrative, with no citation on this line.',
        '**Fix:** P53 is guarded by fifty-three-guard.mjs, proven-to-catch in fifty-three.test.js.',
      ].join('\n');
      expect(findUnguardedPrinciples(doc).some((g) => g.id === 'P53')).toBe(false);
    });
  });
});
