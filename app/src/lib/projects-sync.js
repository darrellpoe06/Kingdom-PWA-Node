// =============================================================================
// projects-sync — cross-device sync for the projects table
// =============================================================================
// Projects are not directly load-bearing on financial totals, but Christina
// adding a project on her phone (e.g., a new TLC contractor pipeline) should
// show up on Darrell's laptop without requiring a re-export.
//
// Local shape:
//   { id: 'pr-example-3', title: 'Sponsor outreach Q3 — first cohort',
//     startDate: '2026-06-01', endDate: '2026-08-31', status: 'planning',
//     domain: 'business-poetech', description: '...', hoursPerWeek: 5,
//   entityId: 'e-poetech', createdAt: '2026-05-16T00:00:00.000Z' }
//
// Remote shape (schema v1.2 projects row):
//   adds slug + entity_slug to existing v1 columns.
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export const projectsSync = createTableSync({
  localKey: 'projects',
  remoteTable: 'projects',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id:      tenantId,
      created_by:     userId,
      slug:           item.id,
      entity_slug:    item.entityId ?? null,
      title:          item.title ?? '',
      start_date:     item.startDate ?? null,
      end_date:       item.endDate ?? null,
      status:         item.status ?? 'planning',
      domain:         item.domain ?? null,
      description:    item.description ?? null,
      hours_per_week: item.hoursPerWeek !== undefined ? Number(item.hoursPerWeek) : null,
      // A1 (2026-06-13): the device-local rich fields now round-trip so they
      // sync across devices instead of being stripped on every refetch.
      lifecycle:        item.lifecycle ?? null,
      conversation_log: Array.isArray(item.conversationLog) ? item.conversationLog : null,
      contractor_ids:   Array.isArray(item.contractorIds) ? item.contractorIds : null,
    };
  },

  fromRow(row) {
    // A1: read the rich fields back. Leave them `undefined` (not a synthesized
    // default) when the cloud row doesn't carry them, so mergeRemoteProjects can
    // preserve the richer local copy instead of clobbering it with an empty one.
    return {
      id:           row.slug ?? `pr-remote-${row.id}`,
      remoteUuid:   row.id,
      tenantId:     row.instance_id,
      createdBy:    row.created_by ?? null,
      priorityRank: row.priority_rank ?? null,
      assigneePersonas: Array.isArray(row.assignee_personas) ? row.assignee_personas : [],
      nextStep:     row.next_step ?? null,
      blocker:      row.blocker ?? null,
      entityId:     row.entity_slug ?? null,
      title:        row.title ?? '',
      startDate:    row.start_date,
      endDate:      row.end_date,
      status:       row.status,
      domain:       row.domain,
      description:  row.description,
      hoursPerWeek: row.hours_per_week,
      lifecycle:        row.lifecycle ?? undefined,
      conversationLog:  Array.isArray(row.conversation_log) ? row.conversation_log : undefined,
      contractorIds:    Array.isArray(row.contractor_ids) ? row.contractor_ids : undefined,
      createdAt:    row.created_at,
      updatedAt:    row.updated_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});

// A1 field-preserving merge. The cloud is authoritative for the synced columns,
// but a cloud project row may not carry the rich fields yet (created before the
// columns existed, or an edit that never reached the cloud). For each matched
// project, fill any missing/empty rich field from the local copy so the
// lifecycle trail, conversation log, and contractor links are never stripped by
// a refetch. Then preserve never-uploaded local-only items (unionPreservingLocal).
const RICH_FIELDS = ['lifecycle', 'conversationLog', 'contractorIds'];

function isEmptyRich(field, value) {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (field === 'lifecycle') return !Array.isArray(value.log) || value.log.length === 0;
  return false;
}

export function mergeRemoteProjects(currentLocal, incoming) {
  const localById = new Map((currentLocal || []).map((p) => [p.id, p]));
  const reconciled = (incoming || []).map((remote) => {
    const local = localById.get(remote.id);
    if (!local) return remote;
    const filled = { ...remote };
    for (const f of RICH_FIELDS) {
      if (isEmptyRich(f, remote[f]) && local[f] !== undefined) filled[f] = local[f];
    }
    return filled;
  });
  return unionPreservingLocal(currentLocal, reconciled);
}
