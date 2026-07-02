// =============================================================================
// InputValidation — live render proof (DR-0076). The SAME gate renders an email
// receipt, a photo receipt, and a manual entry, shows extracted fields +
// confidence + matched bank txn + category, and commits ONLY on confirm (nothing
// silent). A needs-fix candidate cannot commit until corrected.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import InputValidation from '../components/InputValidation.jsx';
import { candidateFromReceipt, candidateFromManual } from '../lib/input-validation.js';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(InputValidation, props)); });
}
const buttons = () => [...document.body.querySelectorAll('button')];
const byText = (re) => buttons().find((b) => re.test(b.textContent || ''));
async function click(el) { await act(async () => { el.click(); }); }
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });

const LEDGER = [
  { id: 'tx-a', date: '2026-05-17', accountId: 'a1', amount: -48.70, description: 'WALMART SUPERCENTER' },
];
const ACCOUNTS = [{ id: 'a1', name: 'Visa', fragment: '3344' }];
const WALMART = {
  merchant: 'Walmart', date: '2026-05-17', total: 48.70, tax: 2.32, confidence: 1,
  items: [{ name: 'Milk', price: 3.98 }, { name: 'Tide PODS', price: 12.97 }, { name: 'Bounty', price: 14.94 }, { name: 'Tylenol', price: 12.87 }, { name: 'Bananas', price: 1.62 }],
};

describe('InputValidation — one gate for every source', () => {
  it('renders email + manual candidates with source labels, confidence, match, category', async () => {
    const email = candidateFromReceipt(WALMART, { source: 'email', transactions: LEDGER });
    const manual = candidateFromManual({ description: 'Aldi groceries', date: '2026-05-20', amount: -85, accountId: 'a1', category: 'other' }, {});
    await mount({ candidates: [email, manual], accounts: ACCOUNTS, transactions: LEDGER, addTransaction: () => {}, updateTransaction: () => {} });
    const text = document.body.textContent || '';
    expect(text).toMatch(/Email receipt/i);
    expect(text).toMatch(/Manual entry/i);
    expect(text).toMatch(/Validate → confirm → commit/i);
    // extracted + matched + confidence all present
    expect(text).toMatch(/Matched bank transaction/i);
    expect(text).toMatch(/WALMART SUPERCENTER/);
    expect(text).toMatch(/high/i); // confidence tier label
    // the manual entry's category was auto-picked to groceries
    expect([...document.querySelectorAll('select')].some((s) => s.value === 'groceries')).toBe(true);
  });

  it('commits an email receipt ONLY on confirm (updateTransaction), never silently', async () => {
    const updateTransaction = vi.fn();
    const email = candidateFromReceipt(WALMART, { source: 'photo', transactions: LEDGER });
    await mount({ candidates: [email], accounts: ACCOUNTS, transactions: LEDGER, addTransaction: () => {}, updateTransaction });
    expect(updateTransaction).not.toHaveBeenCalled(); // nothing on mount
    await click(byText(/Confirm & file(?! \d)/i) || byText(/Confirm & file/i));
    expect(updateTransaction).toHaveBeenCalledWith('tx-a', expect.objectContaining({ reconciliation: expect.any(Object), category: 'household' }));
  });

  it('a needs-fix manual entry cannot commit until corrected', async () => {
    const addTransaction = vi.fn();
    const bad = candidateFromManual({ description: 'thing', date: '2026-05-20', amount: -5, accountId: '', category: 'household' }, {});
    await mount({ candidates: [bad], accounts: ACCOUNTS, transactions: LEDGER, addTransaction, updateTransaction: () => {} });
    // "Confirm & file 0 ready" — nothing is ready
    expect(document.body.textContent).toMatch(/0 ready/i);
    // fix: pick the account
    const acctSelect = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.value === 'a1'));
    await act(async () => { acctSelect.value = 'a1'; acctSelect.dispatchEvent(new Event('change', { bubbles: true })); });
    await click(byText(/Confirm & file(?! \d)/));
    expect(addTransaction).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'a1', amount: -5 }));
  });
});
