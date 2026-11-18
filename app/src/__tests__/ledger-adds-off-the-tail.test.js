// @vitest-environment node
// =============================================================================
// The ledger's --add places an entry off the tail (DR-1536)
// =============================================================================
// Appending every new entry at the tail of ai-usage-ledger.json made two open
// branches conflict there on every merge: each landing appends at the tail, so
// each waiting lesson PR had to merge main again and re-run its whole CI. On
// 2026-11-18 the queue only drained once each branch's entry was moved off the
// tail by hand. This pins the fix in the writer and proves, with git itself,
// that the old way conflicts and the new way merges.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { placementIndex, TAIL_GUARD } from '../../../scripts/ai-usage-ledger.mjs';

const entry = (id) => ({ id, date: '2026-11-18', task: `task ${id}`, drs: [], prs: [], model: 'm', notes: '' });
const ledgerText = (entries) => `${JSON.stringify({ schema: 1, entries }, null, 2)}\n`;
const base = Array.from({ length: 120 }, (_, i) => entry(`base-${i}`));
const insert = (entries, e, at) => [...entries.slice(0, at), e, ...entries.slice(at)];

/** Three-way merge with git, as a branch merging main would: true when git merges it without a conflict. */
function mergesCleanly(ours, theirs) {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-merge-'));
  const [o, b, t] = ['ours.json', 'base.json', 'theirs.json'].map((f) => join(dir, f));
  writeFileSync(o, ours);
  writeFileSync(b, ledgerText(base));
  writeFileSync(t, theirs);
  const r = spawnSync('git', ['merge-file', o, b, t]);
  return { clean: r.status === 0, merged: readFileSync(o, 'utf8') };
}

describe('where --add puts an entry', () => {
  it('never inside the last TAIL_GUARD entries once the ledger is longer than the guard', () => {
    for (const n of [41, 60, 120, 400]) {
      for (const id of ['sov84-the-body', 'pm19-proved', 'll317-who-judges', 'x', 'dr-1536']) {
        const at = placementIndex(id, n);
        expect(at).toBeGreaterThanOrEqual(0);
        expect(at).toBeLessThanOrEqual(n - TAIL_GUARD);
      }
    }
  });

  it('a short ledger still appends, and the same id always lands in the same slot', () => {
    expect(placementIndex('x', 10)).toBe(10);
    expect(placementIndex('sov88-every-man', 200)).toBe(placementIndex('sov88-every-man', 200));
  });
});

describe('PROVEN WITH GIT: the old tail append conflicts, the new placement merges', () => {
  const a = entry('sov85-and-it-fell-not');
  const b = entry('pm19-let-these-also-first-be-proved');

  it('two branches that each APPEND at the tail conflict (the defect this fixes)', () => {
    const { clean } = mergesCleanly(ledgerText([...base, a]), ledgerText([...base, b]));
    expect(clean).toBe(false);
  });

  it('the same two entries placed by placementIndex merge cleanly, and both survive', () => {
    const ia = placementIndex(a.id, base.length);
    const ib = placementIndex(b.id, base.length);
    expect(Math.abs(ia - ib)).toBeGreaterThan(1);
    const { clean, merged } = mergesCleanly(ledgerText(insert(base, a, ia)), ledgerText(insert(base, b, ib)));
    expect(clean).toBe(true);
    const ids = JSON.parse(merged).entries.map((e) => e.id);
    expect(ids).toContain(a.id);
    expect(ids).toContain(b.id);
    expect(ids).toHaveLength(base.length + 2);
  });

  it('a branch placed off the tail still merges after main appends at the tail', () => {
    const ia = placementIndex(a.id, base.length);
    const { clean } = mergesCleanly(ledgerText(insert(base, a, ia)), ledgerText([...base, entry('landed-on-main')]));
    expect(clean).toBe(true);
  });
});
