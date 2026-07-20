// @vitest-environment jsdom
//
// imported-render — mount the REAL Books → Imported component and prove the
// bank-convention behavior end-to-end (Verification Doctrine DR-0076 §7: observe
// the running surface, not just the pure logic). Proves: it opens on the newest
// month with newest row first (the original "2026 isn't on top" complaint), the
// PII gate hides real rows without a profile, and selecting a single account
// reveals a truthful running Balance column.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import Imported from '../components/Imported.jsx';

const DATA = {
  accounts: [
    { id: 'a1', name: 'Chase 7206', openingBalance: 1000 },
    { id: 'a2', name: 'Chase 3322', openingBalance: 500 },
  ],
  transactions: [
    { id: 't_jun30', accountId: 'a1', date: '2026-06-30', amount: -80, description: 'Late June charge', category: 'utilities' },
    { id: 't_jun10', accountId: 'a1', date: '2026-06-10', amount: 500, description: 'June payroll', category: 'income' },
    { id: 't_may', accountId: 'a2', date: '2026-05-01', amount: -1200, description: 'May rent', category: 'housing' },
  ],
};

async function mount(data) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(Imported, { data })); });
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
  const byText = (t) => [...container.querySelectorAll('button')].find(b => b.textContent.trim() === t);
  return { container, click, byText };
}

describe('Imported — bank-convention view (real mount)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('poe-current-profile', 'p1'); // pass the PII gate on localhost
  });

  it('opens on the newest month (June 2026) with the newest row first', async () => {
    const { container } = await mount(DATA);
    const html = container.innerHTML;
    expect(html).toContain('June 2026');    // sticky month header
    expect(html).toContain('June payroll'); // June rows render
    expect(html).not.toContain('May 2026'); // default lands on the latest month only
    // newest-first within the month: Jun 30 row appears before Jun 10 row
    expect(html.indexOf('Late June charge')).toBeLessThan(html.indexOf('June payroll'));
  });

  it('category is editable on Imported + offers auto-categorize from the data', async () => {
    vi.stubGlobal('alert', vi.fn());
    const recat = vi.fn(() => 1);
    const data = {
      accounts: [{ id: 'a1', name: 'Chase 7206' }],
      transactions: [
        { id: 't1', accountId: 'a1', date: '2026-06-10', amount: -40, description: 'SHELL OIL 123', category: 'other' },
      ],
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => { createRoot(container).render(createElement(Imported, { data, recategorizePayee: recat })); });
    // the category cell is now a real editable select
    const select = container.querySelector('select[aria-label^="Category for"]');
    expect(select).toBeTruthy();
    expect(select.querySelector('option[value="__new__"]')).toBeTruthy(); // "+ New category" -> add more
    // the system offers to categorize what it can determine (SHELL -> fuel)
    const autoBtn = [...container.querySelectorAll('button')].find((b) => /Auto-categorize/.test(b.textContent));
    expect(autoBtn).toBeTruthy();
    await act(async () => { autoBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(recat).toHaveBeenCalledWith('SHELL OIL 123', 'fuel');
    vi.unstubAllGlobals();
  });

  it('lets the family select duplicates and combine them into one (no app update needed)', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const del = vi.fn();
    const data = {
      accounts: [{ id: 'a1', name: 'Chase 7206' }],
      transactions: [
        // Two REAL same-day/same-amount rows with no balance anchor — the auto-remover
        // leaves them alone by design; the family combines them by hand.
        { id: 'd1', accountId: 'a1', date: '2026-07-12', amount: -1.12, description: "AUNTIE ANNE'S IL131" },
        { id: 'd2', accountId: 'a1', date: '2026-07-12', amount: -1.12, description: "AUNTIE ANNE'S IL131 CHAMPAIGN IL 07/12" },
      ],
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => { createRoot(container).render(createElement(Imported, { data, deleteTransaction: del })); });
    const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
    const boxes = [...container.querySelectorAll('input[type="checkbox"][aria-label^="Select"]')];
    expect(boxes).toHaveLength(2);
    await click(boxes[0]);
    await click(boxes[1]);
    const combineBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Combine 2');
    expect(combineBtn).toBeTruthy();
    await click(combineBtn);
    // Keeps the most-complete row (d2, longer description), removes the other.
    expect(del).toHaveBeenCalledWith(['d1']);
    vi.unstubAllGlobals();
  });

  it('PII gate: without a profile it shows the private notice, never real rows', async () => {
    localStorage.clear();
    const { container } = await mount(DATA);
    expect(container.textContent).toContain('private to each family');
    expect(container.innerHTML).not.toContain('June payroll');
  });

  it('selecting a single account reveals a truthful running Balance column', async () => {
    const { container, click, byText } = await mount(DATA);
    await click(byText('All'));           // widen to all months
    await click(byText('Chase 7206'));    // pick one account -> Balance column
    const html = container.innerHTML;
    expect(html).toContain('Balance');
    // a1 opening 1000; oldest->newest: +500 => 1,500.00 (Jun 10), -80 => 1,420.00 (Jun 30)
    expect(html).toContain('1,500.00');
    expect(html).toContain('1,420.00');
  });

  // Darrell's Salary view: repeated payees roll up to a combined subtotal.
  const SALARY_DATA = {
    accounts: [{ id: 'a1', name: 'Chase 7206', openingBalance: 0 }],
    transactions: [
      { id: 'p1', accountId: 'a1', date: '2026-06-15', amount: 2099.93, description: 'University of IL Payroll', category: 'salary' },
      { id: 'p2', accountId: 'a1', date: '2026-06-30', amount: 2099.93, description: 'University of IL Payroll', category: 'salary' },
      { id: 'p3', accountId: 'a1', date: '2026-06-28', amount: 1500, description: 'TLC Therapy', category: 'salary' },
    ],
  };

  it('Group by Payee rolls repeated payees into ONE subtotaled group, line items still visible', async () => {
    const { container, click, byText } = await mount(SALARY_DATA);
    await click(byText('Payee'));
    const html = container.innerHTML;
    expect(html).toContain('University of IL Payroll');   // the group header
    expect(html).toContain('TLC Therapy');
    expect(html).toContain('in $4,200');                  // subtotal: 2 × 2099.93 = 4199.86 -> $4,200
    expect(html).toContain('in $1,500');                  // TLC group subtotal
    expect(html).toContain('2,099.93');                   // itemized line still visible under the group
    // overall period total up top ties out (2099.93×2 + 1500 = 5699.86 -> $5,700)
    expect(html).toContain('in $5,700');
  });

  it('a group header collapses to hide its line items (subtotal stays)', async () => {
    const { container, click, byText } = await mount(SALARY_DATA);
    await click(byText('Payee'));
    const header = [...container.querySelectorAll('button')].find((b) => /University of IL Payroll/.test(b.textContent));
    await click(header);
    const html = container.innerHTML;
    expect(html).toContain('University of IL Payroll'); // header + subtotal still shown
    expect(html).toContain('in $4,200');
    expect(html).not.toContain('2,099.93');             // itemized rows hidden while collapsed
  });
});
