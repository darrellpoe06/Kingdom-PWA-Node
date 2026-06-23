// =============================================================================
// assignments — multiple 1099 workers on one work order (incident)
// =============================================================================
// A maintenance need (incident / work order) used to go to ONE worker:
// incident.dispatch = { contractorName, contractorPhone, ... }. Real jobs
// need a crew — a plumber AND a drywaller, or a vendor delivering parts while
// a contractor installs them. This module makes the work order carry a LIST
// of assigned workers, each with its own contact, dispatch status, done-state,
// and a 1099 payout hook (hours / amount) finance can settle later.
//
// STORAGE (no migration): the list lives in the existing `dispatch` jsonb
// column on incidents, reshaped to { assignments: [...] }. jsonb is
// schemaless by design, so this is additive and needs no DDL. getAssignments()
// is the ONE reader — it tolerates the legacy single-worker shape and rows
// self-heal to the new shape on the next write. Per BUSINESS-PROCESS-
// CONNECTIONS.md the work order is one end of a connection; every assigned
// worker is a wired path to a person who fixes it.

export const ASSIGNMENT_TYPES = ['contractor', 'vendor'];

// Empty string / null -> null (means "not entered yet"); otherwise a number.
function num(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

// Convert a legacy single-worker dispatch object into one assignment, so old
// incidents keep showing their assigned worker until the next write upgrades
// the shape.
function legacyToAssignment(d) {
  return {
    id: d.id || `asg-legacy-${d.contractorId || 'x'}`,
    contractorId: d.contractorId || '',
    name: d.contractorName || '',
    role: d.contractorRole || '',
    type: d.type || 'contractor',
    phone: d.contractorPhone || '',
    email: d.contractorEmail || '',
    dispatchedAt: d.dispatchedAt || '',
    status: 'assigned',
    doneAt: null,
    payout: { hours: null, amount: null },
  };
}

// The canonical assigned-worker list for a work order. Tolerant of:
//   - new shape:    dispatch = { assignments: [...] }
//   - legacy shape: dispatch = { contractorName, ... }  (single worker)
//   - none:         dispatch = null / undefined
export function getAssignments(incident) {
  const d = incident && incident.dispatch;
  if (!d) return [];
  if (Array.isArray(d.assignments)) return d.assignments;
  if (d.contractorName || d.contractorId) return [legacyToAssignment(d)];
  return [];
}

// Build a fresh assignment from a directory contractor. `type` defaults from
// the contractor record, then to 'contractor'. payout starts empty — the hook
// finance settles later (hours / amount per worker on this order).
export function makeAssignment(contractor = {}, { at, type } = {}) {
  return {
    id: `asg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    contractorId: contractor.id || '',
    name: contractor.name || '',
    role: contractor.role || '',
    type: type || contractor.type || 'contractor',
    phone: contractor.phone || '',
    email: contractor.email || '',
    dispatchedAt: at || new Date().toISOString(),
    status: 'assigned',
    doneAt: null,
    payout: { hours: null, amount: null },
  };
}

// Add a worker to the list, de-duping an already-active assignment of the same
// contractor (a worker marked done CAN be re-assigned for a follow-up). Returns
// the new list (unchanged if it was a no-op).
export function addAssignment(incident, contractor, opts = {}) {
  const list = getAssignments(incident);
  const alreadyActive = list.some(
    a => a.contractorId && a.contractorId === contractor.id && a.status !== 'done',
  );
  if (alreadyActive) return list;
  return [...list, makeAssignment(contractor, opts)];
}

export function markDone(list, assignmentId, at) {
  return list.map(a =>
    a.id === assignmentId ? { ...a, status: 'done', doneAt: at || new Date().toISOString() } : a,
  );
}

export function reopen(list, assignmentId) {
  return list.map(a => (a.id === assignmentId ? { ...a, status: 'assigned', doneAt: null } : a));
}

export function removeAssignment(list, assignmentId) {
  return list.filter(a => a.id !== assignmentId);
}

// Per-worker 1099 payout hook (finance settles later). Stores hours + amount,
// normalizing blanks to null so "not entered" is distinct from "$0".
export function setPayout(list, assignmentId, payout = {}) {
  return list.map(a =>
    a.id === assignmentId
      ? { ...a, payout: { hours: num(payout.hours), amount: num(payout.amount) } }
      : a,
  );
}

// The work order's own done-rule: at least one worker, and all of them done.
export function allDone(list) {
  return list.length > 0 && list.every(a => a.status === 'done');
}

// What to persist back to the incident.dispatch jsonb column. null when empty
// so an unassigned work order reads cleanly (matches the legacy "no dispatch").
export function dispatchState(list) {
  return list && list.length ? { assignments: list } : null;
}

// One-line summary for collapsed rows (Action Queue). "Name" for a single
// worker, "N workers · X/N done" for a crew.
export function summarize(list) {
  if (!list || !list.length) return '';
  const done = list.filter(a => a.status === 'done').length;
  if (list.length === 1) return list[0].name + (list[0].status === 'done' ? ' ✓' : '');
  return `${list.length} workers · ${done}/${list.length} done`;
}

// Total settled payout across the crew (finance roll-up).
export function totalPayout(list) {
  return (list || []).reduce((sum, a) => sum + (Number(a.payout && a.payout.amount) || 0), 0);
}
