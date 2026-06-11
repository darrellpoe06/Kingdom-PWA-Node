// =============================================================================
// incidents-sync — cross-device sync for the Action Queue (LIVE incidents table)
// =============================================================================
// Incidents ARE the quality-control record: every work order, every
// "dispatched to X", every resolve, with timestamps in the lifecycle log.
// This wrapper pools that record on the family instance so both devices
// see the same queue and the QC history survives any one device.
//
// LIVE-SHAPE NOTE (2026-06-10): the cloud incidents table is the
// v1.2-numeric-sync shape evolved — it natively carries slug, entity_slug,
// linked_to_kind + linked_to_slug (text, exactly the app's
// linkedTo { type, id } pair), and has NO CHECK constraints, so the app's
// category/urgency/status vocab stores as-is. schema-v2.13 (applied
// 2026-06-10) added the two QC columns: lifecycle jsonb + dispatch jsonb.
// Every local field maps to a column, so the monolith uses the flat-table
// wholesale-replace pattern (like accounts), not the rentals merge.
import { createTableSync } from './table-sync.js';

// The full column set for one incident. updateIncident pushes this same
// shape (minus instance/creator) as the patch, so no field is ever missed.
export function incidentColumns(item) {
  return {
    slug:           item.id,
    entity_slug:    item.entityId || null,
    incident_date:  (item.date || item.createdAt || new Date().toISOString()).slice(0, 10),
    amount:         Number(item.amount) || 0,
    category:       item.category || 'other',
    description:    item.description || '',
    urgency:        item.urgency || 'incident',
    status:         item.status || 'open',
    due_date:       item.dueDate || null,
    resolved_at:    item.resolvedAt ? new Date(item.resolvedAt).toISOString() : null,
    linked_to_kind: item.linkedTo?.type || null,
    linked_to_slug: item.linkedTo?.id || null,
    lifecycle:      item.lifecycle || { phase: item.status || 'open', log: [] },
    dispatch:       item.dispatch || null,
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
      id:          row.slug || `in-remote-${row.id}`,
      remoteUuid:  row.id,
      entityId:    row.entity_slug || undefined,
      date:        row.incident_date,
      amount:      Number(row.amount) || 0,
      category:    row.category,
      description: row.description,
      urgency:     row.urgency,
      status:      row.status,
      dueDate:     row.due_date || '',
      resolvedAt:  row.resolved_at ? String(row.resolved_at).slice(0, 10) : null,
      lifecycle:   row.lifecycle || { phase: row.status, log: [] },
      dispatch:    row.dispatch || null,
      linkedTo:    (row.linked_to_kind && row.linked_to_slug)
        ? { type: row.linked_to_kind, id: row.linked_to_slug }
        : null,
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
