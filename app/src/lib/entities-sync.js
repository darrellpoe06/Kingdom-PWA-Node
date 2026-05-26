// =============================================================================
// entities-sync — cross-device sync for the entities table
// =============================================================================
// Entities have no load-bearing numbers (just names + type + notes), so they
// sync without the "verify balances" walkthrough that gates the numeric
// tables (accounts, debts, transactions, rentals). See
// memory/project_full-data-sync-next-priority for the seed-handling design
// (Option C: upload seed, then verify-gate for numeric tables).
// =============================================================================
import { createTableSync } from './table-sync.js';

export const entitiesSync = createTableSync({
  localKey: 'entities',
  remoteTable: 'entities',

  // Local shape:  { id: 'e-personal', name: '...', type: 'personal'|'business', notes: '...' }
  // Schema shape: { id (uuid), instance_id, created_by, slug, display_name,
  //                 entity_type ('personal'|'business'), notes, created_at, updated_at }
  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by: userId,
      slug: item.id, // local 'e-personal' becomes the slug
      display_name: item.name,
      entity_type: item.type === 'business' ? 'business' : 'personal',
      notes: item.notes ?? null,
    };
  },

  fromRow(row) {
    // After upload, the Supabase row has both a UUID `id` and the original
    // local-id-as-`slug`. We keep `id` as the slug (the prototype's
    // identifier) so existing FK references like `entityId: 'e-personal'`
    // keep working. The DB UUID is held as `remoteUuid` for future use.
    return {
      id: row.slug,
      remoteUuid: row.id,
      tenantId: row.instance_id,
      name: row.display_name,
      type: row.entity_type,
      notes: row.notes,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };
  },

  idOf(item) {
    return item.id; // the slug
  },
});
