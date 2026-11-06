// money-loans-grace.test.js — a loan payment whose due date has passed unpaid is
// OWED NOW, with its grace state, never rolled forward to next month (Darrell,
// 2026-11-05: six First State Bank loans, 15-day grace, "Reserve money for
// unpaid obligations even during the grace period"; "Do not count a transfer
// as a mortgage payment"; "Never count the same money twice").
//
// His real shape: loan 5312, $825.42, contractually due October 25, unpaid on
// November 5; Poe Properties pays from Chase 3322; rent arrives in Cash App and
// is moved to Chase afterwards.
import { describe, it, expect } from 'vitest';
import { buildSafeToSpend, obligationEvents, resolveScope, billStatusOf, BILL_DUE_STATUS_LABEL, addDays } from '../lib/safe-to-spend.js';
import { toObligation } from '../lib/bill-review.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';

const at = (y, m, d) => new Date(y, m - 1, d, 12);
const day = (y, m, d) => new Date(y, m - 1, d);

function poe({ loan = {}, tx = [], rentalMortgage = true } = {}) {
  const obligation = {
    id: 'ob-5312', name: 'First State Bank loan 5312', group: 'rental', type: 'regular', enabled: true,
    amount: 825.42, frequency: 'monthly', nextDue: '2026-10-25', accountId: 'a-3322', entityId: 'e-poeprops', rentalId: 'r-709',
    graceDays: 15, ...loan,
  };
  return {
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }, { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' }],
    accounts: [
      { id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 },
      { id: 'a-3322', name: 'Chase 3322', type: 'checking', entityId: 'e-poeprops', balance: 0 },
    ],
    transactions: [
      { id: 'cp1', ...balanceCheckpointRow('a-3322', 2539.53, '2026-11-04', { basis: 'available' }) },
      { id: 'cp2', ...balanceCheckpointRow('a-7206', 5774, '2026-11-05', { basis: 'available' }) },
      ...tx,
    ],
    recurringObligations: [obligation],
    inflows: { salaries: [], rentals: [{ id: 'r-709', name: '709 Commercial St', entityId: 'e-poeprops', status: 'paying', rent: 700,
      mortgage: rentalMortgage ? { balance: 60000, rate: 6.5, monthlyPI: 825.42, escrow: 0 } : { balance: 0, rate: 0, monthlyPI: 0, escrow: 0 } }] },
    moneyPlan: { settings: { reserveByEntity: { personal: 10000 }, rentDueDay: 1, mortgageDueDay: 25 } },
  };
}
const events = (d, today, days = 30) => {
  const sc = resolveScope(d, 'e-poeprops');
  const start = day(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return obligationEvents(d, sc, start, addDays(start, days), d.moneyPlan.settings, { asOf: start });
};
const loanRows = (ob) => ob.events.filter((e) => /loan 5312/i.test(e.label));

describe('a missed due date is owed now, in its grace state (PROVEN TO CATCH)', () => {
  it('Nov 5: the October 25 payment is counted ONCE, today, overdue, due date kept, within the 15-day grace (ends Nov 9); November 25 is still coming', () => {
    const ob = events(poe(), at(2026, 11, 5));
    const rows = loanRows(ob);
    const missed = rows.find((e) => e.overdue);
    expect(missed, 'the unpaid October payment is in Bills Due').toBeTruthy();
    expect(missed.date).toBe('2026-11-05');
    expect(missed.dueDate).toBe('2026-10-25');
    expect(missed.amount).toBe(-825.42);
    expect(missed.graceEndsOn).toBe('2026-11-09');
    expect(billStatusOf(missed)).toBe('in-grace');
    expect(rows.filter((e) => e.date === '2026-11-25' && !e.overdue)).toHaveLength(1);
    expect(rows).toHaveLength(2);
  });
  it('Nov 12: the same payment is past the grace period, still owed once', () => {
    const rows = loanRows(events(poe(), at(2026, 11, 12)));
    const missed = rows.find((e) => e.overdue);
    expect(billStatusOf(missed)).toBe('past-grace');
    expect(rows.filter((e) => e.overdue)).toHaveLength(1);
  });
  it('the two grace states have their own labels beside the existing four', () => {
    expect(BILL_DUE_STATUS_LABEL['in-grace']).toMatch(/grace/i);
    expect(BILL_DUE_STATUS_LABEL['past-grace']).toMatch(/past.*grace/i);
    expect(Object.keys(BILL_DUE_STATUS_LABEL)).toEqual(expect.arrayContaining(['overdue', 'pending', 'confirmed', 'inferred']));
  });
  it('a payment the ledger shows on Oct 27 settles the October occurrence: paid and cleared, never subtracted again', () => {
    const d = poe({ tx: [{ id: 'p1', date: '2026-10-27', accountId: 'a-3322', amount: -825.42, description: 'FIRST STATE BANK LOAN 5312 PMT', category: 'other' }] });
    const ob = events(d, at(2026, 11, 5));
    expect(loanRows(ob).filter((e) => e.overdue)).toHaveLength(0);
    const cleared = (ob.settled || []).filter((e) => /loan 5312/i.test(e.label));
    expect(cleared).toHaveLength(1);
    expect(cleared[0].settled).toBe('paid-in-ledger');
    expect(loanRows(ob).map((e) => e.date)).toEqual(['2026-11-25']);
  });
  it('a separate late charge is owed now, once', () => {
    const ob = events(poe({ loan: { lateFees: 41.27 } }), at(2026, 11, 5));
    const fees = ob.events.filter((e) => /late fee/i.test(e.label));
    expect(fees).toHaveLength(1);
    expect(fees[0].amount).toBe(-41.27);
    expect(fees[0].overdue).toBe(true);
  });
  it('Safe to Spend for Poe Properties reserves the missed payment: the lowest projected balance already has it taken out', () => {
    const r = buildSafeToSpend(poe(), { currentDate: at(2026, 11, 5), period: '7d', scope: 'e-poeprops' });
    // $2,539.53 checked Nov 4, minus the $825.42 owed now and nothing else inside 7 days except rent arriving.
    expect(r.lines.projectedLowest.amount).toBeLessThanOrEqual(2539.53 - 825.42 + 0.01);
  });
});

describe('which records are read that way: tracked loans and confirmed bills, never a merely stale date', () => {
  it('a bill with no grace period, CONFIRMED on Nov 3 with its due date already past (Oct 25), is owed now', () => {
    const ob = events(poe({ loan: { graceDays: null, verified: true, verifiedAt: '2026-11-03T15:00:00.000Z' } }), at(2026, 11, 5));
    const rows = loanRows(ob);
    expect(rows.filter((e) => e.overdue && e.dueDate === '2026-10-25')).toHaveLength(1);
    expect(billStatusOf(rows.find((e) => e.overdue))).toBe('overdue');
  });
  it('a record whose due date merely went stale (no grace period, never confirmed) keeps the roll-forward and is named, so nothing is invented', () => {
    const ob = events(poe({ loan: { graceDays: null, verifiedAt: null } }), at(2026, 11, 5));
    expect(loanRows(ob).map((e) => e.date)).toEqual(['2026-11-25']);
    expect(ob.assumptions.some((a) => /due date on file \(2026-10-25\) has passed/.test(a))).toBe(true);
  });
  it('a loan whose record is three months stale counts ONLY the latest missed cycle and names the earlier ones, never stacking them', () => {
    const ob = events(poe({ loan: { nextDue: '2026-07-25' } }), at(2026, 11, 5));
    const owed = loanRows(ob).filter((e) => e.overdue);
    expect(owed).toHaveLength(1);
    expect(owed[0].dueDate).toBe('2026-10-25');
    expect(ob.assumptions.some((a) => /3 earlier due dates also passed/.test(a))).toBe(true);
  });
  it('a planned pay date on or after today carries the missed payment: it is counted on that day, not also today', () => {
    const ob = events(poe({ loan: { payOn: '2026-11-07' } }), at(2026, 11, 5));
    const rows = loanRows(ob);
    expect(rows.filter((e) => e.overdue)).toHaveLength(0);
    expect(rows[0].date).toBe('2026-11-07');
  });
});

describe('one loan, one line: the confirmed loan bill and the property record never both count', () => {
  it('a rental bill marked as the mortgage on its property replaces the record-derived P&I line', () => {
    const ob = events(poe({ loan: { linkedMortgageId: 'r-709' } }), at(2026, 11, 5));
    expect(ob.events.filter((e) => e.kind === 'mortgage')).toHaveLength(0);
    expect(loanRows(ob).length).toBeGreaterThan(0);
  });
  it('an unlinked rental bill (say, insurance) leaves the property P&I line in place', () => {
    const ob = events(poe({ loan: { name: 'State Farm 709 Commercial', amount: 120, graceDays: null, nextDue: '2026-11-20' } }), at(2026, 11, 5));
    expect(ob.events.filter((e) => e.kind === 'mortgage')).toHaveLength(1);
  });
  it('the review form stores the loan fields and the mortgage link for a rental bill', () => {
    const o = toObligation({ name: 'First State Bank loan 5312', group: 'rental', amount: '825.42', nextDue: '2026-10-25', entityId: 'e-poeprops', rentalId: 'r-709', isMortgage: true, graceDays: '15', lateFees: '41.27', rate: '6.5', lender: 'First State Bank', accountLast4: '5312' });
    expect(o.linkedMortgageId).toBe('r-709');
    expect(o.graceDays).toBe(15);
    expect(o.lateFees).toBe(41.27);
    expect(o.rate).toBe(6.5);
    expect(o.lender).toBe('First State Bank');
    expect(o.accountLast4).toBe('5312');
    const notMortgage = toObligation({ name: 'State Farm', group: 'rental', amount: '120', nextDue: '2026-11-20', entityId: 'e-poeprops', rentalId: 'r-709' });
    expect(notMortgage.linkedMortgageId).toBeNull();
  });
});

describe('rent arrives once: a Cash App transfer landing in Chase is never income (PROVEN TO CATCH)', () => {
  it('a pending $700 Cash App transfer dated tomorrow on Chase 3322 is not expected income and not a bill', () => {
    const d = poe({ tx: [{ id: 'ca1', date: '2026-11-06', accountId: 'a-3322', amount: 700, description: 'CASH APP*DARRELL POE 1234 Transfer', category: null }] });
    const ob = events(d, at(2026, 11, 5), 14);
    expect(ob.events.filter((e) => /cash app/i.test(e.label))).toHaveLength(0);
  });
});

describe('the Personal reserve is protected', () => {
  it('$5,774 verified against a $10,000 reserve: Safe to Spend is $0, never negative, and the reserve is the one on the personal key', () => {
    const r = buildSafeToSpend(poe(), { currentDate: at(2026, 11, 5), period: '7d', scope: 'personal' });
    expect(r.safeToSpendNow).toBe(0);
    expect(r.lines.minCushion).toBe(10000);
  });
});
