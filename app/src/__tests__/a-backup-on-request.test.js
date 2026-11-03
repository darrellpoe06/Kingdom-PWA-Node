// a-backup-on-request.test.js — a steward can ask for a database backup from the
// app, and the verdict comes back on the request row (DR-1289).
// Measured 2026-10-29: the runner's tailnet key had been refused for a day, so no
// nightly backup could be confirmed from outside while a release waited on one.
// The ops queue (DR-0088) is the road that needs neither that key nor Cloudflare.
// These run the REAL ops-runner.py job functions against a stand-in db_backup.sh.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OPS_JOBS } from '../lib/ops-commands.js';

const here = dirname(fileURLToPath(import.meta.url));
const RUNNER = join(here, '../../../infra/nas-sme-pipeline/ops-runner.py');

function run(job, { script, preLock = false, waitS = 20 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'backup-req-'));
  const backups = join(dir, 'backups'); mkdirSync(backups);
  writeFileSync(join(backups, 'status.json'), JSON.stringify({ ok: true, at: '2026-10-27T07:00:39Z', file: 'old.dump', bytes: 1 }));
  if (preLock) mkdirSync(join(backups, '.lock'));
  const fake = join(dir, 'db_backup.sh');
  writeFileSync(fake, script || '');
  const py = `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("ops_runner", ${JSON.stringify(RUNNER)})
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.BACKUP_DIR = ${JSON.stringify(backups)}
m.BACKUP_SCRIPT = ${JSON.stringify(fake)}
m.BACKUP_WAIT_S = ${waitS}
status, text, result = m.JOBS[${JSON.stringify(job)}]({})
print(json.dumps({"status": status, "text": text, "result": result}))
`;
  const out = execFileSync('python3', ['-c', py], { encoding: 'utf8', timeout: 60000 });
  return { ...JSON.parse(out.trim().split('\n').pop()), backups };
}

const GOOD = `#!/bin/sh
sleep 1
echo '{"ok":true,"at":"2026-10-29T03:00:00Z","file":"new.dump","bytes":285000000,"toc_entries":6925,"drill":"skipped","kept":9,"error":""}' > "$(dirname "$0")/backups/status.json"
`;
const BAD = `#!/bin/sh
echo '{"ok":false,"at":"2026-10-29T03:00:00Z","file":"","bytes":0,"error":"pg_dump failed"}' > "$(dirname "$0")/backups/status.json"
exit 5
`;

describe('the backup can be asked for from the app', () => {
  it('both jobs are offered in the app and exist in the runner whitelist', () => {
    const src = readFileSync(RUNNER, 'utf8');
    for (const j of ['db-backup', 'db-backup-status']) {
      expect(OPS_JOBS[j], j).toBeTruthy();
      expect(src).toMatch(new RegExp(`["']${j}["']\\s*:\\s*job_`));
    }
  });
  it('a request starts the backup and the NEW verdict comes back on the row', () => {
    const r = run('db-backup', { script: GOOD });
    expect(r.status).toBe('done');
    expect(r.result.ok).toBe(true);
    expect(r.result.verdict.file).toBe('new.dump');
    expect(existsSync(join(r.backups, '.last-ok'))).toBe(true); // the nightly counts it, so no second dump hours later
  }, 60000);
  it('PROVEN TO CATCH: a failed backup reads as an error, never as done, and the old verdict is not passed off as new', () => {
    const r = run('db-backup', { script: BAD });
    expect(r.status).toBe('error');
    expect(r.result.ok).toBe(false);
    expect(r.text).toContain('pg_dump failed');
    expect(existsSync(join(r.backups, '.last-ok'))).toBe(false);
  }, 60000);
  it('a backup already running is refused, not doubled', () => {
    const r = run('db-backup', { script: GOOD, preLock: true });
    expect(r.status).toBe('error');
    expect(r.result.started).toBe(false);
    expect(r.text).toMatch(/already running/);
  }, 60000);
  it('a dump that outlasts the wait says so instead of claiming a verdict', () => {
    const r = run('db-backup', { script: '#!/bin/sh\nsleep 30\n', waitS: 2 });
    expect(r.status).toBe('done');
    expect(r.result.ok).toBeNull();
    expect(r.text).toMatch(/still running/);
  }, 60000);
  it('the status job reads the newest verdict', () => {
    const r = run('db-backup-status');
    expect(r.status).toBe('done');
    expect(r.result.verdict.file).toBe('old.dump');
  }, 60000);
});
