// money-one-balance.test.js — one account, one balance, on every Money screen
// (Christina, 2026-11-05: Chase 7206 read $6,236.18 on the Overview after her
// bank-verified entry, but $23,075 on Money → Transactions. "I want one
// consistent, accurate account balance throughout FOS.")
//
// The register's running balance (runningBalanceByTxId) and the Transactions
// page's "now" figure re-added the whole history from the opening balance and
// never read the $0 checkpoint row the Overview (deriveAccountBalances) honors.
import { describe, it, expect } from 'vitest';
import { runningBalanceByTxId } from '../lib/imported-view.js';
import { deriveAccountBalances, balanceCheckpointRow } from '../lib/financial-engineering.js';
import { checkBalanceDerivation } from '../lib/ledger-integrity.js';

const NOV5 = new Date(2026, 10, 5, 12);

// The shape of her Chase 7206: an old anchor, a long history that adds up far
// above the bank (a large deposit, imported rows with Chase's own running
// balance), then her bank-verified $6,236.18.
function chase7206() {
  const tx = [];
  tx.push({ id: 'dep', date: '2026-08-17', accountId: 'a-7206', amount: 24949.97, description: 'DEPOSIT ID NUMBER 1' });
  for (let i = 1; i <= 20; i++) tx.push({ id: `s${i}`, date: `2026-09-${String(i).padStart(2, '0')}`, accountId: 'a-7206', amount: -150, description: 'COUNTY MARKET' });
  tx.push({ id: 'chase-bal', date: '2026-10-29', accountId: 'a-7206', amount: -79.95, description: 'PAYPAL ZEELY', balance: 23075.19 }); // a Chase running balance on an imported row
  tx.push({ id: 'cp', ...balanceCheckpointRow('a-7206', 6236.18, '2026-11-03', { source: 'entered by hand' }) });
  tx.push({ id: 'same-day', date: '2026-11-03', accountId: 'a-7206', amount: -15, description: 'META' }); // already inside the end-of-day bank figure
  return {
    accounts: [{ id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 4350.42 }],
    transactions: tx,
  };
}
const newestBalance = (data, id) => {
  const run = runningBalanceByTxId(data.transactions, data.accounts);
  const rows = data.transactions.filter((t) => t.accountId === id);
  // The register's newest row: the last day, and a checkpoint last within its day.
  const last = rows.slice().sort((x, y) => String(x.date).localeCompare(String(y.date)) || ((x.category === 'balance-checkpoint') - (y.category === 'balance-checkpoint'))).pop();
  return run[last.id];
};

describe('every Money screen reads the same balance (PROVEN TO CATCH)', () => {
  it('the register’s newest running balance is the bank-verified $6,236.18, the same as the Overview', () => {
    const d = chase7206();
    expect(deriveAccountBalances(d, NOV5)['a-7206']).toBe(6236.18);
    expect(newestBalance(d, 'a-7206')).toBe(6236.18);
  });
  it('a transaction after the checkpoint moves both by its amount, and only it', () => {
    const d = chase7206();
    d.transactions.push({ id: 'nov4', date: '2026-11-04', accountId: 'a-7206', amount: -100, description: 'ZELLE PAYMENT TO LEAH TAYLOR' });
    expect(deriveAccountBalances(d, NOV5)['a-7206']).toBe(6136.18);
    expect(runningBalanceByTxId(d.transactions, d.accounts).nov4).toBe(6136.18);
  });
  it('history before the checkpoint still shows the bank’s own running balance on its row', () => {
    const d = chase7206();
    expect(runningBalanceByTxId(d.transactions, d.accounts)['chase-bal']).toBe(23075.19);
  });
  it('a row before the checkpoint with no bank balance shows the Overview’s balance for that day (counted back from the checkpoint)', () => {
    const d = chase7206();
    const run = runningBalanceByTxId(d.transactions, d.accounts);
    expect(run.s20).toBe(deriveAccountBalances(d, new Date(2026, 8, 20, 23))['a-7206']); // 6,331.13
    expect(run.s20).toBe(6331.13);
  });
  it('an account with no checkpoint keeps its old register exactly', () => {
    const d = chase7206();
    d.transactions = d.transactions.filter((t) => t.id !== 'cp');
    const run = runningBalanceByTxId(d.transactions, d.accounts);
    expect(run['same-day']).toBe(23060.19); // 23075.19 (bank row) - 15
  });
  it('the balance self-check agrees with the engine once an account is checkpointed', () => {
    const d = chase7206();
    const r = checkBalanceDerivation(d, NOV5);
    expect(r.status).toBe('pass');
  });
});
