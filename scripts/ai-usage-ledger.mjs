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

function flag(name, argv) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const { validateLedger, ledgeredDrs } = await import('../app/src/lib/ai-usage-ledger-rules.js');
  const argv = process.argv.slice(2);
  const path = join(ROOT, LEDGER_PATH);
  const ledger = JSON.parse(readFileSync(path, 'utf8'));
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
  const missing = missingLines(recordsOnDisk(join(ROOT, 'docs/decisions')), ledgeredDrs(ledger));
  for (const m of missing) findings.push(`${m} landed without a line in ${LEDGER_PATH} — add it with --add (DR-1347)`);
  if (findings.length) {
    console.error(`ai-usage-ledger: ${findings.length} finding(s):\n  ${findings.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`ai-usage-ledger: OK — ${ledger.entries.length} tasks ledgered, every record from DR-${FIRST_LEDGERED_DR} on has its line.`);
}
