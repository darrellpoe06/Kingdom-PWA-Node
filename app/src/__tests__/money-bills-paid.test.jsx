// money-bills-paid.test.jsx — the Bills screen shows what is paid and what is
// left, and keeps a settled bill on the list so its status can be changed
// (DEFECT-1, GAP-1; Christina 2026-10-29).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MoneyBills } from '../components/money/MoneySections.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = new Date(2026, 9, 28);
function world(extraTx = [], billStatus = {}) {
  return {
    entities: [{ id: 'e-p', name: 'Personal', type: 'personal' }],
    accounts: [{ id: 'chk', name: 'Checking', type: 'checking', entityId: 'e-p', balance: 0 }],
    transactions: [{ id: 't-open', date: '2026-10-20', accountId: 'chk', amount: 2000, description: 'Opening balance deposit' }, ...extraTx],
    recurringObligations: [
      { id: 'ro-ins', name: 'Car insurance', amount: 150, frequency: 'monthly', nextDue: '2026-10-30', entityId: 'e-p', category: 'insurance', enabled: true },
      { id: 'ro-net', name: 'Internet', amount: 80, frequency: 'monthly', nextDue: '2026-11-03', entityId: 'e-p', category: 'utilities', enabled: true },
    ],
    moneyPlan: { billStatus, settings: {} },
  };
}
let host; let root;
async function mount(data) {
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  await act(async () => { root.render(createElement(MoneyBills, { money: { data, setData: () => {}, currentDate: TODAY } })); });
  return host;
}
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });
const rowOf = (el, label) => [...el.querySelectorAll('li')].find((li) => li.textContent.includes(label));

describe('Bills shows paid and partial occurrences truthfully', () => {
  it('a half payment in the ledger shows "$75 paid · $75 left"', async () => {
    const el = await mount(world([{ id: 't-half', date: '2026-10-28', accountId: 'chk', amount: -75, description: 'Car insurance', category: 'insurance' }]));
    const row = rowOf(el, 'Car insurance');
    expect(row.querySelector('[data-testid="bill-paid-so-far"]').textContent).toMatch(/\$75.*paid.*\$75.*left/);
  });
  it('a bill paid in the ledger stays on the list, reads "paid (in the ledger)", and is not counted', async () => {
    const el = await mount(world([{ id: 't-full', date: '2026-10-28', accountId: 'chk', amount: -150, description: 'Car insurance', category: 'insurance' }]));
    const row = rowOf(el, 'Car insurance');
    expect(row).toBeTruthy();
    expect(row.querySelector('select').value).toBe('paid-in-ledger');
    expect(row.querySelector('[data-testid="bill-paid-so-far"]').textContent).toMatch(/not counted/);
  });
  it('marked paid with no ledger payment says it is still counted until the payment shows', async () => {
    const el = await mount(world([], { 'ro-ins:2026-10-30': { status: 'paid' } }));
    expect(rowOf(el, 'Car insurance').querySelector('[data-testid="bill-waiting-on-ledger"]')).toBeTruthy();
  });
  it('partly paid outside offers the amount box', async () => {
    const el = await mount(world([], { 'ro-net:2026-11-03': { status: 'partial-outside', paid: 30 } }));
    const row = rowOf(el, 'Internet');
    expect(row.querySelector('input[type="number"]').defaultValue).toBe('30');
    expect(row.querySelector('[data-testid="bill-paid-so-far"]').textContent).toMatch(/\$30.*paid.*\$50.*left/);
  });
});
