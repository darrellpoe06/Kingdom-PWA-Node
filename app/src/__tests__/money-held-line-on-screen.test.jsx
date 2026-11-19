// The Safe-to-Spend breakdown names money held for someone else on its own
// line while any is held (Christina 2026-11-18: Christiana's $55 for her
// tithe). It stays inside "Other commitments" too, so the lines still add up.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import MoneyOverview from '../components/money/MoneyOverview.jsx';
import { deriveDebts } from '../lib/financial-engineering.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = new Date(2026, 10, 18);

function fixture(extraTxns = []) {
  return {
    meta: { lastUpdated: '2026-11-18' },
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
    accounts: [{ id: 'a-7206', entityId: 'e-personal', name: 'Chase 7206', type: 'checking', balance: 2559.78, openingBalance: 2559.78 }],
    transactions: extraTxns,
    inflows: { salaries: [], rentals: [] },
    outflows: { household: 0, debtService: 0, rentalMortgages: 0, charitableGiving: 0 },
    recurringObligations: [],
    taxCalendar: [],
    incidents: [],
    debts: [],
    events: [],
    subscriptions: [],
    contractors1099: [],
  };
}
const IN55 = { id: 'gmr', accountId: 'a-7206', date: '2026-11-17', description: 'Transfer from GMR ...3800', amount: 55, category: 'held-for-others' };

let host = null;
let root = null;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});
async function linesOf(data) {
  const bag = {
    data,
    setData: () => {},
    currentDate: TODAY,
    derivedDebts: deriveDebts(data, TODAY),
    totals: { totalInflow: 0, totalOutflow: 0, netCashFlow: 0 },
    bufferCurrent: 0,
    visibleEntities: data.entities,
    cloud: false,
    setBooksView: () => {},
    setView: () => {},
    addRecurring: () => {},
  };
  host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => {
    root = createRoot(host);
    root.render(createElement(MoneyOverview, { money: bag }));
  });
  return host.querySelector('[data-testid="sts-lines"]').textContent;
}

describe('the Safe-to-Spend breakdown on screen', () => {
  it('names "Held for someone else" with $55 while Christiana’s money is held', async () => {
    const lines = await linesOf(fixture([IN55]));
    expect(lines).toContain('Held for someone else');
    expect(lines).toContain('$55');
    expect(lines).toContain('set aside until passed along');
  });
  it('shows no such line when nothing is held', async () => {
    const lines = await linesOf(fixture([{ ...IN55, category: 'other' }]));
    expect(lines).not.toContain('Held for someone else');
  });
});
