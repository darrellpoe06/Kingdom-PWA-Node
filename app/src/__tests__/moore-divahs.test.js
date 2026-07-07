// @vitest-environment node
// moore-divahs — the Moore Divahs order engine, pinned (DR-0076 proven-to-catch).
// The rules under test are Shay's own (discovery 2026-07-07): money up front,
// the 3-week clock starts at payment, the bulk form kills the Google-Doc,
// the change-order 50% floor with fault attribution, group cap 10 with
// paid-seats-only holds, and honest (null-when-empty) stats.
import { describe, it, expect } from 'vitest';
import {
  MOORE_BRAND, MOORE_POLICIES, ORDER_STAGE_ORDER, orderStageMeta, nextOrderStage,
  stripDisallowedOrderFields, newOrder, moveOrderStage, recordPayment,
  orderDueIso, orderClock, TURNAROUND_DAYS,
  normalizeBulkLine, validateBulkLine, bulkPickList, bulkTotals,
  changeOrderFee, appendChangeOrder, IN_PRODUCTION_FEE_FLOOR_PCT,
  CHANGE_ADMIN_FEE_CENTS, newClassSession, seatsLeft, canBook, CLASS_FORMATS,
  oneOnOneSlotIssue,
  orderStats, classStats, revenueGoalPlan, isSeedOrder, NO_PAYMENT_PROCESSING,
} from '../lib/moore-divahs.js';

const NOW = '2026-07-07T12:00:00.000Z';

describe('brand + binding posture', () => {
  it('Moore Divahs is data, not hardcoding — and never processes payment', () => {
    expect(MOORE_BRAND.label).toBe('Moore Divahs');
    // Her address is sign-in-only (Darrell 2026-07-07) — the brand record must
    // never carry it, so no surface can ever render it.
    expect(MOORE_BRAND.email).toBeUndefined();
    expect(NO_PAYMENT_PROCESSING).toBe(true);
  });
  it('her flyer policies are encoded verbatim in spirit — her words are senior', () => {
    expect(MOORE_POLICIES.noRushOrders).toBe(true);
    expect(MOORE_POLICIES.adjustmentWindowHours).toBe(72);
    expect(MOORE_POLICIES.nonRefundable).toContain('non-refundable');
    expect(MOORE_POLICIES.leadTime).toContain('3-4 weeks');
    expect(MOORE_POLICIES.inspoHerWay).toContain('her way');
    expect(orderStageMeta('ready').label).toContain('final fitting');
  });
  it('card/bank fields are structurally stripped from any payload', () => {
    const clean = stripDisallowedOrderFields({ customerName: 'A', cardNumber: '4111', cvv: '123', bankAccount: 'x' });
    expect(clean.customerName).toBe('A');
    expect(clean.cardNumber).toBeUndefined();
    expect(clean.cvv).toBeUndefined();
    expect(clean.bankAccount).toBeUndefined();
  });
});

describe('pipeline + the 3-week clock', () => {
  it('advancing skips lost stages — progress never means cancelling', () => {
    expect(nextOrderStage('ready')).toBe('delivered');
    expect(nextOrderStage('followed-up')).toBeNull();
    for (const s of ORDER_STAGE_ORDER) expect(orderStageMeta(s).label).toBeTruthy();
  });
  it('no clock before payment — never a painted countdown', () => {
    const o = newOrder({ customerName: 'Dana' }, { now: NOW });
    expect(orderClock(o, { now: NOW }).running).toBe(false);
    expect(orderClock(o, { now: NOW }).daysLeft).toBeNull();
  });
  it('recordPayment locks the order into paid and starts the 21-day clock', () => {
    const o = recordPayment(newOrder({ customerName: 'Dana', quoteCents: 12000 }, { now: NOW }), { method: 'venmo', now: NOW });
    expect(o.stage).toBe('paid');
    expect(o.payMethod).toBe('venmo');
    expect(orderDueIso(o.paidAt)).toBe(new Date(Date.parse(NOW) + TURNAROUND_DAYS * 86400000).toISOString());
    const clock = orderClock(o, { now: NOW });
    expect(clock.running).toBe(true);
    expect(clock.daysLeft).toBe(21);
    expect(clock.overdue).toBe(false);
  });
  it('the clock goes overdue past the due date and stops after delivery', () => {
    const paid = recordPayment(newOrder({}, { now: NOW }), { now: NOW });
    const late = orderClock(paid, { now: '2026-08-07T12:00:00.000Z' });
    expect(late.overdue).toBe(true);
    const delivered = moveOrderStage(paid, 'delivered', { now: '2026-07-20T12:00:00.000Z' });
    expect(orderClock(delivered, { now: '2026-08-07T12:00:00.000Z' }).running).toBe(false);
  });
  it('stage moves append to history (the historical account)', () => {
    let o = newOrder({}, { now: NOW });
    o = moveOrderStage(o, 'designing', { now: NOW });
    o = moveOrderStage(o, 'quoted', { now: NOW });
    expect(o.history.map((h) => h.stage)).toEqual(['inquiry', 'designing', 'quoted']);
  });
});

describe('bulk-apparel lines — the Google-Doc killer', () => {
  it('normalizes a line and caps the roster at qty', () => {
    const l = normalizeBulkLine({ qty: 2, cut: 'youth', size: 'm', color: 'Red', names: ['A', 'B', 'C'] });
    expect(l.size).toBe('M');
    expect(l.color).toBe('red');
    expect(l.names).toEqual(['A', 'B']);
  });
  it('validation catches the real intake mistakes', () => {
    expect(validateBulkLine({ qty: 0, color: 'blue', names: [] }).length).toBeGreaterThan(0);
    expect(validateBulkLine(normalizeBulkLine({ qty: 6, color: 'blue' }))).toEqual([]);
  });
  it('the pick-list reads like Shay asked: qty × cut size · color — names', () => {
    const [line] = bulkPickList([{ qty: 6, cut: 'adult', size: 'M', color: 'blue', names: ['Alicia', 'Dawn'] }]);
    expect(line).toBe('6 × adult M · blue — Alicia, Dawn (+4 unnamed)');
    expect(bulkTotals([{ qty: 6, names: ['A'] }, { qty: 4 }]).pieces).toBe(10);
  });
});

describe('change-order ladder — 50% floor, fault attribution senior', () => {
  it('grace before materials; materials + admin after purchase', () => {
    expect(changeOrderFee({ band: 'before-materials', orderTotalCents: 20000 }).feeCents).toBe(0);
    const f = changeOrderFee({ band: 'materials-bought', orderTotalCents: 20000, materialsCents: 6000 });
    expect(f.feeCents).toBe(6000 + CHANGE_ADMIN_FEE_CENTS);
  });
  it('in production: 50% floor holds — Shay can raise, NEVER lower', () => {
    expect(IN_PRODUCTION_FEE_FLOOR_PCT).toBe(50);
    expect(changeOrderFee({ band: 'in-production', orderTotalCents: 20000 }).feeCents).toBe(10000);
    expect(changeOrderFee({ band: 'in-production', orderTotalCents: 20000, shayPct: 100 }).feeCents).toBe(20000);
    // proven-to-catch: an attempt to undercut the floor is clamped back to it
    expect(changeOrderFee({ band: 'in-production', orderTotalCents: 20000, shayPct: 10 }).feeCents).toBe(10000);
  });
  it('a shop or supplier fault never charges the customer, whatever the stage', () => {
    expect(changeOrderFee({ band: 'in-production', reason: 'shop-error', orderTotalCents: 20000 }).feeCents).toBe(0);
    expect(changeOrderFee({ band: 'materials-bought', reason: 'supplier-issue', materialsCents: 6000 }).feeCents).toBe(0);
  });
  it('after completion there is no change — it is a new order', () => {
    const f = changeOrderFee({ band: 'completed', orderTotalCents: 20000 });
    expect(f.allowed).toBe(false);
    expect(f.feeCents).toBeNull();
  });
  it('appendChangeOrder records the event on the order (the KPI feed)', () => {
    const o = newOrder({ quoteCents: 20000, materialsCents: 6000 }, { now: NOW });
    const { order, entry } = appendChangeOrder(o, { band: 'in-production', reason: 'customer-requested', shayPct: 75, acceptedByCustomer: true, now: NOW });
    expect(order.changeOrders.length).toBe(1);
    expect(entry.feeCents).toBe(15000);
    expect(entry.acceptedByCustomer).toBe(true);
  });
});

describe('classes — cap 10, paid seats only, two-week 1-on-1 lead', () => {
  it('defaults carry Shay\'s prices and the hard cap', () => {
    const g = newClassSession({ format: 'group', dateIso: '2026-08-08T17:00:00.000Z' }, { now: NOW });
    expect(g.priceCents).toBe(4500);
    expect(g.seatCap).toBe(10);
    const s = newClassSession({ format: 'group', seatCap: 25 }, { now: NOW });
    expect(s.seatCap).toBe(10); // the cap is structural — "so I can control the classroom"
    expect(CLASS_FORMATS['one-on-one'].durationHours).toBe(2.5);
  });
  it('only PAID signups hold a seat', () => {
    const sess = newClassSession({ format: 'group', dateIso: '2026-08-08T17:00:00.000Z' }, { now: NOW, id: 'mc-1' });
    const signups = [
      { sessionId: 'mc-1', paidAt: NOW },
      { sessionId: 'mc-1', paidAt: null },   // a promise holds nothing
      { sessionId: 'other', paidAt: NOW },
    ];
    expect(seatsLeft(sess, signups)).toBe(9);
  });
  it('a full class refuses the 11th booking; one-on-one enforces the 14-day lead', () => {
    const sess = newClassSession({ format: 'group', dateIso: '2026-08-08T17:00:00.000Z' }, { now: NOW, id: 'mc-2' });
    const full = Array.from({ length: 10 }, (_, i) => ({ sessionId: 'mc-2', paidAt: NOW, name: `s${i}` }));
    expect(canBook(sess, full, { now: NOW }).ok).toBe(false);
    // Local-constructed slots: the window rule reads the local wall clock,
    // exactly the clock the datetime-local picker writes.
    const one = newClassSession({ format: 'one-on-one', dateIso: new Date(2026, 6, 14, 10, 0).toISOString() }, { now: NOW, id: 'mc-3' });
    expect(canBook(one, [], { now: NOW }).ok).toBe(false); // only 7 days out
    const oneOk = newClassSession({ format: 'one-on-one', dateIso: new Date(2026, 6, 28, 10, 0).toISOString() }, { now: NOW, id: 'mc-4' });
    expect(canBook(oneOk, [], { now: NOW }).ok).toBe(true); // Tue 10 AM, 21 days out
  });
});

describe('one-on-one window — Mon-Fri, 9 AM-1 PM (Shay, priority 2026-07-07)', () => {
  // 2026-07-25 = Saturday, 2026-07-27 = Monday. Dates built with the LOCAL
  // constructor so getDay/getHours see exactly what the picker would write.
  it('weekends are refused; group classes are untouched', () => {
    const sat = new Date(2026, 6, 25, 10, 0).toISOString();
    expect(oneOnOneSlotIssue(sat)).toBe('One-on-one sessions land Monday through Friday.');
    expect(oneOnOneSlotIssue(sat, 'group')).toBeNull();
  });
  it('start time must fall inside 9 AM - 1 PM, boundaries included', () => {
    expect(oneOnOneSlotIssue(new Date(2026, 6, 27, 8, 0).toISOString())).toBe('One-on-one sessions start between 9 AM and 1 PM.');
    expect(oneOnOneSlotIssue(new Date(2026, 6, 27, 9, 0).toISOString())).toBeNull();
    expect(oneOnOneSlotIssue(new Date(2026, 6, 27, 13, 0).toISOString())).toBeNull();
    expect(oneOnOneSlotIssue(new Date(2026, 6, 27, 13, 30).toISOString())).toBe('One-on-one sessions start between 9 AM and 1 PM.');
  });
  it('a missing or garbage date names itself instead of passing', () => {
    expect(oneOnOneSlotIssue('')).toBe('A date and time are required.');
    expect(oneOnOneSlotIssue('not-a-date')).toBe('A date and time are required.');
  });
  it('canBook refuses an out-of-window one-on-one even past the 14-day lead', () => {
    const sat = newClassSession({ format: 'one-on-one', dateIso: new Date(2026, 6, 25, 10, 0).toISOString() }, { now: NOW, id: 'mc-5' });
    expect(canBook(sat, [], { now: NOW })).toEqual({ ok: false, reason: 'One-on-one sessions land Monday through Friday.' });
    const lateMon = newClassSession({ format: 'one-on-one', dateIso: new Date(2026, 6, 27, 15, 0).toISOString() }, { now: NOW, id: 'mc-6' });
    expect(canBook(lateMon, [], { now: NOW }).reason).toBe('One-on-one sessions start between 9 AM and 1 PM.');
  });
});

describe('KPIs — honest history, never painted', () => {
  const paidOrder = (over = {}) => recordPayment(newOrder({ customerName: 'Dana', channel: 'instagram', productType: 'custom-clothing', quoteCents: 10000, materialsCents: 3000, ...over }, { now: NOW }), { now: NOW });
  it('empty history reports nulls, not fake zeros', () => {
    const s = orderStats([]);
    expect(s.avgOrderCents).toBeNull();
    expect(s.repeatRatePct).toBeNull();
    expect(classStats([], []).fillRatePct).toBeNull();
    expect(revenueGoalPlan(100000, {}).hasHistory).toBe(false);
  });
  it('seed rows never inflate the real numbers', () => {
    const s = orderStats([paidOrder(), paidOrder({ seed: true })]);
    expect(s.paidOrders).toBe(1);
    expect(isSeedOrder({ id: 'demo-1' })).toBe(true);
  });
  it('revenue, margin, channel + repeat tracking from real rows', () => {
    const s = orderStats([paidOrder(), paidOrder({ customerName: 'Dana', quoteCents: 6000 }), paidOrder({ customerName: 'Mia', channel: 'whats-going-on-qc' })]);
    expect(s.revenueCents).toBe(26000);
    expect(s.marginCents).toBe(26000 - 9000);
    expect(s.byChannel['whats-going-on-qc']).toBe(10000);
    expect(s.repeatRatePct).toBe(50); // Dana twice, Mia once
    // proven-to-catch: another paid order MUST move revenue
    expect(orderStats([paidOrder()]).revenueCents).toBe(10000);
  });
  it('the goal planner ranks lanes by real per-unit earnings', () => {
    const sessions = [newClassSession({ format: 'group', dateIso: '2026-08-08T17:00:00.000Z' }, { now: NOW, id: 'mc-g' })];
    const signups = Array.from({ length: 8 }, () => ({ sessionId: 'mc-g', paidAt: NOW }));
    const plan = revenueGoalPlan(100000, { orders: [paidOrder()], sessions, signups });
    expect(plan.hasHistory).toBe(true);
    expect(plan.lanes[0].perUnitCents).toBeGreaterThanOrEqual(plan.lanes[plan.lanes.length - 1].perUnitCents);
    expect(plan.lanes.every((l) => l.unitsToGoal > 0)).toBe(true);
  });
});
