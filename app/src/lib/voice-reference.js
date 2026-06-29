// =============================================================================
// voice-reference — store the recorded voice SAMPLE (the clone reference)
// =============================================================================
// The sample recorded in-app (lib/voice-recording.js) is the speaker reference a
// few-shot clone model (XTTS-v2) conditions on. It must persist so the person can
// record once and hear themselves later, and so it can be sent to the voice
// endpoint (bridge or sovereign 4070 studio) at synth time.
//
// Storage today: IndexedDB on the device (no backend needed → works tonight). It
// is the family's own device, nothing leaves it until the person chooses to
// synthesize (then it goes ONLY to their own sovereign/bridge endpoint). Keyed by
// person_key so it lines up with the voice_profiles row. Cross-device sync (upload
// to the family's own storage) is a follow-up; the local sample already unblocks
// "record tonight, hear yourself when the endpoint is live."
//
// Pure helpers (key, validation, base64 conversion) are exported for tests; the
// IndexedDB ops are null-safe and never throw (degrade to in-memory for the
// session if IndexedDB is unavailable, e.g. private mode).

const DB_NAME = 'poe-voice';
const STORE = 'references';

/** Stable IndexedDB key for a person's reference sample. Pure. */
export function referenceKey(personKey) {
  return `ref:${String(personKey || 'me')}`;
}

/** A blob is a usable reference if it has audio bytes. Pure. */
export function isUsableReference(blob) {
  return !!(blob && typeof blob.size === 'number' && blob.size > 1000 && /audio\//.test(blob.type || ''));
}

// Session fallback when IndexedDB is unavailable (private mode / old browser).
const memStore = new Map();

function openDb() {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { try { req.result.createObjectStore(STORE); } catch (_) {} };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (_) { resolve(null); }
  });
}

/** Save the recorded sample for a person. Returns true on success. Never throws. */
export async function saveReference(personKey, blob) {
  const key = referenceKey(personKey);
  if (!isUsableReference(blob)) return false;
  const db = await openDb();
  if (!db) { memStore.set(key, blob); return true; }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => { memStore.set(key, blob); resolve(true); };
      tx.onerror = () => { memStore.set(key, blob); resolve(true); };
    } catch (_) { memStore.set(key, blob); resolve(true); }
  });
}

/** Load a person's saved sample as a Blob, or null. Never throws. */
export async function loadReference(personKey) {
  const key = referenceKey(personKey);
  if (memStore.has(key)) return memStore.get(key);
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (_) { resolve(null); }
  });
}

/** True if a saved sample exists for this person. Never throws. */
export async function hasReference(personKey) {
  return !!(await loadReference(personKey));
}

/** Delete a person's saved sample (withdrawal / re-record). Never throws. */
export async function clearReference(personKey) {
  const key = referenceKey(personKey);
  memStore.delete(key);
  const db = await openDb();
  if (!db) return;
  try { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(key); } catch (_) {}
}

/** Convert a Blob to a base64 data URI (for sending to the voice endpoint). Never throws. */
export function blobToDataUri(blob) {
  return new Promise((resolve) => {
    try {
      if (typeof FileReader === 'undefined' || !blob) return resolve('');
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : '');
      fr.onerror = () => resolve('');
      fr.readAsDataURL(blob);
    } catch (_) { resolve(''); }
  });
}
