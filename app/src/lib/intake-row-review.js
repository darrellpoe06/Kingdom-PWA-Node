// =============================================================================
// intake-row-review — the person's say over each imported row, before anything
// is written (Phase 1.3b, 2026-11-17).
//
// Christina 2026-11-16, Task 1: "Present extracted transactions for my approval
// before importing. Allow individual and bulk transaction approval, editing,
// categorization, and rejection ... Suggest categories based on descriptions and
// previously confirmed transactions."
//
//   · reviewLineItems: every row read from a document, with a SUGGESTED category
//     when it has none — the family's own learned payee rules first
//     (data.categoryRules, written when a category is corrected in
//     Transactions), then the built-in rules; a suggestion is marked as one.
//     The person's decisions (doc.rowDecisions, keyed by the row's position on
//     the document) win: a row can be left out, or given another category.
//   · rowStatuses: which rows are new, which are already in the books (the same
//     dedupe every import uses), which were left out.
// Pure. The original document and the rows read from it are never changed;
// decisions ride beside them and can be changed until Approve.
// =============================================================================
import { categorize, LOW_CONFIDENCE } from './categorize.js';

// The built-in rules may only SUGGEST a spending category. "transfer",
// "salary", "rental-income" and "debt-payment" change how the Money engine
// counts a row (a transfer is never a payment or spending; isTransferTxn reads
// the category), so they come only from the bank-row reader's own checks, the
// family's learned rules, or the person's choice. Measured hazard: the
// built-in rules file every Zelle as "transfer", which would have hidden a bill
// paid by Zelle (BG & Mom) and a tithe sent by Zelle from the books.
const SAFE_SUGGESTIONS = new Set([
  'groceries',
  'fuel',
  'dining',
  'utilities',
  'insurance',
  'subscription',
  'medical',
  'vehicle',
  'household',
  'tithes',
  'charitable',
  'professional',
  'business',
]);

/** The rows as they will be written: decisions applied, categories suggested. Excluded rows are dropped. */
export function reviewLineItems(lineItems = [], decisions = {}, learned = null) {
  const out = [];
  (lineItems || []).forEach((r, i) => {
    const d = (decisions || {})[i] || {};
    if (d.exclude) return;
    const row = { ...r };
    // "Add it anyway" on a row held as the likely posted copy of a pending charge.
    if (d.addAnyway === true) row.confirmedNew = true;
    if (d.category) {
      // A category the person confirms on this row wins, for this row
      // (Christina 2026-11-18: the $837.00 Zelle payment is her tithe).
      row.category = d.category;
      row.categorySource = 'you';
    } else if (!row.category || row.category === 'other') {
      const s = categorize(row.description || '', { learned });
      if (s.rule === 'learned' || (s.confidence >= LOW_CONFIDENCE && SAFE_SUGGESTIONS.has(s.category))) {
        row.category = s.category;
        row.categorySource = s.rule === 'learned' ? 'your rule' : 'suggested';
      }
    } else if (row.category === 'transfer' || row.category === 'debt-payment') {
      // The reader's label (a transfer between her own accounts, a debt
      // payment) is a suggestion. A remembered payee rule that says otherwise
      // does not silently replace it, and is not dropped either: the row is
      // flagged for her to decide (not every TLC payment is a tithe).
      const s = categorize(row.description || '', { learned });
      if (s.rule === 'learned' && s.category !== row.category) row.categoryConflict = s.category;
    }
    out.push(row);
  });
  return out;
}

/**
 * One status per row read from the document, for the review card:
 * { index, row (with its suggested or chosen category), status: 'new' |
 * 'duplicate' | 'excluded' }. `planned` is the list the dedupe kept as new.
 */
export function rowStatuses(lineItems = [], decisions = {}, learned = null, planned = null, pendingMatches = []) {
  const reviewed = (lineItems || []).map((r, i) => {
    const d = (decisions || {})[i] || {};
    const [one] = reviewLineItems([r], d.exclude ? {} : { 0: d }, learned);
    return { index: i, row: one || { ...r }, excluded: !!d.exclude };
  });
  // Multiset of what the dedupe kept as new: a row that is not in it is already in the books.
  const left = new Map();
  const key = (r) =>
    `${r.date}|${Number(r.amount).toFixed(2)}|${String(r.description || '')
      .trim()
      .toLowerCase()}`;
  for (const r of planned || []) left.set(key(r), (left.get(key(r)) || 0) + 1);
  // Rows matched to a pending charge already in the books ('same' / 'likely'
  // held back, 'possible' added with a note), by the same key.
  const matched = new Map();
  for (const m of pendingMatches || []) {
    const k = key(m.row);
    if (!matched.has(k)) matched.set(k, []);
    matched.get(k).push(m);
  }
  return reviewed.map((x) => {
    if (x.excluded) return { ...x, status: 'excluded' };
    if (planned == null) return { ...x, status: 'new' };
    const k = key(x.row);
    const mm = matched.get(k);
    const m = mm && mm.length ? mm.shift() : null;
    if (m && !m.added) return { ...x, status: m.strength === 'same' ? 'duplicate' : 'pending-posted', pendingMatch: { ...m.pending, strength: m.strength } };
    if (m && m.added) {
      const n0 = left.get(k) || 0;
      if (n0 > 0) left.set(k, n0 - 1);
      return { ...x, status: 'new', pendingMatch: { ...m.pending, strength: m.strength } };
    }
    const n = left.get(k) || 0;
    if (n > 0) {
      left.set(k, n - 1);
      return { ...x, status: 'new' };
    }
    return { ...x, status: 'duplicate' };
  });
}
