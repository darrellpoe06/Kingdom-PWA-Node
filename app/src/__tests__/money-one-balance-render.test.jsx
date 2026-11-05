// money-one-balance-render.test.jsx — Money → Transactions SHOWS the bank-verified
// balance, the same figure the Overview shows (Christina, 2026-11-05: Chase 7206
// read $6,236.18 on the Overview but $23,075 on Transactions).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import BooksTransactions from '../components/BooksTransactions.jsx';
import { balanceCheckpointRow, deriveAccountBalances } from '../lib/financial-engineering.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const NOV5 = new Date(2026, 10, 5, 12);
const noop = () => {};

function data() {
  return {
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
    accounts: [{ id: 'a-7206', name: 'Chase Personal Checking', type: 'checking', entityId: 'e-personal', balance: 4350.42, isPrimary: true, fragment: '7206' }],
    transactions: [
      { id: 'dep', date: '2026-08-17', accountId: 'a-7206', amount: 24949.97, description: 'DEPOSIT ID NUMBER 1', category: 'other' },
      { id: 'zeely', date: '2026-10-29', accountId: 'a-7206', amount: -79.95, description: 'PAYPAL ZEELY', category: 'other', balance: 23075.19 },
      { id: 'cp', ...balanceCheckpointRow('a-7206', 6236.18, '2026-11-03', { source: 'entered by hand' }) },
    ],
    recurringObligations: [],
  };
}

let host = null; let root = null;
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });

describe('Money → Transactions shows the same balance as the Overview (PROVEN TO CATCH)', () => {
  it('Chase 7206 reads $6,236.18 on the page, never the $23,075 ledger figure', async () => {
    const d = data();
    expect(deriveAccountBalances(d, NOV5)['a-7206']).toBe(6236.18); // the Overview's figure
    host = document.createElement('div'); document.body.appendChild(host);
    await act(async () => {
      root = createRoot(host);
      root.render(createElement(BooksTransactions, {
        data: d, entityFilter: 'all', setEntityFilter: noop, currentDate: NOV5, addTransaction: noop, updateTransaction: noop,
        deleteTransaction: noop, ingestData: null, visibleEntities: null, visibleEntityIds: null,
      }));
    });
    const text = host.textContent;
    // The page shows whole dollars: "Right now $6,236", the newest row "(bal $6,236)".
    expect(text).toMatch(/Right now\$6,236/);
    expect(text).toMatch(/entered by hand.{0,40}\(bal \$6,236\)/);
    expect(text).not.toMatch(/Right now\$2[38],/); // never the ledger's arithmetic
  });
});
