// =============================================================================
// ingest-reconcile — the reusable import primitive with a RECONCILIATION GATE
// =============================================================================
// The permanent architecture that makes silent data loss impossible (money now,
// any importer later). Its core promise: EVERY source row is either INGESTED or
// REJECTED-WITH-A-REASON — never silently vanished. After an import it proves
//     ingested + rejected === sourceTotal
// and if that does not balance the import FAILS LOUDLY, naming what is
// unaccounted. It is tolerant by design: blank rows, subtotal/separator rows,
// repeated header rows, and mixed/text date formats do not stop the read or drop
// the tail — each becomes a counted, reasoned outcome.
//
// Pure + deterministic (no I/O, no SheetJS dependency here — the caller extracts
// raw rows from CSV/Excel/QFX and hands them in). Reused app-wide. No n8n.
// =============================================================================

// Reasons a row is rejected (visible to the user, never hidden).
export const REJECT = {
  BLANK: 'blank-row',
  HEADER: 'repeated-header',
  SUBTOTAL: 'subtotal-or-separator',
  NO_DATE: 'unparseable-date',
  NO_AMOUNT: 'unparseable-amount',
};

const isBlank = (cells) => !cells || cells.every((c) => String(c ?? '').trim() === '');

// A row that repeats the header (some exports repeat headers per page/month).
function looksLikeHeader(cells, headerSig) {
  if (!headerSig) return false;
  const sig = cells.map((c) => String(c ?? '').trim().toLowerCase()).join('|');
  return sig === headerSig;
}

// A subtotal / separator: only one non-empty cell, OR a total-ish keyword with no
// parseable amount in the amount column (handled by NO_AMOUNT otherwise).
function looksLikeSubtotal(cells) {
  const nonEmpty = cells.filter((c) => String(c ?? '').trim() !== '');
  if (nonEmpty.length === 1) {
    const t = String(nonEmpty[0]).toLowerCase();
    return /total|subtotal|balance|summary|ending|beginning|^-+$|^=+$/.test(t);
  }
  return false;
}

// ingestRows — classify EVERY data row. `rows` is an array of cell-arrays (the
// data rows only; the caller passes the header separately). Returns typed
// accepted rows, rejected rows (with reason + the raw cells + original index),
// and a reconciliation that must balance.
//   opts: { header:[], dateIdx, amountIdx, descIdx, categoryIdx?, normalizeDate,
//           normalizeAmount, categorize? }
export function ingestRows(rows, opts = {}) {
  const {
    header = [], dateIdx = 0, amountIdx = 1, descIdx = 2, categoryIdx = -1,
    normalizeDate = (s) => (s ? String(s) : null),
    normalizeAmount = (s) => { const n = Number(String(s).replace(/[$,()]/g, (m) => (m === '(' ? '-' : ''))); return Number.isFinite(n) ? n : null; },
    categorize = null,
  } = opts;
  const headerSig = header.length ? header.map((c) => String(c ?? '').trim().toLowerCase()).join('|') : '';

  const accepted = [];
  const rejected = [];
  const src = Array.isArray(rows) ? rows : [];
  src.forEach((cells, i) => {
    const raw = Array.isArray(cells) ? cells : [];
    if (isBlank(raw)) { rejected.push({ index: i, cells: raw, reason: REJECT.BLANK }); return; }
    if (looksLikeHeader(raw, headerSig)) { rejected.push({ index: i, cells: raw, reason: REJECT.HEADER }); return; }
    if (looksLikeSubtotal(raw)) { rejected.push({ index: i, cells: raw, reason: REJECT.SUBTOTAL }); return; }
    const date = normalizeDate(raw[dateIdx]);
    if (!date) { rejected.push({ index: i, cells: raw, reason: REJECT.NO_DATE, value: raw[dateIdx] ?? '' }); return; }
    const amount = normalizeAmount(raw[amountIdx]);
    if (amount == null) { rejected.push({ index: i, cells: raw, reason: REJECT.NO_AMOUNT, value: raw[amountIdx] ?? '' }); return; }
    const description = String(raw[descIdx] ?? '').trim();
    const row = { date, amount, description };
    if (categoryIdx >= 0 && raw[categoryIdx]) row.category = String(raw[categoryIdx]).trim().toLowerCase();
    else if (typeof categorize === 'function') { const c = categorize(description); row.category = c.category; row.categoryConfidence = c.confidence; }
    accepted.push(row);
  });

  return { accepted, rejected, reconciliation: reconcile(src.length, accepted.length, rejected.length) };
}

// reconcile — THE GATE. balanced only when nothing is unaccounted.
export function reconcile(sourceTotal, ingestedCount, rejectedCount) {
  const total = Number(sourceTotal) || 0;
  const ingested = Number(ingestedCount) || 0;
  const rejectedN = Number(rejectedCount) || 0;
  const unaccounted = total - ingested - rejectedN;
  return {
    sourceTotal: total,
    ingested,
    rejected: rejectedN,
    unaccounted,
    balanced: unaccounted === 0,
    message: unaccounted === 0
      ? `${ingested} ingested + ${rejectedN} rejected = ${total} in source (balanced)`
      : `UNBALANCED: ${unaccounted} of ${total} source rows are unaccounted for (ingested ${ingested} + rejected ${rejectedN}). Import blocked — no row is dropped silently.`,
  };
}

// perMonthCounts — coverage of the accepted rows by YYYY-MM (feeds the monitor).
export function perMonthCounts(acceptedRows) {
  const by = {};
  for (const r of acceptedRows || []) {
    const m = String(r.date || '').slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(m)) by[m] = (by[m] || 0) + 1;
  }
  return by;
}
