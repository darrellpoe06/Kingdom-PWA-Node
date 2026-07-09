// Live render proof for the guardian-side child money preview (DR-0094 / DR-0112).
// Mounts the REAL component in jsdom against real-shaped books and pins: it shows
// the teaching flow with giving foregrounded, a prayer prompt, and toggles to the
// raw accounts view. There is no child session yet (DR-0093) — this guardian
// preview is where the view first renders.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import ChildBooksPreview from '../components/ChildBooksPreview.jsx';

const DATA = {
  accounts: [
    { id: 'chk', name: 'Checking', type: 'checking', openingBalance: 1000 },
    { id: 'sav', name: 'Buffer Fund', type: 'savings', openingBalance: 2000 },
  ],
  transactions: [{ id: 't1', date: '2026-06-01', accountId: 'sav', amount: 500 }],
  inflows: { salaries: [{ actual: 5000 }], rentals: [] },
  outflows: { rentalMortgages: 0, propertyUtilities: 300, household: 1800, debtService: 700, charitableGiving: 500 },
};

let container, root;
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('ChildBooksPreview — guardian sees what a granted child will see', () => {
  it('renders nothing without books data (no painted preview)', async () => {
    await mount(createElement(ChildBooksPreview, { data: null }));
    expect(container.textContent.trim()).toBe('');
  });

  it('teaching mode: shows the stewardship flow, giving, and a prayer prompt — no shame', async () => {
    await mount(createElement(ChildBooksPreview, { data: DATA, childLabel: 'Sample child', initialMode: 'teaching' }));
    const txt = container.textContent;
    expect(txt).toMatch(/what Sample child will see/i);
    expect(txt).toMatch(/Giving/);
    expect(txt).toMatch(/\$500/);           // real giving number
    expect(txt).toMatch(/prayer/i);          // opens toward prayer (DR-0112)
    expect(txt).not.toMatch(/deficit|shortfall|overspent/i);
  });

  it('toggles to the raw books view (real accounts + balances)', async () => {
    await mount(createElement(ChildBooksPreview, { data: DATA, initialMode: 'teaching' }));
    const rawBtn = [...container.querySelectorAll('button')].find((b) => /real books/i.test(b.textContent));
    expect(rawBtn).toBeTruthy();
    await act(async () => { rawBtn.click(); });
    const txt = container.textContent;
    expect(txt).toMatch(/Buffer Fund/);      // real account name
    expect(txt).toMatch(/\$2,500/);          // derived savings balance (2000 + 500)
  });
});
