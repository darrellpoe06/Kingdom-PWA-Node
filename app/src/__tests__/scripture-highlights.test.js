// @vitest-environment node
//
// scripture-highlights — the in-app verse highlighter store (Darrell 2026-07-04,
// from his Logos color-coding). Pins the sovereignty + integrity of a reader's
// private markings: per-identity keys never commingle, the store is fail-soft
// (a throwing localStorage never breaks the render), transforms are pure and
// immutable, and a corrupt/hand-edited blob can never inject a bogus mark.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  HIGHLIGHT_STYLES, styleFor, cssForHighlight,
  highlightsKey, emptyHighlights, loadHighlights, saveHighlights,
  getMark, setMark, cycleMark, markCount, clearAllMarks, DEFAULT_STYLE_KEY,
} from '../lib/scripture-highlights.js';

// A minimal in-memory localStorage the module's safeStorage() will pick up.
function installStorage(throwing = false) {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (throwing ? (() => { throw new Error('blocked'); })() : (map.has(k) ? map.get(k) : null)),
    setItem: (k, v) => { if (throwing) throw new Error('blocked'); map.set(k, String(v)); },
    removeItem: (k) => map.delete(k),
  };
  return map;
}

beforeEach(() => { delete globalThis.localStorage; });

describe('palette', () => {
  it('offers the semantic color set Darrell coded in Logos', () => {
    const keys = HIGHLIGHT_STYLES.map((s) => s.key);
    // narrative / promise / hard-truth / warning / life / treasure / anchor
    for (const k of ['sky', 'coral', 'crimson', 'royal', 'emerald', 'gold', 'anchor']) {
      expect(keys, `palette missing ${k}`).toContain(k);
    }
    for (const s of HIGHLIGHT_STYLES) {
      expect(s.label, `${s.key} label`).toBeTruthy();
      expect(s.meaning, `${s.key} meaning`).toBeTruthy();
      expect(s.swatch, `${s.key} swatch`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      // each style does SOMETHING visible: a text color or a background
      expect(s.css.color || s.css.backgroundColor, `${s.key} css`).toBeTruthy();
    }
  });
  it('styleFor falls back to a clear look for unknown / none', () => {
    expect(styleFor('none').key).toBe('none');
    expect(styleFor('bogus').key).toBe('none');
    expect(styleFor(null).css).toEqual({});
    expect(cssForHighlight('none')).toEqual({});
    expect(cssForHighlight('sky').color).toBe('#1F5AA6');
  });
  it('the default is unmarked', () => {
    expect(DEFAULT_STYLE_KEY).toBe('none');
  });
});

describe('pure transforms (immutable)', () => {
  it('sets, reads, and clears a mark without mutating the input', () => {
    const s0 = emptyHighlights();
    const s1 = setMark(s0, 'Luke 2:26', 'coral');
    expect(getMark(s1, 'Luke 2:26')).toBe('coral');
    expect(getMark(s0, 'Luke 2:26')).toBe('none'); // original untouched
    const s2 = setMark(s1, 'Luke 2:26', 'none');   // clear
    expect(getMark(s2, 'Luke 2:26')).toBe('none');
    expect(markCount(s2)).toBe(0);
  });
  it('ignores empty refs and unknown style keys (clears instead of injecting)', () => {
    let s = setMark(emptyHighlights(), '', 'coral');
    expect(markCount(s)).toBe(0);
    s = setMark(emptyHighlights(), 'John 4:29', 'not-a-color');
    expect(getMark(s, 'John 4:29')).toBe('none');
  });
  it('cycles none -> each style -> none and wraps', () => {
    let s = emptyHighlights();
    const seen = [];
    for (let i = 0; i < HIGHLIGHT_STYLES.length + 1; i += 1) {
      s = cycleMark(s, 'Psalm 139:1');
      seen.push(getMark(s, 'Psalm 139:1'));
    }
    // first N picks walk the palette in order, then it returns to 'none'
    expect(seen.slice(0, HIGHLIGHT_STYLES.length)).toEqual(HIGHLIGHT_STYLES.map((x) => x.key));
    expect(seen[HIGHLIGHT_STYLES.length]).toBe('none');
  });
  it('clearAllMarks empties the whole store', () => {
    let s = setMark(emptyHighlights(), 'a 1:1', 'sky');
    s = setMark(s, 'b 2:2', 'gold');
    expect(markCount(s)).toBe(2);
    expect(markCount(clearAllMarks(s))).toBe(0);
  });
});

describe('per-identity, device-local persistence', () => {
  it('keys are namespaced per signed-in identity (no commingling)', () => {
    expect(highlightsKey('Darrell@Poe.com')).toBe('poetech.highlights.v1:darrell@poe.com');
    expect(highlightsKey(null)).toBe('poetech.highlights.v1:anon');
    expect(highlightsKey('a@b.co')).not.toBe(highlightsKey('c@d.co'));
  });
  it('round-trips through storage and stays separate across identities', () => {
    installStorage();
    saveHighlights('one@x.co', setMark(emptyHighlights(), 'Luke 4:18', 'coral'));
    saveHighlights('two@x.co', setMark(emptyHighlights(), 'Luke 4:18', 'crimson'));
    expect(getMark(loadHighlights('one@x.co'), 'Luke 4:18')).toBe('coral');
    expect(getMark(loadHighlights('two@x.co'), 'Luke 4:18')).toBe('crimson');
  });
  it('drops corrupt / unknown marks on load (a hand-edited blob cannot inject)', () => {
    const map = installStorage();
    map.set(highlightsKey('x@y.co'), JSON.stringify({ marks: { 'Luke 2:26': 'coral', 'John 4:29': 'neon', 'Psalm 1:1': 'sky' } }));
    const st = loadHighlights('x@y.co');
    expect(getMark(st, 'Luke 2:26')).toBe('coral');   // valid ref + valid color: kept
    expect(getMark(st, 'John 4:29')).toBe('none');    // unknown color 'neon': dropped
    expect(getMark(st, 'Psalm 1:1')).toBe('sky');     // kept
    expect(markCount(st)).toBe(2);
  });
});

describe('fail-soft (never throws into the render tree)', () => {
  it('returns empty when there is no storage at all', () => {
    expect(loadHighlights('a@b.co')).toEqual(emptyHighlights());
    expect(saveHighlights('a@b.co', emptyHighlights())).toEqual({ skipped: 'no-storage' });
  });
  it('degrades gracefully when localStorage throws', () => {
    installStorage(true);
    expect(loadHighlights('a@b.co')).toEqual(emptyHighlights());
    expect(saveHighlights('a@b.co', emptyHighlights()).skipped).toBe('write-error');
  });
});
