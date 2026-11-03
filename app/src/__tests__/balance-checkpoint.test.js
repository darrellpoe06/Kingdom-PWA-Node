// A verified balance is true at the end of its own day, whatever history is
// imported around it (Christina's Chase 7206, 2026-11-03).
//
// MEASURED on her live ledger export: the account stored $4,350.42 — the balance
// she typed on 2026-07-31 — as the anchor of a ledger that begins 2025-11-17, so
// every row since November was added on top and the app showed $26,428.38 while
// Chase showed $8,346.51 on 2026-10-29. These cases pin the checkpoint that
// replaces that anchor, and each one fails on the anchor-only derivation.
import { describe, it, expect } from 'vitest';
import { deriveAccountBalances, applyManualBalance, balanceCheckpointRow, latestCheckpoints } from '../lib/financial-engineering.js';
import { isBalanceAdjustment, balanceCheckpoint, totals } from '../lib/imported-view.js';
import { transactionToRow, rowToTransaction } from '../lib/transactions-sync.js';

const day = (s) => new Date(`${s}T12:00:00`);

// Her shape, in small: an anchor that is really a July balance, history from
// November, and the bank's figure on Oct 29.
function hersInSmall() {
  return {
    accounts: [{ id: 'chk', type: 'checking', balance: 4350.42 }],
    transactions: [
      { id: 'n1', date: '2025-11-17', accountId: 'chk', amount: 9000 },
      { id: 'j1', date: '2026-07-15', accountId: 'chk', amount: 2682.38 },
      { id: 'o1', date: '2026-10-28', accountId: 'chk', amount: -40 },
      { id: 'o2', date: '2026-10-29', accountId: 'chk', amount: 3288.7 },
      { id: 'o3', date: '2026-10-30', accountId: 'chk', amount: -768.57 },
    ],
  };
}

describe('a verified checkpoint outranks the anchor', () => {
  it('the defect it closes: the anchor alone adds all history on top of a typed current balance', () => {
    const data = hersInSmall();
    expect(deriveAccountBalances(data, day('2026-10-29')).chk).toBe(19281.5); // 4350.42 + 9000 + 2682.38 − 40 + 3288.70
  });

  it('a checkpoint makes that day read exactly what the bank said', () => {
    const data = hersInSmall();
    data.transactions.push(balanceCheckpointRow('chk', 8346.51, '2026-10-29', { basis: 'available', source: 'Chase export' }));
    expect(deriveAccountBalances(data, day('2026-10-29')).chk).toBe(8346.51);
  });

  it('counts forward from the checkpoint, and only rows that have cleared by the day asked', () => {
    const data = hersInSmall();
    data.transactions.push(balanceCheckpointRow('chk', 8346.51, '2026-10-29'));
    expect(deriveAccountBalances(data, day('2026-10-30')).chk).toBe(7577.94); // − 768.57
    expect(deriveAccountBalances(data, day('2026-10-29')).chk).toBe(8346.51); // the 10-30 row has not cleared yet
  });

  it('counts back from the checkpoint for a day before it', () => {
    const data = hersInSmall();
    data.transactions.push(balanceCheckpointRow('chk', 8346.51, '2026-10-29'));
    expect(deriveAccountBalances(data, day('2026-10-28')).chk).toBe(5057.81); // 8346.51 − 3288.70
  });

  it('PROVEN TO CATCH: older history imported AFTER the checkpoint does not move today', () => {
    const data = hersInSmall();
    data.transactions.push(balanceCheckpointRow('chk', 8346.51, '2026-10-29'));
    data.transactions.push({ id: 'late', date: '2026-03-02', accountId: 'chk', amount: 5000 });
    expect(deriveAccountBalances(data, day('2026-10-29')).chk).toBe(8346.51);
    // ...whereas a delta correction (the old way) is thrown off by the same import:
    const old = hersInSmall();
    old.transactions.push({ id: 'adj', date: '2026-10-29', accountId: 'chk', amount: round2(8346.51 - 19281.5), category: 'balance-adjustment' });
    expect(deriveAccountBalances(old, day('2026-10-29')).chk).toBe(8346.51);
    old.transactions.push({ id: 'late', date: '2026-03-02', accountId: 'chk', amount: 5000 });
    expect(deriveAccountBalances(old, day('2026-10-29')).chk).toBe(13346.51);
  });

  it('the latest checkpoint on or before the day wins; later ones wait their turn', () => {
    const data = hersInSmall();
    data.transactions.push(balanceCheckpointRow('chk', 8346.51, '2026-10-29'));
    data.transactions.push(balanceCheckpointRow('chk', 7577.94, '2026-10-30'));
    expect(deriveAccountBalances(data, day('2026-10-29')).chk).toBe(8346.51);
    expect(deriveAccountBalances(data, day('2026-10-31')).chk).toBe(7577.94);
    expect(latestCheckpoints(data, day('2026-10-31')).chk.balance).toBe(7577.94);
  });

  it('works for every account, and an account without one keeps the anchor exactly as before', () => {
    const data = hersInSmall();
    data.accounts.push({ id: 'sav', type: 'savings', balance: 100 });
    data.transactions.push({ id: 's1', date: '2026-10-01', accountId: 'sav', amount: 25 });
    data.transactions.push(balanceCheckpointRow('chk', 8346.51, '2026-10-29'));
    const b = deriveAccountBalances(data, day('2026-10-29'));
    expect(b.sav).toBe(125);
    expect(b.chk).toBe(8346.51);
  });
});

describe('a checkpoint is never income, spending or a transfer', () => {
  it('is a $0 row, recognised by the same filter as manual adjustments, and moves no total', () => {
    const row = balanceCheckpointRow('chk', 8346.51, '2026-10-29');
    expect(row.amount).toBe(0);
    expect(isBalanceAdjustment(row)).toBe(true);
    const base = [{ id: 'x', date: '2026-10-29', accountId: 'chk', amount: -25, category: 'utilities' }];
    const { in: i1, out: o1, net: n1 } = totals([...base, row]);
    const { in: i0, out: o0, net: n0 } = totals(base);
    expect({ i1, o1, n1 }).toEqual({ i1: i0, o1: o0, n1: n0 });
  });

  it('survives the family-database round trip (category + reconciliation are synced)', () => {
    const row = { id: 'cp1', ...balanceCheckpointRow('chk', 8346.51, '2026-10-29', { basis: 'available', source: 'Chase export' }) };
    const back = rowToTransaction({ ...transactionToRow(row, { tenantId: 't', userId: 'u' }), id: 'cp1', account_slug: 'chk' });
    expect(balanceCheckpoint({ ...back, accountId: 'chk' })).toEqual({ day: '2026-10-29', balance: 8346.51, basis: 'available', source: 'Chase export' });
  });
});

describe('typing a balance on an account with history records a checkpoint', () => {
  it('lands the display on the typed number, and it stays there after older history arrives', () => {
    const data = hersInSmall();
    const res = applyManualBalance(data, 'chk', 8346.51, day('2026-10-29'));
    expect(res.adjustment.category).toBe('balance-checkpoint');
    data.transactions.push(res.adjustment);
    expect(deriveAccountBalances(data, day('2026-10-29')).chk).toBe(8346.51);
    data.transactions.push({ id: 'late', date: '2026-01-02', accountId: 'chk', amount: -1200 });
    expect(deriveAccountBalances(data, day('2026-10-29')).chk).toBe(8346.51);
  });
});

function round2(x) { return Math.round(x * 100) / 100; }
