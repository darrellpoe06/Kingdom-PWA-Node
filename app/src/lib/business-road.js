// =============================================================================
// business-road — each business's own road to full time, read from its own
// records (DR-1136)
// =============================================================================
// Darrell, 2026-10-20, after the PoeTech card (DR-1135): "Road to full time for
// who? Is this a feature for everyone?" Then: "Their road to full-time?"
//
// The same question, asked by every business that keeps its books here: when
// does this business pay its owner(s) full time, and when can it hire? The
// PoeTech card is typed by hand because PoeTech sells in units (a church, a
// build). A business here already HAS its numbers, so this one starts from
// them:
// - money in and out: the business's own transactions (an entity override, or
//   the account's entity, the same rule as Books -> Transactions), with
//   transfers between the family's own accounts excluded (internal-transfers),
//   averaged over its last complete months that carry records;
// - the work: hours per week on the business's active projects (the statuses
//   the capacity guard counts), turned into hours a month.
// Only what the app does not record is asked: each owner's full-time pay and
// hours, the employer costs, the reserve, the next hire, and how much of the
// recorded costs is ALREADY the owner's pay (there is no owner-draw category,
// so without this the same pay would be counted twice).
//
// Answers are in REVENUE a month, not "how many more", because a business's
// income is not a count of identical units. Two assumptions are stated on the
// screen, not hidden: costs hold where they are as revenue grows, and the work
// grows in step with revenue. Pure and deterministic. NOTHING IS GUESSED
// (DR-0076): no complete month of records, or a blank entry, is named as
// missing and nothing is claimed.
// =============================================================================
import { internalTransferIds, externalTotals } from './internal-transfers.js';
import { PROJECT_STATUSES_ACTIVE } from './opportunity-capacity.js';
import { DEFAULT_RESERVE_PCT } from './church-cost-to-serve.js';
import { HIRE_AT_LOAD_PCT } from './full-time-path.js';

export const DEFAULT_MONTHS = 3;
// How far back to look for months that carry records.
export const LOOKBACK_MONTHS = 12;
export const WEEKS_PER_MONTH = 52 / 12;

const known = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
const num = (v) => Number(v);
const monthKey = (d) => (/^\d{4}-\d{2}/.test(String(d || '')) ? String(d).slice(0, 7) : null);

function previousMonths(now, n) {
  const d = new Date(now);
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth(); // the current month is not complete, so start one back
  const out = [];
  for (let i = 0; i < n; i += 1) {
    m -= 1;
    if (m < 0) { m = 11; y -= 1; }
    out.push(`${y}-${String(m + 1).padStart(2, '0')}`);
  }
  return out; // newest first
}

/** The transactions that belong to this business (Books -> Transactions' rule). */
export function entityTransactions(transactions = [], accounts = [], entityId) {
  const accEntity = new Map((accounts || []).map((a) => [a && a.id, a && a.entityId]));
  return (transactions || []).filter((t) => {
    if (!t) return false;
    if (t.entityOverride) return t.entityOverride === entityId;
    return accEntity.get(t.accountId) === entityId;
  });
}

/**
 * The business's recorded months: money in and out per complete month, and the
 * average over the most recent `months` that carry records (within a year).
 */
export function entityMonthsFromRecords({ transactions = [], accounts = [], entityId, now = Date.now(), months = DEFAULT_MONTHS } = {}) {
  // Transfers are found across the whole ledger: a transfer's other leg may sit
  // in another entity's account.
  const internal = internalTransferIds(transactions, accounts, {});
  const mine = entityTransactions(transactions, accounts, entityId);
  const byMonth = new Map();
  for (const t of mine) {
    const k = monthKey(t.date);
    if (!k) continue;
    const row = { id: t.id, amount: Number(t.amount) || 0, category: t.category, isTransfer: t.isTransfer };
    if (byMonth.has(k)) byMonth.get(k).push(row); else byMonth.set(k, [row]);
  }
  const window = previousMonths(now, LOOKBACK_MONTHS);
  const used = [];
  for (const k of window) {
    if (used.length >= months) break;
    const rows = byMonth.get(k);
    if (!rows || !rows.length) continue; // a month with no records is absent data, not a $0 month
    const tot = externalTotals(rows, internal);
    used.push({ month: k, inCents: Math.round(tot.in * 100), outCents: Math.round(tot.out * 100), count: rows.length });
  }
  const n = used.length;
  return {
    months: used,
    monthsMeasured: n,
    avgInCents: n ? Math.round(used.reduce((s, m) => s + m.inCents, 0) / n) : null,
    avgOutCents: n ? Math.round(used.reduce((s, m) => s + m.outCents, 0) / n) : null,
    transactionCount: mine.length,
  };
}

/** Hours a month the business's active projects take, from their hours a week. */
export function entityWorkHours({ projects = [], entityId } = {}) {
  const active = (projects || []).filter((p) => p && p.entityId === entityId && PROJECT_STATUSES_ACTIVE.includes(p.status));
  const hpw = (p) => parseFloat(p.hoursPerWeek) || 0;
  const perWeek = active.reduce((s, p) => s + hpw(p), 0);
  return {
    hoursPerMonth: Math.round(perWeek * WEEKS_PER_MONTH * 10) / 10,
    projects: active.filter((p) => hpw(p) > 0).map((p) => ({ id: p.id, title: p.title || 'Untitled project', hoursPerWeek: hpw(p) })),
    unhoured: active.filter((p) => hpw(p) <= 0).length,
    activeCount: active.length,
  };
}

/**
 * The road for one business, in revenue a month.
 * people: [{ role, monthlyPayCents, hoursPerMonth }] paid in order.
 * nextHire: { kind: '1099' | 'w2', monthlyPayCents, hoursPerMonth }.
 */
export function businessRoad({
  incomeCents,
  costCents,
  monthsMeasured = 0,
  workHoursPerMonth = 0,
  ownerPayInCostsCents,
  employerCostPct,
  reservePct = DEFAULT_RESERVE_PCT,
  people = [],
  nextHire = null,
} = {}) {
  const missing = [];
  if (!monthsMeasured) missing.push("a complete month of this business's transactions");
  if (!known(ownerPayInCostsCents)) missing.push('owner pay already in these costs');
  if (!known(employerCostPct)) missing.push('employer costs (%)');
  if (!people.length) missing.push('who is going full time');
  people.forEach((p, i) => {
    const who = p.role || `owner ${i + 1}`;
    if (!known(p.monthlyPayCents)) missing.push(`${who}'s full-time pay`);
    if (!known(p.hoursPerMonth)) missing.push(`${who}'s hours a month`);
  });
  if (nextHire) {
    if (!known(nextHire.monthlyPayCents)) missing.push("the next hire's pay");
    if (!known(nextHire.hoursPerMonth)) missing.push("the next hire's hours a month");
  }
  if (missing.length) return { complete: false, missing };

  const r = Math.max(0, num(reservePct) || 0) / 100;
  const income = Math.round(num(incomeCents));
  // Costs the business carries apart from the owners' pay, which is entered below.
  const runCents = Math.max(0, Math.round(num(costCents)) - Math.round(num(ownerPayInCostsCents)));
  const reserveCents = Math.ceil(income * r);
  const forPeopleCents = income - reserveCents - runCents;
  const loaded = (p, pct = employerCostPct) => Math.ceil(Math.round(num(p.monthlyPayCents)) * (1 + num(pct) / 100));
  const hireLoaded = (h) => loaded(h, h.kind === 'w2' ? employerCostPct : 0);

  let left = forPeopleCents;
  let fullTimeCovered = 0;
  for (const p of people) {
    if (left < loaded(p)) break;
    left -= loaded(p);
    fullTimeCovered += 1;
  }
  const payrollCents = people.reduce((s, p) => s + loaded(p), 0);
  const allCovered = fullTimeCovered === people.length;

  // Revenue a month at which a given amount of pay is covered, costs held.
  const revenueFor = (payCents) => (r >= 1 ? null : Math.ceil((runCents + payCents) / (1 - r)));
  let cum = 0;
  const eachFullTimeAtCents = people.map((p) => { cum += loaded(p); return revenueFor(cum); });

  const capacityHours = people.reduce((s, p) => s + num(p.hoursPerMonth), 0);
  const work = Math.max(0, num(workHoursPerMonth) || 0);
  const loadPct = capacityHours > 0 ? Math.round((work / capacityHours) * 100) : null;
  // The work is taken to grow in step with revenue, so the hire is needed at the
  // revenue where the hours reach the 80% line. Without recorded hours or income
  // there is nothing to scale, and that is said rather than guessed.
  const hireNeededAtCents = nextHire && work > 0 && income > 0 && capacityHours > 0
    ? Math.ceil(income * ((HIRE_AT_LOAD_PCT / 100) * capacityHours) / work)
    : null;
  const hireAffordableAtCents = nextHire ? revenueFor(payrollCents + hireLoaded(nextHire)) : null;

  return {
    complete: true,
    missing,
    incomeCents: income,
    runCents,
    reserveCents,
    forPeopleCents,
    payrollCents,
    fullTimeCovered,
    allCovered,
    shortCents: allCovered ? 0 : payrollCents - forPeopleCents,
    leftOverCents: allCovered ? forPeopleCents - payrollCents : 0,
    eachFullTimeAtCents,
    firstFullTimePct: eachFullTimeAtCents[0] ? Math.min(100, Math.round((income / eachFullTimeAtCents[0]) * 100)) : null,
    workHoursPerMonth: work,
    capacityHours,
    loadPct,
    hireNeededAtCents,
    hireAffordableAtCents,
    // Needed before it is paid for: the work outruns the money by this much revenue.
    hireGapCents: hireNeededAtCents !== null && hireAffordableAtCents !== null && hireNeededAtCents < hireAffordableAtCents
      ? hireAffordableAtCents - hireNeededAtCents : 0,
  };
}
