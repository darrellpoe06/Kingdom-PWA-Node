// money-reimbursements.test.js — Phase 1.4: check #9879 ($2,200.88) written
// from Personal 7206 for Poe Properties, paid back by $2,201.00 from Poe
// Properties 3322 (Christina 2026-11-17, decision 5: linked, the $0.12
// difference shown, never assumed away). The amounts are the real ones; the
// days are a worked example (live rows are read only in the census).
import { describe, it, expect } from 'vitest';
import { receivableFromPayment, reimbursementCandidates, settleWithDeposit, reimbursementSummary, reimbursementDepositIds } from '../lib/reimbursements.js';

const PERSONAL = { id: 'e-personal', name: 'Personal' };
const PROPS = { id: 'e-props', name: 'Poe Properties' };
const ACCOUNTS = [
  { id: 'a-7206', entityId: 'e-personal', name: 'Chase 7206' },
  { id: 'a-3322', entityId: 'e-props', name: 'Chase 3322' },
];
const CHECK = { id: 'ck9879', date: '2026-11-05', accountId: 'a-7206', amount: -2200.88, description: 'CHECK 9879' };
const IN_7206 = { id: 'dep', date: '2026-11-12', accountId: 'a-7206', amount: 2201, description: 'ONLINE TRANSFER FROM CHK ...3322' };
const OUT_3322 = { id: 'out', date: '2026-11-12', accountId: 'a-3322', amount: -2201, description: 'ONLINE TRANSFER TO CHK ...7206' };
const PAYDAY = { id: 'pay', date: '2026-11-13', accountId: 'a-7206', amount: 2200, description: 'PAYROLL' };

describe('the check paid for Poe Properties', () => {
  const r = receivableFromPayment(CHECK, { paidFor: PROPS, paidBy: PERSONAL });
  it('is a receivable on Personal: Poe Properties owes $2,200.88', () => {
    expect(r).toMatchObject({ direction: 'receivable', counterparty: 'Poe Properties', amountCents: 220088, issuedOn: '2026-11-05', entitySlug: 'e-personal' });
    expect(reimbursementSummary(r, { today: '2026-11-06' })).toMatchObject({ status: 'open', balanceCents: 220088 });
  });
  it('a deposit is not a payment for it: money in only', () => {
    expect(receivableFromPayment({ ...CHECK, amount: 50 })).toBeNull();
  });
});

describe('the $2,201.00 transfer pays it back', () => {
  const r = receivableFromPayment(CHECK, { paidFor: PROPS, paidBy: PERSONAL });
  it('is found, and the transfer seen from both sides ranks above a deposit that merely matches the amount', () => {
    const c = reimbursementCandidates(r, CHECK, [CHECK, PAYDAY, IN_7206, OUT_3322], ACCOUNTS, { paidForEntityId: 'e-props' });
    expect(c.map((x) => x.transaction.id)).toEqual(['dep', 'pay']);
    expect(c[0]).toMatchObject({ differenceCents: 12, twinId: 'out' });
  });
  it('settles it: paid, with the $0.12 shown as a credit to Poe Properties (PROVEN TO CATCH: never rounded away)', () => {
    const settled = settleWithDeposit(r, IN_7206);
    const s = reimbursementSummary(settled, { today: '2026-11-13' });
    expect(s).toMatchObject({ status: 'paid', owedCents: 220088, paidCents: 220100, balanceCents: 0, creditCents: 12, differenceCents: 12 });
    expect(s.line).toBe('Poe Properties paid back $2,201.00 for $2,200.88: $0.12 more than owed, a credit to Poe Properties.');
  });
  it('the same deposit never settles it twice', () => {
    const twice = settleWithDeposit(settleWithDeposit(r, IN_7206), IN_7206);
    expect(twice.settlements).toHaveLength(1);
  });
  it('the pay-back is named so no total counts it as income', () => {
    expect([...reimbursementDepositIds([settleWithDeposit(r, IN_7206)])]).toEqual(['dep']);
  });
  it('a deposit before the check, or far outside the amount, is not a candidate', () => {
    const early = { ...IN_7206, id: 'early', date: '2026-11-01' };
    const big = { ...IN_7206, id: 'big', amount: 3000 };
    expect(reimbursementCandidates(r, CHECK, [early, big], ACCOUNTS, { paidForEntityId: 'e-props' })).toEqual([]);
  });
});
