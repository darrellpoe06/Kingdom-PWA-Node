// =============================================================================
// Debts tab — subtabs + the headline money (Darrell 2026-08-24)
// =============================================================================
// "Make these tabs next to each other so we know they exist instead of a long
// scrolling... add total payments up until today and total left to payoff with
// and without any added money... show when there is more than the minimum
// payment being made and when it's not and the difference in outcome to be
// obvious... all KPI's." These pins lock the pure math (lib/debt-outcomes.js)
// and prove the surface actually renders it — subtabs, pinned band, per-row
// pace badges.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  totalPaidDownFromPeaks, payoffOutlook, paymentPaceBadge, paceSummary,
} from '../lib/debt-outcomes.js';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('totalPaidDownFromPeaks — payments made until today, honestly measured', () => {
  it('sums peak-minus-balance across cards with a real recorded peak', () => {
    const r = totalPaidDownFromPeaks([
      { balance: 917, highestBalance: 1021 },            // 104 down
      { balance: 1347, highestBalance: 2939 },           // 1592 down
      { balance: 500, highestBalance: null },            // no peak — excluded
      { balance: 800, highestBalance: 800 },             // at peak — no progress
      { balance: 100, highestBalance: 900, leaveAlone: true }, // parked — excluded
    ]);
    expect(r.total).toBe(1696);
    expect(r.counted).toBe(2);
  });
  it('is zero-and-quiet with no data (never a painted number)', () => {
    expect(totalPaidDownFromPeaks([])).toEqual({ total: 0, counted: 0 });
  });
});

describe('payoffOutlook — left to pay, with and without the added money', () => {
  const debts = [{ balance: 1000 }, { balance: 2000 }, { balance: 500, leaveAlone: true }];
  it('with-plan = balances + snowball interest; minimums-only = balances + min-only interest', () => {
    const r = payoffOutlook(debts, { totalInterest: 1361 }, { totalInterest: 8661, stuckDebts: [] });
    expect(r.balance).toBe(3000);
    expect(r.withPlanTotal).toBe(4361);
    expect(r.minOnlyTotal).toBe(11661);
    expect(r.minOnlyFinishes).toBe(true);
    expect(r.saved).toBe(7300);
  });
  it('stuck debts mean minimums-only NEVER finishes — named, not totaled away', () => {
    const r = payoffOutlook(debts, { totalInterest: 100 }, { totalInterest: 900, stuckDebts: [{ id: 'x' }, { id: 'y' }] });
    expect(r.minOnlyFinishes).toBe(false);
    expect(r.stuckCount).toBe(2);
  });
});

describe('paymentPaceBadge — above / at / under the minimum, from observed payments', () => {
  it('above: observed pace clears the minimum with margin', () => {
    const b = paymentPaceBadge({ payPace: 200, minPayment: 100 });
    expect(b.tone).toBe('above');
    expect(b.label).toContain('above the $100 min');
  });
  it('at: pace within 5% of the minimum', () => {
    expect(paymentPaceBadge({ payPace: 101, minPayment: 100 }).tone).toBe('at');
  });
  it('under: pace visibly short of the minimum', () => {
    const b = paymentPaceBadge({ payPace: 60, minPayment: 100 });
    expect(b.tone).toBe('below');
    expect(b.label).toContain('under the $100 min');
  });
  it('growing outranks pace — charges outpacing payments is the truth that matters', () => {
    expect(paymentPaceBadge({ payPace: 500, minPayment: 100, growing: true }).tone).toBe('growing');
  });
  it('no observed pace -> null (silence, never a guess); parked -> null', () => {
    expect(paymentPaceBadge({ minPayment: 100 })).toBeNull();
    expect(paymentPaceBadge({ payPace: 200, minPayment: 100, leaveAlone: true })).toBeNull();
  });
  it('paceSummary rolls the tones up for the band', () => {
    const s = paceSummary([
      { payPace: 200, minPayment: 100 },
      { payPace: 60, minPayment: 100 },
      { growing: true, payPace: 10, minPayment: 100 },
      { minPayment: 100 },
    ]);
    expect(s).toEqual({ above: 1, at: 0, below: 1, growing: 1, unknown: 1 });
  });
});

describe('the Debts surface renders the merge', () => {
  const src = readFileSync(join(HERE, '..', 'components', 'Debts.jsx'), 'utf8');
  it('the long scroll became side-by-side subtabs (SectionTabs)', () => {
    expect(src).toMatch(/import SectionTabs from '\.\/SectionTabs\.jsx'/);
    expect(src).toMatch(/idBase="debts-sub"/);
    for (const id of ["id: 'all'", "id: 'plan'", "id: 'cascade'", "id: 'add'"]) {
      expect(src).toContain(id);
    }
  });
  it('the pinned band carries paid-down, both left-to-pay worlds, and the save', () => {
    expect(src).toMatch(/Paid down so far/);
    expect(src).toMatch(/Left to pay · minimums only/);
    expect(src).toMatch(/NEVER finish at minimums/);
    expect(src).toMatch(/The extra money saves/);
  });
  it('each debt row says whether more than the minimum is being made', () => {
    expect(src).toMatch(/paymentPaceBadge\(d\)/);
    expect(src).toMatch(/paceSummary/);
  });
});
