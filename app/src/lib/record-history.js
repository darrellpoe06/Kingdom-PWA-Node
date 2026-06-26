// =============================================================================
// record-history — the shared systems-of-record primitive (immutable history).
// =============================================================================
// The thing a spreadsheet cannot do: keep the FULL, attributed, timestamped
// history of a record so you can answer "what did this look like before, who
// changed it, and when" — and recover any prior version. This is the audit
// trail + versioning substrate that turns a flat, mutated-in-place row into a
// LIVING record. Inventory item edits ride it; a Books transaction edit rides
// it; any record that wants a history rides it.
//
// EVENTS-AS-DATA. A record's history is an APPEND-ONLY log of events. Nothing is
// mutated; a "change" is a new event whose `after` is the full post-change
// snapshot. The current state is the latest event's `after`; any past version is
// the `after` of the latest event at-or-before a chosen instant. Deletes and
// restores are events too, so even a deletion is recoverable — its `before`
// holds the last good snapshot.
//
// IMMUTABILITY is enforced two ways and BOTH must hold (defense in depth):
//   1. DB: record_events has only SELECT + INSERT policies — no UPDATE/DELETE
//      grant or policy exists, so a row, once written, cannot be altered or
//      removed (migration 0052). That is the real corporate control.
//   2. Code: this module only ever produces NEW events; it has no mutate path.
//
// Pure + dependency-free so it is trivially testable and reusable. The Supabase
// side is the generic record-events-sync.js controller (insert + subscribe).
// =============================================================================

// The recognized actions. `update` is the common one; create/delete/restore
// bracket a record's life; `movement` and `note` let domain logs (e.g. an
// inventory in/out) share the same timeline shape without pretending to be a
// field edit.
export const HISTORY_ACTIONS = ['create', 'update', 'delete', 'restore', 'movement', 'note'];

// Fields never worth showing in a human diff (bookkeeping, not content).
const NOISE_FIELDS = new Set([
  'id', 'remoteUuid', 'createdAt', 'updatedAt', 'updated_at', 'created_at',
  'createdBy', 'created_by', 'updated_by',
]);

function isPlainScalar(v) {
  return v === null || v === undefined || typeof v === 'string'
    || typeof v === 'number' || typeof v === 'boolean';
}

// diffFields — the changed scalar fields between two snapshots, as
// { field: { from, to } }. Object/array fields are compared by JSON identity so
// a nested change still registers, but only scalars are surfaced individually
// (a deep diff is out of scope for an audit summary). `fields`, when given,
// restricts the comparison to that allow-list.
export function diffFields(before, after, fields = null) {
  const a = before || {};
  const b = after || {};
  const keys = fields
    ? fields
    : Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  const changes = {};
  for (const k of keys) {
    if (NOISE_FIELDS.has(k)) continue;
    const av = a[k];
    const bv = b[k];
    const equal = isPlainScalar(av) && isPlainScalar(bv)
      ? av === bv
      : JSON.stringify(av ?? null) === JSON.stringify(bv ?? null);
    if (!equal) changes[k] = { from: av ?? null, to: bv ?? null };
  }
  return changes;
}

// summarizeChange — a short human line for a set of field changes.
export function summarizeChange(changes) {
  const keys = Object.keys(changes || {});
  if (!keys.length) return 'no field changes';
  return keys
    .map((k) => `${k}: ${fmt(changes[k].from)} -> ${fmt(changes[k].to)}`)
    .join(', ');
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return '(empty)';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// makeHistoryEvent — normalize a raw change into a stored event. Callers pass
// the record identity, the action, who/when, and the before/after snapshots;
// this fills in the field-level `changes` (from the diff) and a `summary` when
// they are not supplied. Never mutates its inputs.
export function makeHistoryEvent({
  id,
  recordKind,
  recordId,
  action = 'update',
  actor = null,
  at = null,
  before = null,
  after = null,
  changes = null,
  summary = null,
  meta = null,
}) {
  if (!recordKind) throw new Error('makeHistoryEvent: recordKind is required');
  if (!recordId) throw new Error('makeHistoryEvent: recordId is required');
  const act = HISTORY_ACTIONS.includes(action) ? action : 'update';
  const computedChanges = changes
    || (before && after ? diffFields(before, after) : {});
  const computedSummary = summary != null
    ? summary
    : defaultSummary(act, computedChanges, before, after);
  return {
    id: id || `re-${at || ''}-${recordKind}-${recordId}-${Math.random().toString(36).slice(2, 8)}`,
    recordKind,
    recordId: String(recordId),
    action: act,
    actor: actor || null,
    at: at || new Date().toISOString(),
    before: before || null,
    after: after || null,
    changes: computedChanges,
    summary: computedSummary,
    meta: meta || null,
  };
}

function defaultSummary(action, changes, before, after) {
  switch (action) {
    case 'create': return 'record created';
    case 'delete': return 'record deleted';
    case 'restore': return 'record restored';
    case 'movement': return after?.summary || 'stock movement';
    case 'note': return after?.note || 'note';
    default: return summarizeChange(changes);
  }
}

// sortByTime — chronological (oldest first), stable on `id` for ties so the
// same input always yields the same order (no clock-collision flicker).
function sortByTime(events) {
  return [...events].sort((x, y) => {
    if (x.at < y.at) return -1;
    if (x.at > y.at) return 1;
    return String(x.id).localeCompare(String(y.id));
  });
}

// historyFor — every event for one record, oldest first.
export function historyFor(events, recordKind, recordId) {
  const rid = String(recordId);
  return sortByTime(
    (events || []).filter((e) => e && e.recordKind === recordKind && String(e.recordId) === rid),
  );
}

// reconstructAt — the record's state as of an instant (inclusive): the `after`
// of the latest non-delete event at-or-before `iso`. Returns null if the record
// did not yet exist, or was deleted, as of that instant.
export function reconstructAt(events, recordKind, recordId, iso) {
  const hist = historyFor(events, recordKind, recordId);
  let snapshot = null;
  for (const e of hist) {
    if (e.at > iso) break;
    if (e.action === 'delete') snapshot = null;
    else if (e.after) snapshot = e.after;
  }
  return snapshot;
}

// currentVersion — the live state: reconstructAt(now). Convenience.
export function currentVersion(events, recordKind, recordId) {
  const hist = historyFor(events, recordKind, recordId);
  if (!hist.length) return null;
  return reconstructAt(events, recordKind, recordId, hist[hist.length - 1].at);
}

// versionTimeline — the human-facing history: one entry per event, numbered,
// with the field changes and the resulting snapshot. Newest-first by default so
// a UI can show "most recent change at top".
export function versionTimeline(events, recordKind, recordId, { newestFirst = true } = {}) {
  const hist = historyFor(events, recordKind, recordId);
  const rows = hist.map((e, i) => ({
    version: i + 1,
    at: e.at,
    actor: e.actor,
    action: e.action,
    changes: e.changes || {},
    summary: e.summary,
    snapshot: e.after || e.before || null,
    meta: e.meta || null,
  }));
  return newestFirst ? rows.reverse() : rows;
}

// versionCount — how many recorded events a record has (its revision depth).
export function versionCount(events, recordKind, recordId) {
  return historyFor(events, recordKind, recordId).length;
}

// isImmutableEvent — a guard the app can use before any write path: an existing
// event must never be edited. Always true — there is no legitimate mutation of a
// recorded event. Kept as an explicit, testable assertion of the contract.
export function isImmutableEvent() {
  return true;
}
