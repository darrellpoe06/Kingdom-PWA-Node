// =============================================================================
// money-plan.js — the family's Money settings (pure helpers over data.moneyPlan)
// =============================================================================
// Christina, 2026-10-28: the Safe-to-Spend engine needs figures the books never
// held — pay dates, due days, the cash cushion, planned savings — and "Do not
// silently invent missing values." So they live in ONE snapshot key,
// data.moneyPlan, entered through the guided setup (components/money/MoneySetup)
// and read by the engine as `settings`.
//
// HOW IT PERSISTS (verified 2026-10-28, no sync code changed):
//   · the device snapshot (IndexedDB poe-financial-v28) saves the whole `data`;
//   · the cloud snapshot (family_snapshots, lib/snapshot-sync.js) copies every
//     key of `data` that is not table-synced — so moneyPlan rides it exactly as
//     recurringObligations and taxCalendar do, and the pull merges it back;
//   · the push is gated by the shell: signed in, pull done, and the snapshot
//     "remainder" not still seed. A device whose only real edits are moneyPlan
//     therefore stays device-local until a real obligation, event or capital
//     item exists. syncStatus() below says which of the three states applies,
//     so the person is never told "saved" when it only reached this device.
//
// Pure: no React, no storage calls (the marker is passed in), no shell.
// =============================================================================

export const MONEY_PLAN_VERSION = 1;

export function emptyMoneyPlan() {
  return {
    v: MONEY_PLAN_VERSION,
    updatedAt: null,
    settings: {
      defaultPeriod: 'next-paycheck',
      incomeSchedule: {},      // { [salaryId]: { frequency, nextDate, amount? } }
      debtDueDays: {},         // { [debtId]: 1..31 }
      rentDueDay: null,        // 1..31
      mortgageDueDay: null,    // 1..31
      taxAmounts: {},          // { [taxCalendarItemId]: annual amount }
      savingsMonthly: null,    // planned savings per month
      minCushion: null,        // the minimum cash cushion; null = meta.bufferTarget
      includeInferredBills: true,
      staleDays: 14,
      privacy: false,          // hide amounts when others are nearby
      scope: 'personal',
    },
    goalMeta: {},              // { [goalId]: { kind, linkedAccountIds, monthlyContribution } }
    billStatus: {},            // { [`${refId}:${date}`]: { status, at } }
    budgets: {},               // { [periodKey]: { income, categories: { [cat]: planned } } }
  };
}

/** A stamped, merged plan: the shell's setData passes the previous data in. */
export function patchMoneyPlan(prev, patch, now = new Date()) {
  const base = prev && typeof prev === 'object' ? prev : emptyMoneyPlan();
  const next = { ...emptyMoneyPlan(), ...base, updatedAt: now.toISOString() };
  for (const [k, v] of Object.entries(patch || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && next[k] && typeof next[k] === 'object') next[k] = { ...next[k], ...v };
    else next[k] = v;
  }
  return next;
}

export function moneySettings(data) {
  return { ...emptyMoneyPlan().settings, ...((data && data.moneyPlan && data.moneyPlan.settings) || {}) };
}

// ── sync status: local · pending · synced ────────────────────────────────────
// `cloud` = the shell's own truth (signed in, not demo/reviewer). `marker` = the
// poe-snapshot-marker the shell writes after a successful push. A plan edited
// after the last push is pending; one never pushed is pending; no cloud is local.
export function syncStatus({ cloud = false, marker = null, updatedAt = null } = {}) {
  if (!cloud) return { state: 'local', label: 'Saved on this device', detail: 'Sign in to synchronize across devices.' };
  if (!updatedAt) return { state: 'synced', label: 'Nothing to synchronize yet', detail: 'No Money settings have been entered.' };
  if (marker && new Date(marker).getTime() >= new Date(updatedAt).getTime()) return { state: 'synced', label: 'Synchronized', detail: `Last pushed ${marker.slice(0, 16).replace('T', ' ')}.` };
  return { state: 'pending', label: 'Pending synchronization', detail: 'Saved on this device; the family snapshot publishes within a few seconds of a change once the books hold a real obligation, event or capital item.' };
}

// ── guided setup: what is entered, what is missing ───────────────────────────
// Each step names exactly what the engine lacks. Nothing here guesses a value.
export function setupSteps(data, opts = {}) {
  const s = moneySettings(data);
  const salaries = (data?.inflows?.salaries || []).filter((x) => (Number(x.actual != null ? x.actual : x.expected) || 0) > 0);
  const debts = opts.debts || [];
  const rentals = (data?.inflows?.rentals || []).filter((r) => (Number(r.rent) || 0) > 0);
  const obligations = (data?.recurringObligations || []).filter((o) => o && o.enabled !== false);
  const taxItems = (data?.taxCalendar || []).filter((t) => t && t.applies);
  const accounts = data?.accounts || [];
  const missingPay = salaries.filter((x) => !(s.incomeSchedule[x.id] && s.incomeSchedule[x.id].frequency && s.incomeSchedule[x.id].nextDate));
  const missingDue = debts.filter((d) => d.source !== 'rental' && (Number(d.minPayment) || 0) > 0 && !(s.debtDueDays[d.id] || (accounts.find((a) => a.id === d.accountId) || {}).dueDay));
  const taxWithAmount = taxItems.filter((t) => (Number(s.taxAmounts[t.id]) || Number(t.amount) || 0) > 0);
  const steps = [
    { id: 'paychecks', label: 'Paycheck dates and frequency', done: salaries.length > 0 && missingPay.length === 0, applies: salaries.length > 0, missing: missingPay.map((x) => x.source || x.who || x.id), why: 'Expected income counts only on the day it arrives.' },
    { id: 'debt-due', label: 'Debt payment due dates', done: debts.length > 0 && missingDue.length === 0, applies: debts.some((d) => d.source !== 'rental'), missing: missingDue.map((d) => d.name), why: 'A minimum due before payday drains the lowest balance.' },
    { id: 'rent-due', label: 'Rental income due date', done: !!s.rentDueDay, applies: rentals.length > 0, missing: s.rentDueDay ? [] : ['Rent due day'], why: 'Rent lands on its day, not on the first by assumption.' },
    { id: 'mortgage-due', label: 'Mortgage due day', done: !!s.mortgageDueDay, applies: debts.some((d) => d.source === 'rental'), missing: s.mortgageDueDay ? [] : ['Mortgage due day'], why: 'Principal, interest and escrow are dated items.' },
    { id: 'bills', label: 'Recurring bill dates', done: obligations.length > 0, applies: true, missing: obligations.length ? [] : ['No recurring obligations entered'], why: 'Each bill lands on its own day; inferred patterns are labeled until confirmed.' },
    { id: 'taxes', label: 'Tax obligations', done: taxWithAmount.length > 0 || taxItems.length === 0, applies: taxItems.length > 0, missing: taxItems.filter((t) => !((Number(s.taxAmounts[t.id]) || Number(t.amount) || 0) > 0)).map((t) => t.name), why: 'Dated tax items are events; the rest accrue as a set-aside.' },
    { id: 'savings', label: 'Savings contributions', done: s.savingsMonthly != null && s.savingsMonthly !== '', applies: true, missing: s.savingsMonthly != null && s.savingsMonthly !== '' ? [] : ['Planned savings per month'], why: 'Planned savings are reserved before anything is called spendable.' },
    { id: 'cushion', label: 'Minimum cash cushion', done: (s.minCushion != null && s.minCushion !== '') || (Number(data?.meta?.bufferTarget) || 0) > 0, applies: true, missing: (s.minCushion != null && s.minCushion !== '') || (Number(data?.meta?.bufferTarget) || 0) > 0 ? [] : ['Minimum cushion'], why: 'Safe to Spend keeps this floor on every projected day.' },
  ];
  const applicable = steps.filter((st) => st.applies);
  const done = applicable.filter((st) => st.done).length;
  return { steps, applicable: applicable.length, done, complete: applicable.length > 0 && done === applicable.length };
}

// ── balance labeling: bank-reported · ledger-calculated · projected ──────────
// Christina: "Do not label ledger-derived balances as verified bank balances."
export function balanceSource({ bankBalance = null, bankAsOf = null, ledgerAsOf = null } = {}) {
  if (typeof bankBalance === 'number') return { kind: 'bank', label: 'Bank-reported available balance', asOf: bankAsOf || null };
  return { kind: 'ledger', label: 'Ledger-calculated (bank balance unavailable)', asOf: ledgerAsOf || null, estimate: true };
}
