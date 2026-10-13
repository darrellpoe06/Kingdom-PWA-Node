// ux-signals — device-local UX history that adapts the view to the user's real
// usage (Darrell 2026-07-15). Proven-to-catch: ranking is deterministic over an
// injected storage + now; privacy/fail-soft holds; the cap evicts LRU.
import { describe, it, expect, beforeEach } from 'vitest';
import { recordUse, recentUsed, topUsed, useCount, clearSignals } from '../lib/ux-signals.js';

// A tiny in-memory Storage stand-in.
function memStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _dump: () => JSON.parse(m.get('poe-ux-signals') || '{}'),
  };
}

let s;
beforeEach(() => { s = memStore(); });

describe('recordUse + recentUsed', () => {
  it('orders by most-recent, newest first', () => {
    recordUse('a', { storage: s, now: 100 });
    recordUse('b', { storage: s, now: 200 });
    recordUse('c', { storage: s, now: 150 });
    expect(recentUsed(5, { storage: s })).toEqual(['b', 'c', 'a']);
  });
  it('a fresh use of an old key moves it to the front', () => {
    recordUse('a', { storage: s, now: 100 });
    recordUse('b', { storage: s, now: 200 });
    recordUse('a', { storage: s, now: 300 });
    expect(recentUsed(5, { storage: s })).toEqual(['a', 'b']);
  });
  it('respects the limit', () => {
    recordUse('a', { storage: s, now: 1 });
    recordUse('b', { storage: s, now: 2 });
    recordUse('c', { storage: s, now: 3 });
    expect(recentUsed(2, { storage: s })).toEqual(['c', 'b']);
  });
});

describe('topUsed + useCount', () => {
  it('ranks by count, ties broken by recency', () => {
    recordUse('a', { storage: s, now: 1 });
    recordUse('a', { storage: s, now: 2 });
    recordUse('b', { storage: s, now: 3 }); // b: 1 use, most recent
    recordUse('c', { storage: s, now: 4 });
    recordUse('c', { storage: s, now: 5 }); // c: 2 uses, most recent of the 2-use keys
    expect(topUsed(3, { storage: s })).toEqual(['c', 'a', 'b']);
    expect(useCount('a', { storage: s })).toBe(2);
    expect(useCount('missing', { storage: s })).toBe(0);
  });
});

describe('cap — evicts least-recently-seen beyond MAX_KEYS (200)', () => {
  it('never grows past the cap, keeping the most recent', () => {
    for (let i = 0; i < 260; i++) recordUse(`k${i}`, { storage: s, now: i });
    const data = s._dump();
    expect(Object.keys(data).length).toBe(200);
    // the oldest (k0..k59) are gone; the newest survive
    expect(data.k0).toBeUndefined();
    expect(data.k259).toBeDefined();
    expect(recentUsed(1, { storage: s })).toEqual(['k259']);
  });
});

describe('privacy / fail-soft (DATA-AS-EMPOWERMENT)', () => {
  it('clearSignals wipes everything', () => {
    recordUse('a', { storage: s, now: 1 });
    clearSignals({ storage: s });
    expect(recentUsed(5, { storage: s })).toEqual([]);
    expect(topUsed(5, { storage: s })).toEqual([]);
  });
  it('never throws and returns empty when storage throws (blocked / private mode)', () => {
    const boom = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(() => recordUse('a', { storage: boom, now: 1 })).not.toThrow();
    expect(recentUsed(5, { storage: boom })).toEqual([]);
    expect(topUsed(5, { storage: boom })).toEqual([]);
    expect(useCount('a', { storage: boom })).toBe(0);
    expect(() => clearSignals({ storage: boom })).not.toThrow();
  });
  it('ignores non-string keys and bad stored JSON', () => {
    recordUse(42, { storage: s, now: 1 });
    recordUse('', { storage: s, now: 1 });
    expect(recentUsed(5, { storage: s })).toEqual([]);
    s.setItem('poe-ux-signals', 'not json{');
    expect(recentUsed(5, { storage: s })).toEqual([]); // read() swallows the parse error
  });
});
