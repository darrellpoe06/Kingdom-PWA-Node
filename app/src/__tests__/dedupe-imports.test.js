// @vitest-environment node
//
// dedupe-imports — the system removes the "DEBIT" duplicate twins itself so a human
// never resets account-by-account (Darrell 2026-07-19). Must be provably safe: it
// only drops a generic-type twin of a real row, never a genuine repeat purchase.
import { describe, it, expect } from 'vitest';
import { findImportDuplicates, isGenericDescription } from '../lib/dedupe-imports.js';

describe('isGenericDescription', () => {
  it('flags bank type-words, not real merchants', () => {
    expect(isGenericDescription('DEBIT')).toBe(true);
    expect(isGenericDescription('credit')).toBe(true);
    expect(isGenericDescription('CHECK')).toBe(true);
    expect(isGenericDescription('ACH_DEBIT')).toBe(true);
    expect(isGenericDescription("MCDONALD'S F15879 CHAMPAIGN IL")).toBe(false);
    expect(isGenericDescription('UNIVERSITY OF IL PAYROLL')).toBe(false);
  });
});

describe('findImportDuplicates', () => {
  it('removes the generic "DEBIT" twin of a real row (same account+date+amount)', () => {
    const txns = [
      { id: 'real', accountId: 'a1', date: '2026-07-16', amount: -30.60, description: "MCDONALD'S F15879 CHAMPAIGN IL" },
      { id: 'junk', accountId: 'a1', date: '2026-07-16', amount: -30.60, description: 'DEBIT' },
    ];
    const r = findImportDuplicates(txns);
    expect(r.removeIds).toEqual(['junk']);   // the DEBIT twin
    expect(r.count).toBe(1);
    expect(r.byAccount.a1).toBe(1);
  });

  it('NEVER removes two GENUINE same-day/same-amount real purchases', () => {
    const txns = [
      { id: 'p1', accountId: 'a1', date: '2026-07-16', amount: -50, description: 'COUNTY MARKET' },
      { id: 'p2', accountId: 'a1', date: '2026-07-16', amount: -50, description: 'COUNTY MARKET' },
    ];
    expect(findImportDuplicates(txns).count).toBe(0); // both real -> nothing removed
  });

  it('NEVER removes two genuine generic rows with no real twin', () => {
    const txns = [
      { id: 'd1', accountId: 'a1', date: '2026-07-16', amount: -20, description: 'DEBIT' },
      { id: 'd2', accountId: 'a1', date: '2026-07-16', amount: -20, description: 'DEBIT' },
    ];
    expect(findImportDuplicates(txns).count).toBe(0); // no real original -> keep both
  });

  it('ONE PASS removes ALL generic twins in an anchored group (the re-import case)', () => {
    // Darrell re-imported the same statement several times, so a real row can have
    // MANY generic "DEBIT" copies. The old capped slice removed only real-count per
    // tap, forcing round after round ("not fixed" from the user's chair though the
    // count was dropping). One anchored real row now sweeps every generic twin.
    const txns = [
      { id: 'r1', accountId: 'a1', date: '2026-07-16', amount: -12, description: 'SKATELAND SAVOY' },
      { id: 'g1', accountId: 'a1', date: '2026-07-16', amount: -12, description: 'DEBIT' },
      { id: 'g2', accountId: 'a1', date: '2026-07-16', amount: -12, description: 'DEBIT' },
      { id: 'g3', accountId: 'a1', date: '2026-07-16', amount: -12, description: 'DEBIT' },
    ];
    const r = findImportDuplicates(txns);
    expect(r.count).toBe(3);                        // all three generic copies, one pass
    expect(r.removeIds).toEqual(['g1', 'g2', 'g3']); // stable by id; the real row is kept
    // PROVEN-TO-CATCH: restore `.slice(0, real.length)` and this drops to 1.
  });

  it('respects account, date, and SIGN — a deposit twin does not cancel a withdrawal', () => {
    const txns = [
      { id: 'out', accountId: 'a1', date: '2026-07-16', amount: -100, description: 'REMOTE DEPOSIT' }, // real-ish
      { id: 'in', accountId: 'a1', date: '2026-07-16', amount: 100, description: 'DEBIT' },            // opposite sign
      { id: 'other-acct', accountId: 'a2', date: '2026-07-16', amount: -100, description: 'DEBIT' },   // different account
    ];
    expect(findImportDuplicates(txns).count).toBe(0); // no same account+date+SIGNED-amount real+generic pair
  });

  it('BALANCE-ANCHORED: catches two REAL twins with differing descriptions that share a running balance (Darrell 2026-07-19)', () => {
    // The CONNECTYOURCARE case Rule 1 misses (BOTH rows are real, not generic):
    // same account+date+$amount, one "OPTUMCLAIM" + one "OPTUMCLAIM PPD ID: …", one
    // categorized Other + one ACH Deposit — the SAME deposit imported twice, so both
    // carry the SAME post-balance. Keep the richer (longer) description; drop the twin.
    const txns = [
      { id: 'short', accountId: 'chk', date: '2026-06-04', amount: 600, description: 'CONNECTYOURCARE OPTUMCLAIM', category: 'other', balance: 5200.00 },
      { id: 'rich', accountId: 'chk', date: '2026-06-04', amount: 600, description: 'CONNECTYOURCARE OPTUMCLAIM PPD ID: 7261274092', category: 'ach_credit', balance: 5200.00 },
    ];
    const r = findImportDuplicates(txns);
    expect(r.count).toBe(1);
    expect(r.removeIds).toEqual(['short']);  // the less-informative twin; the PPD-ID row is kept
    // PROVEN-TO-CATCH: without Rule 2 (balance-anchored), both are "real" so the
    // group is skipped and the duplicate survives — count 0, totals stay doubled.
  });

  it('NEVER removes two GENUINE same-day/same-amount deposits with DIFFERENT balances', () => {
    // Two real $600 CONNECTYOURCARE reimbursements the SAME day ARE possible; the
    // running balance moved between them, so they are kept. Balance is the truth.
    const txns = [
      { id: 'a', accountId: 'chk', date: '2026-06-04', amount: 600, description: 'CONNECTYOURCARE OPTUMCLAIM', balance: 5200.00 },
      { id: 'b', accountId: 'chk', date: '2026-06-04', amount: 600, description: 'CONNECTYOURCARE OPTUMCLAIM', balance: 5800.00 },
    ];
    expect(findImportDuplicates(txns).count).toBe(0);
  });

  it('leaves same-amount twins UNTOUCHED when neither carries a balance (cannot anchor → never guess)', () => {
    const txns = [
      { id: 'x', accountId: 'chk', date: '2026-06-17', amount: 208.33, description: 'CONNECTYOURCARE OPTUMCLAIM' },
      { id: 'y', accountId: 'chk', date: '2026-06-17', amount: 208.33, description: 'CONNECTYOURCARE OPTUMCLAIM PPD ID: 7261274092' },
    ];
    expect(findImportDuplicates(txns).count).toBe(0); // no balance on either → safe, kept
  });

  it('catches a generic twin AND a balance twin in the same ledger, one pass', () => {
    const txns = [
      { id: 'r', accountId: 'chk', date: '2026-06-04', amount: 600, description: 'CONNECTYOURCARE OPTUMCLAIM PPD ID: 7261274092', balance: 5200 },
      { id: 'baldupe', accountId: 'chk', date: '2026-06-04', amount: 600, description: 'CONNECTYOURCARE OPTUMCLAIM', balance: 5200 }, // balance twin
      { id: 'genericdupe', accountId: 'chk', date: '2026-06-04', amount: 600, description: 'ACH_CREDIT', balance: 5200 },             // generic twin
    ];
    const r = findImportDuplicates(txns);
    expect(r.removeIds.sort()).toEqual(['baldupe', 'genericdupe']);
    expect(r.count).toBe(2); // both kinds cleared, the richest real row kept
  });

  it('skips rows with no id (nothing to delete) and handles empty input', () => {
    expect(findImportDuplicates([]).count).toBe(0);
    const txns = [
      { accountId: 'a1', date: '2026-07-16', amount: -5, description: 'STORE' },
      { accountId: 'a1', date: '2026-07-16', amount: -5, description: 'DEBIT' }, // no id -> can't remove
    ];
    expect(findImportDuplicates(txns).count).toBe(0);
  });
});
