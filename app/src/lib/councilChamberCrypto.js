// councilChamberCrypto.js — leaf util for the Council Chamber's private journal.
// PIN-gated, encrypted-at-rest on the user's own device via the Web Crypto API.
//
// Posture (per Christina, 2026-05-23): the journal holds "ongoing discussions
// when they speak so their data can be sourced by them when needed or desired
// without fear of exposure." So: a PIN the user chooses, an AES-GCM key derived
// from it with PBKDF2, and every journal write encrypted before it touches
// localStorage. The PIN itself is never stored — only a random salt and a small
// verifier blob. A forgotten PIN means the data cannot be recovered (by design).

const PBKDF2_ITERATIONS = 150000; // ≥100k per requirement
const VERIFIER_PLAINTEXT = 'council-chamber-unlock-ok';

const enc = new TextEncoder();
const dec = new TextDecoder();

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
}

export function isCryptoSupported() {
  return typeof crypto !== 'undefined' && !!crypto.subtle && !!crypto.getRandomValues;
}

export function generateSalt() {
  return bufToB64(crypto.getRandomValues(new Uint8Array(16)));
}

// Derive a non-extractable AES-GCM key from the PIN + salt.
export async function deriveKey(pin, saltB64) {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64ToBuf(saltB64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// Encrypt any JSON-serializable value. Returns { iv, ct } (both base64).
export async function encryptJSON(key, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)));
  return { iv: bufToB64(iv), ct: bufToB64(ct) };
}

// Decrypt an { iv, ct } payload back into its JSON value. Throws on a wrong key.
export async function decryptJSON(key, payload) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBuf(payload.iv) },
    key,
    b64ToBuf(payload.ct),
  );
  return JSON.parse(dec.decode(pt));
}

// Build the verifier blob stored at vault-creation so a later PIN entry can be
// checked without ever storing the PIN.
export async function makeVerifier(key) {
  return encryptJSON(key, VERIFIER_PLAINTEXT);
}

// Returns true if the derived key correctly decrypts the stored verifier.
export async function checkVerifier(key, verifier) {
  try {
    const plain = await decryptJSON(key, verifier);
    return plain === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}
