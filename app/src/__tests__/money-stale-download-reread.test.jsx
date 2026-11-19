// Christina 2026-11-19, on the live Upload screen: her Chase7206_Activity_20261118.tsv
// showed as "Banking app screenshot (balance + recent activity)" with no rows.
// Cause: it was uploaded before the tab-separated reader (#2760); the stored copy
// kept that first read (no rows), and with no rows the page text scored as a
// screenshot. A download is a table, never a screenshot, and a download read by
// the older reader is read again from the kept file, shown for review, and
// nothing is written until she approves.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { memoryStore } from '../lib/books-intake-store.js';
import { processDoc } from '../lib/books-intake-pipeline.js';
import { extractDocument } from '../lib/books-intake-extract.js';
import { TABLE_READER_VERSION } from '../lib/books-intake-read.js';

const seeded = { store: null };
vi.mock('../lib/books-intake-store.js', async (orig) => {
  const real = await orig();
  return { ...real, intakeStore: () => seeded.store || real.memoryStore() };
});
vi.mock('../lib/books-intake-cloud.js', () => ({ keepOriginalInCloud: async () => ({ ok: false, reason: 'test' }) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NAME = 'Chase7206_Activity_20261118.tsv';
const TSV = [
  ['Details', 'Posting Date', 'Description', 'Amount', 'Type', 'Balance', 'Check or Slip #'],
  ['DEBIT', '11/17/2026', 'CIRCLE K 05123 PHOENIX AZ', '-40.00', 'DEBIT_CARD', '2059.78', ''],
  ['DEBIT', '11/15/2026', 'Zelle payment to TLC JPM99ab12', '-837.00', 'QUICKPAY_DEBIT', '2099.78', ''],
  ['CREDIT', '11/15/2026', 'Online Transfer from GMR ...3800 transaction#: 123', '55.00', 'ACCT_XFER', '2936.78', ''],
  ['CREDIT', '11/14/2026', 'MYSTERY CO 88', '12.34', 'ACH_CREDIT', '2881.78', ''],
  ['DEBIT', 'not a date', 'BROKEN ROW', '-1.00', 'DEBIT', '0', ''],
]
  .map((r) => r.join('\t'))
  .join('\n');
const blob = () => ({ name: NAME, type: '', size: TSV.length, text: async () => TSV, arrayBuffer: async () => new TextEncoder().encode(TSV).buffer });
const ACCOUNTS = [
  { id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 },
  { id: 'a-3322', name: 'Chase 3322', fragment: '3322', type: 'checking', entityId: 'e-poeprops', balance: 0 },
];
const ENTITIES = [
  { id: 'e-personal', name: 'Personal', type: 'personal' },
  { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' },
];
// Already in the books from her screenshot: the $837 tithe.
const IN_BOOKS = [{ id: 'shot-1', accountId: 'a-7206', date: '2026-11-15', description: 'Zelle payment to TLC', amount: -837, category: 'tithe', source: 'screenshot' }];
// What the stored copy looked like after the pre-#2760 read: every line one cell.
const staleDoc = () => ({
  id: 'doc-stale',
  name: NAME,
  type: '',
  size: TSV.length,
  receivedAt: '2026-11-18T20:00:00.000Z',
  blob: blob(),
  status: 'needs-answer',
  questions: [],
  links: [],
  read: {
    text: TSV,
    rows: [],
    rejected: TSV.split('\n').slice(1).map((raw, i) => ({ line: i + 2, reason: 'unreadable-date', raw })),
    headerSignature: '',
    method: 'text',
  },
  extraction: { doc_type: 'account-snapshot', confidence: 0.6 },
});

describe('a download is a table, never a banking-app screenshot', () => {
  it('with no rows read, it is still a transactions download', () => {
    const x = extractDocument(staleDoc().read, { name: NAME }, { hint: 'overview' });
    expect(x.doc_type).toBe('transactions-export');
  });
  it('a remembered "screenshot" answer does not force a download into the screenshot reader', () => {
    const x = extractDocument(staleDoc().read, { name: NAME }, { hint: 'overview', forceType: 'account-snapshot' });
    expect(x.doc_type).toBe('transactions-export');
  });
  it('a real screenshot (read by OCR) is still a screenshot', () => {
    const x = extractDocument(
      { text: 'Chase Total Checking (...7206)\nAvailable balance $2,059.78\nPresent balance $2,099.78\nPending\nRecent activity', method: 'ocr:device' },
      { name: 'IMG_1.png' },
      { hint: 'overview' }
    );
    expect(x.doc_type).toBe('account-snapshot');
  });
});

describe('the stored Chase7206 TSV is read again from its kept file', () => {
  it('Chase 7206, every line accounted for, the tithe already in the books, nothing written', async () => {
    const store = memoryStore();
    const before = staleDoc();
    await store.putDoc(before);
    const frozen = JSON.stringify(IN_BOOKS);
    const doc = await processDoc(before, { store, hint: 'overview', known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: IN_BOOKS } });
    expect(doc.read.readerVersion).toBe(TABLE_READER_VERSION);
    expect(doc.extraction.doc_type).toBe('transactions-export');
    expect(doc.matched.account.accountId).toBe('a-7206');
    expect(doc.plan.kind).toBe('transactions');
    expect(doc.plan.rowStatuses.map((s) => [s.row.date, s.row.description, s.row.amount, s.status])).toEqual([
      ['2026-11-17', 'CIRCLE K 05123 PHOENIX AZ', -40, 'new'],
      ['2026-11-15', 'Zelle payment to TLC JPM99ab12', -837, 'duplicate'],
      ['2026-11-15', 'Online Transfer from GMR ...3800 transaction#: 123', 55, 'new'],
      ['2026-11-14', 'MYSTERY CO 88', 12.34, 'new'],
    ]);
    expect(doc.plan.unreadable.map((u) => u.raw)).toEqual([expect.stringContaining('BROKEN ROW')]);
    // Every source line: 4 read + 1 unreadable = the 5 data lines.
    expect(doc.plan.rowStatuses.length + doc.plan.unreadable.length).toBe(TSV.split('\n').length - 1);
    expect(doc.status).not.toBe('added');
    expect(doc.blob.name).toBe(NAME); // the original file is kept
    expect(JSON.stringify(IN_BOOKS)).toBe(frozen);
  });
  it('a current read is not read again', async () => {
    const store = memoryStore();
    let reads = 0;
    const d = { ...staleDoc(), read: null };
    const first = await processDoc(d, { store, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] }, reader: async (f) => { reads += 1; const { readAnyFile } = await import('../lib/books-intake-read.js'); return readAnyFile(f); } });
    await processDoc(first, { store, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] }, reader: async () => { reads += 1; throw new Error('should not re-read'); } });
    expect(reads).toBe(1);
  });
});

describe('on the Upload screen, without uploading again', () => {
  let root = null;
  let host = null;
  afterEach(() => {
    if (root) act(() => root.unmount());
    if (host) host.remove();
    root = null;
    host = null;
    seeded.store = null;
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
  it('the stored TSV opens as a download with its four counts and full-width descriptions; nothing is added', { timeout: 30000 }, async () => {
    seeded.store = memoryStore();
    await seeded.store.putDoc(staleDoc());
    const written = [];
    const { default: BooksUpload } = await import('../components/BooksUpload.jsx');
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
    const counts = await until(() => document.querySelector('[data-testid="intake-rows-counts"]'));
    expect(counts.textContent).toBe('New 3 · Already in the books 1 · Need review 2 · Could not be read 1');
    expect(document.querySelector('[data-testid="intake-doc"]').textContent).toMatch(/Transactions download/);
    expect(document.querySelector('[data-testid="intake-doc"]').textContent).not.toMatch(/Banking app screenshot/);
    const desc = [...document.querySelectorAll('[data-testid="intake-row-description"]')];
    expect(desc).toHaveLength(4);
    for (const d of desc) {
      expect(d.className).toMatch(/\bw-full\b/);
      expect(d.className).toMatch(/whitespace-normal/);
    }
    expect(written).toEqual([]);
  });
});

describe('a screenshot row and its download row are one transaction; nothing else is merged', async () => {
  const { planBulkImport } = await import('../lib/bulk-statement-import.js');
  const acct = [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206' }];
  const shot = { id: 's1', accountId: 'a-7206', date: '2026-11-15', description: 'Zelle payment to TLC', amount: -837 };
  const plan = (rows, existing = [shot]) => planBulkImport([{ name: NAME, rows }], acct, existing, 'a-7206');
  it('the download’s longer text for the same day and amount is already in the books', () => {
    expect(plan([{ date: '2026-11-15', description: 'Zelle payment to TLC JPM99ab12', amount: -837, balance: 2099.78 }]).duplicates).toBe(1);
  });
  it('a different payee on the same day for the same amount is new', () => {
    expect(plan([{ date: '2026-11-15', description: 'Zelle payment to TLCX', amount: -837, balance: 2099.78 }]).duplicates).toBe(0);
    expect(plan([{ date: '2026-11-15', description: 'Zelle payment to Bob', amount: -837, balance: 2099.78 }]).duplicates).toBe(0);
  });
  it('one screenshot row answers for one download row: a second identical download row is new', () => {
    const r = { date: '2026-11-15', description: 'Zelle payment to TLC JPM99ab12', amount: -837, balance: 2099.78 };
    expect(plan([r, { ...r, balance: 1262.78 }]).duplicates).toBe(1);
  });
  it('two screenshots (no running balance on either) are never merged on a prefix', () => {
    expect(plan([{ date: '2026-11-15', description: 'Zelle payment to TLC JPM99ab12', amount: -837 }]).duplicates).toBe(0);
  });
});
