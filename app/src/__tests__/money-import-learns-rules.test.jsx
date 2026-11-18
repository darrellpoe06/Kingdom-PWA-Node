// money-import-learns-rules.test.jsx — Phase 1.4, Christina 2026-11-17,
// decision 2: a category corrected on the import card is remembered for the
// next import from that payee. Only a rule is saved: no row already in the
// books is re-labelled by an import approval.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rulesFromDecisions, learnImportRules, publishLedgerEditor } from '../lib/ledger-edit.js';
import BooksUpload from '../components/BooksUpload.jsx';

vi.mock('../lib/books-intake-cloud.js', () => ({ keepOriginalInCloud: async () => ({ ok: false, reason: 'test' }) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

const ITEMS = [
  { date: '2026-11-15', description: 'CIRCLE K 1234', amount: -45 },
  { date: '2026-11-14', description: 'WALMART SUPERCENTER', amount: -82.1 },
  { date: '2026-11-14', description: 'ZELLE PAYMENT TO BG & MOM JPM99D23', amount: -750 },
];

describe('which choices become rules', () => {
  it('only the categories the person chose, on rows kept; one per payee', () => {
    const rules = rulesFromDecisions(ITEMS, { 0: { category: 'vehicle' }, 1: { exclude: true, category: 'household' }, 2: {} });
    expect(rules).toEqual([{ description: 'CIRCLE K 1234', category: 'vehicle' }]);
  });
  it('saves through the editor, and nothing in demo or without an editor', () => {
    const learnPayeeRule = vi.fn();
    const doc = { extraction: { line_items: ITEMS }, rowDecisions: { 1: { category: 'household' } } };
    expect(learnImportRules({ learnPayeeRule }, doc)).toBe(1);
    expect(learnPayeeRule).toHaveBeenCalledWith('WALMART SUPERCENTER', 'household');
    expect(learnImportRules({ learnPayeeRule, demo: true }, doc)).toBe(0);
    expect(learnImportRules(null, doc)).toBe(0);
  });
});

describe('the shell saves a rule and only a rule', () => {
  it('learnPayeeRule writes data.categoryRules and never touches transactions (PROVEN TO CATCH: a back-apply here would re-label past rows)', () => {
    const src = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    const m = src.match(/learnPayeeRule: \(desc, cat\) => \{([^}]*\}[^}]*)\}/);
    expect(m).not.toBeNull();
    expect(m[1]).toContain('categoryRules');
    expect(m[1]).not.toMatch(/transactions|applyCategoryToPayee|updateRow/);
  });
});

describe('on the card', () => {
  let root = null;
  let host = null;
  afterEach(() => {
    if (root) act(() => root.unmount());
    if (host) host.remove();
    root = null;
    host = null;
    publishLedgerEditor(null);
  });
  async function until(fn, ms = 8000) {
    const t0 = Date.now();
    for (;;) {
      const v = fn();
      if (v) return v;
      if (Date.now() - t0 > ms) throw new Error('timed out waiting');
      await act(async () => {
        await new Promise((r) => setTimeout(r, 25));
      });
    }
  }
  it('change Walmart to Household, Approve: the rule is saved, and no existing row is edited', { timeout: 30000 }, async () => {
    const SCREEN = [
      'Chase',
      'TOTAL CHECKING (...7206)',
      'Available balance $4,687.18',
      'as of Nov 16, 2026',
      'Transactions',
      'Nov 15 CIRCLE K 1234 -$45.00',
      'Nov 14 WALMART SUPERCENTER -$82.10',
    ].join('\n');
    const file = {
      name: 's.txt',
      type: 'text/plain',
      size: SCREEN.length,
      text: async () => SCREEN,
      arrayBuffer: async () => new TextEncoder().encode(SCREEN).buffer,
    };
    const editor = { learnPayeeRule: vi.fn(), updateTransaction: vi.fn(), recategorizePayee: vi.fn(), demo: false, transactions: [] };
    publishLedgerEditor(editor);
    const written = [];
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() =>
      root.render(
        createElement(BooksUpload, {
          hint: 'overview',
          data: {
            accounts: [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
            entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
            transactions: [],
          },
          debts: [],
          commitImportedRows: async (rows) => {
            written.push(...rows);
            return { saved: rows.length };
          },
          addAccount: () => {},
          updateAccount: () => {},
          onClose: () => {},
        })
      )
    );
    const input = await until(() => document.querySelector('[data-testid="books-upload-input"]'));
    await act(async () => {
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const select = await until(() => document.querySelector('[data-testid="intake-row-category-1"]'));
    await act(async () => {
      select.value = 'household';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await until(() => document.querySelector('[data-testid="intake-row-category-1"]').value === 'household');
    const approve = [...document.querySelectorAll('button')].find((b) => /Approve/.test(b.textContent));
    await act(async () => {
      approve.click();
    });
    await until(() => editor.learnPayeeRule.mock.calls.length > 0);
    expect(editor.learnPayeeRule.mock.calls).toEqual([['WALMART SUPERCENTER', 'household']]);
    expect(editor.recategorizePayee).not.toHaveBeenCalled();
    expect(editor.updateTransaction).not.toHaveBeenCalled();
    expect(written.find((r) => r.description === 'WALMART SUPERCENTER')).toMatchObject({ category: 'household' });
  });
});
