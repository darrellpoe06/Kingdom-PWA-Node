// @vitest-environment node
// =============================================================================
// rent-portfolio-paid — this-month paid-vs-due across all doors (build step c)
// =============================================================================
// Proves the scalable rollup: ONE batched read for every lease's this-month
// row (not N), a door with a synced lease but NO row is DUE-but-unpaid (never
// invisible, never painted — DR-0061/DR-0076), and the portfolio totals +
// door counts are pure math over real amounts. All I/O via a fake client.
import { describe, it, expect } from 'vitest';
import { rollupPaid, loadPortfolioPaid } from '../lib/rent-portfolio-paid.js';
import { loadThisMonthPaidByLease } from '../lib/rent-payments.js';

// A fake client: each table resolves its query (a thenable) to scripted rows.
// Records the args the code filtered by, so we can assert ONE batched read.
function fakeClient(tables) {
  const seen = { rentPaymentsIn: null, rentPaymentsPeriod: null };
  return {
    seen,
    from(table) {
      const rows = tables[table] || [];
      const chain = {
        select() { return chain; },
        eq(col, val) { if (table === 'rent_payments' && col === 'period_month') seen.rentPaymentsPeriod = val; return chain; },
        in(col, vals) { if (table === 'rent_payments' && col === 'lease_id') seen.rentPaymentsIn = vals; return chain; },
        order() { return Promise.resolve({ data: rows, error: null }); },
        then(resolve) { resolve({ data: rows, error: null }); },
      };
      return chain;
    },
  };
}

describe('rollupPaid — pure totals + door counts over real amounts', () => {
  it('sums received/expected, derives percent, and counts paid/partial/unpaid doors', () => {
    const out = rollupPaid([
      { received: 950, expected: 950 }, // paid
      { received: 600, expected: 950 }, // partial
      { received: 0, expected: 800 },   // unpaid (due, nothing in)
    ]);
    expect(out.received).toBe(1550);
    expect(out.expected).toBe(2700);
    expect(out.percent).toBe(57); // 1550/2700
    expect(out.doors).toBe(3);
    expect(out.doorsPaid).toBe(1);
    expect(out.doorsPartial).toBe(1);
    expect(out.doorsUnpaid).toBe(1);
  });
  it('an empty portfolio is a clean zero, never NaN/Infinity', () => {
    const out = rollupPaid([]);
    expect(out).toMatchObject({ received: 0, expected: 0, percent: 0, doors: 0, doorsPaid: 0 });
  });
  it('a zero-due door never counts as paid (0/0 is not 100%)', () => {
    const out = rollupPaid([{ received: 0, expected: 0 }]);
    expect(out.doorsPaid).toBe(0);
    expect(out.doorsUnpaid).toBe(1);
  });
});

describe('loadThisMonthPaidByLease — ONE batched query for many leases', () => {
  it('maps each lease to its this-month paid state and filters by period', async () => {
    const client = fakeClient({
      rent_payments: [
        { lease_id: 'L1', expected_amount: 950, received_amount: 950, status: 'received' },
        { lease_id: 'L2', expected_amount: 800, received_amount: 300, status: 'partial' },
      ],
    });
    const map = await loadThisMonthPaidByLease(client, ['L1', 'L2', 'L3'], '2026-07');
    expect(client.seen.rentPaymentsIn).toEqual(['L1', 'L2', 'L3']); // one .in() over all ids
    expect(client.seen.rentPaymentsPeriod).toBe('2026-07-01');
    expect(map.L1).toMatchObject({ received: 950, expected: 950, percent: 100, status: 'received' });
    expect(map.L2.percent).toBe(38);
    expect(map.L3).toBeUndefined(); // no row → absent (caller falls back to due)
  });
  it('CATCHES empty inputs (no leases, no month) with an empty map', async () => {
    expect(await loadThisMonthPaidByLease(fakeClient({}), [], '2026-07')).toEqual({});
    expect(await loadThisMonthPaidByLease(fakeClient({}), ['L1'], 'nope')).toEqual({});
  });
});

describe('loadPortfolioPaid — the composed rollup, due-but-unpaid stays visible', () => {
  it('a door with a synced lease but no row is DUE-but-unpaid (not invisible)', async () => {
    const client = fakeClient({
      leases: [
        { id: 'L1', rental_id: 'door-a', monthly_rent: 950, lease_start: '2026-01-01', lease_end: '2026-12-31', status: 'active' },
        { id: 'L2', rental_id: 'door-b', monthly_rent: 800, lease_start: '2026-01-01', lease_end: '2026-12-31', status: 'active' },
      ],
      rent_payments: [
        { lease_id: 'L1', expected_amount: 950, received_amount: 950, status: 'received' },
        // L2 has NO row this month → due 800, received 0
      ],
    });
    const { byDoor, rollup } = await loadPortfolioPaid(client, 'inst-1', '2026-07');
    expect(byDoor['door-a']).toMatchObject({ leaseId: 'L1', received: 950, expected: 950, percent: 100, status: 'received' });
    expect(byDoor['door-b']).toMatchObject({ leaseId: 'L2', received: 0, expected: 800, percent: 0, status: 'pending' });
    expect(rollup).toMatchObject({ received: 950, expected: 1750, doors: 2, doorsPaid: 1, doorsUnpaid: 1 });
  });
  it('signed-out / no tenant yields an empty map and zeroed rollup', async () => {
    const out = await loadPortfolioPaid(null, null, '2026-07');
    expect(out.byDoor).toEqual({});
    expect(out.rollup.doors).toBe(0);
  });
});
