// @vitest-environment node
//
// internal-transfers — "received" must be real income, not money moved between the
// family's own accounts (Darrell 2026-07-18, live: gross in/out ~$70-85k/mo was
// internal circulation double-counted, not income).
import { describe, it, expect } from 'vitest';
import { internalTransferIds, externalTotals } from '../lib/internal-transfers.js';

const accounts = [
  { id: 'chk' }, { id: 'sav' }, { id: 'card' },
];

describe('internalTransferIds — pair the two legs of an internal move', () => {
  it('eliminates a transfer pair across own accounts (both legs)', () => {
    const txns = [
      { id: 'o', accountId: 'chk', date: '2026-06-01', amount: -5000, description: 'ONLINE TRANSFER TO SAVINGS' },
      { id: 'i', accountId: 'sav', date: '2026-06-01', amount: 5000, description: 'ONLINE TRANSFER FROM CHECKING' },
    ];
    const ids = internalTransferIds(txns, accounts);
    expect(ids.has('o')).toBe(true);
    expect(ids.has('i')).toBe(true);
  });

  it('eliminates a credit-card payment (checking outflow <-> card inflow)', () => {
    const txns = [
      { id: 'pay', accountId: 'chk', date: '2026-06-10', amount: -1200, description: 'CHASE CREDIT CRD AUTOPAY' },
      { id: 'post', accountId: 'card', date: '2026-06-11', amount: 1200, description: 'PAYMENT THANK YOU' },
    ];
    const ids = internalTransferIds(txns, accounts);
    expect(ids.has('pay')).toBe(true);
    expect(ids.has('post')).toBe(true);
  });

  it('does NOT eliminate real income even if an unrelated expense equals it (no move hint)', () => {
    const txns = [
      { id: 'pay', accountId: 'chk', date: '2026-06-15', amount: 2000, description: 'ACH PAYROLL DEPOSIT' },
      { id: 'rent', accountId: 'sav', date: '2026-06-16', amount: -2000, description: 'RENT TO LANDLORD' },
    ];
    const ids = internalTransferIds(txns, accounts);
    expect(ids.size).toBe(0); // neither leg looks like an internal move -> both kept
  });

  it('requires the legs to be on DIFFERENT own accounts', () => {
    const txns = [
      { id: 'a', accountId: 'chk', date: '2026-06-01', amount: -500, description: 'ZELLE TRANSFER' },
      { id: 'b', accountId: 'chk', date: '2026-06-01', amount: 500, description: 'ZELLE TRANSFER' }, // same account
    ];
    expect(internalTransferIds(txns, accounts).size).toBe(0);
  });

  it('respects the date window (a far-apart pair is not matched)', () => {
    const txns = [
      { id: 'o', accountId: 'chk', date: '2026-06-01', amount: -700, description: 'TRANSFER TO SAVINGS' },
      { id: 'i', accountId: 'sav', date: '2026-06-20', amount: 700, description: 'TRANSFER FROM CHECKING' },
    ];
    expect(internalTransferIds(txns, accounts, { dayWindow: 5 }).size).toBe(0);
  });

  it('an account not owned by the family never participates', () => {
    const txns = [
      { id: 'o', accountId: 'chk', date: '2026-06-01', amount: -900, description: 'TRANSFER' },
      { id: 'i', accountId: 'EXTERNAL', date: '2026-06-01', amount: 900, description: 'TRANSFER' },
    ];
    expect(internalTransferIds(txns, accounts).size).toBe(0);
  });
});

describe('externalTotals — true external flow, with what was excluded reported', () => {
  it('sums real income/spend and reports the excluded internal circulation', () => {
    const rows = [
      { id: 'sal', amount: 2000, category: 'salary' },     // real income
      { id: 'gro', amount: -300, category: 'groceries' },  // real spend
      { id: 'o', amount: -5000, category: 'other' },       // internal (in exclusion set)
      { id: 'i', amount: 5000, category: 'other' },        // internal (in exclusion set)
      { id: 'x', amount: 100, category: 'transfer' },      // already-tagged transfer
    ];
    const internalIds = new Set(['o', 'i']);
    const t = externalTotals(rows, internalIds);
    expect(t.in).toBe(2000);   // only real salary — NOT the 5000 internal, NOT the 100 transfer
    expect(t.out).toBe(300);   // only real groceries — NOT the 5000 internal leg
    expect(t.net).toBe(1700);
    expect(t.internalIn).toBe(5100);  // 5000 pair leg + 100 tagged transfer
    expect(t.internalOut).toBe(5000);
    expect(t.internalCount).toBe(3);
  });
});
