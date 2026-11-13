// @vitest-environment node
// =============================================================================
// A decision number is RESERVED on origin, not just read as free (DR-1468)
// =============================================================================
// MEASURED 2026-11-12: DR-1441 taken twice, numbers 1445 and 1449 contested by
// open PRs, in one day. Every earlier fix widened what the tool READS; two
// sessions reading in the same minute still get the same answer. --reserve
// makes the answer a write the server referees: an empty commit pushed to
// refs/heads/reserve/dr-NNNN with an empty --force-with-lease ("must not
// exist"). Proven here against a local bare repository with two claimants
// racing in two real processes, and proven to catch: without the lease, the
// same race hands both of them the same number.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { reserveBranch, parseReserveRef, isHeldRefusal, reserveNext, reservedNumbers, claimOnRemote } from '../../../scripts/lib/reserve-ref.mjs';
import { main, lowestFree } from '../../../scripts/claim-decision-number.mjs';
import { highestDecision, highestLesson, sweepable } from '../../../scripts/sweep-reservations.mjs';

const RESERVE_LIB = resolve(__dirname, '../../../scripts/lib/reserve-ref.mjs');
const ID = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid' };
const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...ID }, stdio: ['ignore', 'pipe', 'pipe'], timeout: 20_000 });

let dir;
let claimant;
const clones = [];

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'reserve-'));
  git(dir, 'init', '--quiet', '--bare', '-b', 'main', 'origin.git');
  git(dir, 'clone', '--quiet', 'origin.git', 'seed');
  writeFileSync(join(dir, 'seed', 'README'), 'seed\n');
  git(join(dir, 'seed'), 'add', 'README');
  git(join(dir, 'seed'), 'commit', '--quiet', '-m', 'seed');
  git(join(dir, 'seed'), 'push', '--quiet', 'origin', 'HEAD:main');
  for (const name of ['a', 'b', 'c', 'd']) {
    git(dir, 'clone', '--quiet', 'origin.git', name);
    clones.push(join(dir, name));
  }
  // One claimant, run as its own process: the stale view every racer shares
  // is "nothing taken, start at 1" -- exactly what two sessions see when they
  // both read before either writes.
  claimant = join(dir, 'claim.mjs');
  writeFileSync(
    claimant,
    `
import { reserveNext, claimOnRemote } from ${JSON.stringify(RESERVE_LIB)};
const [cwd, lease] = process.argv.slice(2);
const got = reserveNext({ start: 1, taken: new Set(), tryClaim: (n) => claimOnRemote({ kind: 'dr', n, cwd, lease: lease === 'lease', message: 'race ' + cwd }) });
process.stdout.write(JSON.stringify(got));
`
  );
}, 60_000);

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const race = (cwds, lease) =>
  Promise.all(
    cwds.map(
      (cwd) =>
        new Promise((done, fail) => {
          const child = spawn(process.execPath, [claimant, cwd, lease], { env: { ...process.env, ...ID }, timeout: 20_000 });
          let out = '';
          child.stdout.on('data', (d) => {
            out += d;
          });
          child.on('error', fail);
          child.on('close', () => {
            try {
              done(JSON.parse(out));
            } catch (e) {
              fail(new Error(`claimant printed: ${out}`));
            }
          });
        })
    )
  );

describe('the reservation, pure', () => {
  it('names and reads a reservation branch the same way', () => {
    expect(reserveBranch('dr', 1462)).toBe('reserve/dr-1462');
    expect(reserveBranch('dr', 7)).toBe('reserve/dr-0007');
    expect(reserveBranch('ll', 302)).toBe('reserve/ll-302');
    expect(parseReserveRef('refs/remotes/origin/reserve/dr-1462')).toEqual({ kind: 'dr', n: 1462 });
    expect(parseReserveRef('refs/heads/reserve/ll-302')).toEqual({ kind: 'll', n: 302 });
    expect(parseReserveRef('refs/remotes/origin/claude/dr-1462')).toBeNull();
    expect(() => reserveBranch('xx', 1)).toThrow(/unknown reservation kind/);
  });

  it('tells "someone holds it" from "the road is shut"', () => {
    expect(isHeldRefusal(' ! [rejected]        abc -> reserve/dr-0001 (stale info)')).toBe(true);
    expect(isHeldRefusal('! [rejected] (fetch first)')).toBe(true);
    expect(isHeldRefusal('remote: Permission to x denied. fatal: unable to access: The requested URL returned error: 403')).toBe(false);
    expect(isHeldRefusal(' ! [remote rejected] reserve/dr-1 (refusing to allow)')).toBe(false);
    expect(isHeldRefusal("error: cannot lock ref 'refs/heads/reserve/dr-0001'")).toBe(true);
  });

  it('steps over held numbers and stops, saying why, when the road itself fails', () => {
    const held = new Set([5, 6]);
    expect(reserveNext({ start: 5, tryClaim: (n) => (held.has(n) ? { ok: false, held: true } : { ok: true, branch: `b${n}` }) }).n).toBe(7);
    expect(reserveNext({ start: 5, taken: new Set([5]), tryClaim: (n) => ({ ok: true, branch: `b${n}` }) }).n).toBe(6);
    const shut = reserveNext({ start: 5, tryClaim: () => ({ ok: false, held: false, reason: '403' }) });
    expect(shut).toMatchObject({ ok: false, reason: '403' });
  });
});

describe('two sessions racing for one number, against a real bare repository', () => {
  it('never hand two claimants the same number, over three rounds of a two-process race', async () => {
    const all = [];
    for (let round = 0; round < 3; round += 1) {
      const got = await race([clones[0], clones[1]], 'lease');
      for (const g of got) expect(g.ok, JSON.stringify(g)).toBe(true);
      all.push(...got.map((g) => g.n));
    }
    expect(all).toHaveLength(6);
    expect(new Set(all).size, `numbers handed out: ${all.join(', ')}`).toBe(6);
    expect([...all].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6]);
  }, 120_000);

  it('a second claimant on a held number is refused by the server, and told so', () => {
    const again = claimOnRemote({ kind: 'dr', n: 1, cwd: clones[2] });
    expect(again).toMatchObject({ ok: false, held: true, branch: 'reserve/dr-0001' });
  }, 30_000);

  it('PROVEN TO CATCH: the same stale view without the lease hands both claimants ONE number', async () => {
    // One after the other, so the server's own ref lock cannot rescue them:
    // the second plain force-push overwrites the first and both report success.
    const [first] = await race([clones[2]], 'no-lease');
    const [second] = await race([clones[3]], 'no-lease');
    expect(first.ok && second.ok).toBe(true);
    expect(second.n).toBe(first.n);
    // The lease, given that same stale view, refuses the second claimant.
    const [leased] = await race([clones[3]], 'lease');
    expect(leased.ok).toBe(true);
    expect(leased.n).not.toBe(first.n);
  }, 60_000);
});

describe('the read path counts every reservation as held', () => {
  it('reads reserve/dr-* off the remote-tracking refs after a fetch', () => {
    git(clones[3], 'fetch', '--quiet', 'origin', '+refs/heads/*:refs/remotes/origin/*');
    const held = reservedNumbers({ kind: 'dr', cwd: clones[3] });
    expect([...held].sort((x, y) => x - y).slice(0, 6)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(reservedNumbers({ kind: 'll', cwd: clones[3] }).size).toBe(0);
  }, 30_000);

  it('claim-decision-number skips a reserved number it would otherwise have printed', () => {
    const base = () => ({ ok: true, ref: 'origin/main', numbers: new Set([1, 2, 3]), tried: ['origin/main'], reason: '' });
    const ask = (reserved) => {
      const lines = [];
      main({
        noFetch: true,
        readBase: base,
        readReserved: () => reserved,
        scanInFlight: () => new Map(),
        log: (s) => lines.push(String(s)),
        err: (s) => lines.push(String(s)),
      });
      return lines.join('\n');
    };
    const before = Number(/next free decision number: DR-(\d{4})/.exec(ask(new Set()))[1]);
    const after = ask(new Set([before]));
    expect(Number(/next free decision number: DR-(\d{4})/.exec(after)[1])).toBe(lowestFree(before, new Set([before])));
    expect(after).toMatch(new RegExp(`reserved:\\s+DR-${String(before).padStart(4, '0')}`));
  }, 30_000);

  it('--reserve prints the number it HOLDS, and holds nothing when the road is shut', () => {
    const base = () => ({ ok: true, ref: 'origin/main', numbers: new Set([1, 2, 3]), tried: ['origin/main'], reason: '' });
    const run = (claim) => {
      const lines = [];
      const code = main({
        noFetch: true,
        reserve: true,
        branch: 'claude/x',
        readBase: base,
        readReserved: () => new Set(),
        scanInFlight: () => new Map(),
        claim,
        log: (s) => lines.push(String(s)),
        err: (s) => lines.push(String(s)),
      });
      return { code, out: lines.join('\n') };
    };
    const won = run(({ n }) => ({ ok: true, branch: `reserve/dr-${n}`, sha: 'abcdef0123456789' }));
    expect(won.code).toBe(0);
    expect(won.out).toMatch(/^RESERVED DR-\d{4} on origin as refs\/heads\/reserve\/dr-\d+/m);
    const shut = run(() => ({ ok: false, held: false, reason: 'injected 403' }));
    expect(shut.code).toBe(1);
    expect(shut.out).toMatch(/NOT RESERVED — injected 403/);
    expect(shut.out).not.toMatch(/^RESERVED/m);
  }, 30_000);
});

describe('the sweep deletes only what main has passed', () => {
  it('reads main\u2019s highest record and lesson, in both lesson shapes and the per-file names', () => {
    expect(highestDecision(['docs/decisions/DR-1461-a.md', 'docs/decisions/INDEX.md', 'docs/decisions/DR-0007-b.md'])).toBe(1461);
    expect(highestLesson('  id: \'ll300-a\',\n  "id": "ll301-b",', ['app/src/lib/living-lessons/ll305-c.js'])).toBe(305);
  });

  it('PROVEN TO CATCH: a reservation above main is kept, at or below it is swept, and no other branch is touched', () => {
    const refs = [
      'refs/heads/reserve/dr-1461',
      'refs/heads/reserve/dr-1462',
      'refs/heads/reserve/ll-301',
      'refs/heads/reserve/ll-302',
      'refs/heads/claude/dr-1400',
    ];
    expect(sweepable(refs, { dr: 1461, ll: 301 })).toEqual(['refs/heads/reserve/dr-1461', 'refs/heads/reserve/ll-301']);
    expect(sweepable(refs, { dr: 1400, ll: 1 })).toEqual([]);
  });
});
