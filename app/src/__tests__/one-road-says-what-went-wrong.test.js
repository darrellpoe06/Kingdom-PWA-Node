// =============================================================================
// scripts/live-sql.sh -- the shared road reports only what actually went wrong
// =============================================================================
// Fourteen workflows reach the live database through this one script (DR-0618),
// and on 2026-10-19 its log cost a reader real time: every run carried
// "permission denied while trying to connect to the Docker daemon socket",
// because docker on DSM answers the unprivileged call that way and the sudo
// retry then succeeds. A line that says permission denied on a run that
// succeeded is the DR-1041/DR-1042 failure -- the measurement was sound and the
// presentation defeated the reader.
//
// Reading it also turned up a hazard nobody had hit yet: the old form streamed
// the first attempt's stdout straight through and then let the retry print the
// same rows again, so a docker that died PART WAY through a result set handed
// its caller a doubled answer with exit 0. The monitors parse that output with
// a field separator; a doubled row set is not detectably wrong.
//
// The remote half of live-sql.sh is a self-contained bash script inside a
// QUOTED heredoc, which is exactly what the NAS runs -- so it can be lifted out
// and run here against stub binaries. No NAS, no tailnet, no network.
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const LIVE_SQL = join(REPO, 'scripts', 'live-sql.sh');

/** The bash the NAS actually runs, lifted from the quoted heredoc. */
function remoteHalf() {
  const src = readFileSync(LIVE_SQL, 'utf8');
  const open = src.indexOf("<<'REMOTE_EOF'\n");
  expect(open, 'live-sql.sh must still carry a quoted REMOTE_EOF heredoc').toBeGreaterThan(-1);
  const body = src.slice(open + "<<'REMOTE_EOF'\n".length);
  const close = body.indexOf('\nREMOTE_EOF\n');
  expect(close, 'the heredoc must still be terminated').toBeGreaterThan(-1);
  return body.slice(0, close + 1);
}

/**
 * The old shape, for the proven-to-catch case: same script with the buffering
 * replaced by the streaming form this test exists to keep out.
 */
function streamingHalf() {
  const body = remoteHalf();
  const marker = body.indexOf('TMPD="${TMPDIR:-/tmp}"');
  expect(marker, 'the buffered block must still be recognizable').toBeGreaterThan(-1);
  return `${body.slice(0, marker)}
run "$DOCKER" && exit 0
rc=$?
if [ "$rc" -eq 1 ] && ! "$DOCKER" ps >/dev/null 2>&1; then
  run sudo -n "$DOCKER"
  exit $?
fi
exit "$rc"
`;
}

let bin;
let envFile;

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), 'live-sql-'));
  bin = join(dir, 'bin');
  mkdirSync(bin);

  // Stub docker. Unprivileged: writes ONE row, then dies with the real DSM
  // message. Privileged (via the sudo stub): writes the whole result set.
  const docker = `#!/bin/sh
if [ "$1" = "ps" ]; then
  if [ -n "\${LIVE_SQL_TEST_SUDO:-}" ]; then exit 0; fi
  exit 1
fi
cat >/dev/null
if [ -n "\${LIVE_SQL_TEST_SUDO:-}" ]; then
  if [ -n "\${LIVE_SQL_TEST_BOTH_FAIL:-}" ]; then
    echo 'live-sql-test: the database really is unreachable' >&2
    exit 2
  fi
  printf 'row-a\\nrow-b\\n'
  exit 0
fi
printf 'row-a\\n'
echo 'permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock' >&2
exit 1
`;
  writeFileSync(join(bin, 'docker'), docker);
  chmodSync(join(bin, 'docker'), 0o755);

  const sudo = `#!/bin/sh
if [ "$1" = "-n" ]; then shift; fi
LIVE_SQL_TEST_SUDO=1 exec "$@"
`;
  writeFileSync(join(bin, 'sudo'), sudo);
  chmodSync(join(bin, 'sudo'), 0o755);

  envFile = join(dir, 'supabase.env');
  writeFileSync(envFile, 'POSTGRES_PASSWORD=not-a-real-password\n');
});

function runHalf(script, extraEnv = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'live-sql-run-'));
  const file = join(dir, 'remote.sh');
  writeFileSync(file, script);
  const env = {
    PATH: `${bin}:/usr/bin:/bin`,
    NAS_ENV: envFile,
    SQL_B64: Buffer.from('SELECT 1').toString('base64'),
    SEP_B64: Buffer.from('|').toString('base64'),
    ...extraEnv,
  };
  try {
    const stdout = execFileSync('bash', [file], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
}

// execFileSync gives us stderr only on a non-zero exit, so a success case that
// needs stderr is run with the two streams captured separately by bash itself.
function runHalfCapturingBoth(script, extraEnv = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'live-sql-cap-'));
  const file = join(dir, 'remote.sh');
  const errFile = join(dir, 'stderr.txt');
  writeFileSync(file, script);
  const wrapper = join(dir, 'wrap.sh');
  writeFileSync(wrapper, `bash "${file}" 2>"${errFile}"\n`);
  const env = {
    PATH: `${bin}:/usr/bin:/bin`,
    NAS_ENV: envFile,
    SQL_B64: Buffer.from('SELECT 1').toString('base64'),
    SEP_B64: Buffer.from('|').toString('base64'),
    ...extraEnv,
  };
  let out;
  try {
    out = { code: 0, stdout: execFileSync('bash', [wrapper], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    out = { code: e.status, stdout: e.stdout || '' };
  }
  return { ...out, stderr: readFileSync(errFile, 'utf8') };
}

describe('live-sql.sh reports only what actually went wrong', () => {
  it('the heredoc is still QUOTED, so what is written is what the NAS runs', () => {
    const src = readFileSync(LIVE_SQL, 'utf8');
    expect(src).toContain("<<'REMOTE_EOF'");
  });

  it('a run the sudo retry rescues exits 0', () => {
    expect(runHalf(remoteHalf()).code).toBe(0);
  });

  it('that run hands back the rows EXACTLY ONCE -- the partial write never escapes', () => {
    const { stdout } = runHalf(remoteHalf());
    expect(stdout).toBe('row-a\nrow-b\n');
    expect(stdout.match(/row-a/g)).toHaveLength(1);
  });

  it('that run says nothing about permission denied, because nothing failed', () => {
    const { stderr } = runHalfCapturingBoth(remoteHalf());
    expect(stderr).not.toMatch(/permission denied/);
    expect(stderr).toBe('');
  });

  // The other half of DR-0076: quiet must not mean deaf. A real failure still
  // reaches the reader, with its own words and its own exit code.
  it('when BOTH attempts fail the error IS released, with psql\'s exit code', () => {
    const { code, stderr } = runHalf(remoteHalf(), { LIVE_SQL_TEST_BOTH_FAIL: '1' });
    expect(code).toBe(2);
    expect(stderr).toMatch(/the database really is unreachable/);
  });

  it('a failed run does not emit the partial rows as if they were an answer', () => {
    const { stdout } = runHalf(remoteHalf(), { LIVE_SQL_TEST_BOTH_FAIL: '1' });
    expect(stdout).toBe('');
  });

  // PROVEN TO CATCH. The shape this test exists to keep out, run through the
  // same stubs: it doubles the rows and it cries permission denied on a run
  // that succeeded. Both assertions above would pass vacuously if the stubs
  // were wrong, so the old form must FAIL them.
  it('PROVEN-TO-CATCH: the streaming form doubles the rows and leaks the rescued error', () => {
    const { code, stdout, stderr } = runHalfCapturingBoth(streamingHalf());
    expect(code).toBe(0);                                  // exit 0 -- silently wrong
    expect(stdout).toBe('row-a\nrow-a\nrow-b\n');           // the partial write, then the whole
    expect(stdout.match(/row-a/g)).toHaveLength(2);
    expect(stderr).toMatch(/permission denied/);
    // and it is genuinely different from what ships
    expect(stdout).not.toBe(runHalf(remoteHalf()).stdout);
  });

  it('mktemp is not assumed on the Synology -- there is a fallback path', () => {
    const body = remoteHalf();
    expect(body).toMatch(/mktemp 2>\/dev\/null \|\| echo/);
    expect(body).toContain('TMPD="${TMPDIR:-/tmp}"');
  });

  it('both buffers are cleaned up on every exit', () => {
    expect(remoteHalf()).toMatch(/trap 'rm -f "\$OUT" "\$ERR"' EXIT/);
  });

  it('ON_ERROR_STOP stays on, so an empty answer can never read as "none"', () => {
    expect(remoteHalf()).toContain('ON_ERROR_STOP=1');
  });
});
