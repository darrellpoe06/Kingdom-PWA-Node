// @vitest-environment node
// =============================================================================
// The storybook's small words are readable (DR-0076; measured on the
// 2026-11-18 J2 phone walk: "PAGE 4 OF 8" and "READ-ALONG" were bright orange
// on white at 2.61:1, below the 4.5:1 a child's eyes need for small text).
// This gate reads the stylesheet, resolves the label's color token, and holds
// the contrast on the white book card and on the Teens night card at 4.5:1 or
// better. Proven to catch: the old token fails it.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { luminance } from './kids-night-skin-legibility.test.js';

const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'kids', 'kids-zone.css'), 'utf8');

/** The value of a custom property as the stylesheet declares it (first declaration wins). */
function token(name, css = CSS) {
  const m = css.match(new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:\\s*(#[0-9a-fA-F]{3,6})`));
  return m ? m[1] : null;
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
/** The color the `.kz-book .kz-pn` rule paints, resolved through var(). */
function labelColor(css = CSS) {
  const rule = css.match(/\.kz-book \.kz-pn\{([^}]*)\}/);
  const c = rule && rule[1].match(/color\s*:\s*([^;]+)/);
  if (!c) return null;
  const v = c[1].trim();
  const asVar = v.match(/var\((--[\w-]+)\)/);
  return asVar ? token(asVar[1], css) : v;
}

describe('the storybook page label is readable', () => {
  it('on the white book card the label reads at 4.5:1 or better', () => {
    const color = labelColor();
    expect(color, 'the page label has a resolvable color').toBeTruthy();
    expect(contrast(color, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
  it('on the Teens night card the label reads at 4.5:1 or better', () => {
    const night = CSS.match(/\.tz \.kz-pn\{[^}]*color\s*:\s*([^;}]+)/);
    const card = token('--tz-card');
    expect(night, 'the night skin repaints the label').toBeTruthy();
    const v = night[1].trim();
    const color = (v.match(/var\((--[\w-]+)\)/) || [])[1] ? token(v.match(/var\((--[\w-]+)\)/)[1]) : v;
    expect(card).toBeTruthy();
    expect(contrast(color, card)).toBeGreaterThanOrEqual(4.5);
  });
  it('PROVEN-TO-CATCH: the old bright orange fails on white', () => {
    expect(contrast('#FF7A00', '#ffffff')).toBeLessThan(3);
    expect(contrast(token('--kz-orange-ink'), '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
});
