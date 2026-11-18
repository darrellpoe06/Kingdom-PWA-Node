// =============================================================================
// portfolio.js — every door at once, with the latest of everything (DR-1530)
// =============================================================================
// Darrell, 2026-11-18, on the Messages tab of one door: "We need to be able to
// see all active work orders in the Poe Properties App... we should not need
// to look individually to find open work orders... or messages... the latest
// ones and sorting by KPI's or something instead of each asset individually...
// I need to see all at the same time in a list... maybe a list of each
// property with the latest everything."
//
// The work board, the thread and the rent tab each read ONE door. This rolls
// the same three records (work orders, messages, payments) up across every
// door the reader can see, one row per door, sortable by what needs him.
//
// PURE ON PURPOSE: rows in, rows out. The reads live in cloud.js
// (loadPortfolioPulse) under the reader's own RLS; nothing here decides who
// may see what, it only arranges what was already returned.
//
// NOTHING DISAPPEARS (DR-0076). A work order or message whose door cannot be
// matched is never dropped: it lands on an "Not tied to a door" row, so the
// totals at the top always equal the sum of the rows beneath them.
// =============================================================================

/** A work order in one of these states is done; every other state is open. */
export const CLOSED_WORK = Object.freeze(['resolved', 'declined', 'cancelled']);
export const isOpenWork = (r) => Boolean(r) && !CLOSED_WORK.includes(r.status);

/** The sides whose last word means the family owes a reply. */
const ASKING_SIDES = Object.freeze(['tenant', 'household', 'worker']);

const PRIORITY_RANK = Object.freeze({ urgent: 3, high: 2, normal: 1, low: 0 });
const DAY = 86400000;

const ts = (v) => {
  const n = v ? Date.parse(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const latestBy = (rows, at) =>
  rows.reduce((best, r) => {
    const t = ts(at(r));
    if (t === null) return best;
    return !best || t > best.t ? { t, row: r } : best;
  }, null);

export const UNTIED = '__untied__';

/** The door's name as the Doors board and the picker write it. */
export function portfolioDoorLabel(r) {
  return [r?.display_name || r?.address, r?.unit].filter(Boolean).join(' · ') || 'Unnamed door';
}

/**
 * tenancy id -> rentals id. rental_tenancies.rental_ref is the rentals SLUG
 * (text), or the id when a rental has no slug (vacantUnitRow) -- the same
 * key the door's own thread follows (DR-0904). Both are accepted.
 */
export function tenancyToRental(tenancies = [], rentals = []) {
  const bySlug = new Map();
  for (const r of rentals) {
    if (!r || !r.id) continue;
    bySlug.set(String(r.id), r.id);
    if (r.slug) bySlug.set(String(r.slug), r.id);
  }
  const out = new Map();
  for (const t of tenancies) {
    if (!t || !t.id) continue;
    const rid = bySlug.get(String(t.rental_ref || ''));
    if (rid) out.set(t.id, rid);
  }
  return out;
}

/**
 * One row per door with the latest of everything, plus an "untied" row when
 * any record could not be placed. `now` is injected (ISO or ms) so this stays
 * pure and testable.
 */
// `strict` is for the owner's PREVIEW of another face (DR-1199): there the
// doors are already cut to what that face reads, and a record the cut doors do
// not hold is not that face's to see, so it is left out rather than shown on
// the untied row.
export function portfolioRows({ rentals = [], tenancies = [], requests = [], messages = [], rent = [], now = Date.now(), strict = false } = {}) {
  const clock = typeof now === 'number' ? now : (ts(now) ?? Date.now());
  const toRental = tenancyToRental(tenancies, rentals);
  const rows = new Map();
  for (const r of rentals) {
    if (!r || !r.id) continue;
    rows.set(r.id, { id: r.id, label: portfolioDoorLabel(r), rental: r, requests: [], messages: [], rent: [], tenancies: [] });
  }
  const untied = () => {
    if (!rows.has(UNTIED)) rows.set(UNTIED, { id: UNTIED, label: 'Not tied to a door', rental: null, requests: [], messages: [], rent: [], tenancies: [] });
    return rows.get(UNTIED);
  };
  const place = (rec) => {
    const rid = (rec.rental_id && rows.has(rec.rental_id) ? rec.rental_id : null) || (rec.tenancy_id ? toRental.get(rec.tenancy_id) : null);
    if (rid && rows.has(rid)) return rows.get(rid);
    return strict ? null : untied();
  };
  for (const t of tenancies) {
    const rid = t && toRental.get(t.id);
    if (rid && rows.has(rid)) rows.get(rid).tenancies.push(t);
  }
  for (const q of requests) if (q) place(q)?.requests.push(q);
  for (const m of messages) if (m) place(m)?.messages.push(m);
  for (const p of rent) if (p) place(p)?.rent.push(p);

  return [...rows.values()].map((row) => summarize(row, clock));
}

function summarize(row, clock) {
  const open = row.requests
    .filter(isOpenWork)
    .sort((a, b) => (PRIORITY_RANK[b.priority] ?? 1) - (PRIORITY_RANK[a.priority] ?? 1) || (ts(a.created_at) ?? 0) - (ts(b.created_at) ?? 0));
  const urgent = open.filter((r) => r.priority === 'urgent' || r.priority === 'high').length;
  const oldest = open.reduce((min, r) => {
    const t = ts(r.created_at);
    return t !== null && (min === null || t < min) ? t : min;
  }, null);
  const lastWork = latestBy(row.requests, (r) => r.updated_at || r.created_at);
  const lastMsg = latestBy(row.messages, (m) => m.sent_at);
  const awaitingReply = Boolean(lastMsg && ASKING_SIDES.includes(lastMsg.row.from_role));
  const toConfirm = row.rent.filter((p) => p.status === 'reported').length;
  const lastPay = latestBy(
    row.rent.filter((p) => p.status !== 'void'),
    (p) => p.paid_on || p.reported_at
  );
  const active = row.tenancies.find((t) => t.status === 'active') || null;
  const lastActivity = Math.max(lastWork?.t ?? 0, lastMsg?.t ?? 0, lastPay?.t ?? 0) || null;
  const oldestDays = oldest === null ? 0 : Math.max(0, Math.floor((clock - oldest) / DAY));
  // THE ATTENTION ORDER, stated so it can be argued with: an urgent job
  // outranks an unanswered message, which outranks a payment waiting to be
  // confirmed, which outranks ordinary open work; age breaks the ties, up to
  // a month. A door with none of these scores zero.
  const attention = urgent * 1000 + (awaitingReply ? 500 : 0) + toConfirm * 200 + open.length * 50 + Math.min(oldestDays, 30);
  return {
    id: row.id,
    label: row.label,
    untied: row.id === UNTIED,
    address: row.rental ? [row.rental.address, row.rental.city, row.rental.state].filter(Boolean).join(', ') : '',
    tenant: active?.tenant_name || row.rental?.tenant_name || '',
    occupied: Boolean(active),
    open,
    openCount: open.length,
    urgentCount: urgent,
    oldestOpenDays: oldest === null ? null : oldestDays,
    latestWork: lastWork ? lastWork.row : null,
    latestMessage: lastMsg ? lastMsg.row : null,
    awaitingReply,
    toConfirm,
    lastPayment: lastPay ? lastPay.row : null,
    lastActivityAt: lastActivity ? new Date(lastActivity).toISOString() : null,
    messageCount: row.messages.length,
    attention,
  };
}

export const SORTS = Object.freeze([
  Object.freeze({ id: 'attention', label: 'Needs me first' }),
  Object.freeze({ id: 'recent', label: 'Latest activity' }),
  Object.freeze({ id: 'open', label: 'Most open work' }),
  Object.freeze({ id: 'oldest', label: 'Oldest open work' }),
  Object.freeze({ id: 'messages', label: 'Waiting on a reply' }),
  Object.freeze({ id: 'name', label: 'Name' }),
]);

const byName = (a, b) => a.label.localeCompare(b.label);
const recentOf = (r) => ts(r.lastActivityAt) ?? 0;

/** A new array in the chosen order; an unknown key falls back to attention. */
export function sortPortfolio(rows = [], key = 'attention') {
  const list = [...rows];
  const cmp =
    {
      attention: (a, b) => b.attention - a.attention || recentOf(b) - recentOf(a) || byName(a, b),
      recent: (a, b) => recentOf(b) - recentOf(a) || byName(a, b),
      open: (a, b) => b.openCount - a.openCount || b.urgentCount - a.urgentCount || byName(a, b),
      oldest: (a, b) => (b.oldestOpenDays ?? -1) - (a.oldestOpenDays ?? -1) || byName(a, b),
      messages: (a, b) =>
        Number(b.awaitingReply) - Number(a.awaitingReply) || (ts(b.latestMessage?.sent_at) ?? 0) - (ts(a.latestMessage?.sent_at) ?? 0) || byName(a, b),
      name: byName,
    }[key] || null;
  return list.sort(cmp || ((a, b) => b.attention - a.attention || byName(a, b)));
}

/** Only the doors with something going on, when the reader asks for that. */
export function activeOnly(rows = []) {
  return rows.filter((r) => r.openCount > 0 || r.awaitingReply || r.toConfirm > 0 || r.untied);
}

/** The KPIs across every door: the sum of the rows, never a separate count. */
export function portfolioTotals(rows = []) {
  return rows.reduce(
    (t, r) => ({
      doors: t.doors + (r.untied ? 0 : 1),
      occupied: t.occupied + (r.occupied ? 1 : 0),
      open: t.open + r.openCount,
      urgent: t.urgent + r.urgentCount,
      awaiting: t.awaiting + (r.awaitingReply ? 1 : 0),
      toConfirm: t.toConfirm + r.toConfirm,
    }),
    { doors: 0, occupied: 0, open: 0, urgent: 0, awaiting: 0, toConfirm: 0 }
  );
}

/** Every open work order across every door, the most pressing first. */
export function allOpenWork(rows = []) {
  return rows
    .flatMap((r) => r.open.map((w) => ({ ...w, doorId: r.id, doorLabel: r.label })))
    .sort((a, b) => (PRIORITY_RANK[b.priority] ?? 1) - (PRIORITY_RANK[a.priority] ?? 1) || (ts(a.created_at) ?? 0) - (ts(b.created_at) ?? 0));
}

/**
 * The latest messages and work-order moves across every door, newest first,
 * each carrying the door it belongs to.
 */
export function latestFeed({ rentals = [], tenancies = [], requests = [], messages = [], strict = false } = {}, limit = 30) {
  const toRental = tenancyToRental(tenancies, rentals);
  const names = new Map(rentals.filter((r) => r && r.id).map((r) => [r.id, portfolioDoorLabel(r)]));
  const doorOf = (rec) => {
    const rid = (rec.rental_id && names.has(rec.rental_id) ? rec.rental_id : null) || toRental.get(rec.tenancy_id) || null;
    return { doorId: rid || UNTIED, doorLabel: rid ? names.get(rid) : 'Not tied to a door' };
  };
  const items = [
    ...messages.filter(Boolean).map((m) => ({ kind: 'message', id: `m-${m.id}`, at: m.sent_at, who: m.from_role, text: m.body || '', ...doorOf(m) })),
    ...requests.filter(Boolean).map((r) => ({
      kind: 'work',
      id: `w-${r.id}`,
      at: r.updated_at || r.created_at,
      who: r.created_by_role || '',
      text: r.title || 'Work order',
      status: r.status,
      priority: r.priority,
      ...doorOf(r),
    })),
  ].filter((i) => ts(i.at) !== null && !(strict && i.doorId === UNTIED));
  return items.sort((a, b) => ts(b.at) - ts(a.at)).slice(0, Math.max(0, limit));
}

/** "3h ago", "2d ago", "just now" -- short enough for a phone row. */
export function agoLabel(at, now = Date.now()) {
  const t = ts(at);
  if (t === null) return '';
  const clock = typeof now === 'number' ? now : (ts(now) ?? Date.now());
  const s = Math.max(0, Math.floor((clock - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < DAY / 1000) return `${Math.floor(s / 3600)}h ago`;
  if (s < (60 * DAY) / 1000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toISOString().slice(0, 10);
}
