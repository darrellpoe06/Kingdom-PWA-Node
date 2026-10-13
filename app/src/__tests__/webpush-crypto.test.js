// @vitest-environment node
// =============================================================================
// webpush-crypto — the encryption that lets a closed phone receive a sermon
// alert without the push service reading a word of it.
// =============================================================================
// WHAT IS PROVEN HERE, AND WHAT IS NOT (DR-0076 §8, stated before the tests so
// nobody reads a green suite as more than it is):
//
//   PROVEN — round trip. An independently written decryptor recovers the exact
//   plaintext using ONLY the subscriber's private key and auth secret, which is
//   the operation a real browser performs on receipt.
//
//   PROVEN — proven-to-catch. A wrong auth secret, a wrong subscriber key, and
//   a single flipped salt byte each make decryption FAIL. Silent garbage would
//   be worse than an error, so the failure itself is the assertion.
//
//   PROVEN — wire structure, byte offset by byte offset, against the RFC 8188
//   §2.1 header layout, plus the constant pinning below.
//
//   PROVEN — the VAPID JWT verifies against its own public key with an
//   independent Web Crypto `verify`, and its claims are the ones RFC 8292 §2
//   requires.
//
//   NOT PROVEN — interoperability with a real push service. RFC 8291 §5
//   publishes a worked example with an expected ciphertext, and asserting
//   against it is the strongest available check. This suite does NOT: the RFC
//   host is blocked by this sandbox's egress proxy, and writing the vector from
//   memory is precisely the fabrication DR-0076 forbids. A round trip proves
//   self-consistency, not conformance — a wrong HKDF info string would still
//   round-trip cleanly here and still fail on a real device. The constant
//   pinning below is what guards that, and the claim only closes when a REAL
//   PHONE receives a real notification. Until that is observed, interop is
//   UNVERIFIED and must be described that way.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  encryptPushPayload, decryptPushPayload, parsePushBodyHeader,
  vapidAuthorization, verifyVapidAuthorization, audienceForEndpoint,
  generateVapidKeys, b64urlEncode, b64urlDecode, infoWithNul, hkdfExtract, hkdfExpand,
  KEY_INFO_PREFIX, CEK_INFO, NONCE_INFO,
  SALT_BYTES, RS_BYTES, KEYID_LEN_BYTES, P256_PUBLIC_BYTES,
  CEK_BYTES, NONCE_BYTES, GCM_TAG_BYTES, DEFAULT_RECORD_SIZE, LAST_RECORD_DELIMITER,
} from '../lib/webpush-crypto.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

/** Stand in for a browser's PushManager.subscribe() output. */
async function makeSubscriber() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return {
    p256dh: b64urlEncode(raw),
    auth: b64urlEncode(crypto.getRandomValues(new Uint8Array(16))),
    privateD: jwk.d,
  };
}

describe('the key schedule constants are PINNED (a silent drift breaks every device)', () => {
  // These strings ARE the derivation. If one changes, every previously issued
  // subscription stops decrypting, and a round-trip test would still pass —
  // which is exactly why they are asserted as literals here.
  it('the RFC-defined info strings are exactly what the RFCs specify', () => {
    expect(KEY_INFO_PREFIX).toBe('WebPush: info');       // RFC 8291 §3.4
    expect(CEK_INFO).toBe('Content-Encoding: aes128gcm'); // RFC 8188 §2.2
    expect(NONCE_INFO).toBe('Content-Encoding: nonce');   // RFC 8188 §2.2
  });

  it('each info string is terminated with a single NUL byte', () => {
    const info = infoWithNul(CEK_INFO);
    expect(info[info.length - 1]).toBe(0x00);
    expect(info.length).toBe(CEK_INFO.length + 1);
  });

  it('the field widths are the RFC 8188 §2 widths', () => {
    expect(SALT_BYTES).toBe(16);
    expect(RS_BYTES).toBe(4);
    expect(KEYID_LEN_BYTES).toBe(1);
    expect(P256_PUBLIC_BYTES).toBe(65);
    expect(CEK_BYTES).toBe(16);   // AES-128
    expect(NONCE_BYTES).toBe(12);
    expect(GCM_TAG_BYTES).toBe(16);
    expect(LAST_RECORD_DELIMITER).toBe(0x02);
  });
});

describe('base64url is the unpadded RFC 7515 form', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = crypto.getRandomValues(new Uint8Array(97));
    expect([...b64urlDecode(b64urlEncode(bytes))]).toEqual([...bytes]);
  });

  it('emits no padding and no + or /', () => {
    for (let n = 1; n <= 12; n += 1) {
      const s = b64urlEncode(crypto.getRandomValues(new Uint8Array(n)));
      expect(s).not.toMatch(/[+/=]/);
    }
  });

  it('accepts input that would need padding to decode', () => {
    // A 65-byte key encodes to 87 chars — not a multiple of 4.
    const key = crypto.getRandomValues(new Uint8Array(65));
    const s = b64urlEncode(key);
    expect(s.length % 4).not.toBe(0);
    expect(b64urlDecode(s).length).toBe(65);
  });
});

describe('HKDF behaves as RFC 5869 specifies', () => {
  it('extract is deterministic and expand is length-limited', async () => {
    const salt = new Uint8Array(16).fill(7);
    const ikm = new Uint8Array(32).fill(9);
    const a = await hkdfExtract(salt, ikm);
    const b = await hkdfExtract(salt, ikm);
    expect([...a]).toEqual([...b]);
    expect(a.length).toBe(32);
    expect((await hkdfExpand(a, infoWithNul(CEK_INFO), 16)).length).toBe(16);
  });

  it('a different salt yields a different PRK', async () => {
    const ikm = new Uint8Array(32).fill(9);
    const a = await hkdfExtract(new Uint8Array(16).fill(1), ikm);
    const b = await hkdfExtract(new Uint8Array(16).fill(2), ikm);
    expect([...a]).not.toEqual([...b]);
  });

  it('refuses a multi-block expand rather than silently truncating', async () => {
    const prk = await hkdfExtract(new Uint8Array(16), new Uint8Array(32));
    await expect(hkdfExpand(prk, infoWithNul(CEK_INFO), 48)).rejects.toThrow(/single-block/);
  });
});

describe('the wire format is the RFC 8188 §2.1 header (measured, not assumed)', () => {
  it('lays out salt | rs | idlen | keyid | ciphertext at the exact offsets', async () => {
    const sub = await makeSubscriber();
    const { body, salt, asPublic } = await encryptPushPayload({
      payload: 'The Love Corner is live.', p256dh: sub.p256dh, auth: sub.auth,
    });

    expect([...body.slice(0, SALT_BYTES)]).toEqual([...salt]);

    const rs = new DataView(body.buffer, body.byteOffset + SALT_BYTES, RS_BYTES).getUint32(0, false);
    expect(rs).toBe(DEFAULT_RECORD_SIZE);

    expect(body[SALT_BYTES + RS_BYTES]).toBe(P256_PUBLIC_BYTES);

    const keyStart = SALT_BYTES + RS_BYTES + KEYID_LEN_BYTES;
    expect([...body.slice(keyStart, keyStart + P256_PUBLIC_BYTES)]).toEqual([...asPublic]);
    // An uncompressed P-256 point always begins 0x04.
    expect(asPublic[0]).toBe(0x04);

    // Ciphertext = plaintext + delimiter + GCM tag.
    const ciphertext = body.slice(keyStart + P256_PUBLIC_BYTES);
    expect(ciphertext.length).toBe('The Love Corner is live.'.length + 1 + GCM_TAG_BYTES);
  });

  it('parsePushBodyHeader reads back exactly what encrypt wrote', async () => {
    const sub = await makeSubscriber();
    const { body, salt, asPublic } = await encryptPushPayload({
      payload: 'x', p256dh: sub.p256dh, auth: sub.auth,
    });
    const h = parsePushBodyHeader(body);
    expect([...h.salt]).toEqual([...salt]);
    expect(h.recordSize).toBe(DEFAULT_RECORD_SIZE);
    expect(h.idlen).toBe(P256_PUBLIC_BYTES);
    expect([...h.keyid]).toEqual([...asPublic]);
  });

  it('refuses a truncated body instead of reading past the end', () => {
    expect(() => parsePushBodyHeader(new Uint8Array(4))).toThrow(/shorter than/);
    const short = new Uint8Array(SALT_BYTES + RS_BYTES + 1);
    short[SALT_BYTES + RS_BYTES] = 65; // claims a 65-byte keyid that is not there
    expect(() => parsePushBodyHeader(short)).toThrow(/truncated/);
  });
});

describe('ROUND TRIP — a subscriber recovers the exact plaintext', () => {
  it('decrypts back to the original message', async () => {
    const sub = await makeSubscriber();
    const payload = JSON.stringify({
      kind: 'live', title: 'The Love Corner is live', body: 'Sunday Worship has started.',
    });
    const { body } = await encryptPushPayload({ payload, p256dh: sub.p256dh, auth: sub.auth });
    const out = await decryptPushPayload({
      body, uaPrivateJwkD: sub.privateD, p256dh: sub.p256dh, auth: sub.auth,
    });
    expect(out).toBe(payload);
  });

  it('survives UTF-8 beyond ASCII (names and Scripture carry it)', async () => {
    const sub = await makeSubscriber();
    const payload = '“Lazarus, come forth.” — Yahweh’s Word · 🔔';
    const { body } = await encryptPushPayload({ payload, p256dh: sub.p256dh, auth: sub.auth });
    expect(await decryptPushPayload({
      body, uaPrivateJwkD: sub.privateD, p256dh: sub.p256dh, auth: sub.auth,
    })).toBe(payload);
  });

  it('a fresh salt is used per message — the same payload never encrypts alike', async () => {
    // Reusing a salt under the same keys is nonce reuse, which breaks GCM.
    const sub = await makeSubscriber();
    const a = await encryptPushPayload({ payload: 'same', p256dh: sub.p256dh, auth: sub.auth });
    const b = await encryptPushPayload({ payload: 'same', p256dh: sub.p256dh, auth: sub.auth });
    expect([...a.salt]).not.toEqual([...b.salt]);
    expect([...a.body]).not.toEqual([...b.body]);
  });
});

describe('PROVEN-TO-CATCH — wrong keys and tampering FAIL, they do not return garbage', () => {
  it('a wrong auth secret cannot decrypt', async () => {
    const sub = await makeSubscriber();
    const { body } = await encryptPushPayload({ payload: 'secret', p256dh: sub.p256dh, auth: sub.auth });
    const wrongAuth = b64urlEncode(crypto.getRandomValues(new Uint8Array(16)));
    await expect(decryptPushPayload({
      body, uaPrivateJwkD: sub.privateD, p256dh: sub.p256dh, auth: wrongAuth,
    })).rejects.toThrow();
  });

  it('a different subscriber cannot decrypt another subscriber\'s message', async () => {
    const alice = await makeSubscriber();
    const bob = await makeSubscriber();
    const { body } = await encryptPushPayload({
      payload: 'for alice only', p256dh: alice.p256dh, auth: alice.auth,
    });
    await expect(decryptPushPayload({
      body, uaPrivateJwkD: bob.privateD, p256dh: bob.p256dh, auth: bob.auth,
    })).rejects.toThrow();
  });

  it('flipping one bit of the salt in transit fails the tag', async () => {
    const sub = await makeSubscriber();
    const { body } = await encryptPushPayload({ payload: 'intact', p256dh: sub.p256dh, auth: sub.auth });
    const tampered = new Uint8Array(body);
    tampered[0] ^= 0x01;
    await expect(decryptPushPayload({
      body: tampered, uaPrivateJwkD: sub.privateD, p256dh: sub.p256dh, auth: sub.auth,
    })).rejects.toThrow();
  });

  it('flipping one bit of the ciphertext fails the tag', async () => {
    const sub = await makeSubscriber();
    const { body } = await encryptPushPayload({ payload: 'intact', p256dh: sub.p256dh, auth: sub.auth });
    const tampered = new Uint8Array(body);
    tampered[tampered.length - 1] ^= 0x01;
    await expect(decryptPushPayload({
      body: tampered, uaPrivateJwkD: sub.privateD, p256dh: sub.p256dh, auth: sub.auth,
    })).rejects.toThrow();
  });

  it('refuses a subscriber key of the wrong length rather than deriving nonsense', async () => {
    await expect(encryptPushPayload({
      payload: 'x', p256dh: b64urlEncode(new Uint8Array(32)), auth: b64urlEncode(new Uint8Array(16)),
    })).rejects.toThrow(/65 bytes/);
  });

  it('refuses a non-string payload', async () => {
    const sub = await makeSubscriber();
    await expect(encryptPushPayload({
      payload: { not: 'a string' }, p256dh: sub.p256dh, auth: sub.auth,
    })).rejects.toThrow(/must be a string/);
  });
});

describe('VAPID (RFC 8292) — the server proves who it is', () => {
  it('produces a JWT that verifies against its own public key', async () => {
    const keys = await generateVapidKeys();
    const { Authorization } = await vapidAuthorization({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      subject: 'mailto:info@thechurchofthelivinggod.com',
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      now: 1_788_000_000,
    });
    const v = await verifyVapidAuthorization(Authorization, keys.publicKey);
    expect(v.valid).toBe(true);
    expect(v.header).toEqual({ typ: 'JWT', alg: 'ES256' });
  });

  it('carries the aud, exp and sub claims RFC 8292 §2 requires', async () => {
    const keys = await generateVapidKeys();
    const now = 1_788_000_000;
    const { Authorization } = await vapidAuthorization({
      endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
      subject: 'mailto:info@thechurchofthelivinggod.com',
      publicKey: keys.publicKey, privateKey: keys.privateKey, now, expSeconds: 3600,
    });
    const { claims } = await verifyVapidAuthorization(Authorization, keys.publicKey);
    // aud is the ORIGIN of the endpoint, never the full path.
    expect(claims.aud).toBe('https://updates.push.services.mozilla.com');
    expect(claims.exp).toBe(now + 3600);
    expect(claims.sub).toBe('mailto:info@thechurchofthelivinggod.com');
  });

  it('the header carries the public key as k=, which the push service checks', async () => {
    const keys = await generateVapidKeys();
    const { Authorization } = await vapidAuthorization({
      endpoint: 'https://fcm.googleapis.com/fcm/send/x',
      subject: 'https://poetech.us', publicKey: keys.publicKey, privateKey: keys.privateKey,
    });
    expect(Authorization).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=/);
    expect(Authorization.endsWith(keys.publicKey)).toBe(true);
  });

  it('PROVEN-TO-CATCH: a DIFFERENT public key rejects the signature', async () => {
    const real = await generateVapidKeys();
    const other = await generateVapidKeys();
    const { Authorization } = await vapidAuthorization({
      endpoint: 'https://fcm.googleapis.com/fcm/send/x',
      subject: 'mailto:a@b.com', publicKey: real.publicKey, privateKey: real.privateKey,
    });
    expect((await verifyVapidAuthorization(Authorization, other.publicKey)).valid).toBe(false);
  });

  it('PROVEN-TO-CATCH: a tampered claim rejects the signature', async () => {
    const keys = await generateVapidKeys();
    const { Authorization } = await vapidAuthorization({
      endpoint: 'https://fcm.googleapis.com/fcm/send/x',
      subject: 'mailto:a@b.com', publicKey: keys.publicKey, privateKey: keys.privateKey,
      now: 1_788_000_000, expSeconds: 60,
    });
    const [, jwt] = /^vapid t=([^,]+),/.exec(Authorization);
    const [h, , s] = jwt.split('.');
    const forged = b64urlEncode(new TextEncoder().encode(JSON.stringify({
      aud: 'https://fcm.googleapis.com', exp: 1_788_000_000 + 86_400, sub: 'mailto:attacker@example.com',
    })));
    const v = await verifyVapidAuthorization(`vapid t=${h}.${forged}.${s}, k=${keys.publicKey}`, keys.publicKey);
    expect(v.valid).toBe(false);
  });

  it('refuses a subject that is not mailto: or https:', async () => {
    const keys = await generateVapidKeys();
    await expect(vapidAuthorization({
      endpoint: 'https://fcm.googleapis.com/fcm/send/x',
      subject: 'The Church Of The Living God',
      publicKey: keys.publicKey, privateKey: keys.privateKey,
    })).rejects.toThrow(/mailto:|https:/);
  });

  it('refuses an expiry beyond the 24-hour cap', async () => {
    const keys = await generateVapidKeys();
    await expect(vapidAuthorization({
      endpoint: 'https://fcm.googleapis.com/fcm/send/x', subject: 'mailto:a@b.com',
      publicKey: keys.publicKey, privateKey: keys.privateKey, expSeconds: 24 * 60 * 60 + 1,
    })).rejects.toThrow(/24 hours/);
  });

  it('audienceForEndpoint strips the path from every real push service form', () => {
    expect(audienceForEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe('https://fcm.googleapis.com');
    expect(audienceForEndpoint('https://updates.push.services.mozilla.com/wpush/v2/g')).toBe('https://updates.push.services.mozilla.com');
    expect(audienceForEndpoint('https://web.push.apple.com/QA/x/y')).toBe('https://web.push.apple.com');
    expect(audienceForEndpoint('https://wns2-by3p.notify.windows.com/w/?token=a')).toBe('https://wns2-by3p.notify.windows.com');
  });

  it('generateVapidKeys emits a 65-byte public point and a 32-byte private scalar', async () => {
    const keys = await generateVapidKeys();
    expect(b64urlDecode(keys.publicKey).length).toBe(65);
    expect(b64urlDecode(keys.publicKey)[0]).toBe(0x04);
    expect(b64urlDecode(keys.privateKey).length).toBe(32);
  });
});
