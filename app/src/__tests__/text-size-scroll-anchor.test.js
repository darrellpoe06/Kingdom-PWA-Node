// @vitest-environment node
//
// Regression guard (Darrell 2026-06-25): changing the global font size used to
// throw the reader to the top ("whiplash"). setTextSize must now keep the
// element the reader was looking at in the same place across the size step.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { setTextSize, TEXT_SIZE_STEPS, DEFAULT_TEXT_SIZE } from '../lib/text-size.js';
import { READING_ATTR } from '../lib/reading-position.js';

const biggerKey = (TEXT_SIZE_STEPS.find((s) => s.key !== DEFAULT_TEXT_SIZE) || {}).key;

function install() {
  const anchorEl = {
    _top: 100,
    getBoundingClientRect() { return { top: this._top, bottom: this._top + 20, height: 20 }; },
    getAttribute(n) { return n === READING_ATTR ? 'reading' : null; },
    closest() { return null; },
  };
  const style = {};
  let font = '100%';
  // Setting the root font-size simulates the reflow: the tracked element shifts.
  Object.defineProperty(style, 'fontSize', { get: () => font, set: (v) => { font = v; anchorEl._top = 150; }, configurable: true });
  global.document = {
    documentElement: { style, setAttribute() {} },
    querySelectorAll: () => [anchorEl],
    querySelector: () => anchorEl,
    elementFromPoint: () => null,
    visibilityState: 'visible',
  };
  global.window = { innerHeight: 800, innerWidth: 400, scrollY: 0, pageYOffset: 0, scrollBy: vi.fn(), scrollTo: vi.fn() };
  const m = {};
  global.localStorage = { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } };
  return { anchorEl };
}

afterEach(() => { delete global.document; delete global.window; delete global.localStorage; });

describe('setTextSize preserves the reading anchor across a font-size step', () => {
  it('scrolls by the reflow delta so the reader stays put (no jump to top)', () => {
    install();
    const used = setTextSize(biggerKey);
    expect(used).toBe(biggerKey);
    // captured at top=100; reflow moved it to 150; restored by scrolling +50.
    expect(global.window.scrollBy).toHaveBeenCalledWith(0, 50);
  });

  it('still returns a valid key and never throws without a DOM', () => {
    // no globals installed here (afterEach cleared them)
    expect(() => setTextSize(biggerKey)).not.toThrow();
    expect(setTextSize('nonsense')).toBe(DEFAULT_TEXT_SIZE);
  });
});
