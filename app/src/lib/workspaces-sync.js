// =============================================================================
// workspaces-sync — cross-device sync for the creation_workspaces table
// =============================================================================
// A document composed on Darrell's laptop should open, unchanged, on Christina's
// phone — the same proven table-sync path projects / discussions / accounts ride.
// Built on the generic createTableSync + unionPreservingLocal helpers.
//
// Local shape:
//   { id: 'ws-...', type: 'document', title: '...', content: '<p>..</p>',
//     meta: { page, format }, authorPersona: 'darrell',
//     createdBy: '<uuid>', createdAt, updatedAt }
//
// Remote shape (0037 creation_workspaces row): jsonb for meta; text for content.
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

// Exported (named) so the mapping is unit-testable on its own — createTableSync's
// controller does not re-expose toRow/fromRow.
export function workspaceToRow(item, { tenantId, userId }) {
  return {
    instance_id:    tenantId,
    created_by:     userId,
    slug:           item.id,
    type:           item.type ?? 'document',
    title:          item.title ?? 'Untitled',
    content:        typeof item.content === 'string' ? item.content : '',
    meta:           item.meta && typeof item.meta === 'object' ? item.meta : {},
    author_persona: item.authorPersona ?? null,
  };
}

export function workspaceFromRow(row) {
  return {
    id:            row.slug ?? `ws-remote-${row.id}`,
    remoteUuid:    row.id,
    tenantId:      row.instance_id,
    createdBy:     row.created_by ?? null,
    type:          row.type ?? 'document',
    title:         row.title ?? 'Untitled',
    content:       typeof row.content === 'string' ? row.content : '',
    meta:          row.meta && typeof row.meta === 'object' ? row.meta : {},
    authorPersona: row.author_persona ?? null,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

export const workspacesSync = createTableSync({
  localKey: 'workspaces',
  remoteTable: 'creation_workspaces',
  toRow: workspaceToRow,
  fromRow: workspaceFromRow,
  idOf: (item) => item.id,
});

// Map a local field name to its creation_workspaces column, for the monolith's
// updateWorkspace patch builder (mirrors DISCUSSION_COLUMN_OF). Only the editable
// columns are here; instance_id / created_by are never patched.
export const WORKSPACE_COLUMN_OF = {
  type:          'type',
  title:         'title',
  content:       'content',
  meta:          'meta',
  authorPersona: 'author_persona',
};

// Field-preserving merge for a realtime refetch (same contract as
// mergeRemoteDiscussions): the cloud is authoritative for synced columns, then
// keep any never-uploaded local-only record (non-UUID id) so a document composed
// offline is not dropped by the first refetch.
export function mergeRemoteWorkspaces(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
