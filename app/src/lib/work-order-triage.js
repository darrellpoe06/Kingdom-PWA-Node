// =============================================================================
// work-order-triage — every work order in the system, in the order it came in,
// with its notes (DR-1213)
// =============================================================================
// Darrell, 2026-10-22, on the Life Hub's Recent Activity showing two work
// orders from 120 days ago: "Where are the work orders in order that they came
// in with notes across the whole system?!" and "Work order triage".
//
// MEASURED FIRST (work-orders-probe, the live database): work orders live in
// two stores, and nothing showed them together.
//   - `incidents`: the Real Estate Action Queue (category maintenance), each
//     with a lifecycle log of time-stamped notes and a dispatch crew. 4 rows.
//   - `tenant_maintenance_requests`: Poe Properties' work orders, filed by a
//     tenant, household member, manager or the owner, with `detail`,
//     `resolution_note`, `proof_note`, the worker's job notes
//     (`request_documentation`) and every change kept to the second
//     (`door_events`, subject 'work'). 0 rows so far.
// Recent Activity mixes six of anything, newest first; it was never a work
// order list.
//
// This module is pure: it turns both stores into ONE queue, numbered by
// arrival across the whole system, each entry carrying every note it has in
// time order. Nothing is invented; a store that could not be read is reported
// by the caller, never shown as "no work orders".

import { MAINTENANCE_TRANSITIONS } from './tenant-portal.js';

const CLOSED = new Set([
  'resolved', 'closed', 'complete', 'completed', 'declined', 'cancelled', 'canceled',
  'wont-fix', 'archived', 'converted', 'handled', 'discarded', 'shipped',
]);

const ms = (v) => {
  const t = Date.parse(String(v || ''));
  return Number.isFinite(t) ? t : 0;
};
const text = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();

/** Is this status one that ends the work? */
export function isClosed(status) {
  return CLOSED.has(String(status || '').toLowerCase());
}

// A crew on an incident is `dispatch.assignments`; older rows carried one name.
function crewOf(dispatch) {
  if (!dispatch || typeof dispatch !== 'object') return [];
  const list = Array.isArray(dispatch.assignments) ? dispatch.assignments : [];
  const names = list.map((a) => text(a && (a.name || a.label))).filter(Boolean);
  if (names.length) return names;
  const one = text(dispatch.name || dispatch.contractorName || dispatch.to);
  return one ? [one] : [];
}

/** One incident (the Real Estate Action Queue) as a work order. */
export function fromIncident(inc, { doorLabelOf } = {}) {
  const i = inc || {};
  const log = Array.isArray(i.lifecycle?.log) ? i.lifecycle.log : [];
  const cameInAt = i.createdAt || i.lifecycle?.openedAt || (log[0] && log[0].at) || i.date || '';
  const notes = log.map((e) => {
    const said = text(e && e.note);
    const moved = e && e.toPhase && e.fromPhase && e.toPhase !== e.fromPhase ? `${e.fromPhase} → ${e.toPhase}` : '';
    const words = said && said !== 'created' ? said : (e && !e.fromPhase ? 'came in' : '');
    return { at: (e && e.at) || '', text: [moved, words].filter(Boolean).join(' · '), by: text(e && e.by) };
  }).filter((n) => n.text);
  const door = i.linkedTo && i.linkedTo.type === 'rental' && doorLabelOf ? doorLabelOf({ localId: i.linkedTo.id }) : '';
  return {
    key: `inc-${i.id}`,
    source: 'realestate',
    sourceLabel: 'Real Estate',
    cameInAt,
    title: text(i.description) || text(i.title) || text(i.category) || 'Work order',
    // The words as written (line breaks kept), for the open view and for a move.
    fullText: String(i.description || i.title || '').trim(),
    category: text(i.category),
    door: door || '',
    status: text(i.status) || 'open',
    open: !isClosed(i.status),
    urgency: text(i.urgency),
    crew: crewOf(i.dispatch),
    notes,
    open_in: { view: 'overview' },
    record: { kind: 'incident', id: i.id },
  };
}

/** One Poe Properties work order, with its job notes and its change history. */
export function fromRequest(req, { docs = [], events = [], notes: said = [], doorLabelOf } = {}) {
  const r = req || {};
  const notes = [];
  if (text(r.detail)) notes.push({ at: r.created_at || '', text: text(r.detail), by: text(r.created_by_role) });
  for (const e of events) {
    if (!e || e.subject_id !== r.id) continue;
    const moved = e.from_value && e.to_value ? `${e.from_value} → ${e.to_value}` : text(e.to_value);
    const said = text(e.detail && (e.detail.note || e.detail.reason));
    const label = e.event === 'created' ? 'came in' : [moved, said].filter(Boolean).join(' · ') || text(e.event);
    if (label) notes.push({ at: e.at || '', text: label, by: '' });
  }
  for (const d of docs) {
    if (!d || d.request_id !== r.id) continue;
    const said = [text(d.outcome), text(d.note), text(d.followup)].filter(Boolean).join(' · ');
    if (said) notes.push({ at: d.created_at || '', text: `job note: ${said}`, by: 'worker' });
  }
  for (const n of said) {
    if (!n || n.request_id !== r.id || !text(n.body)) continue;
    notes.push({ at: n.created_at || '', text: text(n.body), by: text(n.author_label) || text(n.author_role) });
  }
  if (text(r.proof_note)) notes.push({ at: r.updated_at || r.created_at || '', text: `proof: ${text(r.proof_note)}`, by: '' });
  if (text(r.resolution_note)) notes.push({ at: r.updated_at || r.created_at || '', text: `resolved: ${text(r.resolution_note)}`, by: '' });
  notes.sort((a, b) => ms(a.at) - ms(b.at));
  const door = doorLabelOf ? doorLabelOf({ remoteId: r.rental_id, tenancyId: r.tenancy_id }) : '';
  return {
    key: `req-${r.id}`,
    source: 'properties',
    sourceLabel: 'Poe Properties',
    cameInAt: r.created_at || '',
    title: text(r.title) || 'Work order',
    fullText: [String(r.title || '').trim(), String(r.detail || '').trim()].filter(Boolean).join('\n\n'),
    category: text(r.area),
    door: door || '',
    status: text(r.status) || 'submitted',
    open: !isClosed(r.status),
    urgency: text(r.priority),
    crew: text(r.assigned_to_label) ? [text(r.assigned_to_label)] : [],
    notes,
    open_in: { view: 'properties' },
    record: { kind: 'request', id: r.id, instanceId: r.instance_id || null, tenancyId: r.tenancy_id || null, rentalId: r.rental_id || null },
  };
}

/**
 * The whole system's work orders as one triage queue. Every entry is numbered
 * by the order it came in across BOTH stores (#1 is the first ever filed), and
 * the queue lists the open ones first, oldest first — the order they came in
 * is the order they are owed — then the closed ones, newest closed last.
 */
export function triageQueue({ incidents = [], requests = [], docs = [], events = [], notes = [], doorLabelOf } = {}) {
  // Every incident is a work order: the Action Queue IS the Real Estate work
  // order record (incidents-sync.js), whatever its category.
  const fromInc = (Array.isArray(incidents) ? incidents : []).filter(Boolean).map((i) => fromIncident(i, { doorLabelOf }));
  const fromReq = (Array.isArray(requests) ? requests : []).map((r) => fromRequest(r, { docs, events, notes, doorLabelOf }));
  const all = [...fromInc, ...fromReq].sort((a, b) => ms(a.cameInAt) - ms(b.cameInAt) || a.key.localeCompare(b.key));
  all.forEach((w, n) => { w.number = n + 1; });
  const open = all.filter((w) => w.open);
  const closed = all.filter((w) => !w.open);
  return { all, open, closed };
}

/** "Oct 3, 2026 · 9:12 PM" for a full stamp; the date alone for a date-only one. */
export function cameInLabel(at) {
  const t = ms(at);
  if (!t) return 'date not recorded';
  const d = new Date(t);
  const day = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(at))) return day;
  return `${day} · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

// ---------------------------------------------------------------------------
// ACTING FROM THE TRIAGE (DR-1215). Darrell, 2026-10-22, on a triage that only
// showed: "Fix it!!! Never wait!!!" Each work order is moved where it lives,
// by that store's own rules: an incident by the Action Queue's lifecycle
// (updateIncident writes the phase move and its note into the log); a Poe
// Properties work order only along MAINTENANCE_TRANSITIONS (tenant-portal.js),
// the same machine its own screen follows, and the database's RLS decides who
// may. "Move it" sends a thought that was filed as a work order (the Thinking
// Space item) to where it belongs, and closes the work order without deleting
// a word of it.
// ---------------------------------------------------------------------------
const INCIDENT_MOVES = {
  open: [['in-progress', 'Start the work'], ['resolved', 'Resolve']],
  'in-progress': [['resolved', 'Resolve']],
};

// WHERE A THOUGHT FILED AS A WORK ORDER GOES (Darrell, 2026-10-22, on #4: "That
// long text was for a feature and or requirements for the Ohio church... we
// should be able to move that to the place that makes sense for those notes!").
// The Thinking Space's own destinations (lib/one-voice-routing.js DESTINATIONS),
// through the same shell handlers it uses; the work order then closes as
// 'converted', its words kept in its log.
export const MOVE_TARGETS = [
  { key: 'poetech', label: 'PoeTech: a feature or requirements', done: 'PoeTech (a build directive)' },
  { key: 'pastor', label: 'A note the pastors see', done: 'the pastors' },
  { key: 'prayer', label: 'The prayer list', done: 'the prayer list' },
  { key: 'private', label: 'My Thinking Space (private)', done: 'your Thinking Space' },
];
const REQUEST_LABEL = {
  received: 'Mark received', scheduled: 'Schedule', 'in-progress': 'Start the work',
  resolved: 'Resolve', declined: 'Decline', cancelled: 'Cancel',
};

/** What can be done next with this work order: status moves, and whether it takes a crew and notes. */
export function actionsFor(w) {
  if (!w || !w.record) return { moves: [], canAssign: false, canNote: false, canMove: false };
  const status = String(w.status || '').toLowerCase();
  if (w.record.kind === 'incident') {
    const moves = w.open
      ? (INCIDENT_MOVES[status] || INCIDENT_MOVES.open).map(([to, label]) => ({ to, label }))
      : [{ to: 'open', label: 'Reopen' }];
    return { moves, canAssign: w.open, canNote: true, canMove: w.open };
  }
  const next = MAINTENANCE_TRANSITIONS[status] || [];
  return { moves: next.map((to) => ({ to, label: REQUEST_LABEL[to] || to })), canAssign: w.open, canNote: true, canMove: false };
}
