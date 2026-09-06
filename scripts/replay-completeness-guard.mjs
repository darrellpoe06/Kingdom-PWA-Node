#!/usr/bin/env node
// =============================================================================
// replay-completeness-guard — "the counts match" is not "every file applied"
// =============================================================================
// THE INCIDENT THIS ENDS (measured live, 2026-09-06 — DR-0331).
//
// infra/nas-supabase/replay_migrations.sh decided success with:
//
//     TOTAL=$(ls "$MIG_DIR"/*.sql | wc -l) + 1
//     DONE_NOW=$(SELECT count(*) FROM public._sovereign_replay)
//     [ "$DONE_NOW" = "$TOTAL" ] && exit 0
//
// A COUNT is a proxy for the real question, and it inverts on one ordinary
// event: renaming a migration that was already applied.
//
//   0168-legal-document-shelves.sql applied cleanly and was ledgered. The
//   sovereign lane was green at ledger 182/182 (runs 445, 446). The file was
//   then renamed to 0169-… to dodge an ordinal collision on the HOSTED
//   database — a different database with a different guard. The next sovereign
//   run saw an unknown filename, applied it (idempotent, harmless), and
//   ledgered the new name. Now 183 rows against 182 files, and the lane failed
//   reporting "the app's database is BEHIND the repo" — the exact opposite of
//   the truth. Nothing was behind. One row named a file that no longer existed.
//
// A count can be wrong in BOTH directions; the question it stands in for
// cannot. The fixed script asks it directly — is any file in MIG_DIR absent
// from the ledger? — which is strictly stricter, and treats orphan rows as
// bookkeeping to report rather than a database to migrate.
//
// This guard keeps that fix from being undone. It refuses:
//   1. a success condition that compares a ledger COUNT to a file COUNT, and
//   2. a script that never checks per-file membership at all.
//
// Deterministic, $0, no DB. Importable for vitest; CLI:
//   node scripts/replay-completeness-guard.mjs
// =============================================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REPLAY_SCRIPT = join(ROOT, 'infra/nas-supabase/replay_migrations.sh');

// Strip comments so the PROSE above (which quotes the defective line on
// purpose, so the next reader understands it) is never mistaken for the code.
export function stripShellComments(source) {
  return String(source)
    .split('\n')
    .map((line) => (/^\s*#/.test(line) ? '' : line))
    .join('\n');
}

/**
 * findings(source) -> [{ rule, detail }]
 * Empty means the script decides success by per-file membership.
 */
export function findings(source) {
  const code = stripShellComments(source);
  const out = [];

  // 1. The count-equality success condition, in the shapes it actually takes.
  //    Matches `[ "$DONE_NOW" = "$TOTAL" ] && exit 0` and its permutations.
  const countEquality =
    /\[\s*"?\$\{?(DONE_NOW|DONE|LEDGER[A-Z_]*)\}?"?\s*(?:=|-eq)\s*"?\$\{?(TOTAL|EXPECTED[A-Z_]*)\}?"?\s*\]/;
  if (countEquality.test(code)) {
    out.push({
      rule: 'count-equality-success',
      detail:
        'success is decided by comparing a ledger COUNT to a file COUNT. A renamed migration leaves a stale row, the counts diverge, and the lane reports "database is BEHIND" on a database that is fully up to date. Ask per-file membership instead.',
    });
  }

  // 2. The positive requirement: the script must test membership per file.
  //    Without this, a rewrite could drop the count comparison and still not
  //    answer the real question — a green that means nothing.
  const perFileMembership =
    /SELECT\s+1\s+FROM\s+public\._sovereign_replay\s+WHERE\s+fname\s*=/i;
  const countsMissing = /MISSING=\$\(\(\s*MISSING\s*\+\s*1\s*\)\)/;
  if (!(perFileMembership.test(code) && countsMissing.test(code))) {
    out.push({
      rule: 'no-per-file-completeness-check',
      detail:
        'the script never establishes that every migration file is present in the ledger. Whatever it exits on, it is not answering "is the database up to date".',
    });
  }

  return out;
}

export function guard(file = REPLAY_SCRIPT) {
  return findings(readFileSync(file, 'utf8'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bad = guard();
  if (bad.length) {
    console.error('replay-completeness-guard: FAIL');
    for (const f of bad) console.error(`  - ${f.rule}: ${f.detail}`);
    process.exit(1);
  }
  console.log('replay-completeness-guard: ok — success is decided per file, not by a count');
}
