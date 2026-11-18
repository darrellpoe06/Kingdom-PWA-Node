// =============================================================================
// reimbursements — money one entity paid for another, and the transfer that
// pays it back (Phase 1.4, 2026-11-17).
//
// Christina 2026-11-17, decision 5: check #9879 ($2,200.88) was written from
// Personal 7206 for Poe Properties, and Poe Properties 3322 sent $2,201.00 to
// 7206 to pay it back. Link them "with the $0.12 difference shown, never
// assumed away".
//
// What the books must say, and why:
//   · the check is Poe Properties' expense, counted ONCE (Personal paid it as a
//     favour, it is not Personal's spending);
//   · until it is paid back, Poe Properties OWES Personal $2,200.88 — an
//     account receivable on Personal's side (lib/obligations.js, the model the
//     household already uses for what is owed, with append-only settlements and
//     a derived status);
//   · the $2,201.00 transfer SETTLES that receivable. It is the family's own
//     money moving between its own entities: never income to Personal, never
//     spending by Poe Properties;
//   · the transfer is $0.12 more than the check. That is shown as a $0.12
//     credit owed back to Poe Properties (creditCents), never rounded into the
//     books.
// Cash is untouched: Personal's balance is whatever is in 7206, and Safe to
// Spend reads accounts, not receivables.
//
// Pure. Builds obligation-shaped objects; whether one is saved is the person's
// choice on a screen, never this module's.
// =============================================================================
import { toCents, money, settledCents, balanceCents, creditCents, obligationStatus, daysBetween } from './obligations.js';

const day = (t) => String((t && t.date) || '').slice(0, 10);

/**
 * The receivable a payment made for another entity creates.
 * payment: the transaction (negative amount) in the payer's account.
 * paidFor / paidBy: entity objects { id, name } (or ids).
 */
export function receivableFromPayment(payment, { paidFor, paidBy } = {}) {
  const cents = -toCents(payment && payment.amount);
  if (!payment || cents <= 0) return null;
  const forName = typeof paidFor === 'object' && paidFor ? paidFor.name || paidFor.id : paidFor;
  const byId = typeof paidBy === 'object' && paidBy ? paidBy.id : paidBy;
  return {
    direction: 'receivable',
    counterparty: forName || 'another entity',
    description: `Paid for ${forName || 'another entity'}: ${payment.description || 'payment'}`,
    amountCents: cents,
    terms: 'net-30', // the family's own entities: thirty days to pay each other back, then it reads past due
    issuedOn: day(payment),
    lifecycle: 'open',
    entitySlug: byId || null,
    externalRef: payment.description || null,
    paymentTransactionId: payment.id || null,
    settlements: [],
  };
}

/**
 * Deposits into the paying account that could be the pay-back, best first.
 * A candidate is money IN to the same account, on or after the payment, within
 * `withinDays`, within `toleranceCents` of what is still owed. One whose twin
 * (the same amount leaving an account of the entity that owes) is in the books
 * ranks first: that is the transfer seen from both sides.
 */
export function reimbursementCandidates(
  receivable,
  payment,
  transactions = [],
  accounts = [],
  { paidForEntityId = null, withinDays = 45, toleranceCents = 500 } = {}
) {
  if (!receivable || !payment) return [];
  const owed = balanceCents(receivable);
  const from = day(payment);
  const owingAccounts = new Set((accounts || []).filter((a) => a && paidForEntityId && a.entityId === paidForEntityId).map((a) => a.id));
  const out = [];
  for (const t of transactions || []) {
    if (!t || t.id === payment.id || t.accountId !== payment.accountId) continue;
    const cents = toCents(t.amount);
    if (cents <= 0) continue;
    const gap = daysBetween(from, day(t));
    if (gap === null || gap < 0 || gap > withinDays) continue;
    const diff = cents - owed;
    if (Math.abs(diff) > toleranceCents) continue;
    const twin = (transactions || []).find(
      (x) => x && owingAccounts.has(x.accountId) && toCents(x.amount) === -cents && Math.abs(daysBetween(day(x), day(t)) ?? 99) <= 3
    );
    out.push({ transaction: t, cents, differenceCents: diff, days: gap, twinId: twin ? twin.id : null });
  }
  return out.sort((a, b) => (b.twinId ? 1 : 0) - (a.twinId ? 1 : 0) || Math.abs(a.differenceCents) - Math.abs(b.differenceCents) || a.days - b.days);
}

/** The receivable with one more settlement: the deposit that paid it back. Append-only. */
export function settleWithDeposit(receivable, deposit) {
  if (!receivable || !deposit) return receivable;
  const cents = toCents(deposit.amount);
  if (cents <= 0) return receivable;
  if ((receivable.settlements || []).some((s) => s.transactionId && s.transactionId === deposit.id)) return receivable;
  return {
    ...receivable,
    settlements: [...(receivable.settlements || []), { amountCents: cents, paidOn: day(deposit), method: 'transfer', transactionId: deposit.id || null }],
  };
}

/** What a person reads: owed, paid back, still owed, any overpayment, and the status. */
export function reimbursementSummary(receivable, { today } = {}) {
  if (!receivable) return null;
  const owed = Math.round(Number(receivable.amountCents) || 0);
  const paid = settledCents(receivable);
  const balance = balanceCents(receivable);
  const credit = creditCents(receivable);
  const status = obligationStatus(receivable, { today });
  const line =
    status === 'paid'
      ? credit > 0
        ? `${receivable.counterparty} paid back ${money(paid)} for ${money(owed)}: ${money(credit)} more than owed, a credit to ${receivable.counterparty}.`
        : `${receivable.counterparty} paid back ${money(paid)} in full.`
      : `${receivable.counterparty} owes ${money(balance)} of ${money(owed)}.`;
  return { owedCents: owed, paidCents: paid, balanceCents: balance, creditCents: credit, differenceCents: paid - owed, status, line };
}

/**
 * The ids of rows that are a pay-back, so no total counts them as income: the
 * deposit is the family's own money coming home. A caller files them as
 * transfers (isTransferTxn reads the category).
 */
export function reimbursementDepositIds(receivables = []) {
  const ids = new Set();
  for (const r of receivables || []) for (const s of (r && r.settlements) || []) if (s && s.transactionId) ids.add(s.transactionId);
  return ids;
}
