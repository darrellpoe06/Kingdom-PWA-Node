// =============================================================================
// The rescue script must be read-only, and must look where the data really is
// =============================================================================
// 2026-09-14. This script is pasted into a browser console on a device that may
// hold the ONLY copy of Christina's tenant information -- the family-OS rentals
// path has no cloud columns for the tenant sub-objects (lib/rentals-sync.js
// says so in its own header), and her login was broken, so the cloud snapshot
// never took them either.
//
// That makes one property non-negotiable: it cannot write. A rescue tool that
// mutates the store it is rescuing is worse than no tool, and the person
// running it gets one attempt on perishable data. It also cannot open the
// database WITH a version number, because that triggers onupgradeneeded and
// can change the very store being read.
//
// And it has to look in the right place -- the key, store and database name
// read from shims/storage.js, not from memory.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const SCRIPT = readFileSync(join(ROOT, 'scripts/device-snapshot-rescue.js'), 'utf8');
const SHIM = readFileSync(join(ROOT, 'app/src/shims/storage.js'), 'utf8');
// Strip the comment block: the header quotes the incident and names the failure
// modes, so a bare text search would match prose rather than code.
const CODE = SCRIPT.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');

describe('it cannot damage the device it is rescuing', () => {
  it('never writes to IndexedDB', () => {
    for (const write of ['.put(', '.add(', '.delete(', '.clear(', 'deleteDatabase', 'deleteObjectStore']) {
      expect(CODE, `rescue script must not call ${write}`).not.toContain(write);
    }
  });

  it('never writes to or clears localStorage', () => {
    for (const write of ['localStorage.setItem', 'localStorage.removeItem', 'localStorage.clear']) {
      expect(CODE, `rescue script must not call ${write}`).not.toContain(write);
    }
  });

  it('opens every transaction readonly', () => {
    const transactions = CODE.match(/\.transaction\([^)]*\)/g) || [];
    expect(transactions.length).toBeGreaterThan(0);
    for (const t of transactions) expect(t).toContain("'readonly'");
    expect(CODE).not.toContain("'readwrite'");
  });

  it('opens the database with NO version, so it can never upgrade it', () => {
    const opens = CODE.match(/indexedDB\.open\([^)]*\)/g) || [];
    expect(opens.length).toBe(1);
    // A second argument is the version. There must not be one.
    expect(opens[0]).toBe('indexedDB.open(DB_NAME)');
  });
});

describe('it looks where the data actually is', () => {
  it('uses the database, store and key the app itself writes', () => {
    // Read out of the shim rather than restated here, so a rename in the shim
    // that is not mirrored here fails this test instead of silently rescuing
    // nothing.
    const dbName = SHIM.match(/const DB_NAME = '([^']+)'/)[1];
    const store = SHIM.match(/const STORE = '([^']+)'/)[1];
    expect(CODE).toContain(`const DB_NAME = '${dbName}'`);
    expect(CODE).toContain(`const STORE = '${store}'`);
    expect(CODE).toContain("const SNAPSHOT_KEY = 'poe-financial-v28'");
  });

  it('also reads localStorage, because an older build wrote the snapshot there', () => {
    // The shim's own get() falls back to localStorage for exactly this reason.
    expect(SHIM).toContain('localStorage');
    expect(CODE).toContain('localStorage.getItem');
  });

  it('takes EVERY key in the store, not only the one key it knows to want', () => {
    // The tenant fields ride inside the snapshot, but a device may hold other
    // stores' data too, and a second pass at a perishable device may not exist.
    expect(CODE).toContain('getAllKeys');
  });
});

describe('it reports honestly rather than producing a reassuring file', () => {
  it('distinguishes found from missing instead of saving an empty rescue', () => {
    expect(CODE).toContain('out.found.push');
    expect(CODE).toContain('out.missing.push');
    expect(CODE).toContain("'no app snapshot on this device'");
  });

  it('counts the tenant-bearing rentals from the real snapshot, never estimates', () => {
    expect(CODE).toContain('rentals_with_tenant_detail');
    expect(CODE).toContain('tenantName');
  });

  it('keeps the raw snapshot verbatim even when it cannot be parsed', () => {
    // A parse failure must not discard the bytes -- they are the rescue.
    expect(CODE).toContain('parse_error');
    expect(CODE).toContain('out.indexeddb.values[String(k)]');
  });
});

describe('PROVEN-TO-CATCH -- a careless rescue tool fails these', () => {
  const careless = `
    const req = indexedDB.open(DB_NAME, 1);
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(migrated, key);
    localStorage.removeItem('poe-financial-v28');
  `;

  it('a version argument, a readwrite transaction, a put and a removeItem are each rejected', () => {
    expect(/indexedDB\.open\(DB_NAME, 1\)/.test(careless)).toBe(true);
    expect(careless.includes("'readwrite'")).toBe(true);
    expect(careless.includes('.put(')).toBe(true);
    expect(careless.includes('localStorage.removeItem')).toBe(true);
    // and none of them appear in the real script
    expect(CODE).not.toMatch(/indexedDB\.open\([^)]*,/);
    expect(CODE).not.toContain("'readwrite'");
    expect(CODE).not.toContain('.put(');
    expect(CODE).not.toContain('localStorage.removeItem');
  });
});
