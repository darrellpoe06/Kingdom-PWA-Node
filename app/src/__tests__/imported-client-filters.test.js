// @vitest-environment node
//
// applyClientFilters — client-side equivalent of wf18's server-side filter, used
// when the Imported tab reads the deterministic full Python snapshot. Proven-to-
// catch: each clause narrows correctly, counts are preserved (cards show totals),
// and a non-transactions payload passes through untouched.
import { describe, it, expect } from 'vitest';
import { applyClientFilters } from '../components/Imported.jsx';

const SNAP = {
  counts: { total_bank: 3, total_gmail: 0 },
  transactions: [
    { id: '1', institution: 'Chase 7206', status: 'unexplained', posted: '2026-05-01', amount: -10 },
    { id: '2', institution: 'Chase 3322', status: 'verified', posted: '2026-05-20', amount: 50 },
    { id: '3', institution: 'Chase 7206', status: 'unexplained', posted: '2026-04-10', amount: -5 },
  ],
};

describe('applyClientFilters', () => {
  it('filters by institution', () => {
    expect(applyClientFilters(SNAP, { institution: 'Chase 7206' }).transactions.map(t => t.id)).toEqual(['1', '3']);
  });
  it('filters by status (all = pass-through)', () => {
    expect(applyClientFilters(SNAP, { status: 'verified' }).transactions.map(t => t.id)).toEqual(['2']);
    expect(applyClientFilters(SNAP, { status: 'all' }).transactions).toHaveLength(3);
  });
  it('filters by since (inclusive, lexical ISO)', () => {
    expect(applyClientFilters(SNAP, { since: '2026-05-01' }).transactions.map(t => t.id)).toEqual(['1', '2']);
  });
  it('combines clauses (AND)', () => {
    expect(applyClientFilters(SNAP, { institution: 'Chase 7206', since: '2026-05-01' }).transactions.map(t => t.id)).toEqual(['1']);
  });
  it('preserves the full counts (cards show totals, table narrows)', () => {
    const out = applyClientFilters(SNAP, { institution: 'Chase 3322' });
    expect(out.counts.total_bank).toBe(3);
    expect(out.transactions).toHaveLength(1);
  });
  it('passes through a payload with no transactions array', () => {
    expect(applyClientFilters({ foo: 1 }, { institution: 'x' })).toEqual({ foo: 1 });
    expect(applyClientFilters(null, {})).toBe(null);
  });
});
