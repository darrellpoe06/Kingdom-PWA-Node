// @vitest-environment node
//
// bulk-statement-import — robust many-files-at-once import (Darrell: "easy + hard
// to get wrong", for onboarding too). Proven-to-catch: files auto-route to the
// right account by filename tail; duplicates are rejected by FITID AND by content
// key (so re-uploads / overlapping files / a partial earlier import can NEVER
// double-count); unmatched files are reported, not misfiled. This is the "a human
// can't get it wrong" guarantee.
import { describe, it, expect } from 'vitest';
import { detectAccount, planBulkImport, planAccountImport, accountTxnIds } from '../lib/bulk-statement-import.js';
import { parseDelimitedToRows } from '../lib/statement-import.js';

const ACCOUNTS = [
  { id: 'a-7206', name: 'Main Checking', fragment: '...7206' },
  { id: 'a-3322', name: 'Savings', fragment: '...3322' },
];
const file = (name, rows) => ({ name, rows });
const r = (date, amount, description, fitid) => ({ date, amount, description, ...(fitid ? { fitid } : {}) });

describe('detectAccount', () => {
  it('routes by the filename 4-digit tail', () => {
    expect(detectAccount('ledger-chase7206-2026-05.csv', ACCOUNTS)).toBe('a-7206');
    expect(detectAccount('chase3322_activity.csv', ACCOUNTS)).toBe('a-3322');
    expect(detectAccount('mystery.csv', ACCOUNTS)).toBe(null);
  });
});

describe('accountTxnIds — reset ONE account only', () => {
  const LEDGER = [
    { id: 't1', accountId: 'a-7206', amount: -5 },
    { id: 't2', accountId: 'a-7206', amount: 9 },
    { id: 't3', accountId: 'a-3322', amount: 100 }, // a DIFFERENT account
    { id: 't4', accountId: 'a-7206', amount: -2 },
    { accountId: 'a-7206', amount: -1 }, // no id — skipped
  ];
  it('returns only the chosen account ids — never touches another account', () => {
    expect(accountTxnIds(LEDGER, 'a-7206')).toEqual(['t1', 't2', 't4']);
    expect(accountTxnIds(LEDGER, 'a-3322')).toEqual(['t3']);
  });
  it('empty for no account / empty ledger (nothing cleared by accident)', () => {
    expect(accountTxnIds(LEDGER, '')).toEqual([]);
    expect(accountTxnIds(LEDGER, null)).toEqual([]);
    expect(accountTxnIds([], 'a-7206')).toEqual([]);
  });
});

describe('planBulkImport — auto-route', () => {
  it('routes each file to its account and totals across files in one plan', () => {
    const plan = planBulkImport([
      file('ledger-chase7206-may.csv', [r('2026-05-01', 500, 'deposit'), r('2026-05-02', -20, 'coffee')]),
      file('ledger-chase3322-may.csv', [r('2026-05-01', -62.5, 'transfer')]),
    ], ACCOUNTS, []);
    expect(plan.totalNew).toBe(3);
    expect(plan.routed).toHaveLength(2);
    const main = plan.routed.find((x) => x.accountId === 'a-7206');
    expect(main.count).toBe(2);
    expect(main.txns[0].accountId).toBe('a-7206');
  });
  it('reports an unmatched file instead of misfiling it', () => {
    const plan = planBulkImport([file('mystery.csv', [r('2026-05-01', 5, 'x')])], ACCOUNTS, []);
    expect(plan.routed).toHaveLength(0);
    expect(plan.unrouted[0]).toMatchObject({ name: 'mystery.csv', count: 1 });
  });
  it('sends an unmatched file to the fallback account when the user picked one', () => {
    const plan = planBulkImport([file('mystery.csv', [r('2026-05-01', 5, 'x')])], ACCOUNTS, [], 'a-7206');
    expect(plan.totalNew).toBe(1);
    expect(plan.routed[0].accountId).toBe('a-7206');
  });
});

describe('planBulkImport — dedupe (no double-count)', () => {
  it('skips rows whose FITID is already in the ledger', () => {
    const existing = [{ accountId: 'a-7206', date: '2026-05-01', amount: 500, description: 'deposit', fitid: 'F1' }];
    const plan = planBulkImport([file('ledger-chase7206.csv', [r('2026-05-01', 500, 'deposit', 'F1'), r('2026-05-03', 9, 'new', 'F2')])], ACCOUNTS, existing);
    expect(plan.totalNew).toBe(1);
    expect(plan.duplicates).toBe(1);
  });
  it('dedupes by CONTENT when there is no FITID (re-upload of a plain CSV)', () => {
    const existing = [{ accountId: 'a-7206', date: '2026-05-01', amount: 500, description: 'deposit' }];
    const plan = planBulkImport([file('ledger-chase7206.csv', [r('2026-05-01', 500, 'deposit')])], ACCOUNTS, existing);
    expect(plan.totalNew).toBe(0);
    expect(plan.duplicates).toBe(1);
  });
  it('dedupes duplicates WITHIN the batch (same row in two overlapping files)', () => {
    const plan = planBulkImport([
      file('ledger-chase7206-a.csv', [r('2026-05-01', 500, 'deposit', 'F1')]),
      file('ledger-chase7206-b.csv', [r('2026-05-01', 500, 'deposit', 'F1')]),
    ], ACCOUNTS, []);
    expect(plan.totalNew).toBe(1);
    expect(plan.duplicates).toBe(1);
  });
  it('END-TO-END: parse real CSV text per file -> auto-route + dedupe in one plan', () => {
    const csv7206 = 'Date,Description,Amount\n2026-05-01,Online Transfer,500\n2026-05-02,County Market,-93.13\n';
    const csv3322 = 'Date,Description,Amount\n2026-05-01,Interest,1.20\n';
    const f1 = { name: 'ledger-chase7206-2026-05.csv', rows: parseDelimitedToRows(csv7206).rows };
    const f2 = { name: 'ledger-chase3322-2026-05.csv', rows: parseDelimitedToRows(csv3322).rows };
    const plan = planBulkImport([f1, f2], ACCOUNTS, []);
    expect(plan.totalNew).toBe(3);
    expect(plan.routed.find((b) => b.accountId === 'a-7206').count).toBe(2);
    expect(plan.routed.find((b) => b.accountId === 'a-3322').count).toBe(1);
  });
  // Proven-to-catch (Christina's books, 2026-07-18): EVERY planned row must carry a
  // UNIQUE, defined id. Before the fix, rows WITHOUT a fitid got no id, so a
  // synchronous import loop fell back to addTransaction's `t-${Date.now()}` and many
  // rows collided on the same millisecond id -> they collapsed on cloud upsert and in
  // the merge, so imports "did not appear" and only a few dates survived. This many-row
  // no-fitid import would have produced undefined/duplicate ids without the fix.
  it('gives every planned row a UNIQUE, defined id — even with NO fitid (no import collapse)', () => {
    const rows = [];
    for (let i = 1; i <= 60; i++) {
      const dd = String((i % 28) + 1).padStart(2, '0');
      rows.push(r(`2026-06-${dd}`, -(i + 0.11), `payee number ${i}`)); // NO fitid arg
    }
    const plan = planBulkImport([file('ledger-chase7206-june.csv', rows)], ACCOUNTS, []);
    const ids = plan.routed.flatMap((b) => b.txns).map((t) => t.id);
    expect(ids).toHaveLength(60);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true); // no undefined ids
    expect(new Set(ids).size).toBe(60);                                            // all unique — no collapse
  });
  // Proven-to-catch (Christina's books, 2026-07-18): two GENUINE same-day,
  // same-amount purchases must BOTH survive — the old content key (date|amount|
  // desc) collapsed them into one, silently deleting a real transaction. The
  // bank's running BALANCE differs between them (each moves the account), so with
  // balance in the key they are correctly kept apart. On her real 1520-row file
  // this recovered 17 wrongly-dropped transactions.
  it('keeps TWO genuine same-amount repeats apart by their running balance (no false dedupe)', () => {
    const rows = [
      { date: '2026-07-17', amount: 200, description: 'online deposit', balance: 1000 },
      { date: '2026-07-17', amount: 200, description: 'online deposit', balance: 1200 }, // real 2nd deposit
    ];
    const plan = planBulkImport([file('ledger-chase7206-jul.csv', rows)], ACCOUNTS, []);
    expect(plan.totalNew).toBe(2);      // both kept — NOT collapsed to 1
    expect(plan.duplicates).toBe(0);
    const ids = plan.routed[0].txns.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);  // distinct ids (balance is in the key)
    expect(plan.routed[0].txns.every((t) => t.balance != null)).toBe(true); // balance persisted
  });
  // Proven-to-catch (Christina's 7/17 twins, 2026-07-18): two GENUINE identical
  // PENDING deposits — same date+amount+desc, NO balance posted yet, NO FITID —
  // are indistinguishable by content, yet the bank listed TWO line items. The
  // occurrence index keeps both; without it, one real deposit was dropped.
  it('keeps two truly-identical PENDING twins (no balance, no fitid) — occurrence index', () => {
    const rows = [
      { date: '2026-07-17', amount: 200, description: 'ONLINE DEPOSIT' }, // no balance, no fitid
      { date: '2026-07-17', amount: 200, description: 'ONLINE DEPOSIT' }, // its real twin
    ];
    const plan = planBulkImport([file('ledger-chase7206-jul.csv', rows)], ACCOUNTS, []);
    expect(plan.totalNew).toBe(2);     // both kept — the bank showed two line items
    expect(plan.duplicates).toBe(0);
    expect(new Set(plan.routed[0].txns.map((t) => t.id)).size).toBe(2); // distinct ids
  });
  it('re-importing the pending-twins file is still a no-op (occurrence index is idempotent)', () => {
    const rows = [
      { date: '2026-07-17', amount: 200, description: 'ONLINE DEPOSIT' },
      { date: '2026-07-17', amount: 200, description: 'ONLINE DEPOSIT' },
    ];
    const first = planBulkImport([file('ledger-chase7206-jul.csv', rows)], ACCOUNTS, []);
    const committed = first.routed.flatMap((b) => b.txns);
    const second = planBulkImport([file('ledger-chase7206-jul.csv', rows)], ACCOUNTS, committed);
    expect(second.totalNew).toBe(0);
    expect(second.duplicates).toBe(2);
  });
  it('the SAME pending row in two OVERLAPPING files dedupes to one (not two)', () => {
    const row = { date: '2026-07-17', amount: 200, description: 'ONLINE DEPOSIT' };
    const plan = planBulkImport([
      file('ledger-chase7206-a.csv', [row]),
      file('ledger-chase7206-b.csv', [row]), // overlap: same single txn in both files
    ], ACCOUNTS, []);
    expect(plan.totalNew).toBe(1);     // one real transaction, not doubled
    expect(plan.duplicates).toBe(1);
  });
  it('a genuine THIRD identical deposit in a later import is kept (occurrence #2 is new)', () => {
    const two = [
      { date: '2026-07-17', amount: 200, description: 'ONLINE DEPOSIT' },
      { date: '2026-07-17', amount: 200, description: 'ONLINE DEPOSIT' },
    ];
    const committed = planBulkImport([file('ledger-chase7206-a.csv', two)], ACCOUNTS, []).routed.flatMap((b) => b.txns);
    const three = [...two, { date: '2026-07-17', amount: 200, description: 'ONLINE DEPOSIT' }];
    const plan = planBulkImport([file('ledger-chase7206-b.csv', three)], ACCOUNTS, committed);
    expect(plan.totalNew).toBe(1);     // only the NEW third deposit
    expect(plan.duplicates).toBe(2);
  });
  it('a TRUE re-import (identical rows AND balances) still dedupes — idempotent with balance', () => {
    const rows = [
      { date: '2026-07-17', amount: 200, description: 'online deposit', balance: 1000 },
      { date: '2026-07-17', amount: 200, description: 'online deposit', balance: 1200 },
    ];
    const first = planBulkImport([file('ledger-chase7206-jul.csv', rows)], ACCOUNTS, []);
    const committed = first.routed.flatMap((b) => b.txns); // now in the ledger, WITH balance
    const second = planBulkImport([file('ledger-chase7206-jul.csv', rows)], ACCOUNTS, committed);
    expect(first.totalNew).toBe(2);
    expect(second.totalNew).toBe(0);    // same file again = no-op
    expect(second.duplicates).toBe(2);
  });
  it('the SAME bulk import run twice is a no-op the second time (idempotent onboarding)', () => {
    const files = [file('ledger-chase7206.csv', [r('2026-05-01', 500, 'deposit', 'F1'), r('2026-05-02', -20, 'coffee', 'F2')])];
    const first = planBulkImport(files, ACCOUNTS, []);
    const committed = first.routed.flatMap((b) => b.txns); // pretend these are now in the ledger
    const second = planBulkImport(files, ACCOUNTS, committed);
    expect(first.totalNew).toBe(2);
    expect(second.totalNew).toBe(0);
    expect(second.duplicates).toBe(2);
  });
});

describe('planAccountImport — single-file import is idempotent (the leak fix)', () => {
  // The single-file path used to map rows with NO id, so every import minted a fresh
  // `t-${Date.now()}` random id -> re-importing the same statement (or the Reset &
  // re-import repair) stacked BRAND-NEW rows the unique (tenant,slug) index could not
  // catch. Routing single-file imports through the stable-id + content-dedupe engine
  // makes a re-import a no-op (Darrell 2026-07-19: many DEBIT copies "I don't re-upload").
  const rows = [
    { date: '2026-06-01', amount: -50, description: 'COUNTY MARKET', balance: 1000 },
    { date: '2026-06-02', amount: 200, description: 'DEPOSIT', balance: 1200 },
  ];
  it('assigns stable content-addressed ids (not random t-<timestamp>)', () => {
    const { txns } = planAccountImport(rows, 'a-7206', []);
    expect(txns).toHaveLength(2);
    expect(txns.every((t) => /^imp-/.test(t.id))).toBe(true); // deterministic, not t-<Date.now()>
    expect(txns[0].accountId).toBe('a-7206');
  });
  it('PROVEN-TO-CATCH: re-importing the same file is a NO-OP against the existing ledger', () => {
    const first = planAccountImport(rows, 'a-7206', []);
    const second = planAccountImport(rows, 'a-7206', first.txns); // pretend first is now in the ledger
    expect(first.txns).toHaveLength(2);
    expect(second.txns).toHaveLength(0);   // nothing new — no duplicate stacking
    expect(second.duplicates).toBe(2);
    // Idempotent even against LEGACY random-id rows (dedup keys on content, not id):
    const legacy = rows.map((rr, i) => ({ ...rr, accountId: 'a-7206', id: `t-legacy-${i}` }));
    expect(planAccountImport(rows, 'a-7206', legacy).txns).toHaveLength(0);
  });
});
