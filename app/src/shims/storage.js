// Shim for the prototype's window.storage API. Contract (from the call sites):
//   await window.storage.get(key)        -> { value: string } | null
//   await window.storage.set(key, value) -> void   (value is a string)
//
// 2026-08-21 (measured on Darrell's phone): this was backed by localStorage,
// which every browser caps at ~5MB PER SITE regardless of device free space.
// The family snapshot (2,900+ transactions + history) outgrew that box, all
// three save tiers threw, and the banner falsely told him "this device is out
// of local space" on a phone with gigabytes free (DR-0100 — the false alarm is
// the defect). IndexedDB is the right home: same origin scoping, but its quota
// scales with the device (typically many GB), and the API here was already
// async so the swap is invisible to callers.
//
//   • get: IndexedDB first; falls back to localStorage so a snapshot written
//     by an older build is still read (one-way migration on next set).
//   • set: IndexedDB primary. On success the localStorage copy of that key is
//     REMOVED — a stale localStorage twin must never hydrate an older build
//     with week-old data (the cloud snapshot covers a rollback instead).
//   • If IndexedDB is unavailable (rare: lockdown/private modes), everything
//     falls back to exactly the old localStorage behavior, including the
//     quota throw the snapshot-slim tiers are built to catch.

const DB_NAME = 'poetech-storage';
const STORE = 'kv';

let dbPromise = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') { reject(new Error('indexedDB unavailable')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('indexedDB open failed'));
      req.onblocked = () => reject(new Error('indexedDB blocked'));
    } catch (e) {
      reject(e);
    }
  });
  // A failed open must not poison every later call — retry fresh next time.
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

function idbGet(key) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB get failed'));
  }));
}

function idbSet(key, value) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('indexedDB set failed'));
    tx.onabort = () => reject(tx.error || new Error('indexedDB set aborted'));
  }));
}

export const storage = {
  async get(key) {
    try {
      const value = await idbGet(key);
      if (typeof value === 'string') return { value };
    } catch (_) { /* fall through to localStorage */ }
    const value = localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    try {
      await idbSet(key, value);
      // The durable copy now lives in IndexedDB; drop the (possibly stale,
      // possibly quota-blocked) localStorage twin so it can never hydrate over
      // newer data. Best-effort — removal never fails a successful save.
      try { localStorage.removeItem(key); } catch (_) { /* non-fatal */ }
      return;
    } catch (_) {
      // IndexedDB unavailable — the old behavior, quota throw and all.
      localStorage.setItem(key, value);
    }
  },
};
