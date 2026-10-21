// @vitest-environment node
// =============================================================================
// The TLC door wears its own ivory & forest (DR-1153)
// =============================================================================
// Darrell, 2026-10-21, with the reference on screen: "warm ivory and cream
// backgrounds, deep forest green for primary buttons and navigation, soft sage
// green accents, warm beige and taupe, subtle champagne and muted gold accents,
// dark charcoal for primary text... calming without appearing overly feminine...
// trustworthy and appropriate for a professional therapy practice" — and the
// one rule above every other: "DO NOT DELETE, REMOVE, REPLACE, OR DISABLE ANY
// EXISTING FEATURES."
//
// So the redesign is a THEME plus a SHAPE, never a rebuild: the `tlc` palette
// remaps the house literals every TLC screen already uses (the same mechanism
// as Heritage and the Love Corner), and the design-system strings in
// lib/tlc-ui.js carry only those literals, so Midnight, Big Print and every
// other palette keep working on every TLC screen. The pairings below were
// measured with the guard's own math before the CSS was written.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES, DEFAULT_THEME, CHURCH_DEFAULT_THEME, TLC_DEFAULT_THEME } from '../lib/theme-css.js';
import * as UI from '../lib/tlc-ui.js';
import { scanContrast, checkContrastDetailed, contrastRatio } from '../../../scripts/contrast-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, '..', f), 'utf8');
const DOOR = read('components/TlcPublicDoor.jsx');
const CSS = read('lib/theme-css.js');

const IVORY = '#F4F2ED';
const CARD = '#FFFFFF';
const INK = '#2A2B27';
const MUTED = '#5F635B';
const FOREST = '#2E4A3C';
const ACCENT = '#2F5D4A';
const SAGE = '#3F6B50';
const GOLD = '#C7B27A';
const GOLD_TEXT = '#7A6230';

describe('the palette is the reference, measured', () => {
  it('ink and muted text clear AA on the ivory field, the white card and the sage tray', () => {
    for (const bg of [IVORY, CARD, '#E6EBE3']) {
      expect(contrastRatio(INK, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(MUTED, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the forest carries white (the primary button) and reads as an accent on paper', () => {
    expect(contrastRatio(CARD, FOREST)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(IVORY, FOREST)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(ACCENT, IVORY)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(ACCENT, CARD)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(SAGE, IVORY)).toBeGreaterThanOrEqual(4.5);
  });

  it('WHY champagne is a rule and a fill, never text on paper', () => {
    // The measurement that decided it. If it ever stops being true the
    // reasoning in DR-1153 is wrong and should be re-read.
    expect(contrastRatio(GOLD, IVORY)).toBeLessThan(4.5);
    expect(contrastRatio(GOLD, CARD)).toBeLessThan(4.5);
    // ...so its text form is a deep gold, and ink reads on the gold fill.
    expect(contrastRatio(GOLD_TEXT, IVORY)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(INK, GOLD)).toBeGreaterThanOrEqual(4.5);
  });

  it('the theme CSS carries exactly these values, not a near miss', () => {
    const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const hex of [IVORY, INK, MUTED, FOREST, ACCENT, SAGE, GOLD, GOLD_TEXT]) {
      expect(rules.includes(`[data-theme="tlc"]`) && rules.includes(hex), `${hex} is not in the tlc theme`).toBe(true);
    }
    // the champagne is never a text color in the theme
    // `color:` alone — a border-color or a background-color of champagne is the
    // rule / fill the palette intends.
    expect(rules).not.toMatch(new RegExp(`\\[data-theme="tlc"\\][^\\n]*(?<![a-z-])color:${GOLD}`));
  });
});

describe('the TLC door opens in TLC’s colors, and no other door moved', () => {
  it('the door has its own fallback, registered in the picker', () => {
    expect(TLC_DEFAULT_THEME).toBe('tlc');
    expect(THEMES.some((t) => t.key === 'tlc')).toBe(true);
    expect(DOOR).toContain('useThemePref(TLC_DEFAULT_THEME)');
    // ...and the shell, whose hook paints the bars last, asks for it by the DOOR too.
    expect(read('poe-financial-mvp-v28.jsx')).toContain('tlcDoorOnly ? TLC_DEFAULT_THEME : DEFAULT_THEME');
  });

  it('DR-1046 and DR-1060 stand: the family app opens in Heritage, the church in its red', () => {
    expect(DEFAULT_THEME).toBe('heritage');
    expect(CHURCH_DEFAULT_THEME).toBe('lovecorner');
    expect(THEMES[0].key).toBe('heritage');
    expect(THEMES[1].key).toBe('lovecorner');
    expect(THEMES[2].key).toBe('tlc');
  });

  it('the theme paints the phone’s bars; the door no longer writes a fixed ink over them (DR-0744)', () => {
    expect(DOOR).not.toMatch(/themeMeta\.setAttribute\('content', '#1A1815'\)/);
  });

  it('EVERY theme passes the guard’s own math, the TLC palette included', () => {
    const { themes, violations } = scanContrast();
    expect(themes.tlc, 'tlc is not parseable by the contrast guard').toBeTruthy();
    expect(violations, violations.map((v) => `${v.theme}/${v.what}`).join(', ')).toEqual([]);
  });

  it('PROVEN-TO-CATCH: champagne as the accent TEXT is refused by the guard', () => {
    const { themes } = scanContrast();
    const broken = { tlc: { ...themes.tlc, accentRust: GOLD } };
    const { violations } = checkContrastDetailed(broken);
    expect(violations.some((v) => v.what === 'rust accent text')).toBe(true);
    expect(checkContrastDetailed({ tlc: themes.tlc }).violations).toEqual([]);
  });
});

describe('one vocabulary, every TLC screen (nothing a guard does not already measure)', () => {
  const HOUSE = new Set(['#1a1815', '#b85838', '#e8e4dc', '#5a5751']);

  it('the design-system strings use only the house literals the themes remap', () => {
    const src = read('lib/tlc-ui.js').replace(/\/\/[^\n]*/g, '');
    const hexes = [...new Set((src.match(/#[0-9A-Fa-f]{6}/g) || []).map((h) => h.toLowerCase()))];
    expect(hexes.length).toBeGreaterThan(0);
    for (const h of hexes) expect(HOUSE.has(h), `${h} is a new literal with no theme remap`).toBe(true);
  });

  it('every primitive is a non-empty class string and the pills are round', () => {
    for (const [k, v] of Object.entries(UI)) {
      expect(typeof v, k).toBe('string');
      expect(v.length, k).toBeGreaterThan(8);
    }
    for (const k of ['TLC_BTN_PRIMARY', 'TLC_BTN_SECONDARY', 'TLC_BTN', 'TLC_BTN_SMALL', 'TLC_PORTRAIT', 'TLC_CHIP']) expect(UI[k]).toContain('rounded-full');
    for (const k of ['TLC_CARD', 'TLC_CARD_STRONG']) expect(UI[k]).toContain('rounded-2xl');
  });

  it('PROVEN-TO-CATCH: no TLC office screen keeps a private copy of the field or the button', () => {
    // Before DR-1153 seven files each carried their own INPUT/BTN string. A
    // copy that comes back is one screen drifting from the rest.
    const dir = join(HERE, '..', 'components');
    const tlcFiles = readdirSync(dir).filter((f) => /^Tlc.*\.jsx$/.test(f));
    expect(tlcFiles.length).toBeGreaterThan(10);
    for (const f of tlcFiles) {
      const src = readFileSync(join(dir, f), 'utf8');
      expect(src, `${f} redeclares its own INPUT`).not.toMatch(/^(export )?const INPUT = '/m);
      expect(src, `${f} redeclares its own BTN`).not.toMatch(/^const BTN = '/m);
    }
  });

  it('the door draws the clinical team as round portraits on rounded cards, from the design system', () => {
    expect(DOOR).toContain('TLC_PORTRAIT');
    expect(DOOR).toContain('TLC_CARD');
    expect(DOOR).toContain('TLC_BTN_PRIMARY');
    // and the public facts still come from the one source, never restated
    expect(DOOR).toContain("from '../lib/tlc-practice.js'");
  });
});
