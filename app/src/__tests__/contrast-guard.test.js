// @vitest-environment node
//
// Per-theme contrast gate (DR-0076, the Verification Doctrine's first gate). A
// code comment once CLAIMED "all combinations exceed WCAG 2.1 AA" while the real
// ratio was 2.92:1 — a claim is not a check. This runs the guard inside the
// required `app — lint + vitest` so a theme that fails AA fails the build. Logic
// lives in scripts/contrast-guard.mjs (also a CLI).
import { describe, it, expect } from 'vitest';
import { parseThemes, checkContrast, contrastRatio, scanContrast } from '../../../scripts/contrast-guard.mjs';

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
