// =============================================================================
// statement-reconciliation — validate the STORED ledger against the SOURCE file
// =============================================================================
// Christina's directive (2026-07-18): "validate the application against the
// source data rather than assuming the source data is incomplete... Before
// asking me to reset and re-import again, verify the system is interpreting the
// imported data correctly." A month can read short (June showed 166 of a real
// 323) as RESIDUE of an older buggy import — rows that never reached the cloud
// because a same-millisecond id collision collapsed them on upsert, or a
// fire-and-forget upload silently dropped them. Those root causes are fixed
// FORWARD (stable unique ids + verified commit-with-repair), but the already-
// stored data is not healed by a forward fix.
//
// This is the READ-ONLY instrument that proves the gap before any write: drop
// the same statement the bank shows, and it reports PER MONTH how the stored
// ledger compares to the source of truth —
//   stored  : rows already in the ledger for this account/month
//   inFile  : rows the statement lists for this month
//   missing : file rows with NO matching stored row (the lost rows to add back)
//   extra   : stored rows with no matching file row (possible double-count/residue)
// and hands back the exact `missingRows` ready to commit through the VERIFIED
// path (commit-with-repair + "N of M saved" readout) — so the repair is
// non-destructive (add only what's missing, never a blind reset) and proven.
//
// Match uses the SAME txnDedupeKey + occurrence index as planBulkImport, so this
// preview is faithful to what a commit actually does: a file row is a duplicate
// of a stored row only when date + amount + first-40 desc + running balance all
// agree (genuine same-day/same-amount twins keep different balances, so both
// survive; a true re-import of the same file computes the same balance, so it
// dedupes). Pure + deterministic. RLS-scoped by the caller (its own ledger).
// =============================================================================

import { txnDedupeKey } from './bulk-statement-import.js';

// 'YYYY-MM' month bucket for a date string; anything undated buckets to 'undated'.
function monthKeyOf(date) {
  const s = String(date || '');
  return /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : 'undated';
}

// Human label for a 'YYYY-MM' key, e.g. '2026-06' -> 'June 2026'. 'undated' as-is.
export function reconMonthLabel(key) {
  if (!/^\d{4}-\d{2}$/.test(key)) return 'Undated';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// reconcileStatement(fileRows, storedTxns, accountId) -> {
//   byMonth: [{ month, label, stored, inFile, missing, extra }] (months the FILE
//            covers, newest-first), missingRows: [row...] (the file rows absent
//            from the store, ready to commit), totalStored, totalInFile,
//            totalMissing, totalExtra, accountId }.
// `fileRows` are parsed statement rows ({ date, desc|description, amount, balance? });
// only rows with a date are considered. `storedTxns` is the current ledger; only
// rows on `accountId` participate (an import always targets one account). Pure.
export function reconcileStatement(fileRows, storedTxns, accountId) {
  // Occurrence-indexed multiset of the stored rows for THIS account, per month.
  // storedKeys holds `contentKey#occ` so N identical stored rows occupy #0..#(N-1)
  // — the same seeding planBulkImport uses, so the match is identical.
  const storedKeys = new Set();
  const storedOcc = new Map();
  const storedByMonth = new Map();
  for (const t of storedTxns || []) {
    if (!t || t.accountId !== accountId || !t.date) continue;
    const mk = monthKeyOf(t.date);
    storedByMonth.set(mk, (storedByMonth.get(mk) || 0) + 1);
    const ck = txnDedupeKey(accountId, t);
    const n = storedOcc.get(ck) || 0;
    storedKeys.add(ck + '#' + n);
    storedOcc.set(ck, n + 1);
  }

  const missingRows = [];
  const inFileByMonth = new Map();
  const missingByMonth = new Map();
  const matchedByMonth = new Map();
  const fileOcc = new Map();
  const monthOrder = [];
  for (const r of fileRows || []) {
    if (!r || !r.date) continue;
    const mk = monthKeyOf(r.date);
    if (!inFileByMonth.has(mk)) monthOrder.push(mk);
    inFileByMonth.set(mk, (inFileByMonth.get(mk) || 0) + 1);
    const ck = txnDedupeKey(accountId, r);
    const idx = fileOcc.get(ck) || 0;
    fileOcc.set(ck, idx + 1); // advance for every row so twins land on #0,#1,...
    const occKey = ck + '#' + idx;
    if (storedKeys.has(occKey)) {
      matchedByMonth.set(mk, (matchedByMonth.get(mk) || 0) + 1);
    } else {
      missingByMonth.set(mk, (missingByMonth.get(mk) || 0) + 1);
      missingRows.push(r);
    }
  }

  const byMonth = monthOrder
    .map((mk) => {
      const stored = storedByMonth.get(mk) || 0;
      const matched = matchedByMonth.get(mk) || 0;
      return {
        month: mk,
        label: reconMonthLabel(mk),
        stored,
        inFile: inFileByMonth.get(mk) || 0,
        missing: missingByMonth.get(mk) || 0,
        // Stored rows in this month with no corresponding file row: residue or a
        // double-count. Never negative.
        extra: Math.max(0, stored - matched),
      };
    })
    .sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0)); // newest-first

  return {
    accountId,
    byMonth,
    missingRows,
    totalStored: byMonth.reduce((s, m) => s + m.stored, 0),
    totalInFile: byMonth.reduce((s, m) => s + m.inFile, 0),
    totalMissing: missingRows.length,
    totalExtra: byMonth.reduce((s, m) => s + m.extra, 0),
  };
}
