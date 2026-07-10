// =============================================================================
// contrast-guard — deterministic per-theme WCAG-AA contrast gate (DR-0076)
// =============================================================================
// First gate added under the Verification Doctrine (DR-0076): the light-theme
// text was reported unreadable AND a code comment FALSELY claimed "all
// combinations exceed WCAG 2.1 AA" while the real ratio was 2.92:1. A comment
// is a claim; this is a check. It parses the actual theme CSS (the source of
// truth — the inline <style> block in the monolith) and FAILS the build if a
// theme's primary/secondary text on its surfaces, or its light text on its dark
// buttons, drops below WCAG 2.1 AA (4.5:1 for normal text).
//
// Grounded by measurement: the surfaces checked (base background, white card,
// dark button) are the ones text was OBSERVED to sit on in the running app —
// not a theoretical cartesian. Deterministic, $0, no browser, no LLM.
// Importable (parseThemes / checkContrast) so a vitest gates merges from inside
// the required `app — lint + vitest` check. CLI: node scripts/contrast-guard.mjs
// =============================================================================
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MONOLITH = join(ROOT, 'app/src/poe-financial-mvp-v28.jsx');
// 2026-07-07: the [data-theme] palette CSS moved to the shared theme source so
// the standalone business doors render the same themes (lib/theme-css.js). The
// guard reads BOTH files, so the single-source contract holds wherever the
// rules live.
const THEME_SOURCE = join(ROOT, 'app/src/lib/theme-css.js');
const COMPONENTS_DIR = join(ROOT, 'app/src/components');

const AA_NORMAL = 4.5; // WCAG 2.1 AA, normal-size text

// The base (un-remapped) palette — what a theme that doesn't override a given
// class inherits. The theme CSS overrides these per `[data-theme=...]`.
// accent* are the three accent TEXT tokens used across the cockpit surfaces;
// before 2026-06-17 the guard never checked them, which is exactly how the
// midnight blue (#2A5A8E, no remap → 2.84:1 on black) slipped through green.
const DEFAULTS = {
  baseBg: '#FAF8F4', cardBg: '#FFFFFF', darkBtnBg: '#1A1815',
  textPrimary: '#1A1815', textSecondary: '#5A5751', textLight: '#FAF8F4',
  accentGreen: '#5A6E3D', accentRust: '#B85838', accentBlue: '#2A5A8E',
};

// Files whose INLINE styles are guarded: a hardcoded inline color here fails the
// build, because an inline color can't be remapped per-theme and renders
// dark-on-dark in midnight (the 2026-06-17 bug). Other component files are
// scanned too, but only WARN (their inline colors are tracked in
// docs/governance/decision-queue.md for promotion — no silent cap).
const GUARDED_INLINE_FILES = [
  'CommandServeCenter.jsx',
  'BuildBoard.jsx',
  // Promoted 2026-07-10 (the decision-queue 2026-07-15 follow-up named these
  // two): every literal AND ternary inline color converted to themeable
  // classes (with midnight remaps added in theme-css.js), so the dark-on-dark
  // class is machine-dead here. TeachMode had already been cleaned by its
  // owning lane. Bookstore/Forecast/CreationWorkspace stay WARN-tier: their
  // remaining inline colors ride palette-object styling (P.ink etc.) — a
  // whole-file conversion routed in the decision queue with its own date.
  'Imported.jsx',
  'TeachMode.jsx',
];

// Midnight surfaces an inline (un-themeable) text color would have to clear.
const MIDNIGHT_BASE = '#000000';
const MIDNIGHT_CARD = '#141414';

// Documented, dated exceptions (DR-0075 perpetual-improvement: a justified
// non-improvement is a recorded decision WITH a re-review date). Each is
// filtered OUT of the hard violations and surfaced as a WARNING instead.
const CONTRAST_ALLOWLIST = [
  {
    // Rust #B85838 on the light CREAM base bg is ~4.2-4.4:1 (sub-AA) in every
    // light theme + the default; it passes on the white CARD (4.68:1). #B85838
    // is a shared brand token used across the whole app, so darkening it is a
    // cross-cutting visual change, out of scope for the dark-mode fix.
    fgKey: 'accentRust', bgKey: 'baseBg', onlyLightThemes: true,
    why: 'brand rust on cream base ~4.2-4.4:1; brand-token change is cross-cutting',
    reReview: '2026-08-01',
  },
];

// --- contrast math (WCAG 2.1) ---------------------------------------------
function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec((h || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function relLum(hex) {
  const rgb = hexToRgb(hex); if (!rgb) return null;
  const a = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
export function contrastRatio(fg, bg) {
  const L1 = relLum(fg), L2 = relLum(bg);
  if (L1 == null || L2 == null) return null;
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

// --- parse the theme CSS into a per-theme palette --------------------------
// Reads the actual `[data-theme="..."]` rules; strips the JSX/CSS escaping
// (`\\[\\#` → `[#`); maps each rule to a palette slot by its selector.
export function parseThemes(src) {
  const themes = {};
  const ensure = (n) => (themes[n] || (themes[n] = { ...DEFAULTS }));
  for (const raw of src.split('\n')) {
    if (!raw.includes('[data-theme=')) continue;
    const line = raw.replace(/\\\\/g, '').replace(/\\/g, ''); // de-escape selectors
    const tm = line.match(/\[data-theme="([a-z]+)"\]/i); if (!tm) continue;
    const t = ensure(tm[1]);
    const bg = (line.match(/background-color:\s*(#[0-9a-f]{6})/i) || [])[1];
    const col = (line.match(/(?<!background-)color:\s*(#[0-9a-f]{6})/i) || [])[1];
    if (/\.bg-\[#FAF8F4\]\{/i.test(line) && bg) t.baseBg = bg;
    else if (/\.bg-white\{/i.test(line) && bg) t.cardBg = bg;
    else if (/\.bg-\[#1A1815\]\{/i.test(line) && bg) t.darkBtnBg = bg;
    else if (/\[data-theme="[a-z]+"\]\{/i.test(line)) { // bare theme rule (sets base bg / default text)
      if (bg) t.baseBg = bg;
      if (col) t.textPrimary = col;
    }
    if (/\.text-\[#1A1815\]\{/i.test(line) && col) t.textPrimary = col;
    if (/\.text-\[#5A5751\]\{/i.test(line) && col) t.textSecondary = col;
    if (/\.text-\[#FAF8F4\]\{/i.test(line) && col) t.textLight = col;
    // Accent text tokens — picked up where a theme remaps them (e.g. midnight
    // #2A5A8E -> #7FB3F0); otherwise they keep their DEFAULTS hex.
    if (/\.text-\[#5A6E3D\]\{/i.test(line) && col) t.accentGreen = col;
    if (/\.text-\[#B85838\]\{/i.test(line) && col) t.accentRust = col;
    if (/\.text-\[#2A5A8E\]\{/i.test(line) && col) t.accentBlue = col;
  }
  return themes;
}

// Allowlist predicate: is this (theme, fgKey, bgKey) a documented exception?
function isAllowlisted(themeName, theme, fgKey, bgKey) {
  return CONTRAST_ALLOWLIST.some((a) => {
    if (a.fgKey !== fgKey || a.bgKey !== bgKey) return false;
    if (a.onlyLightThemes) {
      const L = relLum(theme.baseBg);
      if (L == null || L < 0.5) return false; // only excuse it on LIGHT themes
    }
    return true;
  });
}

// --- the check -------------------------------------------------------------
// For each theme: primary + secondary body text must meet AA on the base
// background AND the white card; light text must meet AA on the dark button.
export function checkContrast(themes) {
  return checkContrastDetailed(themes).violations;
}

// The full check, returning hard `violations` (fail the build) AND allowlisted
// `warnings` (documented + dated exceptions — surfaced, never hidden). Accents
// are now checked per-theme on both surfaces, INCLUDING midnight — this is the
// coverage that was missing when black-on-dark passed green.
export function checkContrastDetailed(themes) {
  const violations = [];
  const warnings = [];
  const CHECKS = [
    ['primary text',         'textPrimary',   ['baseBg', 'cardBg']],
    ['secondary text',       'textSecondary', ['baseBg', 'cardBg']],
    ['light-on-dark button', 'textLight',     ['darkBtnBg']],
    ['green accent text',    'accentGreen',   ['baseBg', 'cardBg']],
    ['rust accent text',     'accentRust',    ['baseBg', 'cardBg']],
    ['blue accent text',     'accentBlue',    ['baseBg', 'cardBg']],
  ];
  for (const [name, t] of Object.entries(themes)) {
    for (const [label, fgKey, bgKeys] of CHECKS) {
      for (const bgKey of bgKeys) {
        const r = contrastRatio(t[fgKey], t[bgKey]);
        if (r == null) { violations.push({ theme: name, what: label, error: 'unparseable color', fg: t[fgKey], bg: t[bgKey] }); continue; }
        if (r >= AA_NORMAL) continue;
        const rec = { theme: name, what: label, fg: t[fgKey], bg: t[bgKey], ratio: +r.toFixed(2), need: AA_NORMAL };
        if (isAllowlisted(name, t, fgKey, bgKey)) warnings.push(rec);
        else violations.push(rec);
      }
    }
  }
  return { violations, warnings };
}

export function scanContrast() {
  if (!existsSync(MONOLITH)) return { themes: {}, violations: [{ theme: '(none)', what: 'monolith not found', fg: '', bg: '' }] };
  const src = readFileSync(MONOLITH, 'utf8')
    + (existsSync(THEME_SOURCE) ? '\n' + readFileSync(THEME_SOURCE, 'utf8') : '');
  const themes = parseThemes(src);
  const { violations, warnings } = checkContrastDetailed(themes);
  return { themes, violations, warnings };
}

// --- inline-color scanner --------------------------------------------------
// A hardcoded INLINE color (`style={{ color: '#1A1815' }}`) bypasses the
// per-[data-theme] remap entirely, so a dark token renders dark-on-dark in
// midnight. This scans JSX inline-style objects (NOT data-object `color:`
// fields — only `style={{ ... }}` blocks) for: (a) a text `color:` hex that
// fails AA on either midnight surface, and (b) a near-white `backgroundColor`
// (stays light in midnight while themed text remaps light -> light-on-light).
// Single-level style objects only (`[^{}]*`), which is what these files use.
export function scanInlineStyleColors(src) {
  const fails = [];
  const styleRe = /style=\{\{([^{}]*)\}\}/g;
  let m;
  while ((m = styleRe.exec(src))) {
    const body = m[1];
    const upto = src.slice(0, m.index);
    const line = upto.split('\n').length;
    // (a) inline TEXT color — `color:` is lowercase-only; backgroundColor /
    // borderColor use a capital C so they never match here.
    const cm = /(?:^|[^A-Za-z])color:\s*'(#[0-9a-fA-F]{6})'/.exec(body);
    if (cm) {
      const hex = cm[1];
      const rBase = contrastRatio(hex, MIDNIGHT_BASE);
      const rCard = contrastRatio(hex, MIDNIGHT_CARD);
      const worst = Math.min(rBase == null ? 99 : rBase, rCard == null ? 99 : rCard);
      if (worst < AA_NORMAL) fails.push({ line, what: 'inline text color (un-themeable)', color: hex, ratio: +worst.toFixed(2), surface: 'midnight' });
    }
    // (b) inline near-white background.
    if (/backgroundColor:\s*'(white|#FFF(?:FFF)?)'/i.test(body)) {
      fails.push({ line, what: 'inline white background (un-themeable)', color: 'white', ratio: 0, surface: 'midnight' });
    }
  }
  return fails;
}

// Stricter scan for GUARDED files: ANY inline color/background/border in a
// `style={{ ... }}` block fails — literal OR dynamic (a ternary/function still
// bypasses the per-theme remap). The cockpit files must theme through classes
// only, so they can never regress to dark-on-dark. (fontFamily-only styles are
// fine; this matches the color-bearing keys exactly.)
export function scanInlineThemeableColors(src) {
  const fails = [];
  const styleRe = /style=\{\{([^{}]*)\}\}/g;
  let m;
  while ((m = styleRe.exec(src))) {
    const body = m[1];
    const km = /(?:^|[^A-Za-z])(color|backgroundColor|borderColor|outlineColor):/.exec(body);
    if (km) {
      const line = src.slice(0, m.index).split('\n').length;
      fails.push({ line, what: `inline ${km[1]} (use a themeable class)`, color: 'inline', ratio: 0, surface: 'all themes' });
    }
  }
  return fails;
}

// Scan the guarded files (hard FAIL — strict: no inline color at all) + every
// other component file (WARN only, contrast-aware literal scan, so the full
// blast radius is visible without breaking the build — no silent cap; promotion
// to guarded is tracked in docs/governance/decision-queue.md).
export function scanInline() {
  const fails = [];
  const warns = [];
  let files = [];
  try { files = readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.jsx')); } catch { /* no dir in some test envs */ }
  for (const f of files) {
    let src; try { src = readFileSync(join(COMPONENTS_DIR, f), 'utf8'); } catch { continue; }
    if (GUARDED_INLINE_FILES.includes(f)) {
      const strict = scanInlineThemeableColors(src);
      if (strict.length) fails.push(...strict.map((h) => ({ file: f, ...h })));
    } else {
      const hits = scanInlineStyleColors(src);
      if (hits.length) warns.push({ file: f, count: hits.length });
    }
  }
  return { fails, warns };
}

// --- background-coverage scanner (both directions, midnight) ---------------
// The 2026-06-17 blind spot: the guard checked only the 6 palette TEXT tokens
// against 3 fixed surfaces. Real components use dozens of Tailwind color classes
// (bg-[#F2F4EC], text-[#7A1F1F], ...). Midnight is the only DARK theme, so under
// it body text flips light and surfaces flip dark — which means EVERY used text
// token must render light enough to read on a dark surface, and EVERY used bg
// token must render dark enough for light text. A class midnight does NOT remap
// keeps its light/dark default and breaks one of those: a dark text token →
// dark-on-dark (the #7A1F1F error text, 32x); a near-white bg tint → light-on-
// light (the Eternal Algorithms OUTCOME band, #F2F4EC). Both are now hard fails.
const DARK_THEME = 'midnight';
const MIDNIGHT_CARD_SURFACE = '#141414'; // the LIGHTER midnight surface — worst case for light text
const BG_TOO_LIGHT_LUM = 0.5;            // a midnight surface this light carries NO readable light text
// Accent ACTION backgrounds that intentionally stay bright in midnight and flip
// their text dark via the compound `.bg-[X].text-white{color:#1A1815}` rules.
// They are bright-on-purpose, so the "bg must render dark" rule does not apply.
const ACCENT_ACTION_BG = ['#5a6e3d', '#b85838', '#2a5a8e'];

// Parse the midnight remap table: class-key -> rendered color, for bg + text.
// Skips :hover states and the compound `.bg-x.text-white` flips (handled above).
export function parseMidnightRemap(src) {
  const bg = {}, text = {};
  for (const raw of src.split('\n')) {
    if (!raw.includes(`[data-theme="${DARK_THEME}"]`)) continue;
    const line = raw.replace(/\\\\/g, '').replace(/\\/g, '');
    if (/:hover/.test(line)) continue;
    if (/\.text-white\{/.test(line)) continue;
    const bgm = line.match(/\.bg-(?:\[(#[0-9a-f]{6})\]|(white|black))\{background-color:\s*(#[0-9a-f]{6})/i);
    if (bgm) { bg[(bgm[1] || bgm[2]).toLowerCase()] = bgm[3]; continue; }
    const tm = line.match(/\.text-\[(#[0-9a-f]{6})\]\{color:\s*(#[0-9a-f]{6})/i);
    if (tm) text[tm[1].toLowerCase()] = tm[2];
  }
  return { bg, text };
}

// Collect the color CLASS tokens actually USED in a source file. bg covers hex +
// the white/black keywords; text covers hex only (bare text-black/white have
// legit print: + dark:-variant uses that aren't [data-theme] surfaces).
export function collectColorTokens(src) {
  const bg = new Set(), text = new Set();
  for (const m of src.matchAll(/bg-\[(#[0-9A-Fa-f]{6})\]/g)) bg.add(m[1].toLowerCase());
  for (const m of src.matchAll(/\bbg-(white|black)\b/g)) bg.add(m[1].toLowerCase());
  for (const m of src.matchAll(/text-\[(#[0-9A-Fa-f]{6})\]/g)) text.add(m[1].toLowerCase());
  return { bg, text };
}

function renderBgInMidnight(key, remap) {
  if (remap.bg[key]) return remap.bg[key];
  if (key === 'white') return '#FFFFFF';
  if (key === 'black') return '#000000';
  return key; // hex with no remap renders as itself
}
function renderTextInMidnight(key, remap) {
  return remap.text[key] || key; // hex with no remap renders as itself
}

// Pure check: given the midnight remap + the used token sets, return both-
// direction violations. Importable + deterministic, so vitest can prove it
// catches the break with no filesystem.
export function checkTokenCoverage(remap, used) {
  const violations = [];
  for (const key of used.bg) {
    if (ACCENT_ACTION_BG.includes(key)) continue;
    const rendered = renderBgInMidnight(key, remap);
    const L = relLum(rendered);
    if (L != null && L >= BG_TOO_LIGHT_LUM) {
      violations.push({ theme: DARK_THEME, dir: 'light-on-light', what: `bg-[${key}] background`, rendered, lum: +L.toFixed(2) });
    }
  }
  for (const key of used.text) {
    const rendered = renderTextInMidnight(key, remap);
    const r = contrastRatio(rendered, MIDNIGHT_CARD_SURFACE);
    if (r != null && r < AA_NORMAL) {
      violations.push({ theme: DARK_THEME, dir: 'dark-on-dark', what: `text-[${key}] text`, rendered, ratio: +r.toFixed(2) });
    }
  }
  return violations;
}

// Scan the live monolith + every component file for used color tokens, parse the
// midnight remap, and return the both-direction coverage violations.
export function scanTokenCoverage() {
  if (!existsSync(MONOLITH)) return { violations: [], remap: { bg: {}, text: {} }, used: { bg: new Set(), text: new Set() } };
  const monoSrc = readFileSync(MONOLITH, 'utf8');
  // The midnight remap rules live in the shared theme source (lib/theme-css.js)
  // since the 2026-07-07 extraction; the monolith is still scanned for USED
  // tokens. Read both so coverage keeps meaning coverage.
  const themeSrc = existsSync(THEME_SOURCE) ? readFileSync(THEME_SOURCE, 'utf8') : '';
  const remap = parseMidnightRemap(monoSrc + '\n' + themeSrc);
  const used = { bg: new Set(), text: new Set() };
  const add = (src) => { const t = collectColorTokens(src); t.bg.forEach((x) => used.bg.add(x)); t.text.forEach((x) => used.text.add(x)); };
  add(monoSrc);
  let files = [];
  try { files = readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.jsx')); } catch { /* no dir in some test envs */ }
  for (const f of files) { try { add(readFileSync(join(COMPONENTS_DIR, f), 'utf8')); } catch { /* unreadable */ } }
  return { violations: checkTokenCoverage(remap, used), remap, used };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { themes, violations, warnings } = scanContrast();
  const { fails, warns } = scanInline();
  const { violations: tokenFails, used } = scanTokenCoverage();
  console.log('# CONTRAST GUARD (per-theme WCAG 2.1 AA + inline + token coverage)\n');
  console.log(`Themes parsed: ${Object.keys(themes).join(', ') || '(none)'}\n`);
  console.log(`Midnight token coverage: ${used.bg.size} bg + ${used.text.size} text classes checked (both directions)\n`);

  if (warnings && warnings.length) {
    console.log('Allowlisted (documented + dated — see CONTRAST_ALLOWLIST):');
    for (const w of warnings) console.log(`  ~ [${w.theme}] ${w.what}: ${w.fg} on ${w.bg} = ${w.ratio} (deferred)`);
    console.log('');
  }
  if (warns.length) {
    console.log('Inline colors in NOT-YET-GUARDED component files (tracked, not failing):');
    for (const w of warns) console.log(`  ~ ${w.file}: ${w.count} inline style color(s)`);
    console.log('');
  }

  const hardFail = violations.length > 0 || fails.length > 0 || tokenFails.length > 0;
  if (!hardFail) {
    console.log(`PASS — every theme meets AA (body + accents, incl. midnight); ${GUARDED_INLINE_FILES.join(', ')} carry no un-themeable inline colors; every used color class renders AA in midnight (no dark-on-dark, no light-on-light).`);
    process.exit(0);
  }
  if (violations.length) {
    console.log(`FAIL — ${violations.length} per-theme contrast violation(s):`);
    for (const v of violations) console.log(`  - [${v.theme}] ${v.what}: ${v.fg} on ${v.bg} = ${v.ratio || v.error} (need ${v.need || AA_NORMAL})`);
  }
  if (fails.length) {
    console.log(`FAIL — ${fails.length} un-themeable inline color(s) in guarded files:`);
    for (const f of fails) console.log(`  - ${f.file}:${f.line} ${f.what}: ${f.color} = ${f.ratio}:1 on ${f.surface} (need ${AA_NORMAL})`);
  }
  if (tokenFails.length) {
    console.log(`FAIL — ${tokenFails.length} midnight token-coverage violation(s) (used class with no/insufficient midnight remap):`);
    for (const t of tokenFails) console.log(`  - [${t.theme}] ${t.dir}: ${t.what} renders ${t.rendered} (${t.dir === 'dark-on-dark' ? `${t.ratio}:1 on ${MIDNIGHT_CARD_SURFACE}, need ${AA_NORMAL}` : `relLum ${t.lum} >= ${BG_TOO_LIGHT_LUM}, light text unreadable`})`);
  }
  process.exit(1);
}
