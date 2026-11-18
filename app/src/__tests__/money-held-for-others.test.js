// Money held for someone else (Christina 2026-11-18): $55 came into Chase 7206
// from Christiana's account (GMR ...3800) for Christina to pay Christiana's
// tithe. It is not Christina's earnings, not her own tithe, and not money she
// can spend; when the tithe is paid for Christiana the two are one pass-through.
import { describe, it, expect } from 'vitest';
import { heldForOthers, isHeldForOthers, HELD_CATEGORY } from '../lib/held-for-others.js';
import { isTransferTxn } from '../lib/imported-view.js';
import { allIncomeModel, allOutputsModel } from '../lib/finance-reports.js';
import { buildSafeToSpend } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import { TX_CATEGORIES, categoryLabel } from '../lib/categorize.js';
import { tierOfCategory } from '../lib/spending-priorities.js';

const IN55 = { id: 'gmr', accountId: 'a-7206', date: '2026-11-15', description: 'Transfer from GMR ...3800', amount: 55, category: HELD_CATEGORY };
const TITHE_FOR_HER = { id: 'tithe-c', accountId: 'a-7206', date: '2026-11-19', description: 'Zelle payment to TLC', amount: -55, category: HELD_CATEGORY };
const MY_TITHE = { id: 'tithe-me', accountId: 'a-7206', date: '2026-11-16', description: 'Zelle payment to TLC', amount: -837, category: 'tithes' };

describe('the category', () => {
  it('is a category she can choose, read as "Held for someone else (passed along)"', () => {
    expect(TX_CATEGORIES).toContain(HELD_CATEGORY);
    expect(categoryLabel(HELD_CATEGORY)).toBe('Held for someone else (passed along)');
    expect(isHeldForOthers(IN55)).toBe(true);
  });
  it('is a movement like a transfer: not her earnings, not spending, not her giving', () => {
    expect(isTransferTxn(IN55)).toBe(true);
    expect(isTransferTxn(TITHE_FOR_HER)).toBe(true);
    expect(tierOfCategory(HELD_CATEGORY)).toBeNull();
  });
});

describe('the reports', () => {
  const rows = [
    IN55,
    TITHE_FOR_HER,
    MY_TITHE,
    { id: 'pay', accountId: 'a-7206', date: '2026-11-14', description: 'PAYROLL', amount: 1912.4, category: 'salary' },
  ];
  it('All income leaves the $55 out; only her own pay is income', () => {
    const m = allIncomeModel(rows, {});
    expect(m.total.in).toBe(1912.4);
  });
  it('All outputs keeps her own $837 tithe and leaves the tithe paid for Christiana out', () => {
    const m = allOutputsModel(rows, {});
    expect(m.total.out).toBe(837);
  });
});

describe('the pass-through, paired', () => {
  it('received $55, not yet passed along: $55 still held', () => {
    const h = heldForOthers([IN55]);
    expect(h.outstanding).toBe(55);
    expect(h.stillHeld.map((r) => r.id)).toEqual(['gmr']);
  });
  it('once the tithe is paid for her, the two pair and nothing is held', () => {
    const h = heldForOthers([IN55, TITHE_FOR_HER, MY_TITHE]);
    expect(h.pairs.map((p) => [p.received.id, p.passedAlong.id, p.amount])).toEqual([['gmr', 'tithe-c', 55]]);
    expect(h.outstanding).toBe(0);
  });
  it('her own tithe is never paired with Christiana’s money', () => {
    const h = heldForOthers([IN55, MY_TITHE]);
    expect(h.pairs).toEqual([]);
    expect(h.outstanding).toBe(55);
  });
  it('a payment dated before the money arrived, or on another account, does not pair', () => {
    expect(heldForOthers([IN55, { ...TITHE_FOR_HER, date: '2026-11-10' }]).pairs).toEqual([]);
    expect(heldForOthers([IN55, { ...TITHE_FOR_HER, accountId: 'a-3322' }]).pairs).toEqual([]);
  });
  it('nothing in the books is changed by pairing', () => {
    const ledger = [IN55, TITHE_FOR_HER];
    const frozen = JSON.stringify(ledger);
    heldForOthers(ledger);
    expect(JSON.stringify(ledger)).toBe(frozen);
  });
});

describe('Safe-to-Spend sets her money aside until it is passed along', () => {
  const asOf = new Date(2026, 10, 17, 12);
  const base = (rows) => ({
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
    accounts: [{ id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
    transactions: [{ id: 'cp', ...balanceCheckpointRow('a-7206', 2559.78, '2026-11-17', { basis: 'available' }) }, ...rows],
    recurringObligations: [],
    inflows: { salaries: [], rentals: [] },
    moneyPlan: { settings: {} },
  });
  it('the $55 still held is subtracted once, shown as its own line, and named', () => {
    const withHeld = buildSafeToSpend(base([IN55]), { currentDate: asOf, scope: 'personal' });
    const without = buildSafeToSpend(base([{ ...IN55, category: 'other' }]), { currentDate: asOf, scope: 'personal' });
    expect(withHeld.lines.availableCash).toBe(2559.78);
    expect(withHeld.lines.heldForOthers).toBe(55);
    expect(Math.round((without.lines.projectedLowest.amount - withHeld.lines.projectedLowest.amount) * 100) / 100).toBe(55);
    expect(withHeld.assumptions.join(' ')).toMatch(/\$55 in the account is held for someone else/);
  });
  it('once passed along, nothing is set aside', () => {
    const r = buildSafeToSpend(base([IN55, { ...TITHE_FOR_HER, date: '2026-11-16' }]), { currentDate: asOf, scope: 'personal' });
    expect(r.lines.heldForOthers).toBe(0);
  });
});

describe('on the import card', () => {
  it('choosing "held for someone else" on the GMR row is remembered for the next GMR transfer', async () => {
    const { rulesFromDecisions } = await import('../lib/ledger-edit.js');
    const { reviewLineItems } = await import('../lib/intake-row-review.js');
    const { payeeKey } = await import('../lib/categorize.js');
    const rules = rulesFromDecisions([{ description: 'Transfer from GMR ...3800', amount: 55 }], { 0: { category: HELD_CATEGORY } });
    expect(rules).toEqual([{ description: 'Transfer from GMR ...3800', category: HELD_CATEGORY }]);
    const learned = { [payeeKey(rules[0].description)]: HELD_CATEGORY };
    const [next] = reviewLineItems([{ date: '2026-12-01', description: 'Transfer from GMR ...3800', amount: 60 }], {}, learned);
    expect(next).toMatchObject({ category: HELD_CATEGORY, categorySource: 'your rule' });
  });
});

describe('the six safeguards before merge (Christina 2026-11-18)', () => {
  const asOf = new Date(2026, 10, 20, 12);
  const book = (rows) => ({
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
    accounts: [{ id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
    transactions: [{ id: 'cp', ...balanceCheckpointRow('a-7206', 2559.78, '2026-11-17', { basis: 'available' }) }, ...rows],
    recurringObligations: [],
    inflows: { salaries: [], rentals: [] },
    moneyPlan: { settings: {} },
  });
  const sts = (rows) => buildSafeToSpend(book(rows), { currentDate: asOf, scope: 'personal' });

  it('the tithe paid for her is taken off once: cash falls by $55 and nothing more is set aside', () => {
    const before = sts([]);
    const received = sts([{ ...IN55, date: '2026-11-18' }]);
    const paid = sts([
      { ...IN55, date: '2026-11-18' },
      { ...TITHE_FOR_HER, date: '2026-11-19' },
    ]);
    // Received: +$55 in the account, $55 set aside: what she can spend is unchanged.
    expect(received.lines.availableCash).toBe(2614.78);
    expect(received.lines.projectedLowest.amount).toBe(before.lines.projectedLowest.amount);
    // Paid: the $55 has left the account once, and no set-aside remains: unchanged again, never $55 less.
    expect(paid.lines.availableCash).toBe(2559.78);
    expect(paid.lines.heldForOthers).toBe(0);
    expect(paid.lines.projectedLowest.amount).toBe(before.lines.projectedLowest.amount);
  });

  it('an unrelated $55 on the same day is never paired and never set aside', () => {
    const coffee = { id: 'x', accountId: 'a-7206', date: '2026-11-19', description: 'CIRCLE K', amount: -55, category: 'fuel' };
    const deposit = { id: 'y', accountId: 'a-7206', date: '2026-11-18', description: 'REFUND', amount: 55, category: 'other' };
    const h = heldForOthers([IN55, coffee, deposit]);
    expect(h.pairs).toEqual([]);
    expect(h.stillHeld.map((r) => r.id)).toEqual(['gmr']);
    expect(heldForOthers([coffee, deposit]).outstanding).toBe(0);
  });
});
