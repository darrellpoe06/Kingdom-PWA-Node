// =============================================================================
// verified-ledger-sync — merge the NAS verified ledger into the durable in-app
// ledger (DR-0083, the money loop's "automatic" tier)
// =============================================================================
// The sovereign Python ingest on the NAS (infra/nas-finance-ingest) produces a
// VERIFIED bank ledger (deduped by FITID, running balance, 25 months). This lib
// maps that payload into the app's own transactions so it flows through the
// SAME durable, cloud-synced ledger that drives the derived balance (PR #437).
//
// Two principles hold it together:
//   1. ROBUST, not fragile (DR-0083): the NAS is only the DATA SOURCE, fetched
//      when reachable. The WRITE happens in the app's authenticated context
//      (correct instance_id, RLS-safe — no service key, no leak), and the
//      BALANCE derives from the durable copy — never from a live fetch. If the
//      NAS is unreachable the last-synced ledger still drives the balance.
//   2. IDEMPOTENT: every verified bank row carries a FITID (a bank-stable id).
//      We dedupe on it — against the existing ledger AND within the batch — so
//      re-running the sync never duplicates a transaction (NO double-count).
//
// Pure + deterministic so it is unit-testable with no network/DOM. The caller
// (the app) does the fetch + the persisted write; this decides WHAT to add.
// =============================================================================

// The 4-digit account tail from a NAS account key ('chase8168' -> '8168').
export function accountDigits(navKey) {
  const m = String(navKey || '').match(/(\d{4})(?!.*\d)/); // last 4-digit run
  return m ? m[1] : null;
}

// Map a NAS account key to an app account id by matching the 4-digit fragment
// tail (account.fragment like '...8168'). Returns null when no account matches
// (e.g. the combined 'transaction_report' export, which has no account digits —
// deliberately left unmatched so its rows are NOT double-counted against the
// per-account files).
export function matchAccount(navKey, accounts) {
  const digits = accountDigits(navKey);
  if (!digits) return null;
  for (const a of accounts || []) {
    const frag = String(a.fragment || '').replace(/\D/g, '');
    if (frag && frag.endsWith(digits)) return a.id;
  }
  return null;
}

const ALLOWED_CATEGORY = new Set([
  'salary', 'rental-income', 'transfer', 'groceries', 'fuel', 'utilities',
  'dining', 'medical', 'vehicle', 'household', 'charitable', 'business',
  'professional', 'insurance', 'subscription', 'debt-payment', 'other',
]);

// A stable, idempotent app id for a verified bank row (FITID-anchored).
function stableId(t) {
  return 'vl-' + String(t.fitid || t.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

// Build the set of FITIDs already present in the ledger so a re-sync is a no-op
// for rows we've already merged (matches on the stored fitid OR the vl- id).
function seenFitids(existingTxns) {
  const set = new Set();
  for (const t of existingTxns || []) {
    if (t && t.fitid) set.add(String(t.fitid));
    if (t && typeof t.id === 'string' && t.id.startsWith('vl-')) set.add(t.id.slice(3));
  }
  return set;
}

// mapVerifiedLedger — decide which verified rows to ADD to the durable ledger.
//   payload      : the NAS verified ledger ({ transactions: [...] } — bank rows)
//   accounts     : the app's accounts (for fragment matching)
//   existingTxns : data.transactions (for FITID dedupe)
// Returns { toAdd, added, skippedDup, unmatched } — toAdd is ready for the app's
// addTransaction/transactionsSync path (carries fitid for future dedupe).
export function mapVerifiedLedger(payload, accounts = [], existingTxns = []) {
  const rows = (payload && Array.isArray(payload.transactions)) ? payload.transactions : [];
  const seen = seenFitids(existingTxns);
  const batch = new Set();
  const toAdd = [];
  let skippedDup = 0;
  const unmatched = {};
  for (const t of rows) {
    if (!t || t.source !== 'bank' || t.verified !== true) continue; // verified bank rows only
    const fitid = String(t.fitid || '');
    if (!fitid) { skippedDup += 1; continue; }
    if (seen.has(fitid) || batch.has(fitid)) { skippedDup += 1; continue; }
    const accountId = matchAccount(t.account, accounts);
    if (!accountId) {
      unmatched[t.account] = (unmatched[t.account] || 0) + 1;
      continue;
    }
    batch.add(fitid);
    const category = ALLOWED_CATEGORY.has(t.category) ? t.category : 'other';
    toAdd.push({
      id: stableId(t),
      date: t.date,
      accountId,
      amount: Number(t.amount) || 0,
      description: String(t.description || '').slice(0, 200),
      category,
      source: 'verified-ledger',
      fitid,
      verified: true,
    });
  }
  return { toAdd, added: toAdd.length, skippedDup, unmatched };
}

// fetchAndMapVerifiedLedger — fetch the NAS-served verified ledger and map it.
// ROBUST (DR-0083): wrapped so a fetch failure is a NO-OP that returns an empty
// plan — it NEVER throws into the app and never blocks the balance (which derives
// from the already-durable ledger). The caller persists toAdd via its normal
// authenticated addTransaction path (correct instance_id + RLS — no service key).
// `fetchImpl` is injectable for tests.
export async function fetchAndMapVerifiedLedger(url, accounts, existingTxns, fetchImpl) {
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  const empty = { toAdd: [], added: 0, skippedDup: 0, unmatched: {}, ok: false, error: null };
  if (!url || !doFetch) return { ...empty, error: 'no url / no fetch' };
  try {
    const r = await doFetch(url, { headers: { Accept: 'application/json' } });
    if (!r || !r.ok) return { ...empty, error: 'http ' + (r && r.status) };
    const payload = await r.json();
    const mapped = mapVerifiedLedger(payload, accounts, existingTxns);
    return { ...mapped, ok: true, error: null };
  } catch (e) {
    return { ...empty, error: String((e && e.message) || e) };
  }
}
