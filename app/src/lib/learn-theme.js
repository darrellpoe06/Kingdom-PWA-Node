// =============================================================================
// learn-theme -- the new Learn look follows the theme the member chose (DR-1679)
// =============================================================================
// Darrell 2026-11-26: "Don't look like our new standard and app views..." and
// "Should fit with any change of the looks based on our options". The new look
// (Learn Studio, the Lesson Experience, Your record) was drawn in one fixed
// dark palette, whatever theme was chosen. Every theme already carries its own
// background and accent (THEMES: color, border). This derives the new look's
// tokens from them, so every theme -- and any theme added later -- gets a new
// look in its own colors: the theme's background, its accent where the new look
// used gold, text that reads on that background, and text on an accent button
// chosen for contrast. Pure; the CSS is injected once.
// =============================================================================
import { THEMES } from './theme-css.js';

const hex = (h) => {
  const s = String(h).replace('#', '');
  const v =
    s.length === 3
      ? s
          .split('')
          .map((c) => c + c)
          .join('')
      : s;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};
const toHex = (rgb) =>
  `#${rgb
    .map((n) =>
      Math.round(Math.max(0, Math.min(255, n)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
/** Mix a toward b by t (0..1). */
export const mix = (a, b, t) => toHex(hex(a).map((x, i) => x + (hex(b)[i] - x) * t));
/** WCAG relative luminance. */
export function luminance(h) {
  const [r, g, b] = hex(h).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** WCAG contrast ratio. */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
/** The more readable of near-black and near-white on this color. */
export const inkOn = (bg) => (contrast(bg, '#14100f') >= contrast(bg, '#ffffff') ? '#14100f' : '#ffffff');

/** The new look's tokens for one theme. Dark themes keep the warm night palette's depth. */
export function learnTokens({ color, border }) {
  const dark = luminance(color) < 0.18;
  const bg = color;
  // LOW LIGHT READS FIRST (Darrell 2026-11-26: "Make sure that accessibility and backgrounds work well with
  // white words for low light"). Dark themes carry light words and a bright second tone; every word on
  // every theme reaches 7:1 (WCAG AAA) on its background and its panels, gated in the test.
  // Light, not stark (Darrell: "Lighter text is good.. not just white"): a soft ivory warmed by the theme's own accent.
  const text = dark ? mix('#fbf7f1', border, 0.05) : '#1a1815';
  const panel = dark ? mix(bg, '#ffffff', 0.06) : mix(bg, border, 0.06);
  const line = dark ? mix(bg, '#ffffff', 0.16) : mix(bg, border, 0.22);
  const dim = dark ? '#dcd6d1' : mix(text, bg, 0.2);
  // The accent as text must read on the background: 7:1 on dark (low light), 4.5:1 on light.
  const want = dark ? 7 : 4.5;
  let accent = border;
  for (let i = 0; i < 16 && Math.min(contrast(accent, bg), contrast(accent, panel)) < want; i += 1) accent = mix(accent, dark ? '#ffffff' : '#000000', 0.15);
  return { dark, bg, panel, line, text, dim, accent, onAccent: inkOn(accent) };
}

const block = (sel, t) =>
  `${sel}{--ls-bg:${t.bg};--ls-panel:${t.panel};--ls-line:${t.line};--ls-text:${t.text};--ls-dim:${t.dim};--ls-gold:${t.accent};--ls-on-gold:${t.onAccent};--le-bg:${t.bg};--le-panel:${t.panel};--le-line:${t.line};--le-text:${t.text};--le-dim:${t.dim};--le-gold:${t.accent};--le-on-gold:${t.onAccent};--rs-bg:${t.panel};--rs-line:${t.line};--rs-ink:${t.text};--rs-dim:${t.dim};--rs-gold:${t.accent};--rs-on-gold:${t.onAccent}}`;

// A phone set to ask for more contrast gets its second tone at full strength.
const MORE_CONTRAST = '@media (prefers-contrast: more){.ls-root,.le-root,.rs{--ls-dim:var(--ls-text);--le-dim:var(--le-text);--rs-dim:var(--rs-ink)}}';

/** The CSS: one block per theme, scoped to the theme wrapper. The night palette stays the default. */
export function learnThemeCss(themes = THEMES) {
  return `${themes
    .map((th) => {
      const t = learnTokens(th);
      const scope = `[data-theme="${th.key}"]`;
      return [block(`${scope} .ls-root,${scope} .le-root,${scope} .rs`, t), t.dark ? '' : `${scope} .le-root{background:var(--le-bg)}`].join('');
    })
    .join('\n')}\n${MORE_CONTRAST}`;
}

let injected = false;
/** Inject once into <head>. Safe to call from any module; no-op without a document. */
export function ensureLearnTheme(doc = typeof document !== 'undefined' ? document : null) {
  if (injected || !doc || !doc.head) return;
  injected = true;
  const el = doc.createElement('style');
  el.setAttribute('data-learn-theme', '');
  el.textContent = learnThemeCss();
  doc.head.appendChild(el);
}
