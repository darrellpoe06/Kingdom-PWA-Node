// =============================================================================
// concern-signals.test.js — the board self-organizes worst-first. The ranking is
// deterministic and explainable (no black box): overdue leads, then severity,
// then open-ness; a resolved concern sinks. Verifies the "needs attention" digest
// surfaces the few that matter instead of a flat scroll.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  concernSeverity, signalScore, signalReason, rankConcerns, signalSummary,
} from '../lib/concern-signals.js';

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

describe('concernSeverity — reads feedback eval, then derived severity, else normal', () => {
  it('prefers a feedback evaluation severity', () => {
    expect(concernSeverity({ evaluation: { severity: 'critical' }, severity: 'low' })).toBe('critical');
  });
  it('falls back to a derived card severity', () => {
    expect(concernSeverity({ severity: 'high' })).toBe('high');
  });
  it('defaults to normal', () => {
    expect(concernSeverity({})).toBe('normal');
  });
});

describe('signalScore — overdue dominates, done sinks', () => {
  it('ranks an overdue concern above a high-severity on-time one', () => {
    const overdue = { status: 'open', severity: 'low', targetDate: daysAgo(5) };
    const hot = { status: 'open', severity: 'high', targetDate: '2999-01-01' };
    expect(signalScore(overdue)).toBeGreaterThan(signalScore(hot));
  });
  it('ranks a done concern far below any active one', () => {
    const done = { status: 'done', severity: 'critical' };
    const open = { status: 'open', severity: 'noise', targetDate: '2999-01-01' };
    expect(signalScore(open)).toBeGreaterThan(signalScore(done));
  });
});

describe('rankConcerns — the top signals, worst-first, no done rows', () => {
  const all = [
    { id: 'done', concern: 'resolved', status: 'done', severity: 'critical' },
    { id: 'late', concern: 'overdue', status: 'open', severity: 'low', targetDate: daysAgo(3) },
    { id: 'hi', concern: 'high sev', status: 'open', severity: 'high', targetDate: '2999-01-01' },
    { id: 'lo', concern: 'low sev', status: 'open', severity: 'low', targetDate: '2999-01-01' },
  ];
  it('excludes done and orders overdue first, then severity', () => {
    const top = rankConcerns(all, { limit: 5 });
    expect(top.map((c) => c.id)).toEqual(['late', 'hi', 'lo']);
    expect(top.find((c) => c.id === 'done')).toBeUndefined();
  });
  it('respects the limit', () => {
    expect(rankConcerns(all, { limit: 1 }).map((c) => c.id)).toEqual(['late']);
  });
  it('is stable and safe on empty input', () => {
    expect(rankConcerns([])).toEqual([]);
    expect(rankConcerns(null)).toEqual([]);
  });
});

describe('signalReason — an honest one-line why-it-is-up-top', () => {
  it('reports overdue days first', () => {
    expect(signalReason({ status: 'open', targetDate: daysAgo(2) })).toMatch(/past target/);
  });
  it('reports severity when on time', () => {
    expect(signalReason({ status: 'open', severity: 'high', targetDate: '2999-01-01' })).toMatch(/high severity/);
  });
  it('reports the process source', () => {
    expect(signalReason({ status: 'open', source: 'coverage', targetDate: '2999-01-01' })).toMatch(/process check/);
  });
});

describe('signalSummary — the one observable line', () => {
  it('counts by feed and flags needs-attention', () => {
    const all = [
      { id: 'a', source: 'feedback', status: 'open', evaluation: { severity: 'critical' } },
      { id: 'b', source: 'coverage', status: 'open', severity: 'high' },
      { id: 'c', source: 'seed', status: 'in-progress' },
      { id: 'd', source: 'manual', status: 'done', targetDate: daysAgo(9) },
      { id: 'e', source: 'audit', status: 'open' },
    ];
    const s = signalSummary(all);
    expect(s.total).toBe(5);
    expect(s.feedback).toBe(1);
    expect(s.process).toBe(1);
    expect(s.audit).toBe(1);
    expect(s.curated).toBe(2); // seed + manual
    expect(s.done).toBe(1);
    // needs-attention = active AND (overdue OR high/critical): the critical feedback + high coverage
    expect(s.needsAttention).toBe(2);
  });
});
