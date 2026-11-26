// =============================================================================
// The classic Learn tools, in the new look's colors (Darrell 2026-11-26).
// =============================================================================
// "What happened to the green section or the things that is like the full all
// the courses looking like the old system? When is that update coming?"
//
// The new-look Learn carries every classic Learn function in one panel (DR-1662,
// "Every Learn Tool"). Those tools are written in the classic page's palette as
// Tailwind color classes -- cream paper #FAF8F4, ink #1A1815, the green #5A6E3D --
// so inside the dark Learn Studio they read as a pasted-in light page.
//
// This module is the ONE mapping from each classic color class to the new look's
// role for it. scripts/learn-classic-skin.mjs writes learn-classic-skin.css from
// it; the stylesheet applies only under .ls-classic-skin, which only the new
// look's tools panel carries -- the classic page (learnStudio=0, the fail-safe)
// is untouched. The gate (learn-classic-skin.test.js) scans every source the
// classic Learn renders and fails when a color class has no rule, so a new
// classic tool cannot arrive in the new look still wearing cream and green.
//
// Red: true red stays reserved for the Blood (DR-0099). The classic accent
// #B85838 (terracotta) and #7A1F1F become a light coral, never red; the one red
// class in these sources (#A3141C, the new look's own Watch door) is kept as is.
// =============================================================================

/** The new look's roles (learn-studio.css tokens; contrast measured on --sk-panel). */
export const SKIN_VARS = Object.freeze({
  '--sk-panel': '#1a1416', // --ls-panel
  '--sk-panel-2': '#241c1f', // a hover / an alternate row
  '--sk-ink': '#f6f2ee', // --ls-text
  '--sk-dim': '#c9c0ba', // secondary words
  '--sk-gold': '#f2bf2e', // --ls-gold: fills
  '--sk-gold-ink': '#e9c766', // gold words and outlines on the dark
  '--sk-gold-line': '#7c6431', // gold borders
  '--sk-warm': '#f0a07a', // the classic terracotta, as a light coral (not red, DR-0099)
  '--sk-blue': '#9cc3ef', // the classic link blue, light enough for the dark
  '--sk-line': '#4a3e41', // hairlines
  '--sk-on-fill': '#0f0b0d', // --ls-bg: words on a gold or light fill
});

/** Every classic color, by role. A color here with no role fails the gate. */
const COLOR = {
  '#FFFFFF': 'paper',
  white: 'paper',
  '#FAF8F4': 'paper',
  '#F0ECE4': 'paper',
  '#F6F1E7': 'paper',
  '#E8E4DC': 'rule',
  '#C9BFA8': 'rule',
  '#CFC9BD': 'rule',
  '#C9C2B6': 'rule',
  '#B8B4AC': 'rule',
  '#1A1815': 'ink',
  black: 'ink',
  '#2E2B26': 'ink',
  '#0F1A14': 'ink',
  '#3a352f': 'ink-hover',
  '#5A5751': 'dim',
  '#8A857D': 'dim',
  '#8A857C': 'dim',
  '#8A857B': 'dim',
  '#5A6E3D': 'green',
  '#4a5a31': 'green',
  '#4A5D30': 'green',
  '#3F5226': 'green',
  '#2F5D50': 'green',
  '#C9A227': 'green',
  '#1F3A2E': 'green',
  '#B85838': 'warm',
  '#7A1F1F': 'warm',
  '#B45309': 'warm',
  '#2A5A8E': 'blue',
  '#A3141C': 'keep', // the new look's own red door button; never recolored
};

const norm = (c) => (c.startsWith('#') ? c.toUpperCase().replace(/^#([0-9A-F]{6})$/, '#$1') : c);
const COLOR_N = Object.fromEntries(Object.entries(COLOR).map(([k, v]) => [norm(k), v]));

/** The role for a classic color ('#1a1815', 'white'...), or null when it has none. */
export function roleOf(color) {
  return COLOR_N[norm(color)] || null;
}

// What each role becomes, per utility. `fill` = a solid background whose words must flip dark.
const BG = {
  paper: 'var(--sk-panel)',
  rule: 'var(--sk-line)',
  ink: 'var(--sk-ink)',
  'ink-hover': 'var(--sk-dim)',
  dim: 'var(--sk-line)',
  green: 'var(--sk-gold)',
  warm: 'var(--sk-warm)',
  blue: 'var(--sk-blue)',
};
const FILL = new Set(['ink', 'ink-hover', 'green', 'warm', 'blue']);
const TEXT = {
  paper: 'var(--sk-ink)',
  rule: 'var(--sk-dim)',
  ink: 'var(--sk-ink)',
  'ink-hover': 'var(--sk-ink)',
  dim: 'var(--sk-dim)',
  green: 'var(--sk-gold-ink)',
  warm: 'var(--sk-warm)',
  blue: 'var(--sk-blue)',
};
const LINE = {
  paper: 'var(--sk-line)',
  rule: 'var(--sk-line)',
  ink: 'var(--sk-dim)',
  'ink-hover': 'var(--sk-dim)',
  dim: 'var(--sk-line)',
  green: 'var(--sk-gold-line)',
  warm: 'var(--sk-warm)',
  blue: 'var(--sk-blue)',
};
const RING = {
  paper: 'var(--sk-ink)',
  rule: 'var(--sk-line)',
  ink: 'var(--sk-ink)',
  'ink-hover': 'var(--sk-ink)',
  dim: 'var(--sk-dim)',
  green: 'var(--sk-gold-ink)',
  warm: 'var(--sk-gold-ink)',
  blue: 'var(--sk-blue)',
};

/** A color class: an optional state, the utility, the color, an optional opacity. */
export const TOKEN_RE =
  /(?<![\w-])((?:hover|focus|focus-visible|active|disabled|group-hover):)?(bg|text|border|border-[tblrxy]|outline|ring|divide|decoration|accent|placeholder)-(\[#[0-9A-Fa-f]{3,8}\]|white|black)(\/(?:\[[0-9.]+\]|[0-9]+))?(?![\w\-[])/g;

/** Every distinct classic color class in a source text, in first-seen order. Pure. */
export function skinTokens(source) {
  const seen = new Set();
  for (const m of String(source || '').matchAll(TOKEN_RE)) {
    // text-[#..] also matches text sizes like text-[0.75rem]? No: the color group requires # or white/black.
    seen.add(m[0]);
  }
  return [...seen];
}

const parse = (token) => {
  TOKEN_RE.lastIndex = 0;
  const m = new RegExp(TOKEN_RE.source).exec(token);
  if (!m) return null;
  const color = m[3].startsWith('[') ? m[3].slice(1, -1) : m[3];
  return { state: m[1] ? m[1].slice(0, -1) : '', util: m[2], color, alpha: m[4] ? m[4].slice(1) : '' };
};

/** '/40' -> 0.4, '/[0.06]' -> 0.06, '' -> null. Pure. */
export function alphaOf(alpha) {
  if (!alpha) return null;
  const raw = alpha.replace(/[/[\]]/g, '');
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return alpha.includes('[') ? n : n / 100;
}
// A see-through fill's tint, per role: paper -> the dark panel, ink -> the dark ground, the accents as themselves.
const ALPHA_RGB = {
  paper: '26,20,22',
  rule: '74,62,65',
  ink: '15,11,13',
  'ink-hover': '15,11,13',
  dim: '74,62,65',
  green: '242,191,46',
  warm: '240,160,122',
  blue: '156,195,239',
};
/**
 * A light classic surface that sets its own colors inline (the Presenter's
 * full-screen paper, an audience slide) carries data-classic-paper: the skin
 * stops at it, so its own dark-on-light words are never turned light-on-light.
 */
export const EXEMPT = ':not([data-classic-paper] *)';
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const SCOPE = '.ls-root .ls-classic-skin';
const pseudo = { hover: ':hover', focus: ':focus', 'focus-visible': ':focus-visible', active: ':active', disabled: ':disabled', 'group-hover': '' };

/**
 * The CSS rule for one classic color class inside the new look, or '' for a
 * color kept as it is. Throws on a color with no role (the gate catches it first).
 * !important + (0,3,0) outranks every app theme's own override (theme-css.js, (0,2,0) !important).
 */
export function skinRule(token) {
  const t = parse(token);
  if (!t) throw new Error(`not a color class: ${token}`);
  const role = roleOf(t.color);
  if (!role) throw new Error(`no role for ${t.color} (${token})`);
  if (role === 'keep') return '';
  const sel = `${t.state === 'group-hover' ? `${SCOPE} .group:hover ` : `${SCOPE} `}[class~="${esc(token)}"]${pseudo[t.state] || ''}${EXEMPT}`;
  const a = alphaOf(t.alpha);
  const u = t.util;
  if (u === 'bg') {
    // A see-through fill keeps its see-through: a tint of the role's color (a dark scrim stays dark).
    if (a != null) return `${sel}{background-color:rgba(${ALPHA_RGB[role]},${role === 'green' || role === 'warm' ? Math.max(a, 0.1) : a})!important}`;
    // On a fill, the words flip dark -- one attribute more specific than any text-* class on the same element.
    const words = FILL.has(role) ? `color:var(--sk-on-fill)!important` : '';
    const kids = FILL.has(role) ? `\n${sel}[class] *,${sel}[class]{color:var(--sk-on-fill)!important}` : '';
    const bg = t.state === 'hover' && role === 'paper' ? 'var(--sk-panel-2)' : BG[role];
    return `${sel}{background-color:${bg}!important;${words}}${kids}`;
  }
  if (u === 'text' || u === 'placeholder' || u === 'accent') {
    if (u === 'placeholder') return `${SCOPE} [class~="${esc(token)}"]${EXEMPT}::placeholder{color:var(--sk-dim)!important}`;
    if (u === 'accent') return `${sel}{accent-color:var(--sk-gold)!important}`;
    return `${sel}{color:${TEXT[role]}!important}`;
  }
  if (u === 'decoration') return `${sel}{text-decoration-color:${LINE[role]}!important}`;
  if (u === 'outline') return `${sel}{outline-color:${RING[role]}!important}`;
  if (u === 'ring') return `${sel}{--tw-ring-color:${RING[role]}!important}`;
  if (u === 'divide')
    return `${SCOPE} [class~="${esc(token)}"]${pseudo[t.state] || ''}${EXEMPT}>:not([hidden])~:not([hidden]){border-color:${LINE[role]}!important}`;
  return `${sel}{border-color:${LINE[role]}!important}`; // border, border-t...
}

/** The whole stylesheet for a list of classic color classes. Pure. */
export function skinCss(tokens) {
  const vars = Object.entries(SKIN_VARS)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  const rules = [...new Set(tokens)].sort().map(skinRule).filter(Boolean);
  return [
    '/* GENERATED by scripts/learn-classic-skin.mjs from app/src/lib/learn-classic-skin.js -- do not edit by hand. */',
    '/* The classic Learn tools inside the new look (.ls-classic-skin only; the classic page is untouched). */',
    `.ls-root .ls-classic-skin{${vars};color:var(--sk-ink)}`,
    ...rules,
    '',
  ].join('\n');
}

/** The tokens a stylesheet already carries a rule for. Pure. */
export function coveredTokens(css) {
  const out = new Set();
  for (const m of String(css || '').matchAll(/\[class~="((?:[^"\\]|\\.)*)"\]/g)) out.add(m[1].replace(/\\(.)/g, '$1'));
  return out;
}

/** The classic color classes in `sources` that `css` has no rule for (kept colors excepted). Pure. */
export function uncoveredTokens(sources, css) {
  const have = coveredTokens(css);
  const out = [];
  for (const src of sources) {
    for (const tok of skinTokens(src)) {
      const t = parse(tok);
      if (t && roleOf(t.color) === 'keep') continue;
      if (!have.has(tok) && !out.includes(tok)) out.push(tok);
    }
  }
  return out;
}

/** Colors in `sources` with no role at all. Pure. */
export function unknownColors(sources) {
  const out = new Set();
  for (const src of sources)
    for (const tok of skinTokens(src)) {
      const t = parse(tok);
      if (t && !roleOf(t.color)) out.add(t.color);
    }
  return [...out];
}
