#!/usr/bin/env node
// =============================================================================
// file-budget-guard — no source file grows past its ceiling, and no new one is
// born big (DR-1339, DR-1330 D9b)
// =============================================================================
// Darrell, 2026-11-05: "I also don't like bloated code!!!!!!!!!" Measured that
// day: 17 files under app/src (tests aside) over 1,500 lines, the largest
// 29,435, and only one of them under a brake (the shell, monolith-budget-guard).
// This generalises that brake:
//   • every file named in scripts/file-budgets.json has a ceiling, re-frozen
//     DOWN only by `--generate` (the ratchet, DR-0075); growing past it fails;
//   • any other file under app/src (tests excluded) over NEW_FILE_MAX lines
//     fails — a new file is born small, or it is split.
// To RAISE a ceiling, edit the file by hand with a one-line reason, the way
// monolith-budget.json records its raises. Pure functions exported for vitest;
// proven to catch on a grown file and on a new big one.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const BUDGETS = 'scripts/file-budgets.json';
export const NEW_FILE_MAX = 1500;

export function countLines(src) { return src.length ? src.replace(/\n$/, '').split('\n').length : 0; }

/** @returns {string[]} findings */
export function judge({ counts, budgets, newFileMax = NEW_FILE_MAX }) {
  const out = [];
  for (const [file, lines] of Object.entries(counts)) {
    const ceiling = budgets[file];
    if (typeof ceiling === 'number') {
      if (lines > ceiling) out.push(`${file}: ${lines} lines, over its ceiling of ${ceiling} (shrink it, or raise the ceiling by hand with a reason)`);
    } else if (lines > newFileMax) {
      out.push(`${file}: ${lines} lines, a file outside the baseline must stay under ${newFileMax} (split it)`);
    }
  }
  for (const file of Object.keys(budgets)) if (!(file in counts)) out.push(`${file}: in the baseline but not on disk — remove its line from ${BUDGETS}`);
  return out;
}

/** The re-frozen baseline: every budgeted file at its current count, DOWN only. */
export function regenerate(counts, budgets) {
  const next = {};
  for (const [file, ceiling] of Object.entries(budgets)) {
    if (!(file in counts)) continue;
    next[file] = Math.min(ceiling, counts[file]);
  }
  return next;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const files = execFileSync('git', ['ls-files', '-z', '--', 'app/src/**/*.js', 'app/src/**/*.jsx'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0').filter((p) => p && !/\/__tests__\//.test(p) && !/\.test\./.test(p));
  const counts = Object.fromEntries(files.map((p) => [p, countLines(readFileSync(join(ROOT, p), 'utf8'))]));
  const doc = JSON.parse(readFileSync(join(ROOT, BUDGETS), 'utf8'));
  if (process.argv.includes('--generate')) {
    doc.budgets = regenerate(counts, doc.budgets);
    writeFileSync(join(ROOT, BUDGETS), JSON.stringify(doc, null, 2) + '\n');
    console.log(`file-budget-guard: re-froze ${Object.keys(doc.budgets).length} ceiling(s), down only.`);
    process.exit(0);
  }
  const findings = judge({ counts, budgets: doc.budgets });
  if (findings.length) {
    console.error(`file-budget-guard: ${findings.length} finding(s):\n  ${findings.join('\n  ')}`);
    process.exit(1);
  }
  const over = Object.values(doc.budgets).length;
  console.log(`file-budget-guard: OK — ${files.length} source files; ${over} budgeted file(s) at or under their ceilings; no other file over ${NEW_FILE_MAX} lines.`);
}
