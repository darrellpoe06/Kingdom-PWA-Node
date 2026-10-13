// @vitest-environment node
// =============================================================================
// rent-statement — the tenant's keepable record, proven (rentals build b3a)
// =============================================================================
// The statement FORMATS real rows and invents nothing: totals sum the real
// amounts, a month lists only the receipt events it actually has, and an empty
// ledger says so honestly (DR-0076/DR-0061). Deterministic — asOf is injected,
// never Date.now().
import { describe, it, expect } from 'vitest';
import { statementTotals, buildTenantStatement } from '../lib/rent-statement.js';

const ROWS = [
  { month: '2026-07', expected: 950, received: 600, status: 'partial', events: [
    { amount: 350, method: 'zelle', location: 'office', at: '2026-07-03T00:00:00Z' },
    { amount: 250, method: 'cash', location: 'in person', at: '2026-07-10T00:00:00Z' },
  ] },
  { month: '2026-06', expected: 950, received: 950, status: 'received', events: [
    { amount: 950, method: 'ach', location: '', at: '2026-06-01T00:00:00Z' },
  ] },
];

describe('statementTotals — summed from real amounts', () => {
  it('adds received/expected and derives the outstanding balance', () => {
    expect(statementTotals(ROWS)).toEqual({ received: 1550, expected: 1900, balance: 350 });
  });
  it('an empty statement is a clean zero', () => {
    expect(statementTotals([])).toEqual({ received: 0, expected: 0, balance: 0 });
  });
});

describe('buildTenantStatement — the handed-over record', () => {
  it('lists each month, each receipt event, and the totals with an outstanding balance', () => {
    const s = buildTenantStatement({ doorName: '805 N Prospect', tenantName: 'Alex', rows: ROWS, asOf: '2026-07-28' });
    expect(s).toContain('RENT PAYMENT STATEMENT');
    expect(s).toContain('Property: 805 N Prospect');
    expect(s).toContain('Tenant: Alex');
    expect(s).toContain('As of: 2026-07-28');
    expect(s).toContain('2026-07 — paid $600 of $950 (partial)');
    expect(s).toContain('$350 · Zelle · office · 2026-07-03');   // a receipt event, formatted
    expect(s).toContain('$950 · ACH/bank · 2026-06-01');          // no location → no empty dot pair
    expect(s).toContain('Total paid: $1,550 of $1,900 due');
    expect(s).toContain('Balance outstanding: $350');
    expect(s).toContain('no money moves');                        // the honest footer
  });
  it('reads "paid in full" when nothing is outstanding', () => {
    const paid = [{ month: '2026-06', expected: 950, received: 950, status: 'received', events: [] }];
    const s = buildTenantStatement({ doorName: 'D', rows: paid, asOf: '2026-07-01' });
    expect(s).toContain('Paid in full for the months shown.');
    expect(s).not.toContain('Balance outstanding');
  });
  it('an empty ledger says so — never a fabricated line', () => {
    const s = buildTenantStatement({ doorName: 'D', tenantName: 'T', rows: [], asOf: '2026-07-01' });
    expect(s).toContain('No payments recorded yet.');
    expect(s).not.toContain('Total paid');
  });
});
