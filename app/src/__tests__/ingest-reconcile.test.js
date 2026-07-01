// @vitest-environment node
//
// ingest-reconcile — the reconciliation gate. Proven-to-catch: a workbook with a
// blank row, a repeated header, a subtotal, and a bad-date row loses NONE of
// them silently — each is rejected-with-reason and the counts balance
// (ingested + rejected === source). An unbalanced count fails loudly.
import { describe, it, expect } from 'vitest';
import { ingestRows, reconcile, perMonthCounts, REJECT } from '../lib/ingest-reconcile.js';

const HEADER = ['Date', 'Amount', 'Description'];
const nd = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s)) ? String(s) : (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(String(s)) ? String(s) : null));

describe('reconcile — the gate', () => {
  it('balances only when nothing is unaccounted', () => {
    expect(reconcile(300, 296, 4).balanced).toBe(true);
    const bad = reconcile(300, 296, 0);
    expect(bad.balanced).toBe(false);
    expect(bad.unaccounted).toBe(4);
    expect(bad.message).toMatch(/UNBALANCED/);
  });
});

describe('ingestRows — no row silently dropped', () => {
  const rows = [
    ['2026-04-01', '-50', 'County Market'],   // accepted
    ['', '', ''],                              // blank -> rejected
    ['Date', 'Amount', 'Description'],         // repeated header -> rejected
    ['Total', '', ''],                         // subtotal -> rejected
    ['not-a-date', '-9', 'Bad date row'],      // unparseable date -> rejected
    ['2026-04-03', 'NaN$', 'Bad amount row'],  // unparseable amount -> rejected
    ['2026-04-05', '1200', 'Payroll'],         // accepted
  ];
  const res = ingestRows(rows, { header: HEADER, dateIdx: 0, amountIdx: 1, descIdx: 2, normalizeDate: nd });

  it('accepts the good rows and rejects the rest WITH reasons', () => {
    expect(res.accepted.map((r) => r.description)).toEqual(['County Market', 'Payroll']);
    const reasons = res.rejected.map((r) => r.reason);
    expect(reasons).toContain(REJECT.BLANK);
    expect(reasons).toContain(REJECT.HEADER);
    expect(reasons).toContain(REJECT.SUBTOTAL);
    expect(reasons).toContain(REJECT.NO_DATE);
    expect(reasons).toContain(REJECT.NO_AMOUNT);
  });
  it('reconciles: ingested + rejected === source (nothing vanished)', () => {
    expect(res.reconciliation.balanced).toBe(true);
    expect(res.accepted.length + res.rejected.length).toBe(rows.length);
    expect(res.reconciliation.unaccounted).toBe(0);
  });
  it('does NOT stop early at the blank/subtotal row (the tail survives)', () => {
    // Payroll is the LAST row, after the blank/header/subtotal/bad rows.
    expect(res.accepted.some((r) => r.description === 'Payroll')).toBe(true);
  });
  it('tolerates a mixed (US m/d/y) date format', () => {
    const r = ingestRows([['4/7/2026', '-12', 'Mixed date']], { header: HEADER, normalizeDate: nd });
    expect(r.accepted).toHaveLength(1);
  });
  it('perMonthCounts summarizes accepted coverage', () => {
    expect(perMonthCounts(res.accepted)).toEqual({ '2026-04': 2 });
  });
});
