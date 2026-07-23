// @vitest-environment node
//
// deriveDebts + reviewStatus — the money-loop pieces that make Debts a live view
// of real debt (credit/loan accounts + rental mortgages) and score the
// categorize/verify step. Proven-to-catch: owed side only, needsTerms flag,
// rental mortgages pulled, zero-balance skipped, no double-count of cash.
import { describe, it, expect } from 'vitest';
import { deriveDebts, liveCashOnHand } from '../lib/financial-engineering.js';
import { reviewStatus } from '../lib/transaction-analysis.js';

const ASOF = new Date('2026-06-30T00:00:00Z');

describe('deriveDebts', () => {
  it('pulls a credit account with money owed (derived < 0) as a debt', () => {
    const data = {
      accounts: [{ id: 'a-loc', name: 'Line of Credit', fragment: '1818', type: 'credit', balance: -8705.41, entityId: 'e1' }],
      transactions: [],
    };
    const debts = deriveDebts(data, ASOF);
    expect(debts).toHaveLength(1);
    expect(debts[0].balance).toBeCloseTo(8705.41, 2); // owed shown positive
    expect(debts[0].needsTerms).toBe(true); // no rate / minPayment
    expect(debts[0].source).toBe('account');
  });
  it('uses the DERIVED balance (opening + cleared txns), not the stored literal', () => {
    const data = {
      accounts: [{ id: 'a-loc', name: 'LOC', type: 'credit', balance: -8705.41, entityId: 'e1' }],
      transactions: [{ accountId: 'a-loc', date: '2026-01-01', amount: -1242.94 }],
    };
    expect(deriveDebts(data, ASOF)[0].balance).toBeCloseTo(9948.35, 2);
  });
  it('does not treat a credit account in credit (positive balance) as debt', () => {
    const data = { accounts: [{ id: 'a', type: 'credit', balance: 50, entityId: 'e1' }], transactions: [] };
    expect(deriveDebts(data, ASOF)).toHaveLength(0);
  });
  it('ignores cash accounts entirely (no double-count)', () => {
    const data = { accounts: [{ id: 'a', type: 'checking', balance: -20, entityId: 'e1' }], transactions: [] };
    expect(deriveDebts(data, ASOF)).toHaveLength(0);
  });
  it('surfaces a MIS-TYPED imported credit card (name-classified + owed) on Debts', () => {
    // The bank feed synced this card as 'checking'; nothing auto-types it, so it
    // never reached Debts before. Name + a genuinely owed (negative) balance now do.
    const data = {
      accounts: [{ id: 'a-cc', name: 'Chase Credit Card', fragment: '8168', type: 'checking', balance: -2400, entityId: 'e1' }],
      transactions: [],
    };
    const debts = deriveDebts(data, ASOF);
    expect(debts).toHaveLength(1);
    expect(debts[0].balance).toBeCloseTo(2400, 2);
    expect(debts[0].debtType).toBe('credit');
    expect(debts[0].accountId).toBe('a-cc');
  });
  it('does NOT name-classify a debt-worded account that is in the positive (not owed)', () => {
    const data = { accounts: [{ id: 'a', name: 'Discover Savings', type: 'savings', balance: 500 }], transactions: [] };
    expect(deriveDebts(data, ASOF)).toHaveLength(0);
  });
  it('uses the DATA-derived APR over any stored rate (no human can undermine it)', () => {
    const data = {
      accounts: [{ id: 'a-cc', name: 'Visa', type: 'credit', balance: -3000, rate: 9.99, entityId: 'e1' }],
      transactions: [
        { id: 'i1', accountId: 'a-cc', date: '2026-05-15', amount: -60, description: 'INTEREST CHARGE' },
        { id: 'i2', accountId: 'a-cc', date: '2026-06-15', amount: -60, description: 'INTEREST CHARGE' },
        { id: 'p1', accountId: 'a-cc', date: '2026-05-01', amount: 400, description: 'PAYMENT' },
        { id: 'p2', accountId: 'a-cc', date: '2026-06-01', amount: 400, description: 'PAYMENT' },
        { id: 'p3', accountId: 'a-cc', date: '2026-06-30', amount: 400, description: 'PAYMENT' },
      ],
    };
    const d = deriveDebts(data, ASOF)[0];
    expect(d.rateSource).toBe('derived');
    expect(d.rate).toBeGreaterThan(9.99);   // the real ~24% APR, not the typed 9.99
    expect(d.hasPayments).toBe(true);
    expect(d.payPace).toBeGreaterThan(0);
  });
  it('falls back to the stored (user-editable) rate when the data shows no interest', () => {
    const data = {
      accounts: [{ id: 'a-cc', name: 'Visa', type: 'credit', balance: -3000, rate: 18.99 }],
      transactions: [{ id: 'p1', accountId: 'a-cc', date: '2026-06-01', amount: 400, description: 'PAYMENT' }],
    };
    const d = deriveDebts(data, ASOF)[0];
    expect(d.rate).toBe(18.99);
    expect(d.rateSource).toBe('manual');
  });
  it('MANUAL override: an account the user marks treatAsDebt shows on Debts (balance = owed)', () => {
    const data = {
      accounts: [{ id: 'a-card', name: 'My Credit Card', type: 'checking', balance: 1500, treatAsDebt: true, entityId: 'e1' }],
      transactions: [],
    };
    const debts = deriveDebts(data, ASOF);
    expect(debts).toHaveLength(1);
    expect(debts[0].balance).toBeCloseTo(1500, 2); // magnitude counted as owed
    expect(debts[0].accountId).toBe('a-card');
  });
  it('"Add as debt" with a blank balance still SHOWS (manual debt at $0 owed stays on the tab)', () => {
    // The add panel invites "Leave blank to add it now and set the balance later",
    // creating a treatAsDebt credit account at balance 0. It must still render a row
    // (with balance 0 + the inline "+ owed" editor) — dropping it here made the
    // "Add as debt" tap go nowhere (the reported Debts-tab bug).
    const data = {
      accounts: [{ id: 'a-new', name: 'Cardmember Serv Pymt', type: 'credit', treatAsDebt: true, balance: 0, minPayment: 110, entityId: 'e1' }],
      transactions: [],
    };
    const debts = deriveDebts(data, ASOF);
    expect(debts).toHaveLength(1);
    expect(debts[0].accountId).toBe('a-new');
    expect(debts[0].balance).toBe(0);
    expect(debts[0].manual).toBe(true);      // shows the inline "+ owed" editor
    expect(debts[0].minPayment).toBe(110);   // pre-filled from the observed payment
  });
  it('a paid-off (feed-typed) credit account at $0 does NOT show — only user-declared debts survive at $0', () => {
    // Guard the fix's boundary: a plain typed credit account (not treatAsDebt) at a
    // zero balance is a paid-off card and must stay hidden, so the $0-shows rule is
    // scoped to the family's own "this is a debt" declaration, not the feed.
    const data = { accounts: [{ id: 'a-paid', name: 'Visa', type: 'credit', balance: 0, entityId: 'e1' }], transactions: [] };
    expect(deriveDebts(data, ASOF)).toHaveLength(0);
  });
  it('a treatAsDebt account leaves cash totals (no double-count as both cash and debt)', () => {
    const data = {
      accounts: [
        { id: 'a-cash', name: 'Checking', type: 'checking', balance: 2000, entityId: 'e1' },
        { id: 'a-card', name: 'Card', type: 'checking', balance: 1500, treatAsDebt: true, entityId: 'e1' },
      ],
      transactions: [],
    };
    expect(liveCashOnHand(data, ASOF).total).toBeCloseTo(2000, 2); // the marked account is NOT cash
    expect(deriveDebts(data, ASOF)).toHaveLength(1);               // it IS a debt
  });
  it('unmarking (treatAsDebt false) removes it from Debts', () => {
    const data = { accounts: [{ id: 'a', name: 'Checking', type: 'checking', balance: 1500, treatAsDebt: false }], transactions: [] };
    expect(deriveDebts(data, ASOF)).toHaveLength(0);
  });
  it('pulls rental mortgages with a real balance + carries their terms', () => {
    const data = {
      accounts: [],
      inflows: { rentals: [
        { id: 'r1', name: '1003 Koehn', entityId: 'e2', mortgage: { balance: 120000, rate: 6.5, monthlyPI: 900 } },
        { id: 'r2', name: 'No-mortgage', entityId: 'e2', mortgage: { balance: 0, rate: 0, monthlyPI: 0 } },
      ] },
    };
    const debts = deriveDebts(data, ASOF);
    expect(debts).toHaveLength(1);
    expect(debts[0].name).toBe('1003 Koehn mortgage');
    expect(debts[0].balance).toBe(120000);
    expect(debts[0].needsTerms).toBe(false); // has rate + P&I
    expect(debts[0].source).toBe('rental');
  });
});

describe('reviewStatus', () => {
  it('counts categorized (verified) vs needs-review (other/blank)', () => {
    const s = reviewStatus([
      { category: 'groceries' }, { category: 'dining' }, { category: 'other' }, { category: null }, {},
    ]);
    expect(s.categorized).toBe(2);
    expect(s.needsReview).toBe(3);
    expect(s.total).toBe(5);
    expect(s.pctCategorized).toBe(40);
  });
  it('is safe on empty input', () => {
    expect(reviewStatus([])).toEqual({ categorized: 0, needsReview: 0, total: 0, pctCategorized: 0 });
  });
});
