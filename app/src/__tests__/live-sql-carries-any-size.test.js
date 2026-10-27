// =============================================================================
// scripts/live-sql.sh -- the SQL rides stdin, never ssh's command line (DR-1222)
// =============================================================================
// research-inbox run 40430070416 (2026-10-27, job "backlog") failed to file a
// lesson from a research item: `scripts/live-sql.sh: line 89: /usr/bin/ssh:
// Argument list too long`. The whole SQL travelled base64 INSIDE the ssh
// argument (`SQL_B64='...' bash -s`), and Linux caps a single argument at
// 128 KiB (MAX_ARG_STRLEN = 131072). research-create.sh builds an INSERT that
// carries the item's full words, so a long transcript could never be filed,
// and the item sat answered-but-unfiled -- "the research did not produce
// lessons yet did it?" (Darrell, 2026-10-27).
//
// The fix: SQL_B64 and SEP_B64 are the first two lines of the script that
// `bash -s` reads from stdin, ahead of the remote half. Stdin has no limit.
//
// PROVEN TO CATCH (DR-0076 section 3): the old transport line is put back
// into a copy of the script and run through the same stubs with a 300 KB
// body. It must die of exactly that error, before ssh ever runs. The shipped
// script must carry the same body with an ssh argv a few hundred bytes long.
//
// No NAS, no tailnet, no network: `ssh` on PATH is a shim that records its
// argv length and runs the remote command locally with `sh -c`; `docker` is
// a stub that counts the bytes psql would have read and prints one row.
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const LIVE_SQL = join(REPO, 'scripts', 'live-sql.sh');
const PLACE_DOORS = join(REPO, 'scripts', 'place-doors-over-tailnet.sh');

const NEW_TRANSPORT = `{ printf 'SQL_B64=%s\\nSEP_B64=%s\\n' "$SQL_B64" "$SEP_B64"; cat "$REMOTE"; } | $SSH "NAS_ENV='$NAS_ENV' bash -s"`;
const OLD_TRANSPORT = `$SSH "NAS_ENV='$NAS_ENV' SQL_B64='$SQL_B64' SEP_B64='$SEP_B64' bash -s" < "$REMOTE"`;

/** 300 KB of SQL: the size of a filed transcript, well past 128 KiB. */
const BIG_SQL = `INSERT INTO t (body) VALUES ('${'the words of the teaching, '.repeat(300 * 1024 / 27)}');`;

let bin;
let envFile;

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), 'live-sql-size-'));
  bin = join(dir, 'bin');
  mkdirSync(bin);

  // The ssh shim: record the byte length of argv, then run the remote
  // command here with the same stdin ssh would have forwarded.
  writeFileSync(join(bin, 'ssh'), `#!/bin/sh
n=0
for a in "$@"; do n=$((n + \${#a} + 1)); done
printf '%s\\n' "$n" >> "$LIVE_SQL_TEST_ARGV"
cmd=""
for a in "$@"; do cmd="$a"; done
if [ -n "\${LIVE_SQL_TEST_STDIN:-}" ]; then
  tee -a "$LIVE_SQL_TEST_STDIN" | sh -c "$cmd"
else
  sh -c "$cmd"
fi
`);
  chmodSync(join(bin, 'ssh'), 0o755);

  // The docker stub: \`docker ps\` is fine; \`docker exec ... psql -f -\`
  // counts what psql would have read and answers one row.
  writeFileSync(join(bin, 'docker'), `#!/bin/sh
if [ "$1" = "ps" ]; then exit 0; fi
cat | wc -c | tr -d ' ' > "$LIVE_SQL_TEST_BYTES"
echo 'one-row'
`);
  chmodSync(join(bin, 'docker'), 0o755);

  envFile = join(dir, 'supabase.env');
  writeFileSync(envFile, 'POSTGRES_PASSWORD=not-a-real-password\n');
});

function run(script, sql) {
  const dir = mkdtempSync(join(tmpdir(), 'live-sql-size-run-'));
  const argv = join(dir, 'argv.txt');
  const stdin = join(dir, 'stdin.txt');
  const bytes = join(dir, 'bytes.txt');
  writeFileSync(argv, '');
  const env = {
    PATH: `${bin}:/usr/bin:/bin`,
    NAS_SSH_KEY: 'not-a-real-key',
    NAS_ENV: envFile,
    NAS_HOST: 'nobody@nowhere.invalid',
    LIVE_SQL_TEST_ARGV: argv,
    LIVE_SQL_TEST_STDIN: stdin,
    LIVE_SQL_TEST_BYTES: bytes,
  };
  let out;
  try {
    out = { code: 0, stdout: execFileSync('bash', [script, '|'], { env, input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }), stderr: '' };
  } catch (e) {
    out = { code: e.status, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
  const argvLens = readFileSync(argv, 'utf8').trim().split('\n').filter(Boolean).map(Number);
  return {
    ...out,
    argvLens,
    stdinBytes: existsSync(stdin) ? readFileSync(stdin).length : 0,
    psqlBytes: existsSync(bytes) ? Number(readFileSync(bytes, 'utf8').trim()) : null,
  };
}

/** The shipped script, copied beside the stubs so the old form can sit next to it. */
function shippedCopy() {
  const dir = mkdtempSync(join(tmpdir(), 'live-sql-size-copy-'));
  const file = join(dir, 'live-sql.sh');
  writeFileSync(file, readFileSync(LIVE_SQL, 'utf8'));
  return file;
}

/** The old form: the same script with the transport line put back. */
function oldFormCopy() {
  const src = readFileSync(LIVE_SQL, 'utf8');
  expect(src, 'the stdin transport line must still be recognizable').toContain(NEW_TRANSPORT);
  const dir = mkdtempSync(join(tmpdir(), 'live-sql-size-old-'));
  const file = join(dir, 'live-sql.sh');
  writeFileSync(file, src.replace(NEW_TRANSPORT, OLD_TRANSPORT));
  return file;
}

describe('live-sql.sh carries SQL of any size (DR-1222)', () => {
  it('the SQL rides stdin ahead of the remote half, never the command line', () => {
    const src = readFileSync(LIVE_SQL, 'utf8');
    expect(src).toContain(NEW_TRANSPORT);
    expect(src).not.toContain("SQL_B64='$SQL_B64'");
    expect(src).toContain("<<'REMOTE_EOF'"); // the quoted heredoc the other test lifts out
  });

  it('a 300 KB body reaches psql whole, with an ssh argv a few hundred bytes long', () => {
    const r = run(shippedCopy(), BIG_SQL);
    expect(r.stderr).toBe('');
    expect(r.code).toBe(0);
    expect(r.stdout).toBe('one-row\n');
    // every ssh call's argv stayed small: the probe and the real run
    expect(r.argvLens.length).toBe(2);
    expect(Math.max(...r.argvLens)).toBeLessThan(4096);
    // the body went over stdin, and psql read every byte of it
    expect(r.stdinBytes).toBeGreaterThan(BIG_SQL.length);
    expect(r.psqlBytes).toBe(Buffer.byteLength(BIG_SQL));
  });

  it('a small body still works the same way (the monitors see no change)', () => {
    const r = run(shippedCopy(), 'SELECT 1');
    expect(r.code).toBe(0);
    expect(r.stdout).toBe('one-row\n');
    expect(r.psqlBytes).toBe(8);
  });

  // The single-argument cap is a Linux kernel constant (MAX_ARG_STRLEN); on a
  // Mac the same 400 KB argument is accepted, so the reproduction is pinned
  // to the platform CI runs on. The shipped-form assertions above hold anywhere.
  const onLinux = process.platform === 'linux' ? it : it.skip;
  onLinux('PROVEN-TO-CATCH: the old transport dies of "Argument list too long" before ssh runs', () => {
    const r = run(oldFormCopy(), BIG_SQL);
    expect(r.code).not.toBe(0);
    expect(r.stderr).toMatch(/Argument list too long/);
    expect(r.stdout).toBe('');
    // only the `echo ok` probe reached ssh; the real call never could
    expect(r.argvLens.length).toBe(1);
    expect(r.psqlBytes).toBeNull();
  });

  it('place-doors-over-tailnet.sh, the other caller that put SQL on the command line, rides stdin too', () => {
    const src = readFileSync(PLACE_DOORS, 'utf8');
    expect(src).not.toMatch(/\$SSH "[^"]*SQL_B64='\$SQL_B64'/);
    expect(src).toContain(`{ printf 'SQL_B64=%s\\n' "$SQL_B64"; cat "$REMOTE_SCRIPT"; } | $SSH "NAS_ENV='$NAS_ENV' MODE=write bash -s"`);
  });
});
