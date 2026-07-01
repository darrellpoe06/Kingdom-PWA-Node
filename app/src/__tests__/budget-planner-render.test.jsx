// =============================================================================
// BudgetPlanner — render verification for the goal-driven budget surface.
//
// The live signed-in browser path is family-gated (Darrell's own login), so this
// mounts the REAL component in jsdom against a real-shaped `data` fixture and
// proves the acceptance criteria render end-to-end from the engine:
//   * an OVERSPEND guidance signal WITH ITS REASON, computed from ledger data;
//   * the category-vs-plan table flagging the hot category;
//   * the pipeline showing a real upcoming obligation;
//   * an honest confidence badge;
//   * and — by driving the capture form — a GOAL PLAN card with on/off-track.
// goalsSync.subscribe is a safe no-op signed out (bails on no session), so no
// network is touched; the optimistic add is what surfaces the goal plan.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import BudgetPlanner from '../components/BudgetPlanner.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const CD = new Date(2026, 6, 15); // Jul 15, 2026

function data() {
  return {
    accounts: [
      { id: 'chk', entityId: 'e-fam', type: 'checking', balance: 8000, openingBalance: 8000 },
      { id: 'sav', entityId: 'e-fam', type: 'savings', balance: 4000, openingBalance: 4000 },
    ],
    transactions: [
      { id: 'g1', date: '2026-04-05', accountId: 'chk', amount: -300, category: 'groceries' },
      { id: 'g2', date: '2026-05-05', accountId: 'chk', amount: -300, category: 'groceries' },
      { id: 'g3', date: '2026-06-05', accountId: 'chk', amount: -300, category: 'groceries' },
      { id: 'g4', date: '2026-07-03', accountId: 'chk', amount: -200, category: 'groceries' },
      { id: 'g5', date: '2026-07-10', accountId: 'chk', amount: -150, category: 'groceries' },
    ],
    inflows: { salaries: [{ id: 's1', entityId: 'e-fam', actual: 6000 }], rentals: [] },
    outflows: { housing: 2000, utilities: 500, food: 1000 },
    recurringObligations: [
      { id: 'ins', name: 'Auto insurance', enabled: true, frequency: 'annual', amount: 1200, nextDue: '2026-09-15', entityId: 'e-fam' },
    ],
    debts: [],
    entities: [{ id: 'e-fam', name: 'Family', type: 'personal' }],
  };
}

let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

// Set a React-controlled input's value the way a user would (native setter + event).
function setValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
function clickByText(text) {
  const btn = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
  if (!btn) throw new Error(`button not found: ${text}`);
  act(() => btn.click());
}

describe('BudgetPlanner — renders engine guidance from real ledger data', () => {
  it('mounts and shows the overspend signal, category table, pipeline, and confidence', () => {
    expect(() => {
      act(() => root.render(createElement(BudgetPlanner, { data: data(), currentDate: CD, scope: 'consolidated', months: 12 })));
    }).not.toThrow();
    const text = container.textContent;
    // The proactive overspend signal + its reason (groceries past its plan).
    expect(text).toMatch(/Over plan: groceries/i);
    expect(text).toMatch(/past the .* plan/i); // the deterministic reason string
    // Category-vs-plan table flags groceries.
    expect(text).toMatch(/Category spending vs plan/i);
    // The pipeline shows the real upcoming obligation.
    expect(text).toMatch(/Auto insurance/);
    // Honest confidence badge (fully categorized fixture → high).
    expect(text).toMatch(/High confidence/i);
    // Guardrail copy is present on the surface.
    expect(text).toMatch(/not investment advice/i);
  });

  it('captures a goal and renders its plan card with on/off-track + set-aside', () => {
    act(() => root.render(createElement(BudgetPlanner, { data: data(), currentDate: CD, scope: 'consolidated', months: 12 })));
    clickByText('+ Add a goal');
    // Fill the save-goal form: name, target amount, and a date.
    const nameEl = container.querySelector('input[placeholder^="e.g."]');
    const amtEl = container.querySelector('input[placeholder="6000"]');
    const dateEl = container.querySelector('input[type="date"]');
    act(() => { setValue(nameEl, 'Buffer'); });
    act(() => { setValue(amtEl, '6000'); });
    act(() => { setValue(dateEl, '2026-10-15'); });
    clickByText('Add goal');
    const text = container.textContent;
    // The goal plan card is now present with its status + monthly set-aside.
    expect(text).toMatch(/Buffer/);
    expect(text).toMatch(/On track|Behind plan|At risk/);
    expect(text).toMatch(/Set aside \/ mo/i);
  });
});
