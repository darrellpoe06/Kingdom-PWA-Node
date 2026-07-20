// @vitest-environment jsdom
//
// imported-surface-gate — the rendered-surface witness for Books → Imported.
//
// THE MISS THIS CLOSES (2026-07-19). Imported rendered an EMPTY content area on
// the live signed-in app while CI, site-health, and Ari's records read all stayed
// green — because none of them renders a surface and looks at what a user sees.
// This gate mounts the REAL component in the states that USED to render nothing /
// a thin low-contrast strip, and fails if any of them comes back blank or
// near-blank. It does not judge correctness (imported-render.test.jsx does that);
// it refuses the "renders blank" class (DR-0076 / DR-0125).
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import Imported from '../components/Imported.jsx';
import { assessSurfaceEl } from '../lib/surface-not-blank.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mount(data) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(Imported, { data })); });
  return container;
}

describe('Imported — no state renders a blank/near-blank surface', () => {
  beforeEach(() => { localStorage.clear(); });

  it('DENIED (no profile) renders a visible, substantive card — not a thin strip', async () => {
    // This is the exact path that read as "broken blank" on OLED-black: before,
    // it was a single low-contrast <div> of floating text with no card.
    const container = await mount({ accounts: [], transactions: [] });
    const verdict = assessSurfaceEl(container);
    expect(verdict.ok, verdict.reason).toBe(true);
    expect(container.textContent).toContain('private to each family'); // still says WHY
    expect(container.querySelector('[class*="border"]')).not.toBeNull(); // inside a real card
  });

  it('EMPTY (authorized, no rows) renders the honest "nothing synced yet" card, visibly', async () => {
    localStorage.setItem('poe-current-profile', 'p1'); // pass the gate on localhost
    const container = await mount({ accounts: [], transactions: [] });
    const verdict = assessSurfaceEl(container);
    expect(verdict.ok, verdict.reason).toBe(true);
    expect(container.textContent.toLowerCase()).toContain('no imported transactions');
  });

  it('LOADED (authorized, real rows) renders the register, visibly', async () => {
    localStorage.setItem('poe-current-profile', 'p1');
    const container = await mount({
      accounts: [{ id: 'a1', name: 'Chase 7206', openingBalance: 0 }],
      transactions: [{ id: 't1', accountId: 'a1', date: '2026-06-10', amount: 500, description: 'June payroll', category: 'income' }],
    });
    const verdict = assessSurfaceEl(container);
    expect(verdict.ok, verdict.reason).toBe(true);
    expect(container.textContent).toContain('June payroll');
  });
});
