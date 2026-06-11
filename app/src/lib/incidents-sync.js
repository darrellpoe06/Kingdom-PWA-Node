// =============================================================================
// incidents-sync — cross-device sync for the Action Queue (schema v2.8 + v2.13)
// =============================================================================
// Incidents ARE the quality-control record: every work order, every
// "dispatched to X", every resolve, with timestamps in the lifecycle log.
// Until v2.13 that record lived in one device's localStorage; this wrapper
// pools it on the family instance so Darrell's and Christina's devices see
// the same queue and the QC history survives any one device.
//
// Mapping notes (REQUIRES schema-v2.13-family-data-sync.sql):
//   - slug column carries the local id ('in-1718...'), unique per instance.
//   - lifecycle + dispatch ride as jsonb — the full audit trail syncs.
//   - category / urgency store the app's real vocab (CHECKs widened to the
//     union in v2.13); unknown values fall back inside the CHECK.
//   - linkedTo ({ type:'rental', id:<slug> }) rides in the links jsonb —
//     the remote linked_to_id column is a uuid and local links are slugs.
//   - entityId (local slug) stays device-local: entity_id is a uuid FK.
// Every local field maps to a column, so the monolith uses the flat-table
// wholesale-replace pattern (like accounts), not the rentals merge.
import { createTableSync } from './table-sync.js';

const REMOTE_CATEGORIES = new Set([
  'vehicle', 'property', 'medical', 'renter', 'maintenance', 'technology',
  'financial', 'administrative', 'other',
  'tenant', 'personal', 'business', 'tenant-or-property',
]);

export function toRemoteIncidentCategory(c) {
  return REMOTE_CATEGORIES.has(c) ? c : 'other';
}

const REMOTE_URGENCIES = new Set([
  'incident', 'change', 'request', 'problem', 'normal', 'urgent', 'low', 'project',
]);

export function toRemoteIncidentUrgency(u) {
  return REMOTE_URGENCIES.has(u) ? u : 'incident';
}

const REMOTE_STATUSES = new Set([
  'open', 'triaging', 'in-progress', 'blocked', 'resolved', 'declined', 'duplicate',
]);

function linkedToFromLinks(links) {
  const hit = Array.isArray(links)
    ? links.find((l) => l && l.type === 'linked-to' && l.kind && l.id)
    : null;
  return hit ? { type: hit.kind, id: hit.id } : null;
}

function slugFromLinks(links) {
  const hit = Array.isArray(links)
    ? links.find((l) => l && l.type === 'local-slug' && l.id)
    : null;
  return hit ? hit.id : null;
}

// The full column set for one incident. updateIncident pushes this same
// shape (minus instance/creator) as the patch, so no field is ever missed.
export function incidentColumns(item) {
  return {
    slug:          item.id,
    links: [
      { type: 'local-slug', id: item.id },
      ...(item.linkedTo ? [{ type: 'linked-to', kind: item.linkedTo.type, id: item.linkedTo.id }] : []),
      ...(item.entityId ? [{ type: 'entity-slug', id: item.entityId }] : []),
    ],
    incident_date: (item.date || item.createdAt || new Date().toISOString()).slice(0, 10),
    amount:        Number(item.amount) || 0,
    category:      toRemoteIncidentCategory(item.category),
    description:   item.description || '',
    urgency:       toRemoteIncidentUrgency(item.urgency),
    status:        REMOTE_STATUSES.has(item.status) ? item.status : 'open',
    due_date:      item.dueDate || null,
    resolved_at:   item.resolvedAt ? new Date(item.resolvedAt).toISOString() : null,
    lifecycle:     item.lifecycle || { phase: item.status || 'open', log: [] },
    dispatch:      item.dispatch || null,
  };
}

export const incidentsSync = createTableSync({
  localKey: 'incidents',
  remoteTable: 'incidents',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by:  userId,
      ...incidentColumns(item),
    };
  },

  fromRow(row) {
    return {
      id:         row.slug || slugFromLinks(row.links) || `in-remote-${row.id}`,
      remoteUuid: row.id,
      date:       row.incident_date,
      amount:     Number(row.amount) || 0,
      category:   row.category,
      description: row.description,
      urgency:    row.urgency,
      status:     row.status,
      dueDate:    row.due_date || '',
      resolvedAt: row.resolved_at ? String(row.resolved_at).slice(0, 10) : null,
      lifecycle:  row.lifecycle || { phase: row.status, log: [] },
      dispatch:   row.dispatch || null,
      linkedTo:   linkedToFromLinks(row.links),
      entityId:   (Array.isArray(row.links) ? row.links.find((l) => l && l.type === 'entity-slug' && l.id)?.id : null) || undefined,
      createdAt:  row.created_at,
      updatedAt:  row.updated_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
