// @vitest-environment node
// =============================================================================
// The Love Corner wears its own red (DR-1060)
// =============================================================================
// Darrell, 2026-10-16: "We want to keep the Love Corner signature colors of red
// and white and some black... however mostly red and white... also... make that
// the default color when it shows initially... and have other options that look
// amazing and meek strength under control... sound and solid... perpetual...
// intimately intuitive engineering... modern and elegant" — and then, with the
// church door on screen: "Make sure you taking care of the Love Corner App".
//
// THE RED WAS MEASURED, NOT PICKED. Nothing in this repository declared a brand
// color for that door (manifest-lovecorner.webmanifest ships the generic
// #1A1815), so the church's own emblem was decoded and its heart sampled:
// #E43C28. The emblem is the brief in one picture — a black ring, a white
// field, a red heart over the cross.
//
// TWO CONSTRAINTS THE PALETTE HAD TO SATISFY, and both are pinned below because
// either one broken makes the theme wrong rather than merely ugly:
//
//   1. #E43C28 CANNOT CARRY TEXT — 4.22:1 on white, 3.98:1 under white. Both
//      fail WCAG AA. So the emblem red is a fill and a mark, and a deeper
//      sibling of the same hue carries every word.
//   2. IT MUST NOT BE THE BLOOD MARKER. DR-0099 reserves true red inside the
//      Scripture color code for the Blood of Jesus, and that palette's crimson
//      is #B01E1E (scripture-highlights.js). A brand red that landed on it
//      would blur the one reservation this platform treats as doctrine.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES, DEFAULT_THEME, CHURCH_DEFAULT_THEME } from '../lib/theme-css.js';
import { HIGHLIGHT_STYLES } from '../lib/scripture-highlights.js';
import { scanContrast, checkContrastDetailed } from '../../../scripts/contrast-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHELL = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
const CSS = readFileSync(join(HERE, '..', 'lib', 'theme-css.js'), 'utf8');

const EMBLEM_RED = '#E43C28';   // sampled from public/lovecorner-icon-512.png
const BRAND_RED = '#C03222';    // the deeper sibling that carries text
const BLOOD = '#B01E1E';        // DR-0099's reserved Scripture crimson

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
const lum = (h) => { const [r, g, b] = rgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgbDist = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));

describe('the red came from the church’s own emblem', () => {
  it('the brand red holds the emblem’s hue, so it is the SAME red, darker', () => {
    const [er, eg, eb] = rgb(EMBLEM_RED);
    const [br, bg, bb] = rgb(BRAND_RED);
    expect(bg / br).toBeCloseTo(eg / er, 1);
    expect(bb / br).toBeCloseTo(eb / er, 1);
    // ...and it really is darker, or it would not carry white.
    expect(lum(BRAND_RED)).toBeLessThan(lum(EMBLEM_RED));
  });

  it('WHY a deeper sibling was needed: the emblem red fails AA both ways', () => {
    // This is the measurement that decided the palette. If it ever stops being
    // true the reasoning in DR-1060 is wrong and should be re-read.
    expect(ratio(EMBLEM_RED, '#FFFFFF')).toBeLessThan(4.5);
    expect(ratio('#FAF8F4', EMBLEM_RED)).toBeLessThan(4.5);
  });

  it('the brand red carries text and white, where the emblem red could not', () => {
    expect(ratio(BRAND_RED, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(ratio(BRAND_RED, '#FFF8F7')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#FAF8F4', BRAND_RED)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('DR-0099: the brand red is not the Blood marker', () => {
  it('the Scripture palette’s crimson is untouched and still means the Blood', () => {
    const crimson = HIGHLIGHT_STYLES.find((h) => h.key === 'crimson');
    expect(crimson, 'the Blood marker is gone from the palette').toBeTruthy();
    expect(crimson.swatch).toBe(BLOOD);
    expect(crimson.label).toMatch(/Blood/i);
  });

  it('no theme can reach the Scripture palette — its hex is not a themed token', () => {
    // The themes remap a fixed set of base literals. The Blood's #B01E1E is not
    // one of them, which is WHY a brand red cannot disturb the color code.
    // COMMENTS STRIPPED: this file's own header NAMES #B01E1E to explain why
    // the brand red stays away from it, and a check that matched its own
    // documentation would be unkeepable — the same self-match that bit
    // unknown-is-not-a-no-guard a day earlier.
    const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
    expect(rules.includes(BLOOD), 'a theme now remaps the Blood marker').toBe(false);
    // ...and prove the stripper did not simply blank the file.
    expect(rules).toContain('data-theme="lovecorner"');
  });

  it('the brand red is visibly apart from the Blood marker', () => {
    // 25.9 in RGB when this was written. A later "tidy-up" that nudged the
    // brand toward #B01E1E would make the church's chrome and the Blood of
    // Jesus the same color, which is the confusion DR-0099 exists to prevent.
    expect(rgbDist(BRAND_RED, BLOOD)).toBeGreaterThan(20);
  });
});

describe('the Love Corner door opens in the Love Corner’s colors', () => {
  it('the church door has its own fallback', () => {
    expect(CHURCH_DEFAULT_THEME).toBe('lovecorner');
    expect(THEMES.some((t) => t.key === 'lovecorner')).toBe(true);
  });

  it('the shell asks for it by the DOOR, not globally', () => {
    // RETARGETED, NOT RELAXED (DR-1153): the TLC door's fallback now rides the
    // same line, so the exact string moved; the guarantee — the church door asks
    // for the church's theme and the family app falls through to DEFAULT_THEME —
    // is what is pinned.
    expect(SHELL).toMatch(/useThemePref\(churchDoorOnly \? CHURCH_DEFAULT_THEME : [^)]*DEFAULT_THEME\)/);
  });

  it('DR-1046 IS NOT OVERTURNED: the family app still opens in Heritage', () => {
    // Heritage is Darrell's own approval, relayed by Christina on 2026-10-15 —
    // one day before this. A sentence about the CHURCH's colors is not a
    // reversal of that, and silently treating it as one would be the worse
    // reading of both.
    expect(DEFAULT_THEME).toBe('heritage');
  });

  it('the church’s palette is in the picker, and every other one stays', () => {
    // Heritage keeps the first slot (DR-1046); the church's rides beside it.
    // The DOOR, not the row order, is what makes it the Love Corner's default.
    expect(THEMES[0].key).toBe('heritage');
    expect(THEMES[1].key).toBe('lovecorner');
    for (const k of ['heritage', 'cream', 'white', 'slate', 'sapphire', 'rose', 'midnight']) {
      expect(THEMES.some((t) => t.key === k), `${k} was dropped from the picker`).toBe(true);
    }
  });
});

describe('the new options are real options, and all of them are legible', () => {
  it('three were added, each with a label that says what it is', () => {
    for (const k of ['lovecorner', 'anchor', 'bedrock']) {
      const t = THEMES.find((x) => x.key === k);
      expect(t, `${k} is not registered`).toBeTruthy();
      expect(t.label.length).toBeGreaterThan(6);
      expect(/^#[0-9A-F]{6}$/i.test(t.color) && /^#[0-9A-F]{6}$/i.test(t.border)).toBe(true);
    }
  });

  it('Anchor and Bedrock are a real CHOICE, not one palette twice', () => {
    const a = THEMES.find((t) => t.key === 'anchor');
    const b = THEMES.find((t) => t.key === 'bedrock');
    expect(rgbDist(a.color, b.color)).toBeGreaterThan(12);
  });

  it('EVERY theme passes the guard’s own math, the new three included', () => {
    const { themes, violations } = scanContrast();
    for (const k of ['lovecorner', 'anchor', 'bedrock']) {
      expect(themes[k], `${k} is not parseable by the contrast guard`).toBeTruthy();
    }
    expect(violations, violations.map((v) => `${v.theme}/${v.what}`).join(', ')).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the emblem red as the fill is REFUSED by the guard', () => {
    // The exact mistake this palette was designed around — using the beautiful
    // emblem red where text has to sit on it. Feed it to the real checker and
    // it must come back with violations naming both surfaces.
    const { themes } = scanContrast();
    const broken = { lovecorner: { ...themes.lovecorner, darkBtnBg: EMBLEM_RED, accentRust: EMBLEM_RED } };
    const { violations } = checkContrastDetailed(broken);
    expect(violations.length, 'the guard accepted a red that fails AA').toBeGreaterThan(0);
    expect(violations.some((v) => v.what === 'light-on-dark button')).toBe(true);
    expect(violations.some((v) => v.what === 'rust accent text')).toBe(true);
    // ...and the real palette, unmutated, is clean.
    expect(checkContrastDetailed({ lovecorner: themes.lovecorner }).violations).toEqual([]);
  });
});
