// =============================================================================
// family-trust-sync — cross-device sync for the Legacy Provisions ledger (0167)
// =============================================================================
// One flat table (family_trust_records) carries every record kind the system
// keeps — a production entry, a distribution, an article attestation, an
// exemption, and a spendthrift review answer — grouped by `kind`, the same
// grouping-by-kind model the advocacy ledger proved (0132).
//
// FAMILY-SCOPED, NOT PERSON-SCOPED. This diverges from the Road-to-150 pattern
// on purpose: a health log is one person's alone, but a trust ledger is the
// house's shared record — a trustee must be able to read a beneficiary's
// standing, which is the entire point of the provision. RLS scopes rows to the
// instance (owner/admin/member); the migration is the real wall.
//
// Local-first: every method no-ops signed out, the surface works from
// localStorage alone (family-trust-store.js), and sync resumes on sign-in.
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export const familyTrustSync = createTableSync({
  localKey: 'poetech-family-trust-entries-v1',
  remoteTable: 'family_trust_records',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by: userId,
      slug: item.id,
      kind: item.kind ?? 'production',
      beneficiary: item.beneficiary ?? '',
      occurred_at: item.occurredAt || null,
      label: item.label ?? null,
      production_kind: item.productionKind ?? null,
      amount: item.amount == null || item.amount === '' ? null : item.amount,
      article_id: item.articleId ?? null,
      item_id: item.itemId ?? null,
      answer: item.answer ?? null,
      reason: item.reason ?? null,
      note: item.note ?? null,
    };
  },

  fromRow(row) {
    return {
      id: row.slug ?? `ft-remote-${row.id}`,
      remoteUuid: row.id,
      kind: row.kind ?? 'production',
      beneficiary: row.beneficiary ?? '',
      occurredAt: row.occurred_at ?? null,
      label: row.label ?? '',
      productionKind: row.production_kind ?? null,
      amount: row.amount == null ? null : Number(row.amount),
      articleId: row.article_id ?? null,
      itemId: row.item_id ?? null,
      answer: row.answer ?? null,
      reason: row.reason ?? null,
      note: row.note ?? '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});

// Merge a fresh cloud list with the current local list, preserving any
// locally-created record whose INSERT hasn't landed yet — the same data-loss
// guard every other sync in the app uses.
export function mergeRemoteTrustRecords(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
