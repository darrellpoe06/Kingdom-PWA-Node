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

// Each worker on an incident, with their own piece: assigned or done.
function workersOf(dispatch) {
  if (!dispatch || typeof dispatch !== 'object') return [];
  if (Array.isArray(dispatch.assignments)) {
    return dispatch.assignments.filter((a) => a && text(a.name || a.label)).map((a) => ({
      name: text(a.name || a.label), status: a.status === 'done' ? 'done' : 'assigned', doneAt: a.doneAt || '', assignmentId: a.id || '', contractorId: a.contractorId || '', phone: text(a.phone),
    }));
  }
  const one = text(dispatch.name || dispatch.contractorName || dispatch.to);
  return one ? [{ name: one, status: 'assigned', doneAt: '', assignmentId: dispatch.id || `asg-legacy-${dispatch.contractorId || 'x'}`, contractorId: dispatch.contractorId || '', phone: text(dispatch.contractorPhone) }] : [];
}

// Did the close carry what was done? The Action Queue's one-tap Resolve writes
// 'Marked resolved' and nothing else; the triage writes 'Resolve: <result>'.
const BARE_CLOSE = /^(marked resolved|created|resolve(d)?( \(from the triage\))?|)$/i;
function incidentResultWritten(log) {
  const closes = (log || []).filter((e) => e && isClosed(e.toPhase) && e.toPhase !== e.fromPhase);
  const last = closes[closes.length - 1];
  return !!(last && !BARE_CLOSE.test(text(last.note)));
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
  const link = i.linkedTo || {};
  const door = link.type === 'rental' && doorLabelOf ? doorLabelOf({ localId: link.id })
    : link.type === 'building' && text(link.id) ? `${text(link.id)} (the building)` : '';
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
    workers: workersOf(i.dispatch),
    building: link.type === 'building' ? text(link.id) : '',
    dueDate: text(i.dueDate),
    closedAt: i.resolvedAt || i.lifecycle?.closedAt || '',
    resultWritten: incidentResultWritten(log),
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
    workers: text(r.assigned_to_label) ? [{ name: text(r.assigned_to_label), status: isClosed(r.status) ? 'done' : 'assigned', doneAt: '', assignmentId: '', contractorId: '' }] : [],
    // The worker's own job notes (request_documentation): what they report back.
    reported: docs.filter((d) => d && d.request_id === r.id).length,
    building: '',
    dueDate: text(r.scheduled_for || r.due_date),
    closedAt: isClosed(r.status) ? (r.updated_at || '') : '',
    resultWritten: !!text(r.resolution_note) || said.some((n) => n && n.request_id === r.id && /^result:/i.test(text(n.body))),
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
// ---------------------------------------------------------------------------
// THE PROJECTS BOARDS' PROPERTY WORK (Darrell, 2026-10-22: "Our projects tab
// has work orders etc..."). Measured (building-probe): board_tasks holds a
// readiness board per door (`airbnb-ready:<door>`; 805's Apt 2 board, 8 items,
// 5 done, 3 not started, no owner, no notes) beside the family's program
// boards. A property board's item is a work order on that door, so it joins
// the queue; program boards (Moore Divahs, church infra...) are not property
// work and stay on Projects. Only rows that exist are read: the readiness
// template is never painted in as work nobody touched.
// ---------------------------------------------------------------------------
const PROPERTY_BOARD_PREFIX = 'airbnb-ready:';
const AI_OWNER_NAME = 'ari';

export function isPropertyBoardTask(t) {
  return !!(t && String(t.boardSlug || '').startsWith(PROPERTY_BOARD_PREFIX));
}

/** One property-board item (board_tasks) as a work order. */
export function fromBoardTask(task, { doorLabelOf } = {}) {
  const t = task || {};
  const ref = String(t.boardSlug || '').slice(PROPERTY_BOARD_PREFIX.length);
  const door = doorLabelOf && ref ? doorLabelOf({ localId: ref, remoteId: ref }) : '';
  const owner = text(t.owner);
  const history = Array.isArray(t.links && t.links.history) ? t.links.history : [];
  const notes = [{ at: t.createdAt || '', text: 'came in', by: '' }];
  for (const h of history) {
    if (!h) continue;
    const said = [h.from && h.to ? `${h.from} → ${h.to}` : text(h.to || h.kind), text(h.note)].filter(Boolean).join(' · ');
    if (said) notes.push({ at: h.at || '', text: said, by: text(h.by) });
  }
  for (const line of String(t.notes || '').split('\n')) {
    const said = text(line);
    if (said) notes.push({ at: t.updatedAt || t.createdAt || '', text: said, by: '' });
  }
  notes.sort((a, b) => ms(a.at) - ms(b.at));
  const done = t.status === 'done';
  return {
    key: `task-${t.slug || t.id}`,
    source: 'projects',
    sourceLabel: 'Projects board',
    cameInAt: t.createdAt || t.startDate || '',
    title: [text(t.group), text(t.title)].filter(Boolean).join(': ') || 'Board item',
    fullText: String(t.title || '').trim(),
    category: text(t.group),
    door: door || '',
    status: text(t.status) || 'not-started',
    open: !done,
    urgency: '',
    crew: owner && owner.toLowerCase() !== AI_OWNER_NAME ? [owner] : [],
    workers: owner && owner.toLowerCase() !== AI_OWNER_NAME ? [{ name: owner, status: done ? 'done' : 'assigned', doneAt: '', assignmentId: '', contractorId: '' }] : [],
    building: '',
    dueDate: text(t.dueDate),
    closedAt: done ? (t.updatedAt || '') : '',
    resultWritten: /(^|\n)\s*result:/i.test(String(t.notes || '')),
    notes,
    open_in: { view: 'projects' },
    record: { kind: 'task', id: t.slug || t.id },
  };
}

export function triageQueue({ incidents = [], requests = [], docs = [], events = [], notes = [], tasks = [], doorLabelOf } = {}) {
  // Every incident is a work order: the Action Queue IS the Real Estate work
  // order record (incidents-sync.js), whatever its category.
  const fromInc = (Array.isArray(incidents) ? incidents : []).filter(Boolean).map((i) => fromIncident(i, { doorLabelOf }));
  const fromReq = (Array.isArray(requests) ? requests : []).map((r) => fromRequest(r, { docs, events, notes, doorLabelOf }));
  const fromTask = (Array.isArray(tasks) ? tasks : []).filter(isPropertyBoardTask).map((t) => fromBoardTask(t, { doorLabelOf }));
  const all = [...fromInc, ...fromReq, ...fromTask].sort((a, b) => ms(a.cameInAt) - ms(b.cameInAt) || a.key.localeCompare(b.key));
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
// A board item moves along the board's own statuses (lib/board.js BOARD_STATUS).
const TASK_MOVES = {
  'not-started': [['in-progress', 'Start the work'], ['done', 'Done']],
  'in-progress': [['blocked', 'Mark it stuck'], ['done', 'Done']],
  blocked: [['in-progress', 'Unstick it'], ['done', 'Done']],
  done: [['in-progress', 'Reopen']],
};
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
  if (w.record.kind === 'task') {
    return { moves: (TASK_MOVES[status] || TASK_MOVES['not-started']).map(([to, label]) => ({ to, label })), canAssign: w.open, canNote: true, canMove: false };
  }
  const next = MAINTENANCE_TRANSITIONS[status] || [];
  return { moves: next.map((to) => ({ to, label: REQUEST_LABEL[to] || to })), canAssign: w.open, canNote: true, canMove: false };
}

// ---------------------------------------------------------------------------
// A NEW WORK ORDER, FROM SCRATCH (Darrell, 2026-10-22: "805 N Prospect Ave
// Champaign IL the building... not one of the apartments... we need work done
// in the foyer... and other basement activities... how do we add a work order
// from scratch and what to do with it when its for the building"). It is an
// incident, the Real Estate work order record, written through the shell's own
// addIncident. A building's work links to the building itself
// ({ type: 'building', id: <its key, lib/building-group.js> }) so it belongs
// to no one apartment; an apartment's links to that door, as the Action Queue
// already does. incidents.linked_to_kind is text with no CHECK, so the link
// syncs as it is (incidents-sync.js). The part of the building is written at
// the front of the words, because the record has no column for it and the
// words are what every surface shows.
// ---------------------------------------------------------------------------
export const BUILDING_AREAS = [
  'Foyer and entry', 'Basement', 'Hallways and stairs', 'Laundry', 'Utilities (boiler, water heater, panel)',
  'Exterior and grounds', 'Roof and gutters', 'Parking and walks', 'The whole building',
];
export const NEW_URGENCIES = [
  { key: 'change', label: 'Broken now (today)' },
  { key: 'incident', label: 'Needs fixing (within 3 days)' },
];

/**
 * The addIncident payload for a new work order, or { error } when it cannot be one.
 * where: { kind: 'building', key } | { kind: 'door', id, entityId } | { kind: 'none' }
 */
export function newWorkOrder({ where = { kind: 'none' }, area = '', words = '', urgency = 'incident', now = new Date() } = {}) {
  const said = String(words || '').trim();
  if (!said) return { error: 'Say what needs doing first.' };
  const part = where.kind === 'building' ? text(area) : '';
  const description = part ? `${part}: ${said}` : said;
  const base = {
    date: new Date(now).toISOString().slice(0, 10),
    amount: 0,
    category: 'maintenance',
    description,
    urgency: NEW_URGENCIES.some((u) => u.key === urgency) ? urgency : 'incident',
    status: 'open',
    _note: 'created from the work order triage',
  };
  if (where.kind === 'building') {
    if (!text(where.key)) return { error: 'Pick the building.' };
    return { item: { ...base, entityId: 'e-poeprops', linkedTo: { type: 'building', id: text(where.key) } } };
  }
  if (where.kind === 'door') {
    if (!text(where.id)) return { error: 'Pick the apartment.' };
    return { item: { ...base, entityId: where.entityId || 'e-poeprops', linkedTo: { type: 'rental', id: where.id } } };
  }
  return { item: { ...base, entityId: 'e-personal' } };
}

// ---------------------------------------------------------------------------
// EVERY WORKER'S OUTSTANDING WORK, AND A PLACE TO REVIEW RESULTS (Darrell,
// 2026-10-22: "Also seeing all workers outstanding and just a place to review
// the results"). Both are read from the same queue, so the numbers agree with
// it: a worker's open work is every open work order their name is on, with
// their own piece (assigned or done); a result waits on review when the work
// order is still open but the workers have finished (every one marked done on
// an incident, or a job note filed on a Poe Properties work order).
// ---------------------------------------------------------------------------
const workerKey = (n) => String(n || '').trim().toLowerCase();

/** [{ name, open: [{ w, piece }], doneOpen }] busiest first, then the roster's names with nothing open. */
export function workersBoard(queue, contractors = []) {
  const by = new Map();
  for (const w of (queue && queue.open) || []) {
    for (const piece of w.workers || []) {
      const k = workerKey(piece.name);
      if (!k) continue;
      const slot = by.get(k) || { name: piece.name, open: [], doneOpen: 0 };
      slot.open.push({ w, piece });
      if (piece.status === 'done') slot.doneOpen += 1;
      by.set(k, slot);
    }
  }
  const busy = [...by.values()].sort((a, b) => (b.open.length - b.doneOpen) - (a.open.length - a.doneOpen) || a.name.localeCompare(b.name));
  const idle = (Array.isArray(contractors) ? contractors : [])
    .map((c) => text(c && c.name)).filter((n) => n && !by.has(workerKey(n)));
  return { busy, idle: [...new Set(idle)] };
}

/** Has every worker on this work order finished their piece? */
export function workersFinished(w) {
  if (!w) return false;
  if (w.record && w.record.kind === 'request') return (w.reported || 0) > 0;
  if (w.record && w.record.kind === 'task') return false; // a board item has no worker-done step: Done closes it
  const list = w.workers || [];
  return list.length > 0 && list.every((p) => p.status === 'done');
}

/** { waiting: open work orders whose workers have finished; recent: closed ones that had workers, newest first, up to `limit`. } */
export function resultsToReview(queue, { limit = 10 } = {}) {
  const waiting = ((queue && queue.open) || []).filter(workersFinished);
  const recent = ((queue && queue.closed) || [])
    .filter((w) => (w.workers || []).length > 0 || (w.reported || 0) > 0)
    .slice().sort((a, b) => b.number - a.number).slice(0, limit);
  return { waiting, recent };
}

// ---------------------------------------------------------------------------
// QUALITY CONTROL YOU CAN SEE (Darrell, 2026-10-22: "This need better quality
// and more clear quality control and visuals so users can and will use it").
// Every work order shows where it stands on one track, read from its own
// record, never painted: it came in; a worker is on it; the workers finished
// their part; it is closed with a written result. And it shows how long it
// has been open and whether it is past due. Closing asks for the result in
// words (requireResult), so a closed work order always says what was done.
// ---------------------------------------------------------------------------
export function progressOf(w) {
  const x = w || {};
  const hasWorker = (x.workers || []).length > 0;
  const finished = workersFinished(x) || (!x.open && hasWorker);
  return [
    { key: 'in', label: 'Came in', done: true },
    { key: 'assigned', label: 'Assigned', done: hasWorker },
    { key: 'worked', label: 'Work done', done: finished },
    !x.open && !x.resultWritten
      ? { key: 'closed', label: 'No result', done: true, warn: true }
      : { key: 'closed', label: 'Checked', done: !x.open },
  ];
}

/** { days, overdue, label } for an open work order, from when it came in and its due date. */
export function ageOf(w, now = Date.now()) {
  const x = w || {};
  const start = ms(x.cameInAt);
  const end = x.open ? now : (ms(x.closedAt) || now);
  const days = start ? Math.max(0, Math.floor((end - start) / 86400000)) : null;
  const due = ms(x.dueDate);
  const overdue = !!(x.open && due && now > due + 86400000 - 1);
  const label = days == null ? '' : x.open
    ? `open ${days} day${days === 1 ? '' : 's'}${overdue ? ' · past due' : ''}`
    : `took ${days} day${days === 1 ? '' : 's'}`;
  return { days, overdue, label };
}

/** A status a close must carry a written result for. */
export function requiresResult(to) {
  return to === 'resolved' || to === 'done';
}

/** What the person closing it sees, before it closes: the checks, read from the record. */
export function closingChecks(w) {
  const x = w || {};
  const workers = x.workers || [];
  if (x.record && x.record.kind === 'task') {
    return [
      workers.length ? { ok: true, text: `${workers[0].name} is on it.` } : { ok: false, text: 'Nobody was put on this board item.' },
      { ok: (x.notes || []).length > 1, text: (x.notes || []).length > 1 ? `${x.notes.length} notes on its record.` : 'Nothing has been written on it since it came in.' },
    ];
  }
  return [
    workers.length === 0
      ? { ok: false, text: 'No worker was put on this work order.' }
      : workersFinished(x)
        ? { ok: true, text: x.record && x.record.kind === 'request' ? 'The worker filed a job note.' : `Every worker marked their part done (${workers.map((p) => p.name).join(', ')}).` }
        : { ok: false, text: `Not every worker has marked their part done (${workers.filter((p) => p.status !== 'done').map((p) => p.name).join(', ') || 'no job note yet'}).` },
    { ok: (x.notes || []).length > 1, text: (x.notes || []).length > 1 ? `${x.notes.length} notes on its record.` : 'Nothing has been written on it since it came in.' },
  ];
}
