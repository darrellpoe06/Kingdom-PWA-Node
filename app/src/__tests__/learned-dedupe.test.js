// @vitest-environment node
//
// learned-dedupe — the combine feature learns (Darrell 2026-07-20). Pins: the
// exact-duplicate signature, learning the payee from a combine, suggesting only
// EXACT repeats from a TAUGHT payee (a legit same-day repeat from an untaught
// payee is never called a duplicate), and the most-informative keep choice.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dedupeSignature, learnFromCombine, suggestLearnedDuplicates,
  findExactDuplicates,
  loadLearnedDedupe, saveLearnedDedupe,
} from '../lib/learned-dedupe.js';

describe('findExactDuplicates — the whole-ledger bulk sweep', () => {
  it('groups every exact (payee+date+amount+account) repeat, keeps the fullest, removes the rest', () => {
    // Real duplicate imports carry IDENTICAL descriptions — one row minted twice
    // (as in the screenshots: same payee, date, amount, and full text). Category
    // edits on one copy don't protect it — same signature is still a duplicate.
    const txns = [
      { id: 'fm1', description: 'Online Payment 29483446956 To FIRST MID-ILLINOIS BANK & TRUST 06/17', date: '2026-06-17', amount: -250, accountId: 'a1', category: 'other' },
      { id: 'fm2', description: 'Online Payment 29483446956 To FIRST MID-ILLINOIS BANK & TRUST 06/17', date: '2026-06-17', amount: -250, accountId: 'a1', category: 'bill-pay' },
      { id: 'wm1', description: 'WM SUPERCENTER #3255 SAVOY IL 06/08', date: '2026-06-08', amount: -241.19, accountId: 'a1' },
      { id: 'wm2', description: 'WM SUPERCENTER #3255 SAVOY IL 06/08', date: '2026-06-08', amount: -241.19, accountId: 'a1' },
      // a lone, non-duplicated charge — must never appear
      { id: 'solo', description: 'CASH APP MARIO', date: '2026-06-30', amount: -100, accountId: 'a1' },
    ];
    const { groups, totalCopies, groupCount } = findExactDuplicates(txns);
    expect(groupCount).toBe(2);
    expect(totalCopies).toBe(2); // one removable copy per group
    const fm = groups.find((g) => g.label.includes('FIRST MID'));
    expect(fm.keepId).toBe('fm1');            // identical length -> stable keep-first
    expect(fm.removeIds).toEqual(['fm2']);    // the extra copy removed
    const wm = groups.find((g) => g.label.includes('WM SUPERCENTER'));
    expect(wm.keepId).toBe('wm1');
    expect(wm.removeIds).toEqual(['wm2']);
    // the solo charge is not a duplicate -> not returned anywhere
    expect(groups.some((g) => g.removeIds.includes('solo') || g.keepId === 'solo')).toBe(false);
  });

  it('two paychecks a month (different DATES) are never swept as duplicates', () => {
    const txns = [
      { id: 'p1', description: 'UNIVERSITY OF IL PAYROLL', date: '2026-07-01', amount: 2271.97, accountId: 'a1' },
      { id: 'p2', description: 'UNIVERSITY OF IL PAYROLL', date: '2026-07-15', amount: 2274.78, accountId: 'a1' },
    ];
    expect(findExactDuplicates(txns).groupCount).toBe(0);
  });
});

describe('dedupeSignature', () => {
  it('is equal for the same charge posted twice, different for a different charge', () => {
    const a = { description: 'ACME CORP 4821', date: '2026-07-01', amount: -50, accountId: 'a1' };
    const b = { description: 'ACME CORP 9930', date: '2026-07-01', amount: -50, accountId: 'a1' }; // same payee/date/amt
    const c = { description: 'ACME CORP 4821', date: '2026-07-02', amount: -50, accountId: 'a1' }; // diff date
    expect(dedupeSignature(a)).toBe(dedupeSignature(b));
    expect(dedupeSignature(a)).not.toBe(dedupeSignature(c));
  });
});

describe('learnFromCombine + suggestLearnedDuplicates', () => {
  const txns = [
    { id: 't1', description: 'ACME CORP 4821', date: '2026-07-01', amount: -50, accountId: 'a1' },
    { id: 't2', description: 'ACME CORP 9930', date: '2026-07-01', amount: -50, accountId: 'a1' }, // exact dup of t1
    { id: 't3', description: 'ACME CORP 1122', date: '2026-07-01', amount: -50, accountId: 'a1' }, // and a 3rd
    // Untaught payee with a legit same-day same-amount repeat — must NOT be suggested.
    { id: 'c1', description: 'STARBUCKS 500', date: '2026-07-02', amount: -5, accountId: 'a1' },
    { id: 'c2', description: 'STARBUCKS 777', date: '2026-07-02', amount: -5, accountId: 'a1' },
  ];

  it('suggests nothing until something is learned', () => {
    expect(suggestLearnedDuplicates(txns, {})).toEqual([]);
  });

  it('after combining ACME, suggests the other exact ACME repeats — and keeps the fullest row', () => {
    const learned = learnFromCombine({}, [txns[0], txns[1]]); // family combined two ACME rows
    const groups = suggestLearnedDuplicates(txns, learned);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(3);          // all three ACME rows share the signature
    expect(groups[0].removeIds).toHaveLength(2);
    expect(groups[0].keepId).toBeDefined();
  });

  it('never suggests a repeat from a payee the family did NOT teach', () => {
    const learned = learnFromCombine({}, [txns[0]]); // only ACME taught
    const groups = suggestLearnedDuplicates(txns, learned);
    expect(groups.some((g) => /STARBUCKS/i.test(g.label))).toBe(false);
  });
});

describe('persistence (fail-soft, per-profile)', () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    });
  });
  it('round-trips the learned map', () => {
    saveLearnedDedupe({ 'acme corp': true });
    expect(loadLearnedDedupe()).toEqual({ 'acme corp': true });
    vi.unstubAllGlobals();
  });
  it('never throws when storage is unavailable', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
    expect(() => saveLearnedDedupe({ x: true })).not.toThrow();
    expect(loadLearnedDedupe()).toEqual({});
    vi.unstubAllGlobals();
  });
});
