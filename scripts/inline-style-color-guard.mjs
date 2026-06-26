// =============================================================================
// inline-style-color-guard — catch theme-bypassing inline color styles (DR-0076)
// =============================================================================
// The 2026-06-25 Chef's Corner bug: the recipe page set every text color via an
// inline `style={{ color: '#1A1815' }}` (through local hex consts INK/MUTE/...).
// Inline styles WIN over the per-theme CSS remap, so under the midnight (dark)
// theme the cards turned dark but the text stayed near-black — black-on-black,
// unreadable. The per-theme contrast gate (contrast-guard.mjs) verifies the
// theme TOKEN CLASSES, but it is blind to inline hex because inline hex never
// reaches the theme CSS. This guard closes that blind spot: it flags inline
// `style` color props that are a hardcoded hex OR a bare identifier (a color
// const), so color routes through the shared theme classes instead.
//
// Scope: a CLEAN list of files that are verified token-only (the surfaces we
// fixed). New inline color in a clean file FAILS the build — proven-to-catch,
// not theater. The app-wide report (CLI `--report`) lists every remaining
// offender so the sweep is visible and trackable. Deterministic, $0, no browser.
// Importable (scanFile / scanAll / CLEAN_FILES) so a vitest gates merges from
// inside the required `app — lint + vitest` check.
// =============================================================================
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'app/src');

// Files verified to route ALL color through the shared theme classes (no inline
// color). The guard FAILS the build if any of these regress. Add a file here the
// moment it is converted — that is what makes the conversion stick.
export const CLEAN_FILES = [
  'app/src/components/ChefCorner.jsx',
];

const COLOR_PROPS = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];

// Match an inline color prop INSIDE a style object whose value is a hex literal
// ('#1A1815') or a bare identifier (INK, MUTE, ACCENT — a color const). A
// member/index/call expression (s.color, STATUS[k].color) is data-driven and
// reported separately (lower-confidence) so the high-confidence gate stays clean.
const LITERAL = new RegExp(`\\b(${COLOR_PROPS.join('|')})\\s*:\\s*(['"]#[0-9a-fA-F]{3,8}['"]|[A-Za-z_$][A-Za-z0-9_$]*)\\s*[,}]`, 'g');
const DYNAMIC = new RegExp(`\\b(${COLOR_PROPS.join('|')})\\s*:\\s*([A-Za-z_$][A-Za-z0-9_$]*[.\\[][^,}]+)`, 'g');

// Blank out comments (block + line) so an EXAMPLE in a doc comment — e.g. this
// guard's own header showing `style={{ color: '#1A1815' }}` — isn't scanned as
// real code. Replaces comment chars with spaces (newlines kept) so byte offsets
// and line numbers stay exact.
function stripComments(src) {
  const out = src.split('');
  const blank = (start, len) => { for (let i = start; i < start + len; i++) if (out[i] !== '\n') out[i] = ' '; };
  let m;
  const block = /\/\*[\s\S]*?\*\//g;
  while ((m = block.exec(src)) !== null) blank(m.index, m[0].length);
  const joined = out.join('');
  const line = /\/\/[^\n]*/g;
  while ((m = line.exec(joined)) !== null) blank(m.index, m[0].length);
  return out.join('');
}

// Only consider props that sit inside a JSX `style={{ ... }}` region. We do a
// light region scan rather than a full parser: find `style={{` and match the
// balanced `}}` close, then test props within. Good enough and deterministic.
function styleRegions(src) {
  const regions = [];
  let idx = 0;
  while ((idx = src.indexOf('style={{', idx)) !== -1) {
    const start = idx + 'style={{'.length;
    let depth = 2; // we're already inside two braces
    let i = start;
    for (; i < src.length && depth > 0; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
    }
    regions.push([start, i]); // [inner-start, inner-end-exclusive]
    idx = i;
  }
  return regions;
}

function lineOf(src, pos) {
  let line = 1;
  for (let i = 0; i < pos && i < src.length; i++) if (src[i] === '\n') line++;
  return line;
}

// Scan raw source text (testable without a file on disk).
export function scanSource(rawSrc, rel = '(inline)') {
  const src = stripComments(rawSrc);
  const regions = styleRegions(src);
  const hits = [];
  for (const [s, e] of regions) {
    const seg = src.slice(s, e);
    for (const re of [LITERAL, DYNAMIC]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(seg)) !== null) {
        const prop = m[1];
        const val = m[2];
        // `inherit`, `transparent`, `currentColor`, and CSS var()s are theme-safe
        // identifiers — not a hardcoded color. Skip them.
        if (/^(inherit|transparent|currentColor|unset|initial|none)$/.test(val)) continue;
        hits.push({ file: rel, line: lineOf(src, s + m.index), prop, value: val });
      }
    }
  }
  return hits;
}

export function scanFile(absPath) {
  const rel = relative(ROOT, absPath).replace(/\\/g, '/');
  return scanSource(readFileSync(absPath, 'utf8'), rel);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { if (name !== '__tests__' && name !== 'node_modules') walk(p, out); }
    else if (/\.jsx?$/.test(name)) out.push(p);
  }
  return out;
}

export function scanAll() {
  if (!existsSync(SRC)) return [];
  return walk(SRC).flatMap(scanFile);
}

// The gate: every CLEAN_FILES entry must have zero inline color styles.
export function checkCleanFiles() {
  const violations = [];
  for (const rel of CLEAN_FILES) {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) { violations.push({ file: rel, line: 0, prop: '(missing)', value: 'file not found' }); continue; }
    violations.push(...scanFile(abs));
  }
  return violations;
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = process.argv.includes('--report');
  if (report) {
    const all = scanAll();
    const byFile = new Map();
    for (const h of all) byFile.set(h.file, (byFile.get(h.file) || 0) + 1);
    console.log('# INLINE-STYLE COLOR REPORT (theme-bypassing color props)\n');
    console.log(`${all.length} inline color prop(s) across ${byFile.size} file(s):\n`);
    for (const [f, n] of [...byFile.entries()].sort((a, b) => b[1] - a[1])) {
      const clean = CLEAN_FILES.includes(f) ? '  [CLEAN-GATED]' : '';
      console.log(`  ${String(n).padStart(3)}  ${f}${clean}`);
    }
    process.exit(0);
  }
  const violations = checkCleanFiles();
  console.log('# INLINE-STYLE COLOR GUARD (clean-file gate)\n');
  if (violations.length === 0) {
    console.log(`PASS — ${CLEAN_FILES.length} clean file(s) route all color through shared theme classes.`);
    process.exit(0);
  }
  console.log(`FAIL — ${violations.length} inline color style(s) in clean-gated file(s):`);
  for (const v of violations) console.log(`  - ${v.file}:${v.line}  ${v.prop}: ${v.value}`);
  process.exit(1);
}
