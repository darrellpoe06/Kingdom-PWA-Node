// money-import-accuracy.test.jsx — Phase 1.3a, transaction import accuracy
// (Christina 2026-11-16, Task 1: "individual transactions are not consistently
// appearing in the Transactions section"). Every case below was measured
// failing on the old screenshot reader before this change: rows dropped,
// purchases saved as deposits, a running balance saved as the amount, rows
// invisible until the day was answered, and "hold" writing rows anyway.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readSnapshotRows, readMoney } from '../lib/snapshot-rows.js';
import { extractDocument } from '../lib/books-intake-extract.js';
import { memoryStore } from '../lib/books-intake-store.js';
import { intakeFiles, answer, commitDoc } from '../lib/books-intake-pipeline.js';
import BooksUpload from '../components/BooksUpload.jsx';

vi.mock('../lib/books-intake-cloud.js', () => ({ keepOriginalInCloud: async () => ({ ok: false, reason: 'test' }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const AS_OF = '2026-11-16';
const rowsOf = (text, asOf = AS_OF) => readSnapshotRows(text, { asOf }).rows.map((r) => [r.date, r.description, r.amount]);

describe('every money form a bank prints is read with its sign', () => {
  it.each([
    ['-$12.00', -12],
    ['$-12.00', -12],
    ['($12.00)', -12],
    ['12.00-', -12],
    ['−12.00', -12],
    ['−$12.00', -12],
    ['+$700.00', 700],
    ['$700.00', 700],
    ['1,912.40', 1912.4],
    ['-$1,234.56', -1234.56],
  ])('%s → %d', (token, value) => {
    expect(readMoney(token).value).toBe(value);
  });
  it('a purchase written "$-45.00" or "−45.00" is money OUT, never a deposit (PROVEN TO CATCH)', () => {
    expect(rowsOf('Nov 14 CIRCLE K 1234 $-45.00\nNov 13 WALMART −82.10')).toEqual([
      ['2026-11-14', 'CIRCLE K 1234', -45],
      ['2026-11-13', 'WALMART', -82.1],
    ]);
  });
  it('parentheses are money out', () => {
    expect(rowsOf('11/12 AMEREN ILLINOIS ($161.04)')).toEqual([['2026-11-12', 'AMEREN ILLINOIS', -161.04]]);
  });
});

describe('the running balance is never taken as the amount', () => {
  it('two amounts at the end of a row: the first is the transaction, the second the balance (PROVEN TO CATCH)', () => {
    expect(rowsOf('Nov 14 CIRCLE K 1234 -45.00 4,642.18\nNov 13 UIUC PAYROLL 1,912.40 4,687.18')).toEqual([
      ['2026-11-14', 'CIRCLE K 1234', -45],
      ['2026-11-13', 'UIUC PAYROLL', 1912.4],
    ]);
  });
});

describe('rows the old reader dropped are read', () => {
  it('Today and Yesterday take their day from the screenshot', () => {
    expect(rowsOf('Today ZELLE PAYMENT TO BG & MOM -$750.00\nYesterday CIRCLE K -$40.00')).toEqual([
      ['2026-11-16', 'ZELLE PAYMENT TO BG & MOM', -750],
      ['2026-11-15', 'CIRCLE K', -40],
    ]);
  });
  it("rows grouped under a date heading take the heading's day", () => {
    const text = ['Monday, November 16', 'CIRCLE K 1234 -$45.00', 'WALMART SUPERCENTER -$82.10', 'Friday, Nov 13', 'UIUC PAYROLL DIRECT DEP $1,912.40'].join(
      '\n'
    );
    expect(rowsOf(text)).toEqual([
      ['2026-11-16', 'CIRCLE K 1234', -45],
      ['2026-11-16', 'WALMART SUPERCENTER', -82.1],
      ['2026-11-13', 'UIUC PAYROLL DIRECT DEP', 1912.4],
    ]);
  });
  it('a description and its amount on two lines are one row', () => {
    const text = ['Nov 14', 'CIRCLE K 1234', '-$45.00', 'ZELLE PAYMENT TO BG & MOM', '-$750.00'].join('\n');
    expect(rowsOf(text)).toEqual([
      ['2026-11-14', 'CIRCLE K 1234', -45],
      ['2026-11-14', 'ZELLE PAYMENT TO BG & MOM', -750],
    ]);
  });
  it('a balance label and its figure are never read as a row', () => {
    expect(rowsOf(['Available balance', '$4,687.18', 'Present balance $5,062.72', 'Nov 14 CIRCLE K -$45.00'].join('\n'))).toEqual([
      ['2026-11-14', 'CIRCLE K', -45],
    ]);
  });
  it('a row dated after the screenshot is left out; a month after it belongs to the year before', () => {
    expect(rowsOf('Nov 20 FUTURE -$1.00\nDec 30 LAST YEAR -$2.00')).toEqual([['2025-12-30', 'LAST YEAR', -2]]);
  });
});

describe('signs are never guessed', () => {
  it('on a screen that signs its debits, an unsigned row is money in', () => {
    const { rows, signsKnown } = readSnapshotRows('Nov 14 CIRCLE K -$45.00\nNov 13 UIUC PAYROLL $1,912.40', { asOf: AS_OF });
    expect(signsKnown).toBe(true);
    expect(rows.map((r) => [r.amount, !!r.signUnknown])).toEqual([
      [-45, false],
      [1912.4, false],
    ]);
  });
  it('on a screen that signs nothing, every row is "in or out?" and a blocking question is asked (PROVEN TO CATCH)', () => {
    const text = [
      'Chase',
      'TOTAL CHECKING (...7206)',
      'Available balance $4,687.18',
      'as of Nov 16, 2026',
      'Nov 14 CIRCLE K 1234 $45.00',
      'Nov 13 WALMART $82.10',
    ].join('\n');
    const x = extractDocument({ text }, { name: 's.jpg' }, { hint: 'overview' });
    expect(x.doc_type).toBe('account-snapshot');
    expect(x.uncertain).toContain('signs');
    expect(x.preview_items.every((r) => r.signUnknown)).toBe(true);
    const out = extractDocument({ text }, { name: 's.jpg' }, { hint: 'overview', forceType: 'account-snapshot', signs: 'out' });
    expect(out.uncertain).not.toContain('signs');
    expect(out.line_items.map((r) => r.amount)).toEqual([-45, -82.1]);
  });
});

describe('the pipeline: rows before the day, the sign question, and hold', () => {
  const ACCOUNTS = [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }];
  const ENTITIES = [{ id: 'e-personal', name: 'Personal', type: 'personal' }];
  const fakeFile = (name, body) => ({
    name,
    type: 'image/jpeg',
    size: body.length,
    text: async () => body,
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  });
  const ctx = (store) => ({
    store,
    hint: 'overview',
    known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] },
    reader: async (f) => ({ text: await f.text(), method: 'ocr:test' }),
  });
  const NO_DATE = [
    'Chase',
    'TOTAL CHECKING (...7206)',
    'Available balance',
    '$4,687.18',
    'Transactions',
    'Nov 14 CIRCLE K 1234 -$45.00',
    'Nov 13 UIUC PAYROLL DIRECT DEP $1,912.40',
  ].join('\n');
  const UNSIGNED = [
    'Chase',
    'TOTAL CHECKING (...7206)',
    'Available balance $4,687.18',
    'as of Nov 16, 2026',
    'Nov 14 CIRCLE K 1234 $45.00',
    'Nov 13 WALMART $82.10',
  ].join('\n');

  it('a screenshot with no date shows its rows before the day is answered; nothing is written until then', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile('s.jpg', NO_DATE)], ctx(store));
    expect(doc.plan.kind).toBe('none');
    expect(doc.extraction.preview_items.map((r) => [r.openDate, r.amount])).toEqual([
      ['Nov 14', -45],
      ['Nov 13', 1912.4],
    ]);
    const d2 = await answer(doc, `${doc.id}:as_of`, AS_OF, ctx(store));
    expect(d2.plan.kind).toBe('snapshot');
    expect(d2.plan.rows.map((r) => [r.date, r.amount])).toEqual([
      ['2026-11-14', -45],
      ['2026-11-13', 1912.4],
    ]);
  });
  it('unsigned rows wait for the answer; "money out" writes them as purchases', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile('s.jpg', UNSIGNED)], ctx(store));
    const q = doc.questions.find((qq) => qq.field === 'signs');
    expect(q).toBeTruthy();
    expect(doc.plan.kind).toBe('none');
    const d2 = await answer(doc, q.id, 'out', ctx(store));
    expect(d2.plan.rows.map((r) => r.amount)).toEqual([-45, -82.1]);
  });
  it('"hold" holds: nothing is written on Approve (PROVEN TO CATCH)', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile('s.jpg', UNSIGNED)], ctx(store));
    const d2 = await answer(doc, `${doc.id}:signs`, 'hold', ctx(store));
    expect(d2.plan).toMatchObject({ kind: 'none', held: true });
    const ledger = [];
    const out = await commitDoc(d2, {
      store,
      sinks: {
        commitImportedRows: async (rows) => {
          ledger.push(...rows);
          return { saved: rows.length };
        },
      },
      known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] },
    });
    expect(ledger).toEqual([]);
    expect(out.status).not.toBe('added');
  });
});

describe('the review card lists the rows themselves', () => {
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
  it('shows each row with its day ("day needed" until answered) and signed amount, before anything is added', { timeout: 30000 }, async () => {
    const DATA = {
      accounts: [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
      entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
      transactions: [],
    };
    const body = [
      'Chase',
      'TOTAL CHECKING (...7206)',
      'Available balance',
      '$4,687.18',
      'Transactions',
      'Nov 14 CIRCLE K 1234 -$45.00',
      'Nov 13 UIUC PAYROLL DIRECT DEP $1,912.40',
    ].join('\n');
    const written = [];
    host = document.createElement('div');
    host.style.width = '360px';
    document.body.appendChild(host);
    root = createRoot(host);
    act(() =>
      root.render(
        createElement(BooksUpload, {
          hint: 'overview',
          data: DATA,
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
    const file = {
      name: 'Screenshot_chase.txt',
      type: 'text/plain',
      size: body.length,
      text: async () => body,
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    };
    await act(async () => {
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const list = await until(() => document.querySelector('[data-testid="intake-snapshot-rows"]'));
    const rows = list.querySelectorAll('[data-testid="intake-snapshot-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toBe('Nov 14 · day neededCIRCLE K 1234−$45.00');
    expect(rows[1].textContent).toBe('Nov 13 · day neededUIUC PAYROLL DIRECT DEP+$1,912.40');
    expect(list.textContent).toMatch(/2 rows read from the screen \(not added yet\)/);
    expect(written).toEqual([]);
  });
});
