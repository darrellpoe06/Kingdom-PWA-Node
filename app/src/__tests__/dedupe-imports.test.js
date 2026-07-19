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

  it('removes at most (number of real) generic twins — extra generics survive', () => {
    const txns = [
      { id: 'r1', accountId: 'a1', date: '2026-07-16', amount: -12, description: 'SKATELAND SAVOY' },
      { id: 'g1', accountId: 'a1', date: '2026-07-16', amount: -12, description: 'DEBIT' },
      { id: 'g2', accountId: 'a1', date: '2026-07-16', amount: -12, description: 'DEBIT' }, // one genuine extra
    ];
    const r = findImportDuplicates(txns);
    expect(r.count).toBe(1);                 // only one real -> only one twin removed
    expect(r.removeIds).toEqual(['g1']);     // stable by id; g2 (the extra) survives
  });

  it('respects account, date, and SIGN — a deposit twin does not cancel a withdrawal', () => {
    const txns = [
      { id: 'out', accountId: 'a1', date: '2026-07-16', amount: -100, description: 'REMOTE DEPOSIT' }, // real-ish
      { id: 'in', accountId: 'a1', date: '2026-07-16', amount: 100, description: 'DEBIT' },            // opposite sign
      { id: 'other-acct', accountId: 'a2', date: '2026-07-16', amount: -100, description: 'DEBIT' },   // different account
    ];
    expect(findImportDuplicates(txns).count).toBe(0); // no same account+date+SIGNED-amount real+generic pair
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
