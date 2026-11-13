// @vitest-environment node
// =============================================================================
// The INDEX pointer is derived, never typed — two record branches merge (DR-1477)
// =============================================================================
// Every branch that added a decision record used to rewrite one line of
// docs/decisions/INDEX.md, `**Next ID:** DR-NNNN. (...)`, so two lesson branches
// built side by side (L307 and L308, 2026-11-13) always conflicted there, even
// when their rows sat far apart. The line is now one fixed sentence naming
// `claim-decision-number --reserve`; no branch edits it, and every reader
// derives the number. Proven here with real `git merge` in a throwaway repo:
//
//   · two branches that each add one row at DIFFERENT points of the table merge
//     with NO conflict, by plain git, no driver configured;
//   · PROVEN TO CATCH: the same two branches, each also rewriting the old
//     numbered pointer the way every branch did, conflict on it;
//   · two rows appended at the table's END still conflict as text (adjacent
//     lines), and resolve-ledger-conflicts unions them with the pointer as is.
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as lib from '../../../scripts/lib/decision-pointer.mjs';
import * as resolver from '../../../scripts/resolve-ledger-conflicts.mjs';
import { drLedgerFindings } from '../../../scripts/business-systems-guard.mjs';

const { DERIVED_POINTER, HISTORY_PREFIX, nextIdFromNames, isDerivedPointer } = lib;
const REPO = join(__dirname, '..', '..', '..');
const ID = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const row = (n, what) => `| [DR-${String(n).padStart(4, '0')}](DR-${String(n).padStart(4, '0')}-${what}.md) | **${what}** | accepted |`;

let dir = null;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = null;
});

function repo(indexLines) {
  dir = mkdtempSync(join(tmpdir(), 'derived-pointer-'));
  const g = (...args) =>
    execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, ...ID },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  g('init', '-q', '-b', 'main');
  writeFileSync(join(dir, 'INDEX.md'), `${indexLines.join('\n')}\n`);
  g('add', '-A');
  g('commit', '-qm', 'base');
  const edit = (fn) => writeFileSync(join(dir, 'INDEX.md'), `${fn(readFileSync(join(dir, 'INDEX.md'), 'utf8').replace(/\n$/, '').split('\n')).join('\n')}\n`);
  const branch = (name, fn) => {
    g('checkout', '-qb', name, 'main');
    edit(fn);
    g('commit', '-qam', name);
  };
  const merge = (a, b) => {
    g('checkout', '-q', a);
    return spawnSync('git', ['merge', '--no-ff', '--no-edit', b], { cwd: dir, encoding: 'utf8', env: { ...process.env, ...ID } });
  };
  return { g, branch, merge, read: () => readFileSync(join(dir, 'INDEX.md'), 'utf8') };
}

// A table shaped like the real one: rows, the pointer in the middle, more rows.
const BASE = [
  '# Decision Records — INDEX',
  '',
  '| ID | Title | Status |',
  '|---|---|---|',
  row(100, 'a'),
  row(101, 'b'),
  row(102, 'c'),
  DERIVED_POINTER,
  `${HISTORY_PREFIX} (DR-0102 = c.)`,
  row(103, 'd'),
  row(104, 'e'),
  row(105, 'f'),
];
const after = (lines, n, line) => {
  const i = lines.findIndex((l) => l.startsWith(`| [DR-${String(n).padStart(4, '0')}]`));
  return [...lines.slice(0, i + 1), line, ...lines.slice(i + 1)];
};

describe('the pointer has one canonical sentence', () => {
  it('the resolver carries a byte-identical copy (it is copied alone to $RUNNER_TEMP, so it cannot import)', () => {
    expect(resolver.DERIVED_POINTER).toBe(lib.DERIVED_POINTER);
    expect(resolver.HISTORY_PREFIX).toBe(lib.HISTORY_PREFIX);
    expect(readFileSync(join(REPO, 'scripts/resolve-ledger-conflicts.mjs'), 'utf8')).not.toMatch(/^import .*\.\/lib\//m);
  });

  it('names no number, so no renumber or new record ever has to touch it', () => {
    expect(DERIVED_POINTER).not.toMatch(/DR-\d{4}/);
    expect(DERIVED_POINTER).toMatch(/claim-decision-number\.mjs --reserve/);
    expect(isDerivedPointer(`${DERIVED_POINTER}  `)).toBe(true);
    expect(isDerivedPointer('**Next ID:** DR-1477.')).toBe(false);
  });

  it('the number is derived: highest record on disk plus one', () => {
    expect(nextIdFromNames(['DR-0007-a.md', 'INDEX.md', 'DR-1476-b.md', 'README.md'])).toBe(1477);
    expect(nextIdFromNames([])).toBe(1);
    const disk = readdirSync(join(REPO, 'docs/decisions'));
    expect(nextIdFromNames(disk)).toBe(Math.max(...disk.map((f) => Number(/^DR-(\d{4})-/.exec(f)?.[1] || 0))) + 1);
  });

  it('the real INDEX carries it, once, with the frozen history line under it', () => {
    const lines = readFileSync(join(REPO, 'docs/decisions/INDEX.md'), 'utf8').split('\n');
    const at = lines.findIndex((l) => l.startsWith('**Next ID:**'));
    expect(lines.filter((l) => l.startsWith('**Next ID:**'))).toEqual([DERIVED_POINTER]);
    expect(lines[at + 1].startsWith(HISTORY_PREFIX)).toBe(true);
  });
});

describe('two branches that each add a record merge by plain git (DR-1477)', () => {
  it('rows added at different points of the table merge with no conflict, and the pointer is untouched', () => {
    const r = repo(BASE);
    r.branch('lesson-a', (l) => after(l, 101, row(201, 'lesson-a')));
    r.branch('lesson-b', (l) => after(l, 104, row(202, 'lesson-b')));
    const m = r.merge('lesson-a', 'lesson-b');
    expect(m.status, m.stdout + m.stderr).toBe(0);
    expect(m.stdout + m.stderr).not.toMatch(/CONFLICT/);
    const text = r.read();
    expect(text).toContain(row(201, 'lesson-a'));
    expect(text).toContain(row(202, 'lesson-b'));
    expect(text.split('\n').filter((l) => l.startsWith('**Next ID:**'))).toEqual([DERIVED_POINTER]);
    expect(drLedgerFindings({ indexText: text, diskIds: [100, 101, 102, 103, 104, 105, 201, 202] })).toEqual([]);
  });

  it('PROVEN TO CATCH: the same two branches each rewriting the old numbered pointer conflict on it', () => {
    const OLD = BASE.map((l) => (l === DERIVED_POINTER ? '**Next ID:** DR-0106.' : l)).filter((l) => !l.startsWith(HISTORY_PREFIX));
    const r = repo(OLD);
    const typed = (n, what) => (l) =>
      after(l, n === 201 ? 101 : 104, row(n, what)).map((x) => (x.startsWith('**Next ID:**') ? `**Next ID:** DR-0${n + 1}. (DR-0${n} = ${what}.)` : x));
    r.branch('lesson-a', typed(201, 'lesson-a'));
    r.branch('lesson-b', typed(202, 'lesson-b'));
    const m = r.merge('lesson-a', 'lesson-b');
    expect(m.status).not.toBe(0);
    expect(m.stdout + m.stderr).toMatch(/CONFLICT \(content\).*INDEX\.md/);
    expect(r.read()).toMatch(/^<{7} HEAD\n\*\*Next ID:\*\* DR-0202\./m);
  });

  it('two rows appended at the END still conflict as text, and the resolver unions them with the pointer as it was', () => {
    const r = repo(BASE);
    r.branch('lesson-a', (l) => [...l, row(201, 'lesson-a')]);
    r.branch('lesson-b', (l) => [...l, row(202, 'lesson-b')]);
    const m = r.merge('lesson-a', 'lesson-b');
    expect(m.stdout + m.stderr, 'adjacent appends are a textual conflict; this is the resolver’s case').toMatch(/CONFLICT.*INDEX\.md/);
    const out = resolver.resolveLedgerText(r.read());
    const lines = out.text.split('\n');
    expect(lines.filter((l) => l.startsWith('| [DR-02'))).toEqual([row(201, 'lesson-a'), row(202, 'lesson-b')]);
    expect(lines.filter((l) => l.startsWith('**Next ID:**'))).toEqual([DERIVED_POINTER]);
    expect(lines.filter((l) => l.startsWith(HISTORY_PREFIX))).toEqual([`${HISTORY_PREFIX} (DR-0102 = c.)`]);
    expect(out.movedToHistory).toBe(0);
    expect(drLedgerFindings({ indexText: out.text, diskIds: [100, 101, 102, 103, 104, 105, 201, 202] })).toEqual([]);
  });

  it('the union of rows works with no pointer line in the text at all', () => {
    const conflicted = [row(100, 'a'), '<<<<<<< ours', row(201, 'x'), '=======', row(202, 'y'), '>>>>>>> theirs', ''].join('\n');
    const out = resolver.resolveLedgerText(conflicted);
    expect(out.text).toBe(`${row(100, 'a')}\n${row(201, 'x')}\n${row(202, 'y')}\n`);
    expect(out.foldedNextIdLines).toBe(0);
  });
});
