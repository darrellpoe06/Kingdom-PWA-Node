// =============================================================================
// payments-ledger tests — the money math proven BEFORE any processor key
// exists (DR-0230 / DR-0225: safeguards designed in; DR-0076: test-mode
// proven before live). Every dollar figure below is integer-cents math.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { PRODUCT_ENTITY, normalizePayment, toBooksTransaction, yearSummary } from '../lib/payments-ledger.js';

const checkoutEvt = (over = {}, objOver = {}) => ({
  id: 'evt_1',
  created: 1784592000, // 2026-07-21T00:00:00Z
  data: {
    object: {
      id: 'cs_test_1',
      payment_intent: 'pi_abc',
      payment_status: 'paid',
      amount_total: 12500,
      currency: 'usd',
      metadata: { product: 'poetech-plus' },
      customer_details: { email: 'payer@example.com' },
      ...objOver,
    },
  },
  ...over,
});

describe('PRODUCT_ENTITY — one source of entity truth', () => {
  it('maps every family entity: personal, moore, tlc', () => {
    expect(PRODUCT_ENTITY['poetech-plus']).toBe('e-personal');
    expect(PRODUCT_ENTITY['moore-order']).toBe('e-moore');
    expect(PRODUCT_ENTITY['tlc-session']).toBe('e-tlc');
  });
  it('is frozen — the map cannot drift at runtime', () => {
    expect(Object.isFrozen(PRODUCT_ENTITY)).toBe(true);
  });
});

describe('normalizePayment — Stripe event → ledger row', () => {
  it('normalizes a settled checkout session with idempotency + fee split', () => {
    const row = normalizePayment(checkoutEvt(), { feeCents: 393 });
    expect(row.provider).toBe('stripe');
    expect(row.providerEventId).toBe('evt_1'); // idempotency key
    expect(row.providerPaymentId).toBe('pi_abc');
    expect(row.status).toBe('settled');
    expect(row.amountCents).toBe(12500);
    expect(row.feeCents).toBe(393);
    expect(row.netCents).toBe(12107);
    expect(row.currency).toBe('usd');
    expect(row.productKey).toBe('poetech-plus');
    expect(row.entityId).toBe('e-personal');
    expect(row.payerEmail).toBe('payer@example.com');
    expect(row.occurredAtIso).toBe('2026-07-21T00:00:00.000Z');
  });

  it('marks an unpaid session pending — never settled by assumption', () => {
    const row = normalizePayment(checkoutEvt({}, { payment_status: 'unpaid' }));
    expect(row.status).toBe('pending');
  });

  it('handles payment_intent.succeeded shape (amount + status: succeeded)', () => {
    const row = normalizePayment({
      id: 'evt_pi',
      created: 1784592000,
      data: { object: { id: 'pi_xyz', status: 'succeeded', amount: 5000, currency: 'usd', receipt_email: 'r@example.com' } },
    }, { product: 'tlc-session' });
    expect(row.status).toBe('settled');
    expect(row.providerPaymentId).toBe('pi_xyz');
    expect(row.amountCents).toBe(5000);
    expect(row.productKey).toBe('tlc-session');
    expect(row.entityId).toBe('e-tlc');
    expect(row.payerEmail).toBe('r@example.com');
  });

  it('lands an unknown product honestly in unassigned — never guessed (DR-0076)', () => {
    const row = normalizePayment(checkoutEvt({}, { metadata: { product: 'mystery-thing' } }));
    expect(row.productKey).toBe('mystery-thing');
    expect(row.entityId).toBe('unassigned');
  });

  it('never throws on an empty or malformed event; nothing is invented', () => {
    const row = normalizePayment({}, {});
    expect(row.providerEventId).toBeNull();
    expect(row.providerPaymentId).toBeNull();
    expect(row.status).toBe('pending');
    expect(row.amountCents).toBe(0);
    expect(row.productKey).toBeNull();
    expect(row.entityId).toBe('unassigned');
    expect(row.payerEmail).toBeNull();
    expect(row.occurredAtIso).toBeNull();
  });
});

describe('toBooksTransaction — settled money paints the books, pending never does', () => {
  const settled = () => normalizePayment(checkoutEvt(), { feeCents: 393 });

  it('produces the gross income row + the fee expense row, reconciled', () => {
    const txns = toBooksTransaction(settled());
    expect(txns).toHaveLength(2);
    const [income, fee] = txns;
    expect(income.id).toBe('pay-pi_abc');
    expect(income.entityId).toBe('e-personal');
    expect(income.date).toBe('2026-07-21');
    expect(income.amount).toBe(125);
    expect(income.category).toBe('income');
    expect(income.source).toBe('payments-ledger');
    expect(fee.id).toBe('payfee-pi_abc');
    expect(fee.amount).toBe(-3.93);
    expect(fee.category).toBe('fees');
    // gross + fee = net, to the cent
    expect(Math.round((income.amount + fee.amount) * 100)).toBe(12107);
  });

  it('returns [] for pending — pending money never paints the books (DR-0061)', () => {
    const row = { ...settled(), status: 'pending' };
    expect(toBooksTransaction(row)).toEqual([]);
  });

  it('returns [] for a zero-amount or missing row', () => {
    expect(toBooksTransaction(null)).toEqual([]);
    expect(toBooksTransaction({ ...settled(), amountCents: 0 })).toEqual([]);
  });

  it('omits the fee row when there is no fee', () => {
    const txns = toBooksTransaction({ ...settled(), feeCents: 0 });
    expect(txns).toHaveLength(1);
    expect(txns[0].category).toBe('income');
  });
});

describe('yearSummary — the accountant\'s year-at-a-glance, per entity', () => {
  const rows = [
    normalizePayment(checkoutEvt(), { feeCents: 393 }),                                          // e-personal 2026
    normalizePayment(checkoutEvt({ id: 'evt_2' }, { payment_intent: 'pi_2', amount_total: 4400, metadata: { product: 'moore-order' } }), { feeCents: 158 }), // e-moore 2026
    normalizePayment(checkoutEvt({ id: 'evt_3' }, { payment_status: 'unpaid' })),                // pending — excluded
    normalizePayment(checkoutEvt({ id: 'evt_4', created: 1753056000 }), { feeCents: 100 }),      // 2025 — excluded from 2026
  ];

  it('folds settled rows per entity: gross / fees / net / count', () => {
    const s = yearSummary(rows, 2026);
    expect(s['e-personal']).toEqual({ grossCents: 12500, feeCents: 393, netCents: 12107, count: 1 });
    expect(s['e-moore']).toEqual({ grossCents: 4400, feeCents: 158, netCents: 4242, count: 1 });
    expect(s['e-tlc']).toBeUndefined();
  });

  it('excludes pending rows and other years — settled truth only', () => {
    const s2025 = yearSummary(rows, 2025);
    expect(s2025['e-personal'].count).toBe(1);
    expect(s2025['e-personal'].grossCents).toBe(12500);
    const s2026 = yearSummary(rows, 2026);
    const total = Object.values(s2026).reduce((n, e) => n + e.count, 0);
    expect(total).toBe(2); // the pending row and the 2025 row never count in 2026
  });

  it('returns an empty object for no rows', () => {
    expect(yearSummary([], 2026)).toEqual({});
    expect(yearSummary(undefined, 2026)).toEqual({});
  });
});
