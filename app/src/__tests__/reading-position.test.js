// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  prunePositions, normalizePos, savePosition, getPosition, clearPosition,
  resumeScrollY, anchorDelta, resumeLabel, entryKey,
  topVisibleAnchor, captureAnchor, applyAnchor, restorePosition, currentReadingPos,
  anchorProps, READING_ATTR,
} from '../lib/reading-position.js';

function fakeStore() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, _m: m };
}
function el(top, id) {
  return {
    _top: top,
    getBoundingClientRect() { return { top: this._top, bottom: this._top + 20, height: 20 }; },
    getAttribute(n) { return n === READING_ATTR && id ? id : null; },
    closest() { return null; },
  };
}
function fakeDoc(els) {
  return {
    querySelectorAll: () => els,
    querySelector: (sel) => { const m = /"(.+)"/.exec(sel); const id = m && m[1]; return els.find((e) => e.getAttribute(READING_ATTR) === id) || null; },
    elementFromPoint: () => null,
  };
}
const fakeWin = (over = {}) => ({ innerHeight: 800, innerWidth: 400, scrollY: 0, pageYOffset: 0, scrollBy: vi.fn(), scrollTo: vi.fn(), ...over });

describe('pure persistence', () => {
  it('saves and reads back a position per user/surface/item', () => {
    const s = fakeStore();
    savePosition('u@x', 'book', 'b1', { anchorId: 'ch-2', top: 12, scrollY: 900, at: 5 }, s);
    const got = getPosition('u@x', 'book', 'b1', s);
    expect(got.anchorId).toBe('ch-2');
    expect(got.scrollY).toBe(900);
  });
  it('scopes by item — different items do not collide', () => {
    const s = fakeStore();
    savePosition('u', 'book', 'a', { scrollY: 100, at: 1 }, s);
    savePosition('u', 'book', 'b', { scrollY: 200, at: 2 }, s);
    expect(getPosition('u', 'book', 'a', s).scrollY).toBe(100);
    expect(getPosition('u', 'book', 'b', s).scrollY).toBe(200);
  });
  it('clear removes one entry', () => {
    const s = fakeStore();
    savePosition('u', 'book', 'a', { scrollY: 100, at: 1 }, s);
    clearPosition('u', 'book', 'a', s);
    expect(getPosition('u', 'book', 'a', s)).toBeNull();
  });
  it('fails soft with no storage', () => {
    expect(getPosition('u', 'book', 'a', null)).toBeNull();
    expect(savePosition('u', 'book', 'a', { scrollY: 1 }, null).skipped).toBe('no-storage');
  });
  it('prunePositions keeps the newest within the cap', () => {
    const map = {};
    for (let i = 0; i < 70; i++) map[`book::${i}`] = { at: i, scrollY: i };
    const pruned = prunePositions(map, 60);
    expect(Object.keys(pruned)).toHaveLength(60);
    expect(pruned['book::69']).toBeTruthy();   // newest kept
    expect(pruned['book::0']).toBeUndefined();  // oldest pruned
  });
  it('entryKey + normalizePos shape', () => {
    expect(entryKey('book', 'b1')).toBe('book::b1');
    expect(normalizePos({}).anchorId).toBeNull();
  });
});

describe('pure scroll math (regression-guarded)', () => {
  it('anchorDelta is the difference between new and old top', () => {
    expect(anchorDelta(100, 150)).toBe(50);
    expect(anchorDelta(150, 100)).toBe(-50);
  });
  it('resumeScrollY puts an element back to its saved viewport offset', () => {
    // element now sits at top=200 with scrollY=500; it was saved at top=12.
    // to bring it back to 12 we scroll to 500 + (200 - 12) = 688.
    expect(resumeScrollY(500, 200, 12)).toBe(688);
  });
  it('resumeScrollY never goes negative', () => {
    expect(resumeScrollY(0, 0, 500)).toBe(0);
  });
  it('resumeLabel reads new vs returning', () => {
    expect(resumeLabel(null)).toBeNull();
    expect(resumeLabel({ scrollY: 900, at: 0 }, 0)).toContain('Continue');
    expect(resumeLabel({ scrollY: 900, at: 1000 }, 1000 + 5 * 60000)).toContain('5 min');
  });
});

describe('DOM anchor mechanism (the shared resume + font-fix core)', () => {
  it('topVisibleAnchor picks the marked section nearest the top', () => {
    const a = el(-30, 'past'); const b = el(8, 'reading'); const c = el(400, 'below');
    const hit = topVisibleAnchor(fakeDoc([a, b, c]), fakeWin());
    expect(hit.id).toBe('reading');
    expect(hit.top).toBe(8);
  });

  it('capture + apply keeps the element at the same spot after a reflow', () => {
    const e = el(100, 'ch-1');
    const w = fakeWin();
    const token = captureAnchor(fakeDoc([e]), w);     // captured at top=100
    e._top = 150;                                     // reflow pushed it down (font grew)
    const moved = applyAnchor(token, w);
    expect(moved).toBe(true);
    expect(w.scrollBy).toHaveBeenCalledWith(0, 50);   // scroll the delta to keep it put
  });

  it('applyAnchor no-ops without a token or window', () => {
    expect(applyAnchor(null, fakeWin())).toBe(false);
    expect(applyAnchor({ el: el(0) }, null)).toBe(false);
  });

  it('restorePosition aligns the saved anchor element to its saved offset', () => {
    const e = el(140, 'ch-3');
    const w = fakeWin({ scrollY: 0 });
    const ok = restorePosition({ anchorId: 'ch-3', top: 100, scrollY: 0, at: 1 }, fakeDoc([e]), w);
    expect(ok).toBe(true);
    expect(w.scrollTo).toHaveBeenCalledWith(0, 40);   // 0 + (140 - 100)
  });

  it('restorePosition falls back to scrollY when the anchor is gone', () => {
    const w = fakeWin();
    restorePosition({ anchorId: 'missing', top: 0, scrollY: 777, at: 1 }, fakeDoc([]), w);
    expect(w.scrollTo).toHaveBeenCalledWith(0, 777);
  });

  it('currentReadingPos snapshots anchor + scrollY', () => {
    const e = el(10, 'ch-2');
    const pos = currentReadingPos(fakeDoc([e]), fakeWin({ scrollY: 1234 }));
    expect(pos.anchorId).toBe('ch-2');
    expect(pos.scrollY).toBe(1234);
  });
});

describe('anchorProps', () => {
  it('spreads a stable data-reading-anchor', () => {
    expect(anchorProps('ch-1')).toEqual({ [READING_ATTR]: 'ch-1' });
    expect(anchorProps('')).toEqual({});
  });
});
