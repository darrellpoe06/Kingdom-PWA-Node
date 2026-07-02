// @vitest-environment node
//
// sortRows — the Imported table's column sort (date/account/payee/category/
// amount). Proven-to-catch: each key sorts asc + desc, it is stable on ties, and
// undated rows sink regardless of direction.
import { describe, it, expect } from 'vitest';
import { sortRows } from '../lib/imported-view.js';

const R = [
  { id: '1', posted: '2026-05-01', institution: 'Chase 7206', name: 'County Market', category: 'groceries', amount: -50 },
  { id: '2', posted: '2026-05-20', institution: 'Savings 3322', name: 'Payroll', category: 'salary', amount: 500 },
  { id: '3', posted: '2026-04-10', institution: 'Chase 7206', name: 'AutoZone', category: 'vehicle', amount: -1200 },
];

describe('sortRows', () => {
  it('by date desc / asc', () => {
    expect(sortRows(R, 'date', 'desc').map((r) => r.id)).toEqual(['2', '1', '3']);
    expect(sortRows(R, 'date', 'asc').map((r) => r.id)).toEqual(['3', '1', '2']);
  });
  it('by amount asc puts the biggest debit first', () => {
    expect(sortRows(R, 'amount', 'asc')[0].id).toBe('3'); // -1200
    expect(sortRows(R, 'amount', 'desc')[0].id).toBe('2'); // +500
  });
  it('by payee + category + account (alphabetical)', () => {
    expect(sortRows(R, 'payee', 'asc')[0].name).toBe('AutoZone');
    expect(sortRows(R, 'category', 'asc')[0].category).toBe('groceries');
    expect(sortRows(R, 'account', 'asc')[0].institution).toBe('Chase 7206');
  });
  it('is stable on ties', () => {
    const ties = [{ id: 'a', category: 'x', posted: '2026-01-01' }, { id: 'b', category: 'x', posted: '2026-01-01' }];
    expect(sortRows(ties, 'category', 'asc').map((r) => r.id)).toEqual(['a', 'b']);
  });
  it('undated rows sink in both directions', () => {
    const mixed = [{ id: 'n', name: 'no date' }, { id: 'd', posted: '2026-05-01', name: 'dated' }];
    expect(sortRows(mixed, 'date', 'asc').map((r) => r.id)).toEqual(['d', 'n']);
    expect(sortRows(mixed, 'date', 'desc').map((r) => r.id)).toEqual(['d', 'n']);
  });
});
