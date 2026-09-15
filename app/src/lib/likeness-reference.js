// =============================================================================
// likeness-reference — store the enrolled PORTRAIT (the talking-head reference)
// =============================================================================
// The photo a person enrols in-app (VoiceStudio → Likeness) is the reference
// the avatar studio animates. Same doctrine as voice-reference.js: it lives on
// the person's OWN device (IndexedDB), nothing leaves it until they choose to
// render, and then it goes ONLY to the family's own studio. Keyed by
// person_key so it lines up with the voice_profiles row that records consent.
// Cross-device sync is the same carried follow-up as the voice sample.
//
// Pure helpers are exported for tests; the IndexedDB ops are null-safe and
// degrade to memory for the session when IndexedDB is unavailable.

const DB_NAME = 'poe-likeness';
const STORE = 'portraits';

/** Stable key for a person's portrait. Pure. */
export function portraitKey(personKey) {
  return `portrait:${String(personKey || 'me')}`;
}

/** A blob is a usable portrait if it is an image with real bytes. Pure. */
export function isUsablePortrait(blob) {
  return !!(blob && typeof blob.size === 'number' && blob.size > 2000 && /^image\//.test(blob.type || ''));
}

const memStore = new Map();

function openDb() {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { try { req.result.createObjectStore(STORE); } catch (_) { /* exists */ } };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch (_) { resolve(null); }
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve) => {
    try {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    } catch (_) { resolve(undefined); }
  });
}

/** Save the portrait. Returns true when stored (IndexedDB or memory). */
export async function savePortrait(personKey, blob) {
  if (!isUsablePortrait(blob)) return false;
  const key = portraitKey(personKey);
  const db = await openDb();
  if (!db) { memStore.set(key, blob); return true; }
  const ok = await tx(db, 'readwrite', (s) => s.put(blob, key));
  if (ok === undefined) { memStore.set(key, blob); }
  return true;
}

/** Load the portrait, or null. */
export async function loadPortrait(personKey) {
  const key = portraitKey(personKey);
  const db = await openDb();
  if (!db) return memStore.get(key) || null;
  const got = await tx(db, 'readonly', (s) => s.get(key));
  return got || memStore.get(key) || null;
}

export async function hasPortrait(personKey) {
  return !!(await loadPortrait(personKey));
}

export async function clearPortrait(personKey) {
  const key = portraitKey(personKey);
  memStore.delete(key);
  const db = await openDb();
  if (!db) return true;
  await tx(db, 'readwrite', (s) => s.delete(key));
  return true;
}

/** Blob → data URI (what the studio's /render takes). */
export function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    try {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('read-failed'));
      r.readAsDataURL(blob);
    } catch (e) { reject(e); }
  });
}
