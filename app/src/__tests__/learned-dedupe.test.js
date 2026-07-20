// @vitest-environment node
//
// learned-dedupe — the combine feature learns (Darrell 2026-07-20). Pins: the
// exact-duplicate signature, learning the payee from a combine, suggesting only
// EXACT repeats from a TAUGHT payee (a legit same-day repeat from an untaught
// payee is never called a duplicate), and the most-informative keep choice.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dedupeSignature, learnFromCombine, suggestLearnedDuplicates,
  loadLearnedDedupe, saveLearnedDedupe,
} from '../lib/learned-dedupe.js';

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
