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
// Remote shape (schema v1.2 accounts row; 0129 adds the debt declaration):
//   { id (uuid), instance_id, created_by, created_at, updated_at,
//     entity_id (uuid, populated by trigger from entity_slug),
//     slug, entity_slug, display_name, institution, account_type,
//     fragment, balance, in_legal, is_primary,
//     treat_as_debt, min_payment, rate }
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';
import { dedupeDebtAccountStrays } from './accounts-dedupe.js';

const ALLOWED_TYPES = new Set(['checking','savings','credit','loan','investment','cash']);

function normalizeType(t) {
  // The MVP uses the same labels as the schema CHECK constraint, but defend
  // against legacy/free-form values to avoid an insert-time rejection.
  if (ALLOWED_TYPES.has(t)) return t;
  if (t === 'cc' || t === 'creditCard') return 'credit';
  return 'cash';
}

// Exported for the mapper tests (the 2026-08-04 "won't stick" regression pin):
// the debt declaration must survive the local -> row -> local round trip.
export function accountToRow(item, { tenantId, userId }) {
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
    // The debt declaration (0129). These three are what "Add as debt" /
    // "Treat as debt" write; dropping them here was the "won't stick" bug —
    // the first refetch erased the declaration and the Debts row vanished.
    treat_as_debt: !!item.treatAsDebt,
    min_payment:  Number(item.minPayment) || 0,
    rate:         Number(item.rate) || 0,
    // The card's own terms (0133). NULL is meaningful here and must survive the
    // round trip: an unknown limit is not a $0 limit, and an unknown peak is not
    // a $0 peak — `Number(x) || 0` would turn every blank the family left into a
    // hard zero (DR-0076, no painted number). rate_known is what keeps a genuine
    // 0% card distinguishable from a rate nobody has entered yet.
    credit_limit:    item.creditLimit    != null && item.creditLimit    !== '' ? Number(item.creditLimit)    : null,
    highest_balance: item.highestBalance != null && item.highestBalance !== '' ? Number(item.highestBalance) : null,
    rate_min:        item.rateMin        != null && item.rateMin        !== '' ? Number(item.rateMin)        : null,
    rate_known:      !!item.rateKnown,
  };
}

export function accountFromRow(row) {
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
    treatAsDebt: !!row.treat_as_debt,
    minPayment:  Number(row.min_payment) || 0,
    rate:        Number(row.rate) || 0,
    // Unknown stays unknown on the way back (0133) — see accountToRow.
    creditLimit:    row.credit_limit    != null ? Number(row.credit_limit)    : null,
    highestBalance: row.highest_balance != null ? Number(row.highest_balance) : null,
    rateMin:        row.rate_min        != null ? Number(row.rate_min)        : null,
    rateKnown:      !!row.rate_known,
    updatedAt:   row.updated_at,
    createdAt:   row.created_at,
  };
}

export const accountsSync = createTableSync({
  localKey: 'accounts',
  remoteTable: 'accounts',
  toRow: accountToRow,
  fromRow: accountFromRow,
  idOf(item) {
    return item.id; // the slug
  },
});

// The monolith's accounts merge: the standard local-preserving union, then the
// duplicate-"Add as debt"-stray collapse (a device whose localStorage predates
// the 0129 cloud cleanup still holds those rows; the union's non-UUID-id keep
// rule would resurrect the view duplicates forever otherwise). Lives here so
// the monolith wires it in a single expression (DR-0078 line budget).
export const accountsMerge = (current, incoming) =>
  dedupeDebtAccountStrays(unionPreservingLocal(current, incoming));
