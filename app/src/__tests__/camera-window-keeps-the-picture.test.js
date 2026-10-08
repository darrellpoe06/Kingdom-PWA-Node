// =============================================================================
// The window keeps all the picture, and the one that was up comes back up
// =============================================================================
// Darrell 2026-10-08, with a photograph of the wall on the television: "The
// window for bigger images makes big black sections around the bottom and
// sides... for the controls... can we move the controls so we keep all video
// capacity also... when reset happens inside the app... bring it back up to
// the live window that was already up... make sense?"
//
// Two faults, and the first one is arithmetic, not taste. The window laid out
// as a column — the grid, then a 56px control bar — so fitGrid was handed
// (height - 56). Every tile is 16:9, so height lost costs WIDTH as well, which
// is why he sees black down BOTH sides and not only under the bar. The second
// is plainer: whether the window was up lived in React state alone, so any
// reset dropped him back to the page.
//
// Proven-to-catch: each number below is computed from the real fitGrid, and
// each one fails against the pre-fix behaviour.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  fitGrid, saveOpenWindow, loadOpenWindow, windowToResume, barShowing,
  WINDOW_KEY, WINDOW_RESUME_MS, WINDOW_BAR_QUIET_MS,
} from '../lib/cameras.js';

/** A localStorage that lives in this test only. */
function store() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    size: () => m.size,
  };
}

const GAP = 6;
const OLD_BAR = 56; // what the bar used to cost the grid

describe('the control bar stops costing the picture', () => {
  it('four cameras on a 1920x1080 television get back the width the bar was taking', () => {
    const was = fitGrid({ count: 4, width: 1920 - 2 * GAP, height: 1080 - OLD_BAR - 2 * GAP, gap: GAP });
    const now = fitGrid({ count: 4, width: 1920 - 2 * GAP, height: 1080 - 2 * GAP, gap: GAP });
    expect(was).toMatchObject({ cols: 2, rows: 2 });
    expect(now).toMatchObject({ cols: 2, rows: 2 });
    // The bar cost height AND width, because the tile is 16:9.
    expect(now.tileH).toBeGreaterThan(was.tileH);
    expect(now.tileW).toBeGreaterThan(was.tileW);
    // The black band down each side: half the width the grid was not using.
    const bandWas = Math.round((1920 - (was.tileW * 2 + GAP)) / 2);
    const bandNow = Math.round((1920 - (now.tileW * 2 + GAP)) / 2);
    expect(bandWas).toBe(63);
    expect(bandNow).toBe(13);
    // And the picture itself is bigger by a real amount, not a rounding.
    const grew = (now.tileW * now.tileH) / (was.tileW * was.tileH);
    expect(grew).toBeGreaterThan(1.09);
  });

  it('two or six cameras keep their bands, and that is geometry, not the bar', () => {
    // Said plainly rather than claimed away: a 2-across row is 32:9 and a
    // 3x2 grid is 8:3, both wider than the screen, so they are width-bound
    // and the bar was never what cost them. fitGrid already picks the
    // arrangement with the most area; "+ Bigger" is the control for the rest.
    for (const count of [2, 6]) {
      const was = fitGrid({ count, width: 1920 - 2 * GAP, height: 1080 - OLD_BAR - 2 * GAP, gap: GAP });
      const now = fitGrid({ count, width: 1920 - 2 * GAP, height: 1080 - 2 * GAP, gap: GAP });
      expect(now, `${count} cameras`).toEqual(was);
    }
  });

  it('a single camera fills the screen instead of stopping short of it', () => {
    const was = fitGrid({ count: 1, width: 1920 - 2 * GAP, height: 1080 - OLD_BAR - 2 * GAP, gap: GAP });
    const now = fitGrid({ count: 1, width: 1920 - 2 * GAP, height: 1080 - 2 * GAP, gap: GAP });
    expect(was).toMatchObject({ tileW: 1799, tileH: 1012 });
    expect(now).toMatchObject({ tileW: 1898, tileH: 1068 });
  });

  it('the bar shows on input, hides after a quiet spell, and never hides under a remote', () => {
    expect(barShowing({ lastInputAt: 1000, now: 1000 })).toBe(true);
    expect(barShowing({ lastInputAt: 1000, now: 1000 + WINDOW_BAR_QUIET_MS - 1 })).toBe(true);
    expect(barShowing({ lastInputAt: 1000, now: 1000 + WINDOW_BAR_QUIET_MS })).toBe(false);
    // A D-pad standing on a button: hiding it would strand the viewer.
    expect(barShowing({ lastInputAt: 1000, now: 1e12, focusInBar: true })).toBe(true);
  });
});

describe('the window that was up comes back up', () => {
  const views = { views: [{ id: 'v1', name: 'Front', cameras: ['a'] }, { id: 'v2', name: 'Back', cameras: ['b'] }], active: 'v1' };

  it('an open window is remembered, and closing forgets it', () => {
    const st = store();
    expect(saveOpenWindow('v2', st, 5000)).toBe(true);
    expect(loadOpenWindow(st)).toEqual({ viewId: 'v2', at: 5000 });
    expect(st.getItem(WINDOW_KEY)).toContain('v2');
    // Close is the signal: a window the viewer shut stays shut.
    expect(saveOpenWindow('', st)).toBe(true);
    expect(loadOpenWindow(st)).toBe(null);
    expect(st.size()).toBe(0);
  });

  it('it comes back on the view it was SHOWING, not whichever is active', () => {
    const st = store();
    saveOpenWindow('v2', st, 1000);
    expect(windowToResume(views, loadOpenWindow(st), 2000)).toBe('v2');
  });

  it('nothing comes back when there is nothing to come back to', () => {
    expect(windowToResume(views, null)).toBe('');
    expect(windowToResume(views, { viewId: '', at: 1 })).toBe('');
    // A view deleted while the window was remembered.
    expect(windowToResume(views, { viewId: 'gone', at: 1000 }, 2000)).toBe('');
    // Yesterday's window is a surprise, not a resume.
    expect(windowToResume(views, { viewId: 'v1', at: 0 }, WINDOW_RESUME_MS + 1)).toBe('');
    expect(windowToResume(views, { viewId: 'v1', at: 0 }, WINDOW_RESUME_MS)).toBe('v1');
  });

  it('a storage that refuses to answer loses nothing but the memory', () => {
    const bad = { getItem: () => { throw new Error('private mode'); }, setItem: () => { throw new Error('private mode'); }, removeItem: () => {} };
    expect(loadOpenWindow(bad)).toBe(null);
    expect(saveOpenWindow('v1', bad)).toBe(false);
    expect(windowToResume(views, loadOpenWindow(bad))).toBe('');
  });
});

// The arithmetic above is the library's. These pin the WINDOW ITSELF to it —
// without them the lib could be right while the component kept subtracting a
// bar, which is exactly the shape of the defect Darrell photographed.
describe('the window is wired to it', () => {
  const SRC = readFileSync(join(process.cwd(), 'src/components/Cameras.jsx'), 'utf8');

  it('the grid is laid out against the WHOLE screen', () => {
    expect(SRC).toContain('height: Math.max(0, size.h - 2 * WINDOW_GAP_PX)');
    expect(SRC, 'no bar height is subtracted from the picture any more').not.toContain('WINDOW_BAR_PX');
  });

  it('the bar floats over the picture and can get out of the way', () => {
    const at = SRC.indexOf('data-testid="view-window-bar"');
    expect(at).toBeGreaterThan(0);
    const tag = SRC.slice(SRC.lastIndexOf('<div', at), at);
    expect(tag, 'the bar is positioned over the grid, not stacked beside it').toContain('absolute inset-x-0 bottom-0');
    expect(tag).toContain('barOn');
    expect(tag).toContain('pointer-events-none'); // a hidden bar never eats a click
    expect(SRC).toContain("data-bar={barOn ? 'shown' : 'hidden'}");
    expect(SRC).toContain('barShowing({');
  });

  it('opening remembers the window and closing forgets it', () => {
    expect(SRC).toContain('const openWindow = useCallback((id) => { setWindowOpen(true); saveOpenWindow(id); }');
    expect(SRC).toContain('const closeWindow = useCallback(() => { setWindowOpen(false); saveOpenWindow(\'\'); }');
    expect(SRC).toContain('useState(() => !!windowToResume(views, loadOpenWindow()))');
    expect(SRC).toContain('onClick={() => openWindow(view.id)}');
  });
});
