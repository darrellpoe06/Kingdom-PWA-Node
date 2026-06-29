// =============================================================================
// books-tx-white-screen — regression gate for the 2026-06-25 white-screen crash
// =============================================================================
// INCIDENT: opening Books > Tx (the Transactions tab) on the LIVE signed-in app
// went to a white screen — an unhandled TypeError thrown during render with no
// graceful fallback.
//
// ROOT CAUSE (BooksTransactions.jsx): the surface assumed `data.accounts` and
// `data.entities` were ALWAYS present arrays, and that every entity carried a
// string `name`. None of that is guaranteed for real merged cloud data:
//   · `data.accounts[0]?.id` (state init) throws when `accounts` is absent —
//     "Cannot read properties of undefined (reading '0')".
//   · `(visibleEntities || data.entities).map(...)` throws when `entities` is
//     absent — "...(reading 'map')".
//   · `e.name.split('(')` throws on a cloud-synced entity whose `display_name`
//     is null (entities-sync.fromRow maps `name: row.display_name`) —
//     "...(reading 'split')".
// Any one throws unhandled -> React unwinds the whole subtree -> white screen.
//
// FIX: normalize `accounts`/`entities` to arrays once (memoized) and route every
// reference through them; render entity labels through a null-safe helper. The
// SectionBoundary around the surface is the backstop, but the surface itself
// must never throw.
//
// This test mounts the REAL component (Verification Doctrine: observe the live
// surface, not just pure logic) against (1) normal data, (2) empty data, and
// (3) every missing-field shape that previously crashed — and proves it renders
// real data, a clean empty state, and never throws. "Unbreakable, no dead-ends."
import { describe, it, expect } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import BooksTransactions from '../components/BooksTransactions.jsx';

const noop = () => {};
const baseProps = {
  entityFilter: 'all',
  setEntityFilter: noop,
  currentDate: new Date(2026, 5, 25), // 2026-06-25
  addTransaction: noop,
  updateTransaction: noop,
  deleteTransaction: noop,
  ingestData: null,
  visibleEntities: null,
  visibleEntityIds: null,
};

// Mount the surface and return { html, error }. Never rejects — a render throw
// is captured and returned so each shape can be asserted individually.
async function mount(data, extra = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let error = null;
  try {
    await act(async () => {
      const root = createRoot(container);
      root.render(createElement(BooksTransactions, { ...baseProps, ...extra, data }));
    });
  } catch (e) {
    error = e;
  }
  return { html: container.innerHTML, error };
}

describe('Books > Tx — renders real data and never white-screens', () => {
  it('renders real transactions (the description shows up)', async () => {
    const { html, error } = await mount({
      accounts: [{ id: 'a1', name: 'Chase', fragment: '1234', type: 'checking', balance: 100, openingBalance: 100, entityId: 'e1', isPrimary: true }],
      entities: [{ id: 'e1', name: 'Personal' }],
      transactions: [{ id: 't1', date: '2026-06-20', accountId: 'a1', amount: -42, description: 'Coffee run', category: 'dining' }],
    });
    expect(error).toBeNull();
    expect(html).toContain('Coffee run'); // real ledger row painted
  });

  it('renders a clean empty state with no rows (no crash, no painted figures)', async () => {
    const { html, error } = await mount({ accounts: [], entities: [], transactions: [] });
    expect(error).toBeNull();
    expect(html).toContain('No history yet'); // graceful empty state, not a blank screen
  });

  it('does NOT throw when transactions have missing/null fields', async () => {
    const { error } = await mount({
      accounts: [{ id: 'a1', name: 'Chase', balance: 0 }],
      entities: [{ id: 'e1', name: 'Personal' }],
      transactions: [
        { id: 't1', date: null, accountId: null, amount: null, description: null, category: null },
        { id: 't2', date: '2026-06-20T00:00:00+00:00', accountId: 'a1', amount: '-10.50', description: 'X' },
      ],
    });
    expect(error).toBeNull();
  });

  // The three shapes that produced the live white screen, pinned individually so
  // a regression that drops any one guard fails loudly.
  it('does NOT throw when data.accounts is absent', async () => {
    const { error } = await mount({ entities: [{ id: 'e1', name: 'Personal' }], transactions: [] });
    expect(error).toBeNull();
  });

  it('does NOT throw when data.entities is absent', async () => {
    const { error } = await mount({ accounts: [{ id: 'a1', name: 'Chase', balance: 0 }], transactions: [] });
    expect(error).toBeNull();
  });

  it('does NOT throw when both accounts and entities are absent', async () => {
    const { error } = await mount({ transactions: [] });
    expect(error).toBeNull();
  });

  it('does NOT throw on a cloud-synced entity with a null name (the field that bit us)', async () => {
    const { html, error } = await mount({
      accounts: [{ id: 'a1', name: 'Chase', balance: 0 }],
      entities: [{ id: 'e-personal', name: null }], // display_name was null in the cloud row
      transactions: [],
    });
    expect(error).toBeNull();
    // Falls back to the entity id rather than throwing on .split of null.
    expect(html).toContain('e-personal');
  });
});
