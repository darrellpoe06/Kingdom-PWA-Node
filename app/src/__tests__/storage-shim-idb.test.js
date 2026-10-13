// =============================================================================
// storage shim — IndexedDB-backed local cache (2026-08-21)
// =============================================================================
// Measured on Darrell's phone: the localStorage-backed shim hit the browser's
// ~5MB per-site cap on a device with gigabytes free, every save tier threw,
// and the banner falsely said "this device is out of local space." The cure:
// IndexedDB primary (quota scales with the device), localStorage fallback
// (older-build migration read + environments without IDB). These tests pin the
// contract with a minimal in-memory fake IDB implementing exactly the calls
// the shim makes — async callback semantics included, so ordering bugs show.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// --- minimal fake IndexedDB (only what the shim uses) ------------------------
function makeFakeIndexedDB({ failOpen = false } = {}) {
  const stores = new Map(); // storeName -> Map(key -> value)
  const db = {
    createObjectStore(name) { stores.set(name, new Map()); },
    transaction(name, _mode) {
      const store = stores.get(name);
      const tx = { oncomplete: null, onerror: null, onabort: null, error: null };
      tx.objectStore = () => ({
        get(key) {
          const req = { onsuccess: null, onerror: null, result: undefined };
          queueMicrotask(() => { req.result = store.get(key); if (req.onsuccess) req.onsuccess(); });
          return req;
        },
        put(value, key) { store.set(key, value); },
      });
      queueMicrotask(() => queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); }));
      return tx;
    },
  };
  return {
    _stores: stores,
    open() {
      const req = { onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null, result: db, error: null };
      queueMicrotask(() => {
        if (failOpen) { req.error = new Error('open refused'); if (req.onerror) req.onerror(); return; }
        if (req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    },
  };
}

// The shim caches its open-db promise at module scope, so each scenario needs
// a FRESH module instance bound to the fake we just installed.
async function freshStorage() {
  vi.resetModules();
  const mod = await import('../shims/storage.js');
  return mod.storage;
}

const KEY = 'poe-financial-v28';

describe('storage shim — IndexedDB primary', () => {
  let fake;
  beforeEach(() => {
    fake = makeFakeIndexedDB();
    vi.stubGlobal('indexedDB', fake);
    localStorage.clear();
  });
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

  it('set writes to IndexedDB and get reads it back (round trip)', async () => {
    const storage = await freshStorage();
    await storage.set(KEY, 'hello-idb');
    expect(await storage.get(KEY)).toEqual({ value: 'hello-idb' });
    expect(fake._stores.get('kv').get(KEY)).toBe('hello-idb');
  });

  it('a successful IDB save REMOVES the localStorage twin — a stale copy can never hydrate over newer data', async () => {
    const storage = await freshStorage();
    localStorage.setItem(KEY, 'stale-week-old-snapshot');
    await storage.set(KEY, 'fresh');
    expect(localStorage.getItem(KEY)).toBe(null);
    expect(await storage.get(KEY)).toEqual({ value: 'fresh' });
  });

  it('get falls back to localStorage when IDB has no row (older-build migration read)', async () => {
    const storage = await freshStorage();
    localStorage.setItem(KEY, 'written-by-the-old-build');
    expect(await storage.get(KEY)).toEqual({ value: 'written-by-the-old-build' });
  });

  it('get returns null when neither store has the key', async () => {
    const storage = await freshStorage();
    expect(await storage.get('never-written')).toBe(null);
  });
});

describe('storage shim — localStorage fallback when IndexedDB is unavailable', () => {
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

  it('set/get still work through localStorage when IDB open fails', async () => {
    vi.stubGlobal('indexedDB', makeFakeIndexedDB({ failOpen: true }));
    const storage = await freshStorage();
    await storage.set(KEY, 'ls-fallback');
    expect(localStorage.getItem(KEY)).toBe('ls-fallback');
    expect(await storage.get(KEY)).toEqual({ value: 'ls-fallback' });
  });

  it('PROVEN-TO-CATCH: with IDB down, a quota throw still propagates so the snapshot-slim tiers can react', async () => {
    vi.stubGlobal('indexedDB', makeFakeIndexedDB({ failOpen: true }));
    const storage = await freshStorage();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e;
    });
    await expect(storage.set(KEY, 'too-big')).rejects.toThrow();
    setItem.mockRestore();
  });
});
