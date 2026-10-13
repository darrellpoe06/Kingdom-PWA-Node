// @vitest-environment node
// =============================================================================
// The floating reader's rules (DR-0641): never off screen, never too small,
// never parked on Feedback or Give, remembered per device.
// Proven-to-catch: each test fails against a float that trusts the drag (no
// clamp), a minimum smaller than a 44 px control row, a float that parks on
// the corner buttons, or state that does not survive a reload.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { clampRect, avoidRects, defaultRect, loadFloat, saveFloat, MIN_W, MIN_H, EDGE, FLOAT_KEY } from '../lib/float-geometry.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };

describe('clamp', () => {
  it('a float dragged off any edge comes back wholly on screen', () => {
    for (const [x, y] of [[-500, 10], [5000, 10], [10, -400], [10, 9000]]) {
      const r = clampRect({ x, y, w: 300, h: 240 }, 390, 844);
      expect(r.x).toBeGreaterThanOrEqual(EDGE);
      expect(r.y).toBeGreaterThanOrEqual(EDGE);
      expect(r.x + r.w).toBeLessThanOrEqual(390 - EDGE);
      expect(r.y + r.h).toBeLessThanOrEqual(844 - EDGE);
    }
  });

  it('never smaller than the size that keeps every control a 44 px target', () => {
    const r = clampRect({ x: 10, y: 10, w: 40, h: 30 }, 390, 844);
    expect(r.w).toBe(MIN_W);
    expect(r.h).toBe(MIN_H);
    expect(MIN_W).toBeGreaterThanOrEqual(4 * 44 + 3 * 8);
    expect(MIN_H).toBeGreaterThanOrEqual(3 * 44);
  });

  it('never larger than the screen, and re-clamped when the Fold closes (1812 → 904 wide)', () => {
    const wide = clampRect({ x: 1400, y: 100, w: 380, h: 300 }, 1812, 1000);
    const folded = clampRect(wide, 904, 2000);
    expect(folded.x + folded.w).toBeLessThanOrEqual(904 - EDGE);
    const tiny = clampRect({ x: 0, y: 0, w: 900, h: 900 }, 320, 640);
    expect(tiny.w).toBeLessThanOrEqual(320 - 2 * EDGE);
  });
});

describe('at rest it does not cover Feedback or Give', () => {
  const vw = 390; const vh = 844;
  const feedback = { l: 16, r: 64, t: 780, b: 828 };
  const give = { l: 326, r: 374, t: 716, b: 764 };
  it('parked over the Give button, it moves up above it', () => {
    const r = avoidRects({ x: 100, y: 600, w: 280, h: 230 }, [feedback, give], vw, vh);
    expect(r.y + r.h).toBeLessThanOrEqual(give.t);
    const overlaps = (b) => !(r.x + r.w <= b.l || b.r <= r.x || r.y + r.h <= b.t || b.b <= r.y);
    expect(overlaps(give)).toBe(false);
    expect(overlaps(feedback)).toBe(false);
  });

  it('a fresh float starts clear of both', () => {
    const r = avoidRects(defaultRect(vw, vh), [feedback, give], vw, vh);
    const overlaps = (b) => !(r.x + r.w <= b.l || b.r <= r.x || r.y + r.h <= b.t || b.b <= r.y);
    expect(overlaps(give) || overlaps(feedback)).toBe(false);
  });
});

describe('remembered per device', () => {
  it('floating, place and size survive a reload', () => {
    const s = mem();
    saveFloat({ floating: true, rect: { x: 20, y: 300, w: 300, h: 250 } }, s);
    expect(loadFloat(s)).toEqual({ floating: true, rect: { x: 20, y: 300, w: 300, h: 250 } });
  });

  it('docking is remembered too', () => {
    const s = mem();
    saveFloat({ floating: true, rect: { x: 1, y: 2, w: 300, h: 250 } }, s);
    saveFloat({ floating: false, rect: { x: 1, y: 2, w: 300, h: 250 } }, s);
    expect(loadFloat(s).floating).toBe(false);
  });

  it('a device that cannot store starts docked, and nothing throws', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    expect(() => saveFloat({ floating: true }, broken)).not.toThrow();
    expect(loadFloat(broken)).toEqual({ floating: false, rect: null });
    const junk = mem(); junk.setItem(FLOAT_KEY, '{nope');
    expect(loadFloat(junk)).toEqual({ floating: false, rect: null });
  });
});
