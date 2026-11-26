// DR-1679: Darrell 2026-11-26, "Should fit with any change of the looks based on our options". The new look's
// colors come from each theme's own background and accent, and every pair a reader meets reads (WCAG AA).
import { describe, it, expect } from 'vitest';
import { THEMES } from '../lib/theme-css.js';
import { learnTokens, learnThemeCss, contrast } from '../lib/learn-theme.js';

describe('the new look follows every theme, readably', () => {
  for (const th of THEMES) {
    it(`${th.key}: words, dim words, the accent and words on the accent all read`, () => {
      const t = learnTokens(th);
      expect(t.bg).toBe(th.color);
      expect(contrast(t.text, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.text, t.panel)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.dim, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.accent, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('every theme has its block, scoped to its wrapper, for Learn, the lesson screen and Your record', () => {
    const css = learnThemeCss();
    for (const th of THEMES) expect(css).toContain(`[data-theme="${th.key}"] .ls-root,[data-theme="${th.key}"] .le-root,[data-theme="${th.key}"] .rs{`);
    expect(learnTokens(THEMES.find((x) => x.key === 'lovecorner')).dark).toBe(false);
    expect(learnTokens(THEMES.find((x) => x.key === 'night')).dark).toBe(true);
  });
});
