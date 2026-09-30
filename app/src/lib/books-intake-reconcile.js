// =============================================================================
// books-intake-reconcile — the math must add up, and every money fact keeps its
// dates (DR-0707, the one Books upload)
// =============================================================================
// Darrell 2026-09-30: "this is finance money and timelines... we want truth and
// clarity." Two jobs, both pure:
//
//   reconcileExtraction(x)  — does the document agree with ITSELF? A statement's
//     opening balance, its activity and its closing balance must close to the
//     cent; a pay stub's net cannot exceed its gross; a download's rows must be
//     all accounted for. A document that does not close is NEVER written into
//     the books as fact (books-intake-pipeline.canWrite reads this).
//
//   buildTimeline(docs, today) — every document's period, due date and overdue
//     status, per account, with GAPS: a month missing between two statements
//     of the same account is named, not silently skipped.
// =============================================================================

const CENT = 0.01;
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const has = (n) => n != null && Number.isFinite(Number(n));

/**
 * @returns {{ status: 'reconciled'|'mismatch'|'unverifiable', checks: Array, diff: number|null, note: string }}
 */
export function reconcileExtraction(x = {}) {
  const s = x.summary || {};
  const items = Array.isArray(x.line_items) ? x.line_items : [];
  const checks = [];

  if (x.doc_type === 'card-statement' || x.doc_type === 'loan-statement') {
    // Card arithmetic: previous - payments/credits + purchases + fees + interest = new.
    if (has(s.previousBalance) && has(s.newBalance) && (has(s.purchases) || has(s.paymentsCredits))) {
      const expected = round2(Number(s.previousBalance) - Math.abs(Number(s.paymentsCredits) || 0)
        + (Number(s.purchases) || 0) + (Number(s.fees) || 0) + (Number(s.interest) || 0));
      checks.push({ name: 'summary', expected, actual: round2(s.newBalance), diff: round2(Number(s.newBalance) - expected) });
    }
    // Line items printed on the page (charges positive, payments negative)
    // must carry the previous balance to the new one.
    if (items.length && has(s.previousBalance) && has(s.newBalance)) {
      const expected = round2(Number(s.previousBalance) + items.reduce((n, r) => n + (Number(r.amount) || 0), 0));
      checks.push({ name: 'line-items', expected, actual: round2(s.newBalance), diff: round2(Number(s.newBalance) - expected) });
    }
  } else if (x.doc_type === 'bank-statement') {
    if (has(s.previousBalance) && has(s.newBalance) && (has(s.deposits) || has(s.withdrawals))) {
      const expected = round2(Number(s.previousBalance) + Math.abs(Number(s.deposits) || 0) - Math.abs(Number(s.withdrawals) || 0));
      checks.push({ name: 'summary', expected, actual: round2(s.newBalance), diff: round2(Number(s.newBalance) - expected) });
    }
  } else if (x.doc_type === 'pay-stub') {
    if (has(s.gross) && has(s.net)) {
      const ok = Number(s.net) <= Number(s.gross) + CENT && Number(s.net) >= 0;
      checks.push({ name: 'net-within-gross', expected: `net <= ${s.gross}`, actual: s.net, diff: ok ? 0 : round2(Number(s.net) - Number(s.gross)) });
    }
  } else if (x.doc_type === 'transactions-export') {
    // The reader's own accounting: every source row ingested or rejected-with-a-reason.
    const r = x.rowReconciliation;
    if (r && has(r.total)) {
      const accounted = (Number(r.ingested) || 0) + (Number(r.rejected) || 0);
      checks.push({ name: 'rows-accounted', expected: r.total, actual: accounted, diff: accounted - Number(r.total) });
    }
  }

  if (!checks.length) {
    return { status: 'unverifiable', checks, diff: null, note: 'This document carries no totals to check against, so nothing here was proven to add up.' };
  }
  const worst = checks.reduce((a, c) => (Math.abs(c.diff) > Math.abs(a.diff) ? c : a), checks[0]);
  if (Math.abs(worst.diff) > CENT) {
    return { status: 'mismatch', checks, diff: worst.diff, note: `The numbers on this document do not add up (${worst.name} off by $${Math.abs(worst.diff).toFixed(2)}).` };
  }
  return { status: 'reconciled', checks, diff: 0, note: 'The numbers add up to the cent.' };
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const monthKey = (isoDate) => (isoDate ? String(isoDate).slice(0, 7) : null);
function nextMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/** 'overdue' | 'due-soon' | 'paid' | 'open' | null for one document. */
export function dueStatus(x, today) {
  const due = x && x.dates && x.dates.due;
  if (!due) return null;
  if (x.dates.paid) return 'paid';
  if (due < today) return 'overdue';
  const days = (Date.parse(due) - Date.parse(today)) / 86400000;
  return days <= 7 ? 'due-soon' : 'open';
}

/**
 * docs: [{ id, extraction, accountId? }]. Returns
 *   { entries: [{ docId, accountKey, doc_type, period_start, period_end, due, dueStatus }],
 *     gaps: [{ accountKey, missing: ['YYYY-MM', ...] }] }
 * Gaps are measured per account between consecutive statement months, so a
 * card with June and August on file reports July as missing.
 */
export function buildTimeline(docs = [], today = new Date().toISOString().slice(0, 10)) {
  const entries = [];
  const months = new Map();
  for (const d of docs || []) {
    const x = d && d.extraction;
    if (!x) continue;
    const accountKey = d.accountId || (x.account_hint && x.account_hint.last4 ? `last4:${x.account_hint.last4}` : null);
    const entry = {
      docId: d.id, accountKey, doc_type: x.doc_type,
      period_start: x.dates.period_start, period_end: x.dates.period_end, due: x.dates.due,
      dueStatus: dueStatus(x, today),
    };
    entries.push(entry);
    const periodic = ['card-statement', 'bank-statement', 'loan-statement', 'bill'].includes(x.doc_type);
    const key = monthKey(x.dates.period_end || x.dates.document);
    if (periodic && accountKey && key) {
      if (!months.has(accountKey)) months.set(accountKey, new Set());
      months.get(accountKey).add(key);
    }
  }
  const gaps = [];
  for (const [accountKey, set] of months) {
    const sorted = [...set].sort();
    const missing = [];
    for (let i = 1; i < sorted.length; i += 1) {
      let k = nextMonth(sorted[i - 1]);
      let guard = 0;
      while (k < sorted[i] && guard < 240) { missing.push(k); k = nextMonth(k); guard += 1; }
    }
    if (missing.length) gaps.push({ accountKey, missing });
  }
  entries.sort((a, b) => String(a.period_end || a.due || '').localeCompare(String(b.period_end || b.due || '')));
  return { entries, gaps };
}
