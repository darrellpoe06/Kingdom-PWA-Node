// =============================================================================
// txn-dedupe — content-key merge that kills the transaction double-count
// =============================================================================
// The sync merge (unionPreservingLocal) keyed only on slug, so a STALE LOCAL
// import row (old slug, wrong old category, e.g. the mortgage tagged Vehicle)
// survived alongside the reconciled CLOUD row (same payment, Debt-Payment) — two
// rows for one transaction, inflating totals. This merges by CONTENT
// (date+amount+payee+account): a local row is dropped when a cloud row already
// covers the same transaction, even if their slugs differ. Cloud is the source
// of truth; genuinely local-only rows are kept; and it never collapses two CLOUD
// rows, so a legitimate same-day/same-amount pair the bank really has survives.
//
// Pure (no Supabase / no window) so it is node-testable; table-sync + the app
// import it. Deterministic.
// =============================================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Content key for a transaction: date + amount + payee + account. Accepts both
// the local shape (date/accountId) and the remote row shape (txn_date/account_slug).
export function txnContentKey(t) {
  return [
    String(t?.date ?? t?.txn_date ?? ''),
    Number(t?.amount) || 0,
    String(t?.description ?? '').trim().toLowerCase(),
    String(t?.accountId ?? t?.account_slug ?? ''),
  ].join('|');
}

export function mergeTransactionsPreferCloud(currentLocal, remoteItems, idOf = (item) => item?.id) {
  const remote = remoteItems || [];
  const remoteIds = new Set(remote.map((r) => idOf(r)));
  const remoteKeys = new Set(remote.map(txnContentKey));
  const keep = (currentLocal || []).filter((l) => {
    const lid = idOf(l);
    if (!lid || UUID_RE.test(String(lid))) return false;
    if (remoteIds.has(lid)) return false;               // same row by slug -> cloud copy used
    // A row that was SYNCED (carries a remoteUuid) but is now ABSENT from the cloud
    // list was DELETED remotely — propagate the deletion, do NOT re-add it. This is
    // the fix for "the duplicates leave and come back after the clear" (Darrell
    // 2026-07-19): when the device is OUT OF LOCAL SPACE the snapshot can't save, so
    // stale localStorage still holds the just-deleted rows; without this guard the
    // merge re-hydrated them as "local-only" (their generic "DEBIT" content-key
    // doesn't match the surviving real row, so the content check below missed them).
    // Keying on the remoteUuid FIELD, not the id format, is what catches them —
    // cloud rows carry a slug id (not a UUID), so the UUID_RE check above never did.
    if (l.remoteUuid) return false;
    if (remoteKeys.has(txnContentKey(l))) return false; // stale dupe by content -> cloud wins
    return true;                                        // genuinely local-only (never synced)
  });
  return keep.length ? [...remote, ...keep] : remote;
}
