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
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MONOLITH = join(ROOT, 'app/src/poe-financial-mvp-v28.jsx');

const AA_NORMAL = 4.5; // WCAG 2.1 AA, normal-size text

// The base (un-remapped) palette — what a theme that doesn't override a given
// class inherits. The theme CSS overrides these per `[data-theme=...]`.
const DEFAULTS = {
  baseBg: '#FAF8F4', cardBg: '#FFFFFF', darkBtnBg: '#1A1815',
  textPrimary: '#1A1815', textSecondary: '#5A5751', textLight: '#FAF8F4',
};

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
  }
  return themes;
}

// --- the check -------------------------------------------------------------
// For each theme: primary + secondary body text must meet AA on the base
// background AND the white card; light text must meet AA on the dark button.
export function checkContrast(themes) {
  const violations = [];
  const CHECKS = [
    ['primary text',   'textPrimary',   ['baseBg', 'cardBg']],
    ['secondary text', 'textSecondary', ['baseBg', 'cardBg']],
    ['light-on-dark button', 'textLight', ['darkBtnBg']],
  ];
  for (const [name, t] of Object.entries(themes)) {
    for (const [label, fgKey, bgKeys] of CHECKS) {
      for (const bgKey of bgKeys) {
        const r = contrastRatio(t[fgKey], t[bgKey]);
        if (r == null) { violations.push({ theme: name, what: label, error: 'unparseable color', fg: t[fgKey], bg: t[bgKey] }); continue; }
        if (r < AA_NORMAL) violations.push({ theme: name, what: label, fg: t[fgKey], bg: t[bgKey], ratio: +r.toFixed(2), need: AA_NORMAL });
      }
    }
  }
  return violations;
}

export function scanContrast() {
  if (!existsSync(MONOLITH)) return { themes: {}, violations: [{ theme: '(none)', what: 'monolith not found', fg: '', bg: '' }] };
  const themes = parseThemes(readFileSync(MONOLITH, 'utf8'));
  return { themes, violations: checkContrast(themes) };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { themes, violations } = scanContrast();
  console.log('# CONTRAST GUARD (per-theme WCAG 2.1 AA)\n');
  console.log(`Themes parsed: ${Object.keys(themes).join(', ') || '(none)'}\n`);
  if (violations.length === 0) {
    console.log('PASS — every theme meets AA for body text on its surfaces and light text on its dark buttons.');
    process.exit(0);
  }
  console.log(`FAIL — ${violations.length} contrast violation(s):`);
  for (const v of violations) console.log(`  - [${v.theme}] ${v.what}: ${v.fg} on ${v.bg} = ${v.ratio || v.error} (need ${v.need || AA_NORMAL})`);
  process.exit(1);
}
