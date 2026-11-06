#!/usr/bin/env node
// =============================================================================
// ai-usage-ledger — a build that lands without its cost line is a red build
// =============================================================================
// DR-1347 (DR-1330 D8). The Ways review measured that AI spend was tracked per
// DAY on a runner and never per task, and that the file built to answer "this
// model or that one" (delay-ledger.json) held two entries. This keeps the
// slide's project-results table from the build side:
//
//   --check   validates app/src/lib/ai-usage-ledger.json (shape, unique ids,
//             models described, a session's token reading is a subtraction
//             not a guess) and REQUIRES every decision record numbered
//             FIRST_LEDGERED_DR or higher to be named by an entry. A record
//             that lands without its line fails the guards leg.
//   --add     appends an entry from flags, so a session records its own
//             delivery in one command:
//             node scripts/ai-usage-ledger.mjs --add --id <task-id> --date YYYY-MM-DD \
//               --task "..." --drs <the record's id> --prs <pr number> --model claude-fable-5-1 \
//               --wall 0.3 --estimate 8 [--tokens-in N --tokens-out N --usd X] [--notes "..."]
//
// Tokens and dollars stay null where no meter exposes them; the validator
// refuses a cost with no tokens behind it (a guess, not a meter).
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const LEDGER_PATH = 'app/src/lib/ai-usage-ledger.json';
export const FIRST_LEDGERED_DR = 1331;

/** Decision record numbers on disk at or above the first ledgered one. */
export function recordsOnDisk(dir, first = FIRST_LEDGERED_DR) {
  return readdirSync(dir)
    .map((f) => f.match(/^DR-(\d{4})-/))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .filter((n) => n >= first)
    .sort((a, b) => a - b);
}

export function missingLines(recordNumbers, ledgeredDrs) {
  return recordNumbers.filter((n) => !ledgeredDrs.has(`DR-${String(n).padStart(4, '0')}`)).map((n) => `DR-${String(n).padStart(4, '0')}`);
}

/**
 * Pure. The one serialization this file is allowed to be on disk: exactly what
 * `--add` writes, which is `JSON.stringify(ledger, null, 2)` and one newline.
 *
 * NOT TIDINESS — IT IS THE CONFLICT (DR-1369). MEASURED over the last eight
 * landings, the file oscillated between `—` escapes and literal em-dashes:
 *
 *   cbc07181aa 0 escapes · 95227a28bd 4 · f415316c47 0 · 7395ffb28a 0
 *   09d800aa17 4 · 3a073d0c3d 0 · f80bf69dea 0 · eab90722c1 0
 *
 * `--add` writes literal UTF-8; a session that hand-writes the JSON instead
 * writes the escapes, trying to be careful about ASCII. Four lines therefore
 * FLIP every other landing, which makes the whole file conflict on any branch
 * created across a flip even when both sides only appended one entry at the
 * end. Half the catch-up tax on this file was a writer disagreement, not a
 * merge problem, so it is fixed at the writer rather than resolved forever.
 *
 * A number is normalized too: the same re-serialization turned
 * `"wallClockHours": 1.0` into `1`, which is the same value and another
 * conflicting line.
 */
export function canonicalFault(raw, parsed = null) {
  let ledger = parsed;
  if (ledger === null) {
    try { ledger = JSON.parse(raw); } catch { return null; } // a parse error is its own finding
  }
  const canonical = `${JSON.stringify(ledger, null, 2)}\n`;
  if (raw === canonical) return null;
  const escapes = (raw.match(/\\u[0-9a-fA-F]{4}/g) || []).length;
  const why = escapes
    ? `${escapes} \\uXXXX escape(s) where the writer emits literal UTF-8`
    : 'whitespace, key order or number formatting differs from the writer';
  return `${LEDGER_PATH} is not in the writer's own serialization: ${why}. Re-serialize it (or append with --add, which does) so a two-sided append is the only thing that ever conflicts here (DR-1369).`;
}

function flag(name, argv) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const { validateLedger, ledgeredDrs } = await import('../app/src/lib/ai-usage-ledger-rules.js');
  const argv = process.argv.slice(2);
  const path = join(ROOT, LEDGER_PATH);
  const raw = readFileSync(path, 'utf8');
  const ledger = JSON.parse(raw);
  if (argv.includes('--add')) {
    const num = (v) => (v === undefined ? null : Number(v));
    const entry = {
      id: flag('id', argv),
      date: flag('date', argv) || new Date().toISOString().slice(0, 10),
      task: flag('task', argv),
      drs: (flag('drs', argv) || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      prs: (flag('prs', argv) || '')
        .split(',')
        .map((s) => Number(s.trim()))
        .filter(Boolean),
      model: flag('model', argv) || 'claude-fable-5-1',
      tokens: flag('tokens-in', argv) !== undefined ? { in: num(flag('tokens-in', argv)), out: num(flag('tokens-out', argv)) } : null,
      costUsd: flag('usd', argv) !== undefined ? num(flag('usd', argv)) : null,
      wallClockHours: num(flag('wall', argv)),
      estimateWithoutAiHours: num(flag('estimate', argv)),
      notes: flag('notes', argv) || '',
    };
    const next = { ...ledger, entries: [...ledger.entries, entry] };
    const findings = validateLedger(next);
    if (findings.length) {
      console.error(`ai-usage-ledger: the entry is not sound:\n  ${findings.join('\n  ')}`);
      process.exit(1);
    }
    writeFileSync(path, JSON.stringify(next, null, 2) + '\n');
    console.log(
      `ai-usage-ledger: added ${entry.id} (${entry.drs.join(', ')}; ${entry.wallClockHours} h measured, ${entry.estimateWithoutAiHours} h estimated without AI).`
    );
    process.exit(0);
  }
  const findings = validateLedger(ledger);
  const serialization = canonicalFault(raw, ledger);
  if (serialization) findings.push(serialization);
  const missing = missingLines(recordsOnDisk(join(ROOT, 'docs/decisions')), ledgeredDrs(ledger));
  for (const m of missing) findings.push(`${m} landed without a line in ${LEDGER_PATH} — add it with --add (DR-1347)`);
  if (findings.length) {
    console.error(`ai-usage-ledger: ${findings.length} finding(s):\n  ${findings.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`ai-usage-ledger: OK — ${ledger.entries.length} tasks ledgered, every record from DR-${FIRST_LEDGERED_DR} on has its line.`);
}
