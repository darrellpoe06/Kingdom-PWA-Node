// =============================================================================
// A SERVICE COMES HOME BY ONE WAY (DR-1118)
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
import { readFileSync, existsSync } from 'node:fs';
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
};

/** Born before the Way (2026-10-19): what each still lacks, read from the files
 *  on that day. A part that gets built must be struck from here, or the gate
 *  fails: the ledger says what is true. They are brought up to the Way in
 *  order of blast radius by the audit date (DR-0075: a why and a date, never a
 *  silent stall). */
const AUDIT_BY = '2026-11-15';
const BORN_BEFORE_THE_WAY = {
  'transcript-trickle': { lacks: ['codeFollows', 'health', 'stands'] },
  'church-mail': { lacks: ['codeFollows', 'health', 'witness'] },
  'family-key': { lacks: ['codeFollows', 'health', 'witness'] },
  'lesson-voice': { lacks: ['codeFollows', 'health', 'witness'] },
  'lesson-parity': { lacks: ['codeFollows', 'health', 'witness'] },
  'ops-runner': { lacks: ['codeFollows', 'health', 'stands'] },
  'agent-consumer': { lacks: ['codeFollows', 'health', 'witness'] },
  supabase: { lacks: ['codeFollows', 'witness'] },
  mcp: { lacks: ['health', 'witness'] },
  scribe: { lacks: ['witness'] },
  'property-photos': { lacks: ['codeFollows', 'witness'] },
  'tax-upload': { lacks: ['codeFollows', 'stands'] },
  'voice-transport': { lacks: ['codeFollows', 'witness'] },
  funnel: { lacks: ['codeFollows', 'health', 'witness'] },
  'choir-dates': { lacks: ['codeFollows', 'health', 'witness'] },
  'stream-length': { lacks: ['codeFollows', 'health', 'witness'] },
  'worship-song-harvest': { lacks: ['codeFollows', 'health', 'witness'] },
  ytzero: { lacks: ['codeFollows', 'health', 'witness'] },
  'voice-lite': { lacks: ['witness'] },
  'lesson-builder': { lacks: ['health', 'witness'] },
  cameras: { lacks: ['stands'], witness: 'camera-health.yml' },
  announce: { lacks: ['codeFollows', 'witness'] },
};

// ---- the readable parts of the Way -----------------------------------------
const STANDS = /where the install stands/;

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
 *  called from more than one path. Returns the function's name, or null. */
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
const answersWithReason = (doorText) => /"reason"/.test(doorText) && /\/health/.test(doorText);

// ---- the gate ---------------------------------------------------------------
describe('a service comes home by one Way (DR-1118)', () => {
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
    const listed = new Set([...Object.keys(ON_THE_WAY), ...Object.keys(BORN_BEFORE_THE_WAY)]);
    for (const s of ENABLED) expect(listed.has(s.name), `${s.name} is enabled but on neither list; a new service walks the Way (THE-WAY-A-SERVICE-COMES-HOME)`).toBe(true);
    const names = new Set(SERVICES.map((s) => s.name));
    for (const n of listed) expect(names.has(n), `${n} is listed but not in services.json`).toBe(true);
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
  });
  it('a restart that is not a function at all', () => {
    expect(restartOnEveryPath('if [ -z "$DEP" ]; then exit 0; fi\n$SUDO systemctl restart poetech-x\n')).toBeNull();
  });
  it('a witness without its standing lines, and a door without a reason', () => {
    const s = SERVICES.find((x) => x.name === 'research');
    expect(lacksOf(s, 'camera-health.yml')).toEqual(['stands']);
    expect(answersWithReason('def health(): return 200')).toBe(false);
  });
  it('a stale ledger entry: a part that was built but not struck', () => {
    const s = SERVICES.find((x) => x.name === 'scribe');
    expect(lacksOf(s)).toEqual(['witness']);
    expect(lacksOf(s)).not.toEqual(['codeFollows', 'witness']);
  });
});
