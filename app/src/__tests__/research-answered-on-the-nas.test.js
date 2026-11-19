// =============================================================================
// The NAS answers its own research items (DR-1443)
// =============================================================================
// Darrell 2026-11-12: "We have a research space does it work?!!!! Fix it!!!!!"
// It did not: research-inbox.yml ran on a GitHub runner that joined the
// tailnet, and that key expired 2026-11-04, so every run died at the join and
// every question sat "Waiting to be looked into". infra/nas-research/
// research-inbox-nas.sh runs the same lane ON the NAS (DR-1360).
//
// These run the real script end to end with three stand-ins and no network:
// the database is a stub that answers by the shape of the SQL it is handed,
// the forwarder's /ask and /read are a local HTTP server that demands the
// family key, and the filer is `true`. What is pinned:
//   * one item is claimed at a time (LIMIT 1, FOR UPDATE SKIP LOCKED) --
//     proven to catch: a copy without the rewrite refuses to claim at all;
//   * the answer row's FIRST LINE is the unverified sentence, it names its
//     parent with of:<id> and belongs to the sender -- proven to catch: a
//     copy that drops the sentence fails the same check;
//   * the question's words never reach the log;
//   * a run that finds another run alive skips without touching the database.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import http from 'node:http';
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPT = join(REPO, 'infra', 'nas-research', 'research-inbox-nas.sh');
const SOURCE = readFileSync(SCRIPT, 'utf8');

const ID = '11111111-2222-4333-8444-555555555555';
const BY = 'c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc';
const INST = '99999999-8888-4777-8666-555555555555';
const QUESTION = 'What does a sovereign research road need to answer a family question safely?';
const UNVERIFIED = 'Unverified: this came from a web search and our own model. Read the source before relying on a sentence.';

let server;
let port;
let asked = 0;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => {
      body += c;
    });
    req.on('end', () => {
      if (req.headers.authorization !== 'Bearer family-key') {
        res.writeHead(401);
        res.end('{}');
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/ask') {
        asked += 1;
        const q = JSON.parse(body).query;
        res.end(
          JSON.stringify({
            answer: `An answer to: ${q.length} characters asked, with care.`,
            verified: false,
            sources: [{ url: 'https://example.org/source' }],
          })
        );
      } else if (req.url === '/read') {
        res.end(
          JSON.stringify({
            verified: false,
            reading: { what: 'a research answer', opportunities: ['use it'], constraints: ['check it'], next: 'read the source', lands: 'research' },
          })
        );
      } else {
        res.writeHead(404);
        res.end('{}');
      }
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

afterAll(() => new Promise((r) => server.close(r)));

/** A database stand-in: answers by the SQL's shape and keeps every statement. */
function stage() {
  const dir = mkdtempSync(join(tmpdir(), 'research-nas-'));
  const log = join(dir, 'sql.log');
  const claimed = join(dir, 'claimed');
  const stub = join(dir, 'sql-stub.sh');
  const row = `${ID}|${BY}|${INST}|${Buffer.from(QUESTION).toString('base64')}`;
  writeFileSync(
    stub,
    `#!/usr/bin/env bash
sql="$(cat)"
printf '%s\\n----\\n' "$sql" >> "${log}"
case "$sql" in
  *"FOR UPDATE SKIP LOCKED"*) if [ ! -e "${claimed}" ]; then : > "${claimed}"; echo "${ID}"; fi ;;
  *"SELECT id, created_by, instance_id, replace"*) echo "${row}" ;;
  *"INSERT INTO public.agent_inbox"*) echo "child-row" ;;
  *) : ;;
esac
`
  );
  chmodSync(stub, 0o755);
  const token = join(dir, 'token.txt');
  writeFileSync(token, 'family-key\n');
  return { dir, log, stub, token, home: join(dir, 'home') };
}

async function lane(s, script = SCRIPT) {
  const env = {
    ...process.env,
    POETECH_REPO: REPO,
    RESEARCH_NAS_HOME: s.home,
    RESEARCH_LIVE_SQL: s.stub,
    RESEARCH_CREATE: 'true',
    RESEARCH_TOKEN_FILE: s.token,
    RESEARCH_ASK_URL: `http://127.0.0.1:${port}/ask`,
    RESEARCH_READ_URL: `http://127.0.0.1:${port}/read`,
  };
  try {
    const { stdout } = await run('bash', [script], { env, timeout: 60000 });
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.code, stdout: e.stdout || '' };
  }
}

const statements = (s) => (existsSync(s.log) ? readFileSync(s.log, 'utf8').split('\n----\n').filter(Boolean) : []);

/** The answer row the lane wrote, decoded, or null. */
function answerRow(s) {
  const ins = statements(s).find((q) => q.includes('INSERT INTO public.agent_inbox') && q.includes('research-answer'));
  if (!ins) return null;
  const b64 = ins.match(/decode\('([A-Za-z0-9+/=]+)','base64'\)/)[1];
  return { sql: ins, body: Buffer.from(b64, 'base64').toString('utf8') };
}

const answerIsHonest = (a) =>
  !!a &&
  a.body.startsWith(`${UNVERIFIED}\n`) &&
  a.sql.includes(`"of:${ID}"`) &&
  a.sql.includes(`'${BY}'`) &&
  a.sql.includes('tags || \'["research-answered"]\'');

describe('research-inbox-nas.sh -- the NAS answers a question itself', () => {
  it('claims ONE item at a time, under SKIP LOCKED', async () => {
    const s = stage();
    const r = await lane(s);
    expect(r.code).toBe(0);
    const claims = statements(s).filter((q) => q.includes('FOR UPDATE SKIP LOCKED'));
    expect(claims.length).toBeGreaterThanOrEqual(1);
    for (const c of claims) {
      expect(c).toMatch(/LIMIT 1\b/);
      expect(c).not.toMatch(/LIMIT 6\b/);
    }
  });

  it('PROVEN TO CATCH: without the one-at-a-time rewrite it refuses to claim at all', async () => {
    const s = stage();
    const mutant = join(s.dir, 'mutant.sh');
    writeFileSync(mutant, SOURCE.replace("sed 's/LIMIT 6/LIMIT 1/'", 'cat'));
    expect(readFileSync(mutant, 'utf8')).not.toBe(SOURCE);
    const r = await lane(s, mutant);
    expect(r.code).toBe(1);
    expect(statements(s).some((q) => q.includes('FOR UPDATE SKIP LOCKED'))).toBe(false);
  });

  it('writes the answer with the unverified sentence FIRST, to its parent, as the sender', async () => {
    const s = stage();
    asked = 0;
    const r = await lane(s);
    expect(r.code).toBe(0);
    expect(asked).toBe(1);
    const a = answerRow(s);
    expect(answerIsHonest(a)).toBe(true);
    expect(a.body).toContain('https://example.org/source');
    // The reading ran in the same pass and wrote its own row.
    expect(statements(s).some((q) => q.includes('research-reading') && q.includes('INSERT INTO'))).toBe(true);
    const ledger = JSON.parse(readFileSync(join(s.home, 'last-run.json'), 'utf8'));
    expect(ledger).toMatchObject({ what: 'worked', answered: 1, failed: 0, readings: 1 });
  });

  it('PROVEN TO CATCH: a copy that drops the unverified sentence fails the same check', async () => {
    const s = stage();
    const mutant = join(s.dir, 'mutant.sh');
    writeFileSync(mutant, SOURCE.replace('{ echo "$UNVERIFIED"; echo; cat "$W/answer.txt"; }', '{ cat "$W/answer.txt"; }'));
    expect(readFileSync(mutant, 'utf8')).not.toBe(SOURCE);
    await lane(s, mutant);
    const a = answerRow(s);
    expect(a).not.toBeNull();
    expect(answerIsHonest(a)).toBe(false);
  });

  it('never puts the question in the log', async () => {
    const s = stage();
    const r = await lane(s);
    expect(r.stdout).toContain(ID);
    expect(r.stdout).not.toContain(QUESTION);
    expect(r.stdout).not.toContain('family-key');
  });

  it('a run that finds another run alive skips without touching the database', async () => {
    const s = stage();
    mkdirSync(join(s.home, '.lock'), { recursive: true });
    writeFileSync(join(s.home, '.lock', 'pid'), String(process.pid));
    const r = await lane(s);
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/already going/);
    expect(statements(s)).toEqual([]);
  });

  it('a lock left by a run that is gone is released, and the run goes on', async () => {
    const s = stage();
    mkdirSync(join(s.home, '.lock'), { recursive: true });
    writeFileSync(join(s.home, '.lock', 'pid'), '999999');
    const r = await lane(s);
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/released a lock/);
    expect(answerRow(s)).not.toBeNull();
    expect(existsSync(join(s.home, '.lock'))).toBe(false);
  });

  it('stops when told to, and the installer starts it before any step that can stop', () => {
    const install = readFileSync(join(REPO, 'infra', 'nas-research', 'install.sh'), 'utf8');
    const lanePos = install.indexOf('research-inbox-nas.sh');
    expect(lanePos).toBeGreaterThan(0);
    expect(lanePos).toBeLessThan(install.indexOf('== research install: token =='));
    expect(install).toMatch(/timeout 3300 bash "\$SRC\/research-inbox-nas\.sh"/);
    expect(SOURCE).toMatch(/RESEARCH_NAS_ENABLED:-1}" = 0/);
  });
});
