// =============================================================================
// door-money — what each door has brought in, with or without a tenant
// (DR-0903, migration 0265)
// =============================================================================
// Darrell, 2026-10-10: "We want the historical money for each property to be
// available... with or without the tenants information... so the door always
// pays... the most important thing is to see how much money is being
// accumulated by each asset." And, on the Rent tab: "How to add payments to
// the historical events?"
//
// The numbers come from door_money_months (0265): one row per door per month
// the money came, computed under the reader's own RLS. Confirmed money is
// RECEIVED; a reported payment nobody confirmed is a claim and is shown beside
// the total, never added into it. A door with nothing on record says so — it
// never shows $0.00 as though it had been counted and found empty (DR-0076).
// =============================================================================
import { PAY_METHODS } from './rent-pay.js';

const money = (n) => Math.round(Number(n || 0) * 100) / 100;

/** The ways the family records money it received: the tenant's ways, and Other. */
export const RECEIVED_METHODS = Object.freeze([
  ...PAY_METHODS.map(({ id, label }) => ({ id, label })),
  { id: 'other', label: 'Other' },
]);

const monthKey = (v) => String(v || '').slice(0, 7);

/**
 * One door's money, from the view's rows. Newest first in every list.
 * `today` fixes "this year" for tests; it defaults to now.
 */
export function doorMoney(rows = [], rentalId, today = new Date()) {
  const mine = (rows || []).filter((r) => r && rentalId && r.rental_id === rentalId && monthKey(r.month));
  const months = mine
    .map((r) => ({
      month: monthKey(r.month),
      received: money(r.received),
      payments: Number(r.payments || 0),
      awaiting: money(r.awaiting),
      awaitingCount: Number(r.awaiting_count || 0),
      withoutTenant: Number(r.without_tenant || 0),
    }))
    .sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0));
  const byYear = new Map();
  for (const m of months) {
    const y = m.month.slice(0, 4);
    const cur = byYear.get(y) || { year: y, received: 0, payments: 0 };
    cur.received = money(cur.received + m.received);
    cur.payments += m.payments;
    byYear.set(y, cur);
  }
  const received = money(months.reduce((s, m) => s + m.received, 0));
  const payments = months.reduce((s, m) => s + m.payments, 0);
  const awaiting = money(months.reduce((s, m) => s + m.awaiting, 0));
  const awaitingCount = months.reduce((s, m) => s + m.awaitingCount, 0);
  const counted = months.filter((m) => m.payments > 0);
  const year = String(today.getFullYear());
  return {
    rentalId,
    known: payments > 0,
    received,
    payments,
    awaiting,
    awaitingCount,
    withoutTenant: months.reduce((s, m) => s + m.withoutTenant, 0),
    thisYear: (byYear.get(year) || { received: 0 }).received,
    firstMonth: counted.length ? counted[counted.length - 1].month : null,
    lastMonth: counted.length ? counted[0].month : null,
    years: [...byYear.values()].sort((a, b) => (a.year < b.year ? 1 : -1)),
    months,
  };
}

/** Every door's money, keyed by rental id, plus the whole portfolio. */
export function moneyByDoor(rows = [], today = new Date()) {
  const ids = [...new Set((rows || []).map((r) => r && r.rental_id).filter(Boolean))];
  const doors = new Map(ids.map((id) => [id, doorMoney(rows, id, today)]));
  const all = [...doors.values()];
  return {
    doors,
    received: money(all.reduce((s, d) => s + d.received, 0)),
    thisYear: money(all.reduce((s, d) => s + d.thisYear, 0)),
    awaiting: money(all.reduce((s, d) => s + d.awaiting, 0)),
    doorsWithMoney: all.filter((d) => d.known).length,
  };
}

const whole = (n) => `$${money(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const dollarsLong = whole;

/** The one line a door card carries. Unknown never reads as zero. */
export function moneyLine(summary) {
  if (!summary || !summary.known) {
    return summary && summary.awaitingCount
      ? `${whole(summary.awaiting)} reported, not yet confirmed`
      : 'no money recorded yet';
  }
  return `${whole(summary.received)} brought in since ${summary.firstMonth}`;
}

/**
 * Check and build the record of money the family RECEIVED: any amount, on
 * the day it actually came (past days are the point; a day not yet come is
 * refused, as 0265 refuses it), for a month, by a way, from someone or not.
 */
export function buildReceivedPayment({ amount, paidOn, period, method, from, note, today }) {
  const errors = {};
  const amt = money(amount);
  if (!(amt > 0)) errors.amount = 'Enter the amount you received.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(paidOn || ''))) errors.paidOn = 'Pick the day it came.';
  else if (today && paidOn > today) errors.paidOn = 'That day has not come yet.';
  const forPeriod = String(period || '').trim() || (paidOn ? String(paidOn).slice(0, 7) : '');
  if (!/^\d{4}-\d{2}$/.test(forPeriod)) errors.period = 'Pick the month it is for.';
  if (!RECEIVED_METHODS.some((m) => m.id === method)) errors.method = 'Pick how it came.';
  const who = String(from || '').trim();
  const words = String(note || '').trim();
  const memo = [who ? `From ${who}` : null, words || null].filter(Boolean).join(' — ').slice(0, 500) || null;
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    row: { amount: amt, paid_on: paidOn || null, for_period: forPeriod || null, method, memo },
  };
}
