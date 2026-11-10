// =============================================================================
// the-house-says-how-its-clock-ran -- the loops witness has a second road that
// needs no key (DR-1399, under DR-1360)
// =============================================================================
// loops-health.yml asks the NAS over SSH on the runner's tailnet key. When that
// road is shut, scripts/served-heartbeat-receipt.py builds the SAME witness from
// the heartbeat the NAS writes itself each cycle (migration 0318, read over
// poetech.us/sb with the served anon key), and loops-health's own judge runs on
// it unchanged. This runs the real reader against a local stand-in for the live
// database, then runs the workflow's real judge on what it wrote.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const READER = join(ROOT, 'scripts', 'served-heartbeat-receipt.py');
const WF = read('.github/workflows/loops-health.yml');
const LOOPS = 'db-backup,choir-dates,sovereign-replay,nas-heartbeat';
const TMP = mkdtempSync(join(tmpdir(), 'heartbeat-'));

let server;
let origin;
let answer = [200, { seen: false }];
let asked = 0;
beforeAll(async () => {
  server = http.createServer((req, res) => {
    asked += 1;
    req.on('data', () => {});
    req.on('end', () => {
      res.writeHead(answer[0], { 'content-type': 'application/json' });
      res.end(JSON.stringify(answer[1]));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server && server.close());

function run(cmd, args, { env = {}, input } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { env: { ...process.env, ...env } });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    if (input !== undefined) child.stdin.end(input);
    child.on('close', (code) => resolve({ code, out, err }));
  });
}
const reader = (key = 'anon-key-xyz') => run('python3', [READER, '--origin', origin, '--loops', LOOPS, '--timeout', '2'], { env: { SOVEREIGN_ANON_KEY: key } });

// The workflow's own judge, lifted verbatim from loops-health.yml, so the test
// runs exactly what the lane runs.
function judgeSource() {
  const step = WF.slice(WF.indexOf('- name: Judge each loop on what it wrote, and report'));
  const body = step.slice(step.indexOf("python3 - <<'PY'") + "python3 - <<'PY'".length, step.indexOf('\n          PY'));
  return body
    .split('\n')
    .map((l) => l.replace(/^ {10}/, ''))
    .join('\n');
}
async function judge(witness) {
  const dir = mkdtempSync(join(TMP, 'j-'));
  writeFileSync('/tmp/witness.json', JSON.stringify(witness));
  const summary = join(dir, 'summary.md');
  writeFileSync(summary, '');
  const r = await run('python3', ['-'], { env: { GITHUB_STEP_SUMMARY: summary }, input: judgeSource() });
  return { ...r, verdict: JSON.parse(readFileSync('/tmp/verdict.json', 'utf8')) };
}

const NOW_ISO = new Date(Date.now() - 5 * 60000).toISOString();

describe('the reader builds the witness from what the house wrote', () => {
  it('names a failed and a degraded loop; the rest ran', async () => {
    answer = [200, { seen: true, at: NOW_ISO, services: 29, last_cycle: { at: NOW_ISO, ok: false, failed: ['db-backup'], degraded: ['choir-dates'] } }];
    const r = await reader();
    expect(r.code).toBe(0);
    const w = JSON.parse(r.out);
    expect(w.reachable).toBe(true);
    expect(w.road).toBe('served');
    expect(w.loops['db-backup'].last_run).toBe('failed');
    expect(w.loops['choir-dates'].last_run).toBe('degraded');
    expect(w.loops['sovereign-replay'].last_run).toBe('ok');
    expect(w.clock.age_s).toBeLessThan(600);
    expect(r.out + r.err).not.toContain('anon-key-xyz');
  }, 20000);

  it('a heartbeat with no last cycle reads unknown for every loop, never ok', async () => {
    answer = [200, { seen: true, at: NOW_ISO, services: 29 }];
    const w = JSON.parse((await reader()).out);
    expect(Object.values(w.loops).every((e) => e.last_run === 'unknown')).toBe(true);
  }, 20000);

  it('a cycle that did not finish and named nobody reads unknown', async () => {
    answer = [200, { seen: true, at: NOW_ISO, last_cycle: { at: NOW_ISO, ok: false, failed: [], degraded: [] } }];
    const w = JSON.parse((await reader()).out);
    expect(w.loops['db-backup'].last_run).toBe('unknown');
  }, 20000);
});

describe('PROVEN TO CATCH: it never claims what it did not read', () => {
  it('no heartbeat ever written: unreachable, with why', async () => {
    answer = [200, { seen: false }];
    const w = JSON.parse((await reader()).out);
    expect(w.reachable).toBe(false);
    expect(w.why).toMatch(/no heartbeat/);
  }, 20000);

  it('the receipt not on the live database yet: unreachable, naming 0318', async () => {
    answer = [404, { code: 'PGRST202' }];
    const w = JSON.parse((await reader()).out);
    expect(w.reachable).toBe(false);
    expect(w.why).toMatch(/0318/);
  }, 20000);

  it('no key: unreachable, and nothing is asked', async () => {
    asked = 0;
    const w = JSON.parse((await reader('')).out);
    expect(w.reachable).toBe(false);
    expect(asked).toBe(0);
  }, 20000);

  it('--needed: ask the house only when the box did not answer', async () => {
    const f = join(TMP, 'w.json');
    writeFileSync(f, JSON.stringify({ reachable: true }));
    expect((await run('python3', [READER, '--needed', f])).code).toBe(1);
    writeFileSync(f, JSON.stringify({ reachable: false }));
    expect((await run('python3', [READER, '--needed', f])).code).toBe(0);
    writeFileSync(f, 'ssh: garbled');
    expect((await run('python3', [READER, '--needed', f])).code).toBe(0);
    expect((await run('python3', [READER, '--needed', join(TMP, 'missing.json')])).code).toBe(0);
  }, 20000);
});

describe("loops-health's own judge, run on the house's witness", () => {
  it('a failed loop is a problem; the served road does not invent an installer problem', async () => {
    answer = [200, { seen: true, at: NOW_ISO, last_cycle: { at: NOW_ISO, ok: false, failed: ['db-backup'], degraded: [] } }];
    const w = JSON.parse((await reader()).out);
    const j = await judge(w);
    expect(j.code).toBe(0);
    expect(j.verdict.pass).toBe(false);
    expect(j.verdict.problems).toEqual(["db-backup: last run failed: services-sync's last run, by the house's own heartbeat: failed"]);
  }, 20000);

  it('a clean cycle passes', async () => {
    answer = [200, { seen: true, at: NOW_ISO, last_cycle: { at: NOW_ISO, ok: true, failed: [], degraded: [] } }];
    const j = await judge(JSON.parse((await reader()).out));
    expect(j.verdict.pass).toBe(true);
  }, 20000);

  it('an unreachable house says both roads failed, and why', async () => {
    answer = [200, { seen: false }];
    const j = await judge(JSON.parse((await reader()).out));
    expect(j.verdict.pass).toBe(false);
    expect(j.verdict.problems[0]).toMatch(/did not answer over SSH, and over poetech\.us: /);
  }, 20000);

  it('a stale heartbeat reads as a clock that is not firing', async () => {
    const old = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    answer = [200, { seen: true, at: old, last_cycle: { at: old, ok: true, failed: [], degraded: [] } }];
    const j = await judge(JSON.parse((await reader()).out));
    expect(j.verdict.problems.join(' ')).toMatch(/it is not firing/);
  }, 20000);
});

describe('the wiring', () => {
  it('the join may fail; the house is asked only when the box did not answer', () => {
    const join_ = WF.slice(WF.indexOf('- name: Join the tailnet (ephemeral)'), WF.indexOf('- name: Ask the box'));
    expect(join_).toMatch(/continue-on-error: true/);
    const step = WF.slice(WF.indexOf("read the house's own heartbeat"), WF.indexOf('- name: Judge each loop'));
    expect(step).toContain('served-heartbeat-receipt.py --needed /tmp/witness.json || exit 0');
    expect(step).toContain('::add-mask::$KEY');
    expect(step).toContain('> /tmp/witness.next && mv /tmp/witness.next /tmp/witness.json');
    expect(WF.indexOf("read the house's own heartbeat")).toBeLessThan(WF.indexOf('- name: Judge each loop'));
  });

  it('the house is asked about exactly the loops the box is asked about', () => {
    const boxList = WF.match(/loops = \[([^\]]+)\]/)[1]
      .split(',')
      .map((s) => s.trim().replace(/"/g, ''));
    const houseList = WF.match(/served-heartbeat-receipt\.py --loops "([^"]+)"/)[1].split(',');
    expect(houseList).toEqual(boxList);
  });

  it('the receipt (0318) is narrow: definer, fixed path, only the NAS rows, only shaped names, no host or reason', () => {
    const sql = read('infra/supabase/migrations-auto/0318-the-house-says-how-its-clock-ran.sql');
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/SET search_path = public/);
    expect(sql).toMatch(/AND source = 'nas-loops'/);
    expect(sql).toContain("x ~ '^[a-z0-9][a-z0-9-]{0,59}$'");
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.nas_heartbeat_receipt\(\) TO anon, authenticated;/);
    const built = sql.slice(sql.indexOf('RETURN jsonb_strip_nulls'));
    expect(built).not.toMatch(/'host'/);
    expect(built).not.toMatch(/'reason'|'summary'/);
  });
});

describe("the heartbeat's own Python tests run in CI", () => {
  // test_heartbeat.py (DR-1360) was never called by any workflow: a gate
  // nothing runs is not a gate. It runs here, inside the required vitest job,
  // with the DR-1399 last-cycle cases (names matched from the registry, never
  // split out of free text, proven to catch).
  it('python3 -m unittest test_heartbeat passes', async () => {
    const r = await new Promise((resolve) => {
      const child = spawn('python3', ['-m', 'unittest', 'test_heartbeat'], { cwd: join(ROOT, 'infra', 'nas-loops') });
      let out = '';
      child.stdout.on('data', (d) => (out += d));
      child.stderr.on('data', (d) => (out += d));
      child.on('close', (code) => resolve({ code, out }));
    });
    expect(r.out).toMatch(/Ran \d+ tests/);
    expect(r.out).toMatch(/\nOK\s*$/);
    expect(r.code).toBe(0);
  }, 60000);
});
