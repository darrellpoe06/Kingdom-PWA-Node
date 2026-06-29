// =============================================================================
// webauthn — fingerprint / Face fast-unlock via the platform authenticator
// =============================================================================
// The SECOND human-presence factor (alongside the PIN) for fast re-auth on a
// KNOWN device. It uses the W3C Web Authentication API (WebAuthn) with the
// device's PLATFORM authenticator — Touch ID / Face ID / Windows Hello / Android
// fingerprint / the Z Fold sensor. This is the standard, sovereign way:
//
//   * The biometric NEVER leaves the device. The OS performs the fingerprint /
//     face match locally and only RELEASES a hardware-bound private key on
//     success. This module never sees, stores, or transmits any biometric data.
//   * The key pair is generated in the device's secure enclave. The private key
//     is non-exportable. We keep only the PUBLIC key + credential id on THIS
//     device (localStorage) — public material, safe at rest.
//   * It is DEVICE-BOUND fast re-auth layered on top of the already-established
//     Supabase session + the PIN. It does not replace the account password and
//     does not weaken it: identity is still proven server-side by the session;
//     biometric just proves "the enrolled human is present on this device" in
//     place of typing the PIN. The PIN is always the fallback underneath it.
//
// REAL, NOT THEATER (DR-0076): an unlock is accepted only after we CRYPTO-VERIFY
// the assertion signature against the public key captured at enrollment, over a
// fresh random challenge (replay-resistant), with WebCrypto `subtle.verify`. A
// "the prompt closed" success is not trusted on its own — when the platform
// exposes the public key we verify the math; the helpers that do it are pure and
// unit-tested against a known key/signature so the gate is proven-to-catch.
//
// SCOPE / honest boundary: this is a per-device unlock (the credential lives in
// this device's enclave + this browser's storage). It is NOT cross-device
// passkey sync and NOT a passwordless server login — those would need server-
// side WebAuthn verification (Supabase MFA / a verifier RPC) and are a separate,
// later lane. Losing the device falls back to PIN, then to identity re-auth.
//
// NO-LOCKOUT: biometric is purely additive. If WebAuthn is unsupported, the
// platform authenticator is absent, the user cancels, or anything throws, the
// caller falls straight back to the PIN with zero friction. Nothing here can
// strand a user.
// =============================================================================

const STORE_PREFIX = 'poe-webauthn:'; // + <user-id>  -> JSON credential record

// COSE algorithm identifiers we register for, most-preferred first.
const ALG_ES256 = -7;   // ECDSA w/ SHA-256 on P-256 — the common platform default
const ALG_RS256 = -257; // RSASSA-PKCS1-v1_5 w/ SHA-256 — Windows Hello fallback

// -----------------------------------------------------------------------------
// Small byte/base64 helpers (PURE — exported for tests). We use base64url for
// the credential id (it rides in URLs/JSON cleanly) and plain base64 for the
// SPKI public key blob.
// -----------------------------------------------------------------------------
export function bufToBytes(buf) {
  if (buf instanceof Uint8Array) return buf;
  return new Uint8Array(buf);
}

export function bytesToB64(bytes) {
  const b = bufToBytes(bytes);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  // btoa exists in browsers and in Node's global since v16.
  return btoa(s);
}

export function b64ToBytes(b64) {
  const s = atob(String(b64));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export function bytesToB64url(bytes) {
  return bytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlToBytes(b64url) {
  let s = String(b64url).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return b64ToBytes(s);
}

export function concatBytes(a, b) {
  const x = bufToBytes(a), y = bufToBytes(b);
  const out = new Uint8Array(x.length + y.length);
  out.set(x, 0); out.set(y, x.length);
  return out;
}

// -----------------------------------------------------------------------------
// DER -> raw ECDSA signature (PURE — exported for tests).
// WebAuthn ES256 assertions return the signature ASN.1 DER-encoded:
//   SEQUENCE { INTEGER r, INTEGER s }
// WebCrypto's ECDSA verify wants the raw r||s (two fixed 32-byte big-endian
// integers). This converts, stripping the DER leading-zero sign bytes and
// left-padding each component to 32 bytes. Throws on a malformed structure.
// -----------------------------------------------------------------------------
export function derEcdsaToRaw(der, size = 32) {
  const d = bufToBytes(der);
  if (d[0] !== 0x30) throw new Error('bad DER: not a SEQUENCE');
  // d[1] is the sequence length (short form is enough for P-256 sigs).
  let off = 2;
  const readInt = () => {
    if (d[off] !== 0x02) throw new Error('bad DER: expected INTEGER');
    let len = d[off + 1];
    off += 2;
    let val = d.slice(off, off + len);
    off += len;
    // Strip a leading 0x00 that only marks a positive number.
    while (val.length > size && val[0] === 0x00) val = val.slice(1);
    // Left-pad to the fixed component size.
    if (val.length < size) {
      const padded = new Uint8Array(size);
      padded.set(val, size - val.length);
      val = padded;
    }
    return val;
  };
  const r = readInt();
  const s = readInt();
  return concatBytes(r, s);
}

// -----------------------------------------------------------------------------
// clientDataJSON validation (PURE — exported for tests). The authenticator
// echoes back the challenge + origin + type it signed over; we confirm the type
// is the expected ceremony and (when given) that the challenge matches the one
// WE generated this call — that match is what makes a replayed assertion useless.
// -----------------------------------------------------------------------------
export function validateClientData(clientDataJSON, { expectedType, expectedChallengeB64url } = {}) {
  let json;
  try {
    const text = typeof clientDataJSON === 'string'
      ? clientDataJSON
      : new TextDecoder().decode(bufToBytes(clientDataJSON));
    json = JSON.parse(text);
  } catch (_) {
    return { ok: false, reason: 'clientData not parseable' };
  }
  if (expectedType && json.type !== expectedType) {
    return { ok: false, reason: `type mismatch: ${json.type}` };
  }
  if (expectedChallengeB64url != null) {
    // The challenge is base64url WITHOUT padding in clientDataJSON.
    const got = String(json.challenge || '').replace(/=+$/, '');
    const want = String(expectedChallengeB64url).replace(/=+$/, '');
    if (got !== want) return { ok: false, reason: 'challenge mismatch' };
  }
  return { ok: true, origin: json.origin, type: json.type };
}

// -----------------------------------------------------------------------------
// Verify an assertion's signature against the enrolled public key (uses
// WebCrypto subtle — works in the browser AND in Node's test runtime). Returns
// a boolean; never throws (a thrown crypto error = not verified = fall back).
//
//   record    : { publicKeySpki (base64), alg }   from enrollment
//   assertion : { authenticatorData, clientDataJSON, signature }  (ArrayBuffers)
//   expectedChallengeB64url : the challenge we issued for THIS get()
// -----------------------------------------------------------------------------
export async function verifyAssertionSignature(record, assertion, expectedChallengeB64url) {
  try {
    if (!record || !record.publicKeySpki) return false;
    const subtle = globalThis.crypto && globalThis.crypto.subtle;
    if (!subtle) return false;

    const cd = validateClientData(assertion.clientDataJSON, {
      expectedType: 'webauthn.get',
      expectedChallengeB64url,
    });
    if (!cd.ok) return false;

    const isRsa = record.alg === ALG_RS256;
    const importAlg = isRsa
      ? { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
      : { name: 'ECDSA', namedCurve: 'P-256' };
    const verifyAlg = isRsa
      ? { name: 'RSASSA-PKCS1-v1_5' }
      : { name: 'ECDSA', hash: 'SHA-256' };

    const key = await subtle.importKey(
      'spki', b64ToBytes(record.publicKeySpki), importAlg, false, ['verify']);

    // Signed bytes = authenticatorData || SHA-256(clientDataJSON).
    const clientHash = new Uint8Array(
      await subtle.digest('SHA-256', bufToBytes(assertion.clientDataJSON)));
    const signedData = concatBytes(assertion.authenticatorData, clientHash);

    let sig = bufToBytes(assertion.signature);
    if (!isRsa) sig = derEcdsaToRaw(sig, 32); // ES256 DER -> raw r||s

    return await subtle.verify(verifyAlg, key, sig, signedData);
  } catch (_) {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Capability detection.
// -----------------------------------------------------------------------------
/** True when the browser exposes the WebAuthn API at all. */
export function isWebAuthnSupported() {
  return typeof window !== 'undefined'
    && typeof window.PublicKeyCredential === 'function'
    && !!(navigator && navigator.credentials && navigator.credentials.create);
}

/**
 * True when a built-in (platform) authenticator — fingerprint/Face/Hello — is
 * actually available. Async per the spec. Safe everywhere: resolves false rather
 * than throwing when unsupported.
 */
export async function isPlatformAuthenticatorAvailable() {
  if (!isWebAuthnSupported()) return false;
  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return false;
    }
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (_) {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Local credential record storage (per signed-in user, per device/browser).
// The record holds only PUBLIC material: the credential id + the public key.
// -----------------------------------------------------------------------------
function storeKey(userId) { return STORE_PREFIX + String(userId || 'anon'); }

export function isBiometricEnrolled(userId) {
  try {
    if (typeof localStorage === 'undefined') return false;
    return !!localStorage.getItem(storeKey(userId));
  } catch (_) { return false; }
}

function loadRecord(userId) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(storeKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function saveRecord(userId, record) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(storeKey(userId), JSON.stringify(record));
  } catch (_) { /* storage full / blocked — biometric just stays un-enrolled */ }
}

/** Forget this device's biometric for a user (e.g. on "remove biometric"). */
export function clearBiometric(userId) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(storeKey(userId));
  } catch (_) { /* ignore */ }
}

function randomChallenge() {
  const c = new Uint8Array(32);
  (globalThis.crypto || window.crypto).getRandomValues(c);
  return c;
}

// A stable, ASCII-safe user handle for the authenticator (<= 64 bytes). We don't
// need it to be the real id — it just labels the credential on the device.
function userHandle(userId) {
  const bytes = new TextEncoder().encode(String(userId || 'poe-user'));
  return bytes.slice(0, 64);
}

// -----------------------------------------------------------------------------
// Enroll: create a platform credential for this user on this device. Requires an
// established session (the caller passes the signed-in user). Returns
// { ok, reason? }. Never throws.
// -----------------------------------------------------------------------------
export async function enrollBiometric({ userId, userName, displayName } = {}) {
  if (!isWebAuthnSupported()) return { ok: false, reason: 'unsupported' };
  if (!userId) return { ok: false, reason: 'no-user' };
  try {
    const challenge = randomChallenge();
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'PoeTech', id: window.location.hostname },
        user: {
          id: userHandle(userId),
          name: userName || 'PoeTech user',
          displayName: displayName || userName || 'PoeTech user',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: ALG_ES256 },
          { type: 'public-key', alg: ALG_RS256 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // built-in fingerprint/Face only
          userVerification: 'required',         // force the biometric/PIN gesture
          residentKey: 'discouraged',
        },
        timeout: 60000,
        attestation: 'none', // we don't need attestation for a local unlock
      },
    });
    if (!cred) return { ok: false, reason: 'cancelled' };

    const att = cred.response; // AuthenticatorAttestationResponse
    let publicKeySpki = null;
    let alg = ALG_ES256;
    // getPublicKey()/getPublicKeyAlgorithm() are supported on modern Chrome/
    // Edge/Safari/Samsung Internet — exactly the mobile targets here.
    if (att && typeof att.getPublicKey === 'function') {
      const pk = att.getPublicKey();
      if (pk) publicKeySpki = bytesToB64(pk);
      if (typeof att.getPublicKeyAlgorithm === 'function') {
        const a = att.getPublicKeyAlgorithm();
        if (a === ALG_RS256 || a === ALG_ES256) alg = a;
      }
    }

    saveRecord(userId, {
      credentialId: bytesToB64url(cred.rawId),
      publicKeySpki,           // null on the rare browser without getPublicKey()
      alg,
      createdAt: new Date().toISOString(),
    });
    return { ok: true, verifiable: !!publicKeySpki };
  } catch (e) {
    // NotAllowedError (user cancelled), SecurityError, etc. — all fall back.
    return { ok: false, reason: (e && e.name) || 'error' };
  }
}

// -----------------------------------------------------------------------------
// Unlock: prompt the platform authenticator and verify the assertion. Returns
// { ok, verifiedBy?, reason? }. Never throws.
//
//   verifiedBy: 'signature' — we cryptographically verified the assertion.
//   verifiedBy: 'platform'  — the (rare) browser gave no public key at enroll,
//                             so we trust the platform's user-verification gate
//                             (the assertion still required a live fingerprint/
//                             Face on the enrolled credential). Honestly flagged.
// -----------------------------------------------------------------------------
export async function unlockWithBiometric(userId) {
  if (!isWebAuthnSupported()) return { ok: false, reason: 'unsupported' };
  const record = loadRecord(userId);
  if (!record || !record.credentialId) return { ok: false, reason: 'not-enrolled' };
  try {
    const challenge = randomChallenge();
    const challengeB64url = bytesToB64url(challenge);
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          type: 'public-key',
          id: b64urlToBytes(record.credentialId),
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
        rpId: window.location.hostname,
      },
    });
    if (!assertion) return { ok: false, reason: 'cancelled' };

    const resp = assertion.response; // AuthenticatorAssertionResponse
    if (record.publicKeySpki) {
      const verified = await verifyAssertionSignature(record, {
        authenticatorData: resp.authenticatorData,
        clientDataJSON: resp.clientDataJSON,
        signature: resp.signature,
      }, challengeB64url);
      return verified
        ? { ok: true, verifiedBy: 'signature' }
        : { ok: false, reason: 'verify-failed' };
    }
    // No stored public key (legacy browser): the prompt still required a live
    // user-verification on the enrolled credential. Confirm the challenge round-
    // tripped, then accept on the platform's gate.
    const cd = validateClientData(resp.clientDataJSON, {
      expectedType: 'webauthn.get',
      expectedChallengeB64url: challengeB64url,
    });
    return cd.ok
      ? { ok: true, verifiedBy: 'platform' }
      : { ok: false, reason: 'verify-failed' };
  } catch (e) {
    return { ok: false, reason: (e && e.name) || 'error' };
  }
}
