// =============================================================================
// tab-overflow-guard — deterministic horizontal-overflow / white-void gate
// =============================================================================
// Twice the user reported the same regression: on a full-width <main> (#264)
// the Projects sub-tab row overflowed the viewport — the trailing tabs
// (Decisions / Review / Loops) fell off the right edge with no way to scroll to
// them, AND the un-clipped page overflow shoved the dark theme aside, exposing a
// white band on the right in midnight mode. This is the "should have been
// caught" gate (Verification Doctrine, DR-0076): it FAILS the build when either
// half of that regression can recur.
//
// Two deterministic invariants, $0, no browser:
//
//   1. APP SHELL clip — the themed shell (`min-h-screen` + `data-theme={...}`)
//      must carry `overflow-x-clip`, so the PAGE itself can never scroll
//      sideways into the white <body> no matter what overflows. This is the
//      structural guarantee against the white void.
//
//   2. TAB STRIPS scroll — any surface that renders tab buttons (the
//      `border-b-2` + `whitespace-nowrap` active-underline pattern) must provide
//      horizontal scroll (the <TabScroll> primitive or an `overflow-x-auto` /
//      `overflow-x-scroll` wrapper) or wrap (`flex-wrap`), so every tab stays
//      REACHABLE on a phone — clipping alone would hide them.
//
// Importable for vitest; CLI: node scripts/tab-overflow-guard.mjs
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'app/src');
const MONOLITH = join(SRC, 'poe-financial-mvp-v28.jsx');

function jsxFiles(dir) {
  let out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) { if (f === '__tests__' || f === 'node_modules') continue; out = out.concat(jsxFiles(p)); }
    else if (/\.jsx$/.test(f)) out.push(p);
  }
  return out;
}

// Pull every className value out of a source string ("..." and {`...`}). For an
// interpolated template the literal parts (where border-b-2 / whitespace-nowrap
// live) are captured; the ${...} expressions read through as literal text.
export function extractClassNames(src) {
  const out = [];
  const re = /className=(?:"([^"]*)"|\{`([^`]*)`\})/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1] || m[2] || '');
  return out;
}

// --- Invariant 1: the themed app shell must clip horizontal overflow ---------

// The single-line opening tags of the themed shell div(s): `data-theme={...}`
// AND `min-h-screen` on the same element.
export function shellLines(src) {
  return src.split('\n').filter(l => /data-theme=\{/.test(l) && /min-h-screen/.test(l));
}

// Shell lines that do NOT clip horizontal overflow — each is a white-void risk.
export function shellsMissingClip(src) {
  return shellLines(src)
    .filter(l => !/\boverflow-x-clip\b/.test(l))
    .map(l => l.trim().replace(/\s+/g, ' ').slice(0, 90));
}

// --- Invariant 2: tab strips must scroll (or wrap) ---------------------------

// Does this source render tab buttons? The active-underline tab pattern is a
// className carrying BOTH `border-b-2` and `whitespace-nowrap`.
export function rendersTabButtons(src) {
  return extractClassNames(src).some(cn => /\bborder-b-2\b/.test(cn) && /\bwhitespace-nowrap\b/.test(cn));
}

// Does this source give those tabs a way not to overflow the page?
export function providesHorizontalScroll(src) {
  return /<TabScroll\b/.test(src)
    || /\boverflow-x-auto\b/.test(src)
    || /\boverflow-x-scroll\b/.test(src)
    || /\bflex-wrap\b/.test(src);
}

// A naked tab strip = renders tab buttons with no scroll/wrap container.
export function checkTabStrips(sources) {
  return sources
    .filter(({ src }) => rendersTabButtons(src) && !providesHorizontalScroll(src))
    .map(({ label }) => ({ label }));
}

// --- Combined scan over the real source tree ---------------------------------

export function scan() {
  const monolith = readFileSync(MONOLITH, 'utf8');
  const sources = jsxFiles(SRC).map(f => ({ label: f.replace(ROOT + '\\', '').replace(/\\/g, '/'), src: readFileSync(f, 'utf8') }));
  return {
    shellLineCount: shellLines(monolith).length,
    shellViolations: shellsMissingClip(monolith),
    tabFileCount: sources.filter(s => rendersTabButtons(s.src)).length,
    tabViolations: checkTabStrips(sources),
  };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { shellLineCount, shellViolations, tabFileCount, tabViolations } = scan();
  console.log('# TAB OVERFLOW / WHITE-VOID GUARD\n');
  console.log(`App-shell lines: ${shellLineCount} · tab-strip files: ${tabFileCount}\n`);
  let ok = true;
  if (shellViolations.length) {
    ok = false;
    console.log(`FAIL — ${shellViolations.length} themed shell(s) missing overflow-x-clip (white-void risk):`);
    shellViolations.forEach(s => console.log(`      · «${s}»`));
  }
  if (tabViolations.length) {
    ok = false;
    console.log(`FAIL — ${tabViolations.length} tab strip(s) with no horizontal scroll/wrap (tabs unreachable):`);
    tabViolations.forEach(v => console.log(`      · ${v.label}`));
  }
  if (ok) {
    console.log('PASS — app shell clips horizontal overflow; every tab strip scrolls or wraps.');
    process.exit(0);
  }
  process.exit(1);
}
