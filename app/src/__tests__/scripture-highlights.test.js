// @vitest-environment node
//
// scripture-highlights — the in-app verse highlighter store (Darrell 2026-07-04,
// from his Logos color-coding). Pins the sovereignty + integrity of a reader's
// private markings: per-identity keys never commingle, the store is fail-soft
// (a throwing localStorage never breaks the render), transforms are pure and
// immutable, and a corrupt/hand-edited blob can never inject a bogus mark.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  HIGHLIGHT_STYLES, HIGHLIGHT_GROUPS, HIGHLIGHT_KINDS, styleFor, cssForHighlight,
  highlightsKey, emptyHighlights, loadHighlights, saveHighlights,
  getMark, setMark, cycleMark, markCount, clearAllMarks, DEFAULT_STYLE_KEY,
  addSpan, getSpans, clearSpans, spanCount, segmentsForVerse,
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
  it('reserves true red (#B01E1E) for the Blood — nothing else draws in red (DR-0099)', () => {
    const RED = '#b01e1e';
    const usesRed = (s) => (s.swatch || '').toLowerCase() === RED
      || Object.values(s.css).some((v) => typeof v === 'string' && v.toLowerCase() === RED);
    for (const s of HIGHLIGHT_STYLES) {
      if (usesRed(s)) expect(s.key, `${s.key} draws in red but is not the Blood`).toBe('crimson');
    }
    expect(styleFor('crimson').label).toBe('The Blood');   // red is the Blood of Jesus
  });
});

describe('the richer Logos palette — grouped by kind', () => {
  it('every style declares a known kind (foreground / highlighter / emphasis)', () => {
    const kinds = new Set(HIGHLIGHT_KINDS.map((k) => k.kind));
    expect(kinds).toEqual(new Set(['foreground', 'highlighter', 'emphasis']));
    for (const s of HIGHLIGHT_STYLES) {
      expect(kinds.has(s.kind), `${s.key} has an unknown kind ${s.kind}`).toBe(true);
    }
  });
  it('offers all three Logos kinds with real styles in each', () => {
    const byKind = Object.fromEntries(HIGHLIGHT_GROUPS.map((g) => [g.kind, g.styles]));
    // colored text (the semantic teaching set)
    expect(byKind.foreground.map((s) => s.key)).toEqual(expect.arrayContaining(['sky', 'coral', 'emerald']));
    // highlighter pens — more than just the yellow marker now
    expect(byKind.highlighter.map((s) => s.key)).toEqual(expect.arrayContaining(['gold', 'rose', 'mint', 'aqua']));
    // emphasis markup — underline / bold / box / strike (shape, not color)
    expect(byKind.emphasis.map((s) => s.key)).toEqual(expect.arrayContaining(['underline', 'bold', 'anchor', 'strike']));
  });
  it('groups partition the whole palette with no orphans or duplicates', () => {
    const grouped = HIGHLIGHT_GROUPS.flatMap((g) => g.styles.map((s) => s.key)).sort();
    const all = HIGHLIGHT_STYLES.map((s) => s.key).sort();
    expect(grouped).toEqual(all);                 // every style is in exactly one group
    expect(new Set(all).size).toBe(all.length);   // and every key is unique
  });
  it('emphasis styles carry markup css (weight / a line / a box), foreground carries ink', () => {
    expect(cssForHighlight('bold').fontWeight).toBeGreaterThanOrEqual(700);
    expect(cssForHighlight('underline').textDecorationLine).toBe('underline');
    expect(cssForHighlight('strike').textDecorationLine).toBe('line-through');
    expect(cssForHighlight('anchor').border).toBeTruthy();
    // a highlighter pen paints a background; a foreground style paints the ink
    expect(cssForHighlight('rose').backgroundColor).toBeTruthy();
    expect(cssForHighlight('slate').color).toBeTruthy();
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

describe('word / phrase spans (highlight part of a verse)', () => {
  it('adds, reads, and clears a span without mutating the input', () => {
    const s0 = emptyHighlights();
    const s1 = addSpan(s0, 'John 3:16', 4, 7, 'gold'); // "God" in "For God so loved"
    expect(getSpans(s1, 'John 3:16')).toEqual([{ start: 4, end: 7, style: 'gold' }]);
    expect(getSpans(s0, 'John 3:16')).toEqual([]);      // original untouched
    expect(spanCount(s1)).toBe(1);
    const s2 = clearSpans(s1, 'John 3:16');
    expect(getSpans(s2, 'John 3:16')).toEqual([]);
  });
  it('normalizes an inverted range and rejects a bad style / empty range', () => {
    expect(getSpans(addSpan(emptyHighlights(), 'a 1:1', 9, 3, 'sky'), 'a 1:1')).toEqual([{ start: 3, end: 9, style: 'sky' }]);
    expect(spanCount(addSpan(emptyHighlights(), 'a 1:1', 3, 3, 'sky'))).toBe(0);   // empty
    expect(spanCount(addSpan(emptyHighlights(), 'a 1:1', 1, 4, 'neon'))).toBe(0);  // unknown style
  });
  it('an eraser clears only the overlapping spans', () => {
    let s = addSpan(emptyHighlights(), 'a 1:1', 0, 3, 'sky');
    s = addSpan(s, 'a 1:1', 10, 15, 'gold');
    s = clearSpans(s, 'a 1:1', 1, 2);                 // overlaps the first only
    expect(getSpans(s, 'a 1:1')).toEqual([{ start: 10, end: 15, style: 'gold' }]);
  });
  it('segmentsForVerse splits into ordered runs; a later span wins on overlap', () => {
    const text = 'For God so loved';
    const segs = segmentsForVerse(text, [{ start: 4, end: 7, style: 'gold' }]);
    expect(segs).toEqual([
      { text: 'For ', style: 'none' },
      { text: 'God', style: 'gold' },
      { text: ' so loved', style: 'none' },
    ]);
    // overlap: the second (coral) overrides the first (sky) where they cross
    const ov = segmentsForVerse('abcdef', [{ start: 0, end: 4, style: 'sky' }, { start: 2, end: 6, style: 'coral' }]);
    expect(ov).toEqual([
      { text: 'ab', style: 'sky' },
      { text: 'cdef', style: 'coral' },
    ]);
    // clamps out-of-range and returns the whole text as one plain run when empty
    expect(segmentsForVerse('abc', [])).toEqual([{ text: 'abc', style: 'none' }]);
    expect(segmentsForVerse('abc', [{ start: 1, end: 99, style: 'gold' }])).toEqual([
      { text: 'a', style: 'none' }, { text: 'bc', style: 'gold' },
    ]);
  });
  it('spans survive a save/load round-trip; a corrupt span is dropped', () => {
    installStorage();
    saveHighlights('sp@x.co', addSpan(emptyHighlights(), 'John 3:16', 4, 7, 'gold'));
    expect(getSpans(loadHighlights('sp@x.co'), 'John 3:16')).toEqual([{ start: 4, end: 7, style: 'gold' }]);
    const map = installStorage();
    map.set(highlightsKey('c@x.co'), JSON.stringify({ spans: { 'a 1:1': [{ start: 0, end: 2, style: 'sky' }, { start: 5, end: 3, style: 'gold' }, { start: 1, end: 4, style: 'neon' }] } }));
    // only the valid span survives (inverted + unknown-style dropped)
    expect(getSpans(loadHighlights('c@x.co'), 'a 1:1')).toEqual([{ start: 0, end: 2, style: 'sky' }]);
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
