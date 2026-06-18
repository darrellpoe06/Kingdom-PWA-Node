// =============================================================================
// concerns-sync — cross-device sync for the concerns table (0038)
// =============================================================================
// A concern captured on Darrell's laptop should show up on Christina's phone
// without a re-export — the same proven table-sync path projects / discussions
// ride. Built on the generic createTableSync + unionPreservingLocal helpers.
//
// Local shape:
//   { id: 'cn-...', concern: '...', solution: '...', targetDate: 'YYYY-MM-DD',
//     whenNote: '...', status: 'open'|'in-progress'|'done', area: '...',
//     source: 'manual', sortRank: null, links: {...},
//     createdBy: '<uuid>', createdAt, updatedAt }
//
// Remote shape (0038 concerns row): target_date / when_note / sort_rank / jsonb links.
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

// Exported (named) so the mapping is unit-testable on its own — createTableSync's
// controller does not re-expose toRow/fromRow.
export function concernToRow(item, { tenantId, userId }) {
  return {
    instance_id: tenantId,
    created_by:  userId,
    slug:        item.id,
    concern:     item.concern ?? '',
    solution:    item.solution ?? null,
    // Empty-string date inputs become NULL so a blank target never becomes a
    // bogus 1970 date in the column.
    target_date: item.targetDate ? item.targetDate : null,
    when_note:   item.whenNote ?? null,
    status:      item.status ?? 'open',
    area:        item.area ?? null,
    source:      item.source ?? 'manual',
    sort_rank:   item.sortRank ?? null,
    links:       item.links && typeof item.links === 'object' ? item.links : {},
  };
}

export function concernFromRow(row) {
  return {
    id:         row.slug ?? `cn-remote-${row.id}`,
    remoteUuid: row.id,
    tenantId:   row.instance_id,
    createdBy:  row.created_by ?? null,
    concern:    row.concern ?? '',
    solution:   row.solution ?? null,
    targetDate: row.target_date ?? null,
    whenNote:   row.when_note ?? null,
    status:     row.status ?? 'open',
    area:       row.area ?? null,
    source:     row.source ?? 'manual',
    sortRank:   row.sort_rank ?? null,
    links:      row.links && typeof row.links === 'object' ? row.links : {},
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

export const concernsSync = createTableSync({
  localKey: 'concerns',
  remoteTable: 'concerns',
  toRow: concernToRow,
  fromRow: concernFromRow,
  idOf: (item) => item.id,
});

// Map a local field name to its concerns-table column, for the monolith's
// updateConcern patch builder (mirrors DISCUSSION_COLUMN_OF). Only the editable
// columns are here; instance_id / created_by are never patched.
export const CONCERN_COLUMN_OF = {
  concern:    'concern',
  solution:   'solution',
  targetDate: 'target_date',
  whenNote:   'when_note',
  status:     'status',
  area:       'area',
  source:     'source',
  sortRank:   'sort_rank',
  links:      'links',
};

// Field-preserving merge for a realtime refetch (same contract as
// mergeRemoteDiscussions): the cloud is authoritative for synced columns, then
// keep any never-uploaded local-only record (non-UUID id) so a concern captured
// offline is not dropped by the first refetch.
export function mergeRemoteConcerns(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
