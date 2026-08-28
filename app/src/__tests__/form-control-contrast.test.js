// =============================================================================
// Every theme paints its form controls — the dark-box bug, gated
// =============================================================================
// THE INCIDENT (Darrell, screenshot 2026-08-28, rose theme). The Properties
// edit form rendered NAME, ADDRESS, UNIT, CITY and STATE as dark charcoal
// boxes with dark text. Unreadable, and nothing in the component was wrong:
// index.css declared `color-scheme: light dark`, so a dark-mode phone gave
// every UNSTYLED control the browser's DARK user-agent background while the
// app's dark ink was inherited on top.
//
// MIDNIGHT was the only theme that had ever painted inputs. Cream, white,
// slate, sapphire and rose painted none — five themes broken the same way, on
// the same phone, for the same reason.
//
// WHY THE EXISTING GUARDS MISSED IT. contrast-guard and legibility-guard both
// scan for COLOR TOKENS in class strings (`bg-[#…]`, `text-[#…]`) and check the
// pairs they find. A control whose class names no colour at all presents them
// with nothing to check, so it reads as clean — the absence was invisible to a
// scanner built to inspect presence. 27 controls across the app are in exactly
// that state, and would each have been a bug on somebody's phone.
//
// These properties are about the THEME LAYER rather than the components, which
// is where the fix belongs: an unstyled control must be safe by default, so
// that the 28th one written is safe without anybody remembering this.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { THEME_CSS, THEMES } from '../lib/theme-css.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const indexCss = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');

// The declared themes, plus the no-attribute default the registry calls 'cream'
// and CSS reaches through :root.
const themeBlock = (key) => {
  const sel = key === 'cream' ? ':root{' : `[data-theme="${key}"]{`;
  const i = THEME_CSS.indexOf(sel);
  if (i === -1) return '';
  return THEME_CSS.slice(i, THEME_CSS.indexOf('}', i) + 1);
};

describe('the page never asks the browser to guess a form palette', () => {
  it('index.css no longer declares the both-ways color-scheme that caused it', () => {
    // `light dark` is what handed the UA a dark palette on a dark-mode phone.
    // Some value must still be declared — that is the Android Force Dark
    // opt-out — so this asserts the fix, not the removal.
    expect(indexCss).toMatch(/color-scheme:\s*light\s*;/);
    expect(indexCss).not.toMatch(/color-scheme:\s*light dark/);
  });

  it('every theme states which palette it is', () => {
    for (const t of THEMES) {
      expect(themeBlock(t.key), `${t.key} declares no color-scheme`)
        .toMatch(/color-scheme:\s*(light|dark)/);
    }
  });

  it('midnight says dark and every light theme says light', () => {
    expect(themeBlock('midnight')).toMatch(/color-scheme:\s*dark/);
    for (const t of THEMES.filter((x) => x.key !== 'midnight')) {
      expect(themeBlock(t.key), t.key).toMatch(/color-scheme:\s*light/);
    }
  });
});

describe('every theme paints form controls rather than inheriting a guess', () => {
  it('defines all four form tokens, in every theme', () => {
    for (const t of THEMES) {
      const block = themeBlock(t.key);
      for (const token of ['--form-surface', '--form-ink', '--form-line', '--form-hint']) {
        expect(block, `${t.key} is missing ${token}`).toContain(token);
      }
    }
  });

  it('actually applies those tokens to input, select and textarea', () => {
    // The variables are worth nothing if no rule consumes them.
    expect(THEME_CSS).toMatch(/background-color:var\(--form-surface\)/);
    expect(THEME_CSS).toMatch(/color:var\(--form-ink\)/);
    const rule = THEME_CSS.slice(THEME_CSS.indexOf('input:not(['));
    expect(rule).toContain('select');
    expect(rule).toContain('textarea');
  });

  it('leaves the controls whose native look a background would break', () => {
    // A painted background is what ruins a checkbox, a radio, a range slider
    // (BooksAccounts.jsx:223 styles one), a colour swatch and a file picker.
    const rule = THEME_CSS.slice(
      THEME_CSS.indexOf('input:not(['),
      THEME_CSS.indexOf('input::placeholder'),
    );
    for (const type of ['checkbox', 'radio', 'range', 'file', 'color']) {
      expect(rule, `${type} inputs would be painted`).toContain(`:not([type="${type}"])`);
    }
  });

  it('uses a BARE element selector so an explicit class still wins', () => {
    // THE SPECIFICITY POINT, and the reason this is not written as
    // `[data-theme="rose"] input { … }`: that scores (0,1,1) and would beat a
    // plain `bg-white` utility (0,1,0), silently overriding every control that
    // DOES choose its own colour. The default must be a floor, never a ceiling.
    //
    // The selector is read from the START OF ITS RULE, not from the word
    // `input`. A first draft of this test sliced at indexOf('input:not([') and
    // so began AFTER any prefix — it passed happily when the rule was mutated
    // to `[data-theme] input:not([…])`, which is the exact regression it
    // exists to catch.
    const body = THEME_CSS.indexOf('background-color:var(--form-surface)');
    expect(body).toBeGreaterThan(-1);
    const open = THEME_CSS.lastIndexOf('{', body);
    const ruleStart = Math.max(
      THEME_CSS.lastIndexOf('}', open),
      THEME_CSS.lastIndexOf('*/', open),
    ) + 1;
    const head = THEME_CSS.slice(ruleStart, open);
    expect(head).toContain('input:not([type="checkbox"])');
    expect(head, `selector is not bare: ${head.trim()}`).not.toMatch(/\[data-theme/);
    expect(head, `selector carries a class: ${head.trim()}`).not.toMatch(/\.[a-zA-Z]/);
    expect(head).not.toMatch(/#[a-zA-Z]/);     // nor an id
  });
});

describe('the tokens themselves are legible where they are used', () => {
  const rel = (hex) => {
    const v = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [rel(a), rel(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const tok = (key, name) => (themeBlock(key).match(new RegExp(`${name}:(#[0-9A-Fa-f]{6})`)) || [])[1];

  it('typed text clears WCAG AA against the field it is typed into', () => {
    // MEASURED, not asserted (DR-0076 §4). This is the number the screenshot
    // failed: dark ink on a dark UA box was close to 1:1.
    for (const t of THEMES) {
      const surface = tok(t.key, '--form-surface');
      const ink = tok(t.key, '--form-ink');
      expect(surface, `${t.key} --form-surface`).toBeTruthy();
      expect(ink, `${t.key} --form-ink`).toBeTruthy();
      const r = ratio(surface, ink);
      expect(r, `${t.key}: ink ${ink} on ${surface} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('placeholder text clears AA too, rather than only looking softer', () => {
    for (const t of THEMES) {
      const surface = tok(t.key, '--form-surface');
      const hint = tok(t.key, '--form-hint');
      const r = ratio(surface, hint);
      expect(r, `${t.key}: hint ${hint} on ${surface} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the field is distinguishable from the page behind it', () => {
    // A field the same colour as the page is a different failure from an
    // illegible one, and just as real: nothing shows you where to type.
    for (const t of THEMES) {
      const surface = tok(t.key, '--form-surface');
      const line = tok(t.key, '--form-line');
      const r = ratio(surface, line);
      expect(r, `${t.key}: border ${line} on ${surface} is ${r.toFixed(2)}:1`).toBeGreaterThan(1.15);
    }
  });
});
