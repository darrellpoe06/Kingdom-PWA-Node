// =============================================================================
// legal-documents-sync — the courier for the legal shelves (0169, DR-0329)
// =============================================================================
// Two halves, deliberately separate:
//
//   METADATA — legal_documents rows, over the proven table-sync rail. A shelf
//              filed on the phone appears on the laptop.
//   BYTES    — the PRIVATE `legal-documents` bucket, read back only through
//              short-lived signed URLs. Never a public URL: showcase.js can use
//              getPublicUrl because a gallery is meant to be seen; a will is
//              not, and a public URL is a permanent unauthenticated link to it.
//
// EVERY METHOD FAILS SOFT AND SIGNED-OUT. The pointer path (no bytes) is the
// whole reason: signed out, on a plane, before migration 0169 has applied, the
// user can still record that the trust instrument is at counsel's office, and
// it syncs when a session returns. Only the FILE path needs the network, and it
// says so in words rather than failing blankly.
// =============================================================================
import supabase from './supabase.js';
import { createTableSync, unionPreservingLocal } from './table-sync.js';
import { extensionOf, storagePathFor, validateFile } from './legal-documents.js';

export const BUCKET = 'legal-documents';

// How long a signed URL lives. Long enough to open a PDF viewer on a slow
// phone, short enough that a URL pasted into a chat is dead before it travels.
export const SIGNED_URL_TTL_SECONDS = 300;

export const legalDocumentsSync = createTableSync({
  localKey: 'poetech-legal-documents-v1',
  remoteTable: 'legal_documents',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by: userId,
      slug: item.id,
      category: item.category,
      doc_type: item.docType || null,
      label: item.label,
      date_of: item.dateOf || null,
      // Sent as a real boolean, never coerced. The column is NOT NULL, so an
      // undecided document is rejected by Postgres as well as by the form —
      // the mechanical guarantee behind the privileged-stripped export holds
      // at both ends (see 0169's note on this column).
      privileged: item.privileged === true,
      where_filed: item.whereFiled || null,
      note: item.note || null,
      file_name: item.fileName || null,
      file_size: item.fileSize == null ? null : item.fileSize,
      storage_path: item.storagePath || null,
    };
  },

  fromRow(row) {
    return {
      id: row.slug ?? `ld-remote-${row.id}`,
      remoteUuid: row.id,
      category: row.category,
      docType: row.doc_type ?? '',
      label: row.label ?? '',
      dateOf: row.date_of ?? null,
      privileged: row.privileged === true,
      whereFiled: row.where_filed ?? '',
      note: row.note ?? '',
      fileName: row.file_name ?? '',
      fileSize: row.file_size == null ? null : Number(row.file_size),
      storagePath: row.storage_path ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Read back so the toggle shows the truth; never written by toRow (a
      // share is its own explicit action, setLegalDocumentShared below).
      sharedWithHousehold: row.shared_with_household === true,
    };
  },

  idOf(item) {
    return item.id;
  },
});

// Merge a fresh cloud list with the current local list, preserving any locally-
// created record whose INSERT hasn't landed yet — the same data-loss guard
// every other sync in the app uses.
export function mergeRemoteLegalDocuments(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}

async function currentUserId() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch { return null; }
}

/**
 * Put the bytes in the vault. Returns { ok, storagePath, fileName, fileSize }
 * or { ok:false, reason, message } — never throws, and every failure carries a
 * sentence the person holding the phone can act on.
 */
export async function uploadLegalFile({ file, slug }) {
  const bounds = validateFile(file);
  if (!bounds.ok) return { ok: false, reason: bounds.reason, message: bounds.message };
  if (!slug) return { ok: false, reason: 'no-slug', message: 'Internal error: the document has no id.' };

  const userId = await currentUserId();
  if (!userId) {
    return {
      ok: false,
      reason: 'signed-out',
      message: 'Sign in to store the file itself — a document needs the private vault, and this device has no session. You can still file it as a pointer (say where the paper is) and attach the file later.',
    };
  }

  const path = storagePathFor({ userId, slug, fileName: file.name });
  try {
    // upsert:false — a slug is unique per owner, so a collision means something
    // is wrong upstream and overwriting would destroy a document silently.
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('bucket') && msg.includes('not found')) {
        return {
          ok: false,
          reason: 'no-bucket',
          message: 'The private legal vault is not set up on this backend yet (migration 0169). Your document was not stored. File it as a pointer for now — nothing is lost.',
        };
      }
      return { ok: false, reason: 'upload-failed', message: `The file could not be stored: ${error.message}` };
    }
  } catch (e) {
    return { ok: false, reason: 'network-error', message: `The file could not be stored: ${(e && e.message) || 'the connection failed'}` };
  }

  return {
    ok: true,
    storagePath: path,
    fileName: file.name,
    fileSize: Number(file.size) || null,
    extension: extensionOf(file.name),
  };
}

/**
 * A short-lived URL for opening one document. Returns null on any failure —
 * the caller says "could not open" rather than rendering a dead link.
 */
export async function signedLegalUrl(storagePath) {
  if (!storagePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    if (error) return null;
    return data?.signedUrl || null;
  } catch { return null; }
}

/**
 * Remove the bytes. Best-effort by design: the metadata row is the record the
 * user sees, so a failed object delete must not block removing the row and
 * strand a document on the shelf forever. It returns its outcome so the caller
 * can say what actually happened rather than claiming a clean delete.
 */
export async function deleteLegalFile(storagePath) {
  if (!storagePath) return { ok: true, skipped: 'pointer' };
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) return { ok: false, reason: 'delete-failed', message: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: (e && e.message) || 'the connection failed' };
  }
}

// =============================================================================
// HOUSEHOLD SHARING (migration 0299, DR-1077)
// =============================================================================
// Darrell 2026-10-16: "We are in the same family and need our records to be in
// sync with what we are doing and also some users will not want that."
//
// Two calls, both explicit, neither riding the device sync:
//   * setLegalDocumentShared — the filer turns sharing on or off for ONE of
//     their own documents. Off is the default and stays the default.
//   * fetchHouseholdLegalDocuments — what OTHER members of the household have
//     shared with me, read through a definer function. The table's own read
//     stays creator-only, so these rows never enter legalDocumentsSync, never
//     land in my local shelf, and can never be uploaded as mine.
// Both return { ok } | { ok:false, reason, message } and never throw. Before
// 0299 is applied the function is missing; that reads as 'not-available' and
// the shelf simply shows only the person's own papers, as it always did.
// =============================================================================

export const HOUSEHOLD_TIMEOUT_MS = 8000;

function withTimeout(promise, ms, what) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} took longer than ${Math.round(ms / 1000)} seconds`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function missingFunction(error) {
  const msg = String((error && error.message) || '').toLowerCase();
  return (error && (error.code === 'PGRST202' || error.code === '42883'))
    || msg.includes('could not find the function') || (msg.includes('function') && msg.includes('does not exist'));
}

export function householdRowToDocument(row) {
  if (!row) return null;
  return {
    id: `ld-household-${row.id}`,
    remoteUuid: row.id,
    category: row.category,
    docType: row.doc_type ?? '',
    label: row.label ?? '',
    dateOf: row.date_of ?? null,
    privileged: row.privileged === true,
    whereFiled: row.where_filed ?? '',
    note: row.note ?? '',
    fileName: row.file_name ?? '',
    fileSize: row.file_size == null ? null : Number(row.file_size),
    storagePath: row.storage_path ?? null,
    createdAt: row.created_at,
    sharedWithHousehold: true,
    fromHousehold: true,
    sharedBy: row.shared_by || 'A member of your household',
  };
}

export async function fetchHouseholdLegalDocuments() {
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('household_shared_legal_documents'),
      HOUSEHOLD_TIMEOUT_MS, 'reading what your household shared');
    if (error) {
      if (missingFunction(error)) return { ok: false, reason: 'not-available', message: 'Household sharing is not set up on this backend yet.' };
      return { ok: false, reason: 'rpc-error', message: error.message || 'The household list could not be read.' };
    }
    return { ok: true, items: (data || []).map(householdRowToDocument).filter(Boolean) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: (e && e.message) || 'the connection failed' };
  }
}

export async function setLegalDocumentShared(remoteUuid, shared) {
  if (!remoteUuid) {
    return { ok: false, reason: 'not-synced', message: 'This document has not reached your account yet. Sign in and let it sync, then share it.' };
  }
  try {
    const { data, error } = await withTimeout(
      supabase.from('legal_documents')
        .update({ shared_with_household: shared === true })
        .eq('id', remoteUuid)
        .select('id, shared_with_household')
        .maybeSingle(),
      HOUSEHOLD_TIMEOUT_MS, 'changing who can see it');
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('shared_with_household') && (msg.includes('column') || msg.includes('schema cache'))) {
        return { ok: false, reason: 'not-available', message: 'Household sharing is not set up on this backend yet. Nothing changed.' };
      }
      return { ok: false, reason: 'rpc-error', message: error.message || 'Sharing could not be changed.' };
    }
    if (!data) return { ok: false, reason: 'not-found', message: 'Only the person who filed a document can change who sees it.' };
    return { ok: true, shared: data.shared_with_household === true };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: (e && e.message) || 'the connection failed' };
  }
}
