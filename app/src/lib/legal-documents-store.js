// =============================================================================
// legal-documents-store — device-local persistence for the legal shelves
// =============================================================================
// Local-first, the family-trust-store pattern: a pointer record ("the will is
// in the fire safe") can be filed on a phone with no signal, and
// legal-documents-sync.js is the courier that carries it to the user's other
// devices when a session exists.
//
// legal-documents.js stays PURE (no browser APIs) so its engine is
// node-testable; this file is the only place shelf METADATA touches storage.
// File BYTES never come here — they go to the private bucket. A 25 MB PDF as a
// data URL would blow the ~5 MB localStorage quota and take unrelated app state
// down with it, which is how a legal shelf would end up corrupting the books.
// =============================================================================

export const DOCS_KEY = 'poetech-legal-documents-v1';

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch { return null; }
}

export function loadLegalDocuments(storage = safeStorage()) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(DOCS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveLegalDocuments(docs, storage = safeStorage()) {
  if (!storage) return { skipped: 'no-storage' };
  try {
    storage.setItem(DOCS_KEY, JSON.stringify(Array.isArray(docs) ? docs : []));
    return { saved: true };
  } catch (e) {
    // A quota error here means the shelf silently stops remembering. Report it
    // rather than swallowing it — the caller surfaces it (DR-0076: a failure
    // the user never sees is a failure the user cannot act on).
    return { skipped: 'write-error', error: e };
  }
}
