import { describe, it, expect } from 'vitest';
import { settledSum, accountBalance, deriveBalances } from '../lib/account-balances.js';

// These tests are the gate behind DR-0076 (verification doctrine): they prove
// account balances are DERIVED from the ledger and not static literals. The
// liveness assertions below would FAIL against a regression that returned
// account.balance directly — that is what makes this gate proven-to-catch.

const TODAY = '2026-06-17';

// Mirrors the live SEED_DATA Chase ...8168 account exactly: openingBalance
// -130.29 plus the eight settled rows below net to the known $4,223. Keeping
// this fixture in lockstep with the seed makes the reconciliation test a real
// gate — if the seed opening or history drifts so the math no longer ties out
// to 4,223, this fails (proven-to-catch, DR-0076).
const CHASE = { id: 'a-chase', balance: 4223, openingBalance: -130.29 };
const CHASE_TX = [
  { id: 't-h90', accountId: 'a-chase', date: '2026-03-05', amount: -1450 },
  { id: 't-h60', accountId: 'a-chase', date: '2026-04-02', amount: -842.17 },
  { id: 't-h30', accountId: 'a-chase', date: '2026-04-20', amount: -520 },
  { id: 't1', accountId: 'a-chase', date: '2026-05-01', amount: 500 },
  { id: 't5', accountId: 'a-chase', date: '2026-05-04', amount: 1150 },
  { id: 't7', accountId: 'a-chase', date: '2026-05-06', amount: 2099.93 },
  { id: 't11', accountId: 'a-chase', date: '2026-05-14', amount: 2865.53 },
  { id: 't13', accountId: 'a-chase', date: '2026-05-15', amount: 550 },
  // A future-dated row that must NOT count toward the current balance.
  { id: 'future', accountId: 'a-chase', date: '2026-12-01', amount: -302 },
];

describe('settledSum — net of settled history only', () => {
  it('sums settled rows for the account and excludes future-dated ones', () => {
    expect(settledSum('a-chase', CHASE_TX, TODAY)).toBeCloseTo(4353.29, 2);
  });

  it('ignores rows belonging to other accounts', () => {
    const mixed = [...CHASE_TX, { id: 'x', accountId: 'other', date: '2026-05-01', amount: 9999 }];
    expect(settledSum('a-chase', mixed, TODAY)).toBeCloseTo(4353.29, 2);
  });

  it('returns 0 for an account with no transactions', () => {
    expect(settledSum('a-empty', CHASE_TX, TODAY)).toBe(0);
  });
});

describe('accountBalance — reconciliation and liveness', () => {
  it('reconciles opening + settled history to the known current balance', () => {
    expect(accountBalance(CHASE, CHASE_TX, TODAY)).toBeCloseTo(4223, 2);
  });

  it('is LIVE: a newly added settled expense lowers the balance', () => {
    // The anti-static gate. A static `return account.balance` would keep this
    // at 4223 and fail. A real $833.53 expense flows through to the balance.
    const withExpense = [...CHASE_TX, { id: 'new', accountId: 'a-chase', date: '2026-06-16', amount: -833.53 }];
    const before = accountBalance(CHASE, CHASE_TX, TODAY);
    const after = accountBalance(CHASE, withExpense, TODAY);
    expect(after).toBeCloseTo(before - 833.53, 2);
    expect(after).toBeCloseTo(3389.47, 2);
  });

  it('is LIVE: a newly added settled deposit raises the balance', () => {
    const withIncome = [...CHASE_TX, { id: 'pay', accountId: 'a-chase', date: '2026-06-16', amount: 2500 }];
    expect(accountBalance(CHASE, withIncome, TODAY)).toBeCloseTo(4223 + 2500, 2);
  });

  it('falls back to the stored balance when no openingBalance is set', () => {
    const acct = { id: 'a-plain', balance: 1200 };
    expect(accountBalance(acct, [], TODAY)).toBe(1200);
  });

  it('a future-dated transaction does not move the current balance', () => {
    const onlyFuture = [{ id: 'f', accountId: 'a-x', date: '2099-01-01', amount: -50 }];
    const acct = { id: 'a-x', balance: 100 };
    expect(accountBalance(acct, onlyFuture, TODAY)).toBe(100);
  });
});

describe('deriveBalances — full map', () => {
  it('derives a balance for every account', () => {
    const accounts = [CHASE, { id: 'a-plain', balance: 1200 }];
    const map = deriveBalances(accounts, CHASE_TX, TODAY);
    expect(map['a-chase']).toBeCloseTo(4223, 2);
    expect(map['a-plain']).toBe(1200);
  });
});
