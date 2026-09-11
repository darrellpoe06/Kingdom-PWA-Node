// =============================================================================
// family-vault-sync — the seam for the household's shelf (0201, DR-0357)
// =============================================================================
// Rows come through RLS, not through a filter the client can forget: the
// policy returns my own documents plus the ones a household member shared with
// the household. Bytes live in the private `family-documents` bucket and open
// only through a short-lived signed URL — never a stored public link.
// =============================================================================
import supabase from './supabase.js';
import { documentPath, validateDocument, validateFile } from './family-vault.js';

export const BUCKET = 'family-documents';
export const SIGNED_URL_TTL_SECONDS = 300;
export const TIMEOUT_MS = 20000;
export const UPLOAD_TIMEOUT_MS = 120000;

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}
function message(error) {
  const raw = String((error && (error.message || error.msg)) || error || '').replace(/^.*?:\s*/, '');
  return raw || 'That did not go through.';
}

const fromRow = (r) => ({
  id: r.id,
  instanceId: r.instance_id,
  createdBy: r.created_by,
  slug: r.slug,
  category: r.category,
  label: r.label,
  dateOf: r.date_of || '',
  expiresOn: r.expires_on || '',
  note: r.note || '',
  whereFiled: r.where_filed || '',
  fileName: r.file_name || '',
  fileSize: r.file_size || 0,
  storagePath: r.storage_path || '',
  sharedWithHousehold: r.shared_with_household === true,
  createdAt: r.created_at,
  updatedAt: r.updated_at || null,
});

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return (data && data.user && data.user.id) || null;
}

/** Everything this person may see on the household's shelf. */
export async function listDocuments(instanceId = null) {
  try {
    let q = supabase.from('family_documents')
      .select('id, instance_id, created_by, slug, category, label, date_of, expires_on, note, where_filed, file_name, file_size, storage_path, shared_with_household, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (instanceId) q = q.eq('instance_id', instanceId);
    const { data, error } = await withTimeout(q, TIMEOUT_MS, 'reading the shelf');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error), rows: [] };
    return { ok: true, rows: (data || []).map(fromRow) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e), rows: [] };
  }
}

/** Put a file in the private bucket. Returns the pointer the row will carry. */
export async function uploadDocumentFile({ file, slug }) {
  const check = validateFile(file);
  if (!check.ok) return { ok: false, reason: 'bad-file', message: check.message };
  const userId = await currentUserId();
  if (!userId) return { ok: false, reason: 'signed-out', message: 'Sign in first.' };
  const path = documentPath({ userId, slug, fileName: file.name });
  try {
    const { error } = await withTimeout(
      supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' }),
      UPLOAD_TIMEOUT_MS, 'uploading the file');
    if (error) return { ok: false, reason: 'upload-error', message: message(error) };
    return { ok: true, pointer: { storagePath: path, fileName: file.name, fileSize: file.size } };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/** File a document on the shelf — a file, a pointer, or both. */
export async function saveDocument(doc, instanceId) {
  const errors = validateDocument(doc);
  if (errors.length) return { ok: false, reason: 'invalid', errors, message: errors[0] };
  const userId = await currentUserId();
  if (!userId) return { ok: false, reason: 'signed-out', message: 'Sign in first.' };
  if (!instanceId) return { ok: false, reason: 'no-instance', message: 'No household to file this in.' };
  const row = {
    instance_id: instanceId,
    created_by: userId,
    slug: doc.slug,
    category: doc.category,
    label: String(doc.label).trim(),
    date_of: doc.dateOf || null,
    expires_on: doc.expiresOn || null,
    note: doc.note || null,
    where_filed: doc.whereFiled || null,
    file_name: doc.fileName || null,
    file_size: doc.fileSize || null,
    storage_path: doc.storagePath || null,
    shared_with_household: doc.sharedWithHousehold === true,
  };
  try {
    const { data, error } = await withTimeout(
      supabase.from('family_documents').upsert(row, { onConflict: 'created_by,slug' }).select().single(),
      TIMEOUT_MS, 'filing the document');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, row: fromRow(data) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/** Share one of my documents with the household, or take it back. */
export async function shareDocument(id, shared) {
  try {
    const { data, error } = await withTimeout(
      supabase.from('family_documents').update({ shared_with_household: shared === true, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
      TIMEOUT_MS, 'changing who can see it');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, row: fromRow(data) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/** A short-lived link to the bytes. Never stored, never shared onward. */
export async function signedDocumentUrl(storagePath) {
  if (!storagePath) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS),
      TIMEOUT_MS, 'opening the file');
    if (error) return null;
    return (data && data.signedUrl) || null;
  } catch { return null; }
}

/** Remove a document — the row and, when there is one, the file with it. */
export async function removeDocument(row) {
  if (!row || !row.id) return { ok: false, reason: 'no-row', message: 'Nothing to remove.' };
  try {
    if (row.storagePath) {
      await withTimeout(supabase.storage.from(BUCKET).remove([row.storagePath]), TIMEOUT_MS, 'removing the file').catch(() => null);
    }
    const { error } = await withTimeout(supabase.from('family_documents').delete().eq('id', row.id), TIMEOUT_MS, 'removing the document');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, removed: true };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}
