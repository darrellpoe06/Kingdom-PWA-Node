// The Debts screen shows a loan entered as a bill, says it came from the bill,
// and does not offer an editor that has nothing to write to (its numbers live
// on the bill). FOS Money Phase 2, gap X1.
import { describe, it, expect } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Debts from '../components/Debts.jsx';
import { deriveDebts } from '../lib/financial-engineering.js';
import { projectDebtSnowball, projectDebtMinimumOnly } from '../lib/lifecycle-and-flow.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const asOf = new Date(2026, 10, 18, 12);
const data = {
  entities: [{ id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' }],
  accounts: [{ id: 'a-3322', name: 'Chase 3322', type: 'checking', entityId: 'e-poeprops', balance: 2500 }],
  transactions: [],
  inflows: { salaries: [], rentals: [] },
  recurringObligations: [
    {
      id: 'ob-5312',
      name: 'First State Bank loan 5312',
      enabled: true,
      amount: 825.42,
      frequency: 'monthly',
      nextDue: '2026-11-25',
      accountId: 'a-3322',
      entityId: 'e-poeprops',
      balance: 48210.55,
      rate: 6.5,
      lender: 'First State Bank',
      accountLast4: '5312',
      pastDue: 120,
    },
  ],
};

describe('a loan from a bill on the Debts screen', () => {
  it('is listed with its balance and says where it is changed', async () => {
    const debts = deriveDebts(data, asOf);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () =>
      root.render(
        createElement(Debts, {
          debts,
          entities: data.entities,
          debtSnowballSort: 'snowball',
          setDebtSnowballSort: () => {},
          debtSnowballExtra: 0,
          setDebtSnowballExtra: () => {},
          debtSnowball: projectDebtSnowball(debts, 0, 'snowball', asOf, 360),
          debtMinOnly: projectDebtMinimumOnly(debts, asOf, 600),
          currentDate: asOf,
          accounts: data.accounts,
          updateAccount: () => {},
        })
      )
    );
    expect(container.textContent).toContain('First State Bank loan 5312');
    const note = container.querySelector('[data-testid="debt-from-bill"]');
    expect(note.textContent).toMatch(/From the bill · ending 5312 · change it on Bills/);
    expect(note.textContent).toMatch(/\$120.*past due/);
    await act(async () => root.unmount());
    container.remove();
  });
});
