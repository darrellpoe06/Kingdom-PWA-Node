// @vitest-environment node
// =============================================================================
// A decision number claimed twice is caught BEFORE the merge (DR-1147)
// =============================================================================
// SIX collisions on 2026-10-20 in five hours, every one the same shape:
//
//   DR-1131  week 43 (#2298) vs the voice witness (#2299)
//   DR-1135  the ledger count (#2300, 19:31:42Z) vs the prompt words (#2306, 19:41:27Z)
//   DR-1137  the sov44 lesson (branch) vs the road-to-full-time record (main)
//   DR-1138  the sov45 lesson (branch) vs the front-door record (main)
//   DR-1143  the sov44 lesson (22:26:08Z) vs db-migrate (22:17:41Z)
//   DR-1144  the sov45 lesson (branch) vs the church-price record (main)
//
// `business-systems-guard` was CORRECT on every branch: that branch's ledger
// held exactly one record per number. The duplicate exists only in the UNION of
// the branches, and the union only comes into being when the second one merges.
// So no branch-local gate could have seen any of them, and the one instrument
// that could — a person checking by hand — provably cannot close the window:
// on the DR-1143 collision the number was verified free at 22:12, taken at
// 22:17, and the verifying push merged at 22:26.
//
// WHAT THIS GATE MUST GET RIGHT, and what each case here pins:
//   1. A number main holds under a DIFFERENT record is a collision. (My first
//      draft filtered on `!(n in mainClaims)` and silently skipped exactly
//      that, which is to say it skipped the entire purpose of the file.)
//   2. A number main holds under the SAME record is just a stale branch.
//   3. A number another OPEN PR wants is a RACE, not a verdict — it warns and
//      must not fail, or the gate picks a winner it has no standing to pick and
//      renumbering becomes a treadmill into the next clash.
//   4. A PR seeing its own claim echoed back is free.
//   5. The suggested target skips every claim in the union, not just main's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  claimsOnDisk, introducedBy, classify, firstFreeAbove, report,
} from '../../../scripts/dr-number-claims.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

// The real DR-1143 collision, by name, as it actually stood on main.
const MAIN = { 1143: 'DR-1143-the-ledger-is-read-before-it-is-guessed.md' };
const BRANCH = { 1143: 'DR-1143-the-thief-who-forgot-to-lock-his-own-door-sov44.md' };

describe('the collision a branch-local gate cannot see', () => {
  it('a number main holds under a DIFFERENT record is taken, not skipped', () => {
    // THE CASE MY OWN FIRST DRAFT FAILED. Excluding every number main holds
    // drops the collision itself, and the script then reports "free" — a green
    // that means "did not look".
    const intro = introducedBy(BRANCH, MAIN);
    expect(intro).toContain('1143');
    const [row] = classify(intro, BRANCH, MAIN, {});
    expect(row.verdict).toBe('taken-on-main');
    expect(row.mine).toContain('thief');
    expect(row.held).toContain('ledger-is-read');
  });

  it('a number main holds under the SAME record is only a stale branch', () => {
    expect(introducedBy(MAIN, MAIN)).toEqual([]);
    expect(classify(['1143'], MAIN, MAIN, {})[0].verdict).toBe('free');
  });

  it('a number another OPEN PR wants is contested — a race, never a verdict', () => {
    const row = classify(['1139'], { 1139: 'DR-1139-mine.md' }, {},
      { 1139: [{ pr: 2401, file: 'DR-1139-theirs.md' }] })[0];
    expect(row.verdict).toBe('contested-with-open-pr');
    // It must not name a holder, because nothing holds it yet.
    expect('held' in row).toBe(false);
    expect(row.others[0].pr).toBe(2401);
  });

  it('a PR seeing its own claim echoed back is free', () => {
    const row = classify(['1139'], { 1139: 'DR-1139-mine.md' }, {},
      { 1139: [{ pr: 2401, file: 'DR-1139-mine.md' }] })[0];
    expect(row.verdict).toBe('free');
  });

  it('the suggested target skips main, the open PRs AND this branch', () => {
    // The first live run suggested a number my own unmerged branch held,
    // because it had only been given main's claims.
    expect(firstFreeAbove(1143, { 1143: 'a', 1144: 'b' },
      { 1145: [{ pr: 1, file: 'c' }] }, { 1146: 'd' })).toBe(1147);
  });
});

describe('what it says, so a reader can act without re-deriving the rule', () => {
  it('a taken number cites the rule that decides who moves', () => {
    const text = report(classify(['1143'], BRANCH, MAIN, {}));
    expect(text).toMatch(/TAKEN ON MAIN/);
    expect(text).toMatch(/DR-1136/);
    expect(text).toMatch(/merge order decides/);
  });

  it('a contested number says in words that it is not a verdict', () => {
    const text = report(classify(['1139'], { 1139: 'DR-1139-mine.md' }, {},
      { 1139: [{ pr: 2401, file: 'DR-1139-theirs.md' }] }));
    expect(text).toMatch(/not a verdict/);
    expect(text).toMatch(/Whichever lands second/);
  });

  it('a clean branch is told so plainly, not with silence', () => {
    expect(report(classify(['1200'], { 1200: 'DR-1200-x.md' }, {}, {})))
      .toMatch(/No introduced number is claimed/);
  });
});

describe('it reads a real ledger, so a stopped parse cannot read as success', () => {
  it('claimsOnDisk finds the whole ledger and nothing that is not a record', () => {
    const real = claimsOnDisk();
    expect(Object.keys(real).length).toBeGreaterThan(900);
    expect(Object.keys(real).every((k) => /^\d+$/.test(k))).toBe(true);
    expect(Object.values(real)).not.toContain('INDEX.md');
    expect(Object.values(real)).not.toContain('PRINCIPLES.md');
  });

  it('every record on disk is reachable by its own number', () => {
    const real = claimsOnDisk();
    for (const [n, f] of Object.entries(real)) {
      expect(f.startsWith(`DR-${String(n).padStart(4, '0')}`)).toBe(true);
    }
  });
});

describe('the asking half, and the line it must not cross', () => {
  const WF = join(REPO, '.github/workflows/dr-number-claim.yml');

  it('the workflow exists and runs the reader’s selftest before judging', () => {
    expect(existsSync(WF)).toBe(true);
    const text = readFileSync(WF, 'utf8');
    const selftest = text.indexOf('--selftest');
    const judge = text.indexOf("Judge this branch's introduced numbers");
    expect(selftest).toBeGreaterThan(0);
    expect(judge).toBeGreaterThan(selftest);
  });

  it('it counts only ADDED records as a claim, never an edit to an existing one', () => {
    // A PR that merely edits a record is not claiming its number; treating an
    // edit as a claim would make every touch of the ledger a false collision.
    const text = readFileSync(WF, 'utf8');
    expect(text).toMatch(/f\.get\("status"\) not in \("added", "renamed"\)/);
  });

  it('it excludes the PR being judged from the claims it gathers', () => {
    const text = readFileSync(WF, 'utf8');
    expect(text).toMatch(/if n == THIS:/);
  });

  it('a PR whose files cannot be read is reported, never counted as claiming nothing', () => {
    // DR-0076: unknown is not a no. Silently treating an unreadable PR as
    // empty is how a gate reports green on a collision it never looked for.
    const text = readFileSync(WF, 'utf8');
    expect(text).toMatch(/could not read #\{?n\}?'s files|could not read #/);
    expect(text).toMatch(/unknown is not a no/);
  });

  it('it writes nothing but its summary and one PR comment', () => {
    const text = readFileSync(WF, 'utf8');
    expect(text).toMatch(/contents: read/);
    expect(text).not.toMatch(/contents: write/);
    // It never pushes, never dispatches, never touches the merge lane.
    expect(text).not.toMatch(/git push/);
    expect(text).not.toMatch(/enable_?-?pr-?auto-?merge|createWorkflowDispatch/i);
  });

  it('and it fails ONLY on taken-on-main, so a race cannot block a PR', () => {
    // MEASURED BY RUNNING IT, not by reading its source. My first version of
    // this case asserted on source text — `if (taken.length) { … exit(1) }` —
    // and that text SURVIVED the break: widening the filter to
    // `verdict !== 'free'` makes a contested race fail the build while the
    // assertion stays green. A case that reads the shape of a guard instead of
    // its behaviour is the hollow kind this whole file exists to argue against.
    const script = join(REPO, 'scripts/dr-number-claims.mjs');
    const decisions = mkdtempSync(join(tmpdir(), 'dr-claims-'));
    writeFileSync(join(decisions, 'DR-1139-mine.md'), '# x\n');
    const run = (prClaims, mainClaims) => {
      const mf = join(decisions, '..', `m-${Math.random().toString(36).slice(2)}.json`);
      const pf = join(decisions, '..', `p-${Math.random().toString(36).slice(2)}.json`);
      writeFileSync(mf, JSON.stringify(mainClaims));
      writeFileSync(pf, JSON.stringify(prClaims));
      return spawnSync('node', [script, '--main-claims', mf, '--pr-claims', pf,
        '--decisions', decisions], { encoding: 'utf8' });
    };

    // A race with another open PR: reported, exit 0 — it must not block.
    const race = run({ 1139: [{ pr: 2401, file: 'DR-1139-theirs.md' }] }, {});
    expect(race.stdout).toMatch(/CONTESTED WITH AN OPEN PR/);
    expect(race.status, 'a race nobody has lost must not fail a PR').toBe(0);

    // A number a different record already holds on main: exit 1.
    const taken = run({}, { 1139: 'DR-1139-already-merged-elsewhere.md' });
    expect(taken.stdout).toMatch(/TAKEN ON MAIN/);
    expect(taken.status, 'a settled collision must fail').toBe(1);

    // And it names the exact command to run, on a clean tree.
    expect(taken.stdout).toMatch(/renumber-decision-record\.mjs 1139 \d+ --file DR-1139-mine\.md/);
    expect(taken.stdout).toMatch(/CLEAN tree/);
  });

  it('a claims file it was told to read and cannot is a stop, never an empty claim set', () => {
    // FOUND BY RUNNING IT on the merged tree: `--pr-claims /dev/null` crashed
    // with a raw SyntaxError, and a MISSING path returned {} in silence. Both
    // are the disarmed-check shape — a gathering step that wrote nothing, or
    // wrote half a file and died, would make this gate report every number
    // free, which is a green that means "did not look" (DR-0076).
    const script = join(REPO, 'scripts/dr-number-claims.mjs');
    const decisions = mkdtempSync(join(tmpdir(), 'dr-claims-unread-'));
    writeFileSync(join(decisions, 'DR-1139-mine.md'), '# x\n');

    const missing = join(decisions, 'never-written.json');
    const gone = spawnSync('node', [script, '--main-claims', missing,
      '--decisions', decisions], { encoding: 'utf8' });
    expect(gone.status, 'a claims file that does not exist must stop the run').toBe(2);
    expect(gone.stderr).toMatch(/does not exist/);
    expect(gone.stderr).toMatch(/NOT "nobody claims anything"/);

    const half = join(decisions, 'half-written.json');
    writeFileSync(half, '{"1139": "DR-1139-theirs.md"');
    const torn = spawnSync('node', [script, '--main-claims', half,
      '--decisions', decisions], { encoding: 'utf8' });
    expect(torn.status, 'an unparseable claims file must stop the run').toBe(2);
    expect(torn.stderr).toMatch(/could not parse/);

    // An OMITTED flag still means "no claims given", and still works.
    const none = spawnSync('node', [script, '--decisions', decisions], { encoding: 'utf8' });
    expect(none.status).toBe(0);
    expect(none.stdout).toMatch(/No introduced number is claimed/);
  });
});

// =============================================================================
// A RACE MUST TELL BOTH SIDES (DR-1160)
// =============================================================================
// DR-1147 decided that a contested number REPORTS and never fails, which is
// right: two open PRs wanting one number is a race nobody has lost, and failing
// both would be a gate picking a winner it has no standing to pick. What it did
// not do was make the report reach a person. It printed into a step summary, so
// the session that merged second learned about the collision from main going
// RED, and paid the full repair — a rename, a citation pass read by hand, a gate
// run and a re-verify.
//
// MEASURED 2026-10-21: nine collisions landed on main in eleven hours. At 05:30
// three open PRs were racing on two numbers (#2338 and #2340 both on DR-1158,
// #2339 and #2340 both on DR-1159) and not one side had been told. DR-1147 dated
// the question "did the warning prove enough?" for 2026-11-03; the answer came
// thirteen days early and it was no.
//
// Each racing PR runs this check itself, so one comment per PR reaches every
// side while moving is still cheap.
describe('the race reaches a person, not only a step summary', () => {
  const WF = readFileSync(join(REPO, '.github/workflows/dr-number-claim.yml'), 'utf8');

  it('a contested verdict is detected from the reader’s own output', () => {
    // From the SAME text the reader prints, not a second computation that could
    // disagree with the verdict it is reporting.
    expect(WF).toMatch(/grep -q 'CONTESTED WITH AN OPEN PR' \/tmp\/claims\.txt/);
    expect(WF).toMatch(/contested=true/);
    expect(WF).toMatch(/contested=false/);
  });

  it('it comments on a contested PR, and that step cannot fail the PR', () => {
    const step = WF.slice(WF.indexOf('Tell this PR when another open PR wants'),
      WF.indexOf('A number already on main fails this check'));
    expect(step).toMatch(/steps\.judge\.outputs\.contested == 'true'/);
    expect(step).toMatch(/Nobody has lost this race/);
    // It must not exit non-zero or mark the check failed: reporting is the whole
    // point, and a race that fails the build is the treadmill DR-1147 ended.
    expect(step).not.toMatch(/setFailed|exit 1/);
  });

  it('the comment says who moves and when, so the reader need not re-derive it', () => {
    const step = WF.slice(WF.indexOf('Tell this PR when another open PR wants'),
      WF.indexOf('A number already on main fails this check'));
    expect(step).toMatch(/merges second has to move/);
    expect(step).toMatch(/DR-1136/);
    expect(step).toMatch(/clean\*\* tree/);
  });

  it('one comment per PR, updated — never a new one on every push', () => {
    const step = WF.slice(WF.indexOf('Tell this PR when another open PR wants'),
      WF.indexOf('A number already on main fails this check'));
    expect(step).toMatch(/updateComment/);
    expect(step).toMatch(/listComments/);
  });

  it('and failing on a settled collision is untouched', () => {
    // The only thing that may fail this check is still taken-on-main.
    expect(WF).toMatch(/A number already on main fails this check/);
    const fail = WF.slice(WF.indexOf('A number already on main fails this check'));
    expect(fail).toMatch(/steps\.judge\.outputs\.code != '0'/);
    expect(fail).toMatch(/exit 1/);
  });
});
