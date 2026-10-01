// @vitest-environment jsdom
// =============================================================================
// ledger-edit-everywhere — payee + category editing on every Books surface
// =============================================================================
// Darrell, 2026-09-30: "Tx is the only place to edit names or categories!!!!!
// ... we want to edit everywhere it makes sense." DR-0710.
//
// Proves, on REAL mounts:
//   1. the walk: the one shared editor (<LedgerEdit>, data-ledger-edit) is on
//      every surface that shows a ledger payee or category;
//   2. an edit on Imported goes to the SAME updateTransaction /
//      recategorizePayee the shell hands the Tx tab (one write path);
//   3. "every one from this payee" moves the KPI rollups at once;
//   4. demo mode writes nothing;
//   5. Undo puts the rows back.
// Proven-to-catch: each walk assertion fails if its surface renders plain text
// again (checked by reverting the Imported register chip during authoring).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import Imported from '../components/Imported.jsx';
import Debts from '../components/Debts.jsx';
import BooksAccounts from '../components/BooksAccounts.jsx';
import BooksTransactions from '../components/BooksTransactions.jsx';
import LedgerEdit from '../components/LedgerEdit.jsx';
import {
  publishLedgerEditor, applyLedgerEdit, undoLedgerEdit, rowsInScope, clearLedgerMarks, payeeKey, applyCategoryToPayee,
} from '../lib/ledger-edit.js';
import { spendingByPriority } from '../lib/spending-priorities.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DAY = 86400000;
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString().slice(0, 10);

function ledger() {
  return [
    { id: 's1', accountId: 'a1', date: iso(2 * DAY), amount: -40, description: 'SHELL OIL 123', category: 'fuel' },
    { id: 's2', accountId: 'a1', date: iso(4 * DAY), amount: -35, description: 'SHELL OIL 456', category: 'fuel' },
    { id: 'd1', accountId: 'a1', date: iso(3 * DAY), amount: -12, description: 'STARBUCKS 99', category: 'dining' },
    { id: 'p1', accountId: 'a1', date: iso(5 * DAY), amount: 2000, description: 'PAYROLL ACME', category: 'salary' },
    // A card autopay, monthly: a recurring pattern + a "looks like a debt" suggestion.
    ...[0, 1, 2, 3].map((m) => ({ id: `c${m}`, accountId: 'a1', date: iso((6 + m * 30) * DAY), amount: -150, description: 'CHASE CREDIT CRD AUTOPAY', category: 'debt-payment' })),
  ];
}

// The shell's two write paths, reduced to what they do to local state (the
// real ones also sync; that is the shell's job and is not re-tested here).
function Harness({ initial, demo = false, children, spy }) {
  const [txns, setTxns] = useState(initial);
  const updateTransaction = (id, updates) => { spy && spy('update', id, updates); setTxns((ts) => ts.map((t) => (t.id === id ? { ...t, ...updates } : t))); };
  const recategorizePayee = (description, category) => { spy && spy('recat', description, category); setTxns((ts) => applyCategoryToPayee(ts, payeeKey(description), category).transactions); return 1; };
  publishLedgerEditor({ updateTransaction, recategorizePayee, demo, transactions: txns });
  return children(txns);
}

let container; let root;
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  return container;
}
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const btn = (re, scope = document.body) => [...scope.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
const sheet = () => document.querySelector('[role="dialog"][aria-modal="true"]');
async function setValue(el, value) {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  await act(async () => { el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
}
async function pickRadio(re) {
  const label = [...sheet().querySelectorAll('label')].find((l) => re.test(l.textContent || ''));
  await click(label.querySelector('input[type="radio"]'));
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('poe-current-profile', 'p1'); // Imported's PII gate on localhost
  clearLedgerMarks();
  publishLedgerEditor(null);
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = null; container = null;
  document.body.innerHTML = '';
});

const importedHarness = (opts = {}) => createElement(Harness, { initial: ledger(), ...opts }, (txns) => createElement(Imported, { data: { accounts: [{ id: 'a1', name: 'Chase 7206' }], transactions: txns }, recategorizePayee: () => 0 }));

describe('the walk: the shared editor is on every surface that shows a payee or category', () => {
  it('Books -> Imported: register payee + category, and every KPI report', async () => {
    const c = await mount(importedHarness());
    expect(c.querySelector('[data-ledger-edit="payee"]'), 'register payee').toBeTruthy();
    expect(c.querySelector('[data-ledger-edit="category"]'), 'register category').toBeTruthy();
    await click(btn(/All$/));
    await click(btn(/KPI.s · Standard reports/));
    for (const [tab, what] of [['Top payees', 'payee'], ['Top categories', 'category'], ['Recurring payments', 'payee']]) {
      await click(btn(new RegExp(`^${tab}$`)));
      const panel = c.querySelector('.scroll-mt-2');
      expect(panel.querySelector(`[data-ledger-edit="${what}"]`), `${tab} rows open the editor`).toBeTruthy();
    }
    await click(btn(/^All outputs$/));
    await click(btn(/Fuel/, c.querySelector('.scroll-mt-2')));
    expect(c.querySelector('.scroll-mt-2 li [data-ledger-edit="payee"]'), 'All outputs member rows').toBeTruthy();
    await click(btn(/^All income$/));
    await click(btn(/Salary/, c.querySelector('.scroll-mt-2')));
    expect(c.querySelector('.scroll-mt-2 li [data-ledger-edit="category"]'), 'All income member rows').toBeTruthy();
  });

  it('Books -> Debts: the spending drill-down and the low-priority list', async () => {
    const debtsEl = createElement(Harness, { initial: ledger() }, (txns) => createElement(Debts, {
      debts: [], entities: [], debtSnowballSort: 'snowball', setDebtSnowballSort: () => {}, debtSnowballExtra: 0, setDebtSnowballExtra: () => {},
      debtSnowball: { activeDebts: [], totalInterest: 0, allClearedDate: '—', allClearedMonth: 0, allClearedYears: 0, finalFreedCashFlow: 0 }, debtMinOnly: { totalInterest: 0, stuckDebts: [] }, currentDate: new Date(),
      transactions: txns, accounts: [{ id: 'a1', name: 'Chase 7206', type: 'checking' }], categoryRules: {}, recategorizePayee: () => 0,
    }));
    const c = await mount(debtsEl);
    await click(btn(/Kill opportunities/));
    expect(c.querySelector('details [data-ledger-edit="payee"]'), 'low-priority purchase list').toBeTruthy();
    const lowTile = [...c.querySelectorAll('button')].find((b) => /\$12/.test(b.textContent || '') && b.closest('.grid'));
    await click(lowTile);
    const dlg = document.querySelector('[role="dialog"]');
    expect(dlg.querySelector('[data-ledger-edit="payee"]'), 'drill-down source rows').toBeTruthy();
    expect(dlg.querySelector('[data-ledger-edit="category"]'), 'drill-down source rows carry the category').toBeTruthy();
  });

  it('Books -> Accounts: the "recurring payments that look like debts" payees', async () => {
    const c = await mount(createElement(Harness, { initial: ledger() }, (txns) => createElement(BooksAccounts, {
      entityRollups: [], entities: [{ id: 'e1', name: 'Personal' }], addAccount: () => {}, updateAccount: () => {}, deleteAccount: () => {},
      toggleAccountLegal: () => {}, bufferTarget: 0, bufferCurrent: 0, setBufferCurrent: () => {}, setBufferTarget: () => {}, totals: {}, ingestData: null,
      transactions: txns, categoryRules: {},
    })));
    expect(c.querySelector('[data-ledger-edit="payee"]')).toBeTruthy();
  });

  it('Books -> Tx: ledger rows carry the same editor beside the full Edit form', async () => {
    const c = await mount(createElement(Harness, { initial: ledger() }, (txns) => createElement(BooksTransactions, {
      data: { accounts: [{ id: 'a1', name: 'Chase 7206', entityId: 'e1' }], entities: [{ id: 'e1', name: 'Personal' }], transactions: txns },
      entityFilter: 'all', setEntityFilter: () => {}, currentDate: new Date(), addTransaction: () => {}, updateTransaction: () => {}, deleteTransaction: () => {},
      ingestData: null, visibleEntities: null, visibleEntityIds: null,
    })));
    const all = btn(/^All/, c);
    if (all) await click(all);
    expect(c.querySelector('[data-ledger-edit="payee"]')).toBeTruthy();
  });

  it('with no books on the mount it renders plain text, never a control that cannot save', async () => {
    const c = await mount(createElement(LedgerEdit, { payee: 'SHELL OIL 123' }));
    expect(c.textContent).toContain('SHELL OIL 123');
    expect(c.querySelector('[data-ledger-edit]')).toBeNull();
  });

  it('the shell publishes the SAME two functions it hands the Tx tab', () => {
    const shell = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/publishLedgerEditor\(\{ updateTransaction, recategorizePayee, demo: isAnyDemoMode, transactions: data\.transactions \|\| \[\] \}\)/);
    expect(shell).toMatch(/<BooksTransactions [^\n]*updateTransaction=\{updateTransaction\}[^\n]*recategorizePayee=\{recategorizePayee\}/);
  });
});

describe('an edit on Imported uses the Tx write path', () => {
  it('category for just this one -> updateTransaction(id, { category })', async () => {
    const spy = vi.fn();
    const c = await mount(importedHarness({ spy }));
    await click(btn(/All$/));
    await click(c.querySelector('[aria-label="Edit category Dining"]'));
    await setValue(sheet().querySelector('select'), 'groceries');
    await pickRadio(/Just this transaction/);
    await click(btn(/^Save$/, sheet()));
    expect(spy).toHaveBeenCalledWith('update', 'd1', { category: 'groceries' });
    expect(spy.mock.calls.some((k) => k[0] === 'recat')).toBe(false);
  });

  it('category for all from this payee -> recategorizePayee (learns the rule), and a new category typed in place', async () => {
    const spy = vi.fn();
    const c = await mount(importedHarness({ spy }));
    await click(btn(/All$/));
    await click(c.querySelector('[aria-label="Edit category Fuel"]'));
    await setValue(sheet().querySelector('select'), '__new__');
    await setValue(sheet().querySelector('input[aria-label="New category name"]'), 'Truck Fuel');
    await click(btn(/^Save$/, sheet()));
    expect(spy).toHaveBeenCalledWith('recat', expect.stringMatching(/^SHELL OIL/), 'truck-fuel');
  });
});

describe('"all from this payee" updates the rollups at once', () => {
  it('renaming every SHELL row folds Top payees into one line, and Undo restores it', async () => {
    const c = await mount(importedHarness());
    await click(btn(/All$/));
    await click(btn(/KPI.s · Standard reports/));
    await click(btn(/^Top payees$/));
    const panel = () => c.querySelector('.scroll-mt-2');
    expect(panel().textContent).toContain('SHELL OIL 123');
    await click(panel().querySelector('[aria-label="Edit payee SHELL OIL 123"]'));
    await setValue(sheet().querySelector('input'), 'Shell');
    await click(btn(/^Save$/, sheet()));
    expect(panel().textContent).not.toContain('SHELL OIL 123');
    expect(panel().textContent).not.toContain('SHELL OIL 456');
    expect(panel().textContent).toMatch(/Shell.*2×/);
    expect(panel().querySelector('[data-ledger-edited]'), 'the edited mark').toBeTruthy();
    await click(btn(/^Undo$/, panel()));
    expect(panel().textContent).toContain('SHELL OIL 123');
    expect(panel().textContent).toContain('SHELL OIL 456');
  });

  it('moving a category rollup relabels its rows and Top categories recomputes', async () => {
    const c = await mount(importedHarness());
    await click(btn(/All$/));
    await click(btn(/KPI.s · Standard reports/));
    await click(btn(/^Top categories$/));
    const panel = () => c.querySelector('.scroll-mt-2');
    await click(panel().querySelector('[aria-label="Edit category Fuel"]'));
    await setValue(sheet().querySelector('select'), 'vehicle');
    await click(btn(/^Save$/, sheet()));
    expect(panel().textContent).not.toMatch(/Fuel/);
    expect(panel().textContent).toMatch(/Vehicle/);
  });
});

describe('demo mode writes nothing', () => {
  it('the sheet says so, Save is disabled, and the write paths are never called', async () => {
    const spy = vi.fn();
    const c = await mount(importedHarness({ spy, demo: true }));
    await click(btn(/All$/));
    await click(c.querySelector('[data-ledger-edit="payee"]'));
    expect(sheet().textContent).toMatch(/Demo mode: nothing you change here is saved/);
    await setValue(sheet().querySelector('input'), 'Renamed');
    const save = btn(/^Save$/, sheet());
    expect(save.disabled).toBe(true);
    await click(save);
    expect(spy).not.toHaveBeenCalled();
  });

  it('applyLedgerEdit refuses in demo mode even when called directly', () => {
    const updateTransaction = vi.fn(); const recategorizePayee = vi.fn();
    const r = applyLedgerEdit({ demo: true, updateTransaction, recategorizePayee, transactions: ledger() }, { field: 'name', scope: 'one', id: 's1', value: 'X' });
    expect(r).toBeNull();
    expect(updateTransaction).not.toHaveBeenCalled();
    expect(recategorizePayee).not.toHaveBeenCalled();
  });
});

describe('the pure core', () => {
  it('scopes: one row, a payee (shared payeeKey), a category', () => {
    const t = ledger();
    expect(rowsInScope(t, { scope: 'one', id: 's1' }).map((r) => r.id)).toEqual(['s1']);
    expect(rowsInScope(t, { scope: 'payee', payee: 'SHELL OIL 999' }).map((r) => r.id)).toEqual(['s1', 's2']);
    expect(rowsInScope(t, { scope: 'category', category: 'fuel' }).map((r) => r.id)).toEqual(['s1', 's2']);
  });
  it('undo puts back each row\'s own earlier value', () => {
    const updateTransaction = vi.fn();
    const editor = { updateTransaction, transactions: ledger() };
    const rec = applyLedgerEdit(editor, { field: 'name', scope: 'payee', payee: 'SHELL OIL 123', value: 'Shell' });
    expect(updateTransaction).toHaveBeenCalledTimes(2);
    updateTransaction.mockClear();
    undoLedgerEdit(editor, rec);
    expect(updateTransaction).toHaveBeenCalledWith('s1', { description: 'SHELL OIL 123' });
    expect(updateTransaction).toHaveBeenCalledWith('s2', { description: 'SHELL OIL 456' });
  });
  it('Debts tiers follow a category edited on another tab (the stored label wins over the rules)', () => {
    const now = Date.now();
    const rows = [{ id: 'x', date: iso(DAY), amount: -20, description: 'STARBUCKS 1', category: 'groceries' }];
    const s = spendingByPriority(rows, { nowMs: now });
    expect(s.itemsByTier.low.length).toBe(0);
    const tier = Object.keys(s.itemsByTier).find((k) => s.itemsByTier[k].length);
    expect(s.itemsByTier[tier][0]).toMatchObject({ id: 'x', category: 'groceries' });
  });
});
