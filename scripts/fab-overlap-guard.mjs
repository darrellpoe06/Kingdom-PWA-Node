// =============================================================================
// fab-overlap-guard — deterministic floating-button overlap gate (DR-0076)
// =============================================================================
// The bottom-corner buttons piled on top of each other (3 elements all at
// `fixed bottom-4 right-4`) and it took the user's eyes to catch it — twice.
// This is the "should have been caught" gate (Verification Doctrine, DR-0076):
// a corner-anchored `fixed` element occupies a single bottom corner; two of
// them at the SAME bottom-corner anchor stack on top of each other. This scans
// the JSX for that smell and FAILS the build, so the class can't recur.
//
// Heuristic but high-signal: it flags the SAME exact anchor (same side + same
// bottom offset), which is the layout mistake that caused the pile — distinct
// offsets (bottom-4 vs bottom-20) pass. Full-width bars (both left AND right)
// are not corner buttons and are skipped. Deterministic, $0, no browser.
// Importable for vitest; CLI: node scripts/fab-overlap-guard.mjs
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'app/src');

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

// Pull every className value out of a source string (both "..." and {`...`}).
export function extractClassNames(src) {
  const out = [];
  const re = /className=(?:"([^"]*)"|\{`([^`]*)`\})/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1] || m[2] || '');
  return out;
}

// The bottom-corner anchor a className claims, or null if it isn't a
// corner-anchored fixed element.
export function cornerAnchor(className) {
  if (!/\bfixed\b/.test(className)) return null;
  const bottom = className.match(/\bbottom-(\[[^\]]+\]|\d+)\b/);
  if (!bottom) return null; // not bottom-anchored (top bars / inset-0 modals)
  const left = className.match(/\bleft-(\[[^\]]+\]|\d+)\b/);
  const right = className.match(/\bright-(\[[^\]]+\]|\d+)\b/);
  if (left && right) return null; // full-width bar, not a corner button
  const side = left ? `left-${left[1]}` : right ? `right-${right[1]}` : null;
  if (!side) return null; // centered/no horizontal anchor
  return `${side} bottom-${bottom[1]}`;
}

// Tally corner anchors across a set of { label, src } sources.
export function tallyAnchors(sources) {
  const byAnchor = {};
  for (const { label, src } of sources) {
    for (const cn of extractClassNames(src)) {
      const a = cornerAnchor(cn);
      if (a) (byAnchor[a] = byAnchor[a] || []).push({ label, snippet: cn.replace(/\s+/g, ' ').slice(0, 56) });
    }
  }
  return byAnchor;
}

// Two+ corner buttons at the SAME bottom-corner anchor overlap.
export function checkOverlaps(byAnchor) {
  return Object.entries(byAnchor)
    .filter(([, els]) => els.length > 1)
    .map(([anchor, els]) => ({ anchor, count: els.length, where: els }));
}

export function scanFabs() {
  const sources = jsxFiles(SRC).map(f => ({ label: f.replace(ROOT + '\\', '').replace(/\\/g, '/'), src: readFileSync(f, 'utf8') }));
  const byAnchor = tallyAnchors(sources);
  return { byAnchor, violations: checkOverlaps(byAnchor) };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { byAnchor, violations } = scanFabs();
  console.log('# FAB OVERLAP GUARD (floating bottom-corner buttons)\n');
  console.log(`Corner-anchored fixed elements found at ${Object.keys(byAnchor).length} distinct anchor(s).\n`);
  if (violations.length === 0) {
    console.log('PASS — no two corner buttons share the same bottom-corner anchor.');
    process.exit(0);
  }
  console.log(`FAIL — ${violations.length} overlapping anchor(s):`);
  for (const v of violations) {
    console.log(`  - ${v.count} elements stacked at [${v.anchor}]:`);
    v.where.forEach(w => console.log(`      · ${w.label}  «${w.snippet}»`));
  }
  process.exit(1);
}
