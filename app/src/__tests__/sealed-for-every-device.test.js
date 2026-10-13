// =============================================================================
// Sealed for every device — the v2 envelope is proven, not claimed (DR-0737)
// =============================================================================
// Darrell 2026-10-01: "sometimes I can see it and others not on the same
// device... I actually want it to work on multiple devices... why not?"
// Under Node's WebCrypto: one message sealed once is opened on each of the
// recipient's devices AND on the sender's own other device; a device the
// message was not sealed for gets null and is named as such; tampering and a
// wrong key get null; v1 bodies and plaintext are still told apart.
import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  ensureDmKeypair, ensureDmDeviceId, sealForDevices, openSealed, sealedEnvelope, sealedFor,
  sealedForDevice, isEncryptedBody, isSealedV2, deviceKeyId, encryptDmBody, deriveDmKey,
  E2E_MARKER, E2E_MARKER_V2, LOCKED_BEFORE_THIS_DEVICE, DEVICE_ID_KEY,
} from '../lib/dm-encryption.js';

const cryptoObj = webcrypto;
const memStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

// A device is a storage of its own: its device id and its keypair live there.
async function device(userId) {
  const storage = memStorage();
  const deviceId = ensureDmDeviceId({ cryptoObj, storage });
  const kp = await ensureDmKeypair(userId, { cryptoObj, storage });
  return { userId, deviceId, kp, storage, pub: { userId, deviceId, publicJwk: kp.publicJwk } };
}

describe('the device id', () => {
  it('is created once per storage, in the slot device-trust.js keeps, and read back after', () => {
    const storage = memStorage();
    const a = ensureDmDeviceId({ cryptoObj, storage });
    expect(a.length).toBeGreaterThanOrEqual(8);
    expect(storage.getItem(DEVICE_ID_KEY)).toBe(a);
    expect(ensureDmDeviceId({ cryptoObj, storage })).toBe(a);
  });
  it('two devices are two ids', () => {
    expect(ensureDmDeviceId({ cryptoObj, storage: memStorage() })).not.toBe(ensureDmDeviceId({ cryptoObj, storage: memStorage() }));
  });
});

describe('one message, every device', () => {
  it('Darrell on his phone seals to Shay\'s phone, Shay\'s tablet and his OWN desktop; all three open it, and the phone itself does too', async () => {
    const dPhone = await device('darrell');
    const dDesk = await device('darrell');
    const sPhone = await device('shay');
    const sTab = await device('shay');
    const wire = await sealForDevices('Want to go for a walk?', {
      myPrivateJwk: dPhone.kp.privateJwk, from: { userId: 'darrell', deviceId: dPhone.deviceId },
      devices: [sPhone.pub, sTab.pub, dDesk.pub, dPhone.pub],
    }, { cryptoObj });
    expect(wire.startsWith(E2E_MARKER_V2)).toBe(true);
    expect(isEncryptedBody(wire)).toBe(true);
    expect(isSealedV2(wire)).toBe(true);
    expect(wire).not.toContain('walk');
    expect(sealedFor(wire).sort()).toEqual([
      deviceKeyId('darrell', dDesk.deviceId), deviceKeyId('darrell', dPhone.deviceId),
      deviceKeyId('shay', sPhone.deviceId), deviceKeyId('shay', sTab.deviceId),
    ].sort());
    const env = sealedEnvelope(wire);
    expect(env.from).toEqual({ userId: 'darrell', deviceId: dPhone.deviceId });
    for (const d of [sPhone, sTab, dDesk, dPhone]) {
      const text = await openSealed(wire, { myPrivateJwk: d.kp.privateJwk, me: { userId: d.userId, deviceId: d.deviceId }, senderPublicJwk: dPhone.kp.publicJwk }, { cryptoObj });
      expect(text, `${d.userId}:${d.deviceId} opens it`).toBe('Want to go for a walk?');
    }
  });

  it('a device the message was not sealed for is told so, and opens nothing', async () => {
    const dPhone = await device('darrell');
    const sPhone = await device('shay');
    const wire = await sealForDevices('hello', { myPrivateJwk: dPhone.kp.privateJwk, from: { userId: 'darrell', deviceId: dPhone.deviceId }, devices: [sPhone.pub, dPhone.pub] }, { cryptoObj });
    const later = await device('shay'); // joined Messages after the send
    expect(sealedForDevice(wire, 'shay', later.deviceId)).toBe(false);
    expect(sealedForDevice(wire, 'shay', sPhone.deviceId)).toBe(true);
    expect(await openSealed(wire, { myPrivateJwk: later.kp.privateJwk, me: { userId: 'shay', deviceId: later.deviceId }, senderPublicJwk: dPhone.kp.publicJwk }, { cryptoObj })).toBe(null);
    expect(LOCKED_BEFORE_THIS_DEVICE).toMatch(/before this one joined/);
  });

  it('a wrong sender key, a tampered body and a stolen wrap each open nothing', async () => {
    const dPhone = await device('darrell');
    const dOther = await device('darrell');
    const sPhone = await device('shay');
    const wire = await sealForDevices('secret', { myPrivateJwk: dPhone.kp.privateJwk, from: { userId: 'darrell', deviceId: dPhone.deviceId }, devices: [sPhone.pub] }, { cryptoObj });
    // Shay with the WRONG sending-device key (Darrell's other device).
    expect(await openSealed(wire, { myPrivateJwk: sPhone.kp.privateJwk, me: { userId: 'shay', deviceId: sPhone.deviceId }, senderPublicJwk: dOther.kp.publicJwk }, { cryptoObj })).toBe(null);
    // Tampered ciphertext (GCM authenticates).
    const env = JSON.parse(new TextDecoder().decode(Buffer.from(wire.slice(E2E_MARKER_V2.length), 'base64')));
    const ctBytes = Buffer.from(env.ct, 'base64'); ctBytes[0] ^= 0x01;
    const tampered = `${E2E_MARKER_V2}${Buffer.from(JSON.stringify({ ...env, ct: ctBytes.toString('base64') })).toString('base64')}`;
    expect(await openSealed(tampered, { myPrivateJwk: sPhone.kp.privateJwk, me: { userId: 'shay', deviceId: sPhone.deviceId }, senderPublicJwk: dPhone.kp.publicJwk }, { cryptoObj })).toBe(null);
    // Another device presenting Shay's phone's id with its own key.
    const thief = await device('shay');
    expect(await openSealed(wire, { myPrivateJwk: thief.kp.privateJwk, me: { userId: 'shay', deviceId: sPhone.deviceId }, senderPublicJwk: dPhone.kp.publicJwk }, { cryptoObj })).toBe(null);
  });

  it('a device whose key is unusable is skipped and the rest still get it; no usable device is null', async () => {
    const dPhone = await device('darrell');
    const sPhone = await device('shay');
    const wire = await sealForDevices('hi', { myPrivateJwk: dPhone.kp.privateJwk, from: { userId: 'darrell', deviceId: dPhone.deviceId }, devices: [{ userId: 'shay', deviceId: 'broken-device', publicJwk: { kty: 'EC', crv: 'P-256', x: 'nope', y: 'nope' } }, sPhone.pub] }, { cryptoObj });
    expect(sealedFor(wire)).toEqual([deviceKeyId('shay', sPhone.deviceId)]);
    expect(await sealForDevices('hi', { myPrivateJwk: dPhone.kp.privateJwk, from: { userId: 'darrell', deviceId: dPhone.deviceId }, devices: [] }, { cryptoObj })).toBe(null);
    expect(await sealForDevices('hi', { myPrivateJwk: dPhone.kp.privateJwk, from: { userId: 'darrell', deviceId: dPhone.deviceId }, devices: [{ userId: 'shay', deviceId: 'x', publicJwk: { kty: 'EC', crv: 'P-256', x: 'nope', y: 'nope' } }] }, { cryptoObj })).toBe(null);
  });

  it('v1 bodies and plaintext are still told apart from v2', async () => {
    const dPhone = await device('darrell');
    const sPhone = await device('shay');
    const pair = await deriveDmKey(dPhone.kp.privateJwk, sPhone.kp.publicJwk, { cryptoObj });
    const v1 = await encryptDmBody('old way', pair, { cryptoObj });
    expect(v1.startsWith(E2E_MARKER)).toBe(true);
    expect(isEncryptedBody(v1)).toBe(true);
    expect(isSealedV2(v1)).toBe(false);
    expect(sealedEnvelope(v1)).toBe(null);
    expect(isEncryptedBody('plain words')).toBe(false);
    expect(sealedEnvelope(`${E2E_MARKER_V2}not-base64-json`)).toBe(null);
    expect(sealedFor('plain words')).toEqual([]);
  });
});
