// =============================================================================
// lovecorner-palette — every pair the homepage draws text in clears AA, and
// the two pairs the palette forbids are shown to fail (DR-0076 §3, §4).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { LOVE_CORNER_PALETTE as P, TEXT_PAIRS, contrastRatio } from '../lib/lovecorner-palette.js';

describe('the Love Corner palette is measured', () => {
  it('the formula agrees with the known reference pairs', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBe(21);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBe(1);
  });
  it('every text pair the homepage uses clears WCAG AA (4.5)', () => {
    for (const pair of TEXT_PAIRS) expect(contrastRatio(pair.fg, pair.bg), pair.name).toBeGreaterThanOrEqual(4.5);
  });
  it('PROVEN-TO-CATCH: gold on red, and deep gold on white, fail — which is why the CSS never draws them', () => {
    expect(contrastRatio(P.gold, P.red)).toBeLessThan(4.5);
    expect(contrastRatio('#A8832A', P.white)).toBeLessThan(4.5);
  });
  it("the red is DR-1060's measured red and the gold is the emblem's cross", () => {
    expect(P.red).toBe('#C03222');
    expect(P.heart).toBe('#E43C28');
    expect(P.gold).toBe('#CFA63C');
    expect(P.black).toBe('#1A1012');
  });
});
