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
  chromeMultFor, chromeScaleFor, CHROME_SCALE_FACTOR,
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

// A minimal documentElement stand-in to observe applyTextSize's DOM writes,
// including the CSS custom properties the content-vs-chrome scope split publishes
// via style.setProperty (read back through _props).
function makeDoc() {
  const attrs = {};
  const props = {};
  const style = { setProperty: (k, v) => { props[k] = v; }, _props: props };
  return {
    documentElement: {
      style,
      setAttribute: (k, v) => { attrs[k] = v; },
      _attrs: attrs,
    },
  };
}

describe('TEXT_SIZE_STEPS shape', () => {
  it('has six stepped options — the plain plusses, then the big-print pair (DR-0144)', () => {
    expect(TEXT_SIZE_STEPS.map((s) => s.label)).toEqual(['A', 'A+', 'A++', 'A+++', 'A++++', 'A44']);
    expect(TEXT_SIZE_STEPS.map((s) => s.key)).toEqual(['normal', 'large', 'larger', 'largest', 'giant', 'bigprint']);
  });

  it('Big Print 44 lands 16px body text at exactly 44px ("up to 44 big print" — Darrell 2026-07-10)', () => {
    expect(stepFor('bigprint').mult * 16).toBe(44);
    expect(stepFor('giant').mult).toBe(2);
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

// Scope split (Darrell 2026-06-17): CONTENT scales fully, CHROME (display title +
// nav) is capped so it stays roughly fixed. A .ts-chrome-region applies
// --ts-chrome-scale as `zoom`; chromeMultFor is the cap target and chromeScaleFor
// the zoom that reaches it from the scaled root.
// Proven-to-catch: each assert fails if the chrome would balloon with content.
describe('content-vs-chrome scope split', () => {
  it('chromeMultFor is identity at Normal (chrome === content at 1x)', () => {
    expect(chromeMultFor(1)).toBe(1);
  });

  it('chromeMultFor grows far slower than content — capped, never ballooned', () => {
    // At Largest, content is 1.5x but chrome must stay near 1x (here ~1.125x).
    expect(chromeMultFor(1.5)).toBeCloseTo(1.125, 6);
    // The cap must always be strictly between "no growth" and "full growth".
    for (const s of TEXT_SIZE_STEPS) {
      if (s.mult === 1) continue;
      const cap = chromeMultFor(s.mult);
      expect(cap).toBeGreaterThan(1);
      expect(cap).toBeLessThan(s.mult);
    }
  });

  it('chrome follows exactly CHROME_SCALE_FACTOR of the content growth', () => {
    expect(chromeMultFor(1.3)).toBeCloseTo(1 + 0.3 * CHROME_SCALE_FACTOR, 6);
    expect(CHROME_SCALE_FACTOR).toBeGreaterThan(0);
    expect(CHROME_SCALE_FACTOR).toBeLessThan(1);
  });

  it('chromeScaleFor is the zoom that nets the cap: root(mult) * zoom === chromeMult', () => {
    expect(chromeScaleFor(1)).toBe(1); // Normal: no-op
    for (const s of TEXT_SIZE_STEPS) {
      const zoom = chromeScaleFor(s.mult);
      // The rendered chrome size = root scale * zoom, which must equal the cap.
      expect(s.mult * zoom).toBeCloseTo(chromeMultFor(s.mult), 6);
      // Above Normal the region zooms OUT (<1) to undo most of the root growth.
      if (s.mult > 1) expect(zoom).toBeLessThan(1);
    }
    expect(chromeScaleFor(1.5)).toBeCloseTo(0.75, 6);
  });

  it('chrome math degrades to identity for bad input, never throws', () => {
    expect(chromeMultFor(undefined)).toBe(1);
    expect(chromeMultFor(0)).toBe(1);
    expect(chromeMultFor(-2)).toBe(1);
    expect(chromeScaleFor(undefined)).toBe(1);
    expect(chromeScaleFor(0)).toBe(1);
  });

  it('applyTextSize publishes the scope-split variables so a region can cap itself', () => {
    const doc = makeDoc();
    applyTextSize('largest', doc);
    const props = doc.documentElement.style._props;
    expect(props['--ts-mult']).toBe('1.5');
    expect(props['--ts-chrome-mult']).toBe(String(chromeMultFor(1.5)));
    expect(props['--ts-chrome-scale']).toBe(String(chromeScaleFor(1.5)));
  });

  it('at Normal every scope-split variable is 1 — the cap is an exact no-op', () => {
    const doc = makeDoc();
    applyTextSize('normal', doc);
    const props = doc.documentElement.style._props;
    expect(props['--ts-mult']).toBe('1');
    expect(props['--ts-chrome-mult']).toBe('1');
    expect(props['--ts-chrome-scale']).toBe('1');
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
