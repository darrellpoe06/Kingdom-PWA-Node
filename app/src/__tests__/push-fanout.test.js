// @vitest-environment node
// =============================================================================
// push-fanout — one notification, many phones, counted honestly
// =============================================================================
// The failure modes this suite exists to prevent are not abstract. Each one is
// something a congregation would FEEL:
//   • being buzzed twice for one service (the dedupe lock),
//   • a dead subscription retried forever until the success rate is meaningless
//     (the 404/410 prune),
//   • one unreachable phone aborting the send to everyone else,
//   • an unbounded fan-out nobody budgeted for,
//   • and a send whose outcome nobody can measure — which is exactly the state
//     that made "why didn't my phone notify me?" unanswerable on 2026-09-06.
import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  fanOut, sendOne, buildPushPayload, isSendableSubscription,
  MAX_DEVICES_PER_SEND, GONE_STATUSES, MAX_PAYLOAD_BYTES,
} from '../lib/push-fanout.js';
import { generateVapidKeys, b64urlEncode, decryptPushPayload } from '../lib/webpush-crypto.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

let VAPID;
async function vapid() {
  if (!VAPID) {
    const k = await generateVapidKeys();
    VAPID = { subject: 'mailto:info@thechurchofthelivinggod.com', publicKey: k.publicKey, privateKey: k.privateKey };
  }
  return VAPID;
}

async function subscriber(i = 0) {
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return {
    endpoint: `https://fcm.googleapis.com/fcm/send/device-${i}`,
    p256dh: b64urlEncode(raw),
    auth: b64urlEncode(crypto.getRandomValues(new Uint8Array(16))),
    privateD: jwk.d,
  };
}

/** A fetch that records every call and answers by endpoint. */
function fakeFetch(statusFor = () => 201) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    const s = statusFor(url, calls.length);
    if (s === 'throw') throw new Error('network unreachable');
    return { status: s, ok: s >= 200 && s < 300 };
  };
  impl.calls = calls;
  return impl;
}

describe('buildPushPayload — the one shape the sender and the SW agree on', () => {
  it('carries kind, title, body and a same-origin url', () => {
    const p = JSON.parse(buildPushPayload({
      kind: 'live', title: 'The Love Corner is live', body: 'Sunday Worship has started.',
      url: '/poetech-app/?tab=church',
    }));
    expect(p).toEqual({
      kind: 'live', title: 'The Love Corner is live',
      body: 'Sunday Worship has started.', url: '/poetech-app/?tab=church',
    });
  });

  it('refuses a push with no title — an untitled notification says nothing', () => {
    expect(() => buildPushPayload({ body: 'x' })).toThrow(/title/);
  });

  it('DROPS an off-origin url rather than emitting one', () => {
    // Defence in depth: the SW rejects these too, but a sender that never emits
    // one is the better place to stop it.
    for (const url of ['https://evil.example/x', '//evil.example/x', '/\\evil.example/x', 'javascript:alert(1)']) {
      expect(JSON.parse(buildPushPayload({ title: 't', url })).url, url).toBeUndefined();
    }
  });

  it('refuses a payload past the practical push-service ceiling', () => {
    expect(() => buildPushPayload({ title: 't', body: 'x'.repeat(MAX_PAYLOAD_BYTES) })).toThrow(/exceeds/);
  });

  it('omits empty optionals instead of shipping nulls', () => {
    const p = JSON.parse(buildPushPayload({ title: 't' }));
    expect(Object.keys(p).sort()).toEqual(['kind', 'title']);
  });
});

describe('isSendableSubscription — a row must carry all three browser values', () => {
  it('accepts a complete, enabled row', async () => {
    expect(isSendableSubscription(await subscriber())).toBe(true);
  });

  it('rejects incomplete, disabled, and non-https rows', async () => {
    const base = await subscriber();
    expect(isSendableSubscription({ ...base, p256dh: '' })).toBe(false);
    expect(isSendableSubscription({ ...base, auth: '' })).toBe(false);
    expect(isSendableSubscription({ ...base, endpoint: 'http://insecure.example/x' })).toBe(false);
    expect(isSendableSubscription({ ...base, disabled_at: '2026-09-06T00:00:00Z' })).toBe(false);
    expect(isSendableSubscription(null)).toBe(false);
  });
});

describe('sendOne — one device, and what actually goes on the wire', () => {
  it('POSTs the aes128gcm headers a push service requires', async () => {
    const sub = await subscriber();
    const f = fakeFetch(() => 201);
    const r = await sendOne({
      subscription: sub, payload: JSON.stringify({ title: 't' }), vapid: await vapid(), fetchImpl: f,
    });
    expect(r.ok).toBe(true);
    const { init } = f.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Encoding']).toBe('aes128gcm');
    expect(init.headers['Content-Type']).toBe('application/octet-stream');
    expect(init.headers.TTL).toBe('3600');
    expect(init.headers.Authorization).toMatch(/^vapid t=/);
  });

  it('END-TO-END: what is put on the wire decrypts to what was sent', async () => {
    // The strongest check available offline — the body the sender transmits is
    // recovered by the subscriber's own keys, which is what a browser does.
    const sub = await subscriber();
    const f = fakeFetch(() => 201);
    const payload = JSON.stringify({ kind: 'live', title: 'The Love Corner is live' });
    await sendOne({ subscription: sub, payload, vapid: await vapid(), fetchImpl: f });
    const wire = f.calls[0].init.body;
    expect(await decryptPushPayload({
      body: wire, uaPrivateJwkD: sub.privateD, p256dh: sub.p256dh, auth: sub.auth,
    })).toBe(payload);
  });

  it('reports a 410 as GONE, which is the prune signal', async () => {
    const r = await sendOne({
      subscription: await subscriber(), payload: '{"title":"t"}', vapid: await vapid(),
      fetchImpl: fakeFetch(() => 410),
    });
    expect(r.ok).toBe(false);
    expect(r.gone).toBe(true);
  });

  it('reports a 500 as a FAILURE but NOT gone — it may work next time', async () => {
    const r = await sendOne({
      subscription: await subscriber(), payload: '{"title":"t"}', vapid: await vapid(),
      fetchImpl: fakeFetch(() => 500),
    });
    expect(r.ok).toBe(false);
    expect(r.gone).toBe(false);
  });

  it('never throws on a transport error — it returns a result', async () => {
    const r = await sendOne({
      subscription: await subscriber(), payload: '{"title":"t"}', vapid: await vapid(),
      fetchImpl: fakeFetch(() => 'throw'),
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(0);
    expect(r.error).toMatch(/unreachable/);
  });
});

describe('fanOut — the whole congregation, counted', () => {
  it('reaches every device and counts the successes', async () => {
    const subs = await Promise.all([0, 1, 2, 3, 4].map(subscriber));
    const f = fakeFetch(() => 201);
    const out = await fanOut({
      subscriptions: subs, payload: '{"title":"t"}', vapid: await vapid(),
      dedupeKey: 'live-2026-09-06T11:00', fetchImpl: f,
    });
    expect(out.attempted).toBe(5);
    expect(out.succeeded).toBe(5);
    expect(out.failed).toBe(0);
    expect(f.calls).toHaveLength(5);
  });

  it('ONE unreachable phone does not abort the send to everyone else', async () => {
    const subs = await Promise.all([0, 1, 2, 3, 4].map(subscriber));
    const f = fakeFetch((url) => (url.endsWith('device-2') ? 'throw' : 201));
    const out = await fanOut({
      subscriptions: subs, payload: '{"title":"t"}', vapid: await vapid(),
      dedupeKey: 'k', fetchImpl: f,
    });
    expect(out.succeeded).toBe(4);
    expect(out.failed).toBe(1);
  });

  it('collects the GONE endpoints for pruning, and only those', async () => {
    const subs = await Promise.all([0, 1, 2, 3].map(subscriber));
    const f = fakeFetch((url) => {
      if (url.endsWith('device-1')) return 410;
      if (url.endsWith('device-2')) return 404;
      if (url.endsWith('device-3')) return 503; // transient — NOT pruned
      return 201;
    });
    const out = await fanOut({
      subscriptions: subs, payload: '{"title":"t"}', vapid: await vapid(),
      dedupeKey: 'k', fetchImpl: f,
    });
    expect(out.gone.sort()).toEqual([
      'https://fcm.googleapis.com/fcm/send/device-1',
      'https://fcm.googleapis.com/fcm/send/device-2',
    ]);
    expect(out.failed).toBe(3);
  });

  it('both permanent statuses are treated as gone', () => {
    expect(GONE_STATUSES).toEqual([404, 410]);
  });

  it('skips unusable rows without counting them as failures', async () => {
    const good = await subscriber(0);
    const out = await fanOut({
      subscriptions: [good, { endpoint: 'https://x/y' }, { ...good, disabled_at: 'now' }],
      payload: '{"title":"t"}', vapid: await vapid(), dedupeKey: 'k', fetchImpl: fakeFetch(),
    });
    expect(out.attempted).toBe(1);
    expect(out.skipped).toBe(2);
    expect(out.failed).toBe(0);
  });

  it('THE BUDGET BRAKE: caps the device count and REPORTS the cap', async () => {
    // Silently truncating would be worse than the cap itself — an operator has
    // to know the send did not reach everyone.
    const one = await subscriber(0);
    const many = Array.from({ length: 7 }, (_, i) => ({ ...one, endpoint: `https://fcm.googleapis.com/fcm/send/d${i}` }));
    const f = fakeFetch(() => 201);
    const out = await fanOut({
      subscriptions: many, payload: '{"title":"t"}', vapid: await vapid(),
      dedupeKey: 'k', fetchImpl: f, maxDevices: 3,
    });
    expect(out.attempted).toBe(3);
    expect(out.capped).toBe(true);
    expect(f.calls).toHaveLength(3);
  });

  it('the default ceiling is a real number, not Infinity', () => {
    expect(MAX_DEVICES_PER_SEND).toBe(2000);
    expect(Number.isFinite(MAX_DEVICES_PER_SEND)).toBe(true);
  });

  it('THE LOCK: refuses to send at all without a dedupe key', async () => {
    // Skipping the double-send lock must not be something a caller can do by
    // simply forgetting a field.
    await expect(fanOut({
      subscriptions: [await subscriber()], payload: '{"title":"t"}',
      vapid: await vapid(), fetchImpl: fakeFetch(),
    })).rejects.toThrow(/dedupeKey/);
  });

  it('refuses to send without complete VAPID credentials', async () => {
    await expect(fanOut({
      subscriptions: [await subscriber()], payload: '{"title":"t"}',
      vapid: { subject: 'mailto:a@b.com' }, dedupeKey: 'k', fetchImpl: fakeFetch(),
    })).rejects.toThrow(/VAPID/);
  });

  it('respects the concurrency bound rather than opening every socket at once', async () => {
    let inFlight = 0;
    let peak = 0;
    const impl = async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => { setTimeout(r, 1); });
      inFlight -= 1;
      return { status: 201, ok: true };
    };
    const one = await subscriber(0);
    const many = Array.from({ length: 20 }, (_, i) => ({ ...one, endpoint: `https://fcm.googleapis.com/fcm/send/d${i}` }));
    await fanOut({
      subscriptions: many, payload: '{"title":"t"}', vapid: await vapid(),
      dedupeKey: 'k', fetchImpl: impl, concurrency: 4,
    });
    expect(peak).toBeLessThanOrEqual(4);
  });

  it('an empty congregation is a clean zero, not a crash', async () => {
    const out = await fanOut({
      subscriptions: [], payload: '{"title":"t"}', vapid: await vapid(),
      dedupeKey: 'k', fetchImpl: fakeFetch(),
    });
    expect(out).toMatchObject({ attempted: 0, succeeded: 0, failed: 0, skipped: 0, capped: false });
  });
});
