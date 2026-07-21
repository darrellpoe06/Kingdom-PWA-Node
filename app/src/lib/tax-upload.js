// =============================================================================
// tax-upload — in-app upload of a tax PDF to the sovereign NAS archive
// =============================================================================
// Darrell 2026-07-21: "give a place to upload it inside PoeTech App for Christina
// instead of synology." So she never touches File Station — she picks the PDF in
// Books -> Taxes and it lands on the NAS. Reuses the proven same-origin + bearer
// pattern the app already uses to reach the NAS (nas-photos.js): POST multipart
// to /taxes/upload (Caddy routes it to the NAS upload service,
// infra/nas-tax-ingest/tax_upload_server.py), which writes the PDF onto the
// tax-documents bind mount and re-runs the ingest. The reply carries the fresh
// archive, so the screen updates without a manual refresh.
//
// Validation is the pure, testable core (DR-0076): a real PDF, a 4-digit year,
// an entity, a known kind — checked BEFORE any network call. The fetch is
// injectable for tests.
// =============================================================================

import { TAX_DOC_KINDS } from './tax-documents.js';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — a scanned return is well under this.

function baseHref() {
  try {
    if (typeof document !== 'undefined' && document.baseURI) return new URL('.', document.baseURI).href;
  } catch { /* fall through */ }
  return '/';
}

let fetcher = (typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null;
export function __setUploadFetcher(fn) {
  fetcher = fn || ((typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null);
}

/**
 * Validate an upload request BEFORE sending. Returns { ok, errors }.
 * @param req { file:{name,size,type}, entityId, year, kind }
 */
export function validateUpload(req) {
  const errors = [];
  const r = req || {};
  const f = r.file;
  if (!f || typeof f.name !== 'string') {
    errors.push('Choose a PDF file to upload.');
  } else {
    const isPdf = /\.pdf$/i.test(f.name) || f.type === 'application/pdf';
    if (!isPdf) errors.push('The file must be a PDF.');
    if (typeof f.size === 'number' && f.size > MAX_BYTES) errors.push('That file is larger than 25 MB.');
    if (typeof f.size === 'number' && f.size === 0) errors.push('That file is empty.');
  }
  const y = Number(r.year);
  if (!Number.isInteger(y) || y < 1900 || y > 2200) errors.push('Enter a 4-digit tax year.');
  if (typeof r.entityId !== 'string' || !r.entityId.trim()) errors.push('Choose which entity this return belongs to.');
  if (r.kind != null && !TAX_DOC_KINDS.includes(r.kind)) errors.push('Pick a valid document type.');
  return { ok: errors.length === 0, errors };
}

/** A filesystem-safe basename for the stored PDF (no traversal, no spaces). */
export function safeFilename(name) {
  const base = String(name || 'document.pdf').replace(/^.*[\\/]/, '');   // strip any path
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '-').replace(/-+/g, '-');
  return /\.pdf$/i.test(cleaned) ? cleaned : cleaned + '.pdf';
}

/**
 * Upload a tax PDF to the NAS. Enforces validateUpload first. Best-effort:
 * returns { ok:true, archive } on success, or { ok:false, ... } — never throws.
 * @param req  { file, entityId, year, kind }
 * @param opts { token?:string, formData?:FormData }  token = the NAS bridge bearer
 */
export async function uploadTaxDoc(req, opts = {}) {
  const v = validateUpload(req);
  if (!v.ok) return { ok: false, skipped: 'invalid', errors: v.errors };
  if (!fetcher) return { ok: false, skipped: 'no-fetch' };

  // FormData is injectable so the node test env (no DOM FormData needed) can pass one in.
  const fd = opts.formData || (typeof FormData !== 'undefined' ? new FormData() : null);
  if (!fd) return { ok: false, skipped: 'no-formdata' };
  fd.append('file', req.file, safeFilename(req.file.name));
  fd.append('entityId', req.entityId);
  fd.append('year', String(Number(req.year)));
  fd.append('kind', req.kind || 'return');

  const headers = {};
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;

  try {
    const res = await fetcher(`${baseHref()}taxes/upload`, { method: 'POST', headers, body: fd });
    if (!res || !res.ok) return { ok: false, skipped: 'upload-error', status: res ? res.status : 0 };
    const data = await res.json().catch(() => ({}));
    return { ok: true, archive: (data && data.archive) || null, record: (data && data.record) || null };
  } catch {
    return { ok: false, skipped: 'network-error' };
  }
}
