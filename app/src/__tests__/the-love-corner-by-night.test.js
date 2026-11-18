// =============================================================================
// The Love Corner by night (DR-1483): black into deep red, gold on it, white
// words. Registered beside the cream Love Corner, the door's own fallback,
// dark by declaration, and as fully remapped as Midnight: every class
// Midnight remaps, Night remaps too, so no surface goes dark-on-dark here
// that is readable there. The pairs the record names are measured here.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { THEMES, THEME_CSS, CHURCH_DEFAULT_THEME, DEFAULT_THEME, themeColorFor } from '../lib/theme-css.js';
import { contrastRatio } from '../lib/lovecorner-palette.js';

const N = { page: '#120909', card: '#241617', fill: '#8E2217', ink: '#F6ECE9', muted: '#D8B9B2', gold: '#E4B93E', goldFill: '#CFA63C', black: '#1A1012' };
const rulesOf = (theme) => THEME_CSS.split('\n').filter((l) => l.includes(`[data-theme="${theme}"]`));
// the selector with every theme name blanked, so a multi-selector line compares across themes
const classOf = (line) => ((line.match(/\[data-theme="[a-z]+"\]\s*(.*?)\{/) || [])[1] || '').replace(/\[data-theme="[a-z]+"\]/g, '[T]');

describe('registration', () => {
  it('rides right after the cream Love Corner; Heritage stays first; the door opens by night; the family app does not', () => {
    const keys = THEMES.map((t) => t.key);
    expect(keys[0]).toBe('heritage');
    expect(keys.indexOf('night')).toBe(keys.indexOf('lovecorner') + 1);
    expect(CHURCH_DEFAULT_THEME).toBe('night');
    expect(DEFAULT_THEME).toBe('heritage');
    expect(themeColorFor('night')).toBe(N.page);
  });
  it('says dark, and paints its own form controls', () => {
    expect(THEME_CSS).toMatch(/\[data-theme="night"\]\{--form-surface:#1E1213;--form-ink:#F6ECE9;--form-line:#4F2C2C;--form-hint:#D8B9B2;color-scheme:dark\}/);
  });
});

describe('coverage: as remapped as Midnight', () => {
  it('every class Midnight remaps, Night remaps too', () => {
    const night = new Set(rulesOf('night').map(classOf).filter(Boolean));
    const missing = [...new Set(rulesOf('midnight').map(classOf).filter(Boolean))].filter((c) => !night.has(c));
    expect(missing, `night lacks: ${missing.join(' | ')}`).toEqual([]);
  });
  it('paints the page, the card, the deep-red fill and the dock', () => {
    expect(THEME_CSS).toContain(`[data-theme="night"]{color:${N.ink};background-color:${N.page}}`);
    expect(THEME_CSS).toContain(`[data-theme="night"] .bg-white{background-color:${N.card}!important}`);
    expect(THEME_CSS).toContain(`[data-theme="night"] .bg-\\[\\#1A1815\\]{background-color:${N.fill}!important}`);
    expect(THEME_CSS).toContain('[data-theme="night"] .chrome-dock[data-in-reader="false"]{background-color:#0E0708!important');
  });
});

describe('measured pairs (DR-0076 §4)', () => {
  it('ink and muted read on the page and the card; white reads on the deep-red fill; gold is text on dark and carries ink as a fill', () => {
    const AA = 4.5;
    expect(contrastRatio(N.ink, N.page)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(N.ink, N.card)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(N.muted, N.page)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(N.muted, N.card)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio('#FFFFFF', N.fill)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(N.gold, N.page)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(N.gold, N.card)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(N.black, N.goldFill)).toBeGreaterThanOrEqual(AA);
    // gold never carries white: the fill rule flips its text to ink
    expect(contrastRatio('#FFFFFF', N.goldFill)).toBeLessThan(AA);
    expect(THEME_CSS).toContain('[data-theme="night"] .bg-\\[\\#B85838\\].text-white{color:#1A1815!important}');
  });
});
