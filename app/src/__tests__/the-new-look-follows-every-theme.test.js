// DR-1679: Darrell 2026-11-26, "Should fit with any change of the looks based on our options". The new look's
// colors come from each theme's own background and accent, and every pair a reader meets reads (WCAG AA).
import { describe, it, expect } from 'vitest';
import { THEMES } from '../lib/theme-css.js';
import { learnTokens, learnThemeCss, contrast, luminance, readDarkInk, setDarkInk } from '../lib/learn-theme.js';

describe('the new look follows every theme, readably', () => {
  for (const th of THEMES) {
    it(`${th.key}: words, dim words, the accent and words on the accent all read`, () => {
      const t = learnTokens(th);
      expect(t.bg).toBe(th.color);
      // Every word reaches 7:1 (WCAG AAA) on its background and on panels; low light (dark themes) reads
      // white, with the accent at 7:1 too (Darrell: "white words for low light").
      expect(contrast(t.text, t.bg)).toBeGreaterThanOrEqual(7);
      expect(contrast(t.text, t.panel)).toBeGreaterThanOrEqual(7);
      expect(contrast(t.dim, t.bg)).toBeGreaterThanOrEqual(7);
      expect(contrast(t.dim, t.panel)).toBeGreaterThanOrEqual(7);
      expect(contrast(t.accent, t.bg)).toBeGreaterThanOrEqual(t.dark ? 7 : 4.5);
      // Light words on dark themes: soft ivory, not stark white, and still well past 7:1.
      if (t.dark) expect(luminance(t.text)).toBeGreaterThan(0.85);
      expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('every theme has its block, scoped to its wrapper, for Learn, the lesson screen and Your record', () => {
    const css = learnThemeCss();
    for (const th of THEMES) expect(css).toContain(`[data-theme="${th.key}"] .ls-root,[data-theme="${th.key}"] .le-root,[data-theme="${th.key}"] .rs{`);
    expect(learnTokens(THEMES.find((x) => x.key === 'lovecorner')).dark).toBe(false);
    expect(learnTokens(THEMES.find((x) => x.key === 'night')).dark).toBe(true);
    expect(css).toContain('@media (prefers-contrast: more)');
  });
});

// Darrell 2026-11-26: "We like stark white too... why limitations!?" -- the member chooses the words on dark.
describe('words on dark themes: Soft light or Bright white, the member chooses', () => {
  it('Bright white is offered on every dark theme, reads at 7:1 there, and never on a light theme', () => {
    const css = learnThemeCss();
    for (const th of THEMES) {
      const t = learnTokens(th);
      const rule = `:root[data-dark-ink="white"] [data-theme="${th.key}"]`;
      if (t.dark) {
        expect(css).toContain(rule);
        expect(contrast('#ffffff', t.bg)).toBeGreaterThanOrEqual(7);
        expect(contrast('#ffffff', t.panel)).toBeGreaterThanOrEqual(7);
      } else expect(css).not.toContain(rule);
    }
  });

  it('the choice is saved on the device and applied at once; Soft light is the default', () => {
    const store = new Map();
    const fake = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
    expect(readDarkInk(fake)).toBe('soft');
    expect(setDarkInk('white', fake)).toBe('white');
    expect(readDarkInk(fake)).toBe('white');
    expect(document.documentElement.getAttribute('data-dark-ink')).toBe('white');
    setDarkInk('soft', fake);
    expect(document.documentElement.getAttribute('data-dark-ink')).toBe('soft');
  });
});

