// @vitest-environment node
// =============================================================================
// db-migrate-apply — a rejected LEDGER ROW must turn the lane RED
// =============================================================================
// THE INCIDENT THIS GATE EXISTS FOR (2026-09-06, twice in one day).
//
// A database-side ordinal guard rejected the `_schema_migrations` INSERT for a
// migration whose DDL had already run and committed:
//
//   ERROR: ordinal 0170 already used by 0170-courses-a-lesson-belongs-to-a-course.sql
//          — pick the next free number
//
// (That filename exists in no branch of this repo; an 0170 reached the database
// from outside main. The same thing happened hours earlier at 0168.)
//
// The apply script checked the DDL's exit status and NOT the ledger INSERT's.
// So it counted the file as applied, printed
//
//   --- summary: applied=2  skipped=180  failed=0 ---
//   all migrations applied or already up-to-date
//
// and exited 0. db-migrate went GREEN on that commit with the migration
// unrecorded. The consequence is not cosmetic: with no ledger row there is no
// checksum to match, so the file re-applies on every run forever, the in-app DB
// Health panel misreports what is deployed, and the one signal anybody watches
// says the opposite of the truth in the exact place someone looks when
// something is wrong. That is the shape DR-0332 names — a proxy for truth
// standing where the truth was available.
//
// HOW THIS IS PROVEN, and why it is not a source-level pin. The test runs the
// REAL `scripts/db-migrate-apply.sh` against a STUB `psql` placed first on PATH,
// which reproduces the rejection exactly: DDL succeeds, ledger INSERT fails.
// No database, no network, fully deterministic — and it exercises the shipped
// artifact rather than a description of it.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, chmodSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const SCRIPT = join(REPO, 'scripts', 'db-migrate-apply.sh');

/**
 * Build a sandbox with a fake repo layout and a stub `psql`.
 *
 * @param {'accept'|'reject'} ledgerMode — whether the stub accepts the
 *   `_schema_migrations` INSERT or rejects it the way the ordinal guard does.
 */
function sandbox(ledgerMode) {
  const dir = mkdtempSync(join(tmpdir(), 'dbmig-'));
  mkdirSync(join(dir, 'infra', 'supabase', 'migrations-auto'), { recursive: true });
  writeFileSync(
    join(dir, 'infra', 'supabase', 'migrations-auto', '0171-a-migration.sql'),
    'CREATE TABLE IF NOT EXISTS t (id int);\n',
  );

  const bin = join(dir, 'bin');
  mkdirSync(bin);
  // The stub distinguishes the three psql calls the script makes:
  //   • the ledger TABLE bootstrap (heredoc on stdin)  -> succeed
  //   • the checksum SELECT (-Atc)                     -> print nothing
  //   • the DDL apply (-f)                             -> succeed
  //   • the ledger INSERT (-c "INSERT INTO ... _schema_migrations") -> per mode
  const reject = ledgerMode === 'reject';
  writeFileSync(join(bin, 'psql'), `#!/usr/bin/env bash
for a in "$@"; do
  case "$a" in
    *"INSERT INTO public._schema_migrations"*)
      if ${reject ? 'true' : 'false'}; then
        echo "ERROR:  ordinal 0171 already used by 0171-something-else.sql — pick the next free number" >&2
        echo "CONTEXT:  PL/pgSQL function ledger_reject_duplicate_ordinal() line 6 at RAISE" >&2
        exit 1
      fi
      exit 0
      ;;
    *"SELECT checksum FROM"*) exit 0 ;;
  esac
done
exit 0
`);
  chmodSync(join(bin, 'psql'), 0o755);
  return { dir, bin };
}

function runApply(ledgerMode) {
  const { dir, bin } = sandbox(ledgerMode);
  let stdout;
  let status = 0;
  try {
    stdout = execFileSync('bash', [SCRIPT], {
      cwd: dir,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SUPABASE_DB_URL: 'postgres://stub' },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    status = err.status ?? 1;
    stdout = `${err.stdout || ''}${err.stderr || ''}`;
  }
  rmSync(dir, { recursive: true, force: true });
  return { stdout, status };
}

let accepted;
let rejected;
beforeAll(() => {
  accepted = runApply('accept');
  rejected = runApply('reject');
});
afterAll(() => { /* sandboxes removed in runApply */ });

describe('the harness itself is honest (non-vacuous)', () => {
  it('runs the REAL shipped script, not a copy', () => {
    const src = readFileSync(SCRIPT, 'utf8');
    expect(src).toContain('db-migrate-apply.sh');
    expect(src).toContain('_schema_migrations');
  });

  it('the happy path still passes — the gate is not a blanket refusal', () => {
    expect(accepted.status, `unexpected failure:\n${accepted.stdout}`).toBe(0);
    expect(accepted.stdout).toMatch(/applied=1/);
    expect(accepted.stdout).toMatch(/failed=0/);
    expect(accepted.stdout).toContain('all migrations applied or already up-to-date');
  });
});

describe('PROVEN-TO-CATCH: a rejected ledger row fails the run', () => {
  it('EXITS NON-ZERO when the ledger INSERT is refused', () => {
    // This is the whole point. Before the fix this exited 0.
    expect(rejected.status, `the lane must go RED on an unrecorded migration:\n${rejected.stdout}`).not.toBe(0);
  });

  it('does NOT count the file as applied', () => {
    expect(rejected.stdout).toMatch(/applied=0/);
    expect(rejected.stdout).toMatch(/failed=1/);
  });

  it('never prints the all-clear line over an unrecorded migration', () => {
    expect(rejected.stdout).not.toContain('all migrations applied or already up-to-date');
  });

  it('surfaces the database\'s own reason, not a generic failure', () => {
    // The operator needs the ordinal collision named, or they cannot fix it.
    expect(rejected.stdout).toMatch(/ordinal 0171 already used by/);
  });

  it('names the consequence and the remedy in the error', () => {
    // A red check that does not say what to do costs a session of rediscovery,
    // which is exactly what happened today.
    expect(rejected.stdout).toMatch(/LEDGER ROW WAS REJECTED/);
    expect(rejected.stdout).toMatch(/re-apply on every run/);
    expect(rejected.stdout).toMatch(/rename the file to the next free number/i);
  });
});

describe('duplicate ordinals WITHIN the repo — a shrink-only ratchet', () => {
  // The database-side collisions that caused today's incident come from files
  // OUTSIDE this repo and cannot be caught here — 0169's header records that
  // honestly and DR-0329 tracks it. The IN-REPO half is checkable and costs
  // nothing, so it is checked.
  //
  // MEASURED, NOT ASSUMED: twelve ordinals are already doubled in this corpus
  // (182 files). Those files are APPLIED, and renaming an applied migration is
  // precisely what leaves the orphan ledger row DR-0332 documents — so they are
  // recorded as debt, NOT "fixed". The list may only SHRINK; a thirteenth
  // duplicate fails the build.
  const KNOWN_DUPLICATE_ORDINALS = [
    '0019', '0022', '0024', '0036', '0037', '0042',
    '0043', '0045', '0052', '0055', '0056', '0100',
  ];

  const scan = () => {
    const dir = join(REPO, 'infra', 'supabase', 'migrations-auto');
    const seen = new Map();
    const dupes = new Set();
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
      const m = /^(\d{4})-/.exec(f);
      if (!m) continue;
      if (seen.has(m[1])) dupes.add(m[1]);
      else seen.set(m[1], f);
    }
    return { dupes: [...dupes].sort(), files: seen.size + dupes.size };
  };

  it('the scan actually reads the corpus (non-vacuous)', () => {
    expect(scan().files).toBeGreaterThan(150);
  });

  it('NO NEW duplicate ordinal may be introduced', () => {
    const fresh = scan().dupes.filter((d) => !KNOWN_DUPLICATE_ORDINALS.includes(d));
    expect(
      fresh,
      `new duplicate ordinal(s): ${fresh.join(', ')}. Rename the NEW file to the next free number — never the applied one (renaming an applied migration leaves an orphan ledger row, DR-0332).`,
    ).toEqual([]);
  });

  it('the recorded debt is REAL — every entry is still doubled', () => {
    // A stale baseline would quietly widen the allowance. If one heals, remove
    // it from the list rather than leaving room for a new collision to hide.
    const now = scan().dupes;
    const healed = KNOWN_DUPLICATE_ORDINALS.filter((d) => !now.includes(d));
    expect(healed, `these ordinals are no longer duplicated — drop them from the baseline: ${healed.join(', ')}`).toEqual([]);
  });

  it('the twice-collided migrations sit on ordinals nothing else in the repo uses', () => {
    // The direct regression, and it took THREE numbers to land. 0170 collided
    // with an external phantom; 0171 collided with ANOTHER one; 0180/0181 are a
    // cushion above the whole observed external run (0168-0171).
    //
    // Asserting the invariant rather than the literal number on purpose: a
    // hardcoded ordinal has already had to be edited twice, and a check that
    // needs editing every time the thing it guards moves is a check that will
    // eventually be edited wrong. What must stay true is UNIQUENESS.
    const dir = join(REPO, 'infra', 'supabase', 'migrations-auto');
    const files = readdirSync(dir).filter((x) => x.endsWith('.sql'));

    const push = files.filter((f) => f.endsWith('-push-subscriptions-and-the-live-signal.sql'));
    const shelves = files.filter((f) => f.endsWith('-legal-document-shelves.sql'));
    expect(push, 'exactly one push migration').toHaveLength(1);
    expect(shelves, 'exactly one legal-shelves migration').toHaveLength(1);

    // Each sits alone on its ordinal.
    for (const f of [push[0], shelves[0]]) {
      const ord = f.slice(0, 4);
      expect(files.filter((x) => x.startsWith(`${ord}-`)), `ordinal ${ord} is shared`).toHaveLength(1);
    }

    // And the four ordinals the external ledger is known to hold are vacated
    // here, so a re-run cannot walk back into a collision we already paid for.
    for (const ord of ['0168', '0169', '0170', '0171']) {
      expect(files.some((f) => f.startsWith(`${ord}-`)), `ordinal ${ord} collided externally and must stay vacated`).toBe(false);
    }
  });
});
