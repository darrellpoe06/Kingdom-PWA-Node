#!/usr/bin/env node
// =============================================================================
// table-a11y-guard — every data table is navigable by a screen reader
// =============================================================================
// Darrell 2026-08-14: "are our data tables... html data tables? or python etc...
// so screenreader works well? opportunities and constraints"
//
// The answer to the first half was good news: they are REAL <table>/<thead>/
// <tbody>/<th>, rendered by React into real HTML, not div-soup and nothing
// Python-rendered on the user-facing side. The measured second half was not:
// 128 <th> in the tree and only 18 carried `scope`, and NOT ONE table had a
// <caption>.
//
// WHY THOSE TWO, AND WHY THEY ARE NOT COSMETIC:
//   scope — without it a screen reader cannot reliably tie a cell to its
//     header. A blind steward tabbing the Debts table hears "4,812" with no
//     idea whether that is the balance, the payoff, or the minimum. The data is
//     all there and it is useless, which is worse than absent because it
//     invites a confident wrong decision.
//   caption — without it, entering a table announces "table, 7 columns" and
//     nothing else. On a page holding several tables the user cannot tell which
//     one they are in. `.sr-only` keeps it invisible to sighted users, so this
//     costs the visual design exactly nothing.
//
// This is the sibling of large-print-guard (the SEE half for low vision) and
// legibility-guard (contrast). Same shape on purpose: a pure scanner other code
// can import, a CLI, and a test that proves it catches the break.
//
// SCOPE OF THE CHECK — deliberately narrow, because a noisy gate gets disabled
// and a disabled gate protects nothing:
//   * only files containing a real <table>
//   * only <th> elements (a <td> needs nothing)
//   * a <th> inside <thead> wants scope="col"; a row header wants scope="row";
//     either satisfies the check, since which one is right is the author's call
//   * EXCLUSIONS carry a written reason, like the sibling guards
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC_DIR = join(ROOT, 'app', 'src');

// A table excluded here must say WHY. No silent carve-outs (the rule the
// large-print guard already enforces on itself).
export const EXCLUSIONS = {
  // 'components/Foo.jsx': 'why this table cannot carry scope/caption',
};

/** Strip comments so a <th> inside a code sample never counts. */
export function stripCommentLines(src) {
  return String(src || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
}

/**
 * Find the a11y gaps in one source file.
 * Pure: takes source text, returns findings. No I/O, so tests drive it directly.
 */
export function scanSourceForTableA11y(src) {
  const out = { tables: 0, ths: 0, scoped: 0, captions: 0, violations: [], debt: [] };
  const clean = stripCommentLines(src);
  if (!/<table[\s>]/.test(clean)) return out;

  out.tables = (clean.match(/<table[\s>]/g) || []).length;
  out.captions = (clean.match(/<caption[\s>]/g) || []).length;

  // Every <th ...> opening tag, with its attributes.
  const thRe = /<th(\s[^>]*?)?>/g;
  let m;
  while ((m = thRe.exec(clean))) {
    out.ths += 1;
    const attrs = m[1] || '';
    const line = clean.slice(0, m.index).split('\n').length;
    if (/\bscope\s*=/.test(attrs)) {
      out.scoped += 1;
    } else {
      out.violations.push({
        line,
        kind: 'th-without-scope',
        detail: '<th> has no scope="col"/"row" — a screen reader cannot tie cells to this header',
      });
    }
  }

  // TRACKED DEBT, not a blocker (DR-0075: a deliberate non-improvement carries a
  // why + a re-review date). A caption must NAME the table for the person who
  // cannot see it; deriving one from the header row yields "Table of Account,
  // Entity, Rate", which satisfies a linter and helps nobody. These 25 names
  // want a human who knows what each table is FOR.
  // re-review: 2026-09-15 — write real captions, then promote this to blocking.
  if (out.captions < out.tables) {
    out.debt.push({
      line: 0,
      kind: 'table-without-caption',
      detail: `${out.tables} table(s), ${out.captions} caption(s) — unnamed tables announce only "table, N columns"`,
    });
  }
  return out;
}

/** Every app source file, minus excluded ones. */
export function listScannedFiles(dir = SRC_DIR) {
  const found = [];
  const walk = (d) => {
    let entries = [];
    try { entries = readdirSync(d); } catch { return; }
    for (const name of entries) {
      const full = join(d, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        if (name === '__tests__' || name === 'node_modules') continue;
        walk(full);
        continue;
      }
      if (!/\.(jsx?|tsx?)$/.test(name)) continue;
      const rel = relative(SRC_DIR, full).split('\\').join('/');
      if (Object.prototype.hasOwnProperty.call(EXCLUSIONS, rel)) continue;
      found.push(rel);
    }
  };
  walk(dir);
  return found.sort();
}

/** Scan the whole app. Returns violations attributed to their file. */
export function scanAppTables(dir = SRC_DIR) {
  const violations = [];
  const debt = [];
  const totals = { files: 0, tables: 0, ths: 0, scoped: 0, captions: 0 };
  const badExclusions = Object.entries(EXCLUSIONS)
    .filter(([, reason]) => typeof reason !== 'string' || reason.trim().length < 10)
    .map(([file]) => file);

  for (const rel of listScannedFiles(dir)) {
    let src = '';
    try { src = readFileSync(join(SRC_DIR, rel), 'utf8'); } catch { continue; }
    const r = scanSourceForTableA11y(src);
    if (!r.tables) continue;
    totals.files += 1;
    totals.tables += r.tables;
    totals.ths += r.ths;
    totals.scoped += r.scoped;
    totals.captions += r.captions;
    for (const v of r.violations) violations.push({ file: rel, ...v });
    for (const d of r.debt) debt.push({ file: rel, ...d });
  }
  return { violations, debt, totals, badExclusions };
}

// ----------------------------------------------------------------------------- CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { violations, debt, totals } = scanAppTables();
  console.log('# TABLE A11Y GUARD (screen-reader navigability of data tables)\n');
  console.log(`Files with tables: ${totals.files} | tables ${totals.tables} | <th> ${totals.ths} | scoped ${totals.scoped} | captions ${totals.captions}\n`);
  if (debt.length) {
    console.log(`Tracked debt (reported, does NOT block — re-review 2026-09-15): ${debt.length} table group(s) without a caption:`);
    for (const d of debt) console.log(`  ${d.file}: ${d.detail}`);
    console.log('');
  }
  if (!violations.length) {
    console.log(`table-a11y-guard: OK — all ${totals.ths} <th> carry scope. ${debt.length} caption item(s) tracked.`);
    process.exit(0);
  }
  const byFile = new Map();
  for (const v of violations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file).push(v);
  }
  for (const [file, vs] of byFile) {
    console.log(`${file} — ${vs.length} finding(s)`);
    for (const v of vs.slice(0, 4)) console.log(`  line ${v.line}: ${v.kind} — ${v.detail}`);
    if (vs.length > 4) console.log(`  ... and ${vs.length - 4} more`);
  }
  console.log(`\ntable-a11y-guard: ${violations.length} violation(s).`);
  process.exit(1);
}
