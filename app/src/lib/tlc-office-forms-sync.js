// =============================================================================
// tlc-office-forms-sync — the seam for the office's live forms (0196)
// =============================================================================
// Read: tlc_office_documents_read (a member, or a colleague with a packet).
// Save: tlc_office_document_save (owner/admin; a note is required; every
// save is a new version). Timeouts and fail-soft like every TLC seam: a
// failed read resolves to the ORIGINAL so the packet never blocks.
// =============================================================================
import supabase from './supabase.js';
import { tlcError } from './tlc-error.js';
import { resolveOfficeDocuments, OFFICE_DOCUMENT_KEYS, validateIntakeForm, validateDocument, normalizeIntakeForm, normalizeDocument } from './tlc-office-forms.js';

export const RPC_TIMEOUT_MS = 15000;

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}
function fail(reason, error) { return { ok: false, reason, message: tlcError(error) }; }

/** The office's live definitions, resolved onto the original. Never throws. */
export async function readOfficeDocuments(office = 'tlc') {
  try {
    const { data, error } = await withTimeout(supabase.rpc('tlc_office_documents_read', { office_in: office }), RPC_TIMEOUT_MS, 'reading the office forms');
    if (error) return { ok: false, reason: 'rpc-error', message: tlcError(error), resolved: resolveOfficeDocuments(null) };
    return { ok: true, resolved: resolveOfficeDocuments(data) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: tlcError(e), resolved: resolveOfficeDocuments(null) };
  }
}

/** Save one document as a new version. Validated on the device first, in the same words the editor shows. */
export async function saveOfficeDocument(key, body, note) {
  if (!OFFICE_DOCUMENT_KEYS.includes(key)) return fail('bad-key', 'Unknown office document.');
  const errors = key === 'intake-form' ? validateIntakeForm(body) : validateDocument(key, body);
  if (errors.length) return { ok: false, reason: 'invalid', message: errors[0], errors };
  const n = String(note || '').trim();
  if (n.length < 3) return { ok: false, reason: 'no-note', message: 'Say in a few words what changed.' };
  const clean = key === 'intake-form' ? normalizeIntakeForm(body) : normalizeDocument(key, body);
  try {
    const { data, error } = await withTimeout(supabase.rpc('tlc_office_document_save', { key_in: key, body_in: clean, note_in: n }), RPC_TIMEOUT_MS, 'saving the office form');
    if (error) return fail('rpc-error', error);
    return { ok: true, saved: data, body: clean };
  } catch (e) { return fail('network-error', e); }
}
