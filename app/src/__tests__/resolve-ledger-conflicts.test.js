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
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  conflictMarkerLines, unionConflictHunks, unionKeepingOrder, nextIdAnnotations, unionAnnotations,
  normalizeLedger, resolveLedgerText,
} from '../../../scripts/resolve-ledger-conflicts.mjs';
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

  it('CATCHES a conflict marker left in another merge-touched file (fails loudly, exit 1)', () => {
    const r = makeRepo(); r.g.dir = r.dir;
    try {
      twoSides(r, { extraOnMain: () => r.w('notes.md', 'a\n<<<<<<< HEAD\nb\n=======\nc\n>>>>>>> x\n') });
      const out = run(r.dir);
      expect(out.status).toBe(1);
      expect(out.stderr).toMatch(/conflict markers left behind[\s\S]*notes\.md/);
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
