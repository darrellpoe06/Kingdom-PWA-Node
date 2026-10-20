// =============================================================================
// A SERVICE COMES HOME BY ONE WAY (DR-1119)
// =============================================================================
// Darrell 2026-10-19, with the home-server video: "Fix our processes and create
// a way." The night before, the research road (DR-1101) took three merges to
// say WHY it could not answer: the installer exited before it moved the running
// code, and the witness could say only "504". THE-WAY-A-SERVICE-COMES-HOME
// writes the fixes down once; this gate holds every NAS service to it:
//   * every enabled installer exists and parses;
//   * a service ON the Way has a witness that says where the install stands, a
//     door that answers with a reason, and an installer whose restart is one
//     function called from more than one path (the no-dependency path too);
//   * a service born BEFORE the Way is listed with exactly the parts it still
//     lacks and one re-review date; the list must match the files, and a date
//     that has passed fails the build;
//   * a new service must be on one list or the other (joins at birth, DR-0621);
//   * the Way is written, routed and registered.
// Proven to catch below: the old installer, a witness without its standing
// lines, and a stale ledger entry each fail.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dontRepeatFor } from '../lib/required-reading.js';
import { OPEN_SOURCE_CANDIDATES } from '../lib/open-source-candidates.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const has = (p) => existsSync(join(ROOT, p));
const WAY = 'docs/00-foundations/_root/THE-WAY-A-SERVICE-COMES-HOME.md';

const SERVICES = JSON.parse(read('infra/nas-loops/services.json')).services;
const ENABLED = SERVICES.filter((s) => s.enabled);

/** The services that walk the whole Way: their door answers with a reason. */
const ON_THE_WAY = {
  research: { door: 'infra/nas-research/research_forwarder.py', witness: 'research-health.yml' },
  // The first service born BY the Way (DR-1120), the day after it was written.
  immich: { door: 'infra/nas-immich/immich_forwarder.py', witness: 'immich-health.yml' },
  // The libraries road (DR-1121): its door is health-only, the servers live on the tailnet.
  libraries: { door: 'infra/nas-libraries/libraries_forwarder.py', witness: 'libraries-health.yml' },
  // The first service born BEFORE the Way brought up to it (2026-10-20, the audit,
  // highest blast radius first): its witness now says where the install stands,
  // and its installer's restart is one function called before the go2rtc wait
  // that used to exit ahead of it.
  cameras: { door: 'infra/nas-cameras/cams_forwarder.py', witness: 'camera-health.yml' },
  // The second and third (same night): each gained a witness that stands, a door
  // that says why, and a restart called before the step that used to exit first.
  'voice-lite': { door: 'infra/nas-voice-lite/voice_lite_server.py', witness: 'voice-lite-health.yml' },
  scribe: { door: 'infra/nas-scribe/scribe_ingest_server.py', witness: 'scribe-health.yml' },
  // The fourth: real money's road; its witness was the site's, now its own.
  'tax-upload': { door: 'infra/nas-tax-ingest/tax_upload_server.py', witness: 'tax-upload-health.yml' },
  // The fifth: the agent's own hand on the NAS gained an open door that says why.
  mcp: { door: 'infra/nas-mcp/mcp_server.py', witness: 'mcp-health.yml' },
  // The sixth: the family's and the properties' pictures.
  'property-photos': { door: 'infra/nas-property-photos/photo_server.py', witness: 'property-photos-health.yml' },
  // The seventh: the phone bell, whose door now probes ntfy and says why.
  announce: { door: 'infra/nas-announce/announce_server.py', witness: 'announce-health.yml' },
  // The eighth: the reading voice's road to the tower.
  'voice-transport': { door: 'infra/voice-studio/voice_forwarder.py', witness: 'voice-health.yml' },
};

/** Loops born by the Way: no door of their own (their "says why" is the ledger
 *  row the witness reads), so codeFollows and health are lacking BY NATURE and
 *  nothing else may be. */
const LOOPS_ON_THE_WAY = {
  'home-accounts': { witness: 'libraries-health.yml' },
  // Born before the Way; brought up to it 2026-10-20 (the audit). It stamps its
  // code, so it lacks only health, which a loop lacks by nature.
  'lesson-builder': { witness: 'lesson-builder-health.yml' },
  // Two loops on the services-sync clock whose witnesses read the database
  // the loop writes; each now says where the install stands before it records
  // a stall (2026-10-20, the audit). Neither has a door or a code stamp: the
  // loop IS the installer's run, and the witness reads its fruit.
  'transcript-trickle': { witness: 'harvest-health.yml' },
  'ops-runner': { witness: 'ops-queue-health.yml' },
  // Nine loops on the services-sync clock that had no witness at all, now
  // witnessed together by loops-health.yml, which reads what services-sync
  // said of each one's last run and what each one's own ledger says, and says
  // where the install stands per loop (2026-10-20, the audit).
  'lesson-voice': { witness: 'loops-health.yml' },
  'lesson-parity': { witness: 'loops-health.yml' },
  'church-mail': { witness: 'loops-health.yml' },
  'family-key': { witness: 'loops-health.yml' },
  'agent-consumer': { witness: 'loops-health.yml' },
  'db-backup': { witness: 'loops-health.yml' },
  'choir-dates': { witness: 'loops-health.yml' },
  'stream-length': { witness: 'loops-health.yml' },
  'worship-song-harvest': { witness: 'loops-health.yml' },
  // The Funnel watchdog: a loop whose fruit is the public mounts; its witness
  // asks each one through the Funnel from outside (2026-10-20, the audit).
  funnel: { witness: 'funnel-health.yml' },
};

/** Born before the Way (2026-10-19): what each still lacks, read from the files
 *  on that day. A part that gets built must be struck from here, or the gate
 *  fails: the ledger says what is true. They are brought up to the Way in
 *  order of blast radius by the audit date (DR-0075: a why and a date, never a
 *  silent stall). */
// The audit began 2026-10-20 (DR-0236: nothing buildable waits); the date is the
// ceiling the build fails at, not the day the work starts.
const AUDIT_BY = '2026-11-15';
const BORN_BEFORE_THE_WAY = {
  // 2026-10-20: lacks none of the readable parts (the stack stamps the code it
  // converged on; nas-health is its witness and says where the install stands).
  // It stays here, not on ON_THE_WAY, because its restart is `compose up -d`,
  // a compose stack's own idempotent converge, not a systemd function the
  // restart-on-every-path reader can count.
  supabase: { lacks: [] },
  // 2026-10-20: the stack stamps the code it converged on and nas-health is its
  // witness and says where it stands; it still lacks a door that says why,
  // because the app offers no health route (its own healthcheck is a TCP
  // connect) and the installer can only ask its root. Honest, with the why.
  ytzero: { lacks: ['health'] },
  // Born the same day by another session (DR-1113), before this Way merged;
  // the gate caught it on the merge, which is exactly its job.
};

// ---- the readable parts of the Way -----------------------------------------
const STANDS = /where the install stands/;

/** A log tail a witness ships to python through the environment: one exported
 *  variable is capped at 128 KB on Linux, and the exec fails ("Argument list
 *  too long") -- the loops witness's first live run. A tail over 100 KB rides
 *  a file. Returns the names it finds exported. */
function tailsExported(wf) {
  const big = [...wf.matchAll(/(\w+)="?\$\((?:[^)]*\|\|\s*)?(?:sudo -n )?tail -c (\d+)/g)].filter((m) => Number(m[2]) > 100000).map((m) => m[1]);
  const exported = new Set((wf.match(/^\s*export [^\n]+$/gm) || []).flatMap((l) => l.trim().split(/\s+/).slice(1)));
  return big.filter((n) => exported.has(n));
}

/** The witness workflow a service names: an override, else "Witness: <name>" in its description. */
function witnessOf(s, override) {
  const m = /Witness: ([\w-]+)/.exec(s.description || '');
  const name = override || (m ? `${m[1]}.yml` : null);
  return name ? `.github/workflows/${name}` : null;
}

/** Which parts a service lacks, read from its files. "stands" is implied by a missing witness. */
function lacksOf(s, override) {
  const install = read(s.install);
  const w = witnessOf(s, override);
  const witness = !!w && has(w);
  const parts = {
    witness,
    stands: witness && STANDS.test(read(w)),
    codeFollows: /code\.sha|CODE_SHA/.test(install),
    health: /\/health/.test(install),
  };
  return Object.keys(parts).filter((k) => !parts[k] && !(k === 'stands' && !witness)).sort();
}

/** The restart that moves the running code onto the repo's is one function,
 *  called from more than one path (the no-dependency path too). A position
 *  rule was tried and dropped: by position alone a gate cannot tell a
 *  dependency check from the door's own prerequisites. Returns the
 *  function's name, or null. */
export function restartOnEveryPath(installText) {
  const fns = [...installText.matchAll(/^([a-z_][\w]*)\(\) \{\n([\s\S]*?)\n\}/gm)];
  for (const [, name, body] of fns) {
    if (!/systemctl restart/.test(body)) continue;
    const calls = installText.split('\n').filter((l) => new RegExp(`^\\s*${name}\\s*$`).test(l)).length;
    if (calls >= 2) return name;
  }
  return null;
}

/** A door answers with a reason in words, not only a code (DR-1000). */
const answersWithReason = (doorText) => /["']reason["']/.test(doorText) && /\/health/.test(doorText);

// ---- the gate ---------------------------------------------------------------
describe('a service comes home by one Way (DR-1119)', () => {
  it('every enabled service has an installer that exists and parses', () => {
    for (const s of ENABLED) {
      expect(has(s.install), `${s.name}: ${s.install}`).toBe(true);
      const r = spawnSync('sh', ['-n', join(ROOT, s.install)], { encoding: 'utf8' });
      expect(r.status, `${s.name}: sh -n ${s.install}\n${r.stderr}`).toBe(0);
    }
  });

  it('a service on the Way: its witness says where the install stands, its door answers with a reason, and its restart is one function on every path', () => {
    for (const [name, w] of Object.entries(ON_THE_WAY)) {
      const s = SERVICES.find((x) => x.name === name);
      expect(s, name).toBeTruthy();
      expect(lacksOf(s, w.witness), `${name} lacks`).toEqual([]);
      expect(answersWithReason(read(w.door)), `${name}: ${w.door}`).toBe(true);
      expect(restartOnEveryPath(read(s.install)), `${name}: ${s.install}`).toBeTruthy();
    }
  });

  it('a loop on the Way: its witness says where the install stands, and it lacks only what a loop lacks by nature', () => {
    for (const [name, w] of Object.entries(LOOPS_ON_THE_WAY)) {
      const s = SERVICES.find((x) => x.name === name);
      expect(s, name).toBeTruthy();
      const lacks = lacksOf(s, w.witness);
      expect(lacks, `${name} lacks`).not.toContain('witness');
      expect(lacks, `${name} lacks`).not.toContain('stands');
      for (const part of lacks) expect(['codeFollows', 'health'], `${name} lacks ${part}, which a loop may not`).toContain(part);
    }
  });

  it('every service born before the Way is listed with exactly what it still lacks, and the audit date has not passed', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(today <= AUDIT_BY, `the audit of the services born before the Way came due on ${AUDIT_BY}: bring them up to the Way or record a new date with a why (DR-0075)`).toBe(true);
    for (const [name, entry] of Object.entries(BORN_BEFORE_THE_WAY)) {
      const s = SERVICES.find((x) => x.name === name);
      expect(s, name).toBeTruthy();
      expect(lacksOf(s, entry.witness), `${name}: the ledger must say what the files say`).toEqual([...entry.lacks].sort());
    }
  });

  it('a new service joins the Way at birth: every enabled service is on one list, and no listed service is gone', () => {
    const listed = new Set([...Object.keys(ON_THE_WAY), ...Object.keys(LOOPS_ON_THE_WAY), ...Object.keys(BORN_BEFORE_THE_WAY)]);
    for (const s of ENABLED) expect(listed.has(s.name), `${s.name} is enabled but on neither list; a new service walks the Way (THE-WAY-A-SERVICE-COMES-HOME)`).toBe(true);
    const names = new Set(SERVICES.map((s) => s.name));
    for (const n of listed) expect(names.has(n), `${n} is listed but not in services.json`).toBe(true);
  });

  it('the Funnel witness asks every mount the watchdog restores, by the same path', () => {
    const wd = read('infra/nas-loops/loops/funnel_watchdog.py');
    const fh = read('.github/workflows/funnel-health.yml');
    const mounts = [...wd.matchAll(/\("(\/[a-z-]+)", "http:\/\/127\.0\.0\.1:(\d+)"\)/g)];
    expect(mounts.length).toBeGreaterThanOrEqual(6);
    for (const [, path, port] of mounts) {
      expect(fh, `the witness asks ${path}`).toContain(`("${path}", `);
      expect(fh, `the witness probes 127.0.0.1:${port} from the box`).toMatch(new RegExp(`\\b${port}\\b`));
    }
  });

  it('no witness ships a log tail to python through the environment', () => {
    for (const wf of readdirSync(join(ROOT, '.github/workflows')).filter((f) => f.endsWith('.yml'))) {
      expect(tailsExported(read(`.github/workflows/${wf}`)), `${wf} exports a tail over 100 KB; it rides a file`).toEqual([]);
    }
  });

  it('the Way is written, routed and registered, and the video’s four jobs are weighed', () => {
    expect(has(WAY)).toBe(true);
    const way = read(WAY);
    expect(way).toContain('Fix our processes and create a way');
    expect(read('docs/CONTEXT.md')).toContain(WAY);
    expect(read('docs/decisions/PRINCIPLES.md')).toMatch(/\| \*\*SERVICE-COMES-HOME\*\* \|/);
    expect(dontRepeatFor([WAY], { edit: true }).map((g) => g.id)).toContain('orchestration');
    const ids = OPEN_SOURCE_CANDIDATES.map((c) => c.id);
    for (const id of ['immich', 'jellyfin', 'audiobookshelf']) expect(ids).toContain(id);
    expect(read('infra/nas-transport/RECORDED-STATE.md')).toMatch(/^\| `\/cams` \|/m);
  });
});

describe('the gate catches each break (proven to catch)', () => {
  const GOOD = 'x() {\n  $SUDO systemctl restart poetech-x\n}\n\nif [ -z "$DEP" ]; then\n  x\n  exit 0\nfi\nx\n';
  it('the old installer: the restart sat after the dependency check, called from one path only', () => {
    expect(restartOnEveryPath(GOOD)).toBe('x');
    const old = 'if [ -z "$DEP" ]; then\n  exit 0\nfi\nx() {\n  $SUDO systemctl restart poetech-x\n}\nx\n';
    expect(restartOnEveryPath(old)).toBeNull();
    // Called once, after a stop: the no-dependency path never reaches it.
    const late = 'x() {\n  $SUDO systemctl restart poetech-x\n}\nif [ -z "$DEP" ]; then\n  exit 0\nfi\nx\n';
    expect(restartOnEveryPath(late)).toBeNull();
  });
  it('a restart that is not a function at all', () => {
    expect(restartOnEveryPath('if [ -z "$DEP" ]; then exit 0; fi\n$SUDO systemctl restart poetech-x\n')).toBeNull();
  });
  it('a witness without its standing lines, and a door without a reason', () => {
    const s = SERVICES.find((x) => x.name === 'research');
    // site-health.yml watches the site, not an install, so it never says where one stands.
    expect(lacksOf(s, 'site-health.yml')).toEqual(['stands']);
    expect(answersWithReason('def health(): return 200')).toBe(false);
  });
  it('the loops witness as first run: a 400 KB tail exported into one variable', () => {
    const first = 'CRON="$(tail -c 400000 "$LOG" 2>/dev/null || sudo -n tail -c 400000 "$LOG" 2>/dev/null || true)"\nexport CRON CHECKOUT REPO\n';
    expect(tailsExported(first)).toEqual(['CRON']);
    const small = 'CMG="$(tail -c 1200 "$E")"\nexport CMG\n';
    expect(tailsExported(small)).toEqual([]);
    expect(tailsExported(read('.github/workflows/loops-health.yml'))).toEqual([]);
  });
  it('a stale ledger entry: a part that was built but not struck', () => {
    // ytzero stamps its code and names nas-health, but can only ask its root; a
    // ledger row that struck health, or one that named a witness without the
    // standing lines, would not match the files.
    const s = SERVICES.find((x) => x.name === 'ytzero');
    expect(lacksOf(s)).toEqual(['health']);
    expect(lacksOf(s)).not.toEqual([]);
    expect(lacksOf(s, 'site-health.yml')).toEqual(['health', 'stands']);
  });
});
