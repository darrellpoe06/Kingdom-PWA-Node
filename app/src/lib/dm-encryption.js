// =============================================================================
// dm-encryption — end-to-end encryption for 1:1 direct messages (pure).
// =============================================================================
// Declared by Darrell 2026-07-25 ("encryption"): a member messaging another
// member — his brother messaging him — rides a body the SERVER CANNOT READ.
// RLS (0096) already guarantees only the two participants read the row; this
// layer guarantees even the database and its steward hold only ciphertext
// (DATA-AS-EMPOWERMENT: the family's words belong to the family).
//
// The model (device-held keys, no key server trust):
//   * Each user generates an ECDH P-256 keypair IN THE BROWSER. The private key
//     never leaves the device (localStorage, scoped per auth user id). The
//     public key is published to dm_public_keys (migration 0118) — public keys
//     are public; publishing one reveals nothing.
//   * A 1:1 conversation key is derived per pair: ECDH(my private, their
//     public) -> AES-256-GCM. The math is symmetric — A's private + B's public
//     derives the SAME key as B's private + A's public — so both ends encrypt
//     and decrypt with no shared secret ever transmitted.
//   * The wire/body format is `e2e:v1:<iv-b64>:<ciphertext-b64>`. Anything not
//     carrying the marker is legacy plaintext (still RLS-guarded).
//
// HONEST LIMIT (DR-0076 — stated, not papered over): the private key lives on
// the device that generated it. A message encrypted to a key is readable ONLY
// on devices holding that key — a new phone starts a new key, and history
// encrypted to the old key shows LOCKED_PLACEHOLDER there. Multi-device key
// transport is a follow-up, not silently faked.
//
// PURE: no React, no Supabase. `crypto` and `storage` are injectable so every
// path is unit-tested under Node (DR-0076); browser callers use the defaults.
// Word-first: "a talebearer revealeth secrets: but he that is of a faithful
// spirit concealeth the matter" (Proverbs 11:13, KJV) — the platform itself is
// made unable to bear the tale.
// =============================================================================

export const E2E_MARKER = 'e2e:v1:';
export const LOCKED_PLACEHOLDER =
  'Encrypted message — it can only be read on the device that holds the key.';

const STORAGE_PREFIX = 'poe-dm-keypair:v1:';

const ECDH_PARAMS = { name: 'ECDH', namedCurve: 'P-256' };
const AES_PARAMS = { name: 'AES-GCM', length: 256 };

// --- base64 helpers (browser atob/btoa when present, Buffer under Node) ------
export function bytesToB64(bytes) {
  const u = new Uint8Array(bytes);
  if (typeof btoa === 'function') {
    let s = '';
    for (let i = 0; i < u.length; i += 1) s += String.fromCharCode(u[i]);
    return btoa(s);
  }
  return Buffer.from(u).toString('base64');
}
export function b64ToBytes(s) {
  if (typeof atob === 'function') {
    const bin = atob(s);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) u[i] = bin.charCodeAt(i);
    return u;
  }
  return new Uint8Array(Buffer.from(s, 'base64'));
}

// Is this stored body an encrypted envelope (vs legacy plaintext)?
export function isEncryptedBody(body) {
  return typeof body === 'string' && body.startsWith(E2E_MARKER);
}

const defaultCrypto = () => globalThis.crypto;
const defaultStorage = () => {
  try { return globalThis.localStorage; } catch { return null; }
};

// -----------------------------------------------------------------------------
// Keypair lifecycle. One ECDH keypair per auth user per device, created on
// first use and persisted locally. Returns { publicJwk, privateJwk } or null
// when the environment can't hold a key (no storage / no WebCrypto) — callers
// fall back to plaintext honestly rather than pretending.
// -----------------------------------------------------------------------------
export async function ensureDmKeypair(userId, { cryptoObj = defaultCrypto(), storage = defaultStorage() } = {}) {
  if (!userId || !cryptoObj?.subtle || !storage) return null;
  const slot = `${STORAGE_PREFIX}${userId}`;
  try {
    const held = storage.getItem(slot);
    if (held) {
      const parsed = JSON.parse(held);
      if (parsed?.publicJwk && parsed?.privateJwk) return parsed;
    }
  } catch { /* corrupt slot regenerates below */ }
  try {
    const pair = await cryptoObj.subtle.generateKey(ECDH_PARAMS, true, ['deriveKey']);
    const publicJwk = await cryptoObj.subtle.exportKey('jwk', pair.publicKey);
    const privateJwk = await cryptoObj.subtle.exportKey('jwk', pair.privateKey);
    const record = { publicJwk, privateJwk };
    storage.setItem(slot, JSON.stringify(record));
    return record;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Pair key derivation: ECDH(my private, their public) -> AES-256-GCM. Symmetric
// by construction, so either participant derives the identical key.
// -----------------------------------------------------------------------------
export async function deriveDmKey(myPrivateJwk, theirPublicJwk, { cryptoObj = defaultCrypto() } = {}) {
  if (!myPrivateJwk || !theirPublicJwk || !cryptoObj?.subtle) return null;
  try {
    const priv = await cryptoObj.subtle.importKey('jwk', myPrivateJwk, ECDH_PARAMS, false, ['deriveKey']);
    const pub = await cryptoObj.subtle.importKey('jwk', theirPublicJwk, ECDH_PARAMS, false, []);
    return await cryptoObj.subtle.deriveKey(
      { name: 'ECDH', public: pub }, priv, AES_PARAMS, false, ['encrypt', 'decrypt'],
    );
  } catch {
    return null;
  }
}

// Encrypt a message body into the e2e envelope. Fresh random 96-bit IV per
// message (GCM's requirement — an IV never repeats under one key).
export async function encryptDmBody(text, pairKey, { cryptoObj = defaultCrypto() } = {}) {
  if (!pairKey || typeof text !== 'string') return null;
  try {
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const ct = await cryptoObj.subtle.encrypt(
      { name: 'AES-GCM', iv }, pairKey, new TextEncoder().encode(text),
    );
    return `${E2E_MARKER}${bytesToB64(iv)}:${bytesToB64(ct)}`;
  } catch {
    return null;
  }
}

// Decrypt an envelope back to text. Returns null on any failure — a wrong key,
// a tampered ciphertext (GCM authenticates), or a malformed envelope — so the
// surface shows LOCKED_PLACEHOLDER instead of garbage or a false body.
export async function decryptDmBody(body, pairKey, { cryptoObj = defaultCrypto() } = {}) {
  if (!pairKey || !isEncryptedBody(body)) return null;
  try {
    const [ivB64, ctB64] = body.slice(E2E_MARKER.length).split(':');
    if (!ivB64 || !ctB64) return null;
    const plain = await cryptoObj.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(ivB64) }, pairKey, b64ToBytes(ctB64),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
