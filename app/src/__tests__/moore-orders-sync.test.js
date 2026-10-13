// @vitest-environment node
// moore-orders-sync — pin the toRow/fromRow round-trip so an order survives the
// cloud loop byte-honest (DR-0076): stage, clock inputs, bulk lines, change
// orders, and the no-payment-data posture all hold without a live DB.
import { vi, describe, it, expect } from 'vitest';

// supabase is mocked so this is a pure unit test (no network, no env) — the
// mappers under test never touch the client; only the module import path does.
vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

import { toOrderRow, fromOrderRow } from '../lib/moore-orders-sync.js';
import { newOrder, recordPayment, appendChangeOrder } from '../lib/moore-divahs.js';

const NOW = '2026-07-07T12:00:00.000Z';
const CTX = { tenantId: 'inst-moore', userId: 'user-shay' };

describe('toOrderRow', () => {
  it('maps camelCase → snake_case with instance + creator pinned', () => {
    const o = newOrder({ customerName: 'Dana', channel: 'tiktok', productType: 'scrub-cap', quoteCents: 4500 }, { now: NOW });
    const row = toOrderRow(o, CTX);
    expect(row.instance_id).toBe('inst-moore');
    expect(row.created_by).toBe('user-shay');
    expect(row.slug).toBe(o.id);
    expect(row.customer_name).toBe('Dana');
    expect(row.channel).toBe('tiktok');
    expect(row.product_type).toBe('scrub-cap');
    expect(row.quote_cents).toBe(4500);
    expect(row.stage).toBe('inquiry');
  });
  it('never carries card/bank fields — the row shape has no payment columns', () => {
    const o = newOrder({ cardNumber: '4111-smuggled', cvv: '999', customerName: 'A' }, { now: NOW });
    const row = toOrderRow(o, CTX);
    expect(JSON.stringify(row)).not.toContain('4111');
    expect(row.cardNumber).toBeUndefined();
    expect(row.card_number).toBeUndefined();
  });
  it('normalizes junk stage/channel/type instead of uploading garbage', () => {
    const row = toOrderRow({ id: 'mo-x', stage: 'nope', channel: 'myspace', productType: 'rocket' }, CTX);
    expect(row.stage).toBe('inquiry');
    expect(row.channel).toBe('other');
    expect(row.product_type).toBe('other');
  });
});

describe('round-trip — an order survives the cloud loop', () => {
  it('paid order with bulk lines + a change order comes back whole', () => {
    let o = newOrder({
      customerName: 'Mia', channel: 'whats-going-on-qc', productType: 'bulk-apparel',
      quoteCents: 30000, materialsCents: 9000, delivery: 'pickup', policyAccepted: true,
      bulkLines: [{ qty: 6, cut: 'adult', size: 'M', color: 'blue', names: ['Alicia', 'Dawn'] }],
    }, { now: NOW });
    o = recordPayment(o, { method: 'apple-pay', now: NOW });
    o = appendChangeOrder(o, { band: 'in-production', shayPct: 60, acceptedByCustomer: true, now: NOW }).order;

    const back = fromOrderRow({ ...toOrderRow(o, CTX), id: 'uuid-1', created_at: o.createdAt, updated_at: o.updatedAt });
    expect(back.id).toBe(o.id);
    expect(back.stage).toBe('paid');
    expect(back.paidAt).toBe(o.paidAt);           // the 3-week clock input survives
    expect(back.payMethod).toBe('apple-pay');
    expect(back.delivery).toBe('pickup');
    expect(back.policyAccepted).toBe(true);
    expect(back.bulkLines).toEqual(o.bulkLines);
    expect(back.changeOrders.length).toBe(1);
    expect(back.changeOrders[0].feeCents).toBe(18000); // 60% of 30000 — the ladder survives
    expect(back.history.map((h) => h.stage)).toEqual(o.history.map((h) => h.stage));
    expect(back.remoteUuid).toBe('uuid-1');        // targets updates/deletes
  });
  it('a sparse legacy row hydrates to a safe canonical order', () => {
    const back = fromOrderRow({ id: 'uuid-2', slug: null, stage: 'quoted', customer_name: 'Old', created_at: NOW });
    expect(back.id).toBe('mo-remote-uuid-2');
    expect(back.stage).toBe('quoted');
    expect(back.bulkLines).toEqual([]);
    expect(back.changeOrders).toEqual([]);
    expect(back.quoteCents).toBe(0);
  });
});
