// @vitest-environment node
// =============================================================================
// db-migrate-apply — the ledger is READ before it is GUESSED (DR-1143)
// =============================================================================
// THE INCIDENT (2026-10-20, db-migrate run 39501068881, main 458171d53).
//
// The run applied TWO files where one was new:
//
//   === applying 0203-a-mortgage-in-line-items-...sql ===
//   === applying 0304-your-words-can-be-withdrawn-...sql ===
//   --- summary: applied=2  skipped=301  failed=0 ---
//
// 0203 had not changed and its ledger row was fine. Its checksum SELECT failed
// once; the script sent that stderr to /dev/null and read `|| echo ""` as "no
// row", and "no row" had always meant "never applied". 0203 defines
// obligation_set_lines in its first shape; 0205 had replaced it with the sum
// rule. Re-applying 0203 ALONE put the older body back on the live database,
// and the live-definition witness in the same job caught it:
//
//   obligation_set_lines — live definition is older than 0205-the-sum-rule-...
//
// Two faults, two gates here, each run against the REAL shipped script with a
// stub `psql` first on PATH (the same harness as db-migrate-ledger-rejection):
//   1. a FAILED ledger read is not an EMPTY ledger read — the run stops rather
//      than apply on a guess, and a transient failure is retried first;
//   2. when a file applies and a LATER file defines one of the same functions,
//      the later file is applied again, so the chain ends on the newest body.
import { describe, it, expect, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, chmodSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const SCRIPT = join(REPO, 'scripts', 'db-migrate-apply.sh');

const FILES = {
  '0203-doors.sql': 'CREATE TABLE IF NOT EXISTS doors (id int);\nCREATE OR REPLACE FUNCTION public.obligation_set_lines(a uuid) RETURNS void LANGUAGE sql AS $$ SELECT 1 $$;\n',
  '0204-days.sql': 'CREATE OR REPLACE FUNCTION public.days_post(a uuid) RETURNS void LANGUAGE sql AS $$ SELECT 1 $$;\n',
  '0205-sum-rule.sql': 'CREATE OR REPLACE FUNCTION public.obligation_set_lines(a uuid) RETURNS void LANGUAGE sql AS $$ SELECT 2 $$;\n',
  '0206-plan.sql': 'CREATE TABLE IF NOT EXISTS plan (id int);\n',
};

/**
 * A sandbox with the four files above and a stub psql that answers the
 * checksum SELECT per `mode`:
 *   'all-recorded'   every file's row holds its real checksum (nothing to do)
 *   'stale-0203'     0203's row holds an old checksum; the rest are current
 *   'read-fails-0204' the SELECT for 0204 exits 1 every time
 *   'read-flaky-0204' the SELECT for 0204 exits 1 twice, then answers
 * Every other call (bootstrap, DDL apply, ledger INSERT) succeeds.
 */
function sandbox(mode) {
  const dir = mkdtempSync(join(tmpdir(), 'dbmig-ledger-'));
  const mig = join(dir, 'infra', 'supabase', 'migrations-auto');
  mkdirSync(mig, { recursive: true });
  for (const [name, body] of Object.entries(FILES)) writeFileSync(join(mig, name), body);
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'psql'), `#!/usr/bin/env bash
MODE="${mode}"
DIR="${mig}"
COUNT="${dir}/reads-0204"
for a in "$@"; do
  case "$a" in
    *"SELECT checksum FROM"*)
      name=$(printf '%s' "$a" | sed -E "s/.*filename='([^']+)'.*/\\1/")
      if [ "$name" = "0204-days.sql" ]; then
        if [ "$MODE" = "read-fails-0204" ]; then echo "psql: error: connection to server was lost" >&2; exit 2; fi
        if [ "$MODE" = "read-flaky-0204" ]; then
          n=$(cat "$COUNT" 2>/dev/null || echo 0); n=$((n+1)); echo "$n" > "$COUNT"
          if [ "$n" -le 2 ]; then echo "psql: error: connection to server was lost" >&2; exit 2; fi
        fi
      fi
      if [ "$MODE" = "stale-0203" ] && [ "$name" = "0203-doors.sql" ]; then echo "0000000000000000000000000000000000000000000000000000000000000000"; exit 0; fi
      sha256sum "$DIR/$name" | cut -d' ' -f1
      exit 0
      ;;
  esac
done
exit 0
`);
  chmodSync(join(bin, 'psql'), 0o755);
  return { dir, bin };
}

function runApply(mode) {
  const { dir, bin } = sandbox(mode);
  const r = spawnSync('bash', [SCRIPT], {
    cwd: dir,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SUPABASE_DB_URL: 'postgres://stub' },
    encoding: 'utf8',
  });
  rmSync(dir, { recursive: true, force: true });
  // stdout and stderr together: the retry warnings are written to stderr on
  // purpose, so they can never be captured as the checksum answer.
  return { stdout: `${r.stdout || ''}${r.stderr || ''}`, status: r.status ?? 1 };
}

let recorded;
let stale;
let fails;
let flaky;
beforeAll(() => {
  recorded = runApply('all-recorded');
  stale = runApply('stale-0203');
  fails = runApply('read-fails-0204');
  flaky = runApply('read-flaky-0204');
}, 60_000);

describe('the harness is honest (non-vacuous)', () => {
  it('runs the REAL shipped script', () => {
    const src = readFileSync(SCRIPT, 'utf8');
    expect(src).toContain('ledger_checksum()');
    expect(src).toContain('functions_defined_by()');
  });

  it('with every row current, nothing applies and the run is green', () => {
    expect(recorded.status, recorded.stdout).toBe(0);
    expect(recorded.stdout).toMatch(/applied=0\s+skipped=4\s+failed=0/);
    expect(recorded.stdout).toContain('all migrations applied or already up-to-date');
  });
});

describe('PROVEN-TO-CATCH 1: a failed ledger read is not an empty ledger read', () => {
  it('a read that keeps failing STOPS the run instead of applying on a guess', () => {
    expect(fails.status, fails.stdout).not.toBe(0);
    expect(fails.stdout).toMatch(/ledger could not be read for 0204-days\.sql after three tries/);
    expect(fails.stdout).toMatch(/stopped-at=0204-days\.sql/);
  });

  it('the file whose read failed was NOT applied, and nothing after it was touched', () => {
    expect(fails.stdout).not.toMatch(/=== applying 0204-days\.sql/);
    expect(fails.stdout).not.toMatch(/0205-sum-rule\.sql/);
    expect(fails.stdout).not.toMatch(/0206-plan\.sql/);
    expect(fails.stdout).not.toContain('all migrations applied or already up-to-date');
  });

  it('the files before it were still read correctly (the stop is at the fault, not before)', () => {
    expect(fails.stdout).toMatch(/skip \(unchanged\) 0203-doors\.sql/);
  });

  it('a read that fails twice and then answers is retried and the run is green', () => {
    expect(flaky.status, flaky.stdout).toBe(0);
    expect(flaky.stdout).toMatch(/ledger read failed for 0204-days\.sql \(try 1 of 3\)/);
    expect(flaky.stdout).toMatch(/ledger read failed for 0204-days\.sql \(try 2 of 3\)/);
    expect(flaky.stdout).not.toMatch(/try 3 of 3/);
    expect(flaky.stdout).toMatch(/skip \(unchanged\) 0204-days\.sql/);
    expect(flaky.stdout).toMatch(/applied=0\s+skipped=4\s+failed=0/);
  });
});

describe('PROVEN-TO-CATCH 2: the newest definition wins when an older file re-applies', () => {
  it('the changed older file applies', () => {
    expect(stale.status, stale.stdout).toBe(0);
    expect(stale.stdout).toMatch(/=== applying 0203-doors\.sql ===/);
  });

  it('the LATER file that defines the same function is applied again, by name and by cause', () => {
    expect(stale.stdout).toMatch(/=== re-applying 0205-sum-rule\.sql: it holds the newer definition of obligation_set_lines, redefined by 0203-doors\.sql earlier this run ===/);
  });

  it('an unchanged later file that defines a DIFFERENT function is left alone', () => {
    expect(stale.stdout).toMatch(/skip \(unchanged\) 0204-days\.sql/);
    expect(stale.stdout).toMatch(/skip \(unchanged\) 0206-plan\.sql/);
    expect(stale.stdout).not.toMatch(/re-applying 0204/);
    expect(stale.stdout).not.toMatch(/re-applying 0206/);
  });

  it('the summary counts both applies and stays green', () => {
    expect(stale.stdout).toMatch(/applied=2\s+skipped=2\s+failed=0/);
    expect(stale.stdout).toContain('all migrations applied or already up-to-date');
  });
});
