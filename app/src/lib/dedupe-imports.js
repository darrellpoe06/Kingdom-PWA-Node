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
// It catches TWO duplicate classes, so the system finds them itself (Darrell
// 2026-07-19: "don't expect users to tell the systems"):
//   RULE 1 — a generic-type twin ("DEBIT"/"ACH_CREDIT"/…) shadowing a real row.
//   RULE 2 — balance-anchored (REV-0101): two REAL rows with DIFFERING descriptions
//     (e.g. "OPTUMCLAIM" vs "OPTUMCLAIM PPD ID: …", one "Other" one "ACH Deposit")
//     that share the SAME account+date+amount AND the SAME running balance — the
//     same ledger line imported twice, which Rule 1 misses because neither is
//     generic. Balance is the airtight discriminator: two DISTINCT transactions can
//     never share a post-balance, and a row with NO balance is never guessed at.
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
//     the real-count, which under-removed when a group held MORE generic copies than
//     real rows — forcing the family to tap "remove" round after round. Those extra
//     copies are app-generated, NOT the user re-importing — Darrell 2026-07-19: "I
//     don't even re-upload"; the mechanism that mints them is a separate open item.
//     The balance-continuity audit, REV-0101, backstops any rare over-removal.)
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
  const removed = new Set();          // ids already flagged, so the two rules never double-count
  const byAccount = {};
  const flag = (t) => {
    if (t.id == null || removed.has(t.id)) return;
    removed.add(t.id);
    removeIds.push(t.id);
    byAccount[t.accountId] = (byAccount[t.accountId] || 0) + 1;
  };
  for (const idxs of groups.values()) {
    if (idxs.length < 2) continue; // no pair, nothing to dedupe
    const rows = idxs.map((i) => transactions[i]);
    // Rule 1 — generic-type twins: a payee-less "DEBIT"/"CREDIT"/"CHECK" residue of
    // the Details-column mis-map shadowing a REAL-payee row. Need BOTH kinds; then
    // EVERY generic twin in the anchored group is junk (one pass clears a re-import).
    const real = rows.filter((t) => !isGenericDescription(t.description || t.desc));
    const generic = rows.filter((t) => isGenericDescription(t.description || t.desc));
    if (real.length && generic.length) {
      generic.filter((t) => t.id != null)
        .sort((a, b) => String(a.id).localeCompare(String(b.id)))
        .forEach(flag);
    }
    // Rule 2 — balance-anchored (REV-0101): two rows on the SAME account, date and
    // signed amount that also carry the SAME running balance are the SAME ledger
    // line imported twice — two DISTINCT transactions can never share a post-balance
    // (the balance moved between them). This is what catches the twins Rule 1 misses
    // because BOTH rows are real with DIFFERING descriptions/categories (Darrell
    // 2026-07-19: CONNECTYOURCARE OPTUMCLAIM vs "…PPD ID: …", one "Other" one "ACH
    // Deposit", same $600/$208.33 same day). Keep the most-informative row (longest
    // description; tie → lowest id); flag the rest. Rows with NO balance are left
    // untouched (can't anchor → never guess), so two genuine same-day/same-amount
    // purchases that lack a balance are still NEVER removed.
    const byBalance = new Map();
    for (const t of rows) {
      if (t.id == null || removed.has(t.id)) continue;
      const b = cents(t.balance);
      if (Number.isNaN(b)) continue; // no running balance on this row → cannot anchor
      const list = byBalance.get(b) || (byBalance.set(b, []).get(b));
      list.push(t);
    }
    for (const dupes of byBalance.values()) {
      if (dupes.length < 2) continue;
      const keep = [...dupes].sort((a, b) => {
        const byLen = String(b.description || b.desc || '').length - String(a.description || a.desc || '').length;
        return byLen !== 0 ? byLen : String(a.id).localeCompare(String(b.id));
      })[0];
      dupes.filter((t) => t.id !== keep.id).forEach(flag);
    }
  }
  removeIds.sort((a, b) => String(a).localeCompare(String(b))); // stable output
  return { removeIds, count: removeIds.length, byAccount };
}
