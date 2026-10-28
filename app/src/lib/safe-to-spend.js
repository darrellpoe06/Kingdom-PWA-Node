// =============================================================================
// safe-to-spend.js — "How much can I safely spend or put toward debt?" (pure)
// =============================================================================
// Christina, 2026-10-28: the first and most prominent feature of Money must
// answer how much can be spent RIGHT NOW while everything that has to be paid
// still gets paid. This is that engine. It is pure arithmetic over the family's
// own records (DR-0076: no painted number, no network, no randomness), and it
// writes nothing.
//
// THE METHOD — chronological, not "income minus expenses":
//   1. Start from the VERIFIED cash on hand of the spendable accounts in scope
//      (checking / savings / cash; never credit, loans, legal holds, or accounts
//      the family declared a debt). A ledger row dated today or earlier is
//      already inside that balance, so nothing dated today-or-earlier is ever
//      counted again (that is how "pending" rows avoid being double-counted:
//      a posted-or-pending row that already moved the balance is in the
//      balance; only rows dated in the FUTURE become timeline events).
//   2. Lay every dated event of the planning period on a day-by-day timeline:
//      bills (recurring obligations, rolled forward from their next-due date),
//      minimum debt payments, mortgage P&I + escrow, tax-calendar items,
//      open incidents with a due date, future-dated ledger rows, inferred
//      recurring payments (labeled as inferred), and expected income on the
//      day it is expected — never before.
//   3. Accrue the undated reserves daily: living expenses, the tax set-aside
//      for items outside the window, and planned savings.
//   4. Walk the days. The LOWEST projected balance is the number that matters:
//      a healthy month-end does not mean money is free today if next Tuesday's
//      mortgage drains the account first.
//   5. Safe to Spend Now = lowest projected balance − minimum cash cushion,
//      floored at $0. A shortfall is reported separately, never as a negative
//      spendable amount.
//
// WHAT IS NEVER COUNTED TWICE (the dedupe rules, each one stated so it can be
// checked): a debt whose payment is already a hand-entered recurring
// obligation (same payee key) counts once, as the obligation; a debt whose
// minimum is already a future-dated ledger row in the window counts once, as
// the row; the `debtService` and `rentalMortgages` outflow buckets are NOT
// accrued as living expenses because the dated debt and mortgage items carry
// them; an inferred recurring payment is carved OUT of the household bucket
// so the household figure covers only what is not itemized; a transfer
// between the family's own accounts is never income and never spend.
//
// WHAT IS KEPT APART: business and rental cash are never personal spending
// money. The default scope is 'personal'; a business entity can be viewed on
// its own; the consolidated view sums per-entity results with every entity
// floored at $0, so one pocket never silently subsidizes another.
//
// HONESTY: when pay dates are unknown, expected income is left OUT and the
// result says so. When the ledger is stale, the result is an ESTIMATE, labeled.
// When there is no spendable account, the status is UNAVAILABLE, not $0.
//
// Pure leaf module: sibling pure libs only; no React, no storage, no shell.
// Tests: src/__tests__/safe-to-spend.test.js.
// =============================================================================

import { deriveAccountBalances, deriveDebts, freqToMonths } from './financial-engineering.js';
import { isTransferTxn, isBalanceAdjustment } from './imported-view.js';
import { detectRecurring, payeeKey } from './recurring-payments.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 365.25 / 12;

export const SPENDABLE_TYPES = ['checking', 'savings', 'cash'];

export const PERIODS = [
  { id: 'next-paycheck', label: 'Until next paycheck' },
  { id: '7d', label: 'Next 7 days', days: 7 },
  { id: '14d', label: 'Next 14 days', days: 14 },
  { id: '30d', label: 'Next 30 days', days: 30 },
  { id: 'custom', label: 'Custom range' },
];

export const INCOME_FREQUENCIES = [
  { id: 'weekly', label: 'Weekly', days: 7 },
  { id: 'biweekly', label: 'Every 2 weeks', days: 14 },
  { id: 'semimonthly', label: 'Twice a month (1st & 15th)' },
  { id: 'monthly', label: 'Monthly' },
];

// Living-expense buckets, by scope. `debtService` and `rentalMortgages` are
// never accrued: the dated debt minimums and mortgage items carry them.
const COVERED_BY_DATED_ITEMS = new Set(['debtService', 'rentalMortgages']);
const PERSONAL_BUCKETS = new Set(['household', 'charitableGiving']);
const PROPERTY_BUCKETS = new Set(['propertyUtilities']);

export function round2(x) { return Math.round((Number(x) || 0) * 100) / 100; }

// ── dates (local-day arithmetic; 'YYYY-MM-DD' in, 'YYYY-MM-DD' out) ─────────
export function isoDay(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return null;
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function parseDay(iso) {
  if (!iso) return null;
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) { const d = new Date(s); return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
export function addDays(date, n) { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() + n); return d; }
export function addMonthsClamped(date, n, dayOfMonth) {
  const y = date.getFullYear(); const m = date.getMonth() + n;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(dayOfMonth || date.getDate(), last));
}
export function daysBetween(a, b) { return Math.round((b.getTime() - a.getTime()) / DAY_MS); }

// ── occurrences of a cadence inside [start, end], rolling forward from `first`
// (this is the roll-forward the Tx Upcoming view never had: a next-due date in
// the past advances to its next occurrence instead of dropping out) ──────────
export function expandOccurrences(first, frequency, start, end, maxGuard = 400) {
  const out = [];
  let due = first instanceof Date ? first : parseDay(first);
  if (!due || isNaN(due.getTime())) return out;
  const anchorDay = due.getDate();
  const step = (d, i) => {
    switch (frequency) {
      case 'weekly': return addDays(due, 7 * i);
      case 'biweekly': return addDays(due, 14 * i);
      case 'semimonthly': {
        // alternate between the anchor day and the anchor day + ~15
        const k = Math.floor(i / 2);
        const base = addMonthsClamped(d, k, anchorDay);
        return i % 2 === 0 ? base : addMonthsClamped(base, 0, Math.min(anchorDay + 15, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()));
      }
      default: {
        const months = freqToMonths(frequency) || (frequency === 'monthly' ? 1 : 0);
        if (!months) return null;
        return addMonthsClamped(d, months * i, anchorDay);
      }
    }
  };
  for (let i = 0; i < maxGuard; i++) {
    const at = step(due, i);
    if (!at) break;
    if (at > end) break;
    if (at >= start) out.push(at);
  }
  return out;
}

// ── scope ────────────────────────────────────────────────────────────────────
export function resolveScope(data, scope = 'personal', visibleEntities = null) {
  const entities = visibleEntities || data?.entities || [];
  const isPersonal = (e) => !e.type || e.type === 'personal' || e.type === 'joint';
  if (scope === 'consolidated' || scope === 'all') {
    return { id: 'consolidated', label: 'All entities', entityIds: entities.map((e) => e.id), includeUnassigned: true, kind: 'consolidated' };
  }
  if (scope === 'personal') {
    const ids = entities.filter(isPersonal).map((e) => e.id);
    return { id: 'personal', label: 'Personal', entityIds: ids, includeUnassigned: true, kind: 'personal' };
  }
  const e = entities.find((x) => x.id === scope);
  return { id: scope, label: e ? e.name : scope, entityIds: e ? [e.id] : [], includeUnassigned: false, kind: e ? (isPersonal(e) ? 'personal' : 'business') : 'business', entity: e || null };
}

function inScope(sc, entityId) {
  if (entityId == null || entityId === '') return !!sc.includeUnassigned;
  return sc.entityIds.includes(entityId);
}

// ── income ───────────────────────────────────────────────────────────────────
// Expected income events in [start, end]. Three sources, most authoritative first:
//   1. a pay schedule the family entered (settings.incomeSchedule[salaryId]);
//   2. a rhythm INFERRED from real salary deposits in the ledger (labeled);
//   3. nothing — the salary is left out and the result says so.
// Rental income lands on the rent due day (settings.rentDueDay, default the 1st)
// for doors that are paying, at the amount actually collected.
export function incomeEvents(data, sc, start, end, settings = {}, asOf = start) {
  const events = [];
  const assumptions = [];
  const schedule = settings.incomeSchedule || {};
  const salaries = (data?.inflows?.salaries || []).filter((s) => inScope(sc, s.entityId));
  const txns = data?.transactions || [];
  const accountEntity = new Map((data?.accounts || []).map((a) => [a.id, a.entityId ?? null]));
  // Inferred pay rhythms from real deposits (category salary, or a payroll-looking description).
  const payrollRows = txns.filter((t) => t && Number(t.amount) > 0 && !isTransferTxn(t) && !isBalanceAdjustment(t)
    && (String(t.category || '') === 'salary' || /payroll|salary|direct ?dep|paycheck/i.test(String(t.description || '')))
    && inScope(sc, accountEntity.get(t.accountId)));
  const inferred = payrollRows.length ? detectRecurring(payrollRows, { direction: 'in', nowMs: asOf.getTime() }) : [];
  const usedInferred = new Set();
  for (const s of salaries) {
    const amount = Number(s.actual != null ? s.actual : s.expected) || 0;
    if (amount <= 0) continue;
    const sched = schedule[s.id];
    if (sched && sched.frequency && sched.nextDate) {
      const first = parseDay(sched.nextDate);
      const per = sched.amount != null ? Number(sched.amount) : perPaycheck(amount, sched.frequency);
      for (const at of expandOccurrences(first, sched.frequency, start, end)) {
        events.push({ date: isoDay(at), amount: round2(per), label: `${s.source || 'Salary'} (${s.who || ''})`.trim(), kind: 'income', source: 'schedule', inferred: false, entityId: s.entityId ?? null });
      }
      continue;
    }
    // Match an inferred rhythm by name words (source / who), else by the only rhythm left.
    const words = `${s.source || ''} ${s.who || ''}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    let match = inferred.find((g) => !usedInferred.has(g.key) && words.some((w) => g.label.toLowerCase().includes(w)));
    if (!match && inferred.length === 1 && !usedInferred.has(inferred[0].key) && salaries.length === 1) match = inferred[0];
    if (match) {
      usedInferred.add(match.key);
      let next = new Date(match.nextExpected.getFullYear(), match.nextExpected.getMonth(), match.nextExpected.getDate());
      let guard = 0;
      while (next < start && guard++ < 60) next = addDays(next, match.cadenceDays);
      for (const at of expandOccurrences(next, cadenceToFrequency(match.cadence), start, end)) {
        events.push({ date: isoDay(at), amount: round2(match.amount), label: `${s.source || 'Salary'} (${s.who || ''})`.trim(), kind: 'income', source: 'inferred', inferred: true, entityId: s.entityId ?? null });
      }
      assumptions.push(`${s.source || 'Salary'}: pay dates inferred from ${match.count} deposits (${match.cadenceLabel}); set the pay schedule in Money → Settings to confirm.`);
      continue;
    }
    assumptions.push(`${s.source || 'Salary'}: no pay dates known, so $${Math.round(amount).toLocaleString()}/mo expected income is LEFT OUT. Add its pay schedule in Money → Settings.`);
  }
  // Rental income.
  const rentDay = Number(settings.rentDueDay) || 1;
  for (const r of (data?.inflows?.rentals || [])) {
    if (!inScope(sc, r.entityId)) continue;
    const rent = Number(r.rent) || 0; if (rent <= 0) continue;
    const collected = r.actual != null ? Number(r.actual) : rent;
    if (collected <= 0) continue;
    if (r.status && !['paying', 'late', 'partial', 'occupied'].includes(String(r.status))) continue;
    const anchor = new Date(start.getFullYear(), start.getMonth(), Math.min(rentDay, new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()));
    const first = anchor < start ? addMonthsClamped(anchor, 1, rentDay) : anchor;
    for (const at of expandOccurrences(first, 'monthly', start, end)) {
      events.push({ date: isoDay(at), amount: round2(collected), label: `Rent · ${r.name || r.address || 'door'}`, kind: 'income', source: 'rental', inferred: !settings.rentDueDay, entityId: r.entityId ?? null });
    }
  }
  if (!settings.rentDueDay && events.some((e) => e.source === 'rental')) assumptions.push('Rent is assumed to land on the 1st; set the rent due day in Money → Settings.');
  return { events, assumptions };
}

export function perPaycheck(monthly, frequency) {
  const m = Number(monthly) || 0;
  switch (frequency) {
    case 'weekly': return m * 12 / 52;
    case 'biweekly': return m * 12 / 26;
    case 'semimonthly': return m / 2;
    default: return m;
  }
}
function cadenceToFrequency(cadence) {
  return cadence === 'bimonthly' ? 'monthly' : (cadence || 'monthly');
}

// ── dated outflows ───────────────────────────────────────────────────────────
export function obligationEvents(data, sc, start, end, settings = {}, opts = {}) {
  const asOf = opts.asOf || start;
  const events = [];
  const assumptions = [];
  const seenPayees = new Set();
  const accountEntity = new Map((data?.accounts || []).map((a) => [a.id, a.entityId ?? null]));
  const accountsById = new Map((data?.accounts || []).map((a) => [a.id, a]));

  // 1) Hand-entered recurring obligations (confirmed), rolled forward.
  for (const o of (data?.recurringObligations || [])) {
    if (!o || o.enabled === false || !o.nextDue) continue;
    if (!inScope(sc, o.entityId)) continue;
    const amount = Number(o.amount) || 0; if (amount <= 0) continue;
    seenPayees.add(payeeKey(o.name || ''));
    for (const at of expandOccurrences(parseDay(o.nextDue), o.frequency || 'monthly', start, end)) {
      events.push({ date: isoDay(at), amount: -round2(amount), label: o.name || 'Obligation', kind: 'bill', category: o.category || 'other', source: 'obligation', refId: o.id, entityId: o.entityId ?? null, assumed: false });
    }
  }

  // 2) Future-dated ledger rows on spendable accounts in scope (scheduled by hand).
  const scheduledKeys = new Set();
  for (const t of (data?.transactions || [])) {
    if (!t || !t.date) continue;
    const d = parseDay(t.date); if (!d || d <= asOf || d < start || d > end) continue;
    const acct = accountsById.get(t.accountId);
    if (!acct || !SPENDABLE_TYPES.includes(acct.type) || acct.inLegal || acct.treatAsDebt) continue;
    if (!inScope(sc, acct.entityId)) continue;
    if (isTransferTxn(t) || isBalanceAdjustment(t)) continue;
    const amt = Number(t.amount) || 0; if (!amt) continue;
    scheduledKeys.add(payeeKey(t.description || ''));
    events.push({ date: isoDay(d), amount: round2(amt), label: t.description || 'Scheduled', kind: amt > 0 ? 'income' : 'scheduled', category: t.category || null, source: 'ledger', refId: t.id, entityId: acct.entityId ?? null, assumed: false });
  }

  // 3) Minimum debt payments + mortgage P&I/escrow, once each.
  const debtDueDays = settings.debtDueDays || {};
  const mortgageDay = Number(settings.mortgageDueDay) || 1;
  let assumedDebtTiming = 0;
  for (const dbt of deriveDebts(data, asOf)) {
    if (!inScope(sc, dbt.entityId)) continue;
    if (seenPayees.has(payeeKey(dbt.name || ''))) continue; // the obligation already carries it
    if (scheduledKeys.has(payeeKey(dbt.name || ''))) continue; // a scheduled row already carries it
    const min = Number(dbt.minPayment) || 0; if (min <= 0) continue;
    let day; let assumed = false;
    if (dbt.source === 'rental') { day = mortgageDay; assumed = !settings.mortgageDueDay; }
    else {
      const acct = accountsById.get(dbt.accountId);
      day = Number(debtDueDays[dbt.id]) || Number(acct && acct.dueDay) || 0;
      if (!day) { day = 1; assumed = true; assumedDebtTiming += 1; }
    }
    const amount = dbt.source === 'rental'
      ? min + (Number((data?.inflows?.rentals || []).find((r) => r.id === dbt.rentalId)?.mortgage?.escrow) || 0)
      : min;
    const anchor = new Date(start.getFullYear(), start.getMonth(), Math.min(day, new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()));
    const first = anchor < start ? addMonthsClamped(anchor, 1, day) : anchor;
    for (const at of expandOccurrences(first, 'monthly', start, end)) {
      events.push({ date: isoDay(at), amount: -round2(amount), label: dbt.source === 'rental' ? `${dbt.name} (P&I + escrow)` : `${dbt.name} · minimum`, kind: dbt.source === 'rental' ? 'mortgage' : 'debt-min', source: dbt.source, refId: dbt.id, entityId: dbt.entityId ?? null, assumed });
    }
  }
  if (assumedDebtTiming) assumptions.push(`${assumedDebtTiming} debt payment${assumedDebtTiming === 1 ? '' : 's'} assumed due on the 1st (no due day on file); set due days in Money → Settings.`);

  // 4) Tax calendar items that land inside the window (dated; the rest accrue).
  for (const tx of (data?.taxCalendar || [])) {
    const taxAmt = taxAmount(tx, settings);
    if (!tx || !tx.applies || !(taxAmt > 0)) continue;
    const ids = Array.isArray(tx.entityIds) ? tx.entityIds : [];
    if (ids.length && !ids.some((id) => inScope(sc, id))) continue;
    if (!ids.length && !sc.includeUnassigned) continue;
    for (const y of [start.getFullYear(), start.getFullYear() + 1]) {
      const at = new Date(y, (Number(tx.month) || 1) - 1, Number(tx.day) || 1);
      if (at >= start && at <= end) events.push({ date: isoDay(at), amount: -round2(taxAmt), label: tx.name || 'Tax item', kind: 'tax', source: 'tax-calendar', refId: tx.id, entityId: ids[0] || null, assumed: false });
    }
  }

  // 5) Open incidents with a due date and an amount.
  for (const inc of (data?.incidents || [])) {
    if (!inc || inc.status === 'resolved' || inc.status === 'closed') continue;
    const amount = Number(inc.amount) || 0; if (amount <= 0) continue;
    if (!inScope(sc, inc.entityId)) continue;
    const d = parseDay(inc.dueDate || inc.date); if (!d) continue;
    const at = d < start ? start : d; // overdue = due now
    if (at > end) continue;
    events.push({ date: isoDay(at), amount: -round2(amount), label: inc.description || 'Incident', kind: 'incident', source: 'incident', refId: inc.id, entityId: inc.entityId ?? null, assumed: false });
  }

  // 6) Inferred recurring payments from the ledger (labeled), unless the family
  //    turned them off or already decided to cancel the pattern.
  const inferredMonthly = { total: 0, items: [] };
  if (settings.includeInferredBills !== false) {
    const decisions = opts.recurringDecisions || {};
    const rows = (data?.transactions || []).filter((t) => t && Number(t.amount) < 0 && !isTransferTxn(t) && !isBalanceAdjustment(t)
      && String(t.category || '') !== 'debt-payment' && String(t.category || '') !== 'transfer'
      && inScope(sc, accountEntity.get(t.accountId)) && !!accountsById.get(t.accountId) && SPENDABLE_TYPES.includes(accountsById.get(t.accountId).type));
    const patterns = rows.length ? detectRecurring(rows, { direction: 'out', nowMs: asOf.getTime() }) : [];
    for (const p of patterns) {
      if (decisions[p.key] === 'cancel') continue;
      if (seenPayees.has(p.key) || scheduledKeys.has(p.key)) continue;
      if (looksLikeDebtPayment(p.label)) continue; // the debt minimum already carries it
      let next = new Date(p.nextExpected.getFullYear(), p.nextExpected.getMonth(), p.nextExpected.getDate());
      let guard = 0;
      while (next < start && guard++ < 120) next = addDays(next, p.cadenceDays);
      const occ = expandOccurrences(next, cadenceToFrequency(p.cadence), start, end);
      for (const at of occ) {
        events.push({ date: isoDay(at), amount: -round2(p.amount), label: p.label, kind: 'inferred-bill', source: 'inferred', refId: p.key, entityId: null, assumed: true, cadence: p.cadenceLabel });
      }
      const monthly = round2(p.amount * (DAYS_PER_MONTH / p.cadenceDays));
      inferredMonthly.total = round2(inferredMonthly.total + monthly);
      inferredMonthly.items.push({ key: p.key, label: p.label, monthly });
    }
    if (inferredMonthly.items.length) assumptions.push(`${inferredMonthly.items.length} recurring payment${inferredMonthly.items.length === 1 ? '' : 's'} inferred from the ledger (not confirmed) — confirm or cancel them in Money → Bills.`);
  }

  return { events, assumptions, inferredMonthly };
}

// The annual amount of a tax-calendar item: the family's entered figure (guided
// setup, settings.taxAmounts) beats the seed's, and an absent figure is 0 — never
// invented.
export function taxAmount(tx, settings = {}) {
  if (!tx) return 0;
  const entered = settings.taxAmounts && settings.taxAmounts[tx.id];
  if (entered != null && entered !== '' && isFinite(Number(entered))) return Number(entered);
  return Number(tx.amount) || 0;
}

function looksLikeDebtPayment(label) {
  return /\b(payment|autopay|auto ?pay|card ?member|cardmember|credit crd|epay|loan pmt|mortgage)\b/i.test(String(label || ''));
}

// ── undated reserves, accrued daily ──────────────────────────────────────────
export function monthlyAccruals(data, sc, start, end, settings = {}, opts = {}) {
  const out = { living: 0, livingParts: {}, tax: 0, savings: 0, notes: [] };
  const outflows = data?.outflows || {};
  const hasRentals = (data?.inflows?.rentals || []).some((r) => inScope(sc, r.entityId) && (Number(r.rent) || 0) > 0);
  for (const [bucket, v] of Object.entries(outflows)) {
    const amt = Number(v) || 0; if (amt <= 0 || COVERED_BY_DATED_ITEMS.has(bucket)) continue;
    let counts;
    if (sc.kind === 'consolidated') counts = true;
    else if (PROPERTY_BUCKETS.has(bucket)) counts = hasRentals && sc.kind !== 'personal';
    else if (PERSONAL_BUCKETS.has(bucket)) counts = sc.kind === 'personal';
    else counts = sc.kind === 'personal'; // an unknown bucket is household-side
    if (counts) { out.livingParts[bucket] = amt; out.living += amt; }
  }
  // Inferred recurring payments are carved out of the household figure so they count once.
  const carve = Math.min(out.livingParts.household || 0, Number(opts.inferredMonthlyTotal) || 0);
  if (carve > 0) { out.livingParts.household = round2(out.livingParts.household - carve); out.living = round2(out.living - carve); out.notes.push(`$${Math.round(carve).toLocaleString()}/mo of itemized recurring payments carved out of the household figure so they are counted once.`); }
  out.living = round2(out.living);
  // Tax set-aside for items NOT dated inside the window.
  let annual = 0;
  for (const tx of (data?.taxCalendar || [])) {
    const taxAmt = taxAmount(tx, settings);
    if (!tx || !tx.applies || !(taxAmt > 0)) continue;
    const ids = Array.isArray(tx.entityIds) ? tx.entityIds : [];
    if (ids.length && !ids.some((id) => inScope(sc, id))) continue;
    if (!ids.length && !sc.includeUnassigned) continue;
    const inWindow = [start.getFullYear(), start.getFullYear() + 1].some((y) => { const at = new Date(y, (Number(tx.month) || 1) - 1, Number(tx.day) || 1); return at >= start && at <= end; });
    if (!inWindow) annual += taxAmt;
  }
  out.tax = round2(annual / 12);
  // Planned savings: the family's number first, else the goals' required pace.
  if (settings.savingsMonthly != null && settings.savingsMonthly !== '') out.savings = round2(Number(settings.savingsMonthly) || 0);
  else {
    const goals = (opts.goals || []).filter((g) => g && !g.archived && (g.goalType || 'save') === 'save' && (g.scope === 'consolidated' || g.scope == null || inScope(sc, g.scope) || (sc.kind === 'personal' && g.scope === 'consolidated')));
    let s = 0;
    for (const g of goals) {
      const meta = (opts.goalMeta || {})[g.id] || {};
      if (meta.monthlyContribution != null) { s += Number(meta.monthlyContribution) || 0; continue; }
      const remaining = Math.max(0, (Number(g.targetAmount) || 0) - (Number(g.currentAmount) || 0));
      const td = parseDay(g.targetDate);
      if (!td || remaining <= 0) continue;
      const months = Math.max(1, Math.round(daysBetween(start, td) / DAYS_PER_MONTH));
      s += remaining / months;
    }
    out.savings = round2(s);
  }
  return out;
}

// ── freshness ────────────────────────────────────────────────────────────────
export function ledgerFreshness(data, sc, asOf, settings = {}) {
  const accountsById = new Map((data?.accounts || []).map((a) => [a.id, a]));
  let newest = null;
  for (const t of (data?.transactions || [])) {
    const acct = accountsById.get(t?.accountId); if (!acct || !SPENDABLE_TYPES.includes(acct.type) || !inScope(sc, acct.entityId)) continue;
    const d = parseDay(t.date); if (!d || d > asOf) continue;
    if (!newest || d > newest) newest = d;
  }
  const staleAfter = Number(settings.staleDays) || 14;
  const staleDays = newest ? daysBetween(newest, asOf) : null;
  return { ledgerAsOf: newest ? isoDay(newest) : null, metaUpdated: data?.meta?.lastUpdated || null, staleDays, stale: staleDays == null || staleDays > staleAfter, staleAfter };
}

// ── the engine ───────────────────────────────────────────────────────────────
export function buildSafeToSpend(data, opts = {}) {
  const asOfRaw = opts.currentDate instanceof Date ? opts.currentDate : new Date();
  const asOf = new Date(asOfRaw.getFullYear(), asOfRaw.getMonth(), asOfRaw.getDate());
  const settings = opts.settings || data?.moneyPlan?.settings || {};
  const scopeId = opts.scope || 'personal';
  const sc = resolveScope(data, scopeId, opts.visibleEntities || null);
  if (sc.kind === 'consolidated') return consolidated(data, sc, asOf, settings, opts);
  return forScope(data, sc, asOf, settings, opts);
}

function periodEnd(data, sc, asOf, settings, opts) {
  const id = opts.period || settings.defaultPeriod || 'next-paycheck';
  const def = PERIODS.find((p) => p.id === id) || PERIODS[0];
  const assumptions = [];
  if (def.days) return { id: def.id, label: def.label, start: asOf, end: addDays(asOf, def.days), days: def.days, assumptions };
  if (def.id === 'custom') {
    const e = parseDay(opts.customEnd || settings.customEnd);
    if (e && e > asOf) return { id: 'custom', label: `Until ${isoDay(e)}`, start: asOf, end: e, days: daysBetween(asOf, e), assumptions };
    assumptions.push('No custom end date given; using the next 30 days.');
    return { id: 'custom', label: 'Next 30 days', start: asOf, end: addDays(asOf, 30), days: 30, assumptions };
  }
  // until next paycheck: scan up to 45 days for the first expected income
  const probe = incomeEvents(data, sc, addDays(asOf, 1), addDays(asOf, 45), settings, asOf);
  const next = probe.events.map((e) => e.date).sort()[0];
  if (next) { const e = parseDay(next); return { id: 'next-paycheck', label: `Until next paycheck (${next})`, start: asOf, end: e, days: daysBetween(asOf, e), assumptions, nextIncomeDate: next }; }
  assumptions.push('No upcoming pay date is known, so "until next paycheck" is shown as the next 14 days.');
  return { id: 'next-paycheck', label: 'Until next paycheck (next 14 days)', start: asOf, end: addDays(asOf, 14), days: 14, assumptions, nextIncomeDate: null };
}

function forScope(data, sc, asOf, settings, opts) {
  const period = periodEnd(data, sc, asOf, settings, opts);
  const { start, end } = period;
  const assumptions = [...period.assumptions];
  const balances = deriveAccountBalances(data, asOf);
  const spendable = (data?.accounts || []).filter((a) => SPENDABLE_TYPES.includes(a.type) && !a.inLegal && !a.treatAsDebt && inScope(sc, a.entityId));
  const availableCash = round2(spendable.reduce((s, a) => s + (balances[a.id] != null ? balances[a.id] : (Number(a.balance) || 0)), 0));
  const investments = round2((data?.accounts || []).filter((a) => a.type === 'investment' && !a.inLegal && inScope(sc, a.entityId)).reduce((s, a) => s + (balances[a.id] || 0), 0));
  const freshness = ledgerFreshness(data, sc, asOf, settings);

  const income = incomeEvents(data, sc, start, end, settings, asOf);
  const obligations = obligationEvents(data, sc, start, end, settings, { asOf, goals: opts.goals, recurringDecisions: opts.recurringDecisions });
  const accrual = monthlyAccruals(data, sc, start, end, settings, { inferredMonthlyTotal: obligations.inferredMonthly.total, goals: opts.goals, goalMeta: opts.goalMeta || data?.moneyPlan?.goalMeta });
  assumptions.push(...income.assumptions, ...obligations.assumptions, ...accrual.notes);
  const minCushion = round2(settings.minCushion != null && settings.minCushion !== '' ? Number(settings.minCushion) : (Number(data?.meta?.bufferTarget) || 0));

  // Day-by-day walk.
  const items = [...income.events, ...obligations.events].sort((a, b) => a.date.localeCompare(b.date));
  const byDay = new Map();
  for (const it of items) { if (!byDay.has(it.date)) byDay.set(it.date, []); byDay.get(it.date).push(it); }
  const dailyLiving = accrual.living / DAYS_PER_MONTH;
  const dailyTax = accrual.tax / DAYS_PER_MONTH;
  const dailySavings = accrual.savings / DAYS_PER_MONTH;
  const timeline = [];
  let cash = availableCash;
  let lowest = { amount: availableCash, date: isoDay(start) };
  let overdraftDate = null;
  const days = Math.max(0, daysBetween(start, end));
  for (let d = 0; d <= days; d++) {
    const date = isoDay(addDays(start, d));
    const dayItems = byDay.get(date) || [];
    let inflow = 0; let outflow = 0;
    for (const it of dayItems) { if (it.amount > 0) inflow += it.amount; else outflow += -it.amount; }
    const accrued = d === 0 ? 0 : dailyLiving + dailyTax + dailySavings;
    cash = cash + inflow - outflow - accrued;
    timeline.push({ date, cash: round2(cash), in: round2(inflow), out: round2(outflow + accrued), accrued: round2(accrued), items: dayItems });
    if (cash < lowest.amount) lowest = { amount: round2(cash), date };
    if (cash < 0 && !overdraftDate) overdraftDate = date;
  }
  const sum = (pred) => round2(items.filter(pred).reduce((s, it) => s + Math.abs(it.amount), 0));
  // THE SIMPLE BREAKDOWN RECONCILES WITH THE WALK (Christina 2026-10-28): the
  // sums THROUGH the lowest day are the walk's own terms, so
  //   availableCash + incomeToLow − outflowsToLow − accruedToLow = lowest
  // holds to the cent by construction, and lowest − cushion (floored) = safe.
  const lowIdx = Math.max(0, timeline.findIndex((t) => t.date === lowest.date));
  const toLow = (pred) => round2(items.filter((it) => it.date <= lowest.date && pred(it)).reduce((s, it) => s + Math.abs(it.amount), 0));
  const accruedDays = lowIdx; // day 0 accrues nothing
  const toLowest = {
    date: lowest.date, days: accruedDays,
    income: toLow((it) => it.amount > 0),
    bills: toLow((it) => it.amount < 0 && (it.kind === 'bill' || it.kind === 'scheduled' || it.kind === 'inferred-bill')),
    debtMinimums: toLow((it) => it.amount < 0 && (it.kind === 'debt-min' || it.kind === 'mortgage')),
    taxesDated: toLow((it) => it.amount < 0 && it.kind === 'tax'),
    other: toLow((it) => it.amount < 0 && it.kind === 'incident'),
    living: round2(dailyLiving * accruedDays),
    taxes: round2(dailyTax * accruedDays),
    savings: round2(dailySavings * accruedDays),
  };
  toLowest.reserves = round2(toLowest.living + toLowest.taxes + toLowest.savings + toLowest.taxesDated);
  toLowest.obligations = round2(toLowest.bills + toLowest.debtMinimums + toLowest.other);
  const billsDue = sum((it) => it.kind === 'bill' || it.kind === 'scheduled' || it.kind === 'inferred-bill');
  const debtMinimums = sum((it) => it.kind === 'debt-min' || it.kind === 'mortgage');
  const taxesDated = sum((it) => it.kind === 'tax');
  const otherCommitments = sum((it) => it.kind === 'incident');
  const expectedIncome = sum((it) => it.kind === 'income');
  const periodFraction = days / DAYS_PER_MONTH;
  const livingReserved = round2(accrual.living * periodFraction);
  const taxReserved = round2(accrual.tax * periodFraction + taxesDated);
  const savingsReserved = round2(accrual.savings * periodFraction);
  const safeToSpendNow = round2(Math.max(0, lowest.amount - minCushion));
  const shortfall = round2(Math.max(0, minCushion - lowest.amount));
  const nextIncome = income.events.filter((e) => e.date > isoDay(asOf)).sort((a, b) => a.date.localeCompare(b.date))[0] || null;

  let status = 'verified';
  const reasons = [];
  if (!spendable.length) { status = 'unavailable'; reasons.push('No checking, savings or cash account in this scope yet.'); }
  else {
    if (freshness.stale) { status = 'estimate'; reasons.push(freshness.ledgerAsOf ? `The ledger's newest entry is ${freshness.staleDays} days old (older than ${freshness.staleAfter}).` : 'No ledger entries on the spendable accounts yet.'); }
    if (income.events.some((e) => e.inferred)) { if (status === 'verified') status = 'estimate'; reasons.push('Some income timing is inferred, not entered.'); }
    if (obligations.events.some((e) => e.assumed && e.kind !== 'inferred-bill')) { if (status === 'verified') status = 'estimate'; reasons.push('Some payment due days are assumed.'); }
  }

  const explanation = [
    `Start with verified available cash on ${spendable.length} spendable account${spendable.length === 1 ? '' : 's'}: $${availableCash.toLocaleString()}. Every ledger row dated ${isoDay(asOf)} or earlier is already inside this number, so pending rows are not subtracted again.`,
    `Lay out every dated item through ${isoDay(end)}: $${billsDue.toLocaleString()} of bills, $${debtMinimums.toLocaleString()} of minimum debt and mortgage payments, $${taxesDated.toLocaleString()} of dated tax items, $${otherCommitments.toLocaleString()} of other commitments, and $${expectedIncome.toLocaleString()} of expected income on the days it is expected.`,
    `Accrue the undated reserves day by day: $${accrual.living.toLocaleString()}/mo living expenses, $${accrual.tax.toLocaleString()}/mo tax set-aside, $${accrual.savings.toLocaleString()}/mo planned savings.`,
    `The lowest projected balance is $${lowest.amount.toLocaleString()} on ${lowest.date}. Keep the $${minCushion.toLocaleString()} cash cushion: ${lowest.amount - minCushion >= 0 ? `$${safeToSpendNow.toLocaleString()} can be spent today without any projected balance dropping below the cushion.` : `the cushion is short by $${shortfall.toLocaleString()}, so nothing is safely spendable today.`}`,
  ];

  return {
    scope: { id: sc.id, label: sc.label, kind: sc.kind },
    period: { id: period.id, label: period.label, start: isoDay(start), end: isoDay(end), days },
    status, confidence: { level: status, reasons },
    freshness,
    safeToSpendNow, shortfall, overdraftDate,
    lines: {
      availableCash, investmentsHeldApart: investments, pendingHolds: 0,
      billsDue, debtMinimums, livingExpenses: livingReserved, taxesReserved: taxReserved, savingsReserved,
      minCushion, otherCommitments, expectedIncome,
      projectedLowest: lowest,
      toLowest,
      nextIncome: nextIncome ? { date: nextIncome.date, amount: nextIncome.amount, source: nextIncome.label, inferred: !!nextIncome.inferred } : null,
      potentialDebtPayment: safeToSpendNow,
    },
    monthly: { living: accrual.living, livingParts: accrual.livingParts, tax: accrual.tax, savings: accrual.savings, inferredBills: obligations.inferredMonthly },
    items, timeline, explanation, assumptions,
  };
}

function consolidated(data, sc, asOf, settings, opts) {
  const entities = (opts.visibleEntities || data?.entities || []);
  const byEntity = [];
  for (const e of entities) {
    const r = forScope(data, resolveScope(data, e.id, entities), asOf, settings, opts);
    if (r.status === 'unavailable') continue;
    byEntity.push(r);
  }
  // Accounts with no entity ride with Personal (resolveScope includes them there);
  // if no personal entity exists, show them as their own line.
  if (!entities.some((e) => !e.type || e.type === 'personal' || e.type === 'joint')) {
    const r = forScope(data, { id: 'unassigned', label: 'Unassigned', entityIds: [], includeUnassigned: true, kind: 'personal' }, asOf, settings, opts);
    if (r.status !== 'unavailable') byEntity.push(r);
  }
  const sumLine = (k) => round2(byEntity.reduce((s, r) => s + (Number(r.lines[k]) || 0), 0));
  const safe = round2(byEntity.reduce((s, r) => s + r.safeToSpendNow, 0));
  const shortfall = round2(byEntity.reduce((s, r) => s + r.shortfall, 0));
  const lowestSum = round2(byEntity.reduce((s, r) => s + r.lines.projectedLowest.amount, 0));
  const status = byEntity.length === 0 ? 'unavailable' : (byEntity.some((r) => r.status === 'estimate') ? 'estimate' : 'verified');
  const first = byEntity[0];
  const nextIncome = byEntity.map((r) => r.lines.nextIncome).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date))[0] || null;
  const overdraftDate = byEntity.map((r) => r.overdraftDate).filter(Boolean).sort()[0] || null;
  const freshest = byEntity.map((r) => r.freshness).sort((a, b) => (b.ledgerAsOf || '').localeCompare(a.ledgerAsOf || ''))[0] || { ledgerAsOf: null, staleDays: null, stale: true };
  return {
    scope: { id: 'consolidated', label: 'All entities', kind: 'consolidated' },
    period: first ? first.period : { id: opts.period || 'next-paycheck', label: 'Until next paycheck', start: isoDay(asOf), end: isoDay(asOf), days: 0 },
    status, confidence: { level: status, reasons: [...new Set(byEntity.flatMap((r) => r.confidence.reasons))] },
    freshness: freshest,
    safeToSpendNow: safe, shortfall, overdraftDate,
    lines: {
      availableCash: sumLine('availableCash'), investmentsHeldApart: sumLine('investmentsHeldApart'), pendingHolds: 0,
      billsDue: sumLine('billsDue'), debtMinimums: sumLine('debtMinimums'), livingExpenses: sumLine('livingExpenses'), taxesReserved: sumLine('taxesReserved'), savingsReserved: sumLine('savingsReserved'),
      minCushion: sumLine('minCushion'), otherCommitments: sumLine('otherCommitments'), expectedIncome: sumLine('expectedIncome'),
      projectedLowest: { amount: lowestSum, date: null },
      toLowest: ['income', 'bills', 'debtMinimums', 'taxesDated', 'other', 'living', 'taxes', 'savings', 'reserves', 'obligations'].reduce((acc, k) => { acc[k] = round2(byEntity.reduce((s, r) => s + ((r.lines.toLowest || {})[k] || 0), 0)); return acc; }, { date: null, days: null }),
      nextIncome, potentialDebtPayment: safe,
    },
    monthly: null,
    items: byEntity.flatMap((r) => r.items), timeline: [],
    explanation: [
      `Each entity is projected on its own and floored at $0, then summed — business and rental cash is never treated as personal spending money, and no pocket subsidizes another.`,
      ...byEntity.map((r) => `${r.scope.label}: lowest $${r.lines.projectedLowest.amount.toLocaleString()} on ${r.lines.projectedLowest.date}, cushion $${r.lines.minCushion.toLocaleString()} → safe $${r.safeToSpendNow.toLocaleString()}.`),
    ],
    assumptions: [...new Set(byEntity.flatMap((r) => r.assumptions))],
    byEntity,
  };
}
