// =============================================================================
// The words alone grow — the frame holds at every text size (DR-1011)
// =============================================================================
// Darrell, 2026-10-14, on the Poe Properties door at A44: "The words/text
// need to be the only thing getting bigger... At 44 it doesn't read well."
//
// The large-print control scales the document root; everything in rem rode
// it. Now the FRAME (padding, margins, gaps, radii, the door's discs and
// rules) is written in --ts-fixed, one rem as it is at Normal, so it is
// pixel-identical at Normal and does not move at A44, while every font-size
// still rides the root. Three pins: the Tailwind theme, the shared
// stylesheet's unit, and the welcome door's own CSS. Proven to catch.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';
import { fixedLength, fixedScale, FIXED_UNIT, FRAME_KEYS } from '../../tailwind-fixed-scale.js';
import { WELCOME_CSS } from '../components/PoePropertiesWelcome.jsx';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const INDEX_CSS = readFileSync(join(APP, 'src/index.css'), 'utf8');

describe('the fixed unit', () => {
  it('is one rem as it is at Normal, published on the root, and a plain rem inside a chrome region (zoom already undoes the root there)', () => {
    expect(INDEX_CSS).toMatch(/:root\s*\{\s*--ts-fixed:\s*calc\(1rem \/ var\(--ts-mult, 1\)\);\s*\}/);
    expect(INDEX_CSS).toMatch(/\.ts-chrome-region\s*\{\s*--ts-fixed:\s*1rem;\s*\}/);
  });
  it('fixedLength writes a rem length in the unit and leaves everything else alone', () => {
    expect(fixedLength('1rem')).toBe(`calc(1 * ${FIXED_UNIT})`);
    expect(fixedLength('0.25rem')).toBe(`calc(0.25 * ${FIXED_UNIT})`);
    expect(fixedLength('-0.5rem')).toBe(`calc(-0.5 * ${FIXED_UNIT})`);
    for (const v of ['0px', '1px', 'auto', '9999px', '100%', 'calc(1rem + 2px)']) expect(fixedLength(v)).toBe(v);
  });
});

describe('the Tailwind theme', () => {
  const theme = resolveConfig(tailwindConfig).theme;
  it('writes the frame scales in the fixed unit and keeps the text scales on the root', () => {
    for (const key of ['padding', 'margin', 'gap', 'space']) {
      expect(theme[key]['4'], key).toBe(`calc(1 * ${FIXED_UNIT})`);
      expect(theme[key]['0.5'], key).toBe(`calc(0.125 * ${FIXED_UNIT})`);
      expect(theme[key]['0'], key).toBe('0px');
      expect(theme[key].px, key).toBe('1px');
    }
    expect(theme.margin.auto).toBe('auto');
    expect(theme.borderRadius.lg).toBe(`calc(0.5 * ${FIXED_UNIT})`);
    expect(theme.borderRadius.full).toBe('9999px');
    // The words: font sizes and their line heights still ride the root.
    expect(theme.fontSize.base[0]).toBe('1rem');
    expect(theme.fontSize.sm[0]).toBe('0.875rem');
    // Width and height stay on the root on purpose (a fixed box with growing
    // words would clip them); the DR carries the re-review.
    expect(theme.width['4']).toBe('1rem');
    expect(theme.height['4']).toBe('1rem');
  });
  it('PROVEN-TO-CATCH: the plain spacing scale is what the frame used to ride', () => {
    expect(theme.spacing['4']).toBe('1rem');
    expect(fixedScale({ 4: '1rem' })['4']).not.toBe(theme.spacing['4']);
    expect(FRAME_KEYS).toEqual(['padding', 'margin', 'gap', 'space', 'borderRadius']);
    for (const key of FRAME_KEYS) expect(Object.values(theme[key]).some((v) => String(v).includes('--ts-fixed'))).toBe(true);
  });
});

describe("the welcome door's own CSS", () => {
  const LAYOUT = ['width', 'height', 'min-width', 'min-height', 'max-width', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'gap', 'border-radius', 'top', 'right', 'bottom', 'left', 'grid-template-columns'];
  /** Every `prop:value` in rule bodies (not @media preludes), as [prop, value]. */
  const declarations = (css) => [...css.matchAll(/\{([^{}]*)\}/g)].flatMap((m) => m[1].split(';').filter((d) => d.includes(':')).map((d) => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; }));
  const bareRem = (v) => /(?<![\w.])\d*\.?\d+rem\b(?![^)]*\))/.test(v.replace(/calc\(\s*[\d.]+ \* var\(--ts-fixed,1rem\)\)/g, 'F'));
  it('writes every frame length in the fixed unit and every font size in rem', () => {
    const decls = declarations(WELCOME_CSS);
    const frame = decls.filter(([p]) => LAYOUT.includes(p));
    expect(frame.length).toBeGreaterThan(60);
    const leaks = frame.filter(([, v]) => bareRem(v));
    expect(leaks).toEqual([]);
    expect(decls.some(([p, v]) => p === 'width' && v.includes('--ts-fixed'))).toBe(true);
    // The disc beside the notice, the one in the screenshot: 3.25 fixed rem.
    expect(WELCOME_CSS).toMatch(/\.pp-notice-disc\{[^}]*width:calc\(3\.25 \* var\(--ts-fixed,1rem\)\)/);
    const fonts = decls.filter(([p]) => p === 'font-size');
    expect(fonts.length).toBeGreaterThan(20);
    // The one exception, on purpose: the welcome headline's clamp FLOOR is
    // fixed (2.25rem at Normal), its growing bound is the viewport or 1.4rem,
    // so at A44 on a phone the headline grows and still fits the width
    // (measured: 99px cut at the edge before, 62px after).
    const floorless = fonts.filter(([, v]) => !v.startsWith('clamp(calc(2.25 * var(--ts-fixed,1rem))'));
    expect(fonts.length - floorless.length).toBe(1);
    expect(floorless.every(([, v]) => /rem|em|clamp/.test(v) && !v.includes('--ts-fixed'))).toBe(true);
    expect(WELCOME_CSS).toMatch(/\.pp-h\{[^}]*font-size:clamp\(calc\(2\.25 \* var\(--ts-fixed,1rem\)\),max\(6vw,1\.4rem\),4rem\)/);
  });
  it('PROVEN-TO-CATCH: a frame length written in plain rem is a leak', () => {
    const leaked = WELCOME_CSS.replace('.pp-notice-disc{flex:none;width:calc(3.25 * var(--ts-fixed,1rem))', '.pp-notice-disc{flex:none;width:3.25rem');
    expect(leaked).not.toBe(WELCOME_CSS);
    const leaks = declarations(leaked).filter(([p, v]) => LAYOUT.includes(p) && bareRem(v));
    expect(leaks).toEqual([['width', '3.25rem']]);
  });
});
