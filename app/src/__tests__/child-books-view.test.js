// child-books-view.test.js — the child money view is REAL (derived from the books)
// and holds the DR-0112 posture: provoke to good works (giving + saving
// foregrounded), read-only, no deficit/shame framing.
import { describe, it, expect } from 'vitest';
import {
  childBooksView, goodWorksFromBooks, normalizeChildViewMode,
  CHILD_VIEW_MODES, DEFAULT_CHILD_VIEW_MODE,
} from '../lib/child-books-view.js';

const ASOF = new Date('2026-07-01T00:00:00Z');

// A small REAL-shaped family: income, a giving bucket, a savings account with
// cleared history, and spending buckets.
const DATA = {
  accounts: [
    { id: 'chk', name: 'Checking', type: 'checking', openingBalance: 1000 },
    { id: 'sav', name: 'Buffer Fund', type: 'savings', openingBalance: 2000 },
    { id: 'card', name: 'Card', type: 'credit', openingBalance: 0 },
  ],
  transactions: [
    { id: 't1', date: '2026-06-01', accountId: 'sav', amount: 500 },  // saved more
    { id: 't2', date: '2026-06-15', accountId: 'chk', amount: -200 }, // spent
  ],
  inflows: { salaries: [{ actual: 5000 }], rentals: [] },
  outflows: { rentalMortgages: 0, propertyUtilities: 300, household: 1800, debtService: 700, charitableGiving: 500 },
};

describe('mode selection', () => {
  it('defaults to the child-safe teaching mode; unknown falls back', () => {
    expect(DEFAULT_CHILD_VIEW_MODE).toBe('teaching');
    expect(CHILD_VIEW_MODES).toContain('raw');
    expect(normalizeChildViewMode('nonsense')).toBe('teaching');
    expect(normalizeChildViewMode('raw')).toBe('raw');
  });
});

describe('good works are real and foregrounded (DR-0112)', () => {
  it('names giving and saving from the REAL numbers', () => {
    const gw = goodWorksFromBooks(DATA, ASOF);
    const giving = gw.find((g) => g.key === 'giving');
    const saving = gw.find((g) => g.key === 'saving');
    expect(giving.amount).toBe(500);          // real charitableGiving bucket
    expect(saving.amount).toBe(2500);          // 2000 opening + 500 saved
    // every good work carries an invitation (provoke TO good works)
    for (const g of gw) expect(g.invite).toMatch(/you (can|are)/i);
  });
});

describe('teaching view — the stewardship flow, giving first, no shame', () => {
  const v = childBooksView(DATA, { mode: 'teaching', asOf: ASOF });
  it('is read-only and derived (real income/giving/saving)', () => {
    expect(v.mode).toBe('teaching');
    expect(v.readOnly).toBe(true);
    const income = v.flow.find((f) => f.key === 'income');
    const giving = v.flow.find((f) => f.key === 'giving');
    const saving = v.flow.find((f) => f.key === 'saving');
    expect(income.amount).toBe(5000);
    expect(giving.amount).toBe(500);
    expect(saving.amount).toBe(2500);
  });
  it('foregrounds giving + saving as the good works, and giving comes before spending', () => {
    const keys = v.flow.map((f) => f.key);
    expect(keys.indexOf('giving')).toBeLessThan(keys.indexOf('spending'));
    expect(v.flow.find((f) => f.key === 'giving').goodWork).toBe(true);
    expect(v.flow.find((f) => f.key === 'saving').goodWork).toBe(true);
  });
  it('provokes to good works + opens toward prayer, never a deficit/shame verdict', () => {
    expect(v.invitation).toMatch(/good work|invited/i);
    expect(v.prayerPrompt).toBeTruthy();
    const blob = JSON.stringify(v).toLowerCase();
    // no shaming / deficit framing in the child-facing copy
    expect(blob).not.toMatch(/deficit|behind|broke|can'?t afford|overspent|shortfall/);
  });
});

describe('raw view — real accounts, read-only, still names the good works', () => {
  const v = childBooksView(DATA, { mode: 'raw', asOf: ASOF });
  it('lists real accounts with derived balances and excludes nothing spendable', () => {
    expect(v.mode).toBe('raw');
    expect(v.readOnly).toBe(true);
    const sav = v.accounts.find((a) => a.id === 'sav');
    expect(sav.balance).toBe(2500);
    expect(v.monthly.income).toBe(5000);
    expect(v.monthly.giving).toBe(500);
  });
  it('still carries the good works (provocation holds even in raw mode)', () => {
    expect(v.goodWorks.map((g) => g.key).sort()).toEqual(['giving', 'saving']);
  });
});

describe('no acting — seeing is not spending', () => {
  it('the view-model exposes no mutator', () => {
    const v = childBooksView(DATA, { asOf: ASOF });
    for (const val of Object.values(v)) expect(typeof val).not.toBe('function');
  });
});
