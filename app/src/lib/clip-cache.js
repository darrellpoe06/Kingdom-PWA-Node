// =============================================================================
// clip-cache — the NAS voice's clips kept ON THE DEVICE (DR-0659)
// =============================================================================
// Darrell 2026-09-24: "So we need a direct connection to the nas for a good
// reading?!!! Can't we give everything it needs for quality without needing to
// reconnect with the nas?"
//
// Every piece of a reading the NAS voice makes is kept here, keyed by what it
// is — the voice, the model and the exact words — so a replay, a resume, a jump
// to a paragraph, or the rest of a reading after the connection drops plays
// from the device and never asks the NAS again.
//
// WHY IndexedDB AND NOT Cache Storage: the service worker (public/sw.js)
// deletes every cache but its own each time a new build activates, and this
// app deploys many times a day — a clip saved in Cache Storage would be gone
// by the evening. IndexedDB is the device's, not the worker's.
//
// Size: least-recently-played clips go first once the total passes the cap
// (300 MB unless the listener picks another). Everything is injectable (a
// Map-backed store for tests); every storage call is wrapped, and a store that
// cannot open means "not cached", never a broken reading.
// =============================================================================

/** The models behind the NAS voices (infra/nas-voice-lite/install.sh). */
export const LITE_MODELS = Object.freeze({ male: 'en_US-ryan-medium', female: 'en_US-amy-medium' });
export const CAP_KEY = 'poe-voice-cache-cap-mb';
export const DEFAULT_CAP_MB = 300;
export const CAP_CHOICES_MB = [100, 300, 600, 1000];
const MB = 1024 * 1024;

// cyrb53 — a fast 53-bit string hash; used twice with different seeds for a
// 106-bit key. Synchronous, so a key never waits on crypto.subtle (which a TV
// browser on plain http does not offer).
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed; let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** The key for one clip: voice + model + the exact words sent. */
export function clipKey({ voice = 'male', model, text }) {
  const m = model || LITE_MODELS[voice] || voice;
  const s = `${voice}|${m}|${String(text || '').replace(/\s+/g, ' ').trim()}`;
  return `v1-${cyrb53(s, 1)}${cyrb53(s, 2)}`;
}

export function loadCapMb(storage) {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    const n = Number(s && s.getItem(CAP_KEY));
    return CAP_CHOICES_MB.includes(n) ? n : DEFAULT_CAP_MB;
  } catch { return DEFAULT_CAP_MB; }
}
export function saveCapMb(mb, storage) {
  const n = CAP_CHOICES_MB.includes(Number(mb)) ? Number(mb) : DEFAULT_CAP_MB;
  try { const s = storage || (typeof window !== 'undefined' ? window.localStorage : null); if (s) s.setItem(CAP_KEY, String(n)); } catch { /* best-effort */ }
  return n;
}

/** A store held in memory — tests, and the fallback when IndexedDB is absent. */
export function memoryBackend() {
  const blobs = new Map(); const meta = new Map();
  return {
    async get(k) { return blobs.has(k) ? blobs.get(k) : null; },
    async put(k, blob, m) { blobs.set(k, blob); meta.set(k, { key: k, ...m }); },
    async del(k) { blobs.delete(k); meta.delete(k); },
    async list() { return [...meta.values()]; },
    async touch(k, at) { const m = meta.get(k); if (m) meta.set(k, { ...m, at }); },
    get size() { return blobs.size; },
  };
}

/** The device store: IndexedDB `poe-voice-clips` (blob + meta stores). */
export function indexedDbBackend(name = 'poe-voice-clips') {
  const idb = typeof indexedDB !== 'undefined' ? indexedDB : null;
  if (!idb) return null;
  let dbp = null;
  const db = () => {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        const req = idb.open(name, 1);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains('blob')) d.createObjectStore('blob');
          if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }).catch((e) => { dbp = null; throw e; });
    }
    return dbp;
  };
  const run = async (stores, mode, fn) => {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(stores, mode);
      let out;
      Promise.resolve(fn(tx, (v) => { out = v; })).catch(reject);
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  };
  const req2p = (req) => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
  return {
    get: (k) => run(['blob'], 'readonly', async (tx, set) => { set((await req2p(tx.objectStore('blob').get(k))) || null); }),
    put: (k, blob, m) => run(['blob', 'meta'], 'readwrite', (tx) => { tx.objectStore('blob').put(blob, k); tx.objectStore('meta').put({ key: k, ...m }, k); }),
    del: (k) => run(['blob', 'meta'], 'readwrite', (tx) => { tx.objectStore('blob').delete(k); tx.objectStore('meta').delete(k); }),
    list: () => run(['meta'], 'readonly', async (tx, set) => { set((await req2p(tx.objectStore('meta').getAll())) || []); }),
    touch: (k, at) => run(['meta'], 'readwrite', async (tx) => {
      const store = tx.objectStore('meta');
      const m = await req2p(store.get(k));
      if (m) store.put({ ...m, at }, k);
    }),
  };
}

/**
 * @param {object} [o]
 * @param {object} [o.backend]  memoryBackend()/indexedDbBackend() shape
 * @param {() => number} [o.capBytes]  read at every eviction, so a new pick holds at once
 * @param {() => number} [o.now]
 */
export function createClipCache({ backend, capBytes, now = () => Date.now() } = {}) {
  const store = backend || indexedDbBackend() || memoryBackend();
  const cap = typeof capBytes === 'function' ? capBytes : () => loadCapMb() * MB;
  let evicting = null;
  const api = {
    async get(key) {
      try {
        const blob = await store.get(key);
        if (blob) { try { await store.touch(key, now()); } catch { /* the clip still plays */ } }
        return blob || null;
      } catch { return null; }
    },
    async has(key) { try { return !!(await store.get(key)); } catch { return false; } },
    async put(key, blob) {
      if (!blob || !blob.size) return false;
      try { await store.put(key, blob, { bytes: blob.size, at: now() }); } catch { return false; }
      await api.evict();
      return true;
    },
    /** Least-recently-played first, until the total is under the cap. */
    async evict() {
      if (evicting) return evicting;
      evicting = (async () => {
        try {
          const all = (await store.list()).slice().sort((a, b) => (a.at || 0) - (b.at || 0));
          let total = all.reduce((n, m) => n + (m.bytes || 0), 0);
          const limit = cap();
          for (const m of all) {
            if (total <= limit) break;
            try { await store.del(m.key); total -= m.bytes || 0; } catch { /* next */ }
          }
          return total;
        } catch { return 0; } finally { evicting = null; }
      })();
      return evicting;
    },
    /** How many of these keys are on the device, and their size. */
    async status(keys) {
      try {
        const all = await store.list();
        const byKey = new Map(all.map((m) => [m.key, m]));
        let saved = 0; let bytes = 0;
        for (const k of keys) { const m = byKey.get(k); if (m) { saved += 1; bytes += m.bytes || 0; } }
        return { saved, total: keys.length, bytes };
      } catch { return { saved: 0, total: keys.length, bytes: 0 }; }
    },
    async totalBytes() {
      try { return (await store.list()).reduce((n, m) => n + (m.bytes || 0), 0); } catch { return 0; }
    },
  };
  return api;
}

let shared = null;
/** The one device cache the reader uses. */
export function deviceClipCache() {
  if (!shared) shared = createClipCache();
  return shared;
}
/** Tests only. */
export function _setDeviceClipCacheForTests(c) { shared = c; }

/**
 * Fetch every piece not already on the device, `concurrency` at a time.
 * @param {object} o
 * @param {string[]} o.keys       one per piece
 * @param {(i:number) => Promise<Blob|null>} o.fetchPiece  the network, for piece i
 * @param {object} o.cache        createClipCache()
 * @param {number} [o.concurrency]
 * @param {(p:{saved:number,total:number,bytes:number}) => void} [o.onProgress]
 * @param {{aborted:boolean}} [o.signal]
 * @returns {Promise<{saved:number,total:number,bytes:number,failed:number}>}
 */
export async function cacheAhead({ keys, fetchPiece, cache, concurrency = 3, onProgress, signal }) {
  const total = keys.length;
  let saved = 0; let bytes = 0; let failed = 0;
  const st = await cache.status(keys);
  const todo = [];
  if (st.saved < total) {
    for (let i = 0; i < total; i++) if (!(await cache.has(keys[i]))) todo.push(i);
  }
  saved = total - todo.length; bytes = st.bytes;
  if (onProgress) onProgress({ saved, total, bytes });
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      if (signal && signal.aborted) return;
      const i = todo[next++];
      let blob;
      try { blob = await fetchPiece(i); } catch { blob = null; }
      if (signal && signal.aborted) return;
      if (blob && blob.size && (await cache.put(keys[i], blob))) { saved += 1; bytes += blob.size; } else failed += 1;
      if (onProgress) onProgress({ saved, total, bytes });
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, todo.length || 1)) }, worker));
  return { saved, total, bytes, failed };
}

/**
 * ONE READING'S PIECES, FROM THE DEVICE FIRST (DR-0659).
 * The player (clip-queue) and the fetch-ahead share this: a piece on the
 * device is played from the device; a piece that is not is fetched ONCE (the
 * player and the fetch-ahead wait on the same request), kept, and played.
 * @param {object} o
 * @param {string[]} o.keys           clipKey per piece
 * @param {(i:number, timeoutMs?:number) => Promise<{blob?:Blob,error?:string}>} o.fetchBlob  the network
 * @param {object} o.cache            createClipCache()
 * @param {(b:Blob) => string} o.makeUrl
 */
export function createClipSource({ keys, fetchBlob, cache, makeUrl }) {
  const inflight = new Map();
  let fetches = 0;
  const fromNetwork = (i, timeoutMs) => {
    if (!inflight.has(i)) {
      inflight.set(i, (async () => {
        fetches += 1;
        let got;
        try { got = await fetchBlob(i, timeoutMs); } catch (e) { got = { error: (e && e.message) || 'fetch-failed' }; }
        if (got && got.blob && got.blob.size) await cache.put(keys[i], got.blob);
        return got || { error: 'fetch-failed' };
      })().finally(() => inflight.delete(i)));
    }
    return inflight.get(i);
  };
  return {
    /** For the player: a playable URL for piece i, or {error}. */
    async clip(i, timeoutMs) {
      const hit = await cache.get(keys[i]);
      if (hit) return { url: makeUrl(hit), cached: true };
      const got = await fromNetwork(i, timeoutMs);
      if (!got || got.error || !got.blob) return { error: (got && got.error) || 'voice-lite-empty' };
      return { url: makeUrl(got.blob) };
    },
    /** Fetch every piece not on the device yet, a few at a time. */
    ahead({ concurrency = 3, onProgress, signal } = {}) {
      return cacheAhead({
        keys, cache, concurrency, onProgress, signal,
        // The player may have fetched it since the list was made.
        fetchPiece: async (i) => {
          const hit = await cache.get(keys[i]);
          if (hit) return hit;
          const got = await fromNetwork(i);
          return got && got.blob ? got.blob : null;
        },
      });
    },
    get fetches() { return fetches; },
  };
}

// WHICH PIECES MAKE UP A LESSON, REMEMBERED (so the panel can say truthfully
// whether a lesson is on the device the next time it is opened, without
// re-rendering the lesson to find out). owner -> { voice, keys }, the 40 most
// recent readings.
export const READING_KEYS_KEY = 'poe-voice-reading-keys';
const READINGS_KEPT = 40;
export function rememberReadingKeys(owner, voice, keys, storage) {
  if (!owner || !Array.isArray(keys) || !keys.length) return;
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!s) return;
    const all = JSON.parse(s.getItem(READING_KEYS_KEY) || '[]').filter((r) => r && r.owner !== owner);
    all.unshift({ owner, voice, keys });
    s.setItem(READING_KEYS_KEY, JSON.stringify(all.slice(0, READINGS_KEPT)));
  } catch { /* best-effort */ }
}
export function recallReadingKeys(owner, voice, storage) {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    const all = JSON.parse((s && s.getItem(READING_KEYS_KEY)) || '[]');
    const hit = all.find((r) => r && r.owner === owner && r.voice === voice);
    return hit && Array.isArray(hit.keys) ? hit.keys : null;
  } catch { return null; }
}

/** "34 of 120 pieces · 5.2 MB" */
export function formatSaved({ saved, total, bytes }) {
  const mb = bytes / MB;
  const size = mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
  return `${saved} of ${total} piece${total === 1 ? '' : 's'} · ${size}`;
}
