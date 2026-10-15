// =============================================================================
// The Heritage redesign, Phase 1: the finish is a theme, the faces are ours
// (DR-1046). Proven-to-catch (DR-0076 §3): each test names the break it fails on.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEME_CSS, THEMES, themeColorFor } from '../lib/theme-css.js';
import { parseThemes, contrastRatio } from '../../../scripts/contrast-guard.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(APP, p), 'utf8');

// The palette as the plan measured it (docs/99-session-notes/2026-10-15-visual-
// redesign-plan-and-inventory.md §3). A drift in theme-css.js fails here.
const H = {
  ivory: '#F6F1E7', paper: '#FFFDF9', ink: '#1A1D1B', muted: '#5E5A52',
  forest: '#1F3A2E', navy: '#1B2A4A', terracotta: '#9E4A2A', healthy: '#2F6B4F',
  goldText: '#8A6510', gold: '#C9A227',
};

describe('the Heritage theme is registered and remaps the base literals', () => {
  it('is the first-run theme of the family app; Cream stays in the picker (DR-0524)', () => {
    const keys = THEMES.map((t) => t.key);
    expect(keys[0]).toBe('heritage');
    expect(keys).toContain('cream');
    expect(themeColorFor('heritage')).toBe(H.ivory);
    expect(themeColorFor('nope')).toBe(H.ivory);
  });

  it('remaps every base literal the other themes remap (a missing one renders cream inside heritage)', () => {
    const block = THEME_CSS.split('THEME: HERITAGE')[1].split('THEME: MIDNIGHT')[0];
    for (const cls of [
      'bg-\\[\\#FAF8F4\\]', 'bg-white', 'bg-\\[\\#E8E4DC\\]', 'border-\\[\\#E8E4DC\\]',
      'border-\\[\\#1A1815\\]', 'text-\\[\\#1A1815\\]', 'text-\\[\\#5A5751\\]',
      'bg-\\[\\#1A1815\\]', 'text-\\[\\#B85838\\]', 'bg-\\[\\#B85838\\]', 'border-\\[\\#B85838\\]',
      'text-\\[\\#5A6E3D\\]', 'bg-\\[\\#5A6E3D\\]', 'text-\\[\\#2A5A8E\\]', 'bg-\\[\\#2A5A8E\\]',
      'poe-selected',
    ]) {
      expect(block, `heritage remaps .${cls}`).toContain(`[data-theme="heritage"] .${cls}`);
    }
    expect(THEME_CSS).toContain('[data-theme="heritage"]{--form-surface:#FFFDF9');
  });

  it('every pairing the plan measured is AA, in the parsed theme (not in a comment)', () => {
    const parsed = parseThemes(THEME_CSS).heritage;
    expect(parsed, 'contrast-guard parses the heritage block').toBeTruthy();
    const pairs = [
      [H.ink, H.ivory], [H.muted, H.ivory], [H.ink, H.paper], [H.muted, H.paper],
      [H.terracotta, H.ivory], [H.terracotta, H.paper], [H.healthy, H.ivory], [H.navy, H.ivory],
      ['#FFFFFF', H.forest], ['#FFFFFF', H.navy], ['#FFFFFF', H.terracotta], [H.ink, H.gold], [H.goldText, H.ivory],
    ];
    for (const [fg, bg] of pairs) {
      expect(contrastRatio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
    // Gold as text on ivory FAILS — which is why it is a fill and a rule only.
    expect(contrastRatio(H.gold, H.ivory)).toBeLessThan(4.5);
    expect(THEME_CSS).not.toMatch(/\[data-theme="heritage"\][^\n]*\{color:#C9A227/i);
  });

  it('never paints true red: the terracotta is not the Blood red (DR-0099)', () => {
    const block = THEME_CSS.split('THEME: HERITAGE')[1].split('THEME: MIDNIGHT')[0];
    expect(block).not.toMatch(/#(?:FF0000|E00000|C8102E|B01E1E|DC2626)/i);
  });

  it('gives every Heritage chrome token a midnight twin before any component uses it', () => {
    const midnight = THEME_CSS.split('THEME: MIDNIGHT')[1];
    for (const hex of [H.ink, H.muted, H.forest, H.navy, H.terracotta, H.healthy, H.goldText]) {
      expect(midnight, `midnight text twin for ${hex}`).toContain(`.text-\\[\\#${hex.slice(1)}\\]`);
    }
    for (const hex of [H.ivory, H.paper, H.forest, H.navy, H.terracotta, H.healthy, H.gold]) {
      expect(midnight, `midnight bg twin for ${hex}`).toContain(`.bg-\\[\\#${hex.slice(1)}\\]`);
    }
  });
});

describe('the house faces ship with the app, inside the CSP', () => {
  it('Fraunces and DM Sans are self-hosted latin woff2 files with their OFL licences beside them', () => {
    for (const f of ['fraunces-latin.woff2', 'fraunces-italic-latin.woff2', 'dm-sans-latin.woff2', 'dm-sans-italic-latin.woff2']) {
      const p = join(APP, 'public', 'fonts', f);
      expect(existsSync(p), f).toBe(true);
      expect(statSync(p).size).toBeGreaterThan(20000);
      const head = readFileSync(p).subarray(0, 4).toString('latin1');
      expect(head, `${f} is woff2`).toBe('wOF2');
    }
    expect(read('public/fonts/OFL-Fraunces.txt')).toMatch(/SIL Open Font License/);
    expect(read('public/fonts/OFL-DM-Sans.txt')).toMatch(/SIL Open Font License/);
  });

  it('index.css declares both faces, roman and italic, as variable weight ranges', () => {
    const css = read('src/index.css');
    expect(css).toContain('font-family: "Fraunces";\n  font-style: normal;\n  font-weight: 300 900;');
    expect(css).toContain('font-family: "Fraunces";\n  font-style: italic;');
    expect(css).toContain('font-family: "DM Sans";\n  font-style: normal;\n  font-weight: 300 700;');
    expect(css).toContain('font-family: "DM Sans";\n  font-style: italic;');
    expect(css).toContain('url(/fonts/fraunces-latin.woff2)');
    expect(css).toContain('url(/fonts/dm-sans-latin.woff2)');
  });

  it('no surface asks Google for a font any more (font-src is self; the link never loaded)', () => {
    const shell = read('src/poe-financial-mvp-v28.jsx');
    expect(shell).not.toMatch(/fonts\.googleapis\.com/);
    expect(read('index.html')).not.toMatch(/fonts\.googleapis\.com/);
    const headers = read('public/_headers');
    expect(headers).toMatch(/font-src 'self' data:/);
  });

  it('the reading highlight has a heritage rule (DR-0424: a theme added later needs its own)', () => {
    const css = read('src/index.css');
    expect(css).toContain('[data-theme="heritage"] ::highlight(poe-read-seg)');
    expect(css).toContain('[data-theme="heritage"] ::highlight(poe-read-word)');
    expect(css).toContain('[data-theme="heritage"] ::highlight(poe-resume-mark)');
  });
});
