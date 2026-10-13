#!/usr/bin/env node
// =============================================================================
// decision-record-guard — a change to the product does not leave without a record
// =============================================================================
// Darrell, 2026-09-14, after three merges in one evening rewrote what a lesson
// looks like with no decision record behind any of them: "Check all lanes today
// for when to get back to our Ways and documentation!!!!!!" and "I want our
// workflow back!!!!!!"
//
// THE GAP WAS ALREADY WRITTEN DOWN AND NEVER CLOSED. The INDEX's own ledger-drift
// finding of 2026-09-13 named the cause in one line -- "a run of fast merges in
// one session with no gate requiring a DR for a Tier-B change" -- and then the
// same thing happened again the next day, to the lesson surface, which is the
// one people read. Writing the cause down is not machinery. This is (DR-0250).
//
// WHY IT RIDES `npm run ship` AND NOT CI, same reasoning as the push-stranding
// guard (DR-0393): CI runs on a branch whose base may be shallow, and the fact
// being checked -- "did this session write down why" -- belongs at the moment of
// pushing, where the author is still present to answer it.
//
// WHAT COUNTS. Any change under app/src, infra/, or scripts/ is product. A
// record is any added or modified file under docs/decisions/ other than
// README.md. Docs-only, test-only and session-note-only pushes pass untouched,
// because those are not decisions.
//
// UNKNOWN IS NEVER GREEN (DR-0076 §8). No origin/main, no git, no network ->
// exit 2 with a plain sentence, never a silent pass.
import { execFileSync } from 'node:child_process';

const BASE = process.env.DR_GUARD_BASE || 'origin/main';
const PRODUCT = [/^app\/src\//, /^infra\//, /^scripts\//];
const RECORD = (f) => f.startsWith('docs/decisions/') && !f.endsWith('README.md');

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

function changedFiles() {
  const merge = git('merge-base', 'HEAD', BASE);
  return git('diff', '--name-only', `${merge}...HEAD`).split('\n').filter(Boolean);
}

function main() {
  let files;
  try {
    files = changedFiles();
  } catch (e) {
    console.error(`decision-record-guard: cannot compare against ${BASE} — ${e.message}`);
    console.error('Do not read this as safe to push. Fetch the base and run again.');
    process.exit(2);
  }
  if (!files.length) { console.log('decision-record-guard: no changes against the base.'); return; }

  const product = files.filter((f) => PRODUCT.some((re) => re.test(f)));
  if (!product.length) {
    console.log(`decision-record-guard: ${files.length} changed, none of it product. OK.`);
    return;
  }
  const records = files.filter(RECORD);
  if (records.length) {
    console.log(`decision-record-guard: ${product.length} product file(s), ${records.length} decision record file(s). OK.`);
    return;
  }
  console.error('decision-record-guard: THIS PUSH CHANGES THE PRODUCT AND CARRIES NO DECISION RECORD.');
  console.error('');
  for (const f of product.slice(0, 12)) console.error(`  ${f}`);
  if (product.length > 12) console.error(`  ...and ${product.length - 12} more`);
  console.error('');
  console.error('Write the record in docs/decisions/ (one decision per file, DR-0011),');
  console.error('add its row to docs/decisions/INDEX.md, then push.');
  console.error('This is the gap the 2026-09-13 ledger-drift finding named and did not close.');
  process.exit(1);
}

main();
