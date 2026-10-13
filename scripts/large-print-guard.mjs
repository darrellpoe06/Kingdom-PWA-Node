#!/usr/bin/env node
// =============================================================================
// large-print-guard — fixed-px font sizes must not exist on app surfaces
// =============================================================================
// WHY (COMMUNITY-FIRST-MISSION + DR-0145/DR-0147): the large-print control
// (lib/text-size.js, A / A+ / A++ / A+++ / A44) scales the document ROOT
// font-size, so only rem/em-based text grows. A fixed-px font size —
// `text-[10px]` or `style={{ fontSize: '11px' }}` — stays tiny at EVERY step,
// which is exactly the failure COLG staff reported from the church computer
// (2026-07-24, Eldris Moore's feedback with screenshots: "the print is so
// small you can't see no matter what font you have it at"). The fix pattern is
// established (2026-06-17 coverage rule): author the same size in rem at the
// 16px baseline (a 10px label becomes text-[0.625rem]) — pixel-identical at
// Normal, scaling at every larger step.
//
// Scope: ALL of app/src (components, the monolith, lib JSX) — the church-tab
// sweep shipped first (PR #1038), then the app-wide sweep converted every
// remaining surface, so the guard now holds the whole app at zero. New files
// are guarded by default; there is no allowlist to keep in sync. Comments are
// stripped before scanning so documentation may name the bug pattern freely.
//
// Complements scripts/consistency-guard.mjs: that ratchet freezes per-file
// drift counts against a baseline; this guard is the absolute zero for the
// fixed-px class (DR-0076 §2: gates over claims). The paired test
// (app/src/__tests__/large-print-guard.test.js) proves it catches.
//
// CLI: node scripts/large-print-guard.mjs   (exit 1 on violations)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'app', 'src');

// Files where a fixed-px font size is INTENTIONAL, with the reason on record.
// Empty today — TextSizeControl's fixed labels use a template literal the
// patterns don't match (and are documented in-file). Add entries only with a
// reason; an entry without a reason string is itself a gate failure.
export const EXCLUSIONS = {
  // 'components/Example.jsx': 'why fixed px is correct here',
};

// A fixed-px font size, in either authoring form:
//   1. Tailwind arbitrary font-size class: text-[10px] (word-boundary so
//      colors/tracking/min-h/etc. never match)
//   2. Inline style px: fontSize: '11px' / "11px" / fontSize: 11 (a bare
//      numeric literal is px in React). rem/em values never match.
const PX_CLASS_RE = /\btext-\[\d+(?:\.\d+)?px\]/g;
const PX_INLINE_RE = /fontSize:\s*(?:['"]\d+(?:\.\d+)?px['"]|\d+(?:\.\d+)?\s*[,}])/g;

/**
 * Blank out comment lines so docs may name the bug pattern without tripping
 * the guard. Line-based heuristic (a trimmed line starting with //, /* or *):
 * covers the codebase's comment style without a full JS parser; a trailing
 * same-line comment carrying the literal pattern would still be flagged,
 * which errs on the safe side.
 */
export function stripCommentLines(src) {
  return String(src)
    .split('\n')
    .map((l) => {
      const t = l.trim();
      return (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) ? '' : l;
    })
    .join('\n');
}

/**
 * Scan one source string for fixed-px font sizes (comments stripped).
 * Returns violations as { line, match } records. Pure — unit-testable.
 */
export function scanSourceForFixedPx(src) {
  const violations = [];
  const lines = stripCommentLines(src).split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const re of [PX_CLASS_RE, PX_INLINE_RE]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(lines[i])) !== null) {
        violations.push({ line: i + 1, match: m[0].trim() });
      }
    }
  }
  return violations;
}

/** Recursively list every scannable source file under app/src. */
export function listScannedFiles(dir = SRC_DIR) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        if (name === '__tests__' || name === 'node_modules') continue;
        walk(p);
        continue;
      }
      if (!/\.(jsx|js)$/.test(name) || /\.test\./.test(name)) continue;
      const rel = relative(SRC_DIR, p).replace(/\\/g, '/');
      if (Object.prototype.hasOwnProperty.call(EXCLUSIONS, rel)) continue;
      out.push(rel);
    }
  };
  walk(dir);
  return out.sort();
}

/**
 * Scan every app surface file. Returns
 * { scanned: string[], violations: {file,line,match}[], badExclusions: string[] }.
 * An exclusion without a written reason is itself a violation of the gate's
 * contract, surfaced so the list can never rot into silent carve-outs.
 */
export function scanAppSurfaces(dir = SRC_DIR) {
  const badExclusions = Object.entries(EXCLUSIONS)
    .filter(([, reason]) => typeof reason !== 'string' || reason.trim().length < 10)
    .map(([f]) => f);
  const scanned = listScannedFiles(dir);
  const violations = [];
  for (const f of scanned) {
    for (const v of scanSourceForFixedPx(readFileSync(join(dir, f), 'utf8'))) {
      violations.push({ file: f, ...v });
    }
  }
  return { scanned, violations, badExclusions };
}

// CLI entry
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { scanned, violations, badExclusions } = scanAppSurfaces();
  if (badExclusions.length) {
    console.error(`large-print-guard: exclusions missing a written reason: ${badExclusions.join(', ')}`);
    process.exit(1);
  }
  if (violations.length) {
    for (const v of violations) console.error(`  ${v.file}:${v.line}  ${v.match}`);
    console.error(`large-print-guard: ${violations.length} fixed-px font size(s) across ${scanned.length} scanned files — these ignore the large-print control. Author in rem (px/16).`);
    process.exit(1);
  }
  console.log(`large-print-guard: OK — ${scanned.length} app source files, no fixed-px font sizes.`);
}
