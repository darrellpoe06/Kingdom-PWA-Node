// =============================================================================
// webpush-crypto — Web Push message encryption (RFC 8291 / RFC 8188 aes128gcm)
// and VAPID request authorization (RFC 8292), on Web Crypto alone.
// =============================================================================
// WHY THIS EXISTS, AND WHY IT IS NOT A DEPENDENCY.
// Sending a push to a phone whose browser is CLOSED requires the payload to be
// encrypted to the subscriber's own keys — the push service (Google, Mozilla,
// Apple) relays a blob it cannot read. That is the whole point: the vendor is a
// dumb pipe and never sees a word of a prayer request or a sermon alert.
//
// The usual answer is the `web-push` npm package. We do not take it: it is a
// Node-only library that will not run in a Cloudflare Pages Function (our
// sender's actual runtime), it pulls a dependency tree for what is ~200 lines
// of standard cryptography, and this repo's standing posture is lightweight
// local primitives over bloated third-party trees. Everything below is
// `globalThis.crypto.subtle`, which exists identically in Cloudflare Workers,
// Node 18+, and the browser.
//
// ── HONEST LIMIT OF THE VERIFICATION (DR-0076 §8) ───────────────────────────
// RFC 8291 §5 publishes a worked example with fixed keys and an expected
// ciphertext. Asserting against it is the strongest possible check, and this
// suite does NOT do that: `www.rfc-editor.org` is blocked by this sandbox's
// egress proxy, and writing the vector from memory is exactly the fabrication
// DR-0076 forbids. What IS proven, in webpush-crypto.test.js:
//   • ROUND TRIP — an independently written decryptor recovers the exact
//     plaintext from the encryptor's output using only the subscriber's private
//     key and auth secret, which is the operation a real browser performs.
//   • PROVEN-TO-CATCH — a wrong auth secret, a wrong subscriber key, and a
//     flipped salt byte each make decryption FAIL rather than return garbage.
//   • STRUCTURE — the wire format is asserted byte-offset by byte-offset
//     against the header layout RFC 8188 defines.
//   • CONSTANT PINNING — every HKDF info string is asserted as a literal, so a
//     future edit cannot silently drift the key schedule.
// A round trip proves self-consistency, NOT interoperability: if an info string
// were wrong, encrypt+decrypt would still agree with each other and a real push
// service's client would still fail to decrypt. The pinned constants are what
// guard that, and the claim is only fully closed when a REAL DEVICE receives a
// real notification. Until that is observed, treat interop as UNVERIFIED.
// See DR-0334 and the `re-review` recorded there.
// =============================================================================

const enc = new TextEncoder();

// ── RFC-defined constants. PINNED: these strings ARE the key schedule. ───────
// RFC 8291 §3.4 — the key-derivation info for the shared IKM.
export const KEY_INFO_PREFIX = 'WebPush: info';
// RFC 8188 §2.2 — the content-encryption-key and nonce derivation infos.
export const CEK_INFO = 'Content-Encoding: aes128gcm';
export const NONCE_INFO = 'Content-Encoding: nonce';
// RFC 8188 §2 — header field widths, in bytes.
export const SALT_BYTES = 16;
export const RS_BYTES = 4;
export const KEYID_LEN_BYTES = 1;
export const P256_PUBLIC_BYTES = 65; // uncompressed point: 0x04 || X(32) || Y(32)
export const CEK_BYTES = 16; // AES-128
export const NONCE_BYTES = 12;
export const GCM_TAG_BYTES = 16;
// RFC 8188 §2 — the record size we advertise. One record; payloads are small.
export const DEFAULT_RECORD_SIZE = 4096;
// RFC 8188 §2 — the padding delimiter for the LAST record.
export const LAST_RECORD_DELIMITER = 0x02;

// ── base64url, without padding (RFC 7515 §2) ────────────────────────────────
export function b64urlEncode(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < b.length; i += 1) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

function subtle() {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new Error('Web Crypto is unavailable in this runtime');
  return c.subtle;
}

// ── HKDF (RFC 5869), the two halves kept separate because RFC 8291 runs
//    Extract twice with different salts before a single Expand. ──────────────
async function hmacSha256(keyBytes, data) {
  const key = await subtle().importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await subtle().sign('HMAC', key, data));
}

/** HKDF-Extract: PRK = HMAC(salt, ikm). */
export async function hkdfExtract(salt, ikm) {
  return hmacSha256(salt, ikm);
}

/** HKDF-Expand for one block (all outputs here are <= 32 bytes). */
export async function hkdfExpand(prk, info, length) {
  if (length > 32) throw new Error('hkdfExpand: single-block only (<= 32 bytes)');
  const block = await hmacSha256(prk, concat(info, Uint8Array.of(0x01)));
  return block.slice(0, length);
}

/** An info string with its trailing NUL, as RFC 8188 §2.2 specifies. */
export function infoWithNul(label) {
  return concat(enc.encode(label), Uint8Array.of(0x00));
}

// ── The RFC 8291 §3.4 key schedule, shared by encrypt and decrypt. ──────────
// Extracted so both directions provably run the SAME derivation — a decryptor
// with its own copy of the schedule would not prove anything about this one.
async function deriveContentKeys({ ecdhSecret, authSecret, uaPublic, asPublic, salt }) {
  // PRK_key = HKDF-Extract(auth_secret, ecdh_secret)
  const prkKey = await hkdfExtract(authSecret, ecdhSecret);
  // key_info = "WebPush: info" || 0x00 || ua_public || as_public
  const keyInfo = concat(infoWithNul(KEY_INFO_PREFIX), uaPublic, asPublic);
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);
  // PRK = HKDF-Extract(salt, IKM)
  const prk = await hkdfExtract(salt, ikm);
  const cek = await hkdfExpand(prk, infoWithNul(CEK_INFO), CEK_BYTES);
  const nonce = await hkdfExpand(prk, infoWithNul(NONCE_INFO), NONCE_BYTES);
  return { cek, nonce };
}

async function importUaPublic(raw) {
  return subtle().importKey('raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

/**
 * Encrypt a push payload to a subscriber (RFC 8291, aes128gcm single record).
 *
 * @param {object}  o
 * @param {string}  o.payload    UTF-8 text to deliver (typically JSON).
 * @param {string}  o.p256dh     Subscriber public key, base64url (from the browser).
 * @param {string}  o.auth       Subscriber auth secret, base64url (from the browser).
 * @param {Uint8Array} [o.salt]  Test seam ONLY. Omit in production so a fresh
 *                               random salt is generated per message — a reused
 *                               salt with a reused key is a nonce reuse.
 * @param {CryptoKeyPair} [o.serverKeys] Test seam ONLY; ephemeral by default.
 * @returns {Promise<{ body: Uint8Array, salt: Uint8Array, asPublic: Uint8Array }>}
 */
export async function encryptPushPayload({ payload, p256dh, auth, salt, serverKeys }) {
  if (typeof payload !== 'string') throw new Error('payload must be a string');
  const uaPublic = b64urlDecode(p256dh);
  const authSecret = b64urlDecode(auth);
  if (uaPublic.length !== P256_PUBLIC_BYTES) {
    throw new Error(`p256dh must be ${P256_PUBLIC_BYTES} bytes, got ${uaPublic.length}`);
  }

  const useSalt = salt || globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  if (useSalt.length !== SALT_BYTES) throw new Error(`salt must be ${SALT_BYTES} bytes`);

  const keys = serverKeys || await subtle().generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'],
  );
  const asPublic = new Uint8Array(await subtle().exportKey('raw', keys.publicKey));

  const ecdhSecret = new Uint8Array(await subtle().deriveBits(
    { name: 'ECDH', public: await importUaPublic(uaPublic) }, keys.privateKey, 256,
  ));

  const { cek, nonce } = await deriveContentKeys({
    ecdhSecret, authSecret, uaPublic, asPublic, salt: useSalt,
  });

  // RFC 8188 §2: the last record is plaintext || 0x02 (no further padding).
  const plaintext = concat(enc.encode(payload), Uint8Array.of(LAST_RECORD_DELIMITER));
  const aesKey = await subtle().importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(await subtle().encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: GCM_TAG_BYTES * 8 }, aesKey, plaintext,
  ));

  // RFC 8188 §2.1 header: salt(16) | rs(4, big-endian) | idlen(1) | keyid(idlen)
  const rs = new Uint8Array(RS_BYTES);
  new DataView(rs.buffer).setUint32(0, DEFAULT_RECORD_SIZE, false);
  const body = concat(useSalt, rs, Uint8Array.of(asPublic.length), asPublic, ciphertext);

  return { body, salt: useSalt, asPublic };
}

/**
 * Decrypt an aes128gcm push body — the operation a real browser performs.
 *
 * This exists so the encryptor can be proven by ROUND TRIP rather than by
 * assertion, and so a corrupted or wrongly-keyed message is proven to FAIL
 * rather than silently yield garbage. It is also what a service worker would
 * need if we ever handled raw bodies ourselves.
 *
 * @param {object} o
 * @param {Uint8Array} o.body        The full aes128gcm body.
 * @param {string} o.uaPrivateJwkD   Subscriber private scalar `d`, base64url.
 * @param {string} o.p256dh          Subscriber public key, base64url.
 * @param {string} o.auth            Subscriber auth secret, base64url.
 * @returns {Promise<string>} the plaintext
 */
export async function decryptPushPayload({ body, uaPrivateJwkD, p256dh, auth }) {
  const header = parsePushBodyHeader(body);
  const uaPublic = b64urlDecode(p256dh);
  const authSecret = b64urlDecode(auth);

  // Rebuild the subscriber's private key as a JWK from d + the public point.
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: uaPrivateJwkD,
    x: b64urlEncode(uaPublic.slice(1, 33)),
    y: b64urlEncode(uaPublic.slice(33, 65)),
    ext: true,
  };
  const uaPrivate = await subtle().importKey(
    'jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'],
  );

  const ecdhSecret = new Uint8Array(await subtle().deriveBits(
    { name: 'ECDH', public: await importUaPublic(header.keyid) }, uaPrivate, 256,
  ));

  const { cek, nonce } = await deriveContentKeys({
    ecdhSecret, authSecret, uaPublic, asPublic: header.keyid, salt: header.salt,
  });

  const aesKey = await subtle().importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt']);
  const padded = new Uint8Array(await subtle().decrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: GCM_TAG_BYTES * 8 }, aesKey, header.ciphertext,
  ));

  // Strip the RFC 8188 record delimiter and any zero padding after it.
  let end = padded.length;
  while (end > 0 && padded[end - 1] === 0x00) end -= 1;
  if (end === 0 || padded[end - 1] !== LAST_RECORD_DELIMITER) {
    throw new Error('missing aes128gcm record delimiter');
  }
  return new TextDecoder().decode(padded.slice(0, end - 1));
}

/** Split an aes128gcm body into its RFC 8188 §2.1 header fields. */
export function parsePushBodyHeader(body) {
  const b = body instanceof Uint8Array ? body : new Uint8Array(body);
  const min = SALT_BYTES + RS_BYTES + KEYID_LEN_BYTES;
  if (b.length < min) throw new Error('body shorter than an aes128gcm header');
  const salt = b.slice(0, SALT_BYTES);
  const rs = new DataView(b.buffer, b.byteOffset + SALT_BYTES, RS_BYTES).getUint32(0, false);
  const idlen = b[SALT_BYTES + RS_BYTES];
  const keyStart = min;
  if (b.length < keyStart + idlen) throw new Error('body truncated inside keyid');
  return {
    salt,
    recordSize: rs,
    idlen,
    keyid: b.slice(keyStart, keyStart + idlen),
    ciphertext: b.slice(keyStart + idlen),
  };
}

// ── VAPID (RFC 8292): the application server identifies itself to the push
//    service with a signed JWT, so a stolen endpoint cannot be spammed by a
//    third party. ES256 over P-256; the same curve, a different key pair. ────

/** The `aud` a push service expects: the scheme + host of the endpoint. */
export function audienceForEndpoint(endpoint) {
  const u = new URL(endpoint);
  return `${u.protocol}//${u.host}`;
}

/**
 * Build the Authorization header value for one push request.
 *
 * @param {object} o
 * @param {string} o.endpoint       The subscriber's push endpoint URL.
 * @param {string} o.subject        `mailto:` or `https:` contact (RFC 8292 §2.1).
 * @param {string} o.publicKey      VAPID public key, base64url (65 raw bytes).
 * @param {string} o.privateKey     VAPID private scalar `d`, base64url.
 * @param {number} [o.expSeconds]   Lifetime; RFC 8292 caps it at 24h.
 * @param {number} [o.now]          Epoch seconds, for deterministic tests.
 * @returns {Promise<{ Authorization: string }>}
 */
export async function vapidAuthorization({
  endpoint, subject, publicKey, privateKey, expSeconds = 12 * 60 * 60, now,
}) {
  if (!subject || !/^(mailto:|https:)/.test(subject)) {
    throw new Error('VAPID subject must be a mailto: or https: URI (RFC 8292 §2.1)');
  }
  if (expSeconds > 24 * 60 * 60) throw new Error('VAPID exp may not exceed 24 hours');

  const nowSec = Number.isFinite(now) ? Math.floor(now) : Math.floor(Date.now() / 1000);
  const header = { typ: 'JWT', alg: 'ES256' };
  const claims = {
    aud: audienceForEndpoint(endpoint),
    exp: nowSec + expSeconds,
    sub: subject,
  };
  const signingInput = `${b64urlEncode(enc.encode(JSON.stringify(header)))}.${b64urlEncode(enc.encode(JSON.stringify(claims)))}`;

  const pub = b64urlDecode(publicKey);
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: privateKey,
    x: b64urlEncode(pub.slice(1, 33)),
    y: b64urlEncode(pub.slice(33, 65)),
    ext: true,
  };
  const key = await subtle().importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'],
  );
  // Web Crypto emits the raw r||s pair, which is exactly the JWS ES256 form.
  const sig = new Uint8Array(await subtle().sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(signingInput),
  ));
  const jwt = `${signingInput}.${b64urlEncode(sig)}`;
  return { Authorization: `vapid t=${jwt}, k=${publicKey}` };
}

/** Verify a VAPID header — used by the suite to prove the signature is real. */
export async function verifyVapidAuthorization(authorization, publicKey) {
  const m = /^vapid t=([^,]+), *k=(.+)$/.exec(authorization || '');
  if (!m) return { valid: false, reason: 'malformed header' };
  const [, jwt] = m;
  const parts = jwt.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'malformed jwt' };
  const pub = b64urlDecode(publicKey);
  const key = await subtle().importKey(
    'raw', pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'],
  );
  const valid = await subtle().verify(
    { name: 'ECDSA', hash: 'SHA-256' }, key,
    b64urlDecode(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`),
  );
  return {
    valid,
    header: JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0]))),
    claims: JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]))),
  };
}

/** Generate a VAPID key pair. Run once; the private half is a secret. */
export async function generateVapidKeys() {
  const pair = await subtle().generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'],
  );
  const pub = new Uint8Array(await subtle().exportKey('raw', pair.publicKey));
  const jwk = await subtle().exportKey('jwk', pair.privateKey);
  return { publicKey: b64urlEncode(pub), privateKey: jwk.d };
}
