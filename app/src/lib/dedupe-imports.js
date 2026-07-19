// =============================================================================
// dedupe-imports — the system removes duplicate imported rows, so a human never
// has to reset-and-re-import account by account (Darrell 2026-07-19: "can't the
// system do this so we have no human errors?")
// =============================================================================
// A plain "Import" ADDS rows; running it after a bad column-mapping (Details ->
// "DEBIT") left the ledger with TWO copies of the same transaction — a real-payee
// row AND its generic-type twin ("DEBIT"/"CREDIT"/"CHECK") with the identical
// account+date+amount — which doubled every total. This finds those junk twins and
// returns the ids to remove, KEEPING the real-payee row.
//
// SAFETY (it deletes financial rows, so it is conservative by construction):
//   * Rows are grouped by accountId + date + SIGNED amount-to-the-cent. Only rows
//     that are the SAME money on the SAME day in the SAME account can pair.
//   * Within a group, a row is "generic" only when its whole description is a bank
//     TYPE word (debit/credit/check/dslip/ach/…). Anything with a real merchant is
//     "real".
//   * A group needs BOTH kinds to dedupe — so two GENUINE same-day/same-amount
//     purchases that are ALL real, or ALL generic, are NEVER touched. When a group
//     has a real anchor, EVERY generic twin in it is junk (payee-less residue of the
//     Details-column mis-map) and is removed in one pass. (It used to cap removal at
//     the real-count, which under-removed when a statement was re-imported several
//     times — many generic copies per real row — forcing the family to tap "remove"
//     round after round. The balance-continuity audit, REV-0101, backstops any rare
//     over-removal.)
//   * Rows carrying a remoteUuid are still removable (the caller deletes them from
//     the cloud too); rows with no id are skipped (nothing to delete).
// Pure + deterministic. The caller deletes the returned ids in the family session.
// =============================================================================

// A description that is ONLY a bank transaction-type word carries no payee — it is
// the residue of the Details-column mis-map. Kept deliberately tight so a real
// merchant is never called "generic".
const GENERIC_DESC = /^(debit|credit|check|dslip|ach|ach[_ ]?debit|ach[_ ]?credit|withdrawal|deposit|pos|point of sale|electronic|misc[_ ]?debit|misc[_ ]?credit)$/i;

export function isGenericDescription(desc) {
  return GENERIC_DESC.test(String(desc || '').trim());
}

function cents(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v * 100) : NaN;
}

// findImportDuplicates(transactions) -> { removeIds, count, byAccount } where
// removeIds are the ids of generic-type duplicate rows that each shadow a real
// row with the same account+date+amount. byAccount maps accountId -> how many
// were flagged there. Pure; removes nothing itself.
export function findImportDuplicates(transactions) {
  // Group indexes of rows by accountId | date | signedCents.
  const groups = new Map();
  (transactions || []).forEach((t, i) => {
    if (!t || t.accountId == null || !t.date) return;
    const c = cents(t.amount);
    if (Number.isNaN(c)) return;
    const key = `${t.accountId}|${t.date}|${c}`;
    const g = groups.get(key) || (groups.set(key, []).get(key));
    g.push(i);
  });

  const removeIds = [];
  const byAccount = {};
  for (const idxs of groups.values()) {
    if (idxs.length < 2) continue; // no pair, nothing to dedupe
    const real = [];
    const generic = [];
    for (const i of idxs) {
      const t = transactions[i];
      if (isGenericDescription(t.description || t.desc)) generic.push(t); else real.push(t);
    }
    if (!real.length || !generic.length) continue; // need BOTH kinds to be a mis-map twin
    // Remove EVERY generic twin in this anchored group (not a capped slice): the
    // generics are payee-less residue and the real row(s) carry the truth, so ONE
    // tap fully cleans a re-imported statement instead of peeling off real-count at
    // a time. Deterministic order: by id so it's stable.
    const removable = generic
      .filter((t) => t.id != null)
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    for (const t of removable) {
      removeIds.push(t.id);
      byAccount[t.accountId] = (byAccount[t.accountId] || 0) + 1;
    }
  }
  return { removeIds, count: removeIds.length, byAccount };
}
