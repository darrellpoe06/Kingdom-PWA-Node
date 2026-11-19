// The "Reconcile with the bank" section on Money Overview: what it says is what
// the reconciliation found, and it never goes blank.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import BankReconcile from '../components/money/BankReconcile.jsx';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const asOf = new Date(2026, 10, 18, 12);
const ENT = [{ id: 'e-personal', name: 'Personal', type: 'personal' }];
const CHAIN = [
  { id: 'r1', date: '2026-11-14', description: 'PAYROLL', amount: 1500, balance: 3000 },
  { id: 'r2', date: '2026-11-15', description: 'Zelle payment to TLC', amount: -837, balance: 2163 },
  { id: 'r3', date: '2026-11-15', description: 'Transfer from GMR ...3800', amount: 55, balance: 2218 },
  { id: 'r4', date: '2026-11-17', description: 'Grocery', amount: -158.22, balance: 2059.78 },
].map((r) => ({ ...r, accountId: 'a-7206' }));
const data = (rows) => ({
  entities: ENT,
  accounts: [{ id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
  transactions: [{ id: 'cp', ...balanceCheckpointRow('a-7206', 2059.78, '2026-11-17', { basis: 'available' }) }, ...rows],
  recurringObligations: [],
  inflows: { salaries: [], rentals: [] },
  moneyPlan: { settings: {} },
});

let host = null;
let root = null;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});
async function render(props) {
  host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => {
    root = createRoot(host);
    root.render(createElement(BankReconcile, { entities: ENT, currentDate: asOf, show: (n) => `$${Number(n).toFixed(2)}`, ...props }));
  });
  return host;
}

describe('Reconcile with the bank', () => {
  it('Chase 7206 matching its bank balance says so, with the bank balance and the unbroken chain', async () => {
    const el = await render({ data: data(CHAIN) });
    const acct = el.querySelector('[data-testid="bank-reconcile-account"]');
    expect(acct.getAttribute('data-status')).toBe('reconciled');
    expect(acct.textContent).toContain('Matches the bank');
    expect(acct.textContent).toContain('$2059.78 on 2026-11-17 (available)');
    expect(acct.textContent).toContain('unbroken (4 rows)');
    expect(acct.textContent).toContain('match');
    expect(el.querySelector('[data-testid="bank-reconcile-findings"]')).toBeNull();
  });
  it('a missing row shows "Needs attention" and the finding that brackets it', async () => {
    const el = await render({ data: data(CHAIN.filter((t) => t.id !== 'r3')) });
    const acct = el.querySelector('[data-testid="bank-reconcile-account"]');
    expect(acct.getAttribute('data-status')).toBe('needs-attention');
    expect(acct.textContent).toContain('Needs attention');
    expect(el.querySelector('[data-testid="bank-reconcile-findings"]').textContent).toMatch(/missing or doubled/);
  });
  it('never blank: with no account in view it says what to add', async () => {
    const el = await render({ data: { ...data([]), accounts: [] } });
    expect(el.querySelector('[data-testid="bank-reconcile-empty"]').textContent).toMatch(/No checking or savings account in this view yet/);
  });
  it('amounts follow privacy mode (the Overview’s own show)', async () => {
    const el = await render({ data: data(CHAIN), show: () => '••••' });
    expect(el.textContent).not.toContain('2059.78');
    expect(el.textContent).toContain('••••');
  });
});
