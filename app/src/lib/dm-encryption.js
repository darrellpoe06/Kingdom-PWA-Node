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
// HONEST LIMIT OF v1 (DR-0076 — stated, not papered over): the private key
// lives on the device that generated it, and dm_public_keys (0118) held ONE
// public key per account. Every device that opened Messages published its own
// key over the last one, so a message was sealed to whichever device had
// published most recently, and which messages a given phone could open flipped
// each time another device opened Messages (Darrell 2026-10-01: "sometimes I
// can see it and others not on the same device").
//
// v2 — SEALED FOR EVERY DEVICE (DR-0737). Each device publishes its OWN public
// key (dm_device_keys, 0249: one row per user and device). A message is sealed
// once under a fresh random content key, and that content key is wrapped for
// EVERY device of both people: each of the recipient's devices and each of the
// sender's own, so the sender reads their own words on their other phone too.
// Wrapping uses the same ECDH pair key as v1, derived between the SENDING
// device and each receiving device. A device that joins later cannot open
// what was sealed before it existed; that is said in words, never faked.
// Wire format: `e2e:v2:<base64 json>` with { f: "<user>:<device>" (who sealed
// it), iv, ct, w: { "<user>:<device>": "<wrap-iv>:<wrapped-key>" } }.
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

export const E2E_MARKER_V2 = 'e2e:v2:';
export const LOCKED_BEFORE_THIS_DEVICE =
  'Sealed for your other devices before this one joined Messages — new messages open here.';

const STORAGE_PREFIX = 'poe-dm-keypair:v1:';
/** The same per-browser device id device-trust.js keeps; one id per device, every feature. */
export const DEVICE_ID_KEY = 'poe-device-id';

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

// Is this stored body an encrypted envelope (v1 or v2) vs legacy plaintext?
export function isEncryptedBody(body) {
  return typeof body === 'string' && (body.startsWith(E2E_MARKER) || body.startsWith(E2E_MARKER_V2));
}
/** v2 only: sealed for named devices. */
export function isSealedV2(body) {
  return typeof body === 'string' && body.startsWith(E2E_MARKER_V2);
}
/** The one id a device key is filed under: user and device together. */
export function deviceKeyId(userId, deviceId) {
  return `${userId}:${deviceId}`;
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

// -----------------------------------------------------------------------------
// This device's id: read from the same slot device-trust.js keeps, created once.
// -----------------------------------------------------------------------------
export function ensureDmDeviceId({ cryptoObj = defaultCrypto(), storage = defaultStorage() } = {}) {
  let held = null;
  try { held = storage ? storage.getItem(DEVICE_ID_KEY) : null; } catch { /* unreadable storage */ }
  if (held && String(held).length >= 8) return String(held);
  let fresh = null;
  try {
    if (cryptoObj && typeof cryptoObj.randomUUID === 'function') fresh = cryptoObj.randomUUID();
    else if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const b = new Uint8Array(16); cryptoObj.getRandomValues(b);
      fresh = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* no crypto: the fallback below */ }
  const id = fresh || `dev-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  try { if (storage) storage.setItem(DEVICE_ID_KEY, id); } catch { /* private mode: the id lives for this page */ }
  return id;
}

const utf8 = (s) => new TextEncoder().encode(s);
const b64Json = (o) => bytesToB64(utf8(JSON.stringify(o)));
const jsonB64 = (s) => JSON.parse(new TextDecoder().decode(b64ToBytes(s)));

/** Parse a v2 envelope: { from:{userId,deviceId}, iv, ct, wraps:{id:"wiv:wk"} } or null. */
export function sealedEnvelope(body) {
  if (!isSealedV2(body)) return null;
  try {
    const o = jsonB64(body.slice(E2E_MARKER_V2.length));
    if (!o || typeof o.f !== 'string' || typeof o.iv !== 'string' || typeof o.ct !== 'string' || !o.w || typeof o.w !== 'object') return null;
    const at = o.f.indexOf(':');
    if (at <= 0) return null;
    return { from: { userId: o.f.slice(0, at), deviceId: o.f.slice(at + 1) }, iv: o.iv, ct: o.ct, wraps: o.w };
  } catch {
    return null;
  }
}

/** The device key ids a v2 message can be opened on. */
export function sealedFor(body) {
  const env = sealedEnvelope(body);
  return env ? Object.keys(env.wraps) : [];
}

/** Can THIS device open the message? (The wrap exists; the key may still be wrong.) */
export function sealedForDevice(body, userId, deviceId) {
  const env = sealedEnvelope(body);
  return !!(env && env.wraps[deviceKeyId(userId, deviceId)]);
}

// -----------------------------------------------------------------------------
// Seal a body for every device of both people. One random AES-256-GCM content
// key encrypts the text once; that key is wrapped (AES-GCM under the ECDH pair
// key between the sending device and each receiving device) once per device.
// A device whose key cannot be used is skipped; no usable device at all is
// null, so the caller falls back honestly instead of sending nothing.
// -----------------------------------------------------------------------------
export async function sealForDevices(text, { myPrivateJwk, from, devices } = {}, { cryptoObj = defaultCrypto() } = {}) {
  if (typeof text !== 'string' || !myPrivateJwk || !from || !from.userId || !from.deviceId || !cryptoObj?.subtle) return null;
  const list = Array.isArray(devices) ? devices.filter((d) => d && d.userId && d.deviceId && d.publicJwk) : [];
  if (!list.length) return null;
  try {
    const content = await cryptoObj.subtle.generateKey(AES_PARAMS, true, ['encrypt', 'decrypt']);
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const ct = await cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv }, content, utf8(text));
    const raw = new Uint8Array(await cryptoObj.subtle.exportKey('raw', content));
    const w = {};
    for (const d of list) {
      const pair = await deriveDmKey(myPrivateJwk, d.publicJwk, { cryptoObj });
      if (!pair) continue;
      try {
        const wiv = cryptoObj.getRandomValues(new Uint8Array(12));
        const wk = await cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv: wiv }, pair, raw);
        w[deviceKeyId(d.userId, d.deviceId)] = `${bytesToB64(wiv)}:${bytesToB64(wk)}`;
      } catch { /* this device is skipped; the others still get it */ }
    }
    if (!Object.keys(w).length) return null;
    return `${E2E_MARKER_V2}${b64Json({ f: deviceKeyId(from.userId, from.deviceId), iv: bytesToB64(iv), ct: bytesToB64(ct), w })}`;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Open a v2 body on THIS device: my private key + the SENDING device's public
// key derive the pair key that unwraps the content key. Null on any failure
// (no wrap for me, wrong key, tampering), never garbage.
// -----------------------------------------------------------------------------
export async function openSealed(body, { myPrivateJwk, me, senderPublicJwk } = {}, { cryptoObj = defaultCrypto() } = {}) {
  const env = sealedEnvelope(body);
  if (!env || !myPrivateJwk || !me || !senderPublicJwk || !cryptoObj?.subtle) return null;
  const wrap = env.wraps[deviceKeyId(me.userId, me.deviceId)];
  if (!wrap) return null;
  try {
    const [wivB64, wkB64] = String(wrap).split(':');
    if (!wivB64 || !wkB64) return null;
    const pair = await deriveDmKey(myPrivateJwk, senderPublicJwk, { cryptoObj });
    if (!pair) return null;
    const raw = await cryptoObj.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(wivB64) }, pair, b64ToBytes(wkB64));
    const content = await cryptoObj.subtle.importKey('raw', raw, AES_PARAMS, false, ['decrypt']);
    const plain = await cryptoObj.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(env.iv) }, content, b64ToBytes(env.ct));
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
