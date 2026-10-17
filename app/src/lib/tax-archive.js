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

const EMPTY = Object.freeze({ documents: [], served_at: null, source: 'none', reason: 'none' });

// WHY A `reason` (Darrell 2026-10-06). Every failure used to collapse into the
// same empty archive, so a missing TRANSPORT looked exactly like a NAS holding
// no returns — and the screen said "No returns indexed yet. Upload a return
// above", which was untrue: the app could not reach the archive at all. That is
// what a return uploaded and never processed looked like from the other door.
// The reasons are distinguishable so the surface can say which it is (DR-0381).
export const ARCHIVE_REASON = Object.freeze({
  OK: 'ok',                 // the NAS answered with its index
  NO_ROAD: 'no-road',       // something answered, but not JSON — the SPA shell
  UNREACHABLE: 'unreachable', // the road is there and the far end did not answer
  // DR-1086: the NAS answered and kept the returns private, because this
  // device did not present the family key. Not "unreachable", not "empty".
  LOCKED: 'locked',
  NONE: 'none',             // nothing was asked (no fetch in this environment)
});

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
export async function fetchTaxArchive({ token = '' } = {}) {
  if (!fetcher) return { ...EMPTY };
  let res;
  try {
    // DR-1086: the archive is the family's tax returns and the route is public,
    // so the NAS answers only a request carrying the family key.
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    res = await fetcher(`${baseHref()}taxes/archive.json`, { cache: 'no-store', headers });
  } catch {
    return { ...EMPTY, reason: ARCHIVE_REASON.UNREACHABLE };
  }
  if (res && (res.status === 401 || res.status === 403)) return { ...EMPTY, reason: ARCHIVE_REASON.LOCKED };
  if (!res || !res.ok) return { ...EMPTY, reason: ARCHIVE_REASON.UNREACHABLE };
  // A 200 that is not JSON means the request never reached the NAS: it fell
  // through to the single-page app, which answers any path under its own base
  // with HTML. That is a missing road, not an empty archive, and it is reported
  // as such instead of being swallowed.
  let data;
  try {
    data = await res.json();
  } catch {
    return { ...EMPTY, reason: ARCHIVE_REASON.NO_ROAD };
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.documents)) {
    return { ...EMPTY, reason: ARCHIVE_REASON.NO_ROAD };
  }
  return {
    documents: data.documents,
    served_at: data.served_at || null,
    source: 'nas',
    reason: ARCHIVE_REASON.OK,
  };
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

/**
 * One return's bytes, fetched WITH the family key and handed to the in-app
 * viewer as a local blob url (DR-1086). A plain link cannot carry the key, so
 * "Open / print" no longer points the browser at the NAS. Returns the viewer's
 * resolver shape: { ok:true, url } or { ok:false, reason }. Never throws.
 */
export async function fetchTaxFile(doc, { token = '' } = {}) {
  const url = printableUrl(doc);
  if (!url) return { ok: false, reason: 'no-file' };
  if (!fetcher) return { ok: false, reason: 'network' };
  let res;
  try {
    res = await fetcher(url, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (!res) return { ok: false, reason: 'network' };
  if (res.status === 401 || res.status === 403) return { ok: false, reason: 'no-access' };
  if (res.status === 404) return { ok: false, reason: 'not-on-server' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  try {
    const blob = await res.blob();
    if (typeof URL === 'undefined' || !URL.createObjectURL) return { ok: false, reason: 'unknown' };
    const local = URL.createObjectURL(blob);
    // The viewer fetches the url once and keeps its own copy; this one is freed.
    setTimeout(() => { try { URL.revokeObjectURL(local); } catch { /* gone */ } }, 60000);
    return { ok: true, url: local };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
