// =============================================================================
// vault-crypto — the password vault's lock, in the browser only (DR-0762)
// =============================================================================
// Darrell 2026-10-06: "I also want to be able to pull my passwords into the
// PoeTech App as a sort of password management manager for the users..."
//
// ZERO KNOWLEDGE. The passphrase never leaves the device; the KEY derived from
// it never leaves memory; the server (lib/vault-store.js) holds only a KDF
// header, a verifier and ciphertext. Everything here is the browser's own
// WebCrypto — no library, nothing to audit but this file (dependency
// skepticism; the dm-encryption.js precedent).
//
//   passphrase + salt --PBKDF2-SHA256 (600,000 rounds)--> AES-256-GCM key
//   item (JSON)       --AES-GCM, fresh 96-bit IV each time--> { iv, ct }
//   verifier = encrypt("poetech-vault-v1") under the key, stored with the
//              header, so a wrong passphrase is told apart from a corrupt row
//              without the server ever seeing the key.
//
// 600,000 rounds is OWASP's 2023 recommendation for PBKDF2-HMAC-SHA256. Argon2
// would be stronger per round but needs a library; PBKDF2 is native and the
// floor is enforced by the table (0251: iterations >= 100000). re-review:
// 2027-01-06, when WebCrypto's Argon2 status is re-read.
//
// Every function takes an injectable `cryptoObj` so the tests run on Node's
// webcrypto; every decrypt returns null on a wrong key or tampered bytes (GCM
// authenticates) so a surface shows "locked" and never garbage.
// =============================================================================
import { bytesToB64, b64ToBytes } from './dm-encryption.js';

export const VAULT_VERSION = 1;
export const KDF = 'PBKDF2-SHA256';
export const KDF_ITERATIONS = 600000;
export const KDF_ITERATIONS_FLOOR = 100000; // mirrors 0251's check
export const VERIFIER_PLAINTEXT = 'poetech-vault-v1';
export const SALT_BYTES = 16;
export const IV_BYTES = 12;

const defaultCrypto = () => globalThis.crypto;

export function newSalt({ cryptoObj = defaultCrypto() } = {}) {
  return bytesToB64(cryptoObj.getRandomValues(new Uint8Array(SALT_BYTES)));
}

/** passphrase + salt(b64) -> non-extractable AES-GCM key. null when the environment cannot. */
export async function deriveVaultKey(passphrase, saltB64, iterations = KDF_ITERATIONS, { cryptoObj = defaultCrypto() } = {}) {
  if (typeof passphrase !== 'string' || !passphrase || !saltB64 || !cryptoObj?.subtle) return null;
  if (!Number.isInteger(iterations) || iterations < KDF_ITERATIONS_FLOOR) return null;
  try {
    const material = await cryptoObj.subtle.importKey('raw', new TextEncoder().encode(passphrase.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return await cryptoObj.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  } catch {
    return null;
  }
}

/** Any JSON-able value -> { iv, ct } (both base64). null on failure. */
export async function encryptJson(key, value, { cryptoObj = defaultCrypto() } = {}) {
  if (!key || !cryptoObj?.subtle) return null;
  try {
    const iv = cryptoObj.getRandomValues(new Uint8Array(IV_BYTES));
    const ct = await cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(value)));
    return { iv: bytesToB64(iv), ct: bytesToB64(ct) };
  } catch {
    return null;
  }
}

/** { iv, ct } -> the value, or null (wrong key, tampered, malformed). */
export async function decryptJson(key, sealed, { cryptoObj = defaultCrypto() } = {}) {
  if (!key || !sealed || typeof sealed.iv !== 'string' || typeof sealed.ct !== 'string' || !cryptoObj?.subtle) return null;
  try {
    const plain = await cryptoObj.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(sealed.iv) }, key, b64ToBytes(sealed.ct));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}

/** The header the server keeps: kdf params + a verifier. Never the key. */
export async function makeHeader(key, saltB64, iterations = KDF_ITERATIONS, opts = {}) {
  const v = await encryptJson(key, VERIFIER_PLAINTEXT, opts);
  if (!v) return null;
  return { kdf: KDF, iterations, salt: saltB64, verifier_iv: v.iv, verifier_ct: v.ct, version: VAULT_VERSION };
}

/** true only when the key decrypts the header's verifier to the known sentence. */
export async function checkVerifier(key, header, opts = {}) {
  if (!header) return false;
  const v = await decryptJson(key, { iv: header.verifier_iv, ct: header.verifier_ct }, opts);
  return v === VERIFIER_PLAINTEXT;
}

// --- Items -------------------------------------------------------------------
// The clear shape of one record. Only `name` is required; everything else is
// optional so an import never invents a field.
export const EMPTY_ITEM = Object.freeze({ name: '', url: '', username: '', password: '', notes: '', totp: '', favorite: false });

export function normalizeItem(raw = {}) {
  const t = (v) => (typeof v === 'string' ? v.trim() : '');
  return {
    name: t(raw.name).slice(0, 200),
    url: t(raw.url).slice(0, 2048),
    username: t(raw.username).slice(0, 320),
    password: typeof raw.password === 'string' ? raw.password : '',
    notes: t(raw.notes).slice(0, 10000),
    totp: t(raw.totp).slice(0, 512),
    favorite: !!raw.favorite,
  };
}

/** The host of a URL for display and dedupe ("https://www.x.com/a" -> "x.com"). */
export function hostOf(url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/^www\./, '').split('/')[0];
  }
}

export function newId({ cryptoObj = defaultCrypto() } = {}) {
  if (typeof cryptoObj?.randomUUID === 'function') return cryptoObj.randomUUID();
  const b = cryptoObj.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// --- Generator ---------------------------------------------------------------
export const CHARSETS = Object.freeze({
  lower: 'abcdefghijkmnopqrstuvwxyz',       // no l
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',        // no I, O
  digits: '23456789',                       // no 0, 1
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
});

/** Rejection-sampled, every chosen class represented at least once. */
export function generatePassword({ length = 20, lower = true, upper = true, digits = true, symbols = true, ambiguous = false } = {}, { cryptoObj = defaultCrypto() } = {}) {
  const sets = [];
  if (lower) sets.push(ambiguous ? CHARSETS.lower + 'l' : CHARSETS.lower);
  if (upper) sets.push(ambiguous ? CHARSETS.upper + 'IO' : CHARSETS.upper);
  if (digits) sets.push(ambiguous ? CHARSETS.digits + '01' : CHARSETS.digits);
  if (symbols) sets.push(CHARSETS.symbols);
  if (!sets.length) sets.push(CHARSETS.lower);
  const n = Math.max(sets.length, Math.min(128, Math.floor(Number(length) || 20)));
  const all = sets.join('');
  const pick = (alphabet) => {
    const limit = 256 - (256 % alphabet.length);
    const buf = new Uint8Array(1);
    for (;;) {
      cryptoObj.getRandomValues(buf);
      if (buf[0] < limit) return alphabet[buf[0] % alphabet.length];
    }
  };
  const out = sets.map(pick);
  while (out.length < n) out.push(pick(all));
  // Fisher–Yates with crypto randomness, so the guaranteed classes are not always first.
  for (let i = out.length - 1; i > 0; i -= 1) {
    const r = new Uint32Array(1);
    cryptoObj.getRandomValues(r);
    const j = r[0] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join('');
}

/** A plain, honest strength read: estimated bits from the character classes actually used. */
export function passwordStrength(pw) {
  const s = typeof pw === 'string' ? pw : '';
  if (!s) return { bits: 0, label: 'empty', ok: false };
  let pool = 0;
  if (/[a-z]/.test(s)) pool += 26;
  if (/[A-Z]/.test(s)) pool += 26;
  if (/[0-9]/.test(s)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(s)) pool += 33;
  const distinct = new Set(s).size;
  const bits = Math.round(s.length * Math.log2(Math.max(pool, 2)) * Math.min(1, distinct / Math.min(s.length, 8)));
  const label = bits < 40 ? 'weak' : bits < 60 ? 'fair' : bits < 80 ? 'strong' : 'very strong';
  return { bits, label, ok: bits >= 60 };
}

// --- Audit (client-side only; nothing leaves the device) ----------------------
export function auditItems(items, now = Date.now()) {
  const list = Array.isArray(items) ? items : [];
  const byPassword = new Map();
  for (const it of list) {
    const p = it && it.password;
    if (!p) continue;
    if (!byPassword.has(p)) byPassword.set(p, []);
    byPassword.get(p).push(it.id);
  }
  const reused = new Set();
  for (const ids of byPassword.values()) if (ids.length > 1) ids.forEach((id) => reused.add(id));
  const weak = list.filter((it) => it.password && !passwordStrength(it.password).ok).map((it) => it.id);
  const OLD_MS = 365 * 24 * 3600 * 1000;
  const old = list.filter((it) => it.updatedAt && now - Date.parse(it.updatedAt) > OLD_MS).map((it) => it.id);
  const empty = list.filter((it) => !it.password).map((it) => it.id);
  return { total: list.length, reused: [...reused], weak, old, empty };
}
