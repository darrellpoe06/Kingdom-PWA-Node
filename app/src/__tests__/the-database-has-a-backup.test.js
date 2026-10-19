// @vitest-environment node
// =============================================================================
// The sovereign database has a backup (DR-1113)
// =============================================================================
// infra/nas-supabase/README.md: "Backups. Hosted Supabase did this invisibly.
// On the NAS it is ours, and it is not optional for the family's data." None
// was built until DR-1113. These cases run the REAL db_backup.sh against a
// fake `docker` that stands in for the supabase-db container, and pin what a
// backup must never do: lose the last good copy to a bad night, keep an
// archive that would lose the sign-in accounts, or call a backup good that did
// not restore whole.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, mkdirSync, chmodSync, existsSync, rmSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = join(process.cwd(), '..');
const SCRIPT = join(ROOT, 'infra', 'nas-db-backup', 'db_backup.sh');
const INSTALL = join(ROOT, 'infra', 'nas-db-backup', 'install.sh');

// A stand-in for `docker` that answers the five calls db_backup.sh makes.
const FAKE_DOCKER = `#!/bin/sh
[ "$1" = ps ] && exit 0
shift
while [ $# -gt 0 ]; do case "$1" in -i) shift;; -e|-u) shift 2;; *) break;; esac; done
shift
cmd="$1"; shift
db=""; sql=""; list=""
while [ $# -gt 0 ]; do case "$1" in -d) db="$2"; shift 2;; -c) sql="$2"; shift 2;; --list) list=1; shift;; *) shift;; esac; done
case "$cmd" in
  pg_dump)
    [ -n "$FAKE_DUMP_FAIL" ] && { echo "pg_dump: connection to server failed" >&2; exit 1; }
    printf 'PGDMP fake archive %s' "$(date +%s%N)"; exit 0 ;;
  pg_restore)
    cat >/dev/null
    if [ -n "$list" ]; then
      [ -z "$FAKE_NO_AUTH" ] && printf '1; 1259 16390 TABLE auth users supabase_auth_admin\\n'
      printf '2; 1259 16500 TABLE public accounts postgres\\n'
    fi
    exit 0 ;;
  psql)
    case "$sql" in
      *"auth.users"*) if [ "$db" = poetech_restore_drill ] && [ -n "$FAKE_DRILL_SHORT" ]; then echo 1; else echo 23; fi ;;
      *pg_tables*) echo 316 ;;
    esac
    exit 0 ;;
esac
exit 0
`;

let dir; let dest; let env;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'dbbackup-'));
  dest = join(dir, 'backups');
  const bin = join(dir, 'docker');
  writeFileSync(bin, FAKE_DOCKER); chmodSync(bin, 0o755);
  const envFile = join(dir, '.env');
  writeFileSync(envFile, 'POSTGRES_PASSWORD=not-a-real-secret\n');
  env = { ...process.env, DOCKER_BIN: bin, BACKUP_ENV_FILE: envFile, BACKUP_DIR: dest, BACKUP_DRILL: 'always' };
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const run = (extra = {}) => spawnSync('sh', [SCRIPT], { env: { ...env, ...extra }, encoding: 'utf8' });
const dumps = () => (existsSync(dest) ? readdirSync(dest).filter((f) => /^poetech-db-.*\.dump$/.test(f)).sort() : []);
const status = () => JSON.parse(readFileSync(join(dest, 'status.json'), 'utf8'));
const seedOld = (n) => {
  mkdirSync(dest, { recursive: true });
  for (let i = 0; i < n; i += 1) {
    const f = join(dest, `poetech-db-2026010${i + 1}T020000Z.dump`);
    writeFileSync(f, `old ${i}`); writeFileSync(`${f}.sha256`, 'x');
    const t = Date.now() / 1000 - (n - i) * 86400;
    utimesSync(f, t, t);
  }
};

describe('a good night', () => {
  it('writes one verified archive with its checksum, drills a restore, and says so in status.json', () => {
    const r = run();
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const d = dumps();
    expect(d).toHaveLength(1);
    const sum = spawnSync('sha256sum', ['-c', `${d[0]}.sha256`], { cwd: dest, encoding: 'utf8' });
    expect(sum.status, sum.stdout + sum.stderr).toBe(0);
    const s = status();
    expect(s.ok).toBe(true);
    expect(s.file).toBe(d[0]);
    expect(s.toc_entries).toBe(2);
    expect(s.drill).toMatch(/^passed: auth\.users 23 of 23, public tables 316 of 316$/);
    expect(readdirSync(dest).some((f) => f.startsWith('.partial-'))).toBe(false);
    expect(existsSync(join(dest, '.lock'))).toBe(false);
  });
  it('keeps only the newest KEEP archives, and the new one is always among them', () => {
    seedOld(3);
    const r = run({ BACKUP_KEEP: '2' });
    expect(r.status, r.stdout).toBe(0);
    const d = dumps();
    expect(d).toHaveLength(2);
    expect(d.some((f) => f === status().file)).toBe(true);
    expect(d).toContain('poetech-db-20260103T020000Z.dump');
  });
});

describe('a bad night never costs the last good copy', () => {
  it('PROVEN TO CATCH: a failed dump deletes nothing, leaves no partial file, and reports why', () => {
    seedOld(2);
    const r = run({ FAKE_DUMP_FAIL: '1', BACKUP_KEEP: '1' });
    expect(r.status).toBe(5);
    expect(dumps()).toEqual(['poetech-db-20260101T020000Z.dump', 'poetech-db-20260102T020000Z.dump']);
    expect(readdirSync(dest).some((f) => f.startsWith('.partial-'))).toBe(false);
    expect(status().ok).toBe(false);
    expect(status().error).toMatch(/pg_dump/);
  });
  it('an archive that does not hold the sign-in accounts is refused, and nothing is retired', () => {
    seedOld(1);
    const r = run({ FAKE_NO_AUTH: '1', BACKUP_KEEP: '1' });
    expect(r.status).toBe(6);
    expect(dumps()).toEqual(['poetech-db-20260101T020000Z.dump']);
    expect(status().error).toMatch(/auth\.users/);
  });
  it('a restore that comes back short is a failed backup, though the archive is kept for a person to look at', () => {
    const r = run({ FAKE_DRILL_SHORT: '1' });
    expect(r.status).toBe(7);
    expect(dumps()).toHaveLength(1);
    expect(status().ok).toBe(false);
    expect(status().drill).toMatch(/FAILED: auth\.users 1 of 23/);
  });
  it('one run at a time: a held lock is "busy", not a second dump', () => {
    mkdirSync(join(dest, '.lock'), { recursive: true });
    const r = run();
    expect(r.status).toBe(3);
    expect(dumps()).toHaveLength(0);
  });
});

describe('the services-sync rider', () => {
  const ienv = () => ({ ...env, POETECH_REPO: ROOT });
  it('costs nothing outside the night window', () => {
    const h = new Date().getHours();
    const away = h >= 12 ? '0-1' : '22-23';
    const r = spawnSync('sh', [INSTALL], { env: { ...ienv(), BACKUP_HOURS: away }, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/not due \(local hour/);
    expect(existsSync(join(dest, '.lock'))).toBe(false);
  });
  it('does not run twice in one night: a fresh success stamp means not due', () => {
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, '.last-ok'), '');
    const r = spawnSync('sh', [INSTALL], { env: { ...ienv(), BACKUP_HOURS: '0-23' }, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/not due \(last success under 20h ago\)/);
  });
  it('is registered on the services-sync clock, enabled, right after the database it backs up', () => {
    const doc = JSON.parse(readFileSync(join(ROOT, 'infra', 'nas-loops', 'services.json'), 'utf8'));
    const names = doc.services.map((s) => s.name);
    const i = names.indexOf('db-backup');
    expect(i).toBeGreaterThan(-1);
    expect(names[i - 1]).toBe('supabase');
    expect(doc.services[i].enabled).toBe(true);
    expect(doc.services[i].install).toBe('infra/nas-db-backup/install.sh');
  });
});
