#!/usr/bin/env node
// =============================================================================
// index-row — a decision's INDEX.md row goes where no sibling's row goes (DR-1602)
// =============================================================================
// MEASURED 2026-11-19: every landing made the other open decision PRs conflict
// in docs/decisions/INDEX.md, because every branch appended its row at the end
// of the live table, the same spot. `.gitattributes` names a `dr-ledger` merge
// driver, but GitHub's own PR merge runs no merge driver at all: tested on
// throwaway PRs the same day, `merge=union` (git's built-in) still answered
// "405 Pull Request has merge conflicts" (#2815, and its control #2813).
//
// So the row is PLACED, the way DR-1536 places a usage-ledger entry: at a slot
// read from its own DR id (FNV-1a, deterministic), inside the live table and
// never among its last TAIL_GUARD rows. Two branches adding at once land in
// different places and GitHub merges both cleanly. Row order carries no
// meaning here; every reader finds a row by its id.
//
//   node scripts/index-row.mjs --add '| [DR-NNNN](DR-NNNN-slug.md) | ... |'
//   node scripts/index-row.mjs --check     (business-systems-guard runs this)
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { placementIndex } from './ai-usage-ledger.mjs';
import { liveTable, tailFindings, PLACED_FROM, ROW } from './lib/decision-pointer.mjs';

export { liveTable, tailFindings, PLACED_FROM };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const INDEX_PATH = 'docs/decisions/INDEX.md';
/** Insert `row` at its slot. Refuses a malformed row or a DR already in the file. */
export function placeRow(text, row) {
  const m = ROW.exec(row);
  if (!m || !row.trimEnd().endsWith('|')) throw new Error('not an INDEX row: it must start "| [DR-NNNN](" and end with "|"');
  if (text.split('\n').some((l) => l.startsWith(`| [DR-${m[1]}]`))) throw new Error(`DR-${m[1]} already has a row`);
  const lines = text.split('\n');
  const t = liveTable(lines);
  if (!t) throw new Error('no table of decision rows found');
  const rows = t[1] - t[0] + 1;
  const slot = placementIndex(`DR-${m[1]}`, rows);
  lines.splice(t[0] + slot, 0, row.trimEnd());
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const path = join(ROOT, INDEX_PATH);
  const text = readFileSync(path, 'utf8');
  const i = process.argv.indexOf('--add');
  if (i > 0) {
    try {
      writeFileSync(path, placeRow(text, process.argv[i + 1] || ''));
    } catch (e) {
      console.error(`index-row: ${e.message}`);
      process.exit(1);
    }
    console.log('index-row: placed. Commit INDEX.md with the record.');
    process.exit(0);
  }
  const f = tailFindings(text);
  for (const x of f) console.error(x);
  console.log(f.length ? `index-row: ${f.length} finding(s)` : 'index-row: OK — no placed row sits in the table tail');
  process.exit(f.length ? 1 : 0);
}
