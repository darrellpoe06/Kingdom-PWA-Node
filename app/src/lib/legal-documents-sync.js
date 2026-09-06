// =============================================================================
// legal-documents-sync — the courier for the legal shelves (0168, DR-0329)
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
// whole reason: signed out, on a plane, before migration 0168 has applied, the
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
      // at both ends (see 0168's note on this column).
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
          message: 'The private legal vault is not set up on this backend yet (migration 0168). Your document was not stored. File it as a pointer for now — nothing is lost.',
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
