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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A books entry as its cloud row (exported for its tests, DR-1211). */
export function transactionToRow(item, { tenantId, userId }) {
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
      // THE ASSET THIS MONEY BELONGS TO (DR-1211). The columns have existed
      // since schema v1 and were never sent, so a rent entry reached the books
      // naming its door only inside its description. A door's id is a uuid,
      // so only a uuid is ever written; anything else is no link.
      linked_to_kind:       UUID.test(String(item.linkedToId || '')) && item.linkedToKind ? String(item.linkedToKind) : null,
      linked_to_id:         UUID.test(String(item.linkedToId || '')) && item.linkedToKind ? String(item.linkedToId).toLowerCase() : null,
    };
  }

/** A cloud row as the books entry the app holds. */
export function rowToTransaction(row) {
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
      linkedToKind:   row.linked_to_kind ?? null,
      linkedToId:     row.linked_to_id ?? null,
      updatedAt:      row.updated_at,
      createdAt:      row.created_at,
    };
  }

export const transactionsSync = createTableSync({
  localKey: 'transactions',
  remoteTable: 'transactions',
  // Watermark delta on updated_at (migration 0136 backfilled the 1,978 NULLs
  // and added the touch trigger) + deletions reconciled from record_events —
  // the ledger held 2,953 rows / 3.4 MB and re-downloaded WHOLE on every one
  // of its 17,374 lifetime writes. appendOnly is unsound here (rows update and
  // delete); this mode keeps the consumer's full-list contract via the
  // controller's cache. See table-sync.js `mutableDelta`.
  mutableDelta: true,
  eventsKind: 'transaction',

  toRow: transactionToRow,
  fromRow: rowToTransaction,

  idOf(item) {
    return item.id;
  },
});
