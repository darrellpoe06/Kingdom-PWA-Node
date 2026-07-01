// @vitest-environment node
//
// monthCoverage + periodLabel — the data-completeness self-check and the
// window-aware tile label from the "April showed 2 of 296" incident (a sync cap
// silently truncated the ledger). Proven-to-catch: a thin month AND a missing
// month self-flag; a healthy span flags nothing; the tile label names the window.
import { describe, it, expect } from 'vitest';
import { monthCoverage } from '../lib/transaction-analysis.js';
import { periodLabel } from '../lib/imported-view.js';

// Build N rows in a given YYYY-MM.
const rows = (month, n) => Array.from({ length: n }, (_, i) => ({ date: `${month}-${String((i % 28) + 1).padStart(2, '0')}`, amount: 1 }));

describe('monthCoverage', () => {
  it('flags a thin month against its neighbors (the April=2 bug)', () => {
    const txns = [...rows('2026-01', 250), ...rows('2026-02', 240), ...rows('2026-03', 260), ...rows('2026-04', 2), ...rows('2026-05', 244)];
    const c = monthCoverage(txns);
    expect(c.median).toBeGreaterThan(200);
    expect(c.thin).toContain('2026-04');
    expect(c.thin).not.toContain('2026-03');
  });
  it('flags a completely MISSING month in the span (filled as 0)', () => {
    const txns = [...rows('2026-01', 200), /* Feb missing */ ...rows('2026-03', 210)];
    const c = monthCoverage(txns);
    expect(c.months.map(m => m.month)).toContain('2026-02');
    expect(c.thin).toContain('2026-02');
  });
  it('flags nothing when every month is healthy', () => {
    const txns = [...rows('2026-01', 200), ...rows('2026-02', 190), ...rows('2026-03', 210)];
    expect(monthCoverage(txns).thin).toEqual([]);
  });
  it('is safe on empty input', () => {
    expect(monthCoverage([])).toEqual({ months: [], thin: [], median: 0 });
  });
});

describe('periodLabel', () => {
  it('names a month key and the rolling presets', () => {
    expect(periodLabel('2026-04')).toBe('April 2026');
    expect(periodLabel('30d')).toBe('30 days');
    expect(periodLabel('all')).toBe('all time');
    expect(periodLabel('month')).toBe('this month');
  });
});
