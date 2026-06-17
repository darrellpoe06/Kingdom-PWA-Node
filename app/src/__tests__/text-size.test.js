// text-size — the shared large-print primitive (WCAG 2.1 Resize Text, 1.4.4).
// Locks the contract a regression would silently break: the steps exist and are
// ordered smallest->largest, the root-scale math is right, Largest reaches the
// 200% headroom WCAG targets, persistence round-trips per device, and bad input
// degrades to Normal instead of throwing. Proven-to-catch (DR-0076): each assert
// fails if the behavior it guards is broken.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  TEXT_SIZE_STEPS, DEFAULT_TEXT_SIZE, stepFor, isValidTextSize,
  applyTextSize, loadTextSize, saveTextSize, initTextSize, setTextSize,
} from '../lib/text-size.js';

// A tiny in-memory localStorage stand-in (Node test env has no DOM storage).
function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

// A minimal documentElement stand-in to observe applyTextSize's DOM writes.
function makeDoc() {
  const attrs = {};
  return {
    documentElement: {
      style: {},
      setAttribute: (k, v) => { attrs[k] = v; },
      _attrs: attrs,
    },
  };
}

describe('TEXT_SIZE_STEPS shape', () => {
  it('has four stepped options with the plain A/A+/A++/A+++ affordance', () => {
    expect(TEXT_SIZE_STEPS.map((s) => s.label)).toEqual(['A', 'A+', 'A++', 'A+++']);
    expect(TEXT_SIZE_STEPS.map((s) => s.key)).toEqual(['normal', 'large', 'larger', 'largest']);
  });

  it('multipliers increase monotonically from 1x', () => {
    const mults = TEXT_SIZE_STEPS.map((s) => s.mult);
    expect(mults[0]).toBe(1);
    for (let i = 1; i < mults.length; i += 1) expect(mults[i]).toBeGreaterThan(mults[i - 1]);
  });

  it('Largest reaches the WCAG 200% resize headroom (>=1.5x root)', () => {
    const largest = stepFor('largest');
    expect(largest.mult).toBeGreaterThanOrEqual(1.5);
  });

  it('every step has a human-readable name for the panel control', () => {
    for (const s of TEXT_SIZE_STEPS) expect(typeof s.name).toBe('string');
    expect(stepFor('largest').name).toBe('Largest');
  });
});

describe('validation + fallback', () => {
  it('isValidTextSize accepts known keys, rejects junk', () => {
    expect(isValidTextSize('largest')).toBe(true);
    expect(isValidTextSize('huge')).toBe(false);
    expect(isValidTextSize(undefined)).toBe(false);
  });

  it('stepFor falls back to Normal for unknown keys', () => {
    expect(stepFor('nope')).toBe(TEXT_SIZE_STEPS[0]);
    expect(DEFAULT_TEXT_SIZE).toBe('normal');
  });
});

describe('applyTextSize root scaling', () => {
  it('writes the root font-size as a percentage and stamps the attribute', () => {
    const doc = makeDoc();
    const step = applyTextSize('largest', doc);
    expect(doc.documentElement.style.fontSize).toBe('150%');
    expect(doc.documentElement._attrs['data-text-size']).toBe('largest');
    expect(step.key).toBe('largest');
  });

  it('Normal resets the root to 100%', () => {
    const doc = makeDoc();
    applyTextSize('normal', doc);
    expect(doc.documentElement.style.fontSize).toBe('100%');
  });

  it('unknown key applies Normal, never throws', () => {
    const doc = makeDoc();
    expect(() => applyTextSize('bogus', doc)).not.toThrow();
    expect(doc.documentElement.style.fontSize).toBe('100%');
  });

  it('is safe with no document (test/SSR env)', () => {
    expect(() => applyTextSize('large', undefined)).not.toThrow();
  });
});

describe('per-device persistence', () => {
  let store;
  beforeEach(() => { store = makeStore(); });

  it('save then load round-trips the choice', () => {
    saveTextSize('larger', store);
    expect(loadTextSize(store)).toBe('larger');
  });

  it('load returns the default when nothing is saved', () => {
    expect(loadTextSize(store)).toBe('normal');
  });

  it('load ignores a corrupted/unknown stored value', () => {
    store.setItem('poe-text-size', 'gigantic');
    expect(loadTextSize(store)).toBe('normal');
  });

  it('never throws when storage access throws (private mode / no storage)', () => {
    const hostile = {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('SecurityError'); },
    };
    expect(() => saveTextSize('large', hostile)).not.toThrow();
    expect(loadTextSize(hostile)).toBe('normal');
  });
});

describe('setTextSize / initTextSize integration', () => {
  it('setTextSize validates and returns the applied key', () => {
    expect(setTextSize('larger')).toBe('larger');
    expect(setTextSize('not-real')).toBe('normal');
  });

  it('initTextSize returns a valid key', () => {
    expect(isValidTextSize(initTextSize())).toBe(true);
  });
});
