// =============================================================================
// bill-classes — which repeating payments are bills, and the six groups a bill
// falls in (Phase 1.2, 2026-11-17). Pure. safe-to-spend.js re-exports these.
// =============================================================================
import { categorize } from './categorize.js';

// ORDINARY MERCHANT PURCHASES ARE NOT BILLS (Christina 2026-11-16: "Do not
// automatically turn repeated purchases at Circle K, Walmart, or other
// merchants into future contractual bills"; approved 2026-11-17: "Ordinary
// merchant purchases should count against spending budgets ... Actual
// recurring merchant subscriptions must still be recognized and verified").
// A repeating payee whose rows (or, with none categorized, whose name) read as
// fuel, groceries, dining or household shopping is left out of the bill
// projection; its spending stays in the measured everyday-spending budget
// (measuredEverydaySpending leaves out only payees counted as dated bills, so
// it is counted there exactly once). A subscription, utility, insurance or
// phone bill is still projected, labeled for verification.
export const MERCHANT_CATEGORIES = new Set(['groceries', 'fuel', 'dining', 'household']);
export const SUBSCRIPTION_CATEGORIES = new Set(['subscription']);
export function payeeCategory(label = '', rows = []) {
  const counts = new Map();
  for (const t of rows || []) {
    const c = String((t && t.category) || '');
    if (!c || c === 'other') continue;
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top) return top[0];
  return categorize(label).category;
}
export function isMerchantPurchase(label = '', rows = []) {
  return MERCHANT_CATEGORIES.has(payeeCategory(label, rows));
}

// The six groups a bill falls in (Christina 2026-11-16, Task 3). Past due wins
// over every other group; a payment with no due date on file is its own group.
export const BILL_CLASSES = ['confirmed', 'inferred-review', 'one-time', 'arrangement', 'past-due', 'due-date-needed'];
export const BILL_CLASS_LABEL = {
  confirmed: 'Confirmed recurring bills',
  'inferred-review': 'Guessed from past payments: needs review',
  'one-time': 'One-time obligations',
  arrangement: 'Creditor payment arrangements',
  'past-due': 'Past-due balances and missed payments',
  'due-date-needed': 'Due date needed (minimum reserved, no date on file)',
};
export function billClassOf(e) {
  if (!e) return 'confirmed';
  if (e.overdue || e.graceState || e.pastDuePart || e.obligationType === 'past-due') return 'past-due';
  if (e.dateUnknown) return 'due-date-needed';
  if (e.kind === 'inferred-bill') return e.obligationType === 'arrangement' ? 'arrangement' : 'inferred-review';
  if (e.obligationType === 'arrangement' || e.obligationType === 'settlement') return 'arrangement';
  if (e.obligationType === 'one-time' || e.kind === 'scheduled' || e.kind === 'tax' || e.kind === 'incident') return 'one-time';
  return 'confirmed';
}
