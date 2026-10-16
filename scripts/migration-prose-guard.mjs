#!/usr/bin/env node
// =============================================================================
// migration-prose-guard — a sentence outside a comment is not SQL
// =============================================================================
// THE INCIDENT (2026-10-16, DR-1075/0298). Rebuilding migration 0298 on top of
// 0257, a script sliced the source from `body.index('CREATE OR REPLACE
// FUNCTION')` — and the FIRST occurrence of that phrase was inside 0257's own
// header comment:
//
//     -- IDEMPOTENT: CREATE OR REPLACE FUNCTION, same RETURNS shape (jsonb).
//
// So the slice began mid-comment and left this behind, with no `--`:
//
//     CREATE OR REPLACE FUNCTION, same RETURNS shape (jsonb).
//
// Postgres refused the file. BOTH databases refused it, and every migration
// queued after it waited behind the refusal until a person noticed.
//
// WHAT DID NOT CATCH IT, and this is the whole argument for this file:
//   · 23 deterministic gates — not one of them parses SQL;
//   · 26,422 tests — none applies a migration;
//   · the migration's OWN test, which asserted the file still contained
//     "CREATE OR REPLACE FUNCTION" to prove its comment-stripper had not
//     blanked it. That assertion PASSED **because of the broken line**: the
//     stripper dropped `--` lines, the corrupted line had no `--`, so it
//     survived and satisfied the check written to prove the file was intact.
//     A test can be satisfied by the very defect it exists to find.
//
// THE RULE. SQL statements end in `;`. English sentences end in `.`. So a line
// that is outside a comment, outside a dollar-quoted body, and ends in a
// period is prose that has lost its `--` — which is exactly the shape of this
// failure and of the copy-paste that produces it.
//
// NARROW ON PURPOSE. It does not try to parse SQL; a half-parser would cry
// wolf and get switched off. It asks one question with one honest answer.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = [
  join(ROOT, 'infra', 'supabase', 'migrations-auto'),
  join(ROOT, 'infra', 'supabase', 'tests'),
];

/**
 * Pure. Lines of prose that have lost their comment marker.
 *
 * Dollar-quoted bodies ($$ … $$, $tag$ … $tag$) are skipped entirely: a
 * function body is a string literal to the parser, and a period inside one is
 * none of our business.
 */
export function proseOutsideComment(text, file = '<sql>') {
  const out = [];
  let dollar = null;                         // the open tag, or null
  let block = false;                         // inside /* … */
  const lines = String(text || '').split('\n');

  lines.forEach((raw, i) => {
    // BLOCK COMMENTS are prose by design — a /* … */ banner is full of
    // sentences and none of them is SQL.
    let work = raw;
    if (block) {
      const end = work.indexOf('*/');
      if (end === -1) return;
      block = false;
      work = work.slice(end + 2);
    }
    for (;;) {
      const start = work.indexOf('/*');
      if (start === -1) break;
      const end = work.indexOf('*/', start + 2);
      if (end === -1) { block = true; work = work.slice(0, start); break; }
      work = work.slice(0, start) + ' ' + work.slice(end + 2);
    }

    // A TRAILING `--` COMMENT is the common shape of a column definition:
    //   notes text,   -- arrangement notes, who leads, etc.
    // The period belongs to the comment, not to the statement. Ten real lines
    // in this repo look like that, and the first version of this guard flagged
    // every one of them — a guard that cries wolf gets switched off.
    const dash = work.indexOf('--');
    if (dash !== -1) work = work.slice(0, dash);

    const line = work.trim();

    // Track dollar-quoting — everything inside a body is opaque.
    const tags = work.match(/\$[A-Za-z_]*\$/g) || [];
    for (const t of tags) {
      if (dollar === null) dollar = t;
      else if (dollar === t) dollar = null;
    }
    if (dollar !== null) return;             // inside a body (or just opened one)
    if (tags.length) return;                 // the line that closed it

    if (!line) return;
    if (!line.endsWith('.')) return;

    // A decimal at end of line ("… DEFAULT 0.") is not a sentence, and neither
    // is an ellipsis inside a quoted string on an otherwise-ordinary line.
    if (/\d\.$/.test(line)) return;
    if (/^[^']*'[^']*\.'\s*[,;)]?$/.test(line)) return;

    out.push({ file, line: i + 1, text: line.slice(0, 100) });
  });

  return out;
}

function sqlFiles() {
  const out = [];
  for (const dir of DIRS) {
    let names = [];
    try { names = readdirSync(dir); } catch { continue; }
    for (const n of names) if (n.endsWith('.sql')) out.push(join(dir, n));
  }
  return out;
}

export function main() {
  const files = sqlFiles();
  const bad = [];
  for (const f of files) {
    bad.push(...proseOutsideComment(readFileSync(f, 'utf8'), relative(ROOT, f)));
  }

  if (bad.length === 0) {
    console.log(`migration-prose-guard: OK — ${files.length} SQL file(s), no prose outside a comment.`);
    return 0;
  }

  console.log('migration-prose-guard FAILED — Postgres will refuse these files, and every migration behind them waits:\n');
  for (const b of bad) console.log(`  ${b.file}:${b.line}  ${b.text}`);
  console.log('\nA line outside a comment that ends in a period is English, not SQL —');
  console.log('usually a header line that lost its "--" when the file was sliced or pasted.');
  console.log('This is the 0298 incident (2026-10-16): one such line, both databases refusing');
  console.log('the file, and the migration queue stopped behind it.');
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main());
