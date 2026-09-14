// =============================================================================
// device-snapshot-rescue — get everything off a device before it is gone
// =============================================================================
// 2026-09-14. Christina's rental doors information and tenant information went
// missing on her MacBook. Asked of the database the app actually reads, with
// statistics that have never been reset:
//
//   rentals            13 rows   13 ever inserted    0 ever deleted
//   rental_tenancies    0 rows    0 ever inserted    0 ever deleted
//   tenancy_household   0 rows    0 ever inserted    0 ever deleted
//   property_rooms      0 rows    0 ever inserted    0 ever deleted
//
// Nothing was deleted. Nothing was ever written either. And the family-OS
// rentals path says why in its own header (lib/rentals-sync.js): "Still
// device-local (no columns): rooms, equipment, maintenanceLog, conversationLog,
// lat/lon, market/lease/tenant sub-objects." The tenant fields have no cloud
// column to go to. They live in ONE place -- this device -- and with a broken
// login the cloud snapshot could not take them either.
//
// So on a device that still holds them, that copy is the only copy, and it is
// perishable: Safari deletes all script-writable storage (IndexedDB included)
// for a site with no user interaction for 7 days, and any "clear site data",
// profile reset, or reinstall does the same. This script gets it out.
//
// WHAT IT IS: paste into the browser console with the app open. It reads and
// downloads; it never writes, never deletes, and never opens a database with a
// version number (which could trigger an upgrade). If it finds nothing it says
// so plainly rather than saving an empty file that looks like a rescue.
//
// HOW TO RUN IT (Mac):
//   Safari  - Safari > Settings > Advanced > tick "Show features for web
//             developers", then Develop > Show JavaScript Console, paste, Enter.
//   Chrome  - View > Developer > JavaScript Console, paste, Enter.
//             (Chrome may require typing  allow pasting  once, first.)
// It saves one file: poetech-device-rescue-<date>.json
// =============================================================================
(async () => {
  const DB_NAME = 'poetech-storage';   // shims/storage.js
  const STORE = 'kv';
  const SNAPSHOT_KEY = 'poe-financial-v28';

  const out = {
    rescued_at: new Date().toISOString(),
    origin: location.origin,
    user_agent: navigator.userAgent,
    indexeddb: { available: typeof indexedDB !== 'undefined', databases: null, keys: [], values: {} },
    localstorage: { available: false, keys: [], values: {} },
    found: [],
    missing: [],
  };

  // ---- IndexedDB, read-only -------------------------------------------------
  // No version argument: opens whatever version exists and cannot upgrade it.
  const openExisting = () => new Promise((resolve, reject) => {
    let upgraded = false;
    const req = indexedDB.open(DB_NAME);
    req.onupgradeneeded = () => { upgraded = true; };   // means it did not exist
    req.onsuccess = () => resolve({ db: req.result, upgraded });
    req.onerror = () => reject(req.error || new Error('open failed'));
    req.onblocked = () => reject(new Error('blocked -- close the app\'s other tabs and re-run'));
  });

  if (typeof indexedDB !== 'undefined') {
    try {
      if (indexedDB.databases) out.indexeddb.databases = await indexedDB.databases();
    } catch (_) { /* not in every browser; not needed */ }
    try {
      const { db, upgraded } = await openExisting();
      if (upgraded) {
        out.indexeddb.note = 'the database did not exist on this device';
      } else if (!db.objectStoreNames.contains(STORE)) {
        out.indexeddb.note = `database present but no "${STORE}" store`;
      } else {
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        const keys = await new Promise((res, rej) => {
          const r = store.getAllKeys(); r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error);
        });
        out.indexeddb.keys = keys.map(String);
        for (const k of keys) {
          // eslint-disable-next-line no-await-in-loop
          const v = await new Promise((res, rej) => {
            const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(k);
            r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
          });
          out.indexeddb.values[String(k)] = typeof v === 'string' ? v : JSON.stringify(v ?? null);
        }
      }
      db.close();
    } catch (e) {
      out.indexeddb.error = String((e && e.message) || e);
    }
  }

  // ---- localStorage, read-only (older builds wrote here) --------------------
  try {
    out.localstorage.available = true;
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      out.localstorage.keys.push(k);
      out.localstorage.values[k] = localStorage.getItem(k);
    }
  } catch (e) {
    out.localstorage.error = String((e && e.message) || e);
  }

  // ---- Say honestly what was found -----------------------------------------
  // The snapshot is what carries the rentals and their tenant sub-objects.
  const snap = out.indexeddb.values[SNAPSHOT_KEY] || out.localstorage.values[SNAPSHOT_KEY] || null;
  if (snap) out.found.push(SNAPSHOT_KEY); else out.missing.push(SNAPSHOT_KEY);

  let summary = 'no app snapshot on this device';
  if (snap) {
    try {
      const parsed = JSON.parse(snap);
      const d = parsed.data || parsed;
      const n = (x) => (Array.isArray(x) ? x.length : 0);
      // Counted, never guessed -- and the tenant-bearing collection is named
      // first because it is the one that was reported missing.
      out.counts = {
        rentals: n(d.rentals),
        rentals_with_tenant_detail: (d.rentals || []).filter((r) => r && (r.tenantName || r.tenant || r.lease)).length,
        transactions: n(d.transactions),
        accounts: n(d.accounts),
        entities: n(d.entities),
        debts: n(d.debts),
        lifePhotos: n(d.lifePhotos),
        saved_at: parsed.savedAt || parsed.updatedAt || null,
      };
      summary = `snapshot found: ${out.counts.rentals} rentals `
        + `(${out.counts.rentals_with_tenant_detail} carrying tenant detail), `
        + `${out.counts.transactions} transactions, saved ${out.counts.saved_at || 'at an unrecorded time'}`;
    } catch (e) {
      out.counts = { parse_error: String((e && e.message) || e) };
      summary = 'a snapshot is present but could not be parsed -- the file still holds it verbatim';
    }
  }
  out.summary = summary;

  // ---- Save it --------------------------------------------------------------
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `poetech-device-rescue-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log('%c' + summary, 'font-size:15px;font-weight:700');
  console.log('IndexedDB keys:', out.indexeddb.keys);
  console.log('Saved file:', a.download, '(check Downloads)');
  return out.summary;
})();
