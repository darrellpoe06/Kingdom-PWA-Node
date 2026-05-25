// =============================================================================
// debts-sync — cross-device sync for the debts table
// =============================================================================
// Debts drive the debt-free projection (the headline number on Pressure,
// Books > Debts, and the BigPicture forecast). Highest-consequence numeric
// sync after accounts. Same gated-by-verify-balances pattern.
//
// Local shape:
//   { id: 'd7', name: 'UIECU', minPayment: 300, rate: 22.3, balance: 13102,
//     flag: 'ATTACK FIRST', note: '...', leaveAlone: false,
//     entityId: 'e-personal' }
//
// Remote shape (schema v1.2 debts row):
//   { id (uuid), tenant_id, created_by, created_at, updated_at,
//     entity_id (uuid, populated by trigger from entity_slug),
//     slug, entity_slug, creditor, debt_type, balance, apr,
//     minimum_payment, extra_payment, promo_zero_apr_until, notes,
//   leave_alone, flag_label, note }
// Note: v1 schema has both `notes` (NOT NULL false) and v1.2 adds `note`
// for compatibility with the local shape; we write to `note` and `notes`
// stays untouched.
// =============================================================================
import { createTableSync } from './table-sync.js';

export const debtsSync = createTableSync({
  localKey: 'debts',
  remoteTable: 'debts',

  toRow(item, { tenantId, userId }) {
    return {
      tenant_id:        tenantId,
      created_by:       userId,
      slug:             item.id,
      entity_slug:      item.entityId ?? null,
      creditor:         item.name ?? '',
      debt_type:        item.debtType ?? null,
      balance:          Number(item.balance) || 0,
      apr:              item.rate !== undefined ? Number(item.rate) : null,
      minimum_payment:  item.minPayment !== undefined ? Number(item.minPayment) : null,
      extra_payment:    Number(item.extraPayment) || 0,
      promo_zero_apr_until: item.promoZeroAprUntil ?? null,
      leave_alone:      !!item.leaveAlone,
      flag_label:       item.flag ?? null,
      notes:            item.note ?? null,
    };
  },

  fromRow(row) {
    return {
      id:           row.slug ?? `d-remote-${row.id}`,
      remoteUuid:   row.id,
      tenantId:     row.tenant_id,
      entityId:     row.entity_slug ?? null,
      name:         row.creditor,
      debtType:     row.debt_type,
      balance:      Number(row.balance) || 0,
      rate:         row.apr !== null ? Number(row.apr) : 0,
      minPayment:   row.minimum_payment !== null ? Number(row.minimum_payment) : 0,
      extraPayment: Number(row.extra_payment) || 0,
      promoZeroAprUntil: row.promo_zero_apr_until,
      leaveAlone:   !!row.leave_alone,
      flag:         row.flag_label,
      note:         row.notes,
      updatedAt:    row.updated_at,
      createdAt:    row.created_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
