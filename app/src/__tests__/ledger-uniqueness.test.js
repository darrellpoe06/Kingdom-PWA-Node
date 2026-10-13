// =============================================================================
// Ledger-uniqueness guard — a decision or migration NUMBER is used exactly once
// =============================================================================
// 2026-07-30 comprehensive-review incident class: three DR numbers were used
// twice (DR-0086, DR-0111, DR-0186), and app/vite.config.js keys the in-app
// Decisions ledger byNum — so the alphabetically-later file silently OVERWROTE
// the earlier one. DR-0111 "Do the work — don't re-ask" (a Layer 0 rule with a
// live enforcement hook) was invisible in the app's own ledger. The three were
// renumbered to DR-0251–0253 the same day; this guard makes the class
// structurally impossible (gate-the-class, DR-0239).
//
// Migrations carry the same disease: 12 number prefixes are duplicated in
// infra/supabase/migrations-auto/, two of them on grant-restoration files where
// apply order between the pair is filesystem sort, not intent. Those files are
// ALREADY APPLIED against the production database and the _schema_migrations
// ledger records them BY FILENAME — renaming an applied migration would
// re-apply it against prod, so the existing 12 are GRANDFATHERED as a frozen
// baseline (characterize-before-change, DR-0076 §5) and any NEW duplicate
// fails red. Shrinking the baseline is welcome; growing it is not possible
// without failing this test.
//
// PROVEN-TO-CATCH (DR-0076 §3): the dup-finder is unit-tested on a synthetic
// collision below — the guard can demonstrably fail.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repo = (rel) => fileURLToPath(new URL('../../../' + rel, import.meta.url));

export function duplicateNumbers(filenames, prefixRe) {
  const seen = new Map();
  for (const f of filenames) {
    const m = f.match(prefixRe);
    if (!m) continue;
    const num = m[1];
    if (!seen.has(num)) seen.set(num, []);
    seen.get(num).push(f);
  }
  return [...seen.entries()].filter(([, files]) => files.length > 1);
}

// Frozen 2026-07-30. Applied-to-prod filenames must not be renamed (the
// _schema_migrations ledger records by filename); shrink-only.
const GRANDFATHERED_MIGRATION_DUPES = new Set([
  '0019', '0022', '0024', '0036', '0037', '0042', '0043', '0045', '0052', '0055', '0056', '0100',
]);

describe('ledger uniqueness — numbers are used exactly once', () => {
  it('the dup-finder itself catches a collision (non-vacuous)', () => {
    const dupes = duplicateNumbers(
      ['DR-0001-a.md', 'DR-0001-b.md', 'DR-0002-c.md'],
      /^DR-(\d{4})-/
    );
    expect(dupes.length).toBe(1);
    expect(dupes[0][0]).toBe('0001');
  });

  it('every DR number is used exactly once', () => {
    const files = readdirSync(repo('docs/decisions')).filter((f) => /^DR-\d{4}-/.test(f));
    expect(files.length).toBeGreaterThan(200); // the guard must actually see the ledger
    const dupes = duplicateNumbers(files, /^DR-(\d{4})-/);
    expect(
      dupes.map(([num, fs]) => `DR-${num}: ${fs.join(' vs ')}`),
      'duplicate DR numbers — the in-app ledger (vite byNum) silently drops one of each pair; renumber the newer file (DR-0052 convention, next free ID from INDEX.md)'
    ).toEqual([]);
  });

  it('no NEW duplicate migration numbers (12 pre-2026-07-30 pairs grandfathered, shrink-only)', () => {
    const files = readdirSync(repo('infra/supabase/migrations-auto')).filter((f) => f.endsWith('.sql'));
    expect(files.length).toBeGreaterThan(100); // the guard must actually see the migrations
    const dupes = duplicateNumbers(files, /^(\d{4})/);
    const fresh = dupes.filter(([num]) => !GRANDFATHERED_MIGRATION_DUPES.has(num));
    expect(
      fresh.map(([num, fs]) => `${num}: ${fs.join(' vs ')}`),
      'NEW duplicate migration number — apply order between same-number files is filesystem sort, not intent; take the next free number'
    ).toEqual([]);
    // Shrink-only: if a grandfathered pair was cleaned up (through the governed
    // prod-safe path), remove its number from the baseline so it cannot return.
    const present = new Set(dupes.map(([num]) => num));
    for (const num of GRANDFATHERED_MIGRATION_DUPES) {
      expect(present.has(num), `grandfathered migration dupe ${num} no longer exists — remove it from GRANDFATHERED_MIGRATION_DUPES so it cannot come back`).toBe(true);
    }
  });
});
