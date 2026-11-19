// A bank download (Chase CSV/TSV) is reviewed row by row before Approve, like a
// screenshot (Christina 2026-11-18: "Before I approve imported transactions, I
// want to see which are new, which are duplicates, which need review, and which
// could not be imported"). Before this the card showed only counts.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { memoryStore } from '../lib/books-intake-store.js';
import { intakeFiles, commitDoc, decideRows } from '../lib/books-intake-pipeline.js';
import BooksUpload from '../components/BooksUpload.jsx';

vi.mock('../lib/books-intake-cloud.js', () => ({ keepOriginalInCloud: async () => ({ ok: false, reason: 'test' }) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const HEADER = ['Details', 'Posting Date', 'Description', 'Amount', 'Type', 'Balance', 'Check or Slip #'];
const TSV = [
  HEADER,
  ['DEBIT', '11/16/2026', 'CIRCLE K 1234', '-40.00', 'DEBIT_CARD', '3901.72', ''], // new, fuel
  ['DEBIT', '11/16/2026', 'Zelle payment to TLC', '-75.00', 'QUICKPAY_DEBIT', '3941.72', ''], // already in the books (from a screenshot)
  ['CREDIT', '11/15/2026', 'MYSTERY CO 88', '12.34', 'ACH_CREDIT', '4016.72', ''], // new, no category: needs review
  ['DEBIT', 'not a date', 'BROKEN ROW', '-1.00', 'DEBIT', '0', ''], // could not be read
]
  .map((r) => r.join('\t'))
  .join('\n');
const ACCOUNTS = [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }];
const ENTITIES = [{ id: 'e-personal', name: 'Personal', type: 'personal' }];
const IN_BOOKS = [{ id: 'shot-1', accountId: 'a-7206', date: '2026-11-16', description: 'Zelle payment to TLC', amount: -75, source: 'screenshot' }];
const file = () => ({
  name: 'Chase7206_Activity.tsv',
  type: 'text/tab-separated-values',
  size: TSV.length,
  text: async () => TSV,
  arrayBuffer: async () => new TextEncoder().encode(TSV).buffer,
});

describe('the plan for a download says, row by row, what Approve will do', () => {
  it('new, already in the books, needs review, and could not be read', async () => {
    const store = memoryStore();
    const known = { accounts: ACCOUNTS, entities: ENTITIES, transactions: IN_BOOKS };
    const [doc] = await intakeFiles([file()], { store, hint: 'overview', known });
    expect(doc.plan.kind).toBe('transactions');
    expect(doc.plan.rowStatuses.map((s) => [s.row.description, s.status])).toEqual([
      ['CIRCLE K 1234', 'new'],
      ['Zelle payment to TLC', 'duplicate'],
      ['MYSTERY CO 88', 'new'],
    ]);
    expect(doc.plan.unreadable.map((u) => u.reason)).toEqual(['unreadable-date']);
    expect(doc.plan.unreadable[0].raw).toContain('BROKEN ROW');
  });

  it('a row she leaves out is not written; nothing already in the books is touched', async () => {
    const store = memoryStore();
    const known = { accounts: ACCOUNTS, entities: ENTITIES, transactions: IN_BOOKS };
    const ctx = { store, hint: 'overview', known };
    const [doc] = await intakeFiles([file()], ctx);
    const decided = await decideRows(doc, { 2: { exclude: true } }, ctx);
    const written = [];
    const frozen = JSON.stringify(IN_BOOKS);
    await commitDoc(decided, {
      store,
      known,
      sinks: {
        commitImportedRows: async (rows) => {
          written.push(...rows);
          return { total: rows.length, saved: rows.length };
        },
      },
    });
    expect(written.map((r) => [r.description, r.amount])).toEqual([['CIRCLE K 1234', -40]]);
    expect(JSON.stringify(IN_BOOKS)).toBe(frozen);
  });
});

describe('the card shows it before Approve', () => {
  let root = null;
  let host = null;
  afterEach(() => {
    if (root) act(() => root.unmount());
    if (host) host.remove();
    root = null;
    host = null;
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
  it('the four counts, each row with its status, and the unreadable line', { timeout: 30000 }, async () => {
    const written = [];
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() =>
      root.render(
        createElement(BooksUpload, {
          hint: 'overview',
          data: { accounts: ACCOUNTS, entities: ENTITIES, transactions: IN_BOOKS },
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
      Object.defineProperty(input, 'files', { configurable: true, value: [file()] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const counts = await until(() => document.querySelector('[data-testid="intake-rows-counts"]'));
    expect(counts.textContent).toBe('New 2 · Already in the books 1 · Need review 1 · Could not be read 1');
    const rows = [...document.querySelectorAll('[data-testid="intake-snapshot-row"]')];
    expect(rows.map((r) => r.getAttribute('data-status'))).toEqual(['new', 'duplicate', 'new']);
    expect(rows[1].textContent).toContain('already in the books');
    expect(rows[2].textContent).toContain('needs review');
    expect(document.querySelector('[data-testid="intake-unreadable-row"]').textContent).toMatch(/could not be read \(unreadable-date\).*BROKEN ROW/);
    expect(written).toEqual([]);
  });
});

describe('a download goes to the account its file names, never one its rows mention', () => {
  const ACCTS = [...ACCOUNTS, { id: 'a-3322', name: 'Chase 3322', fragment: '3322', type: 'checking', entityId: 'e-poeprops' }];
  const ENTS = [...ENTITIES, { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' }];
  const body = [
    HEADER,
    ['CREDIT', '11/15/2026', 'Transfer from Chase 3322', '2201.00', 'ACCT_XFER', '3322.00', ''],
    ['DEBIT', '11/16/2026', 'CIRCLE K 1234', '-40.00', 'DEBIT_CARD', '3282.00', ''],
  ]
    .map((r) => r.join(','))
    .join('\n');
  const up = async (name, text = body) => {
    const [doc] = await intakeFiles(
      [{ name, type: 'text/csv', size: text.length, text: async () => text, arrayBuffer: async () => new TextEncoder().encode(text).buffer }],
      {
        store: memoryStore(),
        hint: 'overview',
        known: { accounts: ACCTS, entities: ENTS, transactions: [] },
      }
    );
    return doc;
  };
  it('Chase7206_Activity_20261117.CSV goes to Chase 7206 (Personal), not to 3322 named in a row and a balance', async () => {
    const doc = await up('Chase7206_Activity_20261117.CSV');
    expect(doc.matched.account.accountId).toBe('a-7206');
    expect(doc.plan.accountId).toBe('a-7206');
  });
  it('a file whose name names no account asks which one, never guesses', async () => {
    const doc = await up('activity.csv');
    expect(doc.matched.account.accountId).toBe(null);
    expect((doc.questions || []).some((q) => q.field === 'account' && q.status === 'open')).toBe(true);
  });
  it('digits the bank prints above the headings ("Account ending in 3322") still decide', async () => {
    const doc = await up('activity.csv', ['Account ending in 3322', body].join('\n'));
    expect(doc.matched.account.accountId).toBe('a-3322');
  });
});
