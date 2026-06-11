// =============================================================================
// contractors-sync — cross-device sync for 1099 workers (schema v2.4 + v2.13)
// =============================================================================
// The dispatch loop is only as good as the worker list: if Mike's number
// lives on one phone, Christina can't dispatch him from hers. This wrapper
// syncs Books · 1099s to the contractors_1099 table so the family shares
// one worker roster — names, phones (one-tap dispatch), emails, YTD totals.
//
// Mapping notes (REQUIRES schema-v2.13-family-data-sync.sql):
//   - slug column carries the local id ('k-1718...'), unique per instance.
//   - status stores the app's real vocab (CHECK widened with 'paused',
//     'ended'); remote-born vocab (pipeline / possible / inactive /
//     terminated) passes through and the UI select lists all of it.
//   - monthly_expected carries the per-direction monthly figure: the
//     outbound average for workers we pay, the expected inbound for 1099s
//     we receive. fromRow splits it back by direction.
//   - entityId (local slug) stays device-local: entity_id is a uuid FK.
// Every local field maps to a column (notes added in v2.13), so the
// monolith uses the flat-table wholesale-replace pattern.
import { createTableSync } from './table-sync.js';

const REMOTE_CONTRACTOR_STATUSES = new Set([
  'active', 'pipeline', 'possible', 'inactive', 'terminated', 'paused', 'ended',
]);

export function toRemoteContractorStatus(s) {
  return REMOTE_CONTRACTOR_STATUSES.has(s) ? s : 'active';
}

function slugFromLinks(links) {
  const hit = Array.isArray(links)
    ? links.find((l) => l && l.type === 'local-slug' && l.id)
    : null;
  return hit ? hit.id : null;
}

// Full column set for one contractor; updateContractor pushes this same
// shape as the patch so no field is ever missed.
export function contractorColumns(item) {
  return {
    slug:                 item.id,
    links: [
      { type: 'local-slug', id: item.id },
      ...(item.entityId ? [{ type: 'entity-slug', id: item.entityId }] : []),
    ],
    direction:            item.direction === 'inbound' ? 'inbound' : 'outbound',
    contact_display_name: item.name || '',
    contact_phone:        item.phone || null,
    contact_email:        item.email || null,
    role_description:     item.role || null,
    ytd_paid:             Number(item.ytdPaid) || 0,
    ytd_received:         Number(item.ytdReceived) || 0,
    monthly_expected:     Number(item.direction === 'inbound' ? item.monthlyExpected : item.monthly) || 0,
    notes:                item.notes ?? null,
    status:               toRemoteContractorStatus(item.status),
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
    const inbound = row.direction === 'inbound';
    const monthlyFig = Number(row.monthly_expected) || 0;
    return {
      id:              row.slug || slugFromLinks(row.links) || `k-remote-${row.id}`,
      remoteUuid:      row.id,
      entityId:        (Array.isArray(row.links) ? row.links.find((l) => l && l.type === 'entity-slug' && l.id)?.id : null) || 'e-personal',
      direction:       row.direction,
      name:            row.contact_display_name,
      phone:           row.contact_phone || '',
      email:           row.contact_email || '',
      role:            row.role_description || '',
      ytdPaid:         Number(row.ytd_paid) || 0,
      ytdReceived:     Number(row.ytd_received) || 0,
      monthly:         inbound ? 0 : monthlyFig,
      monthlyExpected: inbound ? monthlyFig : 0,
      notes:           row.notes ?? '',
      status:          row.status,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
