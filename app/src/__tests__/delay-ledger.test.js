// @vitest-environment node
// delay-ledger — pinned (DR-0115 pairing): the metric is the family's wall
// clock, categories are real, governor-hold never counts as unnecessary, and
// an empty ledger reports zeros (never a painted average).
import { describe, it, expect } from 'vitest';
import { loadDelayLedger, delayStats, DELAY_CATEGORIES } from '../lib/delay-ledger.js';

describe('the seeded ledger', () => {
  it('carries the 2026-07-07 overnight deferral with the corrected wall-clock math', () => {
    const e = loadDelayLedger().find((x) => x.id === 'dl-2026-07-07-door-shell');
    expect(e).toBeTruthy();
    expect(e.category).toBe('agent-self-deferral');
    expect(e.wallClockHours).toBeGreaterThan(6);      // overnight — NOT "30 minutes"
    expect(e.unnecessaryDelayHours).toBeGreaterThan(5);
    expect(e.model).toBe('claude-fable-5');
  });
  it('every entry uses a declared category', () => {
    for (const e of loadDelayLedger()) expect(Object.keys(DELAY_CATEGORIES)).toContain(e.category);
  });
});

describe('delayStats', () => {
  it('totals and categorizes honestly', () => {
    const s = delayStats([
      { id: 'a', category: 'agent-self-deferral', unnecessaryDelayHours: 5.6, model: 'claude-fable-5' },
      { id: 'b', category: 'incomplete-verification', unnecessaryDelayHours: 0.15, model: 'claude-fable-5' },
      { id: 'c', category: 'governor-hold', unnecessaryDelayHours: 3, model: 'claude-fable-5' },
    ]);
    expect(s.count).toBe(3);
    expect(s.totalUnnecessaryHours).toBe(5.75);           // hold NEVER counts
    expect(s.byCategory['governor-hold'].hours).toBe(0);
    expect(s.byModel['claude-fable-5'].count).toBe(3);
    expect(s.worst.id).toBe('a');
  });
  it('an empty ledger reports zeros, never a painted number', () => {
    const s = delayStats([]);
    expect(s.count).toBe(0);
    expect(s.totalUnnecessaryHours).toBe(0);
    expect(s.worst).toBeNull();
  });
});
