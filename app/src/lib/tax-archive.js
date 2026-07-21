// =============================================================================
// tax-archive — same-origin reader for the sovereign tax-document archive
// =============================================================================
// Darrell 2026-07-21: "we have most of this... go see." We do — this reuses the
// EXACT sovereign pattern the finance ledger already runs (DR-0083): a
// deterministic Python job on the NAS (infra/nas-tax-ingest/tax_ingest.py) reads
// the PDFs the family stores on a bind mount and writes a LIGHT JSON snapshot
// into the Caddy site, which the PWA reads SAME-ORIGIN (GET /taxes/archive.json)
// — no n8n, no cross-origin round-trip. The original PDFs are served same-origin
// too (GET /taxes/files/...), so a return is printable anytime; the app only
// carries the light data + a pointer (the "lighter, reusable" ask).
//
// Mirrors bible-xref.js: an injectable fetcher (testable), a same-origin base,
// and a fetch that returns an empty archive on ANY error and never throws.
// Feeds tax-documents.js (groupByYear + buildTaxHistory) unchanged.
// =============================================================================

const EMPTY = Object.freeze({ documents: [], served_at: null, source: 'none' });

function baseHref() {
  try {
    if (typeof document !== 'undefined' && document.baseURI) return new URL('.', document.baseURI).href;
  } catch { /* fall through */ }
  return '/';
}

let fetcher = (typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null;
// Test seam: inject a fetcher (same pattern as bible-xref __setXrefFetcher).
export function __setTaxFetcher(fn) {
  fetcher = fn || ((typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null);
}

/**
 * Read the light tax-archive snapshot the NAS job publishes. Returns
 * { documents:[{ id, year, entityId, kind, filename, storageRef, figures? }], served_at, source }.
 * Never throws — returns EMPTY on any network/parse error (signed-out or the job
 * not run yet), so the surface degrades to an empty archive rather than breaking.
 */
export async function fetchTaxArchive() {
  if (!fetcher) return { ...EMPTY };
  try {
    const res = await fetcher(`${baseHref()}taxes/archive.json`, { cache: 'no-store' });
    if (!res || !res.ok) return { ...EMPTY };
    const data = await res.json();
    const documents = Array.isArray(data && data.documents) ? data.documents : [];
    return { documents, served_at: (data && data.served_at) || null, source: 'nas' };
  } catch {
    return { ...EMPTY };
  }
}

/**
 * The same-origin URL for the ORIGINAL PDF of a record — what the Print/Open
 * action points at. Prefers an absolute storageRef the job already resolved;
 * otherwise builds the conventional Caddy path. Returns null if unprintable.
 */
export function printableUrl(doc) {
  if (!doc) return null;
  const ref = doc.storageRef;
  if (typeof ref === 'string' && /^https?:\/\//i.test(ref)) return ref;             // absolute (Caddy/Funnel)
  if (typeof ref === 'string' && ref.startsWith('/')) return ref;                    // already same-origin path
  if (doc.entityId && doc.year && doc.filename) {
    return `${baseHref()}taxes/files/${encodeURIComponent(doc.entityId)}/${doc.year}/${encodeURIComponent(doc.filename)}`;
  }
  return null;
}
