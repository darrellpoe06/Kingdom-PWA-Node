// =============================================================================
// receipt-match — align a receipt (from EMAIL or PHOTO) to a bank transaction
// =============================================================================
// The ONE downstream both receipt front doors share (email parse + photo/OCR).
// Whatever produced a receipt, it arrives here as a normalized shape and is
// cross-referenced to the ledger the same way: the BANK transaction is the truth
// for the AMOUNT; the receipt supplies itemization + proof. A match becomes a
// migration-0036 `reconciliation` block (the shape [[receipt-itemize]] verifies
// and [[BooksTransactions]] renders). No match, or a low-confidence read, is
// returned as a queued item — never silently filed wrong (QC).
//
// Match rule (mirrors infra/nas-finance-ingest/receipts.py cross_reference):
//   amount (exact cents, ±2c vendor rounding) + date (±3 days, receipt or EXIF
//   date) + merchant hint (the bank description contains the merchant). A ledger
//   row already carrying a reconciliation is skipped (dedupe — one receipt per
//   charge). Greedy, one receipt to one transaction.
//
// PURE + DETERMINISTIC. No I/O; the caller persists the result (updateTransaction
// for a match, the review queue for the rest).
// =============================================================================

import { receiptVerification } from './receipt-itemize.js';

const cents = (n) => Math.round((Number(n) || 0) * 100);

// normalizeReceipt(raw, ctx) — collapse an email-parsed or OCR-structured
// receipt into the canonical shape the matcher + reconciliation use. `ctx`
// carries the source ('photo'|'email'), the proof image, and the EXIF capture
// date (a better date than a mangled OCR one).
export function normalizeReceipt(raw, ctx = {}) {
  const r = raw || {};
  const items = Array.isArray(r.items) ? r.items.filter((i) => i && i.name && Number.isFinite(Number(i.price))) : [];
  const total = Number.isFinite(Number(r.total)) ? Number(r.total) : null;
  return {
    merchant: r.merchant || null,
    date: r.date || ctx.exifDate || null,
    total,
    tax: Number.isFinite(Number(r.tax)) ? Number(r.tax) : 0,
    order: r.order || null,
    items,
    source: ctx.source || r.source || 'photo',
    confidence: Number.isFinite(Number(r.confidence)) ? Number(r.confidence) : null,
    image: ctx.image || null, // { dataUrl?, ref?, name, capturedAt, hasGps }
  };
}

function withinDays(a, b, days) {
  try {
    const da = new Date(`${String(a).slice(0, 10)}T00:00:00Z`);
    const db = new Date(`${String(b).slice(0, 10)}T00:00:00Z`);
    return Math.abs((da - db) / 86400000) <= days;
  } catch (_) { return false; }
}

// matchReceiptToTransactions(receipt, transactions, opts) — find the single best
// ledger transaction for this receipt, or null. Only expense rows (negative
// amount) with no existing reconciliation are candidates. Amount is the hard
// gate; date narrows; merchant agreement breaks ties.
export function matchReceiptToTransactions(receipt, transactions, opts = {}) {
  const tolCents = Number.isFinite(opts.toleranceCents) ? opts.toleranceCents : 2;
  const dayWindow = Number.isFinite(opts.dayWindow) ? opts.dayWindow : 3;
  if (!receipt || receipt.total == null) return null;
  const want = Math.abs(cents(receipt.total));
  const rdate = receipt.date;
  const merch = (receipt.merchant || '').toLowerCase().split(/\s+/)[0] || '';
  const cands = (transactions || []).filter((t) => {
    if (!t || t.reconciliation) return false;          // dedupe: already has a receipt
    if (!(Number(t.amount) < 0)) return false;         // expenses only
    const amt = Math.abs(cents(t.amount));
    if (Math.abs(amt - want) > tolCents) return false; // amount is the hard gate
    if (rdate && t.date && !withinDays(rdate, t.date, dayWindow)) return false;
    return true;
  });
  if (!cands.length) return null;
  cands.sort((a, b) => {
    const am = merch && (a.description || '').toLowerCase().includes(merch) ? 0 : 1;
    const bm = merch && (b.description || '').toLowerCase().includes(merch) ? 0 : 1;
    if (am !== bm) return am - bm;
    // then nearest date
    const ad = rdate && a.date ? Math.abs(new Date(a.date) - new Date(rdate)) : 0;
    const bd = rdate && b.date ? Math.abs(new Date(b.date) - new Date(rdate)) : 0;
    return ad - bd;
  });
  return cands[0];
}

// buildReconciliation(receipt, tx) — the migration-0036 block for a matched
// receipt. matched_to records the evidence: always 'bank', plus 'photo' or
// 'email' for the itemization source. The proof image rides in source_image
// (photo path). Verified independently by receiptVerification before any green.
export function buildReconciliation(receipt, tx) {
  const evidence = ['bank', receipt.source === 'email' ? 'email' : 'photo'];
  const recon = {
    matched: true,
    matched_to: evidence,
    merchant: receipt.merchant || null,
    method: 'card',
    total: Math.round(Number(receipt.total) * 100) / 100,
    captured_via: receipt.source || 'photo',
    orders: [{
      order: receipt.order || null,
      tax: Math.round(Number(receipt.tax || 0) * 100) / 100,
      paid: Math.round(Number(receipt.total) * 100) / 100,
      items: receipt.items,
    }],
  };
  if (receipt.image) {
    recon.source_image = {
      dataUrl: receipt.image.dataUrl || null,
      ref: receipt.image.ref || null,
      name: receipt.image.name || 'receipt.jpg',
      captured_at: receipt.image.capturedAt ? (receipt.image.capturedAt.iso || receipt.image.capturedAt) : null,
      has_gps: !!receipt.image.hasGps,
      stripped_exif: true,
    };
  }
  const verdict = receiptVerification(recon, tx ? tx.amount : -receipt.total);
  recon.verify_ok = verdict.verified;
  return recon;
}

// fileReceipt(receipt, transactions, opts) — the decision, deterministic:
//   { status:'matched', transactionId, reconciliation, category }  auto-file
//   { status:'review', reason, receipt }                            queue it
// A receipt files automatically ONLY when it matches a bank row AND its
// confidence clears the bar AND the itemization reconciles to that bank amount —
// otherwise it queues. `category` is the dominant item category (caller may set
// it on the matched row). Never files silently wrong.
export function fileReceipt(receipt, transactions, opts = {}) {
  const minConfidence = Number.isFinite(opts.minConfidence) ? opts.minConfidence : 0.7;
  if (receipt.total == null || !receipt.items.length) {
    return { status: 'review', reason: receipt.total == null ? 'no total read from receipt' : 'no line items read', receipt };
  }
  if (receipt.confidence != null && receipt.confidence < minConfidence) {
    return { status: 'review', reason: `low OCR confidence (${Math.round(receipt.confidence * 100)}%)`, receipt };
  }
  const tx = matchReceiptToTransactions(receipt, transactions, opts);
  if (!tx) {
    return { status: 'review', reason: 'no matching bank transaction (amount + date)', receipt };
  }
  const reconciliation = buildReconciliation(receipt, tx);
  if (!reconciliation.verify_ok) {
    return { status: 'review', reason: 'receipt items do not reconcile to the bank amount', receipt, transactionId: tx.id };
  }
  return { status: 'matched', transactionId: tx.id, reconciliation, receipt };
}
