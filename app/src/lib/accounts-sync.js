// =============================================================================
// accounts-sync — cross-device sync for the accounts table
// =============================================================================
// Builds on the generic createTableSync helper. The schema v1.2 migration
// adds slug, entity_slug, in_legal, is_primary columns to accounts; this
// wrapper maps the local prototype shape to/from those columns.
//
// Gated by the verify-balances walkthrough — see VerifyBalances.jsx and
// memory/project_full-data-sync-next-priority for the Option-C design.
//
// Local shape (from MVP seed + addAccount):
//   { id: 'a-chase-pers-8168', entityId: 'e-personal', name: '...',
//     institution: '...', type: 'checking'|'savings'|'credit'|'loan'|...,
//     fragment: '...8168', balance: 4223, inLegal: false, isPrimary: false }
//
// Remote shape (schema v1.2 accounts row):
//   { id (uuid), instance_id, created_by, created_at, updated_at,
//     entity_id (uuid, populated by trigger from entity_slug),
//     slug, entity_slug, display_name, institution, account_type,
//     fragment, balance, in_legal, is_primary }
// =============================================================================
import { createTableSync } from './table-sync.js';

const ALLOWED_TYPES = new Set(['checking','savings','credit','loan','investment','cash']);

function normalizeType(t) {
  // The MVP uses the same labels as the schema CHECK constraint, but defend
  // against legacy/free-form values to avoid an insert-time rejection.
  if (ALLOWED_TYPES.has(t)) return t;
  if (t === 'cc' || t === 'creditCard') return 'credit';
  return 'cash';
}

export const accountsSync = createTableSync({
  localKey: 'accounts',
  remoteTable: 'accounts',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id:    tenantId,
      created_by:   userId,
      slug:         item.id,
      entity_slug:  item.entityId ?? null,
      display_name: item.name ?? '',
      institution:  item.institution ?? null,
      account_type: normalizeType(item.type),
      fragment:     item.fragment ?? null,
      balance:      Number(item.balance) || 0,
      in_legal:     !!item.inLegal,
      is_primary:   !!item.isPrimary,
    };
  },

  fromRow(row) {
    return {
      id:          row.slug ?? `a-remote-${row.id}`,
      remoteUuid:  row.id,
      tenantId:    row.instance_id,
      entityId:    row.entity_slug ?? null,
      name:        row.display_name,
      institution: row.institution,
      type:        row.account_type,
      fragment:    row.fragment,
      balance:     Number(row.balance) || 0,
      inLegal:     !!row.in_legal,
      isPrimary:   !!row.is_primary,
      updatedAt:   row.updated_at,
      createdAt:   row.created_at,
    };
  },

  idOf(item) {
    return item.id; // the slug
  },
});
