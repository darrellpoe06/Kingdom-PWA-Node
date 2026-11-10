// =============================================================================
// the-house-says-what-it-applied -- the proof of a migration rides the public
// road, never a reach-in (DR-1398, under DR-1360)
// =============================================================================
// Darrell 2026-11-10: "Why can't we do it another way. Same outcome. Don't need
// anything because we designed it." The NAS applies every merged migration on
// its own clock (DR-1269). The lane used to learn whether it had by joining the
// tailnet, so a dead key turned a landed migration into a red lane. Now the
// live database's own ledger answers over poetech.us/sb with the anon key the
// site ships (migration 0317 + scripts/served-migration-receipt.py), and the
// reach-in is support that may fail without reddening anything.
//
// This runs the REAL reader against a local stand-in for the live database and
// pins every way it must refuse rather than guess (DR-0076 section 8).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const READER = join(ROOT, 'scripts', 'served-migration-receipt.py');
const MIG = 'infra/supabase/migrations-auto/0317-the-house-says-what-it-has-applied.sql';

// A stand-in migrations directory, so the cases do not depend on the repo's count.
const DIR = mkdtempSync(join(tmpdir(), 'receipt-'));
for (const f of ['0315-a.sql', '0316-b.sql', '0317-c.sql']) writeFileSync(join(DIR, f), '-- x');

let server;
let origin;
let answers = [];
let heartbeat = [200, { seen: false }];
let asked = [];
beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      asked.push({ url: req.url, key: req.headers.apikey, body: JSON.parse(body || '{}') });
      const [status, json] = req.url.includes('nas_heartbeat_receipt') ? heartbeat : answers.length > 1 ? answers.shift() : answers[0];
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(json));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server && server.close());

function runReader(args, key = 'anon-key-xyz') {
  return new Promise((resolve) => {
    const env = { ...process.env, SOVEREIGN_ANON_KEY: key };
    delete env.GITHUB_STEP_SUMMARY;
    const child = spawn('python3', [READER, '--dir', DIR, '--timeout', '2', ...args], { env });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ code, out }));
  });
}

const receipt = (missing) => [200, { ledger: true, applied: 316, newest: '0316-b.sql', last_applied_at: '2026-11-10T12:00:00Z', asked: 3, missing }];

describe('the reader asks the live database over the public road', () => {
  it('every file applied: exit 0, and it asked with the files and the key the site ships', async () => {
    answers = [receipt([])];
    asked = [];
    const r = await runReader(['--origin', origin]);
    expect(r.code).toBe(0);
    expect(asked[0].url).toBe('/sb/rest/v1/rpc/sovereign_migration_receipt');
    expect(asked[0].key).toBe('anon-key-xyz');
    expect(asked[0].body.p_files).toEqual(['0315-a.sql', '0316-b.sql', '0317-c.sql']);
    expect(r.out).toContain('0 not applied');
    expect(r.out).not.toContain('anon-key-xyz');
  }, 20000);

  it('files still missing when the wait ends: exit 20, and each is named', async () => {
    answers = [receipt(['0317-c.sql'])];
    const r = await runReader(['--origin', origin]);
    expect(r.code).toBe(20);
    expect(r.out).toContain('not applied: 0317-c.sql');
  }, 20000);

  it('waits for the NAS clock: missing on the first ask, applied on the next, exit 0', async () => {
    answers = [receipt(['0317-c.sql']), receipt([])];
    asked = [];
    const r = await runReader(['--origin', origin, '--wait', '5', '--interval', '1']);
    expect(r.code).toBe(0);
    expect(asked.length).toBe(2);
    expect(r.out).toContain('the NAS clock applies them');
  }, 20000);
});

describe('PROVEN TO CATCH: it refuses rather than guesses', () => {
  it('the wrong database answered (no sovereign ledger): exit 22, never "nothing missing"', async () => {
    answers = [[200, { ledger: false }]];
    const r = await runReader(['--origin', origin]);
    expect(r.code).toBe(22);
  }, 20000);

  it('the receipt is not on the live database yet (0317 unapplied): exit 21', async () => {
    answers = [[404, { code: 'PGRST202', message: 'Could not find the function' }]];
    const r = await runReader(['--origin', origin]);
    expect(r.code).toBe(21);
  }, 20000);

  it('an error answer is not a receipt: exit 14', async () => {
    answers = [[502, { error: 'bad gateway' }]];
    const r = await runReader(['--origin', origin]);
    expect(r.code).toBe(14);
  }, 20000);

  it('nothing listening: exit 14', async () => {
    const r = await runReader(['--origin', 'http://127.0.0.1:9']);
    expect(r.code).toBe(14);
  }, 20000);

  it('no key: exit 2, and nothing is asked', async () => {
    asked = [];
    const r = await runReader(['--origin', origin], '');
    expect(r.code).toBe(2);
    expect(asked.length).toBe(0);
  }, 20000);
});

describe('the receipt itself (migration 0317)', () => {
  const sql = read(MIG);
  it('is narrow: definer with a fixed search_path, bounded and shaped input, granted to anon and authenticated only', () => {
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/SET search_path = public/);
    expect(sql).toMatch(/u\.n <= 1000/);
    expect(sql).toContain("'^[0-9]{4}-[a-z0-9-]{1,120}\\.sql$'");
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.sovereign_migration_receipt\(text\[\]\) FROM PUBLIC/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.sovereign_migration_receipt\(text\[\]\) TO anon, authenticated;/);
  });
  it('says so when there is no sovereign ledger, instead of reporting nothing missing', () => {
    expect(sql).toMatch(/to_regclass\('public\._sovereign_replay'\) IS NULL THEN\s+RETURN jsonb_build_object\('ledger', false\)/);
  });
});

describe('db-migrate: the house is the authority, the reach-in is support', () => {
  const y = read('.github/workflows/db-migrate.yml');
  const step = (name) => y.slice(y.indexOf(name), y.indexOf('\n      - ', y.indexOf(name) + 1));

  it('the tailnet join and the reach-in may fail without reddening the lane', () => {
    expect(step('Land the same migrations on the SOVEREIGN database')).toMatch(/continue-on-error: true/);
    expect(step('Replay onto the sovereign database')).toMatch(/continue-on-error: true/);
  });

  it('the receipt runs on every armed run, bounded, over the served road, with the key masked', () => {
    const r = step("Read the live database's own receipt over the served road");
    expect(r).toMatch(/id: receipt/);
    expect(r).toMatch(/always\(\) && hashFiles\('infra\/nas-supabase\/REPOINT-ARMED'\)/);
    expect(r).toMatch(/timeout-minutes: 30/);
    expect(r).toContain('scripts/served-anon-key.py');
    expect(r).toContain('::add-mask::$KEY');
    expect(r).toMatch(/served-migration-receipt\.py --wait 1500 --interval 60/);
    expect(r).not.toMatch(/continue-on-error/);
  });

  it('the tailnet incident is filed only when the house could not prove it either', () => {
    expect(step('Say so in the ledger when the sovereign road is shut')).toContain("steps.replay.outcome == 'failure' && steps.receipt.outcome != 'success'");
    expect(y.indexOf('id: receipt')).toBeLessThan(y.indexOf('Say so in the ledger when the sovereign road is shut'));
  });

  it('a change to the reader re-runs the lane that uses it', () => {
    expect(y).toContain("- 'scripts/served-migration-receipt.py'");
  });
});

describe('the two receipts together: a missing file asks the clock why (DR-1399)', () => {
  const fresh = () => new Date(Date.now() - 4 * 60000).toISOString();
  const why = async (hb) => {
    answers = [receipt(['0317-c.sql'])];
    heartbeat = hb;
    const r = await runReader(['--origin', origin]);
    expect(r.code).toBe(20);
    return r.out.split('\n').find((l) => l.includes("why, by the house's own clock report")) || '';
  };

  it('a stopped clock is named as the cause, not the migration', async () => {
    const old = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(await why([200, { seen: true, at: old, last_cycle: { at: old, ok: true, failed: [], degraded: [] } }])).toMatch(/clock has stopped/);
  }, 20000);

  it('a failing replay is named as the cause', async () => {
    expect(await why([200, { seen: true, at: fresh(), last_cycle: { at: fresh(), ok: false, failed: ['sovereign-replay'], degraded: [] } }])).toMatch(
      /sovereign-replay as FAILED/
    );
  }, 20000);

  it('a replay that could not run this cycle is named', async () => {
    expect(await why([200, { seen: true, at: fresh(), last_cycle: { at: fresh(), ok: true, failed: [], degraded: ['sovereign-replay'] } }])).toMatch(
      /could not run its last cycle/
    );
  }, 20000);

  it('a clean replay on a running clock means the NAS has not pulled the commit', async () => {
    expect(await why([200, { seen: true, at: fresh(), last_cycle: { at: fresh(), ok: true, failed: [], degraded: [] } }])).toMatch(
      /has not pulled this commit/
    );
  }, 20000);

  it('PROVEN TO CATCH: an unreadable clock report never guesses a cause, and never changes the verdict', async () => {
    expect(await why([200, { seen: false }])).toMatch(/cause is not known from here/);
    expect(await why([502, { error: 'bad gateway' }])).toMatch(/could not be read .*cause is not known from here/);
  }, 20000);

  it('everything applied: the clock is not asked at all', async () => {
    answers = [receipt([])];
    asked = [];
    const r = await runReader(['--origin', origin]);
    expect(r.code).toBe(0);
    expect(asked.some((a) => a.url.includes('nas_heartbeat_receipt'))).toBe(false);
  }, 20000);
});
