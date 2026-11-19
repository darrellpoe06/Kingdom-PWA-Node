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

// Seed the dedupe set from the existing ledger. Each content key is stored with
// an OCCURRENCE INDEX (contentKey#0, #1, ...) so that N genuine identical rows in
// the ledger occupy slots #0..#(N-1). This is what lets two truly-identical rows
// that carry NO disambiguating metadata — same date+amount+desc, no balance yet
// (a PENDING transaction), no FITID — still BOTH survive: the bank listed two line
// items, so we keep two (Christina's 7/17 twin $200 deposits). Balance-carrying
// rows are unaffected (their balance is already in the content key, so genuine
// repeats land on different keys and never need the occurrence slot).
function seedSeen(existingTxns) {
  const seen = new Set();
  const occ = new Map(); // contentKey -> how many ledger rows already occupy it
  for (const t of existingTxns || []) {
    if (!t) continue;
    if (t.fitid) seen.add('fit:' + t.fitid);
    if (t.accountId && t.date) {
      const ck = txnDedupeKey(t.accountId, t);
      const n = occ.get(ck) || 0;
      seen.add(ck + '#' + n);
      occ.set(ck, n + 1);
    }
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

// planAccountImport — the SINGLE-FILE counterpart of planBulkImport (one account,
// one file). This is the leak-fix (Darrell 2026-07-19: many generic "DEBIT" copies
// with "I don't even re-upload"). The single-file importer used to map rows with NO
// id, so commitImportedRows fell back to a fresh `t-${Date.now()}` random id on every
// run — the same statement imported again (or the Reset & re-import repair) minted
// BRAND-NEW rows with new slugs, and the unique (tenant, slug) index could not catch
// them because the slugs differed. Routing single-file imports through the SAME
// stable-id + content-dedupe machinery makes a re-import IDEMPOTENT: a row already in
// the ledger (matched by content key — works even for the legacy random-id rows,
// since seedSeen keys on content, not id) is dropped, and only genuinely-new rows are
// committed, each with a deterministic `imp-<occKey>` / `vl-<fitid>` id. Genuine
// same-day/same-amount twins still both survive (occurrence index). Returns
// { txns, duplicates } — the new rows to commit + how many were already present.
export function planAccountImport(rows, accountId, existingTxns = []) {
  if (!accountId) return { txns: [], duplicates: 0 };
  const plan = planBulkImport(
    [{ name: 'single', rows: rows || [] }],
    [{ id: accountId }],           // name resolves to the id; routing uses the fallback
    existingTxns,
    accountId,                     // fallbackAccountId — the file the user picked
  );
  const bucket = (plan.routed || []).find((r) => r.accountId === accountId);
  return { txns: bucket ? bucket.txns : [], duplicates: plan.duplicates };
}

// planBulkImport — route + dedupe a batch of parsed files into an import plan.
//   files: [{ name, rows: [{ date, description, amount, category?, fitid? }] }]
//   accounts, existingTxns: the app's accounts + current ledger (for routing + dedupe)
//   fallbackAccountId: optional — where unmatched files go IF the user picked one
// Returns { routed: [{accountId, accountName, count, txns}], unrouted: [{name,count,reason}],
//           duplicates, totalNew, totalRows }.
// The same transaction from two kinds of source: a banking-app screenshot row
// carries no balance, a downloaded CSV/TSV row carries the bank's running
// balance, and the balance is part of the content key, so the two never met and
// the row was added twice (Christina 2026-11-18: a TSV of rows already imported
// from a screenshot). Existing rows are pooled by the key WITHOUT the balance,
// apart by whether they carry one; a new row whose exact key is not in the books
// is still the same transaction when the pool on the OTHER side has an unused
// row with the same account, date, amount and description. One existing row
// answers for one new row, so genuine same-day twins both survive.
function crossSourcePool(existingTxns) {
  const pool = new Map(); // noBalKey -> { withBal, withoutBal }
  for (const t of existingTxns || []) {
    if (!t || !t.accountId || !t.date) continue;
    const k = txnDedupeKey(t.accountId, { ...t, balance: null });
    const e = pool.get(k) || { withBal: 0, withoutBal: 0 };
    if (t.balance == null || t.balance === '') e.withoutBal += 1;
    else e.withBal += 1;
    pool.set(k, e);
  }
  return pool;
}

// A screenshot and the bank's download print the same transaction with
// different text: the download adds the bank's reference ("Zelle payment to TLC
// JPM99ab12") where the app screen shows "Zelle payment to TLC" (Christina
// 2026-11-19). Same account, day and amount, one side without a running balance
// and the other with one, and one description the other's opening words: the
// same transaction. Anything less certain is left for her to review.
const normDesc = (d) => String(d || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function wordPrefix(a, b) {
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  return s.length >= 4 && (l === s || l.startsWith(s + ' '));
}
function nearPool(existingTxns) {
  const pool = new Map(); // account|date|amount -> [{ desc, hasBal, used }]
  for (const t of existingTxns || []) {
    if (!t || !t.accountId || !t.date) continue;
    const k = [t.accountId, t.date, (Number(t.amount) || 0).toFixed(2)].join('|');
    const list = pool.get(k) || [];
    list.push({ desc: normDesc(t.description || t.desc), hasBal: !(t.balance == null || t.balance === ''), used: false });
    pool.set(k, list);
  }
  return pool;
}

export function planBulkImport(files, accounts = [], existingTxns = [], fallbackAccountId = null) {
  const seen = seedSeen(existingTxns);
  const cross = crossSourcePool(existingTxns);
  const near = nearPool(existingTxns);
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
    // Occurrence index is counted PER FILE (reset here): two identical line items
    // in ONE statement are two real transactions (#0, #1) and both survive, while
    // the SAME row appearing in two overlapping files (each its own #0) dedupes
    // against the shared `seen` set — so re-imports and overlaps never double-count,
    // but genuine same-statement repeats are never dropped.
    const fileOcc = new Map();
    for (const r of rows) {
      if (!r || !r.date) continue;
      const fitKey = r.fitid ? 'fit:' + r.fitid : null;
      const cKey = txnDedupeKey(accId, r);
      const idx = fileOcc.get(cKey) || 0;
      fileOcc.set(cKey, idx + 1); // advance for EVERY row (dup or kept) so twins get #0,#1
      const occKey = cKey + '#' + idx;
      if ((fitKey && seen.has(fitKey)) || seen.has(occKey)) { duplicates += 1; continue; }
      {
        const hasBal = r.balance != null && r.balance !== '';
        const pk = txnDedupeKey(accId, { ...r, balance: null });
        const e = cross.get(pk);
        const side = hasBal ? 'withoutBal' : 'withBal';
        const list = near.get([accId, r.date, (Number(r.amount) || 0).toFixed(2)].join('|')) || [];
        const d = normDesc(r.description || r.desc);
        if (e && e[side] > 0) {
          e[side] -= 1; duplicates += 1;
          const same = list.find((x) => !x.used && x.hasBal !== hasBal && x.desc === d);
          if (same) same.used = true; // one existing row answers for one new row
          continue;
        }
        const hit = list.find((x) => !x.used && x.hasBal !== hasBal && wordPrefix(x.desc, d));
        if (hit) { hit.used = true; duplicates += 1; continue; }
      }
      if (fitKey) seen.add(fitKey);
      seen.add(occKey);
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
        // content dedupe key + occurrence index (already unique per distinct txn AND
        // idempotent across re-imports, since seedSeen dedupes against the existing
        // ledger). The occurrence index keeps two truly-identical pending twins apart.
        id: r.fitid ? 'vl-' + r.fitid : 'imp-' + occKey,
        ...(r.fitid ? { fitid: String(r.fitid) } : {}),
        // A pending row stays marked pending, so its posted copy on a later
        // import is recognised instead of counted again (2026-11-18). Not part
        // of the dedupe key: a re-import still matches exactly as before.
        ...(r.pending ? { pending: true } : {}),
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
