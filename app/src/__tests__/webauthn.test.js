// =============================================================================
// webauthn — fast-unlock helpers + REAL signature verification (proven-to-catch)
// =============================================================================
// The biometric unlock is "real, not theater" (DR-0076): an unlock is accepted
// only when we cryptographically verify the WebAuthn assertion signature against
// the enrolled public key over the challenge WE issued. This suite proves that
// gate actually CATCHES a bad/forged/replayed assertion — it generates a true
// ES256 key, signs the exact bytes WebAuthn signs, DER-encodes the signature the
// way a real authenticator does, and asserts:
//   * a genuine assertion VERIFIES,
//   * a tampered authenticatorData FAILS,
//   * a wrong/replayed challenge FAILS,
//   * a different key FAILS.
// Plus the pure encoding helpers, capability gating, and no-lockout fallbacks.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  bytesToB64, b64ToBytes, bytesToB64url, b64urlToBytes, concatBytes,
  derEcdsaToRaw, validateClientData, verifyAssertionSignature,
  isWebAuthnSupported, isBiometricEnrolled, clearBiometric, unlockWithBiometric,
} from '../lib/webauthn.js';

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();

// --- helper: raw r||s -> ASN.1 DER (the inverse of what the lib does), so we can
// feed verifyAssertionSignature a signature shaped like a real authenticator's.
function rawToDer(raw) {
  const r = trimLeadingZeros(raw.slice(0, 32));
  const s = trimLeadingZeros(raw.slice(32));
  const rDer = derInt(r);
  const sDer = derInt(s);
  const body = concatBytes(rDer, sDer);
  return concatBytes(new Uint8Array([0x30, body.length]), body);
}
function trimLeadingZeros(b) {
  let i = 0;
  while (i < b.length - 1 && b[i] === 0) i++;
  return b.slice(i);
}
function derInt(v) {
  // Prepend 0x00 if the high bit is set (keep it a positive INTEGER).
  const needsPad = v[0] & 0x80;
  const val = needsPad ? concatBytes(new Uint8Array([0x00]), v) : v;
  return concatBytes(new Uint8Array([0x02, val.length]), val);
}

async function makeEnrolledKey() {
  const pair = await subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const spki = new Uint8Array(await subtle.exportKey('spki', pair.publicKey));
  return { pair, publicKeySpki: bytesToB64(spki), alg: -7 };
}

// Build a realistic assertion (authenticatorData, clientDataJSON, DER signature)
// for a given challenge, signed by the given private key.
async function signAssertion(privateKey, challengeB64url, { type = 'webauthn.get' } = {}) {
  const clientDataJSON = enc.encode(JSON.stringify({
    type, challenge: challengeB64url, origin: 'https://poetech.us',
  }));
  // 37 bytes is the minimum real authenticatorData (rpIdHash + flags + counter).
  const authenticatorData = new Uint8Array(37);
  globalThis.crypto.getRandomValues(authenticatorData);
  const clientHash = new Uint8Array(await subtle.digest('SHA-256', clientDataJSON));
  const signedData = concatBytes(authenticatorData, clientHash);
  const rawSig = new Uint8Array(await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, privateKey, signedData));
  return { authenticatorData, clientDataJSON, signature: rawToDer(rawSig) };
}

describe('base64 / base64url helpers round-trip', () => {
  it('round-trips arbitrary bytes through base64 and base64url', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255, 62, 63]);
    expect(Array.from(b64ToBytes(bytesToB64(bytes)))).toEqual(Array.from(bytes));
    expect(Array.from(b64urlToBytes(bytesToB64url(bytes)))).toEqual(Array.from(bytes));
  });
  it('base64url is URL-safe (no + / =)', () => {
    const bytes = new Uint8Array([251, 255, 191, 62, 63]);
    expect(bytesToB64url(bytes)).not.toMatch(/[+/=]/);
  });
});

describe('derEcdsaToRaw', () => {
  it('produces a fixed 64-byte r||s and round-trips from rawToDer', () => {
    const raw = new Uint8Array(64);
    globalThis.crypto.getRandomValues(raw);
    raw[0] = 0x80;  // force the high bit (exercises the DER 0x00 sign pad)
    raw[32] = 0x00; // a leading zero in s (exercises trimming)
    const back = derEcdsaToRaw(rawToDer(raw), 32);
    expect(back.length).toBe(64);
    expect(Array.from(back)).toEqual(Array.from(raw));
  });
  it('throws on a non-SEQUENCE blob', () => {
    expect(() => derEcdsaToRaw(new Uint8Array([0x02, 0x01, 0x00]))).toThrow();
  });
});

describe('validateClientData', () => {
  const cd = (obj) => enc.encode(JSON.stringify(obj));
  it('accepts a matching type + challenge', () => {
    const r = validateClientData(cd({ type: 'webauthn.get', challenge: 'AAAA', origin: 'x' }),
      { expectedType: 'webauthn.get', expectedChallengeB64url: 'AAAA' });
    expect(r.ok).toBe(true);
  });
  it('rejects a wrong type', () => {
    const r = validateClientData(cd({ type: 'webauthn.create', challenge: 'AAAA' }),
      { expectedType: 'webauthn.get', expectedChallengeB64url: 'AAAA' });
    expect(r.ok).toBe(false);
  });
  it('rejects a challenge mismatch (replay defense)', () => {
    const r = validateClientData(cd({ type: 'webauthn.get', challenge: 'BBBB' }),
      { expectedType: 'webauthn.get', expectedChallengeB64url: 'AAAA' });
    expect(r.ok).toBe(false);
  });
  it('rejects unparseable clientData', () => {
    const r = validateClientData(enc.encode('{not json'), { expectedType: 'webauthn.get' });
    expect(r.ok).toBe(false);
  });
});

describe('verifyAssertionSignature — the real crypto gate', () => {
  it('VERIFIES a genuine assertion', async () => {
    const { pair, publicKeySpki, alg } = await makeEnrolledKey();
    const challenge = bytesToB64url(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    const a = await signAssertion(pair.privateKey, challenge);
    const ok = await verifyAssertionSignature({ publicKeySpki, alg }, a, challenge);
    expect(ok).toBe(true);
  });

  it('FAILS when authenticatorData is tampered', async () => {
    const { pair, publicKeySpki, alg } = await makeEnrolledKey();
    const challenge = bytesToB64url(new Uint8Array([9, 9, 9, 9]));
    const a = await signAssertion(pair.privateKey, challenge);
    a.authenticatorData[0] ^= 0xff; // flip a byte after signing
    const ok = await verifyAssertionSignature({ publicKeySpki, alg }, a, challenge);
    expect(ok).toBe(false);
  });

  it('FAILS on a replayed/wrong challenge (signature is over a different challenge)', async () => {
    const { pair, publicKeySpki, alg } = await makeEnrolledKey();
    const signedChallenge = bytesToB64url(new Uint8Array([1, 1, 1, 1]));
    const a = await signAssertion(pair.privateKey, signedChallenge);
    const expectedChallenge = bytesToB64url(new Uint8Array([2, 2, 2, 2]));
    const ok = await verifyAssertionSignature({ publicKeySpki, alg }, a, expectedChallenge);
    expect(ok).toBe(false);
  });

  it('FAILS when signed by a DIFFERENT key (forgery)', async () => {
    const victim = await makeEnrolledKey();
    const attacker = await makeEnrolledKey();
    const challenge = bytesToB64url(new Uint8Array([7, 7, 7, 7]));
    const a = await signAssertion(attacker.pair.privateKey, challenge);
    const ok = await verifyAssertionSignature(
      { publicKeySpki: victim.publicKeySpki, alg: victim.alg }, a, challenge);
    expect(ok).toBe(false);
  });

  it('returns false (never throws) with no public key on record', async () => {
    const ok = await verifyAssertionSignature({ publicKeySpki: null, alg: -7 }, {
      authenticatorData: new Uint8Array(37), clientDataJSON: enc.encode('{}'), signature: new Uint8Array(8),
    }, 'AAAA');
    expect(ok).toBe(false);
  });
});

describe('capability gating + no-lockout fallbacks', () => {
  beforeEach(() => { try { localStorage.clear(); } catch (_) {} });

  it('isWebAuthnSupported() is false in a plain jsdom (no PublicKeyCredential)', () => {
    expect(isWebAuthnSupported()).toBe(false);
  });

  it('unlock returns unsupported when WebAuthn is absent (falls back to PIN)', async () => {
    const r = await unlockWithBiometric('user-1');
    expect(r.ok).toBe(false);
    expect(['unsupported', 'not-enrolled']).toContain(r.reason);
  });

  it('isBiometricEnrolled reflects the local record; clearBiometric removes it', () => {
    expect(isBiometricEnrolled('user-1')).toBe(false);
    localStorage.setItem('poe-webauthn:user-1', JSON.stringify({ credentialId: 'abc' }));
    expect(isBiometricEnrolled('user-1')).toBe(true);
    clearBiometric('user-1');
    expect(isBiometricEnrolled('user-1')).toBe(false);
  });

  it('unlock with WebAuthn present but no enrolled credential -> not-enrolled (PIN fallback)', async () => {
    // Simulate a supported browser; with no stored credential the unlock must
    // fall back cleanly, never strand the user.
    const orig = window.PublicKeyCredential;
    window.PublicKeyCredential = function () {};
    window.navigator.credentials = window.navigator.credentials || {};
    window.navigator.credentials.create = window.navigator.credentials.create || (() => {});
    try {
      const r = await unlockWithBiometric('nobody');
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('not-enrolled');
    } finally {
      window.PublicKeyCredential = orig;
    }
  });
});
