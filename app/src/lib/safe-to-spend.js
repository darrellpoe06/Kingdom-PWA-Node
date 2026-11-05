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

import { deriveAccountBalances, deriveDebts, freqToMonths, latestCheckpoints } from './financial-engineering.js';
import { isTransferTxn, isBalanceAdjustment } from './imported-view.js';
import { detectRecurring, payeeKey } from './recurring-payments.js';
import { cleanName, suggestBills, isOwnAccountTransfer } from './bill-review.js';
import { isSampleSalary, isSampleOutflows, isSampleHousehold } from './sample-markers.js';

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
  { id: 'semimonthly', label: 'Twice a month (e.g. 1st & 15th)' },
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

// ── twice a month: two FIXED days of the month (DEFECT-2, 2026-10-29) ─────────
// "Twice a month (1st & 15th)" used to step the anchor + 15, so pay on the 1st
// landed its second payday on the 16th. A semimonthly schedule is two days of
// the month, not a fifteen-day stride: anchored on the 1st or the 15th it is the
// 1st & 15th; on the 28th or later it is the 15th & the last day; any other day
// d is d & d+14 (or d-14 & d past the 14th). Clamped to the month's last day.
export function semimonthlyDays(anchorDay) {
  const d = Number(anchorDay) || 1;
  if (d === 1 || d === 15) return [1, 15];
  if (d >= 28) return [15, 31];
  return d <= 14 ? [d, d + 14] : [d - 14, d];
}
function semimonthlyAt(first, i) {
  const [a, b] = semimonthlyDays(first.getDate());
  // the i-th payday at or after `first`, walking month by month through the two days
  const out = [];
  let y = first.getFullYear(); let m = first.getMonth();
  while (out.length <= i) {
    const last = new Date(y, m + 1, 0).getDate();
    for (const day of [a, b]) {
      const at = new Date(y, m, Math.min(day, last));
      if (at >= first && !out.some((x) => x.getTime() === at.getTime())) out.push(at);
    }
    m += 1; if (m > 11) { m = 0; y += 1; }
  }
  return out[i];
}

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
      case 'semimonthly': return semimonthlyAt(due, i);
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
  let unmatchedSchedule = false;
  for (const s of salaries) {
    // The shipped sample household's income ("Regional University salary
    // (Adam)") is never counted as the family's own (Christina 2026-11-03).
    if (isSampleSalary(s) && !isSampleHousehold(data)) { assumptions.push(`"${s.source} (${s.who})" is the app's sample income, not yours, so it is not counted.`); continue; }
    const amount = Number(s.actual != null ? s.actual : s.expected) || 0;
    if (amount <= 0) continue;
    const sched = schedule[s.id];
    if (sched && sched.frequency && sched.nextDate) {
      // The entered schedule IS this salary's deposits: they are claimed here
      // so the paycheck pass below never counts them a second time. One that
      // cannot be matched by name stops that pass altogether (it cannot tell
      // a second job from this one).
      const words = `${s.source || ''} ${s.who || ''}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const own = inferred.find((g) => !usedInferred.has(g.key) && words.some((w) => g.label.toLowerCase().includes(w)));
      if (own) usedInferred.add(own.key); else unmatchedSchedule = true;
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
  // Paychecks the ledger SHOWS but no income entry names (or only the sample's
  // did): counted under the real payer's name, flagged as not confirmed. A
  // rhythm whose last deposit is more than two pay periods old has stopped
  // and is not projected.
  for (const g of (unmatchedSchedule ? [] : inferred)) {
    if (usedInferred.has(g.key)) continue;
    const last = g.lastDate instanceof Date ? g.lastDate : null;
    if (!last || (asOf.getTime() - last.getTime()) > (2 * g.cadenceDays + 7) * 86400000) continue;
    let next = new Date(g.nextExpected.getFullYear(), g.nextExpected.getMonth(), g.nextExpected.getDate());
    let guard = 0;
    while (next < start && guard++ < 60) next = addDays(next, g.cadenceDays);
    const payer = cleanName(g.label || '') || 'Paycheck';
    for (const at of expandOccurrences(next, cadenceToFrequency(g.cadence), start, end)) {
      events.push({ date: isoDay(at), amount: round2(g.amount), label: `Paycheck · ${payer}`, kind: 'income', source: 'inferred', inferred: true, entityId: null });
    }
    assumptions.push(`Paycheck from ${payer}: about $${Math.round(g.amount).toLocaleString()} ${g.cadenceLabel}, seen in ${g.count} deposits; not confirmed. Set its pay dates in Money → Settings.`);
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
  //    `type` separates a regular bill from a creditor arrangement, a settlement,
  //    a past-due balance and a one-time payment (Christina 2026-11-03: "I need
  //    to know exactly what must be paid and when"). A past-due balance or a
  //    one-time payment happens once; one whose date has passed is due TODAY,
  //    never dropped — an unpaid bill is still owed.
  for (const o of (data?.recurringObligations || [])) {
    if (!o || o.enabled === false || !o.nextDue) continue;
    // The CASH leaves the account that pays the bill, so the bill is counted in
    // that account's entity; who OWES it is carried as a label (Christina
    // 2026-11-03: "The payment account and the entity responsible for the
    // expense are two different things"). A Poe Properties bill paid from the
    // personal Chase lowers PERSONAL Safe to Spend. With no paying account
    // set, the bill's own entity decides; with neither, it rides Personal
    // (the unassigned pocket) so it is never left out.
    const paidBy = o.accountId && accountEntity.has(o.accountId) ? accountEntity.get(o.accountId) : (o.entityId || null);
    if (!inScope(sc, paidBy)) continue;
    const amount = Number(o.amount) || 0; if (amount <= 0) continue;
    seenPayees.add(payeeKey(o.name || ''));
    const type = OBLIGATION_TYPES.includes(o.type) ? o.type : 'regular';
    const base = { amount: -round2(amount), label: o.name || 'Obligation', kind: 'bill', obligationType: type, category: o.category || 'other', source: 'obligation', refId: o.id, entityId: o.entityId || null, paidByEntityId: paidBy, assumed: false };
    // A separate past-due amount on a regular bill or arrangement is owed now.
    const pastDue = Number(o.pastDue) || 0;
    if (pastDue > 0 && type !== 'past-due') {
      events.push({ ...base, amount: -round2(pastDue), label: `${o.name || 'Obligation'} · past due`, date: isoDay(start), overdue: true, dueDate: null, pastDuePart: true });
    }
    // A separate late charge (a loan's late fee) is owed now, once.
    const lateFees = Number(o.lateFees) || 0;
    if (lateFees > 0) {
      events.push({ ...base, amount: -round2(lateFees), label: `${o.name || 'Obligation'} · late fees`, date: isoDay(start), overdue: true, dueDate: null, pastDuePart: true });
    }
    // When the family plans to pay on a different day than the due date, the
    // cash leaves on the planned day; overdue is still judged by the due date.
    const firstDue = parseDay(o.payOn) || parseDay(o.nextDue);
    if (type === 'past-due' || type === 'one-time' || o.frequency === 'once') {
      if (!firstDue) continue;
      const due = parseDay(o.nextDue) || firstDue;
      const overdue = due < start;
      const at = firstDue < start ? start : firstDue;
      if (at <= end) events.push({ ...base, date: isoDay(at), overdue, dueDate: isoDay(due) });
      continue;
    }
    // A RECURRING payment whose due date passed unpaid is OWED NOW, never rolled
    // to next month (Darrell 2026-11-05: loan 5312 due Oct 25 and 5342 due
    // Oct 29, both unpaid on Nov 5; "Reserve money for unpaid obligations even
    // during the grace period"). Before this, expandOccurrences skipped every
    // date before today, so a missed loan payment left Bills Due and Safe to
    // Spend unless a past-due amount was typed by hand.
    //
    // WHICH records are read that way — the evidence, not a guess:
    //   · a loan with a grace period on file (graceDays): its due dates are
    //     tracked on purpose, so a passed one is owed until a payment is found;
    //   · a bill the family CONFIRMED (verifiedAt) with a due date already in
    //     the past: they said "this was due then" knowing it had passed.
    // Any other record whose nextDue simply went stale (never advanced) keeps
    // the roll-forward: a stale date is not evidence of a missed payment, and
    // it is named so the record gets fixed. Only the LATEST missed cycle is
    // owed now — earlier ones are named, never stacked. The occurrence keeps its
    // own due date so a ledger payment settles it (settleOccurrences matches
    // from the due date) and its grace state is judged against dueDate +
    // graceDays: within the grace period until that day, past it after. A
    // planned pay date on or after today carries the missed payment instead.
    const grace = Number(o.graceDays) > 0 ? Math.floor(Number(o.graceDays)) : null;
    const contractualDue = parseDay(o.nextDue);
    const confirmedOn = parseDay(String(o.verifiedAt || '').slice(0, 10));
    if (contractualDue && contractualDue < start) {
      const name = o.name || 'Obligation';
      const tracked = grace != null || (!!confirmedOn && contractualDue <= confirmedOn);
      const planned = parseDay(o.payOn);
      if (!tracked) {
        assumptions.push(`${name}: its due date on file (${isoDay(contractualDue)}) has passed, so the next one is projected; if that payment is still owed, confirm the bill in Money → Bills → Review.`);
      } else if (planned && planned >= start) {
        // the planned payment date carries it (the expansion below starts there)
      } else {
        const missed = expandOccurrences(contractualDue, o.frequency || 'monthly', contractualDue, addDays(start, -1), 400);
        const due = missed[missed.length - 1];
        if (due) {
          const ev = { ...base, date: isoDay(start), overdue: true, dueDate: isoDay(due), missed: true };
          if (grace != null) { const ends = addDays(due, grace); ev.graceDays = grace; ev.graceEndsOn = isoDay(ends); ev.graceState = start <= ends ? 'in-grace' : 'past-grace'; }
          events.push(ev);
          assumptions.push(`${name}: the payment due ${isoDay(due)} has not been found in the ledger; counted as owed today${grace != null ? ` (grace period ${grace} days, ends ${ev.graceEndsOn})` : ''}. Mark it paid in Bills Due if it was paid another way.`);
        }
        if (missed.length > 1) assumptions.push(`${name}: ${missed.length - 1} earlier due date${missed.length - 1 === 1 ? '' : 's'} also passed (${missed.slice(0, -1).map(isoDay).join(', ')}); only the latest is counted. Update the record, or add a past-due amount if those are still owed.`);
      }
    }
    for (const at of expandOccurrences(firstDue, o.frequency || 'monthly', start, end)) {
      events.push({ ...base, date: isoDay(at), dueDate: isoDay(at) });
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
    // Money moving between the family's own accounts is never income or spend:
    // a pending Cash App transfer landing in Chase is the rent that already
    // arrived in Cash App (Darrell 2026-11-05: "Never count the same money
    // twice"), so it is skipped here like a flagged transfer.
    if (isTransferTxn(t) || isBalanceAdjustment(t) || isOwnAccountTransfer(t.description || '')) continue;
    const amt = Number(t.amount) || 0; if (!amt) continue;
    scheduledKeys.add(payeeKey(t.description || ''));
    events.push({ date: isoDay(d), amount: round2(amt), label: t.description || 'Scheduled', kind: amt > 0 ? 'income' : 'scheduled', category: t.category || null, source: 'ledger', refId: t.id, entityId: acct.entityId ?? null, assumed: false });
  }

  // 3) Minimum debt payments + mortgage P&I/escrow, once each. A mortgage
  //    whose payment is already a confirmed bill (the personal home mortgage,
  //    linkedMortgageId) is that bill and is not walked again here.
  const linkedMortgages = new Set((data?.recurringObligations || []).filter((o) => o && o.enabled !== false && o.linkedMortgageId).map((o) => o.linkedMortgageId));
  const debtDueDays = settings.debtDueDays || {};
  const mortgageDay = Number(settings.mortgageDueDay) || 1;
  let assumedDebtTiming = 0;
  for (const dbt of deriveDebts(data, asOf)) {
    if (!inScope(sc, dbt.entityId)) continue;
    if (seenPayees.has(payeeKey(dbt.name || ''))) continue; // the obligation already carries it
    if (dbt.source === 'rental' && linkedMortgages.has(dbt.rentalId)) continue; // a confirmed bill already carries it
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
      && !isOwnAccountTransfer(t.description || '') // money moved to their own accounts is not a bill (Christina 2026-11-03)
      && inScope(sc, accountEntity.get(t.accountId)) && !!accountsById.get(t.accountId) && SPENDABLE_TYPES.includes(accountsById.get(t.accountId).type));
    const patterns = rows.length ? detectRecurring(rows, { direction: 'out', nowMs: asOf.getTime() }) : [];
    // A payee the family marked "Not a bill" in Money → Bills → Review is left
    // out of every projection; its bank transactions are untouched (Christina
    // 2026-11-05: "Allow me to confirm, correct, or dismiss inferred bills
    // without deleting the original bank transactions"). Before this, "Not a
    // bill" hid the row on the review screen while Safe to Spend still counted it.
    const reviewDismissed = (data?.moneyPlan?.billReview?.dismissed) || {};
    const suggestions = suggestBills(data, asOf);
    const firstWords = (x) => payeeWords(x).slice(0, 2).join(' ');
    const dismissedNames = new Set(suggestions.filter((x) => reviewDismissed[x.key]).map((x) => firstWords(x.name)).filter(Boolean));
    let leftOut = 0;
    // A bill confirmed on the review screen carries the payee exactly as the
    // bank spelled it (paidAs); its guessed twin is dropped so the same
    // payments are never counted twice. Spellings are compared whole, so
    // "Britt and Gaines" never silences "Britt & Gaines".
    const confirmedNames = new Set((data?.recurringObligations || []).filter((o) => o && o.enabled !== false)
      .flatMap((o) => [o.paidAs, o.name, ...(o.alsoPaidAs || [])]).filter(Boolean).map((n) => cleanName(n).toLowerCase()));
    for (const p of patterns) {
      if (decisions[p.key] === 'cancel') continue;
      if (dismissedNames.has(firstWords(p.label))) { leftOut += 1; continue; }
      if (seenPayees.has(p.key) || scheduledKeys.has(p.key)) continue;
      if (confirmedNames.has(cleanName(p.label || '').toLowerCase())) continue;
      if (looksLikeDebtPayment(p.label)) continue; // the debt minimum already carries it
      let next = new Date(p.nextExpected.getFullYear(), p.nextExpected.getMonth(), p.nextExpected.getDate());
      let guard = 0;
      while (next < start && guard++ < 120) next = addDays(next, p.cadenceDays);
      const occ = expandOccurrences(next, cadenceToFrequency(p.cadence), start, end);
      const lastRow = rows.filter((t) => (p.txIds || []).includes(t.id)).sort((a, b) => String(a.date).localeCompare(String(b.date))).pop();
      for (const at of occ) {
        events.push({ date: isoDay(at), amount: -round2(p.amount), label: p.label, kind: 'inferred-bill', source: 'inferred', refId: p.key, entityId: null, assumed: true, cadence: p.cadenceLabel, accountId: lastRow ? lastRow.accountId : null });
      }
      const monthly = round2(p.amount * (DAYS_PER_MONTH / p.cadenceDays));
      inferredMonthly.total = round2(inferredMonthly.total + monthly);
      inferredMonthly.items.push({ key: p.key, label: p.label, monthly });
    }
    if (inferredMonthly.items.length) assumptions.push(`${inferredMonthly.items.length} recurring payment${inferredMonthly.items.length === 1 ? '' : 's'} inferred from the ledger (not confirmed) — confirm or cancel them in Money → Bills.`);

    // 6b) Bills the review screen finds in the family's own payments that the
    //     pass above skips: debt and mortgage payments, collection-agency
    //     arrangements and family obligations paid by Zelle (Christina
    //     2026-11-03: "Make sure all actual bills, debts, payment arrangements,
    //     and my personal mortgage are included"). The pass above assumes a
    //     debt account's minimum carries every debt-looking payment; with no
    //     such account the payment vanished from the projection. Each one is
    //     counted from its own history (median amount, the days it is usually
    //     paid), flagged as not confirmed, and never alongside a confirmed bill,
    //     a debt minimum or a guess above for the same payee.
    const norm = (x) => cleanName(x || '').toLowerCase().slice(0, 40);
    const counted = new Set(events.flatMap((e) => [payeeKey(e.label || ''), norm(e.label)]));
    const debtWords = new Set(events.filter((e) => e.kind === 'debt-min' || e.kind === 'mortgage')
      .flatMap((e) => cleanName(e.label || '').toLowerCase().split(/\W+/).filter((w) => w.length > 3)));
    const debtMins = events.filter((e) => e.kind === 'debt-min' || e.kind === 'mortgage').map((e) => -Number(e.amount)).filter((m) => m > 0);
    let added = 0;
    for (const s of suggestions) {
      if (!['home-mortgage', 'arrangement', 'past-due', 'family', 'rental', 'business', 'household'].includes(s.group)) continue; // never a transfer between own accounts
      if (decisions[s.key] === 'cancel') continue;
      if (reviewDismissed[s.key]) { leftOut += 1; continue; }
      const key = payeeKey(s.name || '');
      if (counted.has(key) || counted.has(norm(s.name)) || seenPayees.has(key) || scheduledKeys.has(key)) continue;
      if (confirmedNames.has(cleanName(s.name || '').toLowerCase())) continue;
      if (cleanName(s.name || '').toLowerCase().split(/\W+/).some((w) => w.length > 3 && debtWords.has(w))) continue; // a debt minimum already carries it
      if (looksLikeDebtPayment(s.name) && debtMins.some((m) => Math.abs(m - Number(s.amount)) <= m * 0.05)) continue; // an autopay of that debt's minimum
      const acct = accountsById.get(s.accountId);
      if (!acct || !SPENDABLE_TYPES.includes(acct.type) || !inScope(sc, accountEntity.get(s.accountId))) continue;
      const amount = Number(s.amount) || 0; if (!(amount > 0)) continue;
      const rhythm = historyOccurrences(s, start, end);
      for (const at of rhythm.dates) {
        events.push({ date: isoDay(at), amount: -round2(amount), label: s.name, kind: 'inferred-bill', obligationType: s.group === 'arrangement' ? 'arrangement' : (s.group === 'past-due' ? 'past-due' : null), source: 'inferred', refId: s.key, entityId: null, assumed: true, cadence: rhythm.cadence, accountId: s.accountId || null });
      }
      counted.add(key); counted.add(norm(s.name));
      const monthly = round2(amount * rhythm.perMonth);
      inferredMonthly.total = round2(inferredMonthly.total + monthly);
      inferredMonthly.items.push({ key: s.key, label: s.name, monthly });
      added += 1;
    }
    if (leftOut) assumptions.push(`${dismissedNames.size} payee${dismissedNames.size === 1 ? '' : 's'} you marked "Not a bill" left out of the projection (the bank transactions are kept).`);
    if (added) assumptions.push(`${added} more bill${added === 1 ? '' : 's'} seen in your own payments (debt, mortgage, arrangement or family payments) counted on the days they are usually paid; not confirmed — confirm them in Money → Bills → Review.`);
  }

  // 6c) ONE PROJECTION PER OBLIGATION (Christina 2026-11-05: BG & Mom $750 on
  //     the 4th and again on the 5th; "Detect possible duplicate obligations,
  //     even when their inferred due dates differ by one or two days"). Two
  //     projections of the same payee, within 5% of the same amount, no more
  //     than 3 days apart are one payment: it is counted once and the other is
  //     listed as a possible duplicate, never silently dropped. A confirmed bill
  //     beats a guess; a creditor arrangement beats a regular bill for the same
  //     creditor (never counted through both); otherwise the earlier one stays.
  const duplicates = [];
  const rank = (e) => (e.source === 'obligation' ? (e.obligationType === 'arrangement' || e.obligationType === 'settlement' ? 0 : 1) : (e.kind === 'inferred-bill' ? 3 : 2));
  const outs = events.filter((e) => e.amount < 0 && ['bill', 'inferred-bill', 'scheduled'].includes(e.kind) && !e.pastDuePart)
    .sort((a, b) => rank(a) - rank(b) || a.date.localeCompare(b.date));
  const kept = [];
  const dropped = new Set();
  for (const e of outs) {
    const twin = kept.find((k) => k.refId !== e.refId || k.source !== e.source ? samePayment(k, e) : false);
    if (twin) { dropped.add(e); duplicates.push({ date: e.date, label: e.label, amount: round2(-e.amount), kind: e.kind, duplicateOf: { date: twin.date, label: twin.label, kind: twin.kind }, refId: e.refId }); }
    else kept.push(e);
  }
  // 6d) A GUESSED bill dated on or before the day its account was last checked
  //     against the bank is already inside that bank balance (the check is the
  //     end-of-day balance): paid and cleared, never subtracted again (Christina
  //     2026-11-05: "Only subtract unpaid obligations that are actually due after
  //     that balance's effective date"). A confirmed bill keeps its own paid /
  //     overdue logic below, so a legitimate unpaid bill is never removed.
  const checks = latestCheckpoints(data, asOf);
  const inBalance = [];
  const live = [];
  for (const e of events) {
    if (dropped.has(e)) continue;
    const cp = e.kind === 'inferred-bill' && e.accountId ? checks[e.accountId] : null;
    if (cp && cp.basis !== 'provisional' && e.date <= cp.day) { inBalance.push({ ...e, key: occurrenceKey(e), settled: 'in-bank-balance', bankCheckedOn: cp.day, paidSoFar: round2(-e.amount), remaining: 0 }); continue; }
    live.push(e);
  }
  if (duplicates.length) assumptions.push(`${duplicates.length} possible duplicate${duplicates.length === 1 ? '' : 's'} counted once (the same payee and amount projected within 3 days): ${[...new Set(duplicates.map((x) => x.label))].slice(0, 3).join(', ')}.`);

  // 7) SETTLED OCCURRENCES (DEFECT-1, GAP-1; Christina 2026-10-29: "I do not
  //    want incorrect calculations influencing my financial decisions").
  const settledOut = settleOccurrences(live, data, asOf);
  assumptions.push(...settledOut.assumptions);
  return { events: settledOut.events, assumptions, inferredMonthly, settled: [...inBalance, ...settledOut.settled], duplicates, waitingOnLedger: settledOut.waitingOnLedger };
}

// The words that name a payee, without the bank's noise (Zelle codes, "Online
// Payment To", card suffixes): "ZELLE PAYMENT TO BG & MOM JPM99D23RK9R" and
// "Zelle to BG & Mom" both read "bg and mom".
const PAYEE_NOISE = new Set(['zelle', 'payment', 'payments', 'pymt', 'pmt', 'to', 'from', 'online', 'sent', 'cash', 'app', 'debit', 'purchase', 'web', 'id', 'paypal', 'billpay', 'autopay', 'ach', 'ppd', 'ccd', 'the']);
export function payeeWords(text) {
  return String(text || '').toLowerCase().replace(/&amp;/g, '&').replace(/&/g, ' and ').replace(/[^a-z\s]/g, ' ')
    .split(/\s+/).filter((w) => w.length > 1 && !PAYEE_NOISE.has(w));
}
function samePayment(a, b) {
  // Two bills the family CONFIRMED are both kept (two real bills to one payee
  // are legitimate), except a creditor arrangement and a regular bill for the
  // same creditor: the arrangement is how that bill is being paid.
  if (a.source === 'obligation' && b.source === 'obligation') {
    const arr = (e) => e.obligationType === 'arrangement' || e.obligationType === 'settlement';
    if (arr(a) === arr(b)) return false;
  }
  const x = payeeWords(a.label).slice(0, 2).join(' ');
  const y = payeeWords(b.label).slice(0, 2).join(' ');
  if (!x || x.length < 3 || x !== y) return false;
  const p = -a.amount; const q = -b.amount;
  if (Math.abs(p - q) > Math.max(p, q) * 0.05) return false;
  // Two GUESSES of one payee from the two passes are one payment inside half
  // its cycle (the same subscription read as the 7th and the 12th); anything
  // confirmed is matched within 3 days, so two real bills are never merged.
  const guesses = a.kind === 'inferred-bill' && b.kind === 'inferred-bill';
  const cycle = (e) => { const c = String(e.cadence || ''); return c === 'weekly' ? HALF_CYCLE_DAYS.weekly : (/2 weeks|two weeks|twice/.test(c) ? HALF_CYCLE_DAYS.biweekly : HALF_CYCLE_DAYS.monthly); };
  const days = guesses ? Math.min(cycle(a), cycle(b)) : 3;
  return Math.abs(parseDay(a.date) - parseDay(b.date)) <= days * 86400000;
}

// When a bill seen only in past payments is due next, from its real rhythm:
//   * paid about every two weeks (the usual gap 12–16 days, 3+ payments):
//     every 14 days from the day it was last paid;
//   * twice a month: its usual day and a second day at least 10 days away
//     (a payment that wobbles from the 5th to the 7th is ONE payment);
//   * otherwise monthly on its usual day.
// A date whose payment was already made early (the last payment falls inside
// that date's own cycle) is not projected again.
export function historyOccurrences(s, start, end) {
  const ev = (s && s.evidence) || {};
  const last = parseDay(ev.lastPaid);
  const gap = Number(ev.gapDays) || 0;
  if (last && (ev.dates || []).length >= 3 && gap >= 12 && gap <= 16) {
    let next = addDays(last, 14);
    while (next < start) next = addDays(next, 14);
    const dates = [];
    for (let at = next; at <= end; at = addDays(at, 14)) dates.push(at);
    return { dates, cadence: 'every two weeks', perMonth: DAYS_PER_MONTH / 14 };
  }
  const all = ev.days && ev.days.length ? ev.days : [ev.usualDay || 1];
  const days = [all[0]];
  if (s.frequency === 'semimonthly') {
    const apart = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 30 - d); };
    const second = all.find((d) => apart(d, all[0]) >= 10);
    if (second) days.push(second);
  }
  const half = days.length > 1 ? HALF_CYCLE_DAYS.semimonthly : HALF_CYCLE_DAYS.monthly;
  const dates = [];
  for (const day of days) {
    const anchor = new Date(start.getFullYear(), start.getMonth(), Math.min(day, new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()));
    const first = anchor < start ? addMonthsClamped(anchor, 1, day) : anchor;
    for (const at of expandOccurrences(first, 'monthly', start, end)) {
      if (last && last >= addDays(at, -half)) continue; // already paid for this cycle
      dates.push(at);
    }
  }
  dates.sort((a, b) => a - b);
  return { dates, cadence: days.length > 1 ? 'twice a month' : 'monthly', perMonth: days.length };
}

// ── what has already been paid (DEFECT-1, GAP-1) ──────────────────────────────
// The walk starts from LEDGER cash, so the only question for a bill occurrence is
// whether its money has already left that cash:
//   * a payment to the same payee is in the ledger, dated today or earlier and
//     inside the occurrence's own cycle (no earlier than half a cycle before its
//     due date): that much is already gone from cash, so that much leaves the
//     projection. All of it -> the occurrence is settled; part of it -> only the
//     remainder is projected (a partial payment). Each ledger row pays once.
//   * the family marked it PAID (Money -> Bills) but no such payment is in the
//     ledger yet: the cash shown still includes that money, so the occurrence
//     STAYS counted until the payment posts -- removing it would count money the
//     balance has not lost yet (Safe to Spend would read HIGH). Said so, by name.
//   * PAID OUTSIDE (from an account these books do not hold) or CANCELED: the
//     money never touches these balances, so the occurrence leaves.
//   * PARTLY PAID OUTSIDE with an amount: that amount leaves; the rest stays.
// Matching is automatic for hand-entered obligations (a named payee); a debt
// minimum, tax item or inferred bill is settled only by the family's own status.
const HALF_CYCLE_DAYS = { weekly: 3, biweekly: 7, semimonthly: 7, monthly: 15, quarterly: 45, semiannual: 90, annual: 180, yearly: 180 };
// What kind of obligation a hand-entered bill is. Order is the order shown.
export const OBLIGATION_TYPES = ['regular', 'arrangement', 'settlement', 'past-due', 'one-time'];
export const OBLIGATION_TYPE_LABEL = {
  regular: 'Regular monthly bill',
  arrangement: 'Creditor payment arrangement',
  settlement: 'Settlement',
  'past-due': 'Past-due balance (due now)',
  'one-time': 'One-time payment',
};

export const BILL_STATUSES = ['scheduled', 'paid', 'paid-outside', 'partial-outside', 'canceled', 'overdue', 'needs-review'];
export function occurrenceKey(ev) { return `${ev.refId || ev.label}:${ev.date}`; }
function samePayee(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 4 && long.startsWith(short + ' ');
}
export function settleOccurrences(events, data, asOf) {
  const statuses = (data && data.moneyPlan && data.moneyPlan.billStatus) || {};
  const obligationsById = new Map((data?.recurringObligations || []).map((o) => [o.id, o]));
  const debits = (data?.transactions || [])
    .filter((t) => t && t.date && Number(t.amount) < 0 && !isTransferTxn(t) && !isBalanceAdjustment(t))
    .map((t) => ({ id: t.id, d: parseDay(t.date), key: payeeKey(t.description || ''), left: -Number(t.amount) }))
    .filter((x) => x.d && x.d <= asOf)
    .sort((a, b) => a.d - b.d);
  const out = []; const settled = []; const waiting = [];
  for (const ev of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    if (!(ev.amount < 0)) { out.push(ev); continue; }
    const key = occurrenceKey(ev);
    const note = statuses[key] || null;
    const due = round2(-ev.amount);
    if (note && (note.status === 'paid-outside' || note.status === 'canceled')) {
      settled.push({ ...ev, key, settled: note.status, paidSoFar: note.status === 'canceled' ? 0 : due, remaining: 0 });
      continue;
    }
    let paid = 0; const ledgerIds = [];
    if (note && note.status === 'partial-outside') paid = Math.min(due, Math.max(0, Number(note.paid) || 0));
    if (ev.source === 'obligation') {
      const o = obligationsById.get(ev.refId);
      const half = HALF_CYCLE_DAYS[(o && o.frequency) || 'monthly'] ?? 15;
      // A missed occurrence is dated today but was DUE earlier; the payment
      // window opens half a cycle before the due date, not before today.
      const from = addDays(parseDay(ev.dueDate || ev.date), -half);
      const k = payeeKey((o && o.name) || ev.label || '');
      for (const x of debits) {
        if (paid >= due - 0.005) break;
        if (x.left <= 0.005 || x.d < from || !samePayee(x.key, k)) continue;
        const take = Math.min(x.left, due - paid);
        x.left = round2(x.left - take); paid = round2(paid + take); ledgerIds.push(x.id);
      }
    }
    paid = round2(paid);
    if (paid >= due - 0.005) {
      settled.push({ ...ev, key, settled: ledgerIds.length ? 'paid-in-ledger' : 'partial-outside', paidSoFar: due, remaining: 0, ledgerIds });
      continue;
    }
    const markedPaid = !!(note && note.status === 'paid');
    if (markedPaid) waiting.push(ev.label);
    if (paid > 0) {
      out.push({ ...ev, key, amount: -round2(due - paid), fullAmount: -due, paidSoFar: paid, remaining: round2(due - paid), partial: true, ledgerIds, markedPaid });
      continue;
    }
    out.push(markedPaid ? { ...ev, key, markedPaid: true } : ev);
  }
  const assumptions = [];
  if (waiting.length) assumptions.push(`${waiting.length} bill${waiting.length === 1 ? ' is' : 's are'} marked paid but the payment is not in the ledger yet (${[...new Set(waiting)].slice(0, 3).join(', ')}): still counted, because the balance here has not lost that money yet. It drops off by itself when the payment posts.`);
  return { events: out.sort((a, b) => a.date.localeCompare(b.date)), settled, waitingOnLedger: waiting.length, assumptions };
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

// Everyday spending measured from the ledger: the last 90 days of money out of
// spendable accounts in scope, through the newest ledger row (a ledger that
// stops early is not read as spending nothing), per month of 30.44 days.
// Leaves out transfers, balance checks, debt payments and every payee already
// counted as a dated item (countedNames: cleaned, lower-case, 40 chars).
export function measuredEverydaySpending(data, sc, asOf, countedNames = new Set()) {
  const accountsById = new Map((data?.accounts || []).map((a) => [a.id, a]));
  const from = isoDay(addDays(asOf, -90));
  const rows = (data?.transactions || []).filter((t) => {
    if (!t || !(Number(t.amount) < 0) || isTransferTxn(t) || isBalanceAdjustment(t)) return false;
    const day = String(t.date || '').slice(0, 10);
    if (day < from || day > isoDay(asOf)) return false;
    const a = accountsById.get(t.accountId);
    if (!a || !SPENDABLE_TYPES.includes(a.type) || a.inLegal || !inScope(sc, a.entityId ?? null)) return false;
    const cat = String(t.category || '');
    if (cat === 'transfer' || cat === 'debt-payment') return false;
    if (isOwnAccountTransfer(t.description || '')) return false;
    return !countedNames.has(cleanName(t.description || '').toLowerCase().slice(0, 40));
  });
  // A payment of $500 or more to a payee seen only once in the window (a county
  // tax bill, tuition, a trip) is not everyday spending: spreading it over
  // every month would hold back money that is not going anywhere. It is listed.
  const seen = new Map();
  for (const t of rows) { const k = cleanName(t.description || '').toLowerCase(); seen.set(k, (seen.get(k) || 0) + 1); }
  const oneOffs = rows.filter((t) => -Number(t.amount) >= 500 && seen.get(cleanName(t.description || '').toLowerCase()) === 1);
  const everyday = rows.filter((t) => !oneOffs.includes(t));
  if (!everyday.length) return null;
  const through = rows.map((t) => String(t.date).slice(0, 10)).sort().pop();
  const days = Math.max(1, daysBetween(parseDay(from), parseDay(through)) + 1);
  const total = everyday.reduce((s, t) => s - Number(t.amount), 0);
  return {
    monthly: round2(total / days * DAYS_PER_MONTH), days, through, rows: everyday.length,
    oneOffs: oneOffs.map((t) => ({ date: String(t.date).slice(0, 10), label: cleanName(t.description || ''), amount: round2(-Number(t.amount)) })),
  };
}

// ── undated reserves, accrued daily ──────────────────────────────────────────
export function monthlyAccruals(data, sc, start, end, settings = {}, opts = {}) {
  const out = { living: 0, livingParts: {}, tax: 0, savings: 0, notes: [] };
  const sampleOutflows = isSampleOutflows(data?.outflows) && !isSampleHousehold(data);
  const outflows = sampleOutflows ? {} : (data?.outflows || {});
  if (sampleOutflows && sc.kind !== 'business') {
    // The figures on file are the shipped sample household's, never the
    // family's. Everyday spending is MEASURED from the family's own last 90
    // days instead: money out of spendable accounts in scope, leaving out
    // transfers between their own accounts, balance checks, and every payment
    // already counted as a dated bill (so nothing is counted twice).
    const measured = measuredEverydaySpending(data, sc, start, opts.countedNames || new Set());
    if (measured) {
      out.livingParts.household = measured.monthly; out.living += measured.monthly;
      out.notes.push(`The household figures on file are the app's sample, not yours, so everyday spending is measured from your own payments instead: $${Math.round(measured.monthly).toLocaleString()}/mo over the ${measured.days} days to ${measured.through} (bills, transfers between your own accounts and debt payments left out)${measured.oneOffs.length ? `; ${measured.oneOffs.length} one-time payment${measured.oneOffs.length === 1 ? '' : 's'} of $500 or more not spread over the month (largest: ${measured.oneOffs.slice().sort((a, b) => b.amount - a.amount).slice(0, 3).map((o) => `${o.label} $${Math.round(o.amount).toLocaleString()}`).join(', ')})` : ''}.`);
    } else {
      out.notes.push('The household figures on file are the app’s sample, not yours, and there is no recent spending in your records to measure, so no everyday spending is reserved.');
    }
  }
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
  // Inferred recurring payments are carved out of the household figure so they
  // count once (a MEASURED figure already leaves them out).
  const carve = sampleOutflows ? 0 : Math.min(out.livingParts.household || 0, Number(opts.inferredMonthlyTotal) || 0);
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
// What is due in the next 7 and 14 days, whatever period the card is set to:
// bills, overdue items, creditor arrangements and settlements, and expected
// income, each with the items that make it up (every number can be opened).
function comingUp(data, sc, start, settings, opts) {
  const end14 = addDays(start, 14);
  const end7 = addDays(start, 7);
  const ob = obligationEvents(data, sc, start, end14, settings, { asOf: start, goals: opts.goals, recurringDecisions: opts.recurringDecisions });
  const inc = incomeEvents(data, sc, addDays(start, 1), end14, settings, start);
  const out = ob.events.filter((e) => e.amount < 0);
  const pick = (xs) => ({ total: round2(xs.reduce((s, e) => s - e.amount, 0)), items: xs.map((e) => ({ date: e.date, label: e.label, amount: round2(-e.amount), kind: e.kind, status: billStatusOf(e), obligationType: e.obligationType || null, overdue: !!e.overdue, dueDate: e.dueDate || null, graceState: e.graceState || null, graceEndsOn: e.graceEndsOn || null, assumed: !!e.assumed, inferred: e.kind === 'inferred-bill', entityId: e.source === 'obligation' ? (e.entityId || null) : undefined, paidByEntityId: e.paidByEntityId })) });
  const in7 = out.filter((e) => e.date <= isoDay(end7));
  // What is NOT subtracted, shown beside what is: payments already paid and
  // cleared (in the ledger, marked paid outside, or inside the bank-checked
  // balance) and the possible duplicates counted once.
  const last14 = isoDay(end14);
  const cleared = (ob.settled || []).filter((e) => e.date <= last14 && e.settled !== 'canceled')
    .map((e) => ({ date: e.date, label: e.label, amount: round2(e.paidSoFar != null ? e.paidSoFar : -e.amount), how: e.settled, bankCheckedOn: e.bankCheckedOn || null }));
  const dupes = (ob.duplicates || []).filter((e) => e.date <= last14);
  return {
    cleared: { total: round2(cleared.reduce((a, e) => a + e.amount, 0)), items: cleared },
    duplicates: { total: round2(dupes.reduce((a, e) => a + e.amount, 0)), items: dupes },
    next7: pick(in7),
    next14: pick(out),
    overdue: pick(out.filter((e) => e.overdue)),
    arrangements: pick(out.filter((e) => e.obligationType === 'arrangement' || e.obligationType === 'settlement')),
    income14: { total: round2(inc.events.reduce((s, e) => s + e.amount, 0)), items: inc.events.map((e) => ({ date: e.date, label: e.label, amount: round2(e.amount), inferred: !!e.inferred })) },
  };
}

// The five states a bill in Bills Due can be in (Christina 2026-11-05): paid
// and cleared (never in these lists; see windows.cleared), pending (marked paid
// but not posted yet, or scheduled in the register), overdue, confirmed
// upcoming (a bill, debt minimum, mortgage or tax item on file), and inferred
// from transaction history (not confirmed).
export const BILL_DUE_STATUS_LABEL = {
  'in-grace': 'Due, unpaid — within the grace period',
  'past-grace': 'Past the grace period',
  overdue: 'Overdue',
  pending: 'Pending',
  confirmed: 'Confirmed upcoming',
  inferred: 'Inferred from history, not confirmed',
};
export function billStatusOf(e) {
  // A loan with a grace period on file: within it, or past it (both still owed).
  if (e.graceState) return e.graceState;
  if (e.overdue) return 'overdue';
  if (e.markedPaid || e.kind === 'scheduled') return 'pending';
  if (e.kind === 'inferred-bill') return 'inferred';
  return 'confirmed';
}

// How much can go to EXTRA debt payments today without any projected balance
// in the next 30 days dropping below the cushion: the smaller of Safe to Spend
// for the chosen period and for 30 days. Never more than Safe to Spend.
export function extraDebtCapacity(data, opts = {}) {
  const chosen = buildSafeToSpend(data, opts);
  const month = buildSafeToSpend(data, { ...opts, period: '30d' });
  const amount = round2(Math.max(0, Math.min(chosen.safeToSpendNow, month.safeToSpendNow)));
  return {
    amount,
    status: chosen.status === 'unavailable' || month.status === 'unavailable' ? 'unavailable' : (chosen.status === 'verified' && month.status === 'verified' ? 'verified' : 'estimate'),
    chosen: { label: chosen.period.label, safe: chosen.safeToSpendNow, lowest: chosen.lines.projectedLowest },
    month: { label: month.period.label, safe: month.safeToSpendNow, lowest: month.lines.projectedLowest },
  };
}

// A bank check older than this no longer counts as current.
export const CHECKPOINT_FRESH_DAYS = 14;

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
  // VERIFIED CASH ONLY (Christina 2026-11-03: "Use verified balances for
  // calculations. Do not include unverified balances from other accounts as
  // available cash"). Once any spendable account in scope has a bank check, the
  // unchecked ones are left out of available cash and reported beside it. With
  // none checked yet, the ledger total is used and the result is an estimate.
  const checked = latestCheckpoints(data, asOf);
  const anyChecked = spendable.some((a) => checked[a.id]);
  const balanceOf = (a) => (balances[a.id] != null ? balances[a.id] : (Number(a.balance) || 0));
  const balanceSources = spendable.map((a) => {
    const cp = checked[a.id];
    // A PROVISIONAL balance is the family's own approximate figure ("about
    // $6,000"): it replaces the ledger's arithmetic as the cash figure, but it
    // is never a bank check (Christina 2026-11-03: "Use my approximately
    // $6,000 figure only as a provisional amount until I provide the exact
    // current balance").
    const provisional = !!cp && cp.basis === 'provisional';
    return {
      id: a.id, name: a.name || a.id,
      balance: balanceOf(a),
      verifiedOn: cp && !provisional ? cp.day : null, verifiedBalance: cp && !provisional ? cp.balance : null, basis: cp ? cp.basis : null,
      verifiedDaysAgo: cp && !provisional ? daysBetween(parseDay(cp.day), asOf) : null,
      provisional, provisionalOn: provisional ? cp.day : null,
      counted: anyChecked ? !!cp : true,
    };
  });
  const availableCash = round2(balanceSources.filter((b) => b.counted).reduce((s, b) => s + b.balance, 0));
  const unverifiedExcluded = round2(balanceSources.filter((b) => !b.counted).reduce((s, b) => s + b.balance, 0));
  const investments = round2((data?.accounts || []).filter((a) => a.type === 'investment' && !a.inLegal && inScope(sc, a.entityId)).reduce((s, a) => s + (balances[a.id] || 0), 0));
  const freshness = ledgerFreshness(data, sc, asOf, settings);

  const income = incomeEvents(data, sc, start, end, settings, asOf);
  const obligations = obligationEvents(data, sc, start, end, settings, { asOf, goals: opts.goals, recurringDecisions: opts.recurringDecisions });
  const countedNames = new Set([...obligations.events.filter((e) => e.amount < 0), ...(obligations.settled || [])].map((e) => cleanName(e.label || '').toLowerCase().slice(0, 40)));
  const accrual = monthlyAccruals(data, sc, start, end, settings, { inferredMonthlyTotal: obligations.inferredMonthly.total, goals: opts.goals, goalMeta: opts.goalMeta || data?.moneyPlan?.goalMeta, countedNames });
  assumptions.push(...income.assumptions, ...obligations.assumptions, ...accrual.notes);
  // Each entity keeps its OWN reserve when one is set (settings.reserveByEntity,
  // keyed by scope id: 'personal' or the entity's id); otherwise the household
  // reserve, as before.
  const reserves = settings.reserveByEntity || {};
  // Every personal pocket (the Personal view, the Personal row of the combined
  // view) reads ONE key, 'personal', so the reserve she sets is the reserve
  // every Money screen uses.
  const hasKey = (k) => reserves[k] != null && reserves[k] !== '';
  const ownReserve = sc.kind === 'personal' ? (hasKey('personal') ? reserves.personal : (hasKey(sc.id) ? reserves[sc.id] : undefined)) : (hasKey(sc.id) ? reserves[sc.id] : undefined);
  const hasOwnReserve = ownReserve != null && ownReserve !== '' && Number.isFinite(Number(ownReserve));
  const minCushion = round2(hasOwnReserve ? Number(ownReserve) : (settings.minCushion != null && settings.minCushion !== '' ? Number(settings.minCushion) : (Number(data?.meta?.bufferTarget) || 0)));
  const windows = comingUp(data, sc, start, settings, opts);
  windows.reserveSource = hasOwnReserve ? 'entity' : 'household';

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
  // NOTHING IS SPENDABLE UNTIL THE CASH IS RECONCILED (Christina 2026-11-03:
  // "If the actual bank balance is unknown or unverified, DO NOT display a
  // positive Safe-to-Spend amount as though it is accurate ... display SAFE TO
  // SPEND: $0, STATUS: UNVERIFIED — RECONCILIATION REQUIRED"). The projection
  // still runs and stays visible as `unreconciledSafe`, labeled not usable;
  // only the spendable figure is held at $0 while any counted account lacks a
  // bank check within CHECKPOINT_FRESH_DAYS (a provisional figure is not one).
  const notReconciled = balanceSources.filter((b) => b.counted && (!b.verifiedOn || b.verifiedDaysAgo > CHECKPOINT_FRESH_DAYS));
  const reconciliationRequired = spendable.length > 0 && notReconciled.length > 0;
  const unreconciledSafe = round2(Math.max(0, lowest.amount - minCushion));
  const safeToSpendNow = reconciliationRequired ? 0 : unreconciledSafe;
  const shortfall = round2(Math.max(0, minCushion - lowest.amount));
  const nextIncome = income.events.filter((e) => e.date > isoDay(asOf)).sort((a, b) => a.date.localeCompare(b.date))[0] || null;

  let status = 'verified';
  const reasons = [];
  if (!spendable.length) { status = 'unavailable'; reasons.push('No checking, savings or cash account in this scope yet.'); }
  else {
    if (freshness.stale) { status = 'estimate'; reasons.push(freshness.ledgerAsOf ? `The ledger's newest entry is ${freshness.staleDays} days old (older than ${freshness.staleAfter}).` : 'No ledger entries on the spendable accounts yet.'); }
    if (income.events.some((e) => e.inferred)) { if (status === 'verified') status = 'estimate'; reasons.push('Some income timing is inferred, not entered.'); }
    if (obligations.events.some((e) => e.assumed && e.kind !== 'inferred-bill')) { if (status === 'verified') status = 'estimate'; reasons.push('Some payment due days are assumed.'); }
    if (obligations.waitingOnLedger) { if (status === 'verified') status = 'estimate'; reasons.push(`${obligations.waitingOnLedger} bill${obligations.waitingOnLedger === 1 ? ' is' : 's are'} marked paid but not in the ledger yet; still counted until the payment posts.`); }
    // VERIFIED MEANS CHECKED AGAINST THE BANK (Christina 2026-11-03: "label Safe
    // to Spend as unverified until we have reconciled current account balances").
    // A ledger total is arithmetic, not a bank balance: the live ledger read
    // $26,428 for an account the bank held at $8,346. So every spendable account
    // needs a recent verified-balance checkpoint before the figure says verified.
    const unchecked = balanceSources.filter((b) => !b.verifiedOn && b.counted);
    const leftOut = balanceSources.filter((b) => !b.counted);
    if (leftOut.length) assumptions.push(`Left out of available cash until checked against the bank: ${leftOut.map((b) => `${b.name} ($${b.balance.toLocaleString()})`).join(', ')}.`);
    const aged = balanceSources.filter((b) => b.counted && b.verifiedOn && b.verifiedDaysAgo > CHECKPOINT_FRESH_DAYS);
    if (unchecked.length) { if (status === 'verified') status = 'estimate'; reasons.push(`Not checked against the bank: ${unchecked.map((b) => b.name).join(', ')}. ${unchecked.length === 1 ? 'Its balance is' : 'These balances are'} the ledger's arithmetic, not a bank figure.`); }
    if (aged.length) { if (status === 'verified') status = 'estimate'; reasons.push(`Last checked against the bank more than ${CHECKPOINT_FRESH_DAYS} days ago: ${aged.map((b) => `${b.name} (${b.verifiedOn})`).join(', ')}.`); }
  }

  const explanation = [
    `Start with ${balanceSources.filter((b) => b.counted).every((b) => b.verifiedOn) ? 'bank-checked' : 'ledger-calculated (not every account bank-checked)'} cash on ${spendable.length} spendable account${spendable.length === 1 ? '' : 's'}: $${availableCash.toLocaleString()}. Every ledger row dated ${isoDay(asOf)} or earlier is already inside this number, so pending rows are not subtracted again.`,
    `Lay out every dated item through ${isoDay(end)}: $${billsDue.toLocaleString()} of bills, $${debtMinimums.toLocaleString()} of minimum debt and mortgage payments, $${taxesDated.toLocaleString()} of dated tax items, $${otherCommitments.toLocaleString()} of other commitments, and $${expectedIncome.toLocaleString()} of expected income on the days it is expected.`,
    `Accrue the undated reserves day by day: $${accrual.living.toLocaleString()}/mo living expenses, $${accrual.tax.toLocaleString()}/mo tax set-aside, $${accrual.savings.toLocaleString()}/mo planned savings.`,
    `The lowest projected balance is $${lowest.amount.toLocaleString()} on ${lowest.date}. Keep the $${minCushion.toLocaleString()} cash cushion: ${lowest.amount - minCushion >= 0 ? `$${unreconciledSafe.toLocaleString()} could be spent today without any projected balance dropping below the cushion${reconciliationRequired ? ' IF the balances were right' : ''}.` : `the cushion is short by $${shortfall.toLocaleString()}, so nothing is safely spendable today.`}`,
  ];
  if (reconciliationRequired) {
    explanation.unshift(`SAFE TO SPEND: $0. UNVERIFIED — RECONCILIATION REQUIRED. Not checked against the bank: ${notReconciled.map((b) => `${b.name} (${b.provisional ? `your approximate $${b.balance.toLocaleString()}` : (b.verifiedOn ? `last checked ${b.verifiedOn}` : `ledger arithmetic $${b.balance.toLocaleString()}`)})`).join(', ')}. Nothing is shown as spendable until every account is checked against the bank.`);
    reasons.unshift(`Reconciliation required: ${notReconciled.map((b) => b.name).join(', ')} not checked against the bank.`);
    if (status === 'verified') status = 'estimate';
  }

  return {
    scope: { id: sc.id, label: sc.label, kind: sc.kind },
    period: { id: period.id, label: period.label, start: isoDay(start), end: isoDay(end), days },
    status, confidence: { level: status, reasons },
    freshness, balanceSources, windows,
    safeToSpendNow, shortfall, overdraftDate, reconciliationRequired, unreconciledSafe,
    lines: {
      availableCash, unverifiedExcluded, investmentsHeldApart: investments, pendingHolds: 0,
      billsDue, debtMinimums, livingExpenses: livingReserved, taxesReserved: taxReserved, savingsReserved,
      minCushion, otherCommitments, expectedIncome,
      projectedLowest: lowest,
      toLowest,
      nextIncome: nextIncome ? { date: nextIncome.date, amount: nextIncome.amount, source: nextIncome.label, inferred: !!nextIncome.inferred } : null,
      potentialDebtPayment: safeToSpendNow,
    },
    monthly: { living: accrual.living, livingParts: accrual.livingParts, tax: accrual.tax, savings: accrual.savings, inferredBills: obligations.inferredMonthly },
    items, timeline, explanation, assumptions,
    settled: obligations.settled || [],
  };
}

function consolidated(data, sc, asOf, settings, opts) {
  const entities = (opts.visibleEntities || data?.entities || []);
  const byEntity = [];
  // The personal pocket is projected ONCE, with the same Personal scope the
  // Overview shows (personal + joint + anything with no entity yet), so a
  // NEEDS REVIEW bill is never dropped from the combined view.
  let personalDone = false;
  for (const e of entities) {
    const personal = !e.type || e.type === 'personal' || e.type === 'joint';
    if (personal && personalDone) continue;
    if (personal) personalDone = true;
    const r = forScope(data, personal ? { ...resolveScope(data, 'personal', entities), id: e.id, label: e.name || 'Personal' } : resolveScope(data, e.id, entities), asOf, settings, opts);
    if (r.status === 'unavailable') continue;
    byEntity.push(r);
  }
  // Accounts with no entity ride with Personal (resolveScope includes them there);
  // if no personal entity exists, show them as their own line.
  if (!entities.some((e) => !e.type || e.type === 'personal' || e.type === 'joint')) {
    const r = forScope(data, { id: 'unassigned', label: 'Unassigned', entityIds: [], includeUnassigned: true, kind: 'personal' }, asOf, settings, opts);
    if (r.status !== 'unavailable') byEntity.push(r);
  }
  // SAFE TO SPEND IS PERSONAL MONEY ONLY, in the combined view too (Christina
  // 2026-11-05: "Business funds must never inflate my personal Safe to Spend
  // amount"; the combined headline read $525, Poe Properties' own spendable,
  // beside Personal's projected shortfall). The headline, its breakdown, the
  // cash line and the due/overdue panel are the PERSONAL pocket's, so they
  // agree with the Personal row of the per-entity table; each business keeps
  // its own figures in that table, never added to hers. The bill list (items,
  // settled) stays combined, tagged by pocket, for Money → Bills.
  const personalPocket = byEntity.find((r) => r.scope.kind === 'personal');
  if (personalPocket) {
    const others = byEntity.filter((r) => r !== personalPocket);
    return {
      ...personalPocket,
      scope: { id: 'consolidated', label: 'All entities', kind: 'consolidated' },
      explanation: [
        `Safe to Spend counts ${personalPocket.scope.label} money only. ${others.length ? `${others.map((r) => `${r.scope.label} ($${r.safeToSpendNow.toLocaleString()} of its own)`).join(', ')} ${others.length === 1 ? 'is' : 'are'} shown per entity and never added to it.` : ''}`.trim(),
        ...personalPocket.explanation,
      ],
      assumptions: [...new Set(byEntity.flatMap((r) => r.assumptions))],
      items: byEntity.flatMap((r) => r.items),
      settled: byEntity.flatMap((r) => r.settled || []),
      byEntity,
    };
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
    safeToSpendNow: safe, shortfall, overdraftDate, reconciliationRequired: byEntity.some((r) => r.reconciliationRequired), unreconciledSafe: round2(byEntity.reduce((s, r) => s + (r.unreconciledSafe || 0), 0)),
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
    settled: byEntity.flatMap((r) => r.settled || []),
    // The combined view lists every entity's bills and income side by side,
    // each item tagged with the pocket it comes out of — a total of what is
    // DUE, never a pool of who may spend what.
    windows: ['next7', 'next14', 'overdue', 'arrangements', 'income14'].reduce((w, k) => {
      const parts = byEntity.map((r) => ({ r, part: (r.windows || {})[k] || { total: 0, items: [] } }));
      w[k] = {
        total: round2(parts.reduce((s, { part }) => s + (Number(part.total) || 0), 0)),
        items: parts.flatMap(({ r, part }) => (part.items || []).map((i) => ({ ...i, scopeId: r.scope.id, scopeLabel: r.scope.label }))).sort((a, b) => String(a.date).localeCompare(String(b.date))),
      };
      return w;
    }, {}),
    balanceSources: byEntity.flatMap((r) => (r.balanceSources || []).map((b) => ({ ...b, scopeLabel: r.scope.label }))),
    byEntity,
  };
}
