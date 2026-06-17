// =============================================================================
// discussions-sync — cross-device sync for the discussions table
// =============================================================================
// A discussion captured on Darrell's laptop (a directive that drives a project)
// should show up on Christina's phone without a re-export — the same proven
// table-sync path projects/accounts/debts ride. Built on the generic
// createTableSync + unionPreservingLocal helpers.
//
// Local shape:
//   { id: 'dc-...', kind: 'directive', title: '...', body: '...',
//     projectSlugs: ['pr-...'], visibility: 'shared', status: 'open',
//     links: { study_ref, dr_ref }, meta: { ...handoff... },
//     authorPersona: 'darrell', createdBy: '<uuid>', createdAt, updatedAt }
//
// Remote shape (0035 discussions row): jsonb for project_slugs / links / meta.
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

// Exported (named) so the mapping is unit-testable on its own — createTableSync's
// controller does not re-expose toRow/fromRow.
export function discussionToRow(item, { tenantId, userId }) {
  return {
    instance_id:    tenantId,
    created_by:     userId,
    slug:           item.id,
    kind:           item.kind ?? 'directive',
    title:          item.title ?? '',
    body:           item.body ?? null,
    project_slugs:  Array.isArray(item.projectSlugs) ? item.projectSlugs : [],
    visibility:     item.visibility ?? 'shared',
    status:         item.status ?? 'open',
    links:          item.links && typeof item.links === 'object' ? item.links : {},
    meta:           item.meta && typeof item.meta === 'object' ? item.meta : {},
    author_persona: item.authorPersona ?? null,
  };
}

export function discussionFromRow(row) {
  return {
    id:            row.slug ?? `dc-remote-${row.id}`,
    remoteUuid:    row.id,
    tenantId:      row.instance_id,
    createdBy:     row.created_by ?? null,
    kind:          row.kind ?? 'directive',
    title:         row.title ?? '',
    body:          row.body ?? null,
    projectSlugs:  Array.isArray(row.project_slugs) ? row.project_slugs : [],
    visibility:    row.visibility ?? 'shared',
    status:        row.status ?? 'open',
    links:         row.links && typeof row.links === 'object' ? row.links : {},
    meta:          row.meta && typeof row.meta === 'object' ? row.meta : {},
    authorPersona: row.author_persona ?? null,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

export const discussionsSync = createTableSync({
  localKey: 'discussions',
  remoteTable: 'discussions',
  toRow: discussionToRow,
  fromRow: discussionFromRow,
  idOf: (item) => item.id,
});

// Map a local field name to its discussions-table column, for the monolith's
// updateDiscussion patch builder (mirrors COLUMN_OF in updateProject). Only the
// editable columns are here; instance_id / created_by are never patched.
export const DISCUSSION_COLUMN_OF = {
  kind:          'kind',
  title:         'title',
  body:          'body',
  projectSlugs:  'project_slugs',
  visibility:    'visibility',
  status:        'status',
  links:         'links',
  meta:          'meta',
  authorPersona: 'author_persona',
};

// Field-preserving merge for a realtime refetch (same contract as
// mergeRemoteProjects): the cloud is authoritative for synced columns, then keep
// any never-uploaded local-only record (non-UUID id) so a discussion captured
// offline is not dropped by the first refetch.
export function mergeRemoteDiscussions(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
