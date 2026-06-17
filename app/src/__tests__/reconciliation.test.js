// Reconciliation gate (migration 0036): a "matched to bank" claim is only
// trustworthy if the itemized invoices actually roll up to the single bank
// debit. These lock the invariant and — per the Verification Doctrine
// (DR-0076) — PROVE the gate catches a tampered figure rather than always
// passing. A green "✓ matched to bank" badge must mean the math reconciled.
import { describe, it, expect } from 'vitest';
import { isReconciled, reconciliationMismatch, ordersPaidTotal } from '../lib/reconciliation.js';

// Synthetic fixture — three invoices paid by one card debit. (Real family
// figures live only in the gitignored Studio seed, never in the public repo.)
const fixture = () => ({
  matched: true,
  matched_to: ['bank', 'email'],
  method: 'visa-debit',
  card_last4: '0000',
  total: 304.79,
  orders: [
    { order: 'A', patient: 'Member One', paid: 124.00, lines: ['exam'] },
    { order: 'B', patient: 'Member One', paid: 180.79, lines: ['frame', 'lenses'] },
  ],
});
// The matching ledger transaction is an EXPENSE — stored as a negative amount.
const DEBIT = -304.79;

describe('reconciliation invariant', () => {
  it('sums the patient-paid amounts across orders (cent-exact, no float drift)', () => {
    expect(ordersPaidTotal(fixture())).toBe(304.79);
    // 0.1 + 0.2 style drift must not leak in.
    const r = { orders: [{ paid: 0.1 }, { paid: 0.2 }] };
    expect(ordersPaidTotal(r)).toBe(0.3);
  });

  it('reconciles when orders sum === total === abs(debit)', () => {
    expect(isReconciled(fixture(), DEBIT)).toBe(true);
    expect(reconciliationMismatch(fixture(), DEBIT)).toBeNull();
  });

  it('compares against the ABSOLUTE debit, so the negative expense sign is fine', () => {
    expect(isReconciled(fixture(), -304.79)).toBe(true);
    expect(isReconciled(fixture(), 304.79)).toBe(true);
  });
});

describe('proven-to-catch — a wrong rollup must NOT read as matched', () => {
  it('catches a tampered order amount (parts no longer sum to the total)', () => {
    const bad = fixture();
    bad.orders[1].paid = 200.00; // was 180.79
    expect(isReconciled(bad, DEBIT)).toBe(false);
    expect(reconciliationMismatch(bad, DEBIT)).toMatch(/orders sum/);
  });

  it('catches a debit that disagrees with the reconciled total (triple-count guard)', () => {
    // e.g. the three invoices were each booked as their own debit by mistake.
    expect(isReconciled(fixture(), -914.37)).toBe(false);
    expect(reconciliationMismatch(fixture(), -914.37)).toMatch(/bank debit/);
  });

  it('refuses to call it matched when the flag is missing or there are no orders', () => {
    expect(isReconciled({ matched: false, total: 304.79, orders: fixture().orders }, DEBIT)).toBe(false);
    expect(isReconciled({ matched: true, total: 0, orders: [] }, 0)).toBe(false);
    expect(isReconciled(null, DEBIT)).toBe(false);
    expect(isReconciled(undefined, -1)).toBe(false);
  });
});
