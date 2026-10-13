// =============================================================================
// Every number on Debts defends itself (Darrell 2026-08-24)
// =============================================================================
// "need to be able to evaluate the debts for all data that supports the number
// in each cell like our standards... click and see the source and meta data
// available... asap.... or slow because of the risks etc... either way is
// understood based on the data." These pins lock the pure trace builders
// (lib/debt-trace.js) to the number-trace standard and prove the surface
// actually wires them — band cells and all four table cells.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  traceDebtRate, traceDebtBalance, traceDebtMin, traceDebtPayoff,
  traceTotalDebt, tracePaidDown, traceLeftToPay, traceSaved,
} from '../lib/debt-trace.js';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('rate trace — provenance is named, never guessed', () => {
  it('statement-derived rates say so', () => {
    const t = traceDebtRate({ name: 'Amex', rate: 28.49, rateKnown: true, rateSource: 'derived' });
    expect(t.sources[0].value).toContain('statement-derived');
    expect(t.result).toEqual({ value: 28.49, kind: 'percent' });
  });
  it('an override shows BOTH the typed value and what the statements say', () => {
    const t = traceDebtRate({ name: 'Chase', rate: 20, rateKnown: true, rateSource: 'override', dataRate: 24.99 });
    expect(t.sources.some((s) => s.value === 'override')).toBe(true);
    expect(t.sources.some((s) => s.value === 24.99)).toBe(true);
  });
  it('an unknown rate is unknown-not-zero, and a range names both ends', () => {
    expect(traceDebtRate({ name: 'X' }).sources[0].value).toContain('unknown');
    const r = traceDebtRate({ name: 'Avant', rate: 35.99, rateMin: 29.99, rateKnown: true });
    expect(r.inputs).toHaveLength(2);
    expect(r.formula).toContain('HIGH end');
  });
});

describe('payoff trace — asap or slow, understood from the data', () => {
  it('a growing balance states the risk plainly: no payoff date at this pace', () => {
    const t = traceDebtPayoff({ name: 'X', growing: true });
    expect(t.result.value).toBe('not going down');
    expect(t.note).toContain('no payoff date');
  });
  it('an observed-pace date shows the net-paydown math and its transaction source', () => {
    const t = traceDebtPayoff({ name: 'Y', estPayoffOnTrack: true, estPayoffMonths: 14, payPace: 450, netPaydown: 300 });
    expect(t.formula).toContain('NET paydown');
    expect(t.inputs.some((i) => i.value === 300)).toBe(true);
    expect(t.sources[0].value).toBe('observed payments');
  });
  it('a snowball date says it is projected, not observed', () => {
    const t = traceDebtPayoff({ name: 'Z' }, 7);
    expect(t.sources[0].value).toContain('projected');
  });
  it('no payments + no terms = honest silence with the way to earn a date', () => {
    const t = traceDebtPayoff({ name: 'W', hasPayments: false });
    expect(t.result.value).toBe('no payments seen');
    expect(t.note).toContain('rate and minimum');
  });
});

describe('band traces — the headline cells show their arithmetic', () => {
  it('total debt sums active balances and excludes parked debts', () => {
    const t = traceTotalDebt([{ name: 'A', balance: 100 }, { name: 'B', balance: 50, leaveAlone: true }]);
    expect(t.result.value).toBe(100);
    expect(t.sources[0].label).toContain('1 active');
  });
  it('paid-down names the peak-record basis and the honest non-claim on interest', () => {
    const t = tracePaidDown({ total: 21160, counted: 12 });
    expect(t.result.value).toBe(21160);
    expect(t.formula).toContain('not claimed');
  });
  it('left-to-pay splits balance vs interest for both worlds; saved is the difference', () => {
    const outlook = { balance: 201000, withPlanTotal: 201854, minOnlyTotal: 209400, minOnlyFinishes: false, stuckCount: 6, saved: 7546 };
    const w = traceLeftToPay(outlook, true, 4500);
    expect(w.inputs.find((i) => i.label.includes('Interest')).value).toBe(854);
    const m = traceLeftToPay(outlook, false, 4500);
    expect(m.sources[0].label).toContain('NEVER finish');
    expect(traceSaved(outlook).result.value).toBe(7546);
  });
  it('balance/min traces carry account provenance', () => {
    const b = traceDebtBalance({ name: 'C', balance: 917, highestBalance: 1021, accountId: 'a1', utilization: 95, creditLimit: 969 });
    expect(b.note).toContain('104');
    expect(b.sources.some((s) => s.value === 1021)).toBe(true);
    expect(traceDebtMin({ name: 'C', minPayment: 82 }).sources[0].value).toBe('recorded');
  });
});

describe('the surface wires the traces (tap any number for its sources)', () => {
  const src = readFileSync(join(HERE, '..', 'components', 'Debts.jsx'), 'utf8');
  it('band cells carry trace props', () => {
    expect(src).toMatch(/trace=\{traceTotalDebt\(debts\)\}/);
    expect(src).toMatch(/trace=\{tracePaidDown\(paidDown\)\}/);
    expect(src).toMatch(/trace=\{traceLeftToPay\(outlook, true, debtSnowballExtra\)\}/);
    expect(src).toMatch(/trace=\{traceSaved\(outlook\)\}/);
  });
  it('all four table cells are TraceableNumber-wrapped', () => {
    expect(src).toMatch(/traceDebtRate\(d\)/);
    expect(src).toMatch(/traceDebtMin\(d\)/);
    expect(src).toMatch(/traceDebtBalance\(d\)/);
    expect(src).toMatch(/traceDebtPayoff\(d,/);
  });
  it('the table is sortable five ways and says numbers are tappable', () => {
    for (const key of ["['rate','Rate']", "['balance','Balance']", "['payoff','Payoff date']", "['min','Payment']", "['name','A–Z']"]) {
      expect(src).toContain(key);
    }
    expect(src).toMatch(/tap any number for its sources/);
  });
});
