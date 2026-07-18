// @vitest-environment node
//
// statement-reconciliation — prove the stored ledger against the source file so a
// short month (June showed 166 of a real 323) is DIAGNOSED and repaired by adding
// only the missing rows, never a blind reset (Christina's books, 2026-07-18).
import { describe, it, expect } from 'vitest';
import { reconcileStatement, reconMonthLabel } from '../lib/statement-reconciliation.js';

// A statement file (source of truth) with a running balance on each row.
const fileRows = [
  { date: '2026-06-01', desc: 'ACH DEPOSIT PAYROLL', amount: 1000, balance: 1000 },
  { date: '2026-06-02', desc: 'COUNTY MARKET', amount: -50, balance: 950 },
  { date: '2026-06-02', desc: 'COUNTY MARKET', amount: -50, balance: 900 }, // genuine twin, different balance
  { date: '2026-06-15', desc: 'RENT', amount: -800, balance: 100 },
  { date: '2026-07-01', desc: 'ACH DEPOSIT PAYROLL', amount: 1000, balance: 1100 },
];

describe('reconcileStatement', () => {
  it('reports missing rows per month and hands back exactly the rows to add', () => {
    // The store has only 2 of June's 4 rows (residue of a collapsed import) and
    // none of July.
    const stored = [
      { id: 's1', accountId: 'acct1', date: '2026-06-01', description: 'ACH DEPOSIT PAYROLL', amount: 1000, balance: 1000 },
      { id: 's2', accountId: 'acct1', date: '2026-06-15', description: 'RENT', amount: -800, balance: 100 },
    ];
    const r = reconcileStatement(fileRows, stored, 'acct1');
    const june = r.byMonth.find((m) => m.month === '2026-06');
    const july = r.byMonth.find((m) => m.month === '2026-07');
    expect(june).toMatchObject({ stored: 2, inFile: 4, missing: 2, extra: 0 });
    expect(july).toMatchObject({ stored: 0, inFile: 1, missing: 1, extra: 0 });
    expect(r.totalMissing).toBe(3);
    // The two County Market twins (both missing) come back, ready to commit.
    expect(r.missingRows.filter((x) => x.desc === 'COUNTY MARKET')).toHaveLength(2);
    expect(r.missingRows.some((x) => x.desc === 'RENT')).toBe(false); // already stored
  });

  it('newest month first; a fully-reconciled month reports 0 missing', () => {
    const stored = fileRows.map((f, i) => ({
      id: 'k' + i, accountId: 'acct1', date: f.date, description: f.desc, amount: f.amount, balance: f.balance,
    }));
    const r = reconcileStatement(fileRows, stored, 'acct1');
    expect(r.byMonth[0].month).toBe('2026-07'); // newest first
    expect(r.totalMissing).toBe(0);
    expect(r.missingRows).toHaveLength(0);
  });

  it('flags EXTRA stored rows (possible double-count) that the file does not list', () => {
    const stored = [
      { id: 's1', accountId: 'acct1', date: '2026-06-01', description: 'ACH DEPOSIT PAYROLL', amount: 1000, balance: 1000 },
      { id: 's2', accountId: 'acct1', date: '2026-06-01', description: 'ACH DEPOSIT PAYROLL', amount: 1000, balance: 1000 }, // duplicate in store
    ];
    const r = reconcileStatement(fileRows, stored, 'acct1');
    const june = r.byMonth.find((m) => m.month === '2026-06');
    expect(june.stored).toBe(2);
    expect(june.extra).toBe(1); // one stored payroll row has no matching file row -> double-count residue
  });

  it('scopes strictly to the target account — another account never participates', () => {
    const stored = [
      { id: 'o1', accountId: 'OTHER', date: '2026-06-01', description: 'ACH DEPOSIT PAYROLL', amount: 1000, balance: 1000 },
    ];
    const r = reconcileStatement(fileRows, stored, 'acct1');
    expect(r.byMonth.find((m) => m.month === '2026-06').stored).toBe(0); // OTHER acct ignored
    expect(r.totalMissing).toBe(5); // every file row (4 June + 1 July) is missing from acct1
  });

  it('reconMonthLabel renders a friendly month', () => {
    expect(reconMonthLabel('2026-06')).toBe('June 2026');
    expect(reconMonthLabel('undated')).toBe('Undated');
  });
});
