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
  // Refresh by DELTA, not by re-downloading the log (2026-08-14). This table is
  // the single largest egress source in the app: 20,129 rows / 15 MB, fat
  // before/after blobs, and it gains a row on EVERY edit to ANY tracked record
  // — so the old refetch-everything-on-every-change behaviour re-pulled 15 MB
  // per edit per device. That is what exhausted the free-tier egress quota and
  // hard-restricted the project (`exceed_egress_quota`), locking every account
  // across all four apps out for 3.5 days.
  //
  // Safe HERE specifically because mergeRemoteRecordEvents below is a UNION:
  // handing the consumer only the new rows folds them in without losing the
  // history already held. Append-only is what makes that true — the DB grants
  // SELECT + INSERT only (migration 0052), so a row can never change after it
  // is written, and there is nothing an incremental read could miss.
  appendOnly: true,
});

// Append-only: union so an event written offline survives the first refetch.
export function mergeRemoteRecordEvents(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
