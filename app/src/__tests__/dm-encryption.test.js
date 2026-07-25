// =============================================================================
// dm-encryption.test — the E2E envelope is proven, not claimed (DR-0076).
// =============================================================================
// Every property the surface relies on is pinned here under Node's WebCrypto:
// symmetric derivation (both participants reach the same pair key), round-trip,
// tamper rejection (GCM authenticates), wrong-key rejection, keypair
// persistence per user, and the honest nulls for broken environments.
import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  ensureDmKeypair, deriveDmKey, encryptDmBody, decryptDmBody,
  isEncryptedBody, E2E_MARKER, LOCKED_PLACEHOLDER, bytesToB64, b64ToBytes,
} from '../lib/dm-encryption.js';

const cryptoObj = webcrypto;

// A minimal in-memory Storage stand-in.
const memStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
};

describe('dm-encryption', () => {
  it('base64 helpers round-trip bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 128, 7]);
    expect(b64ToBytes(bytesToB64(bytes))).toEqual(bytes);
  });

  it('generates a keypair once and persists it per user', async () => {
    const storage = memStorage();
    const a1 = await ensureDmKeypair('user-a', { cryptoObj, storage });
    const a2 = await ensureDmKeypair('user-a', { cryptoObj, storage });
    expect(a1.publicJwk).toBeTruthy();
    expect(a1.privateJwk).toBeTruthy();
    // Second call returns the SAME held key, not a fresh one.
    expect(a2.publicJwk).toEqual(a1.publicJwk);
    // A different user on the same device gets a different key.
    const b = await ensureDmKeypair('user-b', { cryptoObj, storage });
    expect(b.publicJwk).not.toEqual(a1.publicJwk);
  });

  it('returns null honestly when the environment cannot hold a key', async () => {
    expect(await ensureDmKeypair('u', { cryptoObj: null, storage: memStorage() })).toBeNull();
    expect(await ensureDmKeypair('u', { cryptoObj, storage: null })).toBeNull();
    expect(await ensureDmKeypair(null, { cryptoObj, storage: memStorage() })).toBeNull();
  });

  it('both participants derive the same pair key (ECDH symmetry) and round-trip a message', async () => {
    const storage = memStorage();
    const alice = await ensureDmKeypair('alice', { cryptoObj, storage });
    const bob = await ensureDmKeypair('bob', { cryptoObj, storage });

    const aliceKey = await deriveDmKey(alice.privateJwk, bob.publicJwk, { cryptoObj });
    const bobKey = await deriveDmKey(bob.privateJwk, alice.publicJwk, { cryptoObj });

    const sent = await encryptDmBody('Grace and peace, brother.', aliceKey, { cryptoObj });
    expect(isEncryptedBody(sent)).toBe(true);
    expect(sent.startsWith(E2E_MARKER)).toBe(true);
    // The plaintext never appears in the stored body.
    expect(sent).not.toContain('Grace and peace');

    // Bob (the other side of the pair) reads it with HIS derived key.
    expect(await decryptDmBody(sent, bobKey, { cryptoObj })).toBe('Grace and peace, brother.');
    // Alice reads her own sent message too (same key both ways).
    expect(await decryptDmBody(sent, aliceKey, { cryptoObj })).toBe('Grace and peace, brother.');
  });

  it('rejects tampered ciphertext and wrong keys with null (never garbage)', async () => {
    const storage = memStorage();
    const alice = await ensureDmKeypair('alice', { cryptoObj, storage });
    const bob = await ensureDmKeypair('bob', { cryptoObj, storage });
    const eve = await ensureDmKeypair('eve', { cryptoObj, storage });

    const pairKey = await deriveDmKey(alice.privateJwk, bob.publicJwk, { cryptoObj });
    const sent = await encryptDmBody('meet at the church at 6', pairKey, { cryptoObj });

    // Flip a ciphertext byte -> GCM authentication fails -> null.
    const [ivB64, ctB64] = sent.slice(E2E_MARKER.length).split(':');
    const ct = b64ToBytes(ctB64);
    ct[0] ^= 0xff;
    const tampered = `${E2E_MARKER}${ivB64}:${bytesToB64(ct)}`;
    expect(await decryptDmBody(tampered, pairKey, { cryptoObj })).toBeNull();

    // A third party's derived key (eve+bob) cannot read alice<->bob.
    const eveKey = await deriveDmKey(eve.privateJwk, bob.publicJwk, { cryptoObj });
    expect(await decryptDmBody(sent, eveKey, { cryptoObj })).toBeNull();

    // Malformed envelopes and plaintext are nulls, not throws.
    expect(await decryptDmBody('e2e:v1:not-real', pairKey, { cryptoObj })).toBeNull();
    expect(await decryptDmBody('plain old text', pairKey, { cryptoObj })).toBeNull();
  });

  it('marks bodies correctly and keeps the placeholder honest', () => {
    expect(isEncryptedBody(`${E2E_MARKER}abc:def`)).toBe(true);
    expect(isEncryptedBody('hello')).toBe(false);
    expect(isEncryptedBody(null)).toBe(false);
    // The placeholder tells the truth about WHERE the key lives.
    expect(LOCKED_PLACEHOLDER.toLowerCase()).toContain('device');
  });
});
