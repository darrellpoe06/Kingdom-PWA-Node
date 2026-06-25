// =============================================================================
// contractors-sync — cross-device sync for 1099 workers (contractors_1099)
// =============================================================================
// The dispatch loop is only as good as the worker list: if Mike's number
// lives on one phone, Christina can't dispatch him from hers. This wrapper
// syncs Books · 1099s to contractors_1099 so the family shares one worker
// roster — names, phones (one-tap dispatch), emails, YTD totals, notes.
//
// LIVE-SHAPE NOTE (2026-06-10): the table was CREATED by
// schema-v2.13-family-data-sync.sql in this database's native v1.2 style
// (instance_id + slug + entity_slug, free-text status, no CHECKs), with
// columns matching the app's contractor shape 1:1 — name, phone, email,
// role, direction, ytd_paid, ytd_received, monthly, monthly_expected,
// status, notes. Nothing is flattened or conflated. Wholesale-replace
// pattern (every local field has a column).
import { createTableSync } from './table-sync.js';

// Full column set for one contractor; updateContractor pushes this same
// shape as the patch so no field is ever missed.
export function contractorColumns(item) {
  return {
    slug:             item.id,
    entity_slug:      item.entityId || null,
    direction:        item.direction === 'inbound' ? 'inbound' : 'outbound',
    type:             item.type === 'vendor' ? 'vendor' : 'contractor',
    name:             item.name || '',
    phone:            item.phone || null,
    email:            item.email || null,
    role:             item.role || null,
    ytd_paid:         Number(item.ytdPaid) || 0,
    ytd_received:     Number(item.ytdReceived) || 0,
    monthly:          Number(item.monthly) || 0,
    monthly_expected: Number(item.monthlyExpected) || 0,
    status:           item.status || 'active',
    notes:            item.notes ?? null,
  };
}

export const contractorsSync = createTableSync({
  localKey: 'contractors1099',
  remoteTable: 'contractors_1099',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by:  userId,
      ...contractorColumns(item),
    };
  },

  fromRow(row) {
    return {
      id:              row.slug || `k-remote-${row.id}`,
      remoteUuid:      row.id,
      entityId:        row.entity_slug || 'e-personal',
      direction:       row.direction,
      type:            row.type || 'contractor',
      name:            row.name,
      phone:           row.phone || '',
      email:           row.email || '',
      role:            row.role || '',
      ytdPaid:         Number(row.ytd_paid) || 0,
      ytdReceived:     Number(row.ytd_received) || 0,
      monthly:         Number(row.monthly) || 0,
      monthlyExpected: Number(row.monthly_expected) || 0,
      status:          row.status,
      notes:           row.notes ?? '',
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
