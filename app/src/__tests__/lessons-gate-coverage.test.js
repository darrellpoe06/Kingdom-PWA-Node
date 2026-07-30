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
});
