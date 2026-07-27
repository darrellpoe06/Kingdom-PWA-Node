// @vitest-environment node
// =============================================================================
// rent-payments — paid-vs-due per door-month, proven (rentals build step b)
// =============================================================================
// The ledger rules under test: partial payments ACCUMULATE into ONE row per
// month with a receipt event per entry (DR-0090); status and the 0→100% are
// DERIVED from real amounts only (DR-0061); bad input is refused with a named
// reason, never coerced (DR-0076). All I/O through a scriptable fake client.
import { describe, it, expect } from 'vitest';
import {
  periodMonthOf, statusFor, paidPercent, receiptEvent, recordRentPayment, loadRentPayments,
} from '../lib/rent-payments.js';

const IDS = { tenantId: 'inst-1', userId: 'user-1', leaseId: 'L1' };

function fakeClient(script) {
  const calls = [];
  return {
    calls,
    from(table) {
      const t = script[table] || {};
      const q = { _op: null };
      const runSelect = () => (t.select ? t.select(q) : { data: [], error: null });
      const chain = {
        select(cols) { if (!q._op) { q._op = 'select'; return chain; } q._returning = cols; return chain; },
        insert(payload) { q._op = 'insert'; calls.push({ table, op: 'insert', payload }); return chain; },
        update(payload) { q._op = 'update'; calls.push({ table, op: 'update', payload }); return chain; },
        eq() { return chain; },
        order() { return Promise.resolve(runSelect()); },
        limit() { return Promise.resolve(runSelect()); },
        single() { return Promise.resolve(t.insert ? t.insert(q) : { data: null, error: { m: 'no handler' } }); },
        then(resolve) { resolve(q._op === 'select' ? runSelect() : (t.update ? t.update(q) : { data: null, error: null })); },
      };
      return chain;
    },
  };
}

describe('the pure derivations', () => {
  it('periodMonthOf normalizes to the first of the month; refuses junk', () => {
    expect(periodMonthOf('2026-07')).toBe('2026-07-01');
    expect(periodMonthOf('2026-07-19')).toBe('2026-07-01');
    expect(periodMonthOf('July')).toBeNull();
  });
  it('status and percent are derived, clamped, never hand-picked', () => {
    expect(statusFor(0, 950)).toBe('pending');
    expect(statusFor(600, 950)).toBe('partial');
    expect(statusFor(950, 950)).toBe('received');
    expect(statusFor(1000, 950)).toBe('received');
    expect(paidPercent(0, 950)).toBe(0);
    expect(paidPercent(600, 950)).toBe(63);
    expect(paidPercent(1000, 950)).toBe(100); // clamped
    expect(paidPercent(500, 0)).toBe(0);      // no due amount → honest 0, not Infinity
  });
  it('a receipt event carries amount, method, WHERE paid, and who entered (DR-0090)', () => {
    const e = receiptEvent({ amount: 600, method: 'cashapp', location: 'office dropbox', userId: 'user-1', at: 'T' });
    expect(e).toMatchObject({ kind: 'payment', at: 'T', amount: 600, method: 'cashapp', location: 'office dropbox', by: 'user-1' });
  });
});

describe('recordRentPayment — one honest row per month', () => {
  it('first payment INSERTS the month row as partial with its receipt event', async () => {
    const c = fakeClient({ rent_payments: { select: () => ({ data: [], error: null }), insert: () => ({ data: { id: 'P1' }, error: null }) } });
    const res = await recordRentPayment(c, { ...IDS, month: '2026-07', expectedAmount: 950, amount: 600, method: 'zelle', location: 'front office' });
    expect(res).toMatchObject({ ok: true, action: 'insert', received: 600, status: 'partial', percent: 63 });
    const ins = c.calls.find((x) => x.op === 'insert');
    expect(ins.payload.period_month).toBe('2026-07-01');
    expect(ins.payload.lifecycle.log[0]).toMatchObject({ amount: 600, method: 'zelle', location: 'front office', by: 'user-1' });
  });

  it('a second partial ACCUMULATES into the same row and completes the month at 100%', async () => {
    const c = fakeClient({
      rent_payments: {
        select: () => ({ data: [{ id: 'P1', received_amount: 600, expected_amount: 950, lifecycle: { log: [{ kind: 'payment', amount: 600 }] } }], error: null }),
        update: () => ({ data: null, error: null }),
      },
    });
    const res = await recordRentPayment(c, { ...IDS, month: '2026-07-19', expectedAmount: 950, amount: 350, method: 'cash', location: 'in person' });
    expect(res).toMatchObject({ ok: true, action: 'update', received: 950, status: 'received', percent: 100 });
    const upd = c.calls.find((x) => x.op === 'update');
    expect(upd.payload.received_amount).toBe(950);
    expect(upd.payload.lifecycle.log).toHaveLength(2); // both partial receipts kept
    expect(upd.payload.lifecycle.log[1]).toMatchObject({ amount: 350, method: 'cash', location: 'in person' });
  });

  it('refuses with named reasons — bad amount, bad month, no lease, signed out — and never throws', async () => {
    const c = fakeClient({});
    expect(await recordRentPayment(c, { ...IDS, month: '2026-07', amount: 0 })).toMatchObject({ action: 'refused', reason: 'bad-amount' });
    expect(await recordRentPayment(c, { ...IDS, month: '2026-07', amount: -50 })).toMatchObject({ action: 'refused', reason: 'bad-amount' });
    expect(await recordRentPayment(c, { ...IDS, month: 'nope', amount: 100 })).toMatchObject({ action: 'refused', reason: 'bad-month' });
    expect(await recordRentPayment(c, { ...IDS, leaseId: null, month: '2026-07', amount: 100 })).toMatchObject({ action: 'refused', reason: 'no-lease' });
    expect(await recordRentPayment(c, { tenantId: null, userId: null, leaseId: 'L1', month: '2026-07', amount: 100 })).toMatchObject({ action: 'refused', reason: 'signed-out' });
  });
});

describe('loadRentPayments — the ledger both sides read (owner now, tenant in b3)', () => {
  it('maps rows to months with derived percent and only real receipt events', async () => {
    const c = fakeClient({
      rent_payments: {
        select: () => ({
          data: [{
            id: 'P1', period_month: '2026-07-01', expected_amount: '950.00', received_amount: '600.00',
            received_at: 'T1', method: 'zelle', status: 'partial',
            lifecycle: { log: [{ kind: 'payment', amount: 600 }, { kind: 'other' }] }, notes: '',
          }],
          error: null,
        }),
      },
    });
    const rows = await loadRentPayments(c, 'L1');
    expect(rows[0]).toMatchObject({ month: '2026-07', expected: 950, received: 600, percent: 63, status: 'partial' });
    expect(rows[0].events).toHaveLength(1); // only payment receipts, honestly filtered
  });
});
