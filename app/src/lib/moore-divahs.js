// =============================================================================
// moore-divahs — the Moore Divahs order engine (Shay's fashion business)
// =============================================================================
// Discovery spec: docs/99-session-notes/2026-07-07-moore-divahs-business-system-
// discovery.md (captured live from Shay + Darrell, 2026-07-07). Build board:
// board-moore-divahs (DR-0113). This module is the PURE engine — no React, no
// Supabase, no network. The sync adapter (moore-orders-sync.js) and the surface
// (MooreDivahs.jsx) sit on top of it.
//
// WHAT IT ENCODES (Shay's own rules, verbatim from discovery):
//   * The custom-order pipeline: inquiry → designing → quoted → paid →
//     in-production → ready → delivered → followed-up. Money is UP FRONT; the
//     3-WEEK turnaround clock starts the day the order is PAID.
//   * The structured BULK-APPAREL line items (qty × cut × size × color + the
//     name roster) — the fix for the 20-25-page Google-Doc intake she had to
//     dig through by hand.
//   * The CHANGE-ORDER ladder (Darrell 2026-07-07): once paid, the order is
//     LOCKED; a customer-requested change carries a stage-based fee with a
//     50% FLOOR in production — Shay-variable upward. Fault attribution is
//     structural: a shop/supplier-caused change never charges the customer.
//   * Classes: $45 group (HARD CAP 10 — "so I can control the classroom") /
//     $75 one-on-one (2.5 hours, booked >= 2 weeks out). A seat is held ONLY
//     on recorded payment.
//
// BINDING GUARDRAILS (inherited from the platform):
//   * NO PAYMENT PROCESSING BY US — money is the owner's hand (Square / Venmo /
//     Apple Pay, collected by Shay). The engine records that/when/how a payment
//     happened and computes fees; it never moves money and the shape carries NO
//     card/bank fields (stripDisallowedOrderFields is the structural scrub).
//   * ONE-CRM (DR-0081) — lead ACQUISITION does not live here. Leads ride the
//     shared CRM backbone via a moore pipeline config; this engine begins where
//     a lead converts: the ORDER.
//   * SEED IS NOT REAL — isSeedOrder keeps demo rows out of every stat.
//   * Honest numbers only (DR-0076) — stats return null, not 0%, when empty.
// =============================================================================

const asStr = (v) => (typeof v === 'string' ? v : '');
const asNum = (v, d = 0) => (Number.isFinite(v) ? v : d);
const asArr = (v) => (Array.isArray(v) ? v : []);

// -----------------------------------------------------------------------------
// Brand — Moore Divahs as DATA, not hardcoding (the white-label seam; the same
// record shape a future QC business fills in). Accent reuses the sanctioned
// clay token — no new hex enters the palette.
// -----------------------------------------------------------------------------
export const MOORE_BRAND = {
  key: 'moore-divahs',
  label: 'Moore Divahs',
  owner: 'Shay',
  email: 'mooredivahs1@yahoo.com',
  tagline: 'Custom clothing · scrub caps · custom shoes · sewing classes',
  accent: '#B85838',
  // Values only Shay holds — filled when she provides them (board: md-handles).
  handles: { instagram: null, facebook: null, tiktok: null },
};

// -----------------------------------------------------------------------------
// Order pipeline. `group` drives the board columns + the stats:
//   pre  — before money (inquiry/designing/quoted)
//   work — paid + the 3-week clock running (paid/in-production/ready)
//   done — delivered / followed-up (won)
//   lost — declined / cancelled
// -----------------------------------------------------------------------------
export const ORDER_STAGES = {
  'inquiry':       { label: 'Inquiry',        group: 'pre',  symbol: '○' },
  'designing':     { label: 'Designing',      group: 'pre',  symbol: '◐' },
  'quoted':        { label: 'Quoted',         group: 'pre',  symbol: '◑' },
  'paid':          { label: 'Paid — clock on', group: 'work', symbol: '◉' },
  'in-production': { label: 'In production',  group: 'work', symbol: '◈' },
  'ready':         { label: 'Ready',          group: 'work', symbol: '◆' },
  'delivered':     { label: 'Delivered',      group: 'done', symbol: '✓' },
  'followed-up':   { label: 'Followed up',    group: 'done', symbol: '✦' },
  'declined':      { label: 'Declined',       group: 'lost', symbol: '—' },
  'cancelled':     { label: 'Cancelled',      group: 'lost', symbol: '✕' },
};
export const ORDER_STAGE_ORDER = [
  'inquiry', 'designing', 'quoted', 'paid', 'in-production', 'ready',
  'delivered', 'followed-up', 'declined', 'cancelled',
];
export function orderStageMeta(stage) {
  return ORDER_STAGES[stage] || ORDER_STAGES['inquiry'];
}
export function normalizeOrderStage(stage) {
  return ORDER_STAGES[stage] ? stage : 'inquiry';
}
// Advance to the next non-lost stage (progressing an order never means losing it).
export function nextOrderStage(stage) {
  const i = ORDER_STAGE_ORDER.indexOf(normalizeOrderStage(stage));
  for (let j = i + 1; j < ORDER_STAGE_ORDER.length; j++) {
    if (orderStageMeta(ORDER_STAGE_ORDER[j]).group !== 'lost') return ORDER_STAGE_ORDER[j];
  }
  return null;
}

export const PRODUCT_TYPES = [
  { key: 'custom-clothing', label: 'Custom clothing' },
  { key: 'scrub-cap',       label: 'Scrub cap' },
  { key: 'custom-shoes',    label: 'Custom shoes' },
  { key: 'bulk-apparel',    label: 'Bulk apparel (team/group)' },
  { key: 'other',           label: 'Other custom work' },
];
const PRODUCT_KEYS = new Set(PRODUCT_TYPES.map((p) => p.key));
export function normalizeProductType(t) {
  return PRODUCT_KEYS.has(t) ? t : 'other';
}

// How the customer found her — feeds channel-revenue KPIs. Mirrors (not forks)
// the CRM source vocabulary; whats-going-on-qc + partner-business are hers.
export const ORDER_CHANNELS = ['instagram', 'facebook', 'tiktok', 'email', 'whats-going-on-qc', 'partner-business', 'referral', 'in-person', 'other'];
export function normalizeChannel(c) {
  return ORDER_CHANNELS.includes(c) ? c : 'other';
}

// Money is the owner's hand — these are RECORDS of how Shay collected, never a
// processor integration.
export const PAY_METHODS = ['square', 'venmo', 'apple-pay', 'cash', 'other'];
export const NO_PAYMENT_PROCESSING = true;

// Structural scrub — an order carries contact + garment data only. Card/bank
// fields can never ride in, even smuggled through a form payload.
export const DISALLOWED_ORDER_KEYS = [
  'cardNumber', 'card_number', 'cvv', 'cvc', 'expiry', 'bankAccount', 'bank_account',
  'routingNumber', 'routing_number', 'ssn', 'password', 'pin',
];
export function stripDisallowedOrderFields(payload) {
  const out = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (!DISALLOWED_ORDER_KEYS.includes(k)) out[k] = v;
  }
  return out;
}

// -----------------------------------------------------------------------------
// The 3-week clock — starts at PAYMENT (Shay quotes everyone 3 weeks). Pure,
// `now` injectable. daysLeft is negative when overdue; null before payment
// (no clock is honest, never a painted countdown).
// -----------------------------------------------------------------------------
export const TURNAROUND_DAYS = 21;
const DAY_MS = 86400000;
export function orderDueIso(paidAtIso, turnaroundDays = TURNAROUND_DAYS) {
  const t = Date.parse(paidAtIso || '');
  if (Number.isNaN(t)) return null;
  return new Date(t + turnaroundDays * DAY_MS).toISOString();
}
export function orderClock(order, { now } = {}) {
  const due = orderDueIso(order?.paidAt, order?.turnaroundDays || TURNAROUND_DAYS);
  if (!due) return { running: false, dueAt: null, daysLeft: null, overdue: false };
  const g = orderStageMeta(order?.stage).group;
  if (g === 'done' || g === 'lost') return { running: false, dueAt: due, daysLeft: null, overdue: false };
  const base = now ? Date.parse(now) : Date.now();
  const daysLeft = Math.ceil((Date.parse(due) - base) / DAY_MS);
  return { running: true, dueAt: due, daysLeft, overdue: daysLeft < 0 };
}

// -----------------------------------------------------------------------------
// Bulk-apparel line items — the Google-Doc killer. One line = qty × cut × size
// × color + the roster of names to print. Structured on the way IN, so Shay
// reads "6 adult M blue — Alicia, Dawn, ..." instead of 25 pages of prose.
// -----------------------------------------------------------------------------
export const BULK_CUTS = ['adult', 'youth', 'kids'];
export function normalizeBulkLine(raw = {}) {
  const qty = Math.max(1, Math.round(asNum(raw.qty, 1)));
  return {
    qty,
    cut: BULK_CUTS.includes(raw.cut) ? raw.cut : 'adult',
    size: asStr(raw.size).trim().toUpperCase() || 'M',
    color: asStr(raw.color).trim().toLowerCase() || '',
    names: asArr(raw.names).map((n) => asStr(n).trim()).filter(Boolean).slice(0, qty),
  };
}
export function validateBulkLine(line) {
  const errs = [];
  if (!line || asNum(line.qty, 0) < 1) errs.push('Each line needs a quantity of at least 1.');
  if (line && line.names && line.names.length > line.qty) errs.push('More names than shirts on a line.');
  if (line && !asStr(line.color)) errs.push('Each line needs a color.');
  return errs;
}
// The production pick-list: "6 × adult M · blue — Alicia, Dawn (+4 unnamed)"
export function bulkPickList(lines) {
  return asArr(lines).map(normalizeBulkLine).map((l) => {
    const named = l.names.length;
    const unnamed = l.qty - named;
    const roster = named ? l.names.join(', ') + (unnamed > 0 ? ` (+${unnamed} unnamed)` : '') : `${l.qty} unnamed`;
    return `${l.qty} × ${l.cut} ${l.size} · ${l.color || 'no color set'} — ${roster}`;
  });
}
export function bulkTotals(lines) {
  const norm = asArr(lines).map(normalizeBulkLine);
  return {
    pieces: norm.reduce((s, l) => s + l.qty, 0),
    lines: norm.length,
    named: norm.reduce((s, l) => s + l.names.length, 0),
  };
}

// -----------------------------------------------------------------------------
// Canonical order shape. `now`/`id` injectable for tests. No card/bank fields
// exist by design.
// -----------------------------------------------------------------------------
export function newOrder(partial = {}, { now = null, id = null } = {}) {
  const ts = now || new Date().toISOString();
  const clean = stripDisallowedOrderFields(partial);
  const stage = normalizeOrderStage(clean.stage);
  return {
    id: id || clean.id || `mo-${(now ? Date.parse(now) : Date.now()).toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    stage,
    customerName: asStr(clean.customerName),
    contactValue: asStr(clean.contactValue),          // handle or email — contact-level only
    channel: normalizeChannel(clean.channel),
    productType: normalizeProductType(clean.productType),
    description: asStr(clean.description),            // what they want, in their words
    inspoNotes: asStr(clean.inspoNotes),               // inspo pictures live in DMs; noted here
    sizeOrMeasurements: asStr(clean.sizeOrMeasurements), // out-of-town = size; local = measured
    fabric: asStr(clean.fabric),
    bulkLines: asArr(clean.bulkLines).map(normalizeBulkLine),
    quoteCents: Math.max(0, asNum(clean.quoteCents, 0)), // materials included in the price
    paidAt: asStr(clean.paidAt) || null,
    payMethod: PAY_METHODS.includes(clean.payMethod) ? clean.payMethod : null,
    turnaroundDays: asNum(clean.turnaroundDays, TURNAROUND_DAYS),
    materialsCents: Math.max(0, asNum(clean.materialsCents, 0)), // real spend, feeds margin
    delivery: clean.delivery === 'pickup' ? 'pickup' : 'ship',
    deliveredAt: asStr(clean.deliveredAt) || null,
    followUp: { asked: clean.followUp?.asked === true, photoReceived: clean.followUp?.photoReceived === true, note: asStr(clean.followUp?.note) },
    changeOrders: asArr(clean.changeOrders),
    policyAccepted: clean.policyAccepted === true,     // change/cancel policy consent at order time
    seed: clean.seed === true,
    history: asArr(clean.history).length ? clean.history : [{ stage, at: ts }],
    createdAt: asStr(clean.createdAt) || ts,
    updatedAt: asStr(clean.updatedAt) || ts,
  };
}

export function moveOrderStage(order, toStage, { now = null } = {}) {
  const ts = now || new Date().toISOString();
  const stage = normalizeOrderStage(toStage);
  if (stage === order.stage) return order;
  return { ...order, stage, updatedAt: ts, history: [...asArr(order.history), { stage, at: ts }] };
}

// recordPayment — the lock moment: full payment up front, clock starts, order
// moves to 'paid'. Records that/how/when Shay collected — never moves money.
export function recordPayment(order, { method = 'square', now = null } = {}) {
  const ts = now || new Date().toISOString();
  const m = PAY_METHODS.includes(method) ? method : 'other';
  return moveOrderStage({ ...order, paidAt: ts, payMethod: m, updatedAt: ts }, 'paid', { now: ts });
}

// -----------------------------------------------------------------------------
// CHANGE-ORDER LADDER (Darrell 2026-07-07: 50% minimum, Shay-variable). Once
// paid, the order is locked; the fee tracks REAL loss at the moment of change:
//   before-materials  → free (grace) — goodwill costs nothing real
//   materials-bought  → the real materials spend + a small admin fee
//   in-production     → 50% of the order FLOOR; Shay sets the actual % upward
//   completed         → no change exists — it is a NEW order
// Attribution is senior to the ladder: shop-error / supplier-issue NEVER
// charges the customer, whatever the stage.
// -----------------------------------------------------------------------------
export const CHANGE_REASONS = ['customer-requested', 'shop-error', 'supplier-issue'];
export const CHANGE_BANDS = {
  'before-materials': { label: 'Materials not yet bought', blurb: 'Grace window — no real loss yet.' },
  'materials-bought': { label: 'Materials bought, not cut', blurb: 'The fabric is real money now.' },
  'in-production':    { label: 'Cut / in production',       blurb: 'Materials + labor are in the garment.' },
  'completed':        { label: 'Ready or delivered',        blurb: 'No change — this is a new order.' },
};
export const IN_PRODUCTION_FEE_FLOOR_PCT = 50; // the deterrent floor; Shay-variable UP
export const CHANGE_ADMIN_FEE_CENTS = 1500;

export function changeOrderFee({ band, reason = 'customer-requested', orderTotalCents = 0, materialsCents = 0, shayPct = null } = {}) {
  const b = CHANGE_BANDS[band] ? band : 'before-materials';
  const r = CHANGE_REASONS.includes(reason) ? reason : 'customer-requested';
  // Attribution first: a change Shay or a supplier caused never charges the customer.
  if (r !== 'customer-requested') {
    return { band: b, reason: r, feeCents: 0, allowed: b !== 'completed', basis: 'no customer fee — not the customer\'s fault' };
  }
  if (b === 'completed') {
    return { band: b, reason: r, feeCents: null, allowed: false, basis: 'no change after completion — quote it as a new order' };
  }
  if (b === 'before-materials') {
    return { band: b, reason: r, feeCents: 0, allowed: true, basis: 'grace window — materials not bought' };
  }
  if (b === 'materials-bought') {
    const fee = Math.max(0, asNum(materialsCents, 0)) + CHANGE_ADMIN_FEE_CENTS;
    return { band: b, reason: r, feeCents: fee, allowed: true, basis: 'real materials spend + admin fee' };
  }
  // in-production: 50% floor, Shay-variable upward (never below the floor).
  const pct = Math.max(IN_PRODUCTION_FEE_FLOOR_PCT, asNum(shayPct, IN_PRODUCTION_FEE_FLOOR_PCT));
  const fee = Math.round((Math.max(0, asNum(orderTotalCents, 0)) * pct) / 100);
  return { band: b, reason: r, feeCents: fee, pct, allowed: true, basis: `${pct}% of the order (50% floor, Shay-set)` };
}

// appendChangeOrder — the recorded event (fee computed + accepted or waived).
// Every change is HISTORY: it feeds the KPI on how often changes happen.
export function appendChangeOrder(order, { band, reason, shayPct = null, acceptedByCustomer = false, note = '', now = null } = {}) {
  const ts = now || new Date().toISOString();
  const quote = changeOrderFee({ band, reason, orderTotalCents: order?.quoteCents, materialsCents: order?.materialsCents, shayPct });
  const entry = { at: ts, ...quote, acceptedByCustomer: acceptedByCustomer === true, note: asStr(note) };
  return { order: { ...order, changeOrders: [...asArr(order?.changeOrders), entry], updatedAt: ts }, entry };
}

// -----------------------------------------------------------------------------
// CLASSES — group ($45, HARD CAP 10) and one-on-one ($75, 2.5h, >= 2 weeks out).
// Defaults are Shay-editable per session; the CAP and the paid-seat rule are
// structural. A seat is held ONLY by a PAID signup — never a promise.
// -----------------------------------------------------------------------------
export const CLASS_FORMATS = {
  'group':      { label: 'Group class',  priceCentsDefault: 4500, seatCap: 10,  minLeadDays: 0,  blurb: 'Bring a friend — machines + materials provided. Just show up and create.' },
  'one-on-one': { label: 'One-on-one',   priceCentsDefault: 7500, seatCap: 1,   minLeadDays: 14, durationHours: 2.5, blurb: 'A 2.5-hour private session. Book at least two weeks out.' },
};
export function newClassSession(partial = {}, { now = null, id = null } = {}) {
  const ts = now || new Date().toISOString();
  const format = CLASS_FORMATS[partial.format] ? partial.format : 'group';
  const spec = CLASS_FORMATS[format];
  return {
    id: id || partial.id || `mc-${(now ? Date.parse(now) : Date.now()).toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    format,
    project: asStr(partial.project),                 // a different project each time
    dateIso: asStr(partial.dateIso) || null,
    location: asStr(partial.location),               // varies; Shay travels
    priceCents: Math.max(0, asNum(partial.priceCents, spec.priceCentsDefault)),
    seatCap: Math.min(spec.seatCap, Math.max(1, asNum(partial.seatCap, spec.seatCap))), // never above the hard cap
    seed: partial.seed === true,
    createdAt: asStr(partial.createdAt) || ts,
  };
}
// Paid seats only — an unpaid signup holds NOTHING (Shay's rule: payment in
// advance to book the seat).
export function seatsLeft(session, signups = []) {
  const paid = asArr(signups).filter((s) => s && s.sessionId === session?.id && s.paidAt).length;
  return Math.max(0, asNum(session?.seatCap, 0) - paid);
}
export function canBook(session, signups = [], { now = null } = {}) {
  if (!session || !session.dateIso) return { ok: false, reason: 'No session date set.' };
  const base = now ? Date.parse(now) : Date.now();
  const lead = (Date.parse(session.dateIso) - base) / DAY_MS;
  const minLead = CLASS_FORMATS[session.format]?.minLeadDays || 0;
  if (lead < 0) return { ok: false, reason: 'This class date has passed.' };
  if (lead < minLead) return { ok: false, reason: `One-on-one sessions book at least ${minLead} days out.` };
  if (seatsLeft(session, signups) < 1) return { ok: false, reason: 'Class is full — every seat is paid.' };
  return { ok: true, reason: null };
}

// -----------------------------------------------------------------------------
// KPIs — the historical account. Pure tallies of REAL rows; seeds excluded;
// null (never 0) when there is nothing to measure (DR-0076).
// -----------------------------------------------------------------------------
export function isSeedOrder(o) {
  return !!o && (o.seed === true || /^(seed-|demo-)/i.test(String(o.id || '')));
}
export function orderStats(orders = [], { includeSeed = false } = {}) {
  const list = asArr(orders).filter((o) => o && (includeSeed || !isSeedOrder(o)));
  const paid = list.filter((o) => o.paidAt);
  const revenue = paid.reduce((s, o) => s + asNum(o.quoteCents, 0), 0);
  const materials = paid.reduce((s, o) => s + asNum(o.materialsCents, 0), 0);
  const byType = {}; const byChannel = {};
  for (const o of paid) {
    byType[o.productType] = (byType[o.productType] || 0) + asNum(o.quoteCents, 0);
    byChannel[o.channel] = (byChannel[o.channel] || 0) + asNum(o.quoteCents, 0);
  }
  const byCustomer = {};
  for (const o of paid) { const k = (o.customerName || '').trim().toLowerCase(); if (k) byCustomer[k] = (byCustomer[k] || 0) + 1; }
  const customers = Object.keys(byCustomer).length;
  const repeat = Object.values(byCustomer).filter((n) => n > 1).length;
  const changes = list.reduce((s, o) => s + asArr(o.changeOrders).length, 0);
  return {
    orders: list.length,
    paidOrders: paid.length,
    revenueCents: revenue,
    materialsCents: materials,
    marginCents: revenue - materials,
    avgOrderCents: paid.length ? Math.round(revenue / paid.length) : null,
    byType, byChannel,
    repeatRatePct: customers ? Math.round((repeat / customers) * 100) : null,
    changeOrders: changes,
  };
}
export function classStats(sessions = [], signups = [], { includeSeed = false } = {}) {
  const sess = asArr(sessions).filter((s) => s && (includeSeed || s.seed !== true));
  const paid = asArr(signups).filter((s) => s && s.paidAt);
  let groupRev = 0, oneRev = 0, seatsFilled = 0, seatsOffered = 0;
  for (const s of sess) {
    const rows = paid.filter((x) => x.sessionId === s.id);
    const rev = rows.length * asNum(s.priceCents, 0);
    if (s.format === 'group') groupRev += rev; else oneRev += rev;
    seatsFilled += rows.length;
    seatsOffered += asNum(s.seatCap, 0);
  }
  return {
    sessions: sess.length,
    revenueCents: groupRev + oneRev,
    groupRevenueCents: groupRev,
    oneOnOneRevenueCents: oneRev,
    fillRatePct: seatsOffered ? Math.round((seatsFilled / seatsOffered) * 100) : null,
  };
}

// revenueGoalPlan — Shay names the money she wants; the system shows the mix
// that reaches it, ranked by what her REAL history earns per unit. Optimize-
// toward, never "guarantee" (truthful-claims posture).
export function revenueGoalPlan(goalCents, { orders = [], sessions = [], signups = [] } = {}) {
  const goal = Math.max(0, asNum(goalCents, 0));
  const os = orderStats(orders);
  const cs = classStats(sessions, signups);
  const lanes = [];
  if (os.avgOrderCents) {
    for (const [type, rev] of Object.entries(os.byType)) {
      const count = asArr(orders).filter((o) => o && !isSeedOrder(o) && o.paidAt && o.productType === type).length;
      if (count) lanes.push({ lane: type, kind: 'orders', perUnitCents: Math.round(rev / count), evidence: `${count} paid orders` });
    }
  }
  const groupSessions = asArr(sessions).filter((s) => s && s.seed !== true && s.format === 'group').length;
  if (groupSessions && cs.groupRevenueCents) lanes.push({ lane: 'group-class', kind: 'classes', perUnitCents: Math.round(cs.groupRevenueCents / groupSessions), evidence: `${groupSessions} sessions` });
  const oneSessions = asArr(sessions).filter((s) => s && s.seed !== true && s.format === 'one-on-one').length;
  if (oneSessions && cs.oneOnOneRevenueCents) lanes.push({ lane: 'one-on-one-class', kind: 'classes', perUnitCents: Math.round(cs.oneOnOneRevenueCents / oneSessions), evidence: `${oneSessions} sessions` });
  lanes.sort((a, b) => b.perUnitCents - a.perUnitCents);
  for (const l of lanes) l.unitsToGoal = l.perUnitCents > 0 ? Math.ceil(goal / l.perUnitCents) : null;
  return {
    goalCents: goal,
    lanes,
    // Honest flag: with no history there is no plan — never an invented mix.
    hasHistory: lanes.length > 0,
    note: lanes.length ? 'Ranked by real per-unit earnings from her history — a direction to optimize toward, not a guarantee.' : 'No paid history yet — the plan unlocks as real orders and classes land.',
  };
}
