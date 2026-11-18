// @vitest-environment node
// =============================================================================
// The Teens skin never paints white words on a white card (DR-0076; Darrell,
// 2026-11-18, from his tablet: the Teens lesson's opening card and its plain
// buttons were white with near-white text). The legibility guard measures
// theme tokens and inline colors per [data-theme]; the Teens skin is a
// hand-written `.tz` cascade in kids-zone.css that it never sees. This gate
// reads that stylesheet: every rule in the Kids Zone that paints a LIGHT
// background and inherits its text color must have a `.tz` override that
// repaints it. Proven to catch: strip one override and the gate names it.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'kids', 'kids-zone.css'), 'utf8');

/** Every rule as { selectors: [...], body } with comments and media blocks flattened. */
export function rulesOf(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{([\s\S]*?)\}\s*\}/g, '$1');
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const selectors = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    out.push({ selectors, body: m[2] });
  }
  return out;
}

/** The relative luminance of a hex color (#rgb or #rrggbb), or null. */
export function luminance(hex) {
  const h = String(hex).replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const ch = (i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}

const LIGHT_VARS = ['--kz-cream', '--kz-butter', '--kz-paper', '--kz-sun', '--lc-white'];

/** True when a declaration block paints a light background (white, a light hex, a light variable, a gradient of them). */
export function paintsLight(body) {
  const bg = body.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/);
  if (!bg) return false;
  const v = bg[1].trim();
  if (/\bwhite\b/.test(v)) return true;
  if (LIGHT_VARS.some((n) => v.includes(`var(${n}`))) return true;
  const hexes = v.match(/#[0-9a-f]{3,6}\b/gi) || [];
  return hexes.some((h) => {
    const l = luminance(h);
    return l !== null && l > 0.5;
  });
}

/**
 * Rules that paint light but hold no words: the progress bar's fill, the page
 * dots, the interim picture frames. Nothing a child reads sits on them, so the
 * Teens skin may leave them light. Named, not guessed.
 */
export const DECORATIVE = Object.freeze(['.kz-bar i', '.kz-dots i', '.kz-interim', '.kz-interim .kz-interim-narrator']);

/** The first class of a selector in the Kids Zone (`.kz-foo`, `.kz-foo.bar`, `.kz-foo i`), or null. */
function classKey(selector) {
  const m = selector.match(/^\.(kz-[\w-]+)/);
  return m ? m[1] : null;
}

/** The Kids Zone classes that paint light with no color of their own, and the ones the Teens skin repaints. */
export function auditNightSkin(css = CSS) {
  const rules = rulesOf(css);
  const light = new Map();
  const repainted = new Set();
  for (const r of rules) {
    for (const sel of r.selectors) {
      if (sel.startsWith('.tz ')) {
        const inner = sel.slice(4).trim();
        const k = classKey(inner);
        if (k && /(?:^|;)\s*(background|background-color|color)\s*:/.test(r.body))
          repainted.add(k + (inner.includes('.') && inner.startsWith(`.${k}.`) ? inner.slice(k.length + 1) : ''));
        if (k) repainted.add(k);
        continue;
      }
      if (sel.startsWith('.tz') || sel.startsWith('.kz ')) continue;
      const k = classKey(sel);
      if (!k) continue;
      if (DECORATIVE.includes(sel)) continue;
      if (paintsLight(r.body) && !/(?:^|;)\s*color\s*:/.test(r.body)) light.set(sel, k);
    }
  }
  const missing = [...light.entries()].filter(([, k]) => !repainted.has(k)).map(([sel]) => sel);
  return { light: [...light.keys()], repainted: [...repainted], missing };
}

describe('the Teens skin repaints every light card of the Kids Zone', () => {
  it('no Kids Zone rule paints a light background without a .tz override', () => {
    const a = auditNightSkin();
    expect(a.light.length).toBeGreaterThan(10);
    expect(a.missing, `light cards with no Teens override: ${a.missing.join(', ')}`).toEqual([]);
  });
  it('PROVEN-TO-CATCH: strip the opening card override and the gate names the card', () => {
    const stripped = CSS.replace(/\n\.tz \.kz-bubble-big\{[^}]*\}/, '\n');
    expect(stripped).not.toBe(CSS);
    expect(auditNightSkin(stripped).missing).toContain('.kz-bubble-big');
    expect(paintsLight('background:#fff;border:1px')).toBe(true);
    expect(paintsLight('background:var(--kz-cream)')).toBe(true);
    expect(paintsLight('background:linear-gradient(180deg,#fff,#FFE9C2)')).toBe(true);
    expect(paintsLight('background:var(--tz-card)')).toBe(false);
    expect(paintsLight('background:#1A1012')).toBe(false);
    expect(luminance('#fff')).toBeCloseTo(1, 5);
  });
});
