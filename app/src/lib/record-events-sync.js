// =============================================================================
// record-events-sync — cross-device sync for the record_events history log.
// =============================================================================
// The generic, append-only audit + versioning log behind the record-history
// primitive (lib/record-history.js). One row per change to ANY tracked record:
// an inventory item edit, a Books transaction edit/delete, and whatever rides it
// next. The history of a record on one device is the same on every device.
//
// APPEND-ONLY (the immutability control). The shell only calls upload()/
// subscribe(); never updateRow/deleteRow. The DB grants only SELECT + INSERT and
// has no UPDATE/DELETE policy (migration 0052): a written history event can
// never be altered or erased. That is what makes "recoverable" trustworthy.
//
// Local shape (record-history.makeHistoryEvent output):
//   { id, recordKind, recordId, action, actor, at, before, after,
//     changes, summary, meta }
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export function recordEventToRow(item, { tenantId, userId }) {
  return {
    instance_id: tenantId,
    created_by:  userId,
    slug:        item.id,
    record_kind: item.recordKind,
    record_id:   String(item.recordId),
    action:      item.action ?? 'update',
    actor:       item.actor ?? null,
    occurred_at: item.at ?? new Date().toISOString(),
    before:      item.before ?? null,
    after:       item.after ?? null,
    changes:     item.changes ?? {},
    summary:     item.summary ?? null,
    meta:        item.meta ?? null,
  };
}

export function recordEventFromRow(row) {
  return {
    id:         row.slug ?? `re-remote-${row.id}`,
    remoteUuid: row.id,
    tenantId:   row.instance_id,
    recordKind: row.record_kind,
    recordId:   String(row.record_id),
    action:     row.action ?? 'update',
    actor:      row.actor ?? null,
    at:         row.occurred_at ?? row.created_at,
    before:     row.before ?? null,
    after:      row.after ?? null,
    changes:    row.changes ?? {},
    summary:    row.summary ?? null,
    meta:       row.meta ?? null,
  };
}

export const recordEventsSync = createTableSync({
  localKey: 'recordEvents',
  remoteTable: 'record_events',
  toRow: recordEventToRow,
  fromRow: recordEventFromRow,
  idOf: (item) => item.id,
});

// Append-only: union so an event written offline survives the first refetch.
export function mergeRemoteRecordEvents(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
