// @vitest-environment node
// =============================================================================
// renumber-decision-record — the four-times-by-hand cost, made a tool
// =============================================================================
// MEASURED, which is why this exists: on 2026-10-14 one session renumbered a
// decision record by hand FOUR times in a few hours — DR-1003 -> 1004,
// DR-1013 -> 1016, DR-1016 -> 1019, DR-1017 -> 1018 — because concurrent
// sessions kept taking the number a branch was already carrying. Each time the
// edits were the same four, done with a throwaway one-liner.
//
// WHAT IS NOT CHANGED, and this is the point of the design: DR-0644 made
// resolve-ledger-conflicts.mjs REFUSE a number collision rather than fold it,
// because folding deleted a real decision from the ledger twice on 2026-10-06.
// That refusal is untouched. This is the rename its own error message already
// tells the operator to perform.
//
// The refusals are the substance of these tests, because a tool that moves
// decision records is only safe if it declines the cases where it would lose
// one or create the collision it exists to clear.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  recordsOnDisk, firstFreeNumber, planRenumber, rewriteText, renumberInTree, idOf, pad,
} from '../../../scripts/renumber-decision-record.mjs';

const disk = (pairs) => new Map(pairs);

describe('reading the numbers that are taken', () => {
  it('pads to four digits the way the ledger does', () => {
    expect(pad(7)).toBe('0007');
    expect(idOf(1016)).toBe('DR-1016');
  });

  it('finds the lowest free number at or above a floor', () => {
    const d = disk([[1015, 'a.md'], [1016, 'b.md'], [1017, 'c.md']]);
    expect(firstFreeNumber(d, 1015)).toBe(1018);
    expect(firstFreeNumber(d, 1020)).toBe(1020);
  });

  it('reports a doubly-held number as an array rather than losing one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dr-disk-'));
    writeFileSync(join(dir, 'DR-1016-one.md'), '# DR-1016: one\n');
    writeFileSync(join(dir, 'DR-1016-two.md'), '# DR-1016: two\n');
    writeFileSync(join(dir, 'INDEX.md'), '**Next ID:** DR-1017.\n');
    writeFileSync(join(dir, 'README.md'), 'not a record\n');
    const got = recordsOnDisk(dir);
    expect(Array.isArray(got.get(1016))).toBe(true);
    expect(got.get(1016)).toHaveLength(2);
    expect(got.has(1017), 'INDEX.md and README.md are not records').toBe(false);
  });
});

describe('the plan, and every case it refuses', () => {
  it('moves a record to the next free number when none is named', () => {
    const d = disk([[1016, 'DR-1016-a-gospel-with-a-hole-in-it.md'], [1017, 'x.md'], [1018, 'y.md']]);
    expect(planRenumber(d, 1016)).toEqual({
      from: 1016,
      to: 1019,
      oldFile: 'DR-1016-a-gospel-with-a-hole-in-it.md',
      newFile: 'DR-1019-a-gospel-with-a-hole-in-it.md',
    });
  });

  it('keeps the slug exactly, so the record is still findable by name', () => {
    const d = disk([[1017, 'DR-1017-shyness-can-be-pride.md']]);
    expect(planRenumber(d, 1017, 1018).newFile).toBe('DR-1018-shyness-can-be-pride.md');
  });

  it('REFUSES a target another file already holds — it must not create a collision', () => {
    const d = disk([[1016, 'mine.md'], [1019, 'theirs.md']]);
    expect(() => planRenumber(d, 1016, 1019)).toThrow(/already held by theirs\.md/);
    expect(() => planRenumber(d, 1016, 1019)).toThrow(/create the collision this exists to clear/);
  });

  it('REFUSES a source number no file holds', () => {
    expect(() => planRenumber(disk([[1016, 'a.md']]), 1015)).toThrow(/no decision file holds DR-1015/);
  });

  it('REFUSES a source two files hold, naming both rather than guessing', () => {
    const d = disk([[1016, ['DR-1016-one.md', 'DR-1016-two.md']]]);
    expect(() => planRenumber(d, 1016)).toThrow(/two files already hold DR-1016/);
    expect(() => planRenumber(d, 1016)).toThrow(/DR-1016-one\.md and DR-1016-two\.md/);
    expect(() => planRenumber(d, 1016)).toThrow(/a person reads those two/);
  });

  it('REFUSES a no-op', () => {
    expect(() => planRenumber(disk([[1016, 'a.md']]), 1016, 1016)).toThrow(/already its own number/);
  });
});

describe('rewriting a citation', () => {
  const plan = { from: 1016, to: 1019, oldFile: 'DR-1016-a.md', newFile: 'DR-1019-a.md' };

  it('rewrites the id and the file name together', () => {
    expect(rewriteText('see [DR-1016](DR-1016-a.md) for it', plan))
      .toBe('see [DR-1019](DR-1019-a.md) for it');
  });

  it('never matches inside a longer number (proven-to-catch)', () => {
    // A naive replace would turn DR-10160 into DR-10190. The ledger will reach
    // five digits one day and this must not corrupt it when it does.
    expect(rewriteText('DR-10160 and DR-1016', plan)).toBe('DR-10160 and DR-1019');
  });

  it('returns null when there is nothing to change, so untouched files stay untouched', () => {
    expect(rewriteText('no ids here', plan)).toBeNull();
    expect(rewriteText('DR-1015 only', plan)).toBeNull();
  });
});

describe('the whole rename, in a real tree', () => {
  const build = () => {
    const root = mkdtempSync(join(tmpdir(), 'dr-tree-'));
    mkdirSync(join(root, 'docs/decisions'), { recursive: true });
    mkdirSync(join(root, 'app/src/__tests__'), { recursive: true });
    mkdirSync(join(root, 'scripts'), { recursive: true });
    writeFileSync(join(root, 'docs/decisions/DR-1016-a-gospel-with-a-hole-in-it.md'),
      '# DR-1016: A gospel with a hole in it\n\n**Amends:** DR-1012\n');
    writeFileSync(join(root, 'docs/decisions/DR-1017-held-by-another.md'), '# DR-1017: held\n');
    writeFileSync(join(root, 'docs/decisions/INDEX.md'),
      '**Next ID:** DR-1018. (DR-1016 = a-gospel-with-a-hole-in-it)\n'
      + '| [DR-1016](DR-1016-a-gospel-with-a-hole-in-it.md) | **A gospel.** | accepted |\n'
      + '| [DR-1017](DR-1017-held-by-another.md) | **Held.** | accepted |\n');
    writeFileSync(join(root, 'app/src/__tests__/living-lessons-l79-verses.test.js'),
      '// L79 — A Gospel With a Hole In It (DR-1016)\n');
    writeFileSync(join(root, 'scripts/unrelated.mjs'), '// cites DR-1012 only\n');
    return root;
  };

  it('renames the file, relinks the row, and rewrites every citation', () => {
    const root = build();
    const r = renumberInTree(root, 1016, null, { force: true, log: () => {} });
    expect(r.to, 'DR-1017 is taken, so the next free number is 1018... which is also free here').toBe(1018);

    expect(existsSync(join(root, 'docs/decisions/DR-1018-a-gospel-with-a-hole-in-it.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/decisions/DR-1016-a-gospel-with-a-hole-in-it.md'))).toBe(false);

    const body = readFileSync(join(root, 'docs/decisions/DR-1018-a-gospel-with-a-hole-in-it.md'), 'utf8');
    expect(body).toContain('# DR-1018: A gospel with a hole in it');
    expect(body, 'a reference to another record is left alone').toContain('**Amends:** DR-1012');

    const index = readFileSync(join(root, 'docs/decisions/INDEX.md'), 'utf8');
    expect(index).toContain('| [DR-1018](DR-1018-a-gospel-with-a-hole-in-it.md) |');
    expect(index).not.toContain('DR-1016');
    expect(index, "another record's row is untouched").toContain('| [DR-1017](DR-1017-held-by-another.md) |');

    expect(readFileSync(join(root, 'app/src/__tests__/living-lessons-l79-verses.test.js'), 'utf8'))
      .toContain('(DR-1018)');
    expect(readFileSync(join(root, 'scripts/unrelated.mjs'), 'utf8'), 'a file citing nothing relevant is not rewritten')
      .toBe('// cites DR-1012 only\n');
  });

  it('takes a named target when one is given', () => {
    const root = build();
    renumberInTree(root, 1016, 1099, { force: true, log: () => {} });
    expect(existsSync(join(root, 'docs/decisions/DR-1099-a-gospel-with-a-hole-in-it.md'))).toBe(true);
  });

  it('would still refuse to renumber onto a held number (proven-to-catch)', () => {
    const root = build();
    expect(() => renumberInTree(root, 1016, 1017, { force: true, log: () => {} }))
      .toThrow(/already held by DR-1017-held-by-another\.md/);
    // and it changed nothing on the way to refusing
    expect(existsSync(join(root, 'docs/decisions/DR-1016-a-gospel-with-a-hole-in-it.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/decisions/INDEX.md'), 'utf8')).toContain('[DR-1016]');
  });

  it('leaves the pointer to the resolver that owns it', () => {
    const root = build();
    renumberInTree(root, 1016, 1098, { force: true, log: () => {} });
    const index = readFileSync(join(root, 'docs/decisions/INDEX.md'), 'utf8');
    // The pointer line's own "DR-1018" is a Next ID, not a citation of the moved
    // record, and this script does not compute pointers — resolve-ledger-conflicts
    // does, from the files on disk.
    expect(index).toContain('**Next ID:** DR-1018.');
    expect(index, "the pointer's annotation still names the record, renumbered").toContain('(DR-1098 = a-gospel-with-a-hole-in-it)');
  });

  it('renames exactly one file and never deletes a record', () => {
    const root = build();
    const before = readdirSync(join(root, 'docs/decisions')).length;
    renumberInTree(root, 1016, 1097, { force: true, log: () => {} });
    expect(readdirSync(join(root, 'docs/decisions')).length, 'the file count is unchanged').toBe(before);
  });
});
