// @vitest-environment node
// =============================================================================
// The NAS keeps and reads the church office's pictures itself (DR-1650).
// infra/nas-church-archive/install.sh is run for real by /bin/sh against a
// stand-in repo whose five steps are stubs, so its own logic is what is
// tested: the order of the steps, the 6-hour gate, the lock, the read's
// stop-path, the key handed to the reader and never printed, and a red pass
// when a step fails. Each brake is shown to catch (DR-0076).
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const INSTALL = join(ROOT, 'infra/nas-church-archive/install.sh');
const SECRET = 'sk-ant-test-NEVER-PRINT-ME';

let repo;
let keyFile;
const write = (rel, text) => {
  const p = join(repo, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
};
const ran = () => (existsSync(join(repo, 'ran.txt')) ? readFileSync(join(repo, 'ran.txt'), 'utf8').trim().split('\n') : []);
const pass = (env = {}) =>
  spawnSync('/bin/sh', [join(repo, 'infra/nas-church-archive/install.sh')], {
    env: { PATH: process.env.PATH, POETECH_REPO: repo, CHURCH_ARCHIVE_KEY_FILE: keyFile, ...env },
    encoding: 'utf8',
  });

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'church-archive-'));
  keyFile = join(repo, 'no-key-here');
  mkdirSync(join(repo, 'infra/nas-church-archive'), { recursive: true });
  copyFileSync(INSTALL, join(repo, 'infra/nas-church-archive/install.sh'));
  const log = `require('fs').appendFileSync(${JSON.stringify(join(repo, 'ran.txt'))}, process.argv[2] + '\\n');`;
  // collect: writes a manifest. read: records whether it was handed a key, writes reads.json.
  write(
    'scripts/church-site-archive-collect.mjs',
    `${log.replace('process.argv[2]', "'collect'")}
const fs=require('fs');const i=process.argv.indexOf('--out');fs.mkdirSync(process.argv[i+1],{recursive:true});
fs.writeFileSync(process.argv[i+1]+'/manifest.json','{"items":[]}');console.log('pictures: 2');`.replace(/require/g, 'require')
  );
  write(
    'scripts/church-calendar-read.mjs',
    `const fs=require('fs');fs.appendFileSync(${JSON.stringify(join(repo, 'ran.txt'))}, 'read key=' + (process.env.ANTHROPIC_API_KEY === ${JSON.stringify(SECRET)} ? 'handed' : 'missing') + ' max=' + process.env.CHURCH_CALENDAR_READ_MAX + '\\n');
fs.writeFileSync(process.argv[2]+'/reads.json','[]');console.log('CALENDAR-READ read=1 events=3 failed=0');`
  );
  write(
    'infra/nas-church-archive/church_archive_keep.py',
    `import sys;open(${JSON.stringify(join(repo, 'ran.txt'))},'a').write('keep\\n');print('ARCHIVE-RESULT kept=1');sys.exit(int(__import__('os').environ.get('KEEP_EXIT','0')))`
  );
  write(
    'infra/nas-church-archive/church_calendar_reads.py',
    `import sys,os;open(${JSON.stringify(join(repo, 'ran.txt'))},'a').write(sys.argv[1]+'\\n')
if sys.argv[1]=='pull':
  os.makedirs(sys.argv[2],exist_ok=True);print('PULL-RESULT pulled=1')
else:
  print('READ-RESULT filed=1')`
  );
});

// The stubs are CommonJS scripts named .mjs only to sit where the real ones do; run them as CommonJS.
const asCjs = () => {
  for (const f of ['scripts/church-site-archive-collect.mjs', 'scripts/church-calendar-read.mjs']) {
    const p = join(repo, f);
    writeFileSync(p.replace(/\.mjs$/, '.cjs'), readFileSync(p, 'utf8'));
    writeFileSync(p, `import('./${f.split('/').pop().replace('.mjs', '.cjs')}');`);
  }
};

describe('the NAS pass (install.sh)', () => {
  it('runs collect, keep, pull and file in order; with no key file the read is a named no-op', () => {
    asCjs();
    const r = pass();
    expect(r.status).toBe(0);
    expect(ran()).toEqual(['collect', 'keep', 'pull']);
    expect(r.stdout).toContain('no Anthropic key file');
    expect(r.stdout).toContain('church-archive: OK');
  });

  it('hands the key to the reader alone, three pictures a pass, and never prints it', () => {
    asCjs();
    keyFile = join(repo, 'anthropic-api-key.txt');
    writeFileSync(keyFile, SECRET);
    const r = pass();
    expect(r.status).toBe(0);
    expect(ran()).toEqual(['collect', 'keep', 'pull', 'read key=handed max=3', 'file']);
    expect(r.stdout + r.stderr).not.toContain(SECRET);
    expect(readFileSync(join(repo, 'infra/nas-church-archive/state/church-archive.out'), 'utf8')).not.toContain(SECRET);
  });

  it('PROVEN TO CATCH: a second pass inside 6 hours does nothing', () => {
    asCjs();
    pass();
    const before = ran().length;
    const r = pass();
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/ran \d+ min ago; next in \d+ min/);
    expect(ran().length).toBe(before);
  });

  it('PROVEN TO CATCH: a pass that finds the lock held skips', () => {
    asCjs();
    mkdirSync(join(repo, 'infra/nas-church-archive/state/church-archive.lock.d'), { recursive: true });
    const r = pass();
    expect(r.stdout).toContain('another pass holds the lock; skipped');
    expect(ran()).toEqual([]);
  });

  it('CHURCH_CALENDAR_READ=off stops the read only; pictures are still kept', () => {
    asCjs();
    keyFile = join(repo, 'anthropic-api-key.txt');
    writeFileSync(keyFile, SECRET);
    write('infra/nas-church-archive/church-archive.env', 'CHURCH_CALENDAR_READ=off\n');
    const r = pass();
    expect(ran()).toEqual(['collect', 'keep', 'pull']);
    expect(r.stdout).toContain('reading is OFF');
  });

  it('a step that fails makes the pass red, and the steps after it still run', () => {
    asCjs();
    const r = pass({ KEEP_EXIT: '3' });
    expect(r.status).toBe(3);
    expect(ran()).toEqual(['collect', 'keep', 'pull']);
    expect(r.stderr).toContain('church-archive: FAILED (exit 3)');
  });

  it('leaves no lock behind after a pass', () => {
    asCjs();
    pass();
    expect(existsSync(join(repo, 'infra/nas-church-archive/state/church-archive.lock.d'))).toBe(false);
    rmSync(repo, { recursive: true, force: true });
  });
});
