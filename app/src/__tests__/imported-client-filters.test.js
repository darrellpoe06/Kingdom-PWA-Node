// @vitest-environment node
//
// buildImportedView — the deterministic core of Books → Imported after it was
// repointed off n8n to read the synced DB ledger (data.transactions/accounts).
// Proven-to-catch: account-name resolution, each filter clause, the 30-day
// in/out math, and graceful empty input. No network, no n8n.
import { describe, it, expect } from 'vitest';
import { buildImportedView } from '../components/Imported.jsx';

const NOW = Date.parse('2026-06-30T00:00:00Z');
const DATA = {
  accounts: [
    { id: 'a1', name: 'Chase 7206' },
    { id: 'a2', name: 'Chase 3322' },
  ],
  transactions: [
    { id: 't1', accountId: 'a1', date: '2026-06-20', amount: -50, description: 'County Market', category: 'groceries' },
    { id: 't2', accountId: 'a1', date: '2026-06-10', amount: 500, description: 'Payroll', category: 'income' },
    { id: 't3', accountId: 'a2', date: '2026-05-01', amount: -1200, description: 'Rent', category: 'housing' },
  ],
};

describe('buildImportedView', () => {
  it('resolves account names + maps rows', () => {
    const v = buildImportedView(DATA, {}, NOW);
    expect(v.total).toBe(3);
    expect(v.rows.find(r => r.id === 't1').institution).toBe('Chase 7206');
    expect(v.institutions).toEqual(['Chase 3322', 'Chase 7206']);
    expect(v.accountCount).toBe(2);
  });
  it('filters by institution', () => {
    expect(buildImportedView(DATA, { institution: 'Chase 7206' }, NOW).filtered.map(r => r.id)).toEqual(['t1', 't2']);
  });
  it('filters by since (inclusive)', () => {
    expect(buildImportedView(DATA, { since: '2026-06-01' }, NOW).filtered.map(r => r.id).sort()).toEqual(['t1', 't2']);
  });
  it('searches payee + category', () => {
    expect(buildImportedView(DATA, { search: 'rent' }, NOW).filtered.map(r => r.id)).toEqual(['t3']);
    expect(buildImportedView(DATA, { search: 'GROCER' }, NOW).filtered.map(r => r.id)).toEqual(['t1']);
  });
  it('computes 30-day in/out from posted rows (t3 is >30d out, excluded)', () => {
    const v = buildImportedView(DATA, {}, NOW);
    expect(v.recentIn).toBe(500);
    expect(v.recentOut).toBe(50);
    expect(v.recentCount).toBe(2);
  });
  it('reports the date span', () => {
    const v = buildImportedView(DATA, {}, NOW);
    expect(v.firstDate).toBe('2026-05-01');
    expect(v.lastDate).toBe('2026-06-20');
  });
  it('handles empty / missing data gracefully', () => {
    const v = buildImportedView({}, {}, NOW);
    expect(v.total).toBe(0);
    expect(v.filtered).toEqual([]);
    expect(v.institutions).toEqual([]);
    expect(v.recentIn).toBe(0);
  });
});
