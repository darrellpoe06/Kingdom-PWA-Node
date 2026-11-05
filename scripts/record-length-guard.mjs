#!/usr/bin/env node
// =============================================================================
// record-length-guard — a decision record is a record, not a session note
// =============================================================================
// DR-1339 (DR-1330 D9a). Darrell, 2026-11-05: "I also don't like bloated code
// ... DRs". Measured that day: 894 of 1,224 records over the README's own
// "~25–45 lines"; the median 62, the longest 1,547; one INDEX row of 63,818
// characters. The ledger is append-only, so the past is not rewritten (DR-0011);
// the ratchet holds from FIRST_RATCHETED_DR on:
//   • a record file is at most MAX_LINES lines (the five-step chain fits in 30);
//   • its INDEX row is at most MAX_ROW_CHARS characters — what a reader can
//     verify at a glance, which is the row's whole purpose (README rule 5).
// The narrative belongs in the session note the record cites (README rule 6).
// Pure functions exported for vitest; proven to catch on an over-long fixture.
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FIRST_RATCHETED_DR = 1339;
export const MAX_LINES = 60;
export const MAX_ROW_CHARS = 700;

export function recordNumber(filename) {
  const m = filename.match(/^DR-(\d{4})-/);
  return m ? Number(m[1]) : null;
}

/** @returns {string[]} findings */
export function judge({ records, indexText, first = FIRST_RATCHETED_DR, maxLines = MAX_LINES, maxRow = MAX_ROW_CHARS }) {
  const out = [];
  for (const [file, text] of Object.entries(records)) {
    const n = recordNumber(file);
    if (n === null || n < first) continue;
    const lines = text.replace(/\n+$/, '').split('\n').length;
    if (lines > maxLines) out.push(`${file}: ${lines} lines (the ratchet is ${maxLines}; put the narrative in the session note the record cites)`);
    const id = `DR-${String(n).padStart(4, '0')}`;
    const row = indexText.split('\n').find((l) => l.startsWith(`| [${id}]`));
    if (row && row.length > maxRow)
      out.push(`${id}: INDEX row is ${row.length} characters (the ratchet is ${maxRow}; a row is what a reader verifies at a glance)`);
  }
  return out;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const dir = join(ROOT, 'docs/decisions');
  const files = readdirSync(dir).filter((f) => /^DR-\d{4}-.*\.md$/.test(f));
  const records = Object.fromEntries(files.map((f) => [f, readFileSync(join(dir, f), 'utf8')]));
  const findings = judge({ records, indexText: readFileSync(join(dir, 'INDEX.md'), 'utf8') });
  const judged = files.filter((f) => (recordNumber(f) || 0) >= FIRST_RATCHETED_DR).length;
  if (findings.length) {
    console.error(`record-length-guard: ${findings.length} finding(s):\n  ${findings.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`record-length-guard: OK — ${judged} record(s) from DR-${FIRST_RATCHETED_DR} on within ${MAX_LINES} lines and a ${MAX_ROW_CHARS}-character row.`);
}
