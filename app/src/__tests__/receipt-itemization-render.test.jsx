// =============================================================================
// Receipt itemization — live render proof (DR-0076 verification doctrine).
// Mounts the REAL Books > Transactions surface with a transaction that carries an
// emailed-receipt reconciliation block (Walmart) and pins the enrichment the
// money loop promises: the charge shows a "receipt verified" badge, expands to
// its line items with per-item prices, splits across categories, and states that
// the items reconcile to the exact bank debit. A tampered fixture proves the
// verified badge is NOT painted when the items don't reconcile.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import BooksTransactions from '../components/BooksTransactions.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(BooksTransactions, props));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

const WALMART_TX = {
  id: 'tx-wm', date: '2026-05-17', accountId: 'a-cc', amount: -83.73,
  description: 'Walmart Supercenter', category: 'household',
  reconciliation: {
    matched: true, matched_to: ['bank', 'email'], merchant: 'Walmart', method: 'visa-debit', card_last4: '3344',
    total: 83.73, source_email: { from: 'help@walmart.com', received: '2026-05-17' },
    orders: [{ order: '2000123456789', tax: 3.11, paid: 83.73, items: [
      { name: 'Great Value Whole Milk 1 gal', qty: 1, price: 3.98 },
      { name: 'Bananas each', qty: 6, price: 1.62 },
      { name: 'Boneless Chicken Breast', qty: 1, price: 9.44 },
      { name: 'Large White Eggs 18ct', qty: 1, price: 4.87 },
      { name: 'Honey Nut Cereal', qty: 2, price: 5.96 },
      { name: 'Tide PODS Laundry Detergent 42ct', qty: 1, price: 12.97 },
      { name: 'Bounty Paper Towels 6 rolls', qty: 1, price: 14.94 },
      { name: 'Charmin Toilet Paper 12 rolls', qty: 1, price: 13.97 },
      { name: 'Tylenol Extra Strength 100ct', qty: 1, price: 12.87 },
    ] }],
  },
};

const baseProps = (tx) => ({
  data: {
    accounts: [{ id: 'a-cc', entityId: 'e1', name: 'Visa Rewards', type: 'credit', fragment: '...3344', balance: -200 }],
    entities: [{ id: 'e1', name: 'Family' }],
    transactions: [tx],
    recurringObligations: [], recordEvents: [], categoryRules: {},
  },
  entityFilter: 'all', setEntityFilter: () => {}, currentDate: new Date('2026-05-28T00:00:00Z'),
  addTransaction: () => {}, updateTransaction: () => {}, deleteTransaction: () => {}, ingestData: null,
});

describe('Books > Transactions — emailed-receipt itemization', () => {
  it('shows the receipt-verified badge and the itemized line items with prices', async () => {
    await mount(baseProps(WALMART_TX));
    const text = document.body.textContent || '';
    // badge
    expect(text).toMatch(/receipt verified/i);
    // dropdown summary names the merchant + item count
    expect(text).toMatch(/Walmart receipt/i);
    // individual line items + a per-item price render
    expect(text).toMatch(/Tide PODS Laundry Detergent 42ct/);
    expect(text).toMatch(/Charmin Toilet Paper 12 rolls/);
    expect(text).toMatch(/\$12\.97/);
    // category split is present and the charge reconciles to the bank debit
    expect(text).toMatch(/Category split from items/i);
    expect(text).toMatch(/Items reconcile to the \$83\.73 bank debit/i);
  });

  it('does NOT paint "receipt verified" when the items are tampered (proven-to-catch)', async () => {
    const tampered = JSON.parse(JSON.stringify(WALMART_TX));
    tampered.id = 'tx-bad';
    tampered.reconciliation.orders[0].items[0].price += 7.5; // items no longer sum to paid
    await mount(baseProps(tampered));
    const text = document.body.textContent || '';
    expect(text).not.toMatch(/receipt verified/i);
    expect(text).toMatch(/receipt mismatch/i);
  });
});
