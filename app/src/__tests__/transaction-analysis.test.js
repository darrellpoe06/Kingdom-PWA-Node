// @vitest-environment node
//
// transaction-analysis — sort / filter / evaluate the ledger. Proven-to-catch:
// each filter clause narrows correctly, each sort key + direction is stable, and
// the category summary's income/outflow/net reconcile (totalNet == sum of cats ==
// sum of amounts). This is the math Darrell + Christina judge their money by.
import { describe, it, expect } from 'vitest';
import { filterTransactions, sortTransactions, categorySummary } from '../lib/transaction-analysis.js';

const T = [
  { id: '1', date: '2026-05-01', accountId: 'a', amount: 500, description: 'Payroll', category: 'salary' },
  { id: '2', date: '2026-05-10', accountId: 'a', amount: -80, description: 'County Market', category: 'groceries' },
  { id: '3', date: '2026-04-20', accountId: 'b', amount: -1200, description: 'Rent', category: 'household' },
  { id: '4', date: '2026-05-15', accountId: 'b', amount: 200, description: 'Zelle from Lloyd', category: 'other' },
];
const ACC = (id) => ({ a: 'Main Checking', b: 'Savings' }[id] || id);

describe('filterTransactions', () => {
  it('filters by account', () => {
    expect(filterTransactions(T, { accountId: 'a' }).map((t) => t.id)).toEqual(['1', '2']);
  });
  it('filters by date range (inclusive)', () => {
    expect(filterTransactions(T, { dateFrom: '2026-05-01', dateTo: '2026-05-12' }).map((t) => t.id)).toEqual(['1', '2']);
  });
  it('filters by category', () => {
    expect(filterTransactions(T, { category: 'groceries' }).map((t) => t.id)).toEqual(['2']);
  });
  it('searches description + category (case-insensitive)', () => {
    expect(filterTransactions(T, { search: 'zelle' }).map((t) => t.id)).toEqual(['4']);
    expect(filterTransactions(T, { search: 'GROCER' }).map((t) => t.id)).toEqual(['2']);
  });
  it('combines clauses (AND)', () => {
    expect(filterTransactions(T, { accountId: 'b', dateFrom: '2026-05-01' }).map((t) => t.id)).toEqual(['4']);
  });
  it('an empty filter passes everything through', () => {
    expect(filterTransactions(T, {})).toHaveLength(4);
  });
});

describe('sortTransactions', () => {
  it('by date desc (default) / asc', () => {
    expect(sortTransactions(T, 'date', 'desc').map((t) => t.id)).toEqual(['4', '2', '1', '3']);
    expect(sortTransactions(T, 'date', 'asc').map((t) => t.id)).toEqual(['3', '1', '2', '4']);
  });
  it('by amount asc puts the biggest debit first', () => {
    expect(sortTransactions(T, 'amount', 'asc')[0].id).toBe('3'); // -1200
    expect(sortTransactions(T, 'amount', 'desc')[0].id).toBe('1'); // +500
  });
  it('by account name (not id)', () => {
    expect(sortTransactions(T, 'account', 'asc', ACC).map((t) => ACC(t.accountId))[0]).toBe('Main Checking');
  });
  it('by payee + category', () => {
    expect(sortTransactions(T, 'payee', 'asc')[0].description).toBe('County Market');
    expect(sortTransactions(T, 'category', 'asc')[0].category).toBe('groceries');
  });
  it('is stable on ties', () => {
    const ties = [{ id: 'x', date: '2026-05-01', amount: 1 }, { id: 'y', date: '2026-05-01', amount: 1 }];
    expect(sortTransactions(ties, 'date', 'asc').map((t) => t.id)).toEqual(['x', 'y']);
  });
});

describe('categorySummary — the evaluate math reconciles', () => {
  it('splits income vs outflow per category and totals reconcile', () => {
    const s = categorySummary(T);
    expect(s.totalIncome).toBe(700);     // 500 + 200
    expect(s.totalOutflow).toBe(-1280);  // -80 + -1200
    expect(s.totalNet).toBe(-580);
    // ledger integrity: sum of category nets == grand net == sum of amounts
    expect(s.categories.reduce((a, c) => a + c.net, 0)).toBeCloseTo(-580, 2);
    expect(s.categories.reduce((a, c) => a + c.net, 0)).toBeCloseTo(T.reduce((a, t) => a + t.amount, 0), 2);
  });
  it('leads with the biggest gross mover', () => {
    expect(categorySummary(T).categories[0].category).toBe('household'); // 1200 gross
  });
  it('counts per category', () => {
    const cat = (s, k) => s.categories.find((c) => c.category === k);
    const s = categorySummary(T);
    expect(cat(s, 'salary').count).toBe(1);
    expect(cat(s, 'salary').income).toBe(500);
  });
});
