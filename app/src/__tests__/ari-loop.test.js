// ari-loop — proven-to-catch tests for the MAPE-K control loop: it composes the
// review + the gate into a measured loop, applies only the safe fixes, logs
// them, and reports a REAL straight-through rate (never painted).
import { describe, it, expect } from 'vitest';
import {
  runAriLoop, controlMetrics, loopHeadline, MAPE_K_STAGES, AUTONOMY_STAGES,
  CURRENT_AUTONOMY_STAGE,
} from '../lib/ari-loop.js';

const NOW = '2026-07-13T18:00:00.000Z';
// A review-shaped input: findings the gate will split (2 auto, 1 propose).
const review = {
  summary: { status: 'warning' },
  dimensions: [{ key: 'delivery' }, { key: 'data' }],
  findings: [
    { dimension: 'delivery', severity: 'warning', title: 'Board drift', evidence: '2 rows', action: 're-sync the board' },
    { dimension: 'data', severity: 'nit', title: 'Derived stale', evidence: '1', action: 'recompute the derived value' },
    { dimension: 'data', severity: 'bug', title: 'Payment mismatch', evidence: '1', action: 'recompute the payment balance' },
  ],
};

describe('ari-loop — the MAPE-K loop', () => {
  it('names all five MAPE-K stages and marks the live autonomy stage', () => {
    expect(MAPE_K_STAGES.map((s) => s.key)).toEqual(['monitor', 'analyze', 'plan', 'execute', 'knowledge']);
    expect(AUTONOMY_STAGES.some((s) => s.key === CURRENT_AUTONOMY_STAGE)).toBe(true);
    expect(CURRENT_AUTONOMY_STAGE).toBe('gated-auto');
  });

  it('runs the loop: monitors, plans via the gate, executes only the safe fixes, logs them', () => {
    const loop = runAriLoop(review, NOW);
    expect(loop.monitor.findings).toBe(3);
    expect(loop.monitor.dimensions).toBe(2);
    // 2 safe (re-sync, recompute derived) auto; the payment one is an exception
    expect(loop.plan.auto).toHaveLength(2);
    expect(loop.plan.propose).toHaveLength(1);
    expect(loop.execute.appliedCount).toBe(2);
    expect(loop.knowledge.log).toHaveLength(2);
    expect(loop.knowledge.log.every((e) => e.reversible && e.by === 'Ari' && e.appliedIso === NOW)).toBe(true);
  });

  it('the payment finding is NEVER auto-executed (it stays an exception)', () => {
    const loop = runAriLoop(review, NOW);
    expect(loop.plan.propose[0].title).toBe('Payment mismatch');
    expect(loop.knowledge.log.some((e) => /payment/i.test(e.title))).toBe(false);
  });
});

describe('ari-loop — the measured control metric (STP), never painted', () => {
  it('straight-through rate = auto / (auto + propose), rounded', () => {
    expect(controlMetrics({ auto: [1, 2], propose: [3] }).stpRate).toBe(67); // 2/3
    expect(controlMetrics({ auto: [], propose: [] }).stpRate).toBe(0);       // nothing to do
    expect(controlMetrics({ auto: [1, 2, 3], propose: [] }).stpRate).toBe(100);
  });
  it('the loop reports its real STP from real findings', () => {
    const loop = runAriLoop(review, NOW);
    expect(loop.metrics.total).toBe(3);
    expect(loop.metrics.autoCount).toBe(2);
    expect(loop.metrics.stpRate).toBe(67);
  });
  it('a clean review yields an honest empty loop, not a fake 100%', () => {
    const loop = runAriLoop({ findings: [], dimensions: [] }, NOW);
    expect(loop.metrics.total).toBe(0);
    expect(loop.metrics.stpRate).toBe(0);
    expect(loopHeadline(loop)).toMatch(/data is sound/i);
  });
  it('the headline reads the real split', () => {
    expect(loopHeadline(runAriLoop(review, NOW))).toMatch(/applied 2 of 3.*67%/);
  });
});
