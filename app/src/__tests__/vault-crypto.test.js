// The vault's lock, proven (DR-0762 / DR-0076). What is pinned:
//   1. a round trip under the right key; a WRONG key, a tampered byte and a
//      malformed envelope each return null (never garbage, never a throw)
//   2. the verifier tells a wrong passphrase from a corrupt row
//   3. the KDF refuses a weak iteration count (mirrors 0251's floor)
//   4. the generator honors length and classes with real randomness
//   5. the strength read and the audit are plain and deterministic
import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  KDF_ITERATIONS, KDF_ITERATIONS_FLOOR, VERIFIER_PLAINTEXT, newSalt, deriveVaultKey, encryptJson, decryptJson,
  makeHeader, checkVerifier, normalizeItem, hostOf, newId, generatePassword, passwordStrength, auditItems, CHARSETS,
} from '../lib/vault-crypto.js';

const opts = { cryptoObj: webcrypto };
const FAST = KDF_ITERATIONS_FLOOR; // the floor the table enforces; enough rounds for a test

describe('derive + encrypt + decrypt', () => {
  it('round-trips a record under the right key', async () => {
    const salt = newSalt(opts);
    const key = await deriveVaultKey('correct horse battery staple', salt, FAST, opts);
    expect(key).toBeTruthy();
    const item = { name: 'Bank', url: 'https://bank.example', username: 'd', password: 'p@ss', notes: '', totp: '', favorite: false };
    const sealed = await encryptJson(key, item, opts);
    expect(sealed.iv).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(sealed.ct).not.toContain('p@ss');
    expect(await decryptJson(key, sealed, opts)).toEqual(item);
  });
  it('a different passphrase, a tampered byte, or a malformed envelope -> null', async () => {
    const salt = newSalt(opts);
    const key = await deriveVaultKey('one', salt, FAST, opts);
    const wrong = await deriveVaultKey('two', salt, FAST, opts);
    const sealed = await encryptJson(key, { a: 1 }, opts);
    expect(await decryptJson(wrong, sealed, opts)).toBeNull();
    const bytes = Buffer.from(sealed.ct, 'base64'); bytes[0] ^= 0xff;
    expect(await decryptJson(key, { iv: sealed.iv, ct: bytes.toString('base64') }, opts)).toBeNull();
    expect(await decryptJson(key, { iv: 'x', ct: 'y' }, opts)).toBeNull();
    expect(await decryptJson(key, null, opts)).toBeNull();
  });
  it('a fresh IV every time: the same record never encrypts to the same bytes', async () => {
    const key = await deriveVaultKey('same', newSalt(opts), FAST, opts);
    const a = await encryptJson(key, { x: 1 }, opts);
    const b = await encryptJson(key, { x: 1 }, opts);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ct).not.toBe(b.ct);
  });
  it('the same passphrase and salt derive the same key on another device (NFKC-normalized)', async () => {
    const salt = newSalt(opts);
    const k1 = await deriveVaultKey('café', salt, FAST, opts);
    const k2 = await deriveVaultKey('café', salt, FAST, opts);
    const sealed = await encryptJson(k1, 'hello', opts);
    expect(await decryptJson(k2, sealed, opts)).toBe('hello');
  });
  it('refuses a weak KDF, an empty passphrase, and a missing salt', async () => {
    expect(await deriveVaultKey('x', newSalt(opts), 1000, opts)).toBeNull();
    expect(await deriveVaultKey('', newSalt(opts), FAST, opts)).toBeNull();
    expect(await deriveVaultKey('x', '', FAST, opts)).toBeNull();
    expect(KDF_ITERATIONS).toBeGreaterThanOrEqual(600000);
  });
});

describe('the header and its verifier', () => {
  it('a wrong passphrase fails the verifier; the right one passes; a corrupt verifier fails', async () => {
    const salt = newSalt(opts);
    const key = await deriveVaultKey('right', salt, FAST, opts);
    const header = await makeHeader(key, salt, FAST, opts);
    expect(header.kdf).toBe('PBKDF2-SHA256');
    expect(header.salt).toBe(salt);
    expect(header.verifier_ct).not.toContain(VERIFIER_PLAINTEXT);
    expect(await checkVerifier(key, header, opts)).toBe(true);
    const wrong = await deriveVaultKey('wrong', salt, FAST, opts);
    expect(await checkVerifier(wrong, header, opts)).toBe(false);
    expect(await checkVerifier(key, { ...header, verifier_ct: 'AAAA' }, opts)).toBe(false);
    expect(await checkVerifier(key, null, opts)).toBe(false);
  });
});

describe('items', () => {
  it('normalizeItem trims, caps, and never invents a field', () => {
    const it = normalizeItem({ name: '  Bank  ', url: ' https://www.bank.example/login ', username: 'd ', password: ' keep spaces ', notes: 'n', favorite: 1 });
    expect(it).toEqual({ name: 'Bank', url: 'https://www.bank.example/login', username: 'd', password: ' keep spaces ', notes: 'n', totp: '', favorite: true });
    expect(normalizeItem({}).password).toBe('');
  });
  it('hostOf reads the site out of a URL or a bare host', () => {
    expect(hostOf('https://www.Bank.example/login?x=1')).toBe('bank.example');
    expect(hostOf('bank.example')).toBe('bank.example');
    expect(hostOf('www.bank.example/path')).toBe('bank.example');
    expect(hostOf('')).toBe('');
    expect(hostOf(null)).toBe('');
  });
  it('newId is a v4-shaped uuid', () => {
    expect(newId(opts)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('generator', () => {
  it('honors length and includes every chosen class', () => {
    for (let i = 0; i < 20; i += 1) {
      const p = generatePassword({ length: 16 }, opts);
      expect(p).toHaveLength(16);
      expect(p).toMatch(/[a-z]/); expect(p).toMatch(/[A-Z]/); expect(p).toMatch(/[0-9]/); expect(p).toMatch(/[^a-zA-Z0-9]/);
    }
  });
  it('digits-only when asked; no ambiguous characters unless asked', () => {
    const p = generatePassword({ length: 12, lower: false, upper: false, symbols: true, digits: true }, opts);
    expect(p).toHaveLength(12);
    expect(p).toMatch(/^[0-9!@#$%^&*()\-_=+[\]{};:,.?]+$/);
    const q = generatePassword({ length: 200, symbols: false }, opts);
    expect(q).toHaveLength(128); // capped
    expect(q).not.toMatch(/[lIO01]/);
    expect(CHARSETS.lower).not.toContain('l');
  });
  it('two calls differ (real randomness)', () => {
    expect(generatePassword({}, opts)).not.toBe(generatePassword({}, opts));
  });
});

describe('strength and audit', () => {
  it('reads strength plainly', () => {
    expect(passwordStrength('')).toEqual({ bits: 0, label: 'empty', ok: false });
    expect(passwordStrength('password').ok).toBe(false);
    expect(passwordStrength('aaaaaaaaaaaaaaaaaaaa').ok).toBe(false); // repetition does not count
    expect(passwordStrength(generatePassword({ length: 20 }, opts)).ok).toBe(true);
  });
  it('audit names reused, weak, old and empty by id', () => {
    const now = Date.parse('2026-10-06T00:00:00Z');
    const items = [
      { id: 'a', password: 'Tr0ub4dor&3Tr0ub4dor&3', updatedAt: '2026-09-01T00:00:00Z' },
      { id: 'b', password: 'Tr0ub4dor&3Tr0ub4dor&3', updatedAt: '2024-01-01T00:00:00Z' },
      { id: 'c', password: 'abc', updatedAt: '2026-09-01T00:00:00Z' },
      { id: 'd', password: '', updatedAt: '2026-09-01T00:00:00Z' },
    ];
    const a = auditItems(items, now);
    expect(a.total).toBe(4);
    expect(a.reused.sort()).toEqual(['a', 'b']);
    expect(a.weak).toEqual(['c']);
    expect(a.old).toEqual(['b']);
    expect(a.empty).toEqual(['d']);
  });
});
