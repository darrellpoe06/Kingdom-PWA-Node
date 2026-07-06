// =============================================================================
// child-books-view — what a child sees when a guardian grants "See family finances"
// =============================================================================
// The pure, deterministic core of the DR-0094 child money view, in the posture
// DR-0112 makes binding: a father PROVOKES TO GOOD WORKS, not to wrath. So this
// module never produces a shame/deficit framing of the family's money — it shapes
// the REAL books into a view that stirs a child toward good works (giving and
// saving foregrounded as the good to imitate), read-only, opening toward prayer.
//
// TWO MODES, the guardian's per-child choice (Darrell 2026-07-06, "both, per
// child"):
//   • 'teaching' — the same REAL numbers, arranged as the stewardship flow a
//     child can follow: income → GIVING → SAVING → spending, with giving + saving
//     lifted up as "good works." The teaching-first default.
//   • 'raw'      — the real accounts + balances + the month's flow, read-only,
//     for an older/ready heir the guardian wants to see the books as they are.
//
// GROUNDED, NEVER PAINTED (DR-0076): every number is DERIVED from the family's
// real data via the same financial-engineering functions the rest of the app
// uses (deriveMonthlyFlows, deriveAccountBalances) — change a real record and
// this view moves. Nothing here is hardcoded.
//
// READ-ONLY BY CONSTRUCTION: this module returns a view-model only. It exposes no
// mutator and touches no capability the child does not have — seeing is not
// spending (the acting locks live in relationships.js / RLS, untouched here).
//
// PURE: no React, no I/O, no Supabase — importable by the guardian-side preview,
// by the child view once the child session exists (DR-0093), and by vitest.
// =============================================================================

import { deriveMonthlyFlows, deriveAccountBalances } from './financial-engineering.js';

export const CHILD_VIEW_MODES = Object.freeze(['teaching', 'raw']);
export const DEFAULT_CHILD_VIEW_MODE = 'teaching';

export function normalizeChildViewMode(mode) {
  return CHILD_VIEW_MODES.includes(mode) ? mode : DEFAULT_CHILD_VIEW_MODE;
}

const round2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

// Real monthly giving (the tithe + charitable giving bucket) from the outflows.
function monthlyGiving(data) {
  return round2(num(data?.outflows?.charitableGiving));
}

// Real savings on hand = cleared balances of the savings-type accounts (never
// the credit/loan debts, never inLegal accounts). Derived from the real ledger.
function savingsOnHand(data, asOf) {
  const balances = deriveAccountBalances(data, asOf);
  const savingsAccounts = (data?.accounts || []).filter((a) => a && a.type === 'savings' && !a.inLegal);
  const total = savingsAccounts.reduce((s, a) => s + num(balances[a.id]), 0);
  return {
    total: round2(total),
    accounts: savingsAccounts.map((a) => ({ id: a.id, name: a.name, balance: round2(num(balances[a.id])) })),
  };
}

// The "good works" a child is provoked toward — giving and saving, lifted up as
// the good to imitate (DR-0112). This is the heart of the teaching view: not the
// shortfalls to police, but the good works to join.
export function goodWorksFromBooks(data, asOf = new Date()) {
  const giving = monthlyGiving(data);
  const saving = savingsOnHand(data, asOf);
  return [
    {
      key: 'giving',
      label: 'Giving',
      amount: giving,
      period: 'monthly',
      invite: 'This is what the family gives — the tithe and generosity. Giving comes first. You can be a giver too.',
    },
    {
      key: 'saving',
      label: 'Saving',
      amount: saving.total,
      period: 'on-hand',
      accounts: saving.accounts,
      invite: 'This is the buffer the family is building by saving steadily. Little by little grows. You can start a savings goal.',
    },
  ];
}

// The teaching view — the REAL numbers arranged as the stewardship flow, giving +
// saving foregrounded as good works, ending in an invitation and a prayer prompt.
// No deficit/shame framing (DR-0112 / Colossians 3:21: discouragement is the fail).
function teachingView(data, asOf) {
  const flows = deriveMonthlyFlows(data);
  const income = round2(flows.monthlyInflow);
  const giving = monthlyGiving(data);
  const saving = savingsOnHand(data, asOf);
  const out = data?.outflows || {};
  // Spending = the household/keeping-the-lights-on outflow (everything that is
  // NOT the good-work of giving). Presented as "what it costs to run the home,"
  // never as a verdict.
  const spending = round2(
    num(out.household) + num(out.propertyUtilities) + num(out.debtService) + num(out.rentalMortgages),
  );
  return {
    mode: 'teaching',
    readOnly: true,
    // The stewardship flow, in order — giving and saving are the good works.
    flow: [
      { key: 'income', label: 'What comes in', amount: income, period: 'monthly' },
      { key: 'giving', label: 'Giving (first)', amount: giving, period: 'monthly', goodWork: true },
      { key: 'saving', label: 'Saving', amount: saving.total, period: 'on-hand', goodWork: true },
      { key: 'spending', label: 'Running the home', amount: spending, period: 'monthly' },
    ],
    goodWorks: goodWorksFromBooks(data, asOf),
    invitation: 'These are the family’s real numbers. See how giving comes first, then saving grows? That is good work — and you are invited into it.',
    prayerPrompt: 'Thank You for what You provide. Help me be a faithful giver and a wise saver, and to use what I am trusted with for good.',
  };
}

// The raw view — the real accounts + balances + the month's flow, read-only. For
// the older/ready heir. Still no acting: seeing is not spending.
function rawView(data, asOf) {
  const balances = deriveAccountBalances(data, asOf);
  const flows = deriveMonthlyFlows(data);
  const accounts = (data?.accounts || [])
    .filter((a) => a && !a.inLegal)
    .map((a) => ({ id: a.id, name: a.name, type: a.type, balance: round2(num(balances[a.id])) }));
  return {
    mode: 'raw',
    readOnly: true,
    accounts,
    monthly: {
      income: round2(flows.monthlyInflow),
      outflow: round2(flows.monthlyOutflow),
      net: round2(flows.netMonthly),
      giving: monthlyGiving(data),
    },
    // Even the raw view keeps the provocation: the good works are still named.
    goodWorks: goodWorksFromBooks(data, asOf),
    prayerPrompt: 'Thank You for what You provide. Make me a faithful steward of what I am trusted with.',
  };
}

// The one entry point. Given the family's real data + the guardian's per-child
// mode, return the read-only view-model a granted child sees. Unknown mode falls
// back to the teaching default (child-safe, provoke-to-good-works).
export function childBooksView(data, { mode = DEFAULT_CHILD_VIEW_MODE, asOf = new Date() } = {}) {
  const m = normalizeChildViewMode(mode);
  return m === 'raw' ? rawView(data, asOf) : teachingView(data, asOf);
}
