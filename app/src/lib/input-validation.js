// =============================================================================
// input-validation — ONE validate -> preview -> confirm -> commit spine for
// EVERY money input (email receipt, photo, bulk photo, manual entry, bank file)
// =============================================================================
// Darrell, 2026-07-01: every input must run through the SAME validation process
// so the experience is consistent and trustworthy. This is the source-agnostic
// spine behind that: whatever the source, it produces ONE `candidate` shape, is
// validated the SAME way, previewed in the SAME component (InputValidation.jsx),
// and — only on the user's confirm — committed through the SAME two operations.
// Nothing lands silently (preview-then-execute + the reconciliation gate,
// DR-0076). Low-confidence / unmatched candidates surface as `needs-fix` for a
// quick correction before they can commit.
//
// A candidate carries a `commitKind`:
//   • 'enrich' — a receipt (email/photo) that ATTACHES itemization + proof to an
//     EXISTING bank transaction it matched (the bank stays the amount truth).
//   • 'create' — a manual entry or a parsed bank-file row that BECOMES a new
//     ledger transaction (it is the primary record; no match needed).
// One gate, two commit kinds, one consistent UX. Coordinates with the money-loop
// reconciliation ([[receipt-match]]) + categorization ([[categorize]]).
//
// PURE + DETERMINISTIC. No I/O; the caller passes addTransaction/updateTransaction
// and this decides WHAT to call, never reaching for a store itself.
// =============================================================================

import { categorize } from './categorize.js';
import { matchReceiptToTransactions, buildReconciliation, normalizeReceipt } from './receipt-match.js';
import { derivedCategory, receiptVerification } from './receipt-itemize.js';

let CID = 0;
const nextId = () => `cand-${++CID}`;

export const SOURCE_LABEL = {
  email: 'Email receipt',
  photo: 'Photo',
  'bulk-photo': 'Bulk photo',
  manual: 'Manual entry',
  'bank-file': 'Bank file',
};

// --- builders: each source -> the ONE candidate shape -----------------------

// candidateFromReceipt — email OR photo/OCR. Matches a bank transaction, derives
// the category from the items, carries the proof image + a prebuilt
// reconciliation. commitKind 'enrich'.
export function candidateFromReceipt(rawReceipt, ctx = {}) {
  const receipt = normalizeReceipt(rawReceipt, { source: ctx.source || 'photo', image: ctx.image, exifDate: ctx.exifDate });
  const match = receipt.total != null ? matchReceiptToTransactions(receipt, ctx.transactions || [], ctx) : null;
  const reconciliation = match ? buildReconciliation(receipt, match) : (receipt.items.length ? buildReconciliation(receipt, { amount: -Number(receipt.total || 0) }) : null);
  const category = reconciliation ? (derivedCategory(reconciliation) || null) : null;
  return revalidate({
    id: nextId(),
    source: ctx.source || 'photo',
    commitKind: 'enrich',
    fields: {
      description: receipt.merchant || 'Receipt',
      date: receipt.date || null,
      amount: receipt.total != null ? -Math.abs(Number(receipt.total)) : null,
      accountId: match ? match.accountId : null,
      category,
    },
    items: receipt.items,
    confidence: receipt.confidence != null ? receipt.confidence : (match ? 0.9 : 0.5),
    confidenceReasons: rawReceipt && rawReceipt.confidenceReasons ? rawReceipt.confidenceReasons : [],
    match: match ? { transactionId: match.id, transaction: match } : null,
    proof: ctx.image || (receipt.image || null),
    reconciliation,
    _receipt: receipt,
  });
}

// candidateFromManual — a hand-typed entry. It IS the ledger row (commitKind
// 'create'); the auto-picked category is the thing being validated, so the
// candidate's confidence is the categorizer's confidence.
export function candidateFromManual(form, ctx = {}) {
  const desc = String(form.description || '').trim();
  const cat = categorize(desc, { learned: ctx.categoryRules });
  const category = form.category && form.category !== 'other' ? form.category : (cat.category || 'other');
  return revalidate({
    id: nextId(),
    source: 'manual',
    commitKind: 'create',
    fields: {
      description: desc,
      date: form.date || null,
      amount: form.amount === '' || form.amount == null ? null : Number(form.amount),
      accountId: form.accountId || null,
      category,
      entityOverride: form.entityOverride || '',
    },
    items: [],
    confidence: form.category && form.category !== 'other' ? 1 : cat.confidence,
    confidenceReasons: [form.category && form.category !== 'other' ? 'category set by you' : `category auto-picked (${cat.rule})`],
    match: null,
    proof: null,
    reconciliation: null,
  });
}

// candidateFromBankRow — one parsed bank-file row. commitKind 'create'; category
// auto-picked from the description. The bank file is the amount truth, so these
// need no match — the validation is confirming the parse + the category.
export function candidateFromBankRow(row, ctx = {}) {
  const desc = String(row.description || row.desc || '').trim();
  const cat = categorize(desc, { learned: ctx.categoryRules });
  const amount = row.amount === '' || row.amount == null ? null : Number(row.amount);
  return revalidate({
    id: nextId(),
    source: 'bank-file',
    commitKind: 'create',
    fields: {
      description: desc,
      date: row.date || null,
      amount,
      accountId: row.accountId || ctx.accountId || null,
      category: row.category && row.category !== 'other' ? row.category : (cat.category || 'other'),
    },
    items: [],
    confidence: row.category && row.category !== 'other' ? 1 : cat.confidence,
    confidenceReasons: [`category auto-picked (${cat.rule})`],
    match: null,
    proof: null,
    reconciliation: null,
  });
}

// --- validation --------------------------------------------------------------
export const READY = 'ready';
export const NEEDS_FIX = 'needs-fix';
export const LOW_CONFIDENCE = 0.7;

// validateCandidate — deterministic status + human-readable issues. A candidate
// is READY (safe to auto-check for commit) only when everything needed is
// present and trustworthy; otherwise NEEDS_FIX with the specific reasons. This
// is the single rule every source is judged by.
export function validateCandidate(c) {
  const issues = [];
  const f = c.fields || {};
  if (!f.description) issues.push('missing description');
  if (!f.date) issues.push('missing date');
  if (f.amount == null || !Number.isFinite(f.amount) || f.amount === 0) issues.push('missing or zero amount');
  if (!f.category || f.category === 'other') issues.push('category uncertain');

  if (c.commitKind === 'enrich') {
    if (!c.match) issues.push('no matching bank transaction');
    else {
      const recon = c.reconciliation;
      const v = recon ? receiptVerification(recon, c.match.transaction ? c.match.transaction.amount : f.amount) : { verified: false, reason: 'no itemization' };
      if (!v.verified) issues.push(`items do not reconcile (${v.reason})`);
    }
    if (c.confidence != null && c.confidence < LOW_CONFIDENCE) issues.push(`low confidence (${Math.round(c.confidence * 100)}%)`);
  } else {
    // create
    if (!f.accountId) issues.push('no account selected');
  }
  return { status: issues.length === 0 ? READY : NEEDS_FIX, issues };
}

// revalidate — attach { status, issues } to a candidate (pure). Called by the
// builders and after every correction so the preview always reflects truth.
export function revalidate(c) {
  const { status, issues } = validateCandidate(c);
  return { ...c, status, issues };
}

// applyCorrection — the user edits a field in the preview. Returns a NEW,
// re-validated candidate. For an enrich candidate, editing the amount/date can
// re-match to a bank transaction and rebuilds the reconciliation so the verify
// gate re-checks against the corrected numbers.
export function applyCorrection(c, patch, ctx = {}) {
  const fields = { ...c.fields, ...patch };
  let next = { ...c, fields };
  // Let the user pick/confirm a bank match explicitly.
  if (Object.prototype.hasOwnProperty.call(patch, 'match')) {
    next.match = patch.match ? { transactionId: patch.match.id, transaction: patch.match } : null;
    delete next.fields.match;
  }
  if (c.commitKind === 'enrich') {
    // Re-derive a matched-transaction and reconciliation from the corrected data.
    const receipt = { ...(c._receipt || {}), merchant: fields.description, date: fields.date, total: fields.amount != null ? Math.abs(Number(fields.amount)) : null, items: c.items };
    const tx = next.match ? next.match.transaction : (fields.amount != null ? matchReceiptToTransactions(normalizeReceipt(receipt, { source: c.source }), ctx.transactions || []) : null);
    if (tx && !next.match) next.match = { transactionId: tx.id, transaction: tx };
    if (tx) {
      next.reconciliation = buildReconciliation(normalizeReceipt({ ...receipt, source: c.source }, { source: c.source, image: c.proof }), tx);
      if (!patch.category) next.fields.category = derivedCategory(next.reconciliation) || fields.category;
    }
  }
  return revalidate(next);
}

// --- commit ------------------------------------------------------------------
// commitCandidate — THE one commit. enrich -> updateTransaction (attach the
// reconciliation + category to the matched row); create -> addTransaction (a new
// ledger row). Returns { committed:true, kind, transactionId } or
// { committed:false, reason } when the candidate is not READY (guard: nothing
// commits that didn't pass validation).
export function commitCandidate(c, actions = {}) {
  const v = validateCandidate(c);
  if (v.status !== READY) return { committed: false, reason: v.issues.join('; ') };
  const f = c.fields;
  if (c.commitKind === 'enrich') {
    const patch = { reconciliation: c.reconciliation };
    if (f.category) patch.category = f.category;
    if (typeof actions.updateTransaction === 'function') actions.updateTransaction(c.match.transactionId, patch);
    return { committed: true, kind: 'enrich', transactionId: c.match.transactionId };
  }
  const payload = { date: f.date, accountId: f.accountId, amount: Number(f.amount), description: f.description, category: f.category || 'other' };
  if (f.entityOverride) payload.entityOverride = f.entityOverride;
  if (typeof actions.addTransaction === 'function') actions.addTransaction(payload);
  return { committed: true, kind: 'create' };
}

// commitAll — commit every READY candidate; return a summary. Skips (does not
// throw on) candidates still needing a fix — they stay in the preview.
export function commitAll(candidates, actions = {}) {
  let committed = 0; let skipped = 0;
  for (const c of candidates || []) {
    const r = commitCandidate(c, actions);
    if (r.committed) committed += 1; else skipped += 1;
  }
  return { committed, skipped, total: (candidates || []).length };
}

// confidenceTier — a stable label/tone for the confidence indicator so every
// source shows the SAME three-state signal. Uses the same LOW_CONFIDENCE bar.
export function confidenceTier(conf) {
  if (conf == null) return { tier: 'unknown', label: '—' };
  if (conf >= 0.85) return { tier: 'high', label: `${Math.round(conf * 100)}% · high` };
  if (conf >= LOW_CONFIDENCE) return { tier: 'medium', label: `${Math.round(conf * 100)}% · medium` };
  return { tier: 'low', label: `${Math.round(conf * 100)}% · low` };
}
