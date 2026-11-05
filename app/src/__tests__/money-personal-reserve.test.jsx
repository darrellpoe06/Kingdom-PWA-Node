// money-personal-reserve.test.jsx — Safe to Spend is PERSONAL money against the
// PERSONAL $10,000 reserve, in every view (Christina, 2026-11-05: "My personal
// cash balance of approximately $5,774 is CORRECT... My PERSONAL cash cushion
// must be $10,000, not $2,000"; the "All entities" headline read $525 beside a
// projected shortfall, Poe Properties' own spendable added to her $0).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { buildSafeToSpend, extraDebtCapacity } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import MoneyComingUp from '../components/money/MoneyComingUp.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const NOV5 = new Date(2026, 10, 5, 12);

// Her shape: Personal Chase 7206 ~$5,774 and Poe Properties Chase 3322
// $2,539.53, both bank-checked; the household cushion $2,000.
function her(reserveByEntity) {
  return {
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-poeprops', name: 'Poe Properties', type: 'business' },
    ],
    accounts: [
      { id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 },
      { id: 'a-3322', name: 'Chase 3322', type: 'checking', entityId: 'e-poeprops', balance: 0 },
    ],
    transactions: [
      { id: 'cp1', ...balanceCheckpointRow('a-7206', 5774, '2026-11-05', { basis: 'available' }) },
      { id: 'cp2', ...balanceCheckpointRow('a-3322', 2539.53, '2026-11-05', { basis: 'available' }) },
    ],
    recurringObligations: [],
    inflows: { salaries: [], rentals: [] },
    moneyPlan: { settings: { minCushion: 2000, includeInferredBills: false, ...(reserveByEntity ? { reserveByEntity } : {}) } },
  };
}
const run = (d, scope) => buildSafeToSpend(d, { currentDate: NOV5, period: '14d', scope });

describe('the personal reserve and the combined headline (PROVEN TO CATCH)', () => {
  it('the All entities headline is Personal money only: never Poe Properties’ $539 added to her $0', () => {
    const d = her();
    const personal = run(d, 'personal');
    const all = run(d, 'consolidated');
    const poe = all.byEntity.find((r) => r.scope.id === 'e-poeprops');
    expect(poe.safeToSpendNow).toBe(539.53); // Poe's own, shown in its own row
    expect(all.safeToSpendNow).toBe(personal.safeToSpendNow);
    expect(all.shortfall).toBe(personal.shortfall);
    expect(all.lines.availableCash).toBe(5774); // her cash, unchanged; no business cash
    expect(all.lines.minCushion).toBe(personal.lines.minCushion);
  });
  it('with the $10,000 Personal reserve, Safe to Spend is $0 in the Personal AND All entities views, and the shortfall is $4,226', () => {
    const d = her({ personal: 10000 });
    for (const scope of ['personal', 'consolidated']) {
      const r = run(d, scope);
      expect(r.lines.minCushion).toBe(10000);
      expect(r.safeToSpendNow).toBe(0);
      expect(r.shortfall).toBe(4226);
      expect(r.lines.availableCash).toBe(5774);
    }
    // Poe Properties keeps its own figures under the household cushion.
    const poe = run(d, 'e-poeprops');
    expect(poe.lines.minCushion).toBe(2000);
    expect(poe.safeToSpendNow).toBe(539.53);
    // The Personal row of the per-entity table reads the same reserve.
    expect(run(d, 'consolidated').byEntity.find((r) => r.scope.id === 'e-personal').lines.minCushion).toBe(10000);
  });
});

let host = null; let root = null;
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });
const setValue = async (input, value) => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
  await act(async () => { input.dispatchEvent(new Event('input', { bubbles: true })); });
};

describe('the reserve editor in the All entities view saves the Personal reserve', () => {
  it('saves under the one "personal" key every Money view reads, and the saved settings give $0 after a reload', async () => {
    const d = her();
    const all = run(d, 'consolidated');
    const saved = [];
    const show = (n) => `$${Math.round(n).toLocaleString()}`;
    host = document.createElement('div'); document.body.appendChild(host);
    await act(async () => {
      root = createRoot(host);
      root.render(createElement(MoneyComingUp, { result: all, extra: extraDebtCapacity(d, { currentDate: NOV5, period: '14d', scope: 'consolidated' }), show, entities: d.entities, settings: d.moneyPlan.settings, onSaveReserve: (id, amount) => saved.push([id, amount]) }));
    });
    const input = host.querySelector('[data-testid="coming-up-reserve-input"]');
    expect(input).toBeTruthy();
    expect(host.textContent).toMatch(/Reserve for Personal only/);
    expect(host.querySelector('#coming-up-h').textContent).toMatch(/Personal money/); // the panel under the headline says whose money it is
    await setValue(input, '10000');
    await act(async () => { host.querySelector('[data-testid="coming-up-reserve-save"]').click(); });
    expect(saved).toEqual([['personal', 10000]]);
    // What a refresh reads back: the settings as saved (the moneyPlan settings
    // ride the family snapshot whole).
    const reloaded = her({ personal: 10000 });
    expect(run(reloaded, 'consolidated').safeToSpendNow).toBe(0);
    expect(run(reloaded, 'personal').lines.minCushion).toBe(10000);
  });
});
