// @vitest-environment node
//
// Multi-select chips on Books -> Imported (DR-0713). Darrell 2026-09-30: "pick
// multiple options and they show below... together or separately... like
// mortgage and Mortgage 2111." Pinned here: OR within a row, AND across rows,
// Separately subtotals that add up to the Together total, the address-bar round
// trip, and a single pick that behaves exactly as the old one-chip filter did.
import { describe, it, expect } from 'vitest';
import { buildImportedView } from '../components/Imported.jsx';
import { externalTotals } from '../lib/internal-transfers.js';
import {
  togglePick, rowMatchesPicks, splitDimension, splitSections,
  picksFromSearch, searchWithPicks, initialPicks, saveStoredPicks, loadStoredPicks, PICKS_STORAGE_KEY,
} from '../lib/imported-multi-filter.js';

const NOW = Date.parse('2026-09-30T00:00:00Z');
const DATA = {
  accounts: [
    { id: 'a1', name: 'Chase 7206' },
    { id: 'a2', name: 'Chase 3322' },
  ],
  transactions: [
    { id: 'm1', accountId: 'a1', date: '2026-09-01', amount: -2623, description: 'WF HOME MTG', category: 'mortgage' },
    { id: 'm2', accountId: 'a2', date: '2026-09-02', amount: -811.5, description: 'WF MTG 2111', category: 'mortgage 2111' },
    { id: 'm3', accountId: 'a1', date: '2026-09-03', amount: -811.5, description: 'WF MTG 2111', category: 'mortgage 2111' },
    { id: 'g1', accountId: 'a1', date: '2026-09-04', amount: -120.25, description: 'KROGER', category: 'groceries' },
    { id: 'p1', accountId: 'a2', date: '2026-09-05', amount: 2400, description: 'PAYROLL', category: 'income' },
    { id: 'r1', accountId: 'a2', date: '2026-09-06', amount: 35.1, description: 'ESCROW REFUND', category: 'mortgage' },
  ],
};
const ids = (rows) => rows.map((r) => r.id).sort();

describe('chip picks: OR within a row, AND across rows', () => {
  it('two categories combine as OR (Mortgage OR Mortgage 2111)', () => {
    const v = buildImportedView(DATA, { categories: ['mortgage', 'mortgage 2111'] }, NOW);
    expect(ids(v.filtered)).toEqual(['m1', 'm2', 'm3', 'r1']);
  });

  it('accounts AND categories: only rows that match a picked account AND a picked category', () => {
    const v = buildImportedView(DATA, { institutions: ['Chase 7206'], categories: ['mortgage', 'mortgage 2111'] }, NOW);
    expect(ids(v.filtered)).toEqual(['m1', 'm3']);
  });

  it('two accounts combine as OR', () => {
    const v = buildImportedView(DATA, { institutions: ['Chase 7206', 'Chase 3322'] }, NOW);
    expect(v.filtered).toHaveLength(DATA.transactions.length);
  });

  it('an empty row means all (the "All" chip clears the row)', () => {
    expect(buildImportedView(DATA, { institutions: [], categories: [] }, NOW).filtered).toHaveLength(6);
    expect(rowMatchesPicks({ institution: 'x', category: 'y' }, {})).toBe(true);
  });

  it('tap adds, tap again removes', () => {
    let l = togglePick([], 'mortgage');
    l = togglePick(l, 'mortgage 2111');
    expect(l).toEqual(['mortgage', 'mortgage 2111']);
    expect(togglePick(l, 'mortgage')).toEqual(['mortgage 2111']);
  });

  it('a single pick behaves exactly as the old one-chip filter', () => {
    for (const [legacy, multi] of [
      [{ category: 'mortgage' }, { categories: ['mortgage'] }],
      [{ institution: 'Chase 3322' }, { institutions: ['Chase 3322'] }],
    ]) {
      expect(ids(buildImportedView(DATA, multi, NOW).filtered)).toEqual(ids(buildImportedView(DATA, legacy, NOW).filtered));
    }
    // and a single pick has nothing to separate
    expect(splitDimension({ categories: ['mortgage'] })).toBe(null);
  });
});

describe('Separately: one section per pick, adding up to Together', () => {
  it('the section subtotals sum to the Together total (in, out, net, count)', () => {
    const picks = { institutions: [], categories: ['mortgage', 'mortgage 2111', 'groceries'] };
    const rows = buildImportedView(DATA, picks, NOW).filtered;
    const together = externalTotals(rows, new Set());
    const sections = splitSections(rows, picks);
    expect(sections.map((s) => s.value)).toEqual(['mortgage', 'mortgage 2111', 'groceries']);
    const parts = sections.map((s) => externalTotals(s.rows, new Set()));
    const sum = (k) => parts.reduce((a, p) => a + p[k], 0);
    expect(sum('in')).toBeCloseTo(together.in, 2);
    expect(sum('out')).toBeCloseTo(together.out, 2);
    expect(sum('net')).toBeCloseTo(together.net, 2);
    expect(sections.reduce((a, s) => a + s.rows.length, 0)).toBe(rows.length);
  });

  it('splits by account when only the account row holds two or more picks', () => {
    const picks = { institutions: ['Chase 7206', 'Chase 3322'], categories: ['mortgage'] };
    expect(splitDimension(picks)).toBe('account');
    const rows = buildImportedView(DATA, picks, NOW).filtered;
    const sections = splitSections(rows, picks);
    expect(sections.map((s) => ids(s.rows))).toEqual([['m1'], ['r1']]);
  });

  it('PROVEN-TO-CATCH: a section rule that lets a row into two sections breaks the sum', () => {
    const picks = { categories: ['mortgage', 'mortgage 2111'] };
    const rows = buildImportedView(DATA, picks, NOW).filtered;
    const together = externalTotals(rows, new Set());
    // the broken rule: every section takes every row
    const broken = ['mortgage', 'mortgage 2111'].map(() => externalTotals(rows, new Set()));
    expect(broken.reduce((a, p) => a + p.out, 0)).not.toBeCloseTo(together.out, 2);
  });
});

describe('remember and share: the address bar and this device', () => {
  it('round-trips picks + layout through the query string, keeping other params', () => {
    const picks = { institutions: ['Chase 7206'], categories: ['mortgage', 'mortgage 2111'], layout: 'separate' };
    const qs = searchWithPicks('?view=books&sub=imported', picks);
    const sp = new URLSearchParams(qs);
    expect(sp.get('view')).toBe('books');
    expect(sp.get('sub')).toBe('imported');
    expect(picksFromSearch(qs)).toEqual(picks);
  });

  it('clearing every pick removes the params (a clean address)', () => {
    expect(searchWithPicks('?view=books&icat=mortgage&ilayout=separate', { institutions: [], categories: [], layout: 'together' })).toBe('?view=books');
    expect(picksFromSearch('?view=books')).toBe(null);
  });

  it('a shared link wins over this device; this device fills in when the link carries none', () => {
    const mem = new Map();
    const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
    saveStoredPicks({ institutions: [], categories: ['groceries'], layout: 'together' }, storage);
    expect(JSON.parse(mem.get(PICKS_STORAGE_KEY)).categories).toEqual(['groceries']);
    expect(loadStoredPicks(storage).categories).toEqual(['groceries']);
    expect(initialPicks('?icat=mortgage', storage).categories).toEqual(['mortgage']);
    expect(initialPicks('', storage).categories).toEqual(['groceries']);
    expect(initialPicks('', { getItem: () => { throw new Error('private mode'); } })).toEqual({ institutions: [], categories: [], layout: 'together' });
  });
});
