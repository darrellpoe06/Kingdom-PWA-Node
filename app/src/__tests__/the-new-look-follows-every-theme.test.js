// DR-1679: Darrell 2026-11-26, "Should fit with any change of the looks based on our options". The new look's
// colors come from each theme's own background and accent, and every pair a reader meets reads (WCAG AA).
import { describe, it, expect } from 'vitest';
import { THEMES } from '../lib/theme-css.js';
import { learnTokens, learnThemeCss, contrast, luminance } from '../lib/learn-theme.js';

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
