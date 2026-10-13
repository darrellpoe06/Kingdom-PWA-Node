// =============================================================================
// store-signing tests — the in-app signing-key flow proven (DR-0076):
// the keystore is REAL (round-trips through PKCS12 with the right alias),
// the sealing is REAL (opens with the matching secret key), and the
// placement path hits GitHub's exact endpoints with sealed payloads only.
// =============================================================================
import { describe, it, expect } from 'vitest';
import forge from 'node-forge';
import sodium from 'libsodium-wrappers';
import {
  generateStoreKeystore, sealForGithub, placeGithubSecret, placeStoreSigningKey,
  KEY_ALIAS, SECRET_NAMES,
} from '../lib/store-signing.js';

describe('generateStoreKeystore — a real keystore, born client-side', () => {
  it('produces a PKCS12 that round-trips with the returned password and alias', async () => {
    const { p12Base64, password } = await generateStoreKeystore({ forgeImpl: forge });
    expect(password).toMatch(/^[0-9a-f]{48}$/); // 24 random bytes, hex
    const der = forge.util.decode64(p12Base64);
    const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(der), password);
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
    expect(keyBags.length).toBe(1);
    expect(certBags.length).toBe(1);
    expect(keyBags[0].attributes.friendlyName[0]).toBe(KEY_ALIAS);
    expect(certBags[0].cert.subject.getField('CN').value).toBe('PoeTech App Store');
  }, 30000);

  it('a wrong password cannot open it', async () => {
    const { p12Base64 } = await generateStoreKeystore({ forgeImpl: forge });
    const der = forge.util.decode64(p12Base64);
    expect(() => forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(der), 'wrong-pass')).toThrow();
  }, 30000);
});

describe('sealForGithub — the sealed box opens only with the repo secret key', () => {
  it('round-trips through libsodium crypto_box_seal_open', async () => {
    await sodium.ready;
    const kp = sodium.crypto_box_keypair();
    const pubB64 = sodium.to_base64(kp.publicKey, sodium.base64_variants.ORIGINAL);
    const sealed = await sealForGithub(pubB64, 'the-secret-value', { sodiumImpl: sodium });
    const opened = sodium.crypto_box_seal_open(
      sodium.from_base64(sealed, sodium.base64_variants.ORIGINAL), kp.publicKey, kp.privateKey);
    expect(sodium.to_string(opened)).toBe('the-secret-value');
  });
});

const mockGithub = () => {
  const calls = [];
  let repoKp;
  const impl = async (url, init = {}) => {
    calls.push({ url, init });
    await sodium.ready;
    if (!repoKp) repoKp = sodium.crypto_box_keypair();
    if (url.endsWith('/actions/secrets/public-key')) {
      return new Response(JSON.stringify({
        key: sodium.to_base64(repoKp.publicKey, sodium.base64_variants.ORIGINAL), key_id: 'k1',
      }), { status: 200 });
    }
    if (init.method === 'PUT') return new Response(null, { status: 201 });
    if (url.endsWith('/dispatches')) return new Response(null, { status: 204 });
    return new Response('nope', { status: 404 });
  };
  return { impl, calls, secretKey: () => repoKp };
};

describe('placement — sealed payloads to the exact endpoints, then the proof dispatch', () => {
  it('places both secrets sealed (never plaintext) and dispatches the android lane', async () => {
    await sodium.ready;
    const { impl, calls, secretKey } = mockGithub();
    const r = await placeStoreSigningKey({
      p12Base64: 'UEsDQg==', password: 'pw-123456789012345678', token: 'ghp_x'.padEnd(24, 'x'),
      fetchImpl: impl, sodiumImpl: sodium,
    });
    expect(r.ok).toBe(true);
    expect(r.proofDispatched).toBe(true);
    const puts = calls.filter((c) => c.init.method === 'PUT');
    expect(puts.map((c) => c.url.split('/').pop())).toEqual(SECRET_NAMES);
    for (const put of puts) {
      const body = JSON.parse(put.init.body);
      expect(body.key_id).toBe('k1');
      // sealed, not plaintext — and it opens back to what was sent
      expect(body.encrypted_value).not.toContain('pw-1234');
      const kp = secretKey();
      const opened = sodium.to_string(sodium.crypto_box_seal_open(
        sodium.from_base64(body.encrypted_value, sodium.base64_variants.ORIGINAL), kp.publicKey, kp.privateKey));
      expect(['UEsDQg==', 'pw-123456789012345678']).toContain(opened);
    }
    const disp = calls.at(-1);
    expect(disp.url).toContain('/actions/workflows/android-package.yml/dispatches');
    expect(JSON.parse(disp.init.body).ref).toBe('main');
  });

  it('stops honestly when the token lacks scope (public-key 403)', async () => {
    const r = await placeGithubSecret({
      name: 'X', value: 'v', token: 't',
      fetchImpl: async () => new Response('forbidden', { status: 403 }),
    });
    expect(r).toEqual({ ok: false, step: 'public-key', status: 403 });
  });
});
