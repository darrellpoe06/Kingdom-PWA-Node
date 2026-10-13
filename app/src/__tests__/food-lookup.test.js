// =============================================================================
// food-lookup — a number only when a database returned one
// =============================================================================
// The live endpoint could NOT be called from the environment this was built in
// (the agent proxy refuses external hosts, CONNECT 403), so these tests do the
// half that can honestly be proven: every response SHAPE and every failure path,
// against a stubbed fetch. What they pin is the rule that matters — a miss, an
// outage, a timeout and a malformed body must all resolve to "we don't know",
// never to a plausible-looking calorie count.
import { describe, it, expect, vi } from 'vitest';
import { lookupFood, pickResult, readNutriments, fillUnknowns } from '../lib/food-lookup.js';

const ok = (body) => vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body });
const product = (over = {}) => ({
  code: '123', product_name: 'Turkey Breast',
  nutriments: { 'energy-kcal_100g': 104, proteins_100g: 17.1 }, ...over,
});

describe('reading a product’s numbers', () => {
  it('takes calories and protein per 100 g', () => {
    expect(readNutriments(product())).toEqual({ calories: 104, proteinG: 17.1 });
  });
  it('returns null — not 0 — when a field is absent', () => {
    expect(readNutriments({ nutriments: {} })).toEqual({ calories: null, proteinG: null });
    expect(readNutriments({})).toEqual({ calories: null, proteinG: null });
    expect(readNutriments(null)).toEqual({ calories: null, proteinG: null });
  });
  it('ignores a non-numeric value rather than coercing it', () => {
    expect(readNutriments({ nutriments: { 'energy-kcal_100g': 'lots' } }).calories).toBeNull();
  });
});

describe('picking a usable result', () => {
  it('returns the first product that actually carries a number, and cites it', () => {
    const r = pickResult({ products: [product()] }, 'turkey');
    expect(r.found).toBe(true);
    expect(r.calories).toBe(104);
    expect(r.source).toBe('Open Food Facts');
    expect(r.per).toBe('100 g');
  });
  it('PROVEN-TO-CATCH: skips a product with no nutrition instead of returning zeros', () => {
    const r = pickResult({ products: [{ product_name: 'Mystery', nutriments: {} }, product()] }, 'turkey');
    expect(r.found).toBe(true);
    expect(r.calories).toBe(104);   // took the second, did NOT report the first as 0
  });
  it('reports a miss as a miss', () => {
    expect(pickResult({ products: [] }, 'x').found).toBe(false);
    expect(pickResult({ products: [] }, 'x').reason).toBe('no-match');
    expect(pickResult({ products: [{ nutriments: {} }] }, 'x').reason).toBe('no-nutrition');
  });
  it('survives a malformed body', () => {
    expect(pickResult(null, 'x').found).toBe(false);
    expect(pickResult({}, 'x').found).toBe(false);
  });
});

describe('every failure is "we don’t know", never a guess', () => {
  it('an empty query asks nothing', async () => {
    expect((await lookupFood('')).found).toBe(false);
  });
  it('an HTTP error returns not-found, carrying the status', async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    expect((await lookupFood('turkey', { fetchImpl: f })).reason).toBe('http-503');
  });
  it('a thrown fetch (offline/blocked) returns not-found, never throws', async () => {
    const f = vi.fn().mockRejectedValue(new Error('network down'));
    const r = await lookupFood('turkey', { fetchImpl: f });
    expect(r.found).toBe(false);
    expect(r.reason).toBe('unreachable');
  });
  it('an abort reads as a timeout', async () => {
    const err = new Error('aborted'); err.name = 'AbortError';
    const f = vi.fn().mockRejectedValue(err);
    expect((await lookupFood('turkey', { fetchImpl: f })).reason).toBe('timeout');
  });
  it('malformed JSON does not throw', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } });
    expect((await lookupFood('turkey', { fetchImpl: f })).found).toBe(false);
  });
  it('NO failure path ever yields a number', async () => {
    for (const f of [
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
      vi.fn().mockRejectedValue(new Error('x')),
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ products: [] }) }),
    ]) {
      const r = await lookupFood('turkey', { fetchImpl: f });
      expect(r.calories == null).toBe(true);
      expect(r.proteinG == null).toBe(true);
    }
  });
});

describe('the remembered library always wins over a stranger’s database', () => {
  it('never re-looks-up a food the person already confirmed', async () => {
    const f = ok({ products: [product({ nutriments: { 'energy-kcal_100g': 999, proteins_100g: 999 } })] });
    const rows = [{ name: 'olives', known: true, calories: 25, proteinG: 0.2, source: 'remembered' }];
    const out = await fillUnknowns(rows, { fetchImpl: f });
    expect(out[0].calories).toBe(25);     // his own value, untouched
    expect(f).not.toHaveBeenCalled();     // and the API was never asked
  });
  it('fills only the unknown ones, and marks where the number came from', async () => {
    const f = ok({ products: [product()] });
    const rows = [
      { name: 'olives', known: true, calories: 25, proteinG: 0.2, source: 'remembered' },
      { name: 'turkey', known: false, calories: null, proteinG: null },
    ];
    const out = await fillUnknowns(rows, { fetchImpl: f });
    expect(out[1].calories).toBe(104);
    expect(out[1].source).toBe('Open Food Facts');
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('a failed lookup leaves the row blank and says why', async () => {
    const f = vi.fn().mockRejectedValue(new Error('down'));
    const out = await fillUnknowns([{ name: 'dragonfruit', known: false }], { fetchImpl: f });
    expect(out[0].calories == null).toBe(true);
    expect(out[0].known).toBeFalsy();
    expect(out[0].lookupFailed).toBe('unreachable');
  });
});
