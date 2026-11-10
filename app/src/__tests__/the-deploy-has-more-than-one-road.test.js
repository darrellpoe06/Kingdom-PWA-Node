// =============================================================================
// the-deploy-has-more-than-one-road -- DR-1269
// =============================================================================
// On 2026-10-28 the runner's Tailscale key was refused and EVERY road to the
// sovereign backend closed at once: no deploy (the anon key came only from
// the NAS over the tailnet) and no migration (db-migrate walked the same
// road). The NAS was up the whole time, online on the tailnet, pulling main
// every 15 minutes. Darrell: "We are supposed to have multiple ways and
// solutions." These are the proofs of the two roads that answer him.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, utimesSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SELECTOR = join(ROOT, 'scripts/served-anon-key.py');
const INSTALLER = join(ROOT, 'infra/nas-supabase/replay-on-clock.sh');
const REPLAY = join(ROOT, 'infra/nas-supabase/replay_migrations.sh');

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (payload) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.${'s'.repeat(43)}`;
const SOVEREIGN = jwt({ role: 'anon', iss: 'supabase', iat: 1, exp: 2000000000 });
const HOSTED = jwt({ role: 'anon', iss: 'supabase', ref: 'mjjlevhdufpaplypnqrv', iat: 1, exp: 2000000000 });
const SERVICE = jwt({ role: 'service_role', iss: 'supabase', iat: 1, exp: 2000000000 });
const OTHER_ANON = jwt({ role: 'anon', iss: 'supabase', iat: 2, exp: 2000000001 });
const FUNNEL = 'https://poetech.tail5a2f35.ts.net/sb';

// A tiny served site: the shell names hashed assets; each chunk is whatever
// the case puts in it.
function serve(chunks) {
  const shell = `<!doctype html><div id="root"></div>${Object.keys(chunks).map((n) => `<script src="/poetech-app/assets/${n}"></script>`).join('')}`;
  const srv = createServer((req, res) => {
    if (req.url === '/poetech-app/' || req.url === '/poetech-app/index.html') { res.end(shell); return; }
    const m = /^\/poetech-app\/assets\/(.+)$/.exec(req.url);
    if (m && chunks[m[1]] !== undefined) { res.end(chunks[m[1]]); return; }
    res.statusCode = 404; res.end('no');
  });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve(srv)));
}
const LOOPBACK = { ...process.env, NO_PROXY: '127.0.0.1,localhost', no_proxy: '127.0.0.1,localhost' };
const shellOf = (srv) => `http://127.0.0.1:${srv.address().port}/poetech-app/`;
// The selector must run ASYNCHRONOUSLY: a synchronous spawn would block the
// very thread that serves the fixture, and every fetch would time out.
//
// THE BUDGET RULE, for every case in this file that spawns a child process --
// the subprocess budget must stay STRICTLY BELOW the test runner's timeout,
// because the runner KILLS the case rather than waiting for the script. Equal
// budgets are a race by construction, not a flake: the case dies with "Test
// timed out in Nms" and no assertion is ever wrong. Observed in CI on run
// 42081880950 (shard 1/4) at 5009ms against the default 5000ms ceiling -- a 9ms
// overrun, the signature of a tie, and it passes on an idle machine, which is
// itself the tell. (Same class as the ~5002ms P54 note in vitest.config.js.)
//
// A case that looks safe because its fixture refuses early is NOT safe: it is
// quick today by fixture, still tied by budget. So the ceiling goes on every
// spawning case, not only the one seen to fail, and both ends are pinned as
// named constants. `budgetsAreOrdered` below fails the suite if they ever meet
// again -- a comment cannot fail a build, and this tie already shipped once.
// The class is gated repo-wide by scripts/subprocess-budget-guard.mjs, which
// found the same tie in a-backup-on-request.test.js; this file keeps its own
// test because only the fixtures here know the per-case multipliers below.
//
// Sizing needs one measured fact per script, because neither inner budget is a
// total wall clock:
//   * served-anon-key.py --timeout is PER FETCH (urlopen(..., timeout=) at
//     served-anon-key.py:38). It fetches the shell, then every hashed asset the
//     shell names, SEQUENTIALLY: worst case (1 + chunks) x the per-fetch value.
//     Lowering that value ALONE therefore does not clear a 5000ms ceiling.
//   * SOVEREIGN_REPLAY_TIMEOUT is per INVOCATION of replay-on-clock.sh, and the
//     single-flight case invokes it twice: worst case 2 x the value.
const SELECTOR_FETCH_TIMEOUT_S = 3;
// The widest fixture here serves 3 chunks, so 4 sequential fetches -> 12s.
const SELECTOR_MAX_FETCHES = 4;
const REPLAY_TIMEOUT_S = 3;
// Most invocations of replay-on-clock.sh in one case (single-flight) -> 6s.
const REPLAY_MAX_RUNS = 2;
// Strictly above both worst cases, with room for interpreter startup, the
// loopback fixture server and process teardown. Real runs here take ~0.5-1.5s.
const SUBPROCESS_CASE_MS = 20000;
function runSelector(shell) {
  return new Promise((resolve) => {
    const child = spawn('python3', [SELECTOR, '--shell', shell, '--timeout', String(SELECTOR_FETCH_TIMEOUT_S)], { env: LOOPBACK });
    let out = ''; let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => resolve({ code, out: out.trim(), err }));
  });
}
const select = (srv) => runSelector(shellOf(srv));

describe('the served site speaks the public client key (scripts/served-anon-key.py)', () => {
  const servers = [];
  afterAll(() => servers.forEach((s) => s.close()));
  const up = async (chunks) => { const s = await serve(chunks); servers.push(s); return s; };

  it('finds the one anon key beside the sovereign gateway URL, prints it once to stdout and counts only to stderr', async () => {
    const s = await up({ 'index-abc.js': `x;const u="${FUNNEL}";`, 'supabase-def.js': `const k="${SOVEREIGN}";`, 'vendor-ghi.js': 'z' });
    const r = await select(s);
    expect(r.code).toBe(0);
    expect(r.out).toBe(SOVEREIGN);
    expect(r.err).toMatch(/road served-site; chunks scanned 3; anon keys found 1; chosen 1/);
    expect(r.err).not.toContain(SOVEREIGN);
  }, SUBPROCESS_CASE_MS);
  it('prefers the key without a hosted "ref" claim when the hosted project key is also in the bundle', async () => {
    const s = await up({ 'a.js': `"${FUNNEL}" "${HOSTED}" "${SOVEREIGN}" "${SERVICE}"` });
    const r = await select(s);
    expect(r.code).toBe(0);
    expect(r.out).toBe(SOVEREIGN);
  }, SUBPROCESS_CASE_MS);
  it('REFUSES a served build that is not repoint-armed (no gateway URL): its key would be the wrong backend', async () => {
    const s = await up({ 'a.js': `"${SOVEREIGN}" https://x.supabase.co` });
    const r = await select(s);
    expect(r.code).toBe(11);
    expect(r.out).toBe('');
  }, SUBPROCESS_CASE_MS);
  it('REFUSES when no anon key is in any chunk (a service key is not an anon key)', async () => {
    const s = await up({ 'a.js': `"${FUNNEL}" "${SERVICE}"` });
    expect((await select(s)).code).toBe(12);
  }, SUBPROCESS_CASE_MS);
  it('REFUSES two distinct anon keys as ambiguous rather than picking one', async () => {
    const s = await up({ 'a.js': `"${FUNNEL}" "${SOVEREIGN}"`, 'b.js': `"${OTHER_ANON}"` });
    const r = await select(s);
    expect(r.code).toBe(13);
    expect(r.out).toBe('');
  }, SUBPROCESS_CASE_MS);
  it('REFUSES a shell that names no hashed assets, and a shell it cannot fetch', async () => {
    const s = await up({});
    expect((await select(s)).code).toBe(10);
    const r = await runSelector('http://127.0.0.1:9/poetech-app/');
    expect(r.code).toBe(14);
  }, SUBPROCESS_CASE_MS);

  // The rule above, machine-checked: a comment cannot fail a build, and this
  // tie already shipped once. Proven-to-catch (DR-0076 §3) -- it was run with
  // the old pair (5s inner, 5000ms outer) and fails on it.
  it('budgetsAreOrdered: every subprocess budget stays strictly under the runner ceiling', () => {
    expect(SELECTOR_MAX_FETCHES * SELECTOR_FETCH_TIMEOUT_S * 1000).toBeLessThan(SUBPROCESS_CASE_MS);
    expect(REPLAY_MAX_RUNS * REPLAY_TIMEOUT_S * 1000).toBeLessThan(SUBPROCESS_CASE_MS);
  });
});

describe('the deploy lane walks the second road (deploy-cloudflare-pages.yml)', () => {
  const wf = read('.github/workflows/deploy-cloudflare-pages.yml');
  it('the tailnet join no longer ends the job, the key step tries the NAS then the served site, and refuses with both named', () => {
    // DR-1374 moved the join behind the one composite door, so find it by
    // either spelling — the thing that matters here is unchanged and is the
    // DR-0107 guarantee: a refused key must NOT end the deploy job.
    const door = wf.indexOf('uses: ./.github/actions/join-tailnet');
    const join = door >= 0 ? door : wf.indexOf('uses: tailscale/github-action@v3');
    expect(join, 'the deploy lane no longer joins the tailnet at all').toBeGreaterThan(0);
    expect(wf.slice(join, join + 400)).toMatch(/continue-on-error: true/);
    expect(wf).toMatch(/python3 scripts\/served-anon-key\.py/);
    expect(wf).toMatch(/ROAD="nas-over-tailnet"/);
    expect(wf).toMatch(/ROAD="served-site"/);
    expect(wf).toMatch(/no sovereign ANON_KEY came by either road/);
    // the shape check comes AFTER both roads, before the key is used
    expect(wf.indexOf('ROAD="served-site"')).toBeLessThan(wf.indexOf('no sovereign ANON_KEY came by either road'));
    expect(wf.indexOf('no sovereign ANON_KEY came by either road')).toBeLessThan(wf.indexOf('SOVEREIGN_SB_ANON=$KEY'));
    expect(wf).toMatch(/echo "::add-mask::\$KEY"/);
  });
  it('still only runs under the repoint record, and still never prints the key', () => {
    expect(wf).toMatch(/hashFiles\('infra\/nas-supabase\/REPOINT-ARMED'\)/);
    expect(wf).not.toMatch(/echo "\$KEY"/);
  });
});

describe('the database replays its own mirror on the NAS clock (infra/nas-supabase/replay-on-clock.sh)', () => {
  let repo; let home;
  const fake = (body) => {
    mkdirSync(join(repo, 'infra/nas-supabase'), { recursive: true });
    writeFileSync(join(repo, 'infra/nas-supabase/replay_migrations.sh'), `#!/bin/sh\n${body}\n`);
  };
  const run = (env = {}) => spawnSync('sh', [INSTALLER], {
    encoding: 'utf8', env: { ...process.env, POETECH_REPO: repo, SOVEREIGN_REPLAY_HOME: home, SOVEREIGN_REPLAY_TIMEOUT: String(REPLAY_TIMEOUT_S), ...env },
  });
  const status = () => JSON.parse(readFileSync(join(home, 'status.json'), 'utf8'));
  beforeAll(() => { repo = mkdtempSync(join(tmpdir(), 'sr-repo-')); home = mkdtempSync(join(tmpdir(), 'sr-home-')); });
  afterAll(() => { rmSync(repo, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true }); });

  it('is registered enabled in the self-deploy manifest beside db-backup, with the installer on disk', () => {
    const doc = JSON.parse(read('infra/nas-loops/services.json'));
    const names = doc.services.map((s) => s.name);
    const s = doc.services.find((x) => x.name === 'sovereign-replay');
    expect(s).toBeTruthy();
    expect(s.enabled).toBe(true);
    expect(s.install).toBe('infra/nas-supabase/replay-on-clock.sh');
    expect(existsSync(join(ROOT, s.install))).toBe(true);
    expect(names.indexOf('sovereign-replay')).toBe(names.indexOf('db-backup') + 1);
    expect(s.description).toMatch(/DR-1269/);
    expect(s.description).toMatch(/loops-health/);
  });
  it('applies: runs the same replay script, writes status.json (ok, applied, ledger, frontier, head) and exits 0', () => {
    fake('echo "replay: applied 2 this run, ledger 315/315, frontier: none"; exit 0');
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/sovereign-replay: replay: applied 2 this run, ledger 315\/315, frontier: none/);
    const st = status();
    expect(st.ok).toBe(true);
    expect(st.applied).toBe(2);
    expect(st.ledger).toBe('315/315');
    expect(st.frontier).toBe('none');
    expect(st.busy).toBe(false);
    expect(typeof st.head).toBe('string');
    expect(existsSync(join(home, '.lock'))).toBe(false);
    expect(readFileSync(join(home, 'replay.log'), 'utf8')).toMatch(/rc=0/);
  }, SUBPROCESS_CASE_MS);
  it('a migration that FAILS reds the cycle (exit 1) with the frontier named, never a quiet 0', () => {
    fake('echo "replay: applied 0 this run, ledger 314/315, frontier: 0313-x.sql FAILED: ERROR: syntax error"; exit 1');
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/a migration FAILED \(exit 1/);
    const st = status();
    expect(st.ok).toBe(false);
    expect(st.frontier).toMatch(/0313-x\.sql FAILED/);
  }, SUBPROCESS_CASE_MS);
  it('a replay that could not run (docker or the database away) is DEGRADED (exit 3), named', () => {
    fake('echo "replay: docker binary not found (PATH, /usr/local/bin, /usr/bin) - cannot run"; exit 1');
    const r = run();
    expect(r.status).toBe(3);
    expect(r.stdout).toMatch(/could not run this cycle/);
    expect(status().ok).toBe(false);
  }, SUBPROCESS_CASE_MS);
  it('the wall clock is a hard ceiling: a hung replay is killed and reported as timed out', () => {
    fake('sleep 30; echo "replay: applied 0 this run, ledger 1/1, frontier: none"');
    const r = run({ SOVEREIGN_REPLAY_TIMEOUT: '1' });
    expect(r.status).toBe(3);
    expect(status().frontier).toMatch(/timed out after 1s/);
    expect(status().rc).toBe(124);
  }, SUBPROCESS_CASE_MS);
  it('single-flight: a live lock means "already in progress" (exit 0, nothing run); a stale lock is cleared', () => {
    fake('echo "replay: applied 0 this run, ledger 1/1, frontier: none"; exit 0');
    mkdirSync(join(home, '.lock'));
    const live = run();
    expect(live.status).toBe(0);
    expect(live.stdout).toMatch(/already in progress/);
    const old = new Date(Date.now() - 60 * 60 * 1000);
    utimesSync(join(home, '.lock'), old, old);
    const cleared = run();
    expect(cleared.stdout).toMatch(/stale lock .* was cleared/);
    expect(cleared.status).toBe(0);
    expect(existsSync(join(home, '.lock'))).toBe(false);
  }, SUBPROCESS_CASE_MS);
  it('a missing replay script is a loud exit 1, not a silent cycle', () => {
    rmSync(join(repo, 'infra/nas-supabase/replay_migrations.sh'));
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/no replay script/);
  }, SUBPROCESS_CASE_MS);
});

describe('one replay at a time (infra/nas-supabase/replay_migrations.sh)', () => {
  it('the replay itself holds a lock both roads respect: BUSY exits 0 before touching docker, and the lock clears itself after 30 min', () => {
    const s = read('infra/nas-supabase/replay_migrations.sh');
    expect(s.indexOf('RLOCK=')).toBeLessThan(s.indexOf('DOCKER_BIN=$(command -v docker'));
    expect(s).toMatch(/-mmin \+30/);
    const data = mkdtempSync(join(tmpdir(), 'sr-data-'));
    try {
      mkdirSync(join(data, '.replay.lock'));
      const r = spawnSync('sh', [REPLAY], { encoding: 'utf8', env: { ...process.env, SUPABASE_DATA: data, POETECH_REPO: ROOT } });
      expect(r.status).toBe(0);
      expect(r.stdout).toMatch(/^replay: BUSY/m);
      expect(r.stdout).not.toMatch(/docker/);
    } finally { rmSync(data, { recursive: true, force: true }); }
  });
});

describe('the witness and the flow graph know the new road', () => {
  it('loops-health reads sovereign-replay\'s own ledger and reds on ok:false', () => {
    const w = read('.github/workflows/loops-health.yml');
    expect(w).toMatch(/\/volume1\/PoeTech\/sovereign-replay\/status\.json/);
    expect(w).toMatch(/"sovereign-replay": "infra\/nas-supabase\/replay-on-clock\.sh"/);
    expect(w).toMatch(/name == "sovereign-replay" and isinstance\(e\.get\("ledger"\), dict\) and e\["ledger"\]\.get\("ok"\) is False/);
  });
  it('the flow registry places the rider with its file-verified tokens', () => {
    const r = read('scripts/system-flow-registry.mjs');
    expect(r).toMatch(/rider\('service:sovereign-replay', 'infra\/nas-supabase\/replay-on-clock\.sh'/);
    expect(execFileSync('node', [join(ROOT, 'scripts/interconnect-guard.mjs')], { cwd: join(ROOT, 'app'), encoding: 'utf8' })).toMatch(/0 finding|OK/i);
  });
});
