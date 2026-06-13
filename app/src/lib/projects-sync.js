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
import { createTableSync } from './table-sync.js';

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
    };
  },

  fromRow(row) {
    return {
      id:           row.slug ?? `pr-remote-${row.id}`,
      remoteUuid:   row.id,
      tenantId:     row.instance_id,
      createdBy:    row.created_by ?? null,
      priorityRank: row.priority_rank ?? null,
      entityId:     row.entity_slug ?? null,
      title:        row.title,
      startDate:    row.start_date,
      endDate:      row.end_date,
      status:       row.status,
      domain:       row.domain,
      description:  row.description,
      hoursPerWeek: row.hours_per_week,
      createdAt:    row.created_at,
      updatedAt:    row.updated_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
