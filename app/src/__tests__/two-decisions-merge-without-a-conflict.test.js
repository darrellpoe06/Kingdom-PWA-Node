// =============================================================================
// Two decision PRs merge without a conflict (DR-1602)
// =============================================================================
// GitHub's PR merge runs no merge driver (tested 2026-11-19: `merge=union` on
// INDEX.md still conflicted, #2815), so two rows appended at the end of the live
// table always collide. scripts/index-row.mjs places a row at a slot read from
// its own id; business-systems-guard and the usage-ledger check refuse a new row
// or entry in the tail. Proven here with REAL git merges of the real INDEX.md
// and ledger, with no merge driver configured, which is what GitHub does.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { placeRow, tailFindings, liveTable, PLACED_FROM } from '../../../scripts/index-row.mjs';
import { TAIL_ROWS } from '../../../scripts/lib/decision-pointer.mjs';
import { placementIndex, tailEntryFindings, TAIL_GUARD } from '../../../scripts/ai-usage-ledger.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const INDEX = readFileSync(join(ROOT, 'docs/decisions/INDEX.md'), 'utf8');
const LEDGER = readFileSync(join(ROOT, 'app/src/lib/ai-usage-ledger.json'), 'utf8');
const row = (n) => `| [DR-${n}](DR-${n}-x.md) | **Row ${n}.** test | accepted | A | test | TEST |`;
const entry = (n) => ({ id: `t-${n}`, date: '2026-11-19', task: 't', drs: [`DR-${n}`], prs: [], model: 'unrecorded', tokens: null, costUsd: null, wallClockHours: 0, estimateWithoutAiHours: 0, notes: '' });

/** Append at the tail of the live table: what every branch did before. */
function appendRow(text, r) {
  const lines = text.split('\n');
  const [, last] = liveTable(lines);
  lines.splice(last + 1, 0, r);
  return lines.join('\n');
}
function placeEntry(raw, e) {
  const d = JSON.parse(raw);
  d.entries.splice(placementIndex(e.id, d.entries.length), 0, e);
  return JSON.stringify(d, null, 2) + '\n';
}
function appendEntry(raw, e) {
  const d = JSON.parse(raw);
  d.entries.push(e);
  return JSON.stringify(d, null, 2) + '\n';
}

/** Two branches off one base, each writing its files; returns whether `git merge` is clean. */
function mergesClean(sideA, sideB) {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' }).toString();
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 't');
  mkdirSync(join(dir, 'd'));
  writeFileSync(join(dir, 'd/INDEX.md'), INDEX);
  writeFileSync(join(dir, 'd/ledger.json'), LEDGER);
  git('add', '.');
  git('commit', '-qm', 'base');
  for (const [name, side] of [['a', sideA], ['b', sideB]]) {
    git('checkout', '-q', '-b', name, 'main');
    writeFileSync(join(dir, 'd/INDEX.md'), side.index);
    writeFileSync(join(dir, 'd/ledger.json'), side.ledger);
    git('commit', '-qam', name);
  }
  git('checkout', '-q', 'a');
  try {
    git('merge', '-q', '--no-edit', 'b');
  } catch {
    return { clean: false };
  }
  return { clean: true, index: readFileSync(join(dir, 'd/INDEX.md'), 'utf8'), ledger: readFileSync(join(dir, 'd/ledger.json'), 'utf8') };
}

describe('index-row places a row off the tail', () => {
  it('the row lands inside the live table, never in its last rows, at a slot read from its id', () => {
    const out = placeRow(INDEX, row(9602)).split('\n');
    const [first, last] = liveTable(out);
    const at = out.indexOf(row(9602));
    expect(at).toBeGreaterThanOrEqual(first);
    expect(at).toBeLessThan(last - TAIL_GUARD + 1);
    expect(placeRow(INDEX, row(9602))).toBe(placeRow(INDEX, row(9602)));
  });

  it('the INDEX tail and the ledger tail are the same length', () => {
    expect(TAIL_ROWS).toBe(TAIL_GUARD);
  });

  it('refuses a malformed row and a DR that already has one', () => {
    expect(() => placeRow(INDEX, 'not a row')).toThrow();
    expect(() => placeRow(INDEX, row(1595))).toThrow(/already has a row/);
  });

  it('the guard passes a placed row and names an appended one', () => {
    expect(tailFindings(placeRow(INDEX, row(1607)))).toEqual([]);
    expect(tailFindings(appendRow(INDEX, row(1607)))[0]).toMatch(/DR-1607/);
    expect(tailFindings(appendRow(INDEX, row(PLACED_FROM - 1)))).toEqual([]);
  });

  it('the ledger check names an entry appended at the tail and passes one placed by --add', () => {
    expect(tailEntryFindings(JSON.parse(appendEntry(LEDGER, entry(1607))))[0]).toMatch(/t-1607/);
    expect(tailEntryFindings(JSON.parse(placeEntry(LEDGER, entry(1607))))).toEqual([]);
  });
});

describe('a real git merge, no merge driver (what GitHub does)', () => {
  it('two decision branches that place their row and entry merge cleanly, and both rows survive', () => {
    const r = mergesClean(
      { index: placeRow(INDEX, row(9602)), ledger: placeEntry(LEDGER, entry(9602)) },
      { index: placeRow(INDEX, row(9603)), ledger: placeEntry(LEDGER, entry(9603)) }
    );
    expect(r.clean).toBe(true);
    expect(r.index).toContain(row(9602));
    expect(r.index).toContain(row(9603));
    const d = JSON.parse(r.ledger);
    expect(d.entries.map((e) => e.id)).toEqual(expect.arrayContaining(['t-9602', 't-9603']));
  });

  it('PROVEN TO CATCH: the old way, two rows and entries appended at the tail, conflicts', () => {
    const r = mergesClean(
      { index: appendRow(INDEX, row(9602)), ledger: appendEntry(LEDGER, entry(9602)) },
      { index: appendRow(INDEX, row(9603)), ledger: appendEntry(LEDGER, entry(9603)) }
    );
    expect(r.clean).toBe(false);
  });

  it('the slots of consecutive numbers are not adjacent across the next 200 records', () => {
    const rows = liveTable(INDEX.split('\n'));
    const n = rows[1] - rows[0] + 1;
    let adjacent = 0;
    for (let k = 1602; k < 1802; k++) if (Math.abs(placementIndex(`DR-${k}`, n) - placementIndex(`DR-${k + 1}`, n)) <= 1) adjacent++;
    expect(adjacent).toBeLessThanOrEqual(2);
  });
});
