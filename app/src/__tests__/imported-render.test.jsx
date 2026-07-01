// @vitest-environment jsdom
//
// imported-render — mount the REAL Books → Imported component and prove the
// bank-convention behavior end-to-end (Verification Doctrine DR-0076 §7: observe
// the running surface, not just the pure logic). Proves: it opens on the newest
// month with newest row first (the original "2026 isn't on top" complaint), the
// PII gate hides real rows without a profile, and selecting a single account
// reveals a truthful running Balance column.
import { describe, it, expect, beforeEach } from 'vitest';
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
});
