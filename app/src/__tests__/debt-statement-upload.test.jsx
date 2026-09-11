// @vitest-environment jsdom
// =============================================================================
// A statement can be uploaded where the CARD lives
// =============================================================================
// Darrell 2026-08-11, four times, ending in: "focus on the books and the import
// of the credit cards!!!!!!!!!!!!"
//
// The measured gap: BooksTransactions.jsx carried three file inputs and
// Debts.jsx carried ZERO. The import pipeline was real and proven, and it lived
// on the wrong tab — so a person came to Debts to deal with a credit card,
// found nothing to hand a statement to, and concluded the app could not read
// statements at all.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { planAccountImport } from '../lib/bulk-statement-import.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const debts = () => readFileSync(join(ROOT, 'app/src/components/Debts.jsx'), 'utf8');
const uploader = () => readFileSync(join(ROOT, 'app/src/components/DebtStatementUpload.jsx'), 'utf8');

describe('the Debts tab can finally take a file', () => {
  it('PROVEN-TO-CATCH: Debts mounts an uploader (it had none at all)', () => {
    expect(debts()).toMatch(/<DebtStatementUpload/);
    expect(debts()).toMatch(/import DebtStatementUpload/);
  });

  it('the uploader has a real file input, accepting what banks actually export', () => {
    const src = uploader();
    expect(src).toMatch(/type="file"/);
    for (const ext of ['.csv', '.ofx', '.qfx', '.xlsx']) expect(src).toContain(ext);
  });

  it('it REUSES the proven import path rather than inventing a second one', () => {
    const src = uploader();
    expect(src).toMatch(/statementFileToCsv/);   // same reader as Transactions
    expect(src).toMatch(/planAccountImport/);    // same dedupe
  });
});

// ---------------------------------------------------------------------------
// 2026-09-11 -- the silent one. Found while building the church's Cash App
// giving import on top of this same pipeline.
//
// planAccountImport returns `{ txns, duplicates: Number }`. This panel read
// `plan.toAdd` and `plan.duplicates.length`. Those names only lined up on the
// branch where NO account resolved -- so in the normal case, with a debt that
// has an account (the only case that dedupes at all), pressing Import handed
// the parent an empty array and wrote NOTHING, while the panel displayed "0
// new" and a duplicate count of `undefined`. It looked exactly like a
// statement with no rows in it, which is why it survived: there is no error to
// see, and the only tests here read source text, which agreed with itself.
//
// The lesson is the gate: two modules that pass a shape between them need a
// test that reads BOTH real values, never a source scan of either one alone.
// (The same shape of miss as P49's two-timeouts-that-must-agree.)
describe('the plan shape the panel reads is the plan shape the planner returns', () => {
  const ROWS = [
    { date: '2026-08-01', description: 'PAYMENT THANK YOU', amount: 250 },
    { date: '2026-08-02', description: 'GROCERY STORE', amount: -84.31 },
  ];

  it('PROVEN-TO-CATCH: the planner returns txns/duplicates, NOT toAdd', () => {
    const plan = planAccountImport(ROWS, 'acct-1', []);
    // The real values, measured -- this is the half a source scan cannot see.
    expect(Array.isArray(plan.txns)).toBe(true);
    expect(plan.txns).toHaveLength(2);
    expect(typeof plan.duplicates).toBe('number');
    // And the exact two mis-reads that caused the bug:
    expect(plan.toAdd, 'reading plan.toAdd yields undefined -> an empty import').toBeUndefined();
    expect(plan.duplicates.length, 'a Number has no .length -> the count rendered undefined').toBeUndefined();
  });

  it('the panel normalizes the planner result instead of mis-reading it', () => {
    const src = uploader();
    expect(src, 'the planner result must be read through .txns').toMatch(/\.txns\b/);
    expect(src, 'never treat the duplicate count as an array').not.toMatch(/duplicates\s*\|\|\s*\[\]/);
    expect(src, 'the normalized count is what the panel displays').toMatch(/duplicateCount/);
  });

  it('with no account resolved, every parsed row is still offered', () => {
    // The branch that accidentally worked. It must keep working.
    const plan = planAccountImport(ROWS, null, []);
    expect(plan.txns).toEqual([]);
    expect(uploader()).toMatch(/toAdd: parsed\.rows \|\| \[\]/);
  });
});

describe('what a DEBT needs that a register does not', () => {
  it('reads the statement header — the due date above all', () => {
    const src = uploader();
    expect(src).toMatch(/parseStatementSummary/);
    expect(src).toMatch(/Payment due/);
    // And says so plainly when the file has no due date, rather than implying
    // on-time/late is simply zero.
    expect(src).toMatch(/on-time \/ late cannot be counted/);
  });

  it('provisions an account for an unseen card, and reuses an existing one', () => {
    const src = uploader();
    expect(src).toMatch(/provisionFromStatement/);
    expect(src).toMatch(/has not been seen before/);
  });

  it('remembers the bank layout, and says when the layout CHANGED', () => {
    const src = uploader();
    expect(src).toMatch(/rememberFormat/);
    expect(src).toMatch(/recallFormat/);
    expect(src).toMatch(/layout changed since last time/);
  });

  it('NOTHING is written until the person presses Import', () => {
    const src = uploader();
    expect(src).toMatch(/Nothing is saved until you press Import/);
    // rememberFormat + onImport both live inside commit(), never in onFiles().
    const onFiles = src.slice(src.indexOf('const onFiles'), src.indexOf('const commit'));
    expect(onFiles).not.toMatch(/rememberFormat|onImport\(/);
  });
});
