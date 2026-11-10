// =============================================================================
// resolve-ledger-conflicts.test — the ledger merges resolve themselves (DR-0644)
// =============================================================================
// Every check is fed the break it exists to stop and must CATCH it (DR-0076 §3):
//   · the REAL conflict of 2026-09-24 (origin/main x #1793's branch) is the
//     fixture, and the naive resolutions a hand makes are shown to fail the
//     ledger guard while the resolver's output passes it;
//   · a Next ID clash, duplicate rows, a leftover marker and a conflict in a
//     third file are each built in a throwaway git repo and run through the
//     real CLI end to end.
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  conflictMarkerLines, unionConflictHunks, unionKeepingOrder, nextIdAnnotations, unionAnnotations,
  normalizeLedger, resolveLedgerText, unionUsageLedgerText, unionById,
  unionBudgetText, BUDGET_SPECS, BUDGET_GUARDS, RESOLVED_FILES,
} from '../../../scripts/resolve-ledger-conflicts.mjs';
import { regenerate } from '../../../scripts/file-budget-guard.mjs';
import { canonicalFault } from '../../../scripts/ai-usage-ledger.mjs';
import { drLedgerFindings } from '../../../scripts/business-systems-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const RESOLVER = join(REPO, 'scripts/resolve-ledger-conflicts.mjs');
const REAL = readFileSync(join(HERE, 'fixtures/ledger-conflict-1793.txt'), 'utf8');

const rowIds = (text) => text.split('\n').map((l) => /^\| \[DR-(\d{4})\]/.exec(l)?.[1]).filter(Boolean);

describe('resolve-ledger-conflicts — the real 2026-09-24 conflict', () => {
  it('the fixture IS a conflict (two hunks: the rows and the Next ID line)', () => {
    expect(conflictMarkerLines(REAL).length).toBe(4); // 2 x <<<<<<< + 2 x >>>>>>>
  });

  it('CATCHES the hand-resolution failure: a committed conflict is a guard finding', () => {
    const f = drLedgerFindings({ indexText: REAL, diskIds: [638] });
    expect(f.some((x) => x.includes('conflict-marker'))).toBe(true);
    expect(f.some((x) => x.includes('"**Next ID:**" lines'))).toBe(true);
  });

  it('CATCHES the naive "take theirs" resolution: the branch pointer DR-0636 is stale', () => {
    const takeTheirs = REAL.replace(/^<{7}.*\n[\s\S]*?^={7}\n([\s\S]*?)^>{7}.*\n/gm, '$1');
    expect(conflictMarkerLines(takeTheirs)).toEqual([]);
    const f = drLedgerFindings({ indexText: takeTheirs, diskIds: [637, 638] });
    expect(f.some((x) => x.includes('pointer must read DR-0639'))).toBe(true);
    expect(f.some((x) => x.includes('no row for DR-0637'))).toBe(true); // main's rows were dropped
  });

  it('resolves it: every row from both sides once, one pointer at disk+1, guard clean', () => {
    const { text } = resolveLedgerText(REAL, { nextId: 639 });
    expect(conflictMarkerLines(text)).toEqual([]);
    const ids = rowIds(text);
    for (const id of ['0637', '0638', '0629', '0627', '0630', '0631', '0635']) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(text.split('\n').filter((l) => l.startsWith('**Next ID:**'))).toHaveLength(1);
    expect(text).toMatch(/^\*\*Next ID:\*\* DR-0639\. /m);
    expect(drLedgerFindings({ indexText: text, diskIds: [631, 635, 637, 638] })).toEqual([]);
  });

  it('keeps every annotation from both Next ID lines (nothing silently dropped)', () => {
    const [ours, theirs] = REAL.split('\n').filter((l) => l.startsWith('**Next ID:**'));
    const { text } = resolveLedgerText(REAL, { nextId: 639 });
    const out = new Set(nextIdAnnotations(text.split('\n').find((l) => l.startsWith('**Next ID:**'))));
    for (const g of [...nextIdAnnotations(ours), ...nextIdAnnotations(theirs)]) expect(out.has(g)).toBe(true);
  });
});

describe('resolve-ledger-conflicts — pure pieces, each proven to catch', () => {
  const clash = [
    '| [DR-0100](a.md) | row |',
    '<<<<<<< ours',
    '| [DR-0102](c.md) | ours new |',
    '| [DR-0101](b.md) | same |',
    '=======',
    '| [DR-0101](b.md) | same |',
    '| [DR-0103](d.md) | theirs new |',
    '>>>>>>> theirs',
    '',
    '<<<<<<< ours',
    '**Next ID:** DR-0103. (DR-0102 = ours, 2026-09-24.) (DR-0100 = old.)',
    '||||||| base',
    '**Next ID:** DR-0101. (DR-0100 = old.)',
    '=======',
    '**Next ID:** DR-0104. (DR-0103 = theirs (nested, too), 2026-09-24.) (DR-0100 = old.)',
    '>>>>>>> theirs',
  ].join('\n');

  it('a Next ID clash resolves to disk+1, not to either side', () => {
    const { text } = resolveLedgerText(clash, { nextId: 105 }); // a DR-0104 file landed elsewhere
    expect(text).toContain('**Next ID:** DR-0105. ');
  });

  it('without a disk pointer it falls back to highest row + 1', () => {
    const { text } = resolveLedgerText(clash);
    expect(text).toContain('**Next ID:** DR-0104. ');
  });

  it('duplicate rows are dropped by id and reported; table order is kept', () => {
    const r = resolveLedgerText(clash, { nextId: 104 });
    expect(rowIds(r.text)).toEqual(['0100', '0102', '0101', '0103']);
    expect(r.removedRows).toEqual([]); // the hunk union already de-duplicated the identical line
    const dup = normalizeLedger('| [DR-0100](a.md) | x |\n| [DR-0100](a.md) | edited |\n\n**Next ID:** DR-0101.');
    expect(dup.removedRows).toEqual(['DR-0100']);
    expect(rowIds(dup.text)).toEqual(['0100']);
  });

  // 2026-10-06: two lanes each wrote DR-0762, and two others each wrote DR-0756.
  // Folding by number alone kept the first row and deleted the other decision
  // from the ledger; business-systems-guard then failed with "no row for
  // DR-0762", after the damage was already in the file. The resolver refuses
  // now, because a number claimed twice is a renumbering job, not a merge.
  it('REFUSES two different decisions that claim one number, and names the free id', () => {
    const collision = [
      '| [DR-0100](a.md) | first |',
      '| [DR-0101](b.md) | second |',
      '| [DR-0101](the-other-lane.md) | a different decision, same number |',
      '',
      '**Next ID:** DR-0102.',
    ].join('\n');
    expect(() => normalizeLedger(collision)).toThrow(/two different decisions claim DR-0101/);
    expect(() => normalizeLedger(collision)).toThrow(/b\.md and the-other-lane\.md/);
    expect(() => normalizeLedger(collision)).toThrow(/Renumber the newer file to DR-0102/);
    // THE ORDER IS PART OF THE CURE (2026-10-15). Naming the free id is not
    // enough: renumbering MID-MERGE cannot work, because this script reads
    // git's merge stages and stage 2 is the branch's own commit, so it keeps
    // seeing the old file name whatever the working tree says. One record hit
    // this three times in ninety minutes and the order had to be learned by
    // failing it. The refusal now carries the order, so the next reader does
    // not pay that again -- and these assertions are what keep it carrying it.
    expect(() => normalizeLedger(collision)).toThrow(/git merge --abort/);
    expect(() => normalizeLedger(collision)).toThrow(/renumber-decision-record\.mjs 0101 0102/);
    expect(() => normalizeLedger(collision)).toThrow(/clean tree/);
    expect(() => normalizeLedger(collision)).toThrow(/then run this script again/);
    // AND THE NUMBER IT NAMES IS MARKED AS A GUESS (2026-10-22). maxRowId reads
    // DISK, which cannot see a branch still in flight, so this refusal told one
    // record on PR #2360 to take 1185 -> 1205 -> 1207 inside ninety minutes and
    // every one of those was already claimed by unlanded work -- DR-1079's
    // finding, arriving as three wasted renumbers. The guess stays, because it
    // is right whenever nothing is in flight; what changed is that it no longer
    // reads as verified, and it names the tool that does verify.
    expect(() => normalizeLedger(collision)).toThrow(/CHECK THAT NUMBER BEFORE USING IT/);
    expect(() => normalizeLedger(collision)).toThrow(/claim-decision-number\.mjs/);
    expect(() => normalizeLedger(collision), 'it must say WHY the guess can be wrong, not just to check')
      .toThrow(/cannot see a branch still in flight/);
    // The same rows with the same link are still an ordinary duplicate, kept once.
    const same = collision.replace('(the-other-lane.md)', '(b.md)');
    expect(normalizeLedger(same).removedRows).toEqual(['DR-0101']);
  });

  it('CATCHES duplicate rows and a second pointer in the guard (the union shape)', () => {
    const naive = '| [DR-0100](a.md) | x |\n| [DR-0100](a.md) | y |\n\n**Next ID:** DR-0101.\n**Next ID:** DR-0099.';
    const f = drLedgerFindings({ indexText: naive, diskIds: [100] });
    expect(f.some((x) => x.includes('DR-0100 as a row twice'))).toBe(true);
    expect(f.some((x) => x.includes('2 "**Next ID:**" lines'))).toBe(true);
    expect(drLedgerFindings({ indexText: normalizeLedger(naive).text, diskIds: [100] })).toEqual([]);
  });

  it('CATCHES the row-below-the-pointer shape: a hunk spanning row + blank + pointer keeps rows above', () => {
    // The exact shape the sweep simulation produced before unionKeepingOrder:
    // "ours, then theirs" put theirs' row BELOW the folded pointer.
    const hunk = [
      '| [DR-0100](a.md) | a |',
      '<<<<<<< ours', '| [DR-0101](b.md) | pr |', '', '**Next ID:** DR-0102. (pr.)',
      '=======', '| [DR-0102](c.md) | main |', '', '**Next ID:** DR-0103. (main.)',
      '>>>>>>> theirs', '',
    ].join('\n');
    const { text } = resolveLedgerText(hunk, { nextId: 103 });
    expect(text).toBe('| [DR-0100](a.md) | a |\n| [DR-0101](b.md) | pr |\n| [DR-0102](c.md) | main |\n\n**Next ID:** DR-0103. (main.) (pr.)\n');
    expect(unionKeepingOrder(['a', '', 'P1'], ['b', '', 'P2'])).toEqual(['a', 'b', '', 'P1', 'P2']);
  });

  it('nested parentheses stay one annotation; new groups lead', () => {
    expect(nextIdAnnotations('**Next ID:** DR-0104. (a (b) c) (d)')).toEqual(['(a (b) c)', '(d)']);
    expect(unionAnnotations([['(x)', '(old)'], ['(y)', '(old)', '(z)']])).toEqual(['(y)', '(x)', '(old)', '(z)']);
  });

  it('refuses to guess on an unbalanced hunk', () => {
    expect(() => unionConflictHunks('a\n<<<<<<< ours\nb\n=======\nc\n')).toThrow(/never closed/);
    expect(() => unionConflictHunks('a\n>>>>>>> theirs\n')).toThrow(/unbalanced/);
    expect(() => normalizeLedger('<<<<<<< x\n**Next ID:** DR-0001.')).toThrow(/markers/);
  });

  it('a lone ======= (legal Markdown) is not a marker', () => {
    expect(conflictMarkerLines('Title\n=======\n')).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// End to end: a throwaway repo, a real `git merge`, the real CLI.
// -----------------------------------------------------------------------------
function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-e2e-'));
  const g = (...args) => execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const w = (p, s) => { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), s); };
  g('init', '-q', '-b', 'main');
  // A CI runner has no global identity, and `git merge` needs one even with
  // --no-commit (measured: CI run 36074321364 failed exactly here).
  g('config', 'user.email', 't@t'); g('config', 'user.name', 't'); g('config', 'commit.gpgsign', 'false');
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  copyFileSync(join(REPO, 'scripts/business-systems-guard.mjs'), join(dir, 'scripts/business-systems-guard.mjs'));
  // Stand-in generator: deterministic output from the pages in app/src/pages.
  w('scripts/legibility-guard.mjs', [
    "import { readdirSync, writeFileSync } from 'node:fs';",
    "const pages = readdirSync('app/src/pages').sort();",
    "writeFileSync('app/src/lib/legibility-health.json', JSON.stringify({ pages }, null, 2) + '\\n');",
    "console.log(`# legibility-guard --health\\nWrote ${pages.length} pages`);",
  ].join('\n'));
  w('app/src/pages/a.jsx', 'export default 1;\n');
  w('app/src/lib/legibility-health.json', JSON.stringify({ pages: ['a.jsx'] }, null, 2) + '\n');
  w('docs/decisions/DR-0100-a.md', '# a\n');
  w('docs/decisions/INDEX.md', '| [DR-0100](DR-0100-a.md) | a |\n\n**Next ID:** DR-0101. (DR-0100 = a.)\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  return { dir, g, w, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function twoSides({ g, w }, { extraOnPr, extraOnMain } = {}) {
  g('checkout', '-qb', 'pr');
  w('docs/decisions/DR-0101-pr.md', '# pr\n');
  w('docs/decisions/INDEX.md', '| [DR-0100](DR-0100-a.md) | a |\n| [DR-0101](DR-0101-pr.md) | pr |\n\n**Next ID:** DR-0102. (DR-0101 = pr.) (DR-0100 = a.)\n');
  w('app/src/pages/pr.jsx', 'export default 2;\n');
  w('app/src/lib/legibility-health.json', JSON.stringify({ pages: ['a.jsx', 'pr.jsx'] }, null, 2) + '\n');
  if (extraOnPr) extraOnPr();
  g('add', '-A'); g('commit', '-qm', 'pr');
  g('checkout', '-q', 'main');
  // main took DR-0101 AND DR-0102 first — the PR's own number is now a clash too,
  // but that is a rename for the owner; the ledger rows and pointer still union.
  w('docs/decisions/DR-0102-main.md', '# main\n');
  w('docs/decisions/INDEX.md', '| [DR-0100](DR-0100-a.md) | a |\n| [DR-0102](DR-0102-main.md) | main |\n\n**Next ID:** DR-0103. (DR-0102 = main.) (DR-0100 = a.)\n');
  w('app/src/pages/main.jsx', 'export default 3;\n');
  w('app/src/lib/legibility-health.json', JSON.stringify({ pages: ['a.jsx', 'main.jsx'] }, null, 2) + '\n');
  if (extraOnMain) extraOnMain();
  g('add', '-A'); g('commit', '-qm', 'main');
  g('checkout', '-q', 'pr');
  const m = spawnSync('git', ['merge', '--no-commit', '--no-ff', 'main'], { cwd: g.dir, encoding: 'utf8' });
  return m;
}

const run = (dir) => spawnSync(process.execPath, [RESOLVER], { cwd: dir, encoding: 'utf8' });

describe('resolve-ledger-conflicts — end to end in a real merge', () => {
  it('both ledger files conflict -> resolved, staged, guard green, zero markers', () => {
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      const m = twoSides(r);
      expect(m.stdout + m.stderr).toMatch(/CONFLICT.*INDEX\.md/);
      expect(m.stdout + m.stderr).toMatch(/CONFLICT.*legibility-health\.json/);
      const out = run(r.dir);
      expect(out.stderr).toBe('');
      expect(out.status).toBe(0);
      expect(out.stdout).toContain('business-systems-guard: OK');
      const index = readFileSync(join(r.dir, 'docs/decisions/INDEX.md'), 'utf8');
      expect(rowIds(index)).toEqual(['0100', '0101', '0102']);
      expect(rowIds(index.split('**Next ID:**')[1])).toEqual([]); // no row below the pointer
      expect(index).toContain('**Next ID:** DR-0103. ');
      expect(index).toContain('(DR-0101 = pr.)');
      expect(index).toContain('(DR-0102 = main.)');
      const health = JSON.parse(readFileSync(join(r.dir, 'app/src/lib/legibility-health.json'), 'utf8'));
      expect(health.pages).toEqual(['a.jsx', 'main.jsx', 'pr.jsx']); // regenerated, not picked
      expect(r.g('diff', '--name-only', '--diff-filter=U')).toBe('');
      r.g('commit', '-qm', 'merge'); // commits cleanly
    } finally { r.cleanup(); }
  });

  it('REFUSES when any other file conflicts, and names it', () => {
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      r.w('app/src/pages/shared.jsx', 'export default 0;\n'); r.g('add', '-A'); r.g('commit', '-qm', 'shared');
      twoSides(r, {
        extraOnPr: () => r.w('app/src/pages/shared.jsx', 'export default "pr";\n'),
        extraOnMain: () => r.w('app/src/pages/shared.jsx', 'export default "main";\n'),
      });
      const out = run(r.dir);
      expect(out.status).toBe(2);
      expect(out.stderr).toContain('app/src/pages/shared.jsx');
      expect(readFileSync(join(r.dir, 'docs/decisions/INDEX.md'), 'utf8')).toMatch(/^<{7}/m); // untouched
    } finally { r.cleanup(); }
  });

  it('a file main carries WITH markers on purpose (a test fixture) does not block the merge', () => {
    // The first live run (2026-09-25) refused six PRs over
    // app/src/__tests__/fixtures/ledger-conflict-1793.txt, brought in verbatim
    // from main. Only files this resolution produced are scanned.
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      twoSides(r, { extraOnMain: () => r.w('app/src/__tests__/fixtures/ledger-conflict-1793.txt', 'a\n<<<<<<< HEAD\nb\n=======\nc\n>>>>>>> x\n') });
      const out = run(r.dir);
      expect(out.stderr).toBe('');
      expect(out.status).toBe(0);
    } finally { r.cleanup(); }
  });

  it('CATCHES a conflict marker left in a file the resolution produced (fails loudly, exit 1)', () => {
    // A generator that leaves a marker in the health file it writes: the
    // scan still covers every file this resolution wrote.
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      r.w('scripts/legibility-guard.mjs', "import { writeFileSync } from 'node:fs';\nwriteFileSync('app/src/lib/legibility-health.json', '<<<<<<< ours\\n{}\\n=======\\n{}\\n>>>>>>> theirs\\n');\nconsole.log('wrote');\n");
      r.g('add', '-A'); r.g('commit', '-qm', 'a broken generator');
      twoSides(r);
      const out = run(r.dir);
      expect(out.status).toBe(1);
      expect(out.stderr).toMatch(/conflict markers left behind[\s\S]*legibility-health\.json/);
    } finally { r.cleanup(); }
  });

  it('CATCHES a broken ledger it cannot fix (a DR file with no row) — guard fails, exit 1', () => {
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      twoSides(r, { extraOnMain: () => r.w('docs/decisions/DR-0099-orphan.md', '# no row\n') });
      const out = run(r.dir);
      expect(out.status).toBe(1);
      expect(out.stderr).toMatch(/business-systems-guard did not pass[\s\S]*no row for DR-0099/);
    } finally { r.cleanup(); }
  });

  it('the dr-ledger merge driver (.gitattributes) resolves INDEX.md inside `git merge` itself', () => {
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      r.w('.gitattributes', 'docs/decisions/INDEX.md merge=dr-ledger\n'); r.g('add', '-A'); r.g('commit', '-qm', 'attr');
      r.g('config', 'merge.dr-ledger.driver', `node "${RESOLVER}" --driver %O %A %B`);
      const m = twoSides(r);
      expect(m.stdout + m.stderr).not.toMatch(/CONFLICT.*INDEX\.md/);
      const index = readFileSync(join(r.dir, 'docs/decisions/INDEX.md'), 'utf8');
      expect(conflictMarkerLines(index)).toEqual([]);
      expect(rowIds(index)).toEqual(['0100', '0101', '0102']);
      expect(rowIds(index.split('**Next ID:**')[1])).toEqual([]); // no row below the pointer
      expect(run(r.dir).status).toBe(0); // the post-merge pass finishes the health file
    } finally { r.cleanup(); }
  });

  it('with the driver UNCONFIGURED, git falls back to a normal conflict (the attribute is harmless)', () => {
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      r.w('.gitattributes', 'docs/decisions/INDEX.md merge=dr-ledger\n'); r.g('add', '-A'); r.g('commit', '-qm', 'attr');
      const m = twoSides(r);
      expect(m.stdout + m.stderr).toMatch(/CONFLICT.*INDEX\.md/);
      expect(run(r.dir).status).toBe(0);
    } finally { r.cleanup(); }
  });
});

// =============================================================================
// EIGHT MARKERS, NOT SEVEN (2026-11-05, DR-1321)
// =============================================================================
// git writes EIGHT characters when it must disambiguate a path: a rename or a
// DR renumber produces `<<<<<<<< HEAD:old/path.md` / `========` /
// `>>>>>>>> origin/main:new/path.md`. MARKER_RE was `/^(<{7}|>{7}|\|{7})(?: |$)/`
// -- seven brackets followed by a space or end of line -- so eight brackets read
// as seven plus a bracket and matched NOTHING.
//
// This guard exists to keep conflict markers out of the ledger, and it was blind
// to the one kind THIS ledger produces most (DR-1021 recorded nineteen renumbers
// in one week). Measured on main at c6e86c52f: exactly one file carried them and
// it was DR-1185-one-teaching-is-one-lesson.md -- the record defining the rule at
// the centre of DR-1317 -- broken in its own title line since #2372, while every
// run reported "zero conflict markers".
describe('a rename conflict writes EIGHT markers and must still be caught', () => {
  const EIGHT = [
    '<<<<<<<< HEAD:docs/decisions/DR-1191-one-teaching-is-one-lesson.md',
    '# DR-1191: One teaching is one lesson',
    '========',
    '# DR-1185: One teaching is one lesson',
    '>>>>>>>> origin/main:docs/decisions/DR-1185-one-teaching-is-one-lesson.md',
  ].join('\n');

  it('finds the opening and closing markers of an eight-character hunk', () => {
    expect(conflictMarkerLines(EIGHT)).toEqual([1, 5]);
  });

  it('PROVEN TO CATCH: the old seven-exact pattern saw nothing in it', () => {
    const OLD = /^(<{7}|>{7}|\|{7})(?: |$)/;
    const seen = EIGHT.split('\n').filter((l) => OLD.test(l));
    expect(seen, 'the old pattern must be shown blind, or this proves nothing').toEqual([]);
  });

  it('still catches the ordinary seven-character hunk', () => {
    const SEVEN = ['<<<<<<< HEAD', 'a', '=======', 'b', '>>>>>>> main'].join('\n');
    expect(conflictMarkerLines(SEVEN)).toEqual([1, 5]);
  });

  it('a bare ======== is still legal Markdown and is not a marker', () => {
    expect(conflictMarkerLines(['Title', '========', 'body'].join('\n'))).toEqual([]);
  });

  it('the real ledger carries no conflict marker at either width', () => {
    const dir = join(REPO, 'docs', 'decisions');
    const bad = readdirSync(dir).filter((f) => f.endsWith('.md'))
      .filter((f) => conflictMarkerLines(readFileSync(join(dir, f), 'utf8')).length);
    expect(bad, `these ledger files carry conflict markers: ${bad.join(', ')}`).toEqual([]);
  });
});

// =============================================================================
// The usage ledger unions itself (DR-1369).
// =============================================================================
// The third file this resolver owns. Proven to catch: the FUSED row a textual
// merge really produces, the two-sided edit that no rule can pick, and the
// serialization flip that made the file conflict when nobody had touched the
// same line.
describe('resolve-ledger-conflicts — ai-usage-ledger.json (DR-1369)', () => {
  const base = {
    schema: 'v1 — the dash is literal',
    models: { 'claude-opus-5': { note: 'a' } },
    sessions: [{ id: 's1', tokensBudgetAtStart: 100 }],
    entries: [{ id: 'first', drs: ['DR-1000'], notes: 'kept' }],
  };
  const withEntry = (e, from = base) => ({ ...from, entries: [...from.entries, e] });
  const mine = { id: 'ours-task', drs: ['DR-1369'], notes: 'mine' };
  const hers = { id: 'mains-task', drs: ['DR-1368'], notes: "main's" };

  it('unionById keeps theirs first, appends only new ids, and reports a differing one', () => {
    const theirs = [{ id: 'a', v: 1 }, { id: 'b', v: 1 }];
    const ours = [{ id: 'a', v: 1 }, { id: 'c', v: 1 }, { id: 'b', v: 2 }];
    const r = unionById(theirs, ours);
    expect(r.merged.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(r.added, 'only the id neither side had').toEqual(['c']);
    expect(r.differ, 'b is on both sides with different content').toEqual(['b']);
    expect(r.merged.find((e) => e.id === 'b').v, 'a differing entry is left at theirs, never folded').toBe(1);
  });

  it('unions two appends, main first and ours after, losing neither', () => {
    const r = unionUsageLedgerText(
      JSON.stringify(withEntry(hers), null, 2),
      JSON.stringify(withEntry(mine), null, 2),
    );
    expect(r.differ).toEqual([]);
    const ids = JSON.parse(r.text).entries.map((e) => e.id);
    expect(ids, 'main keeps its order and ours is appended').toEqual(['first', 'mains-task', 'ours-task']);
    expect(r.added).toEqual(['entries/ours-task']);
  });

  // THE BREAK THIS EXISTS TO STOP. A textual merge of two appends does not
  // produce a conflict it can be trusted on: it produces ONE object carrying
  // BOTH ids, which parses, validates by eye, and is wrong.
  it('a textual merge FUSES the two appends; the union does not', () => {
    const theirs = JSON.stringify(withEntry(hers), null, 2);
    const ours = JSON.stringify(withEntry(mine), null, 2);
    const dir = mkdtempSync(join(tmpdir(), 'usage-'));
    try {
      writeFileSync(join(dir, 'base'), `${JSON.stringify(base, null, 2)}\n`);
      writeFileSync(join(dir, 'ours'), `${ours}\n`);
      writeFileSync(join(dir, 'theirs'), `${theirs}\n`);
      const m = spawnSync('git', ['merge-file', '-p', join(dir, 'ours'), join(dir, 'base'), join(dir, 'theirs')],
        { encoding: 'utf8' });
      const fused = m.stdout;
      // Either it leaves markers (unparseable) or it interleaves the two rows.
      const parses = (() => { try { JSON.parse(fused); return true; } catch { return false; } })();
      expect(parses, 'a textual merge of two JSON appends is never a sound ledger').toBe(false);
    } finally { rmSync(dir, { recursive: true, force: true }); }

    const r = unionUsageLedgerText(theirs, ours);
    const entries = JSON.parse(r.text).entries;
    expect(entries.every((e) => typeof e.id === 'string'), 'no row carries two ids').toBe(true);
    expect(entries).toHaveLength(3);
  });

  // THE CASE NO RULE CAN PICK. On 2026-11-06 keeping main's side silently
  // dropped a correction to the ll283 entry; hours later, main HELD the
  // correction and the branches were stale, so keeping ours would have undone
  // it. Same wording, opposite right answer. So it refuses and names the id.
  it('REFUSES when the same id differs on both sides, and names it', () => {
    const theirs = JSON.stringify(withEntry({ ...mine, notes: 'CORRECTED by DR-1355' }), null, 2);
    const ours = JSON.stringify(withEntry(mine), null, 2);
    const r = unionUsageLedgerText(theirs, ours);
    expect(r.text, 'a refusal writes nothing').toBeUndefined();
    expect(r.differ).toEqual(['entries/ours-task']);
  });

  it('REFUSES a two-sided edit of a session reading or a model note', () => {
    const t = JSON.stringify({ ...base, sessions: [{ id: 's1', tokensBudgetAtStart: 200 }] }, null, 2);
    const o = JSON.stringify(base, null, 2);
    expect(unionUsageLedgerText(t, o).differ).toEqual(['sessions/s1']);

    const t2 = JSON.stringify({ ...base, models: { 'claude-opus-5': { note: 'b' } } }, null, 2);
    expect(unionUsageLedgerText(t2, o).differ).toEqual(['models/claude-opus-5']);
  });

  it('a new session or a new model is an append and unions', () => {
    const t = JSON.stringify(base, null, 2);
    const o = JSON.stringify({ ...base, sessions: [...base.sessions, { id: 's2' }], models: { ...base.models, 'claude-haiku-5-5': { note: 'c' } } }, null, 2);
    const r = unionUsageLedgerText(t, o);
    expect(r.differ).toEqual([]);
    expect(r.added).toEqual(['sessions/s2', 'models/claude-haiku-5-5']);
  });

  it('writes the canonical serialization, so the resolution cannot reintroduce the flip', () => {
    const escaped = JSON.stringify(withEntry(hers)).replace(/—/g, '\\u2014');
    const r = unionUsageLedgerText(escaped, JSON.stringify(withEntry(mine), null, 2));
    expect(r.differ).toEqual([]);
    expect(r.text).toBe(`${JSON.stringify(JSON.parse(r.text), null, 2)}\n`);
    expect(r.text.includes('\\u2014'), 'the escapes are gone, not propagated').toBe(false);
  });
});

// The writer's serialization is the only one allowed on disk, because the flip
// between the two was itself a conflict (DR-1369).
describe('ai-usage-ledger — one serialization (DR-1369)', () => {
  it('catches the escaped form that really landed at 95227a28bd', () => {
    const real = JSON.parse(readFileSync(join(REPO, 'app/src/lib/ai-usage-ledger.json'), 'utf8'));
    const escaped = JSON.stringify(real, null, 2).replace(/—/g, '\\u2014');
    const fault = canonicalFault(`${escaped}\n`);
    expect(fault, 'the escaped form must be caught').toBeTruthy();
    expect(fault).toMatch(/escape\(s\) where the writer emits literal UTF-8/);
  });

  it('catches a re-serialized number and a missing trailing newline', () => {
    expect(canonicalFault('{\n  "wallClockHours": 1.0\n}\n')).toBeTruthy();
    expect(canonicalFault('{\n  "a": 1\n}')).toBeTruthy();
  });

  it('passes the live ledger, which is the form --add writes', () => {
    const raw = readFileSync(join(REPO, 'app/src/lib/ai-usage-ledger.json'), 'utf8');
    expect(canonicalFault(raw), 'the file on disk is canonical').toBeNull();
  });
});

// The wiring, not the helper: before DR-1369 the CLI REFUSED this merge,
// because ai-usage-ledger.json was not a file it would touch. That refusal is
// what made every landing a hand resolution on every open branch.
describe('resolve-ledger-conflicts — the usage ledger end to end (DR-1369)', () => {
  const entry = (id, dr) => ({
    id, date: '2026-11-06', task: `t ${id}`, drs: [dr], model: 'm',
    tokens: null, costUsd: null, wallClockHours: 0.5, estimateWithoutAiHours: 4, notes: '',
  });
  const ledger = (entries) => `${JSON.stringify({
    schema: 's', models: { m: { note: 'n' } }, sessions: [], entries,
  }, null, 2)}\n`;
  const USAGE = 'app/src/lib/ai-usage-ledger.json';

  it('all three files conflict -> all three resolved, both appends kept, validator green', () => {
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      // The real guard and its rules, so the verification step is not a stub.
      copyFileSync(join(REPO, 'scripts/ai-usage-ledger.mjs'), join(r.dir, 'scripts/ai-usage-ledger.mjs'));
      r.w('app/src/lib/ai-usage-ledger-rules.js', readFileSync(join(REPO, 'app/src/lib/ai-usage-ledger-rules.js'), 'utf8'));
      r.w(USAGE, ledger([entry('base-task', 'DR-0100')]));
      r.g('add', '-A'); r.g('commit', '-qm', 'usage base');

      const m = twoSides(r, {
        extraOnPr: () => r.w(USAGE, ledger([entry('base-task', 'DR-0100'), entry('pr-task', 'DR-0101')])),
        extraOnMain: () => r.w(USAGE, ledger([entry('base-task', 'DR-0100'), entry('main-task', 'DR-0102')])),
      });
      expect(m.stdout + m.stderr, 'the usage ledger really does conflict').toMatch(/CONFLICT.*ai-usage-ledger\.json/);

      const out = run(r.dir);
      expect(out.stderr).toBe('');
      expect(out.status).toBe(0);
      expect(out.stdout).toContain('ai-usage-ledger.json: unioned by id');
      expect(out.stdout).toContain('ai-usage-ledger: OK');

      const merged = JSON.parse(readFileSync(join(r.dir, USAGE), 'utf8'));
      expect(merged.entries.map((e) => e.id), "main's order kept, ours appended, neither lost")
        .toEqual(['base-task', 'main-task', 'pr-task']);
      expect(r.g('diff', '--name-only', '--diff-filter=U')).toBe('');
      r.g('commit', '-qm', 'merge');
    } finally { r.cleanup(); }
  });

  it('a two-sided EDIT of one entry is refused end to end, naming the id', () => {
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      copyFileSync(join(REPO, 'scripts/ai-usage-ledger.mjs'), join(r.dir, 'scripts/ai-usage-ledger.mjs'));
      r.w('app/src/lib/ai-usage-ledger-rules.js', readFileSync(join(REPO, 'app/src/lib/ai-usage-ledger-rules.js'), 'utf8'));
      r.w(USAGE, ledger([entry('base-task', 'DR-0100')]));
      r.g('add', '-A'); r.g('commit', '-qm', 'usage base');

      const edited = (notes) => { const e = entry('base-task', 'DR-0100'); e.notes = notes; return ledger([e]); };
      twoSides(r, {
        extraOnPr: () => r.w(USAGE, edited('ours: the clause DR-1355 added')),
        extraOnMain: () => r.w(USAGE, edited("main's: a different sentence")),
      });

      const out = run(r.dir);
      expect(out.status, 'a refusal is exit 2, not a silent pick').toBe(2);
      expect(out.stderr).toContain('both sides changed the SAME part');
      expect(out.stderr).toContain('entries/base-task');
      // Nothing was written: the conflict is still there for a person to read.
      expect(r.g('diff', '--name-only', '--diff-filter=U')).toContain(USAGE);
    } finally { r.cleanup(); }
  });
});

// -----------------------------------------------------------------------------
// The two budget ratchets (DR-1342 workflow lines, DR-1339 file sizes).
// -----------------------------------------------------------------------------
// The fixtures are the REAL numbers of 2026-11-06, taken from the prose
// workflow-budget.json already carries: two raises that had to be re-based by
// hand when main moved underneath them. Each check is fed the break it exists
// to stop and must CATCH it (DR-0076 section 3).
describe('resolve-ledger-conflicts — the budget ratchets re-base onto main', () => {
  const WB = { raiseKey: 'dr', ceiling: 'totalLines', perKey: false, why: 'reason' };
  const FB = { raiseKey: 'file', ceiling: 'budgets', perKey: true, why: 'why' };

  const wb = (raises, totalLines) => JSON.stringify({ _comment: 'x', raises, totalLines }, null, 2) + '\n';
  const raise = (dr, from, to, reason = 'a reason') => ({ date: '2026-11-06', from, to, dr, reason });
  const fb = (raises, budgets) => JSON.stringify({ _comment: 'x', raises, budgets }, null, 2) + '\n';
  const fraise = (file, from, to, why = 'a reason') => ({ file, from, to, date: '2026-11-06', why });

  it('CATCHES the naive union: a plain concat counts only ONE of the two changes', () => {
    // The real case. Base ends at 22413. Main appended DR-1363 (+3). We wrote
    // DR-1374 as 22413 -> 22659 (+246) against the main of the hour.
    const base = wb([raise('DR-1360', 22401, 22413)], 22413);
    const theirs = wb([raise('DR-1360', 22401, 22413), raise('DR-1363', 22413, 22416)], 22416);
    const ours = wb([raise('DR-1360', 22401, 22413), raise('DR-1374', 22413, 22659)], 22659);

    // What a hand does when it just keeps both entries and the bigger total:
    // 22659 counts our 246 lines but silently drops main's 3.
    expect(22659).toBeLessThan(22416 + 246);

    const r = unionBudgetText(base, theirs, ours, WB);
    expect(r.differ).toEqual([]);
    const out = JSON.parse(r.text);
    // Exactly the numbers the record settled on by hand.
    expect(out.raises.map((e) => [e.dr, e.from, e.to])).toEqual([
      ['DR-1360', 22401, 22413],
      ['DR-1363', 22413, 22416],
      ['DR-1374', 22416, 22662],
    ]);
    expect(out.totalLines).toBe(22662);
    expect(r.rebased).toHaveLength(1);
    expect(r.rebased[0]).toContain('22413 -> 22659 becomes 22416 -> 22662');
    expect(r.rebased[0]).toContain('delta +246 kept');
  });

  it('the DR-1363 re-base lands on its recorded numbers too (22396->22399 => 22413->22416)', () => {
    const base = wb([raise('DR-1348', 22266, 22272)], 22272);
    const theirs = wb([raise('DR-1348', 22266, 22272), raise('ll284', 22272, 22413)], 22413);
    const ours = wb([raise('DR-1348', 22266, 22272), raise('DR-1363', 22396, 22399)], 22399);
    const out = JSON.parse(unionBudgetText(base, theirs, ours, WB).text);
    expect(out.raises.at(-1)).toMatchObject({ dr: 'DR-1363', from: 22413, to: 22416 });
    expect(out.totalLines).toBe(22416);
  });

  it('does NOT rewrite the prose that recites the old numbers (DR-1362 decision 2)', () => {
    const stale = 'First written as 22413 -> 22659 against the main of the hour.';
    const base = wb([raise('DR-1360', 22401, 22413)], 22413);
    const theirs = wb([raise('DR-1360', 22401, 22413), raise('DR-1363', 22413, 22416)], 22416);
    const ours = wb([raise('DR-1360', 22401, 22413), raise('DR-1374', 22413, 22659, stale)], 22659);
    const out = JSON.parse(unionBudgetText(base, theirs, ours, WB).text);
    expect(out.raises.at(-1).reason, 'a tool must not rewrite prose by number').toBe(stale);
  });

  it('per-file chains re-base INDEPENDENTLY — a file main did not touch does not move', () => {
    const base = fb([], { 'a.js': 100, 'b.js': 200 });
    const theirs = fb([fraise('a.js', 100, 140)], { 'a.js': 140, 'b.js': 200 });
    const ours = fb([fraise('a.js', 100, 110), fraise('b.js', 200, 230)],
      { 'a.js': 110, 'b.js': 230 });
    const r = unionBudgetText(base, theirs, ours, FB);
    expect(r.differ).toEqual([]);
    const out = JSON.parse(r.text);
    // a.js re-bases onto main's 140 (+10); b.js main never touched, so it stands.
    expect(out.raises.map((e) => [e.file, e.from, e.to])).toEqual([
      ['a.js', 100, 140],
      ['a.js', 140, 150],
      ['b.js', 200, 230],
    ]);
    expect(out.budgets).toEqual({ 'a.js': 150, 'b.js': 230 });
    expect(r.rebased).toHaveLength(1);
    expect(r.rebased[0]).toContain('a.js');
  });

  it('a file only THIS branch budgets is carried over, not dropped', () => {
    const base = fb([], { 'a.js': 100 });
    const theirs = fb([], { 'a.js': 100 });
    const ours = fb([fraise('new.js', 1500, 1600)], { 'a.js': 100, 'new.js': 1600 });
    const out = JSON.parse(unionBudgetText(base, theirs, ours, FB).text);
    expect(out.budgets).toEqual({ 'a.js': 100, 'new.js': 1600 });
  });

  it('REFUSES when a side rewrote history: raises is append-only or it is nothing', () => {
    const base = wb([raise('DR-1360', 22401, 22413, 'the original reason')], 22413);
    const theirs = wb([raise('DR-1360', 22401, 22413, 'main reworded it')], 22413);
    const ours = wb([raise('DR-1360', 22401, 22413, 'the original reason'), raise('DR-1374', 22413, 22659)], 22659);
    const r = unionBudgetText(base, theirs, ours, WB);
    expect(r.text, 'nothing is written on a refusal').toBeUndefined();
    expect(r.differ[0]).toContain('main rewrote an existing entry');
  });

  it('CATCHES the stale chain: the CEILING is the authority, not the last raise', () => {
    // THE REAL CASE, 2026-11-10, sov72 merging main into scripts/file-budgets.json.
    // Our raise is on a file main never touched, so it needs no re-base at all --
    // but the kept chain's last entry for that file ends at 10289 while main's
    // CEILING is 10624, because `--generate` lowers a ceiling down-only WITHOUT
    // writing a raise entry. Landing on the chain gave 10624 -> 10688 and
    // file-budget-guard refused: "11023 lines, over its ceiling of 10688".
    const F = 'app/src/lib/sovereign-ai-class.js';
    const base = fb([fraise(F, 10100, 10289)], { [F]: 10624 });
    const theirs = fb([fraise(F, 10100, 10289), fraise('other.js', 100, 140)],
      { [F]: 10624, 'other.js': 140 });
    const ours = fb([fraise(F, 10100, 10289), fraise(F, 10624, 11023)], { [F]: 11023 });

    const out = JSON.parse(unionBudgetText(base, theirs, ours, FB).text);
    // The chain says 10289; the ceiling says 10624. The ceiling wins.
    expect(out.raises.at(-1), 'landing on the stale chain end moves a ratchet by accident')
      .toMatchObject({ file: F, from: 10624, to: 11023 });
    expect(out.budgets[F]).toBe(11023);
    // And main's own file is untouched by our re-base.
    expect(out.budgets['other.js']).toBe(140);
  });

  it('a SECOND entry of ours on one subject lands on the first, not the ceiling again', () => {
    // The ordering fix must not re-seed from the ceiling once we are chaining.
    const base = fb([], { 'a.js': 1000 });
    const theirs = fb([], { 'a.js': 1000 });
    const ours = fb([fraise('a.js', 1000, 1010), fraise('a.js', 1010, 1025)], { 'a.js': 1025 });
    const out = JSON.parse(unionBudgetText(base, theirs, ours, FB).text);
    expect(out.raises.map((e) => [e.from, e.to])).toEqual([[1000, 1010], [1010, 1025]]);
    expect(out.budgets['a.js']).toBe(1025);
  });

  it('a subject main has NEVER seen needs no re-base — ours stands unchanged', () => {
    // No predecessor and no ceiling in main is positive evidence that main has
    // never budgeted this file, so there is nothing to re-base onto and nothing
    // to re-base. The guard still measures and judges the ceiling either way.
    const base = fb([], {});
    const theirs = fb([], {});
    const ours = fb([fraise('ghost.js', 1500, 1600)], { 'ghost.js': 1600 });
    const r = unionBudgetText(base, theirs, ours, FB);
    expect(r.differ).toEqual([]);
    const out = JSON.parse(r.text);
    expect(out.raises.at(-1)).toMatchObject({ file: 'ghost.js', from: 1500, to: 1600 });
    expect(r.rebased, 'nothing moved, so nothing is reported as moved').toEqual([]);
  });

  it('REFUSES an entry whose from/to is not a number — no arithmetic on nonsense', () => {
    const base = wb([raise('DR-1360', 22401, 22413)], 22413);
    const theirs = wb([raise('DR-1360', 22401, 22413), raise('DR-1363', 22413, 22416)], 22416);
    const ours = wb([raise('DR-1360', 22401, 22413), raise('DR-1374', 22413, 'lots')], 22659);
    const r = unionBudgetText(base, theirs, ours, WB);
    expect(r.text, 'nothing is written on a refusal').toBeUndefined();
    expect(r.differ[0]).toContain('not a number');
  });

  it('a shrink is a NEGATIVE delta and still chains (the ratchet goes down freely)', () => {
    const base = wb([raise('DR-1348', 22266, 22272)], 22272);
    const theirs = wb([raise('DR-1348', 22266, 22272), raise('main', 22272, 22300)], 22300);
    const ours = wb([raise('DR-1348', 22266, 22272), raise('ours', 22272, 22250)], 22250);
    const out = JSON.parse(unionBudgetText(base, theirs, ours, WB).text);
    expect(out.raises.at(-1)).toMatchObject({ from: 22300, to: 22278 });
    expect(out.totalLines).toBe(22278);
  });

  it('the resolver OWNS both budget files (they are in RESOLVED_FILES)', () => {
    expect(RESOLVED_FILES).toContain('scripts/workflow-budget.json');
    expect(RESOLVED_FILES).toContain('scripts/file-budgets.json');
    // And each one names the guard that measures it, so the resolver never does.
    expect(Object.keys(BUDGET_GUARDS).sort()).toEqual(Object.keys(BUDGET_SPECS).sort());
  });

  it("the guards that OWN the measurement are down-only, which is why the resolver may defer to them", () => {
    // Proving the premise the design rests on, not just asserting it: both
    // generators keep the MINIMUM, so --generate can lower a ceiling to the
    // real size but can never raise one past what a raise entry explains.
    const reg = readFileSync(join(REPO, 'scripts/workflow-register.mjs'), 'utf8');
    expect(reg).toMatch(/budget\.totalLines\s*=\s*Math\.min\(/);
    expect(regenerate({ 'a.js': 90 }, { 'a.js': 100 })).toEqual({ 'a.js': 90 });
    expect(regenerate({ 'a.js': 120 }, { 'a.js': 100 }), 'never raises').toEqual({ 'a.js': 100 });
  });
});
