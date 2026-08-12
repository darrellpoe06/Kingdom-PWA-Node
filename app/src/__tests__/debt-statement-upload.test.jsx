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
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
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
