// =============================================================================
// transactions-sync — cross-device sync for the transactions table
// =============================================================================
// Higher-volume than accounts/debts (every income/expense row), but each
// row is small and immutable in practice (mostly inserts + occasional
// edits). Same verify-gated pattern.
//
// Local shape:
//   { id: 't13', date: '2026-05-15', accountId: 'a-chase-pers-8168',
//     amount: 550.00, description: '...', category: 'rental-income',
//     entityOverride: 'e-poeprops', isTransfer: false }
//
// Remote shape (schema v1.2 transactions row):
//   { id, instance_id, created_by, created_at, updated_at,
//     account_id (uuid, populated by trigger from account_slug),
//     txn_date, amount, description, category, is_transfer,
//     entity_override (uuid), linked_to_kind, linked_to_id,
//     reconciliation (jsonb — bank-match attestation + invoice rollup, 0036),
//     slug, account_slug, entity_override_slug }
// =============================================================================
import { createTableSync } from './table-sync.js';

export const transactionsSync = createTableSync({
  localKey: 'transactions',
  remoteTable: 'transactions',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id:            tenantId,
      created_by:           userId,
      slug:                 item.id,
      account_slug:         item.accountId ?? null,
      entity_override_slug: item.entityOverride ?? null,
      txn_date:             item.date,
      amount:               Number(item.amount) || 0,
      description:          item.description ?? null,
      category:             item.category ?? null,
      is_transfer:          !!item.isTransfer,
      reconciliation:       item.reconciliation ?? null,
      receipt:              item.receipt ?? null,
    };
  },

  fromRow(row) {
    return {
      id:             row.slug ?? `t-remote-${row.id}`,
      remoteUuid:     row.id,
      tenantId:       row.instance_id,
      accountId:      row.account_slug ?? null,
      entityOverride: row.entity_override_slug ?? null,
      date:           row.txn_date,
      amount:         Number(row.amount) || 0,
      description:    row.description,
      category:       row.category,
      isTransfer:     !!row.is_transfer,
      reconciliation: row.reconciliation ?? null,
      receipt:        row.receipt ?? null,
      updatedAt:      row.updated_at,
      createdAt:      row.created_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
