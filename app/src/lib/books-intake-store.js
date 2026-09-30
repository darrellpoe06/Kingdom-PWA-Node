// =============================================================================
// books-intake-store — where every uploaded document is kept FIRST
// (DR-0709, the one Books upload)
// =============================================================================
// "Take anything, never reject." The original file is stored the moment it is
// chosen, with the time it was received, BEFORE anything tries to read it, so a
// failure in any later step loses nothing. The same store keeps the question
// queue (inside each document), the learned layouts and the "teach the system"
// counts, so all of it is still there tomorrow.
//
// Two backends with one interface:
//   idbStore()    — IndexedDB on this device (the file's bytes as a Blob)
//   memoryStore() — tests, and DEMO MODE, which must write nothing lasting
// The cloud copy of the original (the household's private document shelf) is
// books-intake-pipeline's job, after this local write has succeeded.
// =============================================================================

export const DB_NAME = 'poetech-books-intake';
export const DB_VERSION = 1;
const DOCS = 'docs';
const LAYOUTS = 'layouts';
const TEACH = 'teach';

export function memoryStore() {
  const docs = new Map(); const layouts = new Map(); const teach = new Map();
  const clone = (v) => (v == null ? v : { ...v });
  return {
    kind: 'memory',
    async putDoc(d) { docs.set(d.id, clone(d)); return d; },
    async getDoc(id) { return clone(docs.get(id)) || null; },
    async listDocs() { return [...docs.values()].map(clone).sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt))); },
    async deleteDoc(id) { docs.delete(id); },
    async getLayout(key) { return clone(layouts.get(key)) || null; },
    async putLayout(key, v) { layouts.set(key, { ...v, key }); },
    async bumpTeach(key, sample) {
      const prev = teach.get(key) || { key, count: 0, samples: [] };
      teach.set(key, { ...prev, count: prev.count + 1, samples: [...prev.samples, sample].slice(-3), lastAt: sample && sample.at });
    },
    async clearTeach(key) { teach.delete(key); },
    async listTeach() { return [...teach.values()].map(clone).sort((a, b) => b.count - a.count); },
  };
}

function openDb(idb) {
  return new Promise((resolve, reject) => {
    const req = idb.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DOCS)) db.createObjectStore(DOCS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(LAYOUTS)) db.createObjectStore(LAYOUTS, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(TEACH)) db.createObjectStore(TEACH, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(dbp, store, mode, fn) {
  return dbp.then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let out;
    const r = fn(s);
    if (r && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

/** The device store. Falls back to memory (and says so) where IndexedDB is absent. */
export function idbStore(idb = (typeof indexedDB !== 'undefined' ? indexedDB : null)) {
  if (!idb) return { ...memoryStore(), kind: 'memory-fallback' };
  let dbp = null;
  const db = () => { if (!dbp) dbp = openDb(idb); return dbp; };
  return {
    kind: 'indexeddb',
    putDoc: (d) => tx(db(), DOCS, 'readwrite', (s) => s.put(d)).then(() => d),
    getDoc: (id) => tx(db(), DOCS, 'readonly', (s) => s.get(id)).then((v) => v || null),
    listDocs: () => tx(db(), DOCS, 'readonly', (s) => s.getAll()).then((v) => (v || []).sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)))),
    deleteDoc: (id) => tx(db(), DOCS, 'readwrite', (s) => s.delete(id)),
    getLayout: (key) => tx(db(), LAYOUTS, 'readonly', (s) => s.get(key)).then((v) => v || null),
    putLayout: (key, v) => tx(db(), LAYOUTS, 'readwrite', (s) => s.put({ ...v, key })),
    async bumpTeach(key, sample) {
      const prev = (await tx(db(), TEACH, 'readonly', (s) => s.get(key))) || { key, count: 0, samples: [] };
      await tx(db(), TEACH, 'readwrite', (s) => s.put({ ...prev, count: prev.count + 1, samples: [...prev.samples, sample].slice(-3), lastAt: sample && sample.at }));
    },
    clearTeach: (key) => tx(db(), TEACH, 'readwrite', (s) => s.delete(key)),
    listTeach: () => tx(db(), TEACH, 'readonly', (s) => s.getAll()).then((v) => (v || []).sort((a, b) => b.count - a.count)),
  };
}

// One store per page; demo mode gets its own throwaway memory store.
let shared = null;
let demo = null;
export function intakeStore({ demoMode = false } = {}) {
  if (demoMode) { if (!demo) demo = memoryStore(); return demo; }
  if (!shared) shared = idbStore();
  return shared;
}
