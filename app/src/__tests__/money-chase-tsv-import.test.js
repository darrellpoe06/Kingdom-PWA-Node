// A Chase download saved as tab-separated values (.tsv) reads exactly like the
// same rows as CSV (Christina 2026-11-18: "Can I upload my Chase 7206 TSV file
// directly?"). Before this, every line was one comma-less cell, so every row
// was rejected as "unreadable date" (reported, never silently dropped).
import { describe, it, expect, vi } from 'vitest';
import { parseDelimitedToRows, detectDelimiter, parseCsvLine } from '../lib/statement-import.js';
import { memoryStore } from '../lib/books-intake-store.js';
import { intakeFiles } from '../lib/books-intake-pipeline.js';

vi.mock('../lib/books-intake-cloud.js', () => ({ keepOriginalInCloud: async () => ({ ok: false, reason: 'test' }) }));

// Chase checking download columns, her rows.
const HEADER = ['Details', 'Posting Date', 'Description', 'Amount', 'Type', 'Balance', 'Check or Slip #'];
const ROWS = [
  ['DEBIT', '11/16/2026', 'Zelle payment to TLC', '-75.00', 'QUICKPAY_DEBIT', '3941.72', ''],
  ['CREDIT', '11/16/2026', 'ATM CASH DEPOSIT', '1000.00', 'ATM', '4497.99', ''],
  ['DEBIT', '11/15/2026', 'Zelle payment to TLC', '-837.00', 'QUICKPAY_DEBIT', '6890.57', ''],
  ['CREDIT', '11/15/2026', 'Transfer from GMR ...3800', '55.00', 'ACH_CREDIT', '8529.13', ''],
  ['CREDIT', '11/15/2026', 'Cash App from Darrell', '1450.00', 'ACH_CREDIT', '8474.13', ''],
  ['CREDIT', '11/15/2026', 'Transfer from Chase 3322', '2201.00', 'ACCT_XFER', '7024.13', ''],
];
const tsv = [HEADER, ...ROWS].map((r) => r.join('\t')).join('\n');
const csv = [HEADER, ...ROWS].map((r) => r.join(',')).join('\n');
const read = (rows) => rows.map((r) => [r.date, r.description, r.amount, r.balance]);

describe('a Chase TSV reads like the same rows as CSV', () => {
  it('every row is read, with its signed amount and Chase balance; nothing rejected', () => {
    const t = parseDelimitedToRows(tsv);
    expect(t.errors).toEqual([]);
    expect(t.rejected || []).toEqual([]);
    expect(read(t.rows)).toEqual([
      ['2026-11-16', 'Zelle payment to TLC', -75, 3941.72],
      ['2026-11-16', 'ATM CASH DEPOSIT', 1000, 4497.99],
      ['2026-11-15', 'Zelle payment to TLC', -837, 6890.57],
      ['2026-11-15', 'Transfer from GMR ...3800', 55, 8529.13],
      ['2026-11-15', 'Cash App from Darrell', 1450, 8474.13],
      ['2026-11-15', 'Transfer from Chase 3322', 2201, 7024.13],
    ]);
  });
  it('the same rows as CSV read identically (CSV unchanged)', () => {
    expect(read(parseDelimitedToRows(csv).rows)).toEqual(read(parseDelimitedToRows(tsv).rows));
  });
  it('the separator is detected per file; a quoted comma stays inside its cell', () => {
    expect(detectDelimiter(tsv.split('\n'))).toBe('\t');
    expect(detectDelimiter(csv.split('\n'))).toBe(',');
    expect(parseCsvLine('a\t"b, c"\td', '\t')).toEqual(['a', 'b, c', 'd']);
    const quoted = parseDelimitedToRows(['Posting Date,Description,Amount', '11/15/2026,"Store, Inc",-5.00'].join('\n'));
    expect(read(quoted.rows)).toEqual([['2026-11-15', 'Store, Inc', -5, undefined]]);
  });
});

describe('uploaded through the Books upload, a .tsv becomes a transactions download for Chase 7206', () => {
  it('reads all six rows and matches the account', async () => {
    const store = memoryStore();
    const known = {
      accounts: [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
      entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
      transactions: [],
    };
    const file = {
      name: 'Chase7206_Activity_20261117.tsv',
      type: 'text/tab-separated-values',
      size: tsv.length,
      text: async () => tsv,
      arrayBuffer: async () => new TextEncoder().encode(tsv).buffer,
    };
    const [doc] = await intakeFiles([file], { store, hint: 'overview', known });
    expect(doc.extraction.doc_type).toBe('transactions-export');
    expect(doc.extraction.line_items.map((r) => r.amount)).toEqual([-75, 1000, -837, 55, 1450, 2201]);
  });
});

describe('a TSV after a screenshot of the same days never adds a row twice', () => {
  it('rows already in the books from a screenshot (no balance) are recognised in the TSV (with balance)', async () => {
    const { planAccountImport } = await import('../lib/bulk-statement-import.js');
    const fromScreenshot = ROWS.map((r, i) => ({
      id: `shot-${i}`,
      accountId: 'a-7206',
      date: r[1].replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2'),
      description: r[2],
      amount: Number(r[3]),
      source: 'screenshot',
    }));
    const tsvRows = parseDelimitedToRows(tsv).rows;
    const plan = planAccountImport(tsvRows, 'a-7206', fromScreenshot);
    expect(plan.txns).toEqual([]);
    expect(plan.duplicates).toBe(6);
  });
  it('and the other way: a screenshot after the TSV adds nothing', async () => {
    const { planAccountImport } = await import('../lib/bulk-statement-import.js');
    const inBooks = parseDelimitedToRows(tsv).rows.map((r, i) => ({ ...r, id: `tsv-${i}`, accountId: 'a-7206' }));
    const shot = inBooks.map(({ date, description, amount }) => ({ date, description, amount }));
    expect(planAccountImport(shot, 'a-7206', inBooks).txns).toEqual([]);
  });
  it('two real same-day charges in the TSV, one already in the books: exactly one is added', async () => {
    const { planAccountImport } = await import('../lib/bulk-statement-import.js');
    const existing = [{ id: 'c1', accountId: 'a-7206', date: '2026-11-15', description: 'Coffee', amount: -5 }];
    const plan = planAccountImport(
      [
        { date: '2026-11-15', description: 'Coffee', amount: -5, balance: 100 },
        { date: '2026-11-15', description: 'Coffee', amount: -5, balance: 95 },
      ],
      'a-7206',
      existing
    );
    expect(plan.txns.length).toBe(1);
  });
  it('a different amount, day, account or description is never treated as the same', async () => {
    const { planAccountImport } = await import('../lib/bulk-statement-import.js');
    const existing = [{ id: 'z', accountId: 'a-7206', date: '2026-11-15', description: 'Zelle payment to TLC', amount: -837 }];
    const tries = [
      { date: '2026-11-15', description: 'Zelle payment to TLC', amount: -75, balance: 1 },
      { date: '2026-11-16', description: 'Zelle payment to TLC', amount: -837, balance: 1 },
      { date: '2026-11-15', description: 'Zelle payment to someone else', amount: -837, balance: 1 },
    ];
    for (const t of tries) expect(planAccountImport([t], 'a-7206', existing).txns.length).toBe(1);
    expect(planAccountImport([{ date: '2026-11-15', description: 'Zelle payment to TLC', amount: -837, balance: 1 }], 'a-3322', existing).txns.length).toBe(1);
  });
});
