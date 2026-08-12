// @vitest-environment node
// =============================================================================
// The detector must not INVENT subscriptions
// =============================================================================
// Darrell 2026-08-11, reading the Recurring payments KPI: "some of these charges
// like charge point didnt happen each month for the same amount... what is going
// on?" He was right, and the audit's "43 patterns · $6,555/cycle" was built on
// it.
//
// Three defects, each measured against the real algorithm before the fix:
//
//   1. AMOUNT_ABS_TOL was a flat $3, applied unconditionally. On a $5.95 median
//      that is +/-50%, so the 20% rule never ran for small charges and six
//      ChargePoint sessions from $4.50 to $7.40 all counted as "the same
//      amount" -> "every 2 weeks - $5.95".
//
//   2. The cadence was measured AFTER the amount filter, on the survivors only.
//      Nine coffee purchases every 14 days with alternating amounts lost the
//      four large ones, leaving five exactly 28 days apart -> "monthly $5.10",
//      a subscription that does not exist. The filter did not find a rhythm; it
//      manufactured one by deleting the evidence against it.
//
//   3. payeeKey kept three digit-stripped words, so 'CHASE CREDIT CRD AUTOPAY'
//      and 'CHASE CREDIT CRD EPAY' were one key with a blended amount.
//
// A detector that invents subscriptions is worse than none: it tells a family
// to cancel money they are not spending, and buries the bills that are real.
import { describe, it, expect } from 'vitest';
import { detectRecurring, payeeKey } from '../lib/recurring-payments.js';

const day = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const tx = (id, date, amount, description) => ({ id, date, amount, description });

describe('PROVEN-TO-CATCH: charges that are not subscriptions', () => {
  it('ChargePoint — irregular small EV sessions are NOT a recurring pattern', () => {
    const rows = [
      tx(1, '2026-01-05', -4.50, 'CHARGEPOINT INC'),
      tx(2, '2026-01-19', -7.20, 'CHARGEPOINT INC'),
      tx(3, '2026-02-04', -5.10, 'CHARGEPOINT INC'),
      tx(4, '2026-02-21', -6.80, 'CHARGEPOINT INC'),
      tx(5, '2026-03-06', -4.95, 'CHARGEPOINT INC'),
      tx(6, '2026-03-22', -7.40, 'CHARGEPOINT INC'),
    ];
    // Before the fix this returned "every 2 weeks - $5.95".
    expect(detectRecurring(rows, { nowMs: Date.parse('2026-04-01') })).toEqual([]);
  });

  it('THE MANUFACTURED CADENCE: alternating amounts every 14d is not "monthly"', () => {
    const start = Date.parse('2026-01-01');
    const amts = [5.00, 12.00, 5.10, 13.00, 4.90, 14.00, 5.05, 11.00, 5.00];
    const rows = amts.map((a, i) => tx(i, iso(start + i * 14 * day), -a, 'CORNER COFFEE SHOP'));
    // Before the fix: "monthly - $5.10", from survivors 28 days apart. There is
    // no monthly charge anywhere in this ledger.
    expect(detectRecurring(rows, { nowMs: Date.parse('2026-05-01') })).toEqual([]);
  });

  it('a grocery store with wildly varying spend stays spend', () => {
    const start = Date.parse('2026-01-01');
    const amts = [82.14, 31.09, 147.55, 64.20, 210.00, 45.75, 96.30];
    const rows = amts.map((a, i) => tx(i, iso(start + i * 30 * day), -a, 'KROGER 4412 SPRINGFIELD IL'));
    expect(detectRecurring(rows, { nowMs: Date.parse('2026-09-01') })).toEqual([]);
  });
});

describe('REAL bills still detect — the fix must not blind the report', () => {
  it('a fixed monthly subscription is found, at its real amount', () => {
    const start = Date.parse('2026-01-10');
    const rows = [0, 1, 2, 3, 4, 5].map((i) =>
      tx(i, iso(start + i * 30 * day), -15.99, 'NETFLIX.COM 866-579-7172 CA'));
    const [g] = detectRecurring(rows, { nowMs: Date.parse('2026-07-01') });
    expect(g).toBeTruthy();
    expect(g.amount).toBe(15.99);
    expect(g.cadenceLabel).toBe('monthly');
    expect(g.count).toBe(6);
  });

  it('a real bill that drifts a few cents and a few days still counts', () => {
    const start = Date.parse('2026-01-03');
    const amts = [128.40, 131.10, 129.75, 127.90, 130.55];
    const rows = amts.map((a, i) => tx(i, iso(start + i * 31 * day + (i % 2 ? day * 2 : 0)), -a, 'ILLINOIS-AMERICA PAYMENT PPD'));
    const [g] = detectRecurring(rows, { nowMs: Date.parse('2026-06-15') });
    expect(g, 'a real utility bill must survive the tightened tolerance').toBeTruthy();
    expect(g.cadenceLabel).toBe('monthly');
  });
});

describe('payeeKey separates payments the bank writes differently', () => {
  it('PROVEN-TO-CATCH: autopay and e-pay are no longer the same pattern', () => {
    const a = payeeKey('CHASE CREDIT CRD AUTOPAY 1234');
    const b = payeeKey('CHASE CREDIT CRD EPAY 9999');
    expect(a).not.toBe(b);          // both were "CHASE CREDIT CRD" before
  });

  it('but the same payee with different trailing ids still groups', () => {
    expect(payeeKey('NETFLIX.COM 866-579-7172 CA 07/13'))
      .toBe(payeeKey('NETFLIX.COM 866-579-7172 CA 08/13'));
  });
});
