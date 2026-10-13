// =============================================================================
// tax-documents — the annual tax-return archive model (Books → Taxes)
// =============================================================================
// Darrell 2026-07-21: "Annual tax information is the PDF of years of taxes —
// where should Christina import and how will that work once done?" A filed
// return is a sensitive DOCUMENT (SSNs + full financials), not ledger data, so
// it needs its own record keyed by YEAR + ENTITY + KIND — an audit-ready archive,
// not a shoebox.
//
// This module is the STORAGE-AGNOSTIC spine: the record shape, the never-lose
// validation, and per-year grouping. The actual bytes live behind an injected
// storage backend (a `put`/`get` pair) so the SAME model works whether the PDF
// is stored NAS-sovereign or in an RLS-walled cloud bucket — that backend choice
// is the one Tier-C decision (DATA-AS-EMPOWERMENT: encrypted, PIN-gated, never
// advertiser/insurer-accessible). Pure + deterministic (no Date/Math.random).
// =============================================================================

// The kinds of document a tax year can hold. `return` = the filed 1040/business
// return; the rest are the supporting records a year accumulates.
export const TAX_DOC_KINDS = ['return', 'w2', '1099-received', 'k1', 'schedule', 'receipt', 'other'];
export const TAX_DOC_STATUSES = ['stored', 'pending', 'error'];

const CURRENT_MAX_YEAR = 2100;   // a sane upper bound; a filed year is never in the far future
const MIN_YEAR = 1900;

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
const isPdfName = (s) => typeof s === 'string' && /\.pdf$/i.test(s.trim());

/**
 * Validate a tax-document record BEFORE it is filed. Returns { ok, errors }.
 * A year + entity + kind + a real filename are required so nothing is filed
 * under an ambiguous slot (the audit-ready promise).
 * @param doc { year, entityId, kind, filename, storageRef?, note? }
 */
export function validateTaxDoc(doc) {
  const errors = [];
  const d = doc || {};

  const year = Number(d.year);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > CURRENT_MAX_YEAR) {
    errors.push(`Tax year must be a real year between ${MIN_YEAR} and ${CURRENT_MAX_YEAR}.`);
  }
  if (!nonEmpty(d.entityId)) errors.push('An entity (whose return this is) is required.');
  if (!TAX_DOC_KINDS.includes(d.kind)) {
    errors.push(`Document kind must be one of: ${TAX_DOC_KINDS.join(', ')}.`);
  }
  if (!nonEmpty(d.filename)) {
    errors.push('A filename is required.');
  } else if (!isPdfName(d.filename)) {
    errors.push('The tax document must be a PDF (a .pdf file).');
  }
  return { ok: errors.length === 0, errors };
}

/** True when a record is complete enough to file. */
export function canFile(doc) {
  return validateTaxDoc(doc).ok;
}

/** A stable id from year+entity+kind+filename (no wall-clock, no randomness). */
export function taxDocId(doc) {
  const basis = `${doc.year}|${doc.entityId}|${doc.kind}|${(doc.filename || '').trim().toLowerCase()}`;
  let h = 0;
  for (let i = 0; i < basis.length; i++) h = (h * 31 + basis.charCodeAt(i)) | 0;
  return 'tax-' + (h >>> 0).toString(36);
}

/**
 * Group a flat list of tax documents by year, newest year first, and within a
 * year ordered by KIND (return first, then supporting docs). The shape a
 * per-year archive view renders from.
 */
export function groupByYear(docs) {
  const list = Array.isArray(docs) ? docs : [];
  const byYear = new Map();
  for (const d of list) {
    const y = Number(d.year);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(d);
  }
  const kindRank = (k) => { const i = TAX_DOC_KINDS.indexOf(k); return i < 0 ? TAX_DOC_KINDS.length : i; };
  const years = [...byYear.entries()]
    .map(([year, items]) => ({
      year,
      count: items.length,
      docs: items.slice().sort((a, b) =>
        kindRank(a.kind) - kindRank(b.kind)
        || String(a.filename || '').localeCompare(String(b.filename || ''))),
    }))
    .sort((a, b) => b.year - a.year);
  return years;
}

// The key figures a filed year can carry — the DATA the behavioral-strategy
// layer reads (Darrell 2026-07-21: "use those artifacts to help build their
// behavioral strategies for business systems"). Optional on the record; when
// present, each MUST be a real number verified against the return (DR-0076 —
// a wrong extracted figure is worse than none, so extraction is a later,
// independently-verified step; hand-entry is the honest first path).
export const TAX_FIGURE_KEYS = ['grossIncome', 'agi', 'totalTax', 'refund'];

/** True when a figures object carries at least one real, finite number. */
export function hasFigures(figures) {
  return !!figures && TAX_FIGURE_KEYS.some((k) => Number.isFinite(Number(figures[k])));
}

/**
 * Build the multi-year tax HISTORY the behavioral-strategy layer consumes: one
 * row per year that carries figures, oldest→newest, each with the delta from the
 * prior year present. This is the DATA side of the Behavioral Mirror
 * (DATA → TRUTH → IDENTITY → INVITATION) — real numbers only; a year with no
 * verified figures is surfaced as `pending`, never invented.
 * @param docs the tax-document records (each may carry `figures` + `year`)
 */
export function buildTaxHistory(docs) {
  const list = Array.isArray(docs) ? docs : [];
  // One figures set per year (prefer the `return` kind's figures if several).
  const byYear = new Map();
  for (const d of list) {
    const y = Number(d.year);
    if (!Number.isInteger(y)) continue;
    const existing = byYear.get(y);
    const isReturn = d.kind === 'return';
    if (!existing || (isReturn && !existing.isReturn)) {
      byYear.set(y, { year: y, isReturn, figures: d.figures || null });
    }
  }
  const rows = [...byYear.values()].sort((a, b) => a.year - b.year);
  let prev = null;
  return rows.map((r) => {
    const has = hasFigures(r.figures);
    const figs = {};
    const deltas = {};
    if (has) {
      for (const k of TAX_FIGURE_KEYS) {
        const v = Number(r.figures[k]);
        figs[k] = Number.isFinite(v) ? v : null;
        const pv = prev && prev.figs ? prev.figs[k] : null;
        deltas[k] = (Number.isFinite(v) && Number.isFinite(pv)) ? +(v - pv).toFixed(2) : null;
      }
    }
    const row = { year: r.year, status: has ? 'ready' : 'pending', figs: has ? figs : null, deltas: has ? deltas : null };
    if (has) prev = row;
    return row;
  });
}

/**
 * File a validated tax document through an injected storage backend.
 * `backend.put(id, bytes, meta)` stores the PDF bytes wherever the family chose
 * (NAS-sovereign or an RLS-walled bucket) and resolves to a storageRef. This
 * module never touches the network itself, so it is fully unit-testable and the
 * backend is swappable without changing the model. Best-effort: returns a
 * structured result, never throws for the caller.
 * @param doc     the record (validated here)
 * @param bytes   the PDF bytes / Blob / data
 * @param backend { put(id, bytes, meta): Promise<storageRef> }
 */
export async function fileTaxDoc(doc, bytes, backend) {
  const gate = validateTaxDoc(doc);
  if (!gate.ok) return { skipped: 'invalid', errors: gate.errors };
  if (!backend || typeof backend.put !== 'function') return { skipped: 'no-backend' };

  const id = taxDocId(doc);
  const meta = { id, year: Number(doc.year), entityId: doc.entityId, kind: doc.kind, filename: doc.filename.trim() };
  try {
    const storageRef = await backend.put(id, bytes, meta);
    return { ok: true, record: { ...meta, note: doc.note || '', storageRef, status: 'stored' } };
  } catch (e) {
    return { skipped: 'store-error', error: e, record: { ...meta, note: doc.note || '', storageRef: null, status: 'error' } };
  }
}
