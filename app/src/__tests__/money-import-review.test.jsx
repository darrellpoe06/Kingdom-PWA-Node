// money-import-review.test.jsx — Phase 1.3b, the person's say over each
// imported row (Christina 2026-11-16, Task 1: "Present extracted transactions
// for my approval before importing. Allow individual and bulk transaction
// approval, editing, categorization, and rejection ... Suggest categories based
// on descriptions and previously confirmed transactions").
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { reviewLineItems, rowStatuses } from '../lib/intake-row-review.js';
import { payeeKey } from '../lib/categorize.js';
import { memoryStore } from '../lib/books-intake-store.js';
import { intakeFiles, decideRows, commitDoc } from '../lib/books-intake-pipeline.js';
import BooksUpload from '../components/BooksUpload.jsx';

vi.mock('../lib/books-intake-cloud.js', () => ({ keepOriginalInCloud: async () => ({ ok: false, reason: 'test' }) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SCREEN = [
  'Chase',
  'TOTAL CHECKING (...7206)',
  'Available balance $4,687.18',
  'as of Nov 16, 2026',
  'Transactions',
  'Nov 15 CIRCLE K 1234 -$45.00',
  'Nov 14 WALMART SUPERCENTER -$82.10',
  'Nov 14 ZELLE PAYMENT TO BG & MOM JPM99D23 -$750.00',
  'Nov 13 CASH APP*DARRELL POE +$700.00',
].join('\n');
const ACCOUNTS = [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }];
const ENTITIES = [{ id: 'e-personal', name: 'Personal', type: 'personal' }];
const fakeFile = (body) => ({ name: 's.txt', type: 'text/plain', size: body.length, text: async () => body, arrayBuffer: async () => new TextEncoder().encode(body).buffer });
const ctx = (store, extra = {}) => ({ store, hint: 'overview', known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [], ...extra }, reader: async (f) => ({ text: await f.text(), method: 'ocr:test' }) });

describe('categories are suggested, and your own rules come first', () => {
  const rows = [
    { date: '2026-11-15', description: 'CIRCLE K 1234', amount: -45 },
    { date: '2026-11-14', description: 'WALMART SUPERCENTER', amount: -82.1 },
    { date: '2026-11-14', description: 'ZELLE PAYMENT TO BG & MOM JPM99D23', amount: -750 },
    { date: '2026-11-13', description: 'CASH APP*DARRELL POE', amount: 700, category: 'transfer' },
  ];
  it('built-in suggestions are marked as suggestions', () => {
    const out = reviewLineItems(rows);
    expect(out.map((r) => [r.category, r.categorySource])).toEqual([
      ['fuel', 'suggested'], ['groceries', 'suggested'], [undefined, undefined], ['transfer', undefined],
    ]);
  });
  it('a Zelle payment is never suggested as a transfer: a bill paid by Zelle stays a payment (PROVEN TO CATCH)', () => {
    const zelle = reviewLineItems([rows[2]])[0];
    expect(zelle.category).not.toBe('transfer');
  });
  it('a rule you made by correcting a category wins over the built-in one', () => {
    const learned = { [payeeKey('WALMART SUPERCENTER')]: 'household' };
    expect(reviewLineItems([rows[1]], {}, learned)[0]).toMatchObject({ category: 'household', categorySource: 'your rule' });
  });
  it('your choice on this row wins over both; a left-out row is dropped', () => {
    const out = reviewLineItems(rows, { 0: { category: 'vehicle' }, 1: { exclude: true } });
    expect(out.map((r) => r.description)).not.toContain('WALMART SUPERCENTER');
    expect(out[0]).toMatchObject({ category: 'vehicle', categorySource: 'you' });
  });
  it('row statuses: new, already in the books, or left out', () => {
    const planned = [rows[0], rows[3]];
    const st = rowStatuses(rows, { 2: { exclude: true } }, null, planned);
    expect(st.map((s) => s.status)).toEqual(['new', 'duplicate', 'excluded', 'new']);
  });
});

describe('decisions shape exactly what Approve writes', () => {
  it('leave a row out, recategorize another, and Approve writes only what the card shows', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile(SCREEN)], ctx(store));
    expect(doc.plan.kind).toBe('snapshot');
    expect(doc.plan.rowStatuses.map((s) => s.status)).toEqual(['new', 'new', 'new', 'new']);
    const d2 = await decideRows(doc, { 1: { exclude: true }, 0: { category: 'vehicle' } }, ctx(store));
    expect(d2.plan.rows.map((r) => r.description)).toEqual(['CIRCLE K 1234', 'ZELLE PAYMENT TO BG & MOM JPM99D23', 'CASH APP*DARRELL POE']);
    expect(d2.plan.rows[0]).toMatchObject({ category: 'vehicle' });
    expect(d2.plan.rowStatuses[0].row).toMatchObject({ category: 'vehicle', categorySource: 'you' });
    expect(d2.plan.rowStatuses.map((s) => s.status)).toEqual(['new', 'excluded', 'new', 'new']);
    const written = [];
    const out = await commitDoc(d2, { store, sinks: { commitImportedRows: async (r) => { written.push(...r); return { saved: r.length }; } }, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] } });
    expect(out.status).toBe('added');
    const txRows = written.filter((r) => r.category !== 'balance-checkpoint');
    expect(written.filter((r) => r.category === 'balance-checkpoint')).toHaveLength(1);
    expect(txRows.map((r) => [r.description, r.amount, r.category])).toEqual([
      ['CIRCLE K 1234', -45, 'vehicle'],
      ['ZELLE PAYMENT TO BG & MOM JPM99D23', -750, 'other'],
      ['CASH APP*DARRELL POE', 700, 'transfer'],
    ]);
  });
  it('clearing a decision puts the row back as read', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile(SCREEN)], ctx(store));
    const d2 = await decideRows(doc, { 1: { exclude: true } }, ctx(store));
    const d3 = await decideRows(d2, { 1: {} }, ctx(store));
    expect(d3.plan.rowStatuses[1].status).toBe('new');
    expect(d3.plan.rows).toHaveLength(4);
  });
  it('a row already in the books is marked so and never written twice', async () => {
    const store = memoryStore();
    const existing = [{ id: 't1', accountId: 'a-7206', date: '2026-11-15', description: 'CIRCLE K 1234', amount: -45 }];
    const [doc] = await intakeFiles([fakeFile(SCREEN)], ctx(store, { transactions: existing }));
    expect(doc.plan.rowStatuses[0].status).toBe('duplicate');
    expect(doc.plan.rows.map((r) => r.description)).not.toContain('CIRCLE K 1234');
  });
});

describe('the review card on a phone', () => {
  let root = null; let host = null;
  afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });
  async function until(fn, ms = 8000) {
    const t0 = Date.now();
    for (;;) {
      const v = fn();
      if (v) return v;
      if (Date.now() - t0 > ms) throw new Error('timed out waiting');
      await act(async () => { await new Promise((r) => setTimeout(r, 25)); });
    }
  }
  it('every row has its box and category; unchecking one and Approve writes the rest', { timeout: 30000 }, async () => {
    const written = [];
    host = document.createElement('div'); host.style.width = '360px'; document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(createElement(BooksUpload, { hint: 'overview', data: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] }, debts: [], commitImportedRows: async (rows) => { written.push(...rows); return { saved: rows.length }; }, addAccount: () => {}, updateAccount: () => {}, onClose: () => {} })));
    const input = await until(() => document.querySelector('[data-testid="books-upload-input"]'));
    await act(async () => {
      Object.defineProperty(input, 'files', { configurable: true, value: [fakeFile(SCREEN)] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await until(() => document.querySelector('[data-testid="intake-rows-summary"]'));
    expect(document.querySelector('[data-testid="intake-rows-summary"]').textContent).toBe('4 of 4 rows will be added');
    expect(document.querySelector('[data-testid="intake-row-category-0"]').value).toBe('fuel');
    expect(document.querySelector('[data-testid="intake-row-category-source-0"]').textContent).toBe('suggested');
    // leave Walmart out
    await act(async () => { document.querySelector('[data-testid="intake-row-add-1"]').click(); });
    await until(() => /3 of 4 rows will be added/.test(document.querySelector('[data-testid="intake-rows-summary"]').textContent));
    const approve = [...document.querySelectorAll('button')].find((b) => /Approve/.test(b.textContent));
    expect(approve.textContent).toMatch(/\+ 3 new rows/);
    await act(async () => { approve.click(); });
    const txOnly = () => written.filter((r) => r.category !== 'balance-checkpoint');
    await until(() => txOnly().length === 3);
    expect(txOnly().map((r) => r.description)).toEqual(['CIRCLE K 1234', 'ZELLE PAYMENT TO BG & MOM JPM99D23', 'CASH APP*DARRELL POE']);
  });
});
