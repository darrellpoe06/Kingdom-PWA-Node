// @vitest-environment node
//
// Per-theme contrast gate (DR-0076, the Verification Doctrine's first gate). A
// code comment once CLAIMED "all combinations exceed WCAG 2.1 AA" while the real
// ratio was 2.92:1 — a claim is not a check. This runs the guard inside the
// required `app — lint + vitest` so a theme that fails AA fails the build. Logic
// lives in scripts/contrast-guard.mjs (also a CLI).
import { describe, it, expect } from 'vitest';
import {
  parseThemes, checkContrast, checkContrastDetailed, contrastRatio, scanContrast,
  scanInline, scanInlineStyleColors, scanInlineThemeableColors,
} from '../../../scripts/contrast-guard.mjs';

describe('contrast math (WCAG 2.1)', () => {
  it('black on white is 21:1, white on white is 1:1', () => {
    expect(Math.round(contrastRatio('#000000', '#FFFFFF'))).toBe(21);
    expect(Math.round(contrastRatio('#FFFFFF', '#FFFFFF'))).toBe(1);
  });
});

describe('contrast guard — every theme meets AA', () => {
  it('the parser actually sees the themes (not vacuously empty)', () => {
    const { themes } = scanContrast();
    expect(Object.keys(themes).length).toBeGreaterThan(3);
  });

  it('no theme drops below AA for body text on its surfaces or light text on dark buttons', () => {
    const { violations } = scanContrast();
    const msg = violations.map(v => `[${v.theme}] ${v.what}: ${v.fg} on ${v.bg} = ${v.ratio ?? v.error}`).join('; ');
    expect(violations, msg).toEqual([]);
  });

  // Anti-theater (DR-0060/DR-0076): proven to CATCH the break. Inject the exact
  // regression class — secondary text remapped to a too-light grey on a light
  // base — and confirm the guard flags it.
  it('CATCHES a too-light secondary-text remap (the 2026-06-15 bug class)', () => {
    const bad = `
[data-theme="white"]{background-color:#F2F2F7}
[data-theme="white"] .bg-\\[\\#FAF8F4\\]{background-color:#F2F2F7!important}
[data-theme="white"] .text-\\[\\#1A1815\\]{color:#1D1D1F!important}
[data-theme="white"] .text-\\[\\#5A5751\\]{color:#8E8E93!important}
`;
    const violations = checkContrast(parseThemes(bad));
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some(v => v.what === 'secondary text' && v.ratio < 4.5)).toBe(true);
  });

  it('PASSES the fixed remap (so the guard is not just always-failing)', () => {
    const good = `
[data-theme="white"]{background-color:#F2F2F7}
[data-theme="white"] .bg-\\[\\#FAF8F4\\]{background-color:#F2F2F7!important}
[data-theme="white"] .text-\\[\\#1A1815\\]{color:#1D1D1F!important}
[data-theme="white"] .text-\\[\\#5A5751\\]{color:#636366!important}
`;
    expect(checkContrast(parseThemes(good))).toEqual([]);
  });
});

// The dark-mode blind spot (2026-06-17): accents were never checked, so the
// blue #2A5A8E with NO midnight remap (2.84:1 on black) passed green. These pin
// that the guard now covers accents per-theme, INCLUDING midnight.
describe('contrast guard — accents per-theme, including midnight', () => {
  const MIDNIGHT_NO_BLUE = `
[data-theme="midnight"]{background-color:#000000;color:#E5E5E5}
[data-theme="midnight"] .bg-white{background-color:#141414!important}
[data-theme="midnight"] .text-\\[\\#1A1815\\]{color:#E5E5E5!important}
[data-theme="midnight"] .text-\\[\\#5A5751\\]{color:#888888!important}
[data-theme="midnight"] .text-\\[\\#5A6E3D\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#B85838\\]{color:#FB923C!important}
`;
  // Same, but WITH the blue remap this PR adds.
  const MIDNIGHT_FIXED = MIDNIGHT_NO_BLUE + '[data-theme="midnight"] .text-\\[\\#2A5A8E\\]{color:#7FB3F0!important}\n';

  it('CATCHES a dark accent with no midnight remap (black-on-dark, the reported bug)', () => {
    const violations = checkContrast(parseThemes(MIDNIGHT_NO_BLUE));
    expect(violations.some(v => v.theme === 'midnight' && v.what === 'blue accent text' && v.ratio < 4.5)).toBe(true);
  });

  it('PASSES once the blue accent is remapped for midnight (#7FB3F0)', () => {
    const violations = checkContrast(parseThemes(MIDNIGHT_FIXED));
    expect(violations.some(v => v.theme === 'midnight' && v.what === 'blue accent text')).toBe(false);
  });

  it('the LIVE monolith has the blue midnight remap (no dark-on-dark accent)', () => {
    const { violations } = scanContrast();
    expect(violations.filter(v => v.what.includes('accent'))).toEqual([]);
  });

  it('the rust-on-light-base sub-AA is allowlisted as a dated warning, not a hard fail', () => {
    const { warnings } = checkContrastDetailed(scanContrast().themes);
    // It is surfaced (documented), but never blocks the build.
    expect(warnings.some(w => w.what === 'rust accent text')).toBe(true);
    expect(scanContrast().violations.some(v => v.what === 'rust accent text')).toBe(false);
  });
});

// The inline-color scanner: a hardcoded inline color bypasses the per-theme
// remap, so it is the exact mechanism of the dark-on-dark bug. Proven to CATCH.
describe('contrast guard — inline-color scanner', () => {
  it('CATCHES an inline dark text color (the un-themeable bug mechanism)', () => {
    expect(scanInlineStyleColors(`<div style={{ color: '#1A1815' }}>x</div>`).length).toBe(1);
    expect(scanInlineStyleColors(`<div style={{ color: '#5A5751', fontFamily: 'x' }}>x</div>`).length).toBe(1);
  });

  it('CATCHES an inline white background (light-on-light in midnight)', () => {
    expect(scanInlineStyleColors(`<li style={{ backgroundColor: 'white' }}/>`).length).toBe(1);
  });

  it('does NOT flag a light inline color (readable on the dark surface) or a fontFamily-only style', () => {
    expect(scanInlineStyleColors(`<div style={{ color: '#FAF8F4' }}>x</div>`).length).toBe(0);
    expect(scanInlineStyleColors(`<div style={{ fontFamily: '"Fraunces", serif' }}>x</div>`).length).toBe(0);
  });

  it('does NOT mistake a DATA-object color field for an inline style', () => {
    // STATUS/READY_META carry `color: '#5A6E3D'` as data — not a style block.
    expect(scanInlineStyleColors(`const STATUS = { shipped: { color: '#5A6E3D' } };`).length).toBe(0);
  });

  it('STRICT guarded scan also catches a DYNAMIC inline color (ternary/function)', () => {
    expect(scanInlineThemeableColors(`<div style={{ color: cond ? '#FAF8F4' : '#1A1815' }}/>`).length).toBe(1);
    expect(scanInlineThemeableColors(`<div style={{ borderColor: st.color }}/>`).length).toBe(1);
    expect(scanInlineThemeableColors(`<div style={{ fontFamily: 'x' }}/>`).length).toBe(0);
  });

  it('the two guarded cockpit files carry NO un-themeable inline colors (live)', () => {
    const { fails } = scanInline();
    const msg = fails.map(f => `${f.file}:${f.line} ${f.what}`).join('; ');
    expect(fails, msg).toEqual([]);
  });
});
