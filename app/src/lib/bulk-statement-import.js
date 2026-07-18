// =============================================================================
// bulk-statement-import — robust, seamless, many-files-at-once import (DR-0061)
// =============================================================================
// "We want it easy and hard to get wrong" (Darrell). The single-file importer
// forces the user to pick the right account for each file, four times, with no
// duplicate protection — error-prone, and it does not scale to onboarding new
// clients. This plans a BULK import: drop ALL the statement files at once, each
// transaction is AUTO-ROUTED to the right account, and duplicates are rejected
// so a re-upload (or overlapping files) can NEVER double-count.
//
// Two robustness guarantees:
//   1. AUTO-ROUTE — the account is detected from the filename's 4-digit tail
//      (matched to account.fragment, e.g. 'ledger-chase7206...' -> the ...7206
//      account). Files that don't match are reported as "unrouted" with a
//      reason, NOT silently dropped and NOT misfiled.
//   2. DEDUPE — every row is keyed by its FITID when present, else by a content
//      key (account + date + amount + description). The key set is seeded from
//      the existing ledger AND grows within the batch, so the same transaction
//      can't land twice across files, re-uploads, or a partial earlier import.
//
// Pure + deterministic: it returns a PLAN ({routed, unrouted, duplicates,
// totalNew}); the caller shows the summary and commits via its own
// addTransaction path. No double-count, no misfile, one click.
// =============================================================================

// Detect the target account for a file by matching an account's fragment digits
// ANYWHERE in the filename (robust to dates/suffixes, e.g. the 7206 in
// 'ledger-chase7206-2026-05.csv'). The MOST SPECIFIC match wins (longest fragment),
// so a short coincidental run can't beat the real account number. Returns an
// account id, or null when nothing matches (the file is reported, not misfiled).
export function detectAccount(filename, accounts) {
  const name = String(filename || '');
  let best = null;
  for (const a of accounts || []) {
    const frag = String((a && a.fragment) || '').replace(/\D/g, '');
    if (frag.length >= 3 && name.includes(frag)) {
      if (!best || frag.length > best.len) best = { id: a.id, len: frag.length };
    }
  }
  return best ? best.id : null;
}

// A stable dedupe key for a row on an account. FITID is authoritative when the
// source carries it; otherwise content is the fallback for plain bank/CSV exports.
//
// The content key is date + amount + first 40 chars of the description AND, when
// the export carries it, the running BALANCE after the transaction. The balance
// is the deterministic disambiguator (Christina's books, 2026-07-18): two GENUINE
// same-day same-amount purchases (e.g. two $200 deposits) leave DIFFERENT running
// balances, so they get DIFFERENT keys and are BOTH kept — while a true re-import
// of the same file computes the SAME balance, so it still dedupes (idempotent).
// Without the balance, the old key wrongly collapsed 17 of Christina's real
// repeat transactions into one. Balance is content-derived, not human-entered, so
// it can't be gamed: identity is decided by the bank's own arithmetic.
export function txnDedupeKey(accountId, t) {
  const amt = (Number(t.amount) || 0).toFixed(2);
  const desc = String(t.description || t.desc || '').slice(0, 40).toLowerCase().trim();
  const bal = (t.balance == null || t.balance === '') ? '' : (Number(t.balance) || 0).toFixed(2);
  return [accountId, t.date, amt, desc, bal].join('|');
}

function seedSeen(existingTxns) {
  const seen = new Set();
  for (const t of existingTxns || []) {
    if (!t) continue;
    if (t.fitid) seen.add('fit:' + t.fitid);
    if (t.accountId && t.date) seen.add(txnDedupeKey(t.accountId, t));
  }
  return seen;
}

// accountTxnIds — the transaction ids that belong to ONE account. Used by the
// "reset this account's register" control (Christina's books, 2026-07-18): after
// a bad/collapsed earlier import, the family clears a single account and re-imports
// a clean statement. Scoped STRICTLY to the chosen account so a reset can NEVER
// reach another account's ledger, and it returns ids (the delete unit) so the
// caller just loops deleteTransaction. Pure + deterministic — the destructive act
// stays the family's own confirmed click; this only decides the exact, minimal set.
export function accountTxnIds(txns, accountId) {
  if (!accountId) return [];
  return (txns || []).filter((t) => t && t.accountId === accountId && t.id).map((t) => t.id);
}

// planBulkImport — route + dedupe a batch of parsed files into an import plan.
//   files: [{ name, rows: [{ date, description, amount, category?, fitid? }] }]
//   accounts, existingTxns: the app's accounts + current ledger (for routing + dedupe)
//   fallbackAccountId: optional — where unmatched files go IF the user picked one
// Returns { routed: [{accountId, accountName, count, txns}], unrouted: [{name,count,reason}],
//           duplicates, totalNew, totalRows }.
export function planBulkImport(files, accounts = [], existingTxns = [], fallbackAccountId = null) {
  const seen = seedSeen(existingTxns);
  const routed = {};
  const unrouted = [];
  let duplicates = 0;
  let totalNew = 0;
  let totalRows = 0;
  for (const file of files || []) {
    const rows = (file && Array.isArray(file.rows)) ? file.rows : [];
    totalRows += rows.length;
    const accId = detectAccount(file && file.name, accounts) || fallbackAccountId || null;
    if (!accId) {
      unrouted.push({ name: (file && file.name) || 'file', count: rows.length, reason: 'no matching account — pick one' });
      continue;
    }
    const acc = (accounts || []).find((a) => a.id === accId);
    for (const r of rows) {
      if (!r || !r.date) continue;
      const fitKey = r.fitid ? 'fit:' + r.fitid : null;
      const cKey = txnDedupeKey(accId, r);
      if ((fitKey && seen.has(fitKey)) || seen.has(cKey)) { duplicates += 1; continue; }
      if (fitKey) seen.add(fitKey);
      seen.add(cKey);
      const bucket = routed[accId] || (routed[accId] = { accountId: accId, accountName: (acc && acc.name) || accId, count: 0, txns: [] });
      bucket.txns.push({
        date: r.date,
        accountId: accId,
        amount: Number(r.amount) || 0,
        description: String(r.description || r.desc || '').slice(0, 200),
        category: r.category || 'other',
        // Every planned row gets a STABLE, UNIQUE id (Christina's books, 2026-07-18).
        // Without one, a synchronous import loop hit addTransaction's `t-${Date.now()}`
        // fallback, so MANY rows collided on the SAME millisecond id -> they collapsed
        // on cloud upsert (one slug) and in the merge, so imports "did not appear" and
        // only a few dates survived. Use fitid when the source has it; otherwise the
        // content dedupe key (already unique per distinct txn AND idempotent across
        // re-imports, since seedSeen dedupes against the existing ledger).
        id: r.fitid ? 'vl-' + r.fitid : 'imp-' + cKey,
        ...(r.fitid ? { fitid: String(r.fitid) } : {}),
        // Persist the running balance so (a) a later re-import rebuilds the SAME
        // dedupe key (idempotent) and (b) the balance-continuity audit can verify
        // the ledger is complete + un-double-counted. Only when the source had it.
        ...(r.balance != null && r.balance !== '' ? { balance: Number(r.balance) || 0 } : {}),
      });
      bucket.count += 1;
      totalNew += 1;
    }
  }
  return { routed: Object.values(routed), unrouted, duplicates, totalNew, totalRows };
}
