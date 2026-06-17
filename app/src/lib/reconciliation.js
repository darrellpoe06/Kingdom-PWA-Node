// =============================================================================
// reconciliation — verify a transaction's bank-match attestation
// =============================================================================
// A single bank withdrawal can pay several merchant invoices. We record ONE
// ledger transaction for the debit and attach a `reconciliation` block holding
// the itemized invoices that rolled up into it plus the bank/receipt evidence
// (see migration 0036). These pure helpers enforce the one invariant that makes
// a "matched to bank" claim trustworthy rather than decorative:
//
//   when matched: sum(orders[].paid) === total === abs(transaction.amount)
//
// The Books Tx row only paints "✓ matched to bank" when this holds, and the
// proven-to-catch test (reconciliation.test.js) tampers a figure to confirm the
// check FAILS — a green badge always means the math reconciled (DR-0076).
//
// Money is compared in integer cents so floating-point drift (0.1 + 0.2) can
// never flip a verdict.

const cents = (n) => Math.round((Number(n) || 0) * 100);

// Sum of what the patient/payer actually paid across every itemized order.
export function ordersPaidTotal(reconciliation) {
  const orders = (reconciliation && Array.isArray(reconciliation.orders)) ? reconciliation.orders : [];
  return orders.reduce((s, o) => s + cents(o && o.paid), 0) / 100;
}

// Returns a human-readable reason the reconciliation does NOT hold, or null when
// it fully reconciles. Used by both the gate test and (via isReconciled) the UI.
//   amount = the ledger transaction amount (expenses are negative; we compare
//            against its absolute value since `total`/`paid` are positive).
export function reconciliationMismatch(reconciliation, amount) {
  if (!reconciliation || typeof reconciliation !== 'object') return 'no reconciliation block';
  if (reconciliation.matched !== true) return 'not flagged matched';
  const orders = Array.isArray(reconciliation.orders) ? reconciliation.orders : [];
  if (orders.length === 0) return 'no itemized orders';

  const paidCents = orders.reduce((s, o) => s + cents(o && o.paid), 0);
  const totalCents = cents(reconciliation.total);
  const debitCents = Math.abs(cents(amount));

  if (paidCents !== totalCents) {
    return `orders sum (${(paidCents / 100).toFixed(2)}) != stated total (${(totalCents / 100).toFixed(2)})`;
  }
  if (totalCents !== debitCents) {
    return `stated total (${(totalCents / 100).toFixed(2)}) != bank debit (${(debitCents / 100).toFixed(2)})`;
  }
  return null;
}

// True only when the attestation is present, flagged matched, and the invoices
// roll up exactly to the single bank debit. This is the value the UI trusts.
export function isReconciled(reconciliation, amount) {
  return reconciliationMismatch(reconciliation, amount) === null;
}
