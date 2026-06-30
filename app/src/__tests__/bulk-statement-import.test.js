// @vitest-environment node
//
// bulk-statement-import — robust many-files-at-once import (Darrell: "easy + hard
// to get wrong", for onboarding too). Proven-to-catch: files auto-route to the
// right account by filename tail; duplicates are rejected by FITID AND by content
// key (so re-uploads / overlapping files / a partial earlier import can NEVER
// double-count); unmatched files are reported, not misfiled. This is the "a human
// can't get it wrong" guarantee.
import { describe, it, expect } from 'vitest';
import { detectAccount, planBulkImport } from '../lib/bulk-statement-import.js';
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
