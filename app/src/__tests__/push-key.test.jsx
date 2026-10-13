// @vitest-environment jsdom
// =============================================================================
// push-key — one source for the VAPID public half, so the pair cannot drift
// =============================================================================
// THE DEFECT THIS CLOSES, stated plainly, because it is invisible from inside
// the app: a Web Push subscription is bound by the push service to the PUBLIC
// key it was created with, and every send is signed with the PRIVATE key. The
// original wiring set those two halves in two different places at two different
// times — `VITE_VAPID_PUBLIC_KEY` inlined into the bundle at build, and
// `VAPID_PRIVATE_KEY` in the Cloudflare Pages environment at runtime. Set one
// and forget the other, or rotate one alone, and:
//
//   • the control reads its live browser state and says ON — truthfully;
//   • the sender posts and reports success — truthfully;
//   • the push service answers 403 to every request;
//   • no phone ever buzzes, and nothing anywhere says why.
//
// So the public half is now served from the SAME environment that signs, and
// the tests below hold that property rather than describing it. The one that
// matters most is "an explicit configured:false does NOT fall back to the
// build-time key" — falling back there would reinstate exactly the drifted key
// this endpoint exists to stop us from using.
import React, { act } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { onRequestGet, looksLikeVapidPublicKey } from '../../functions/api/push-key.js';
import { fetchVapidPublicKey, resetVapidKeyCache, PUSH_KEY_URL } from '../lib/push-key.js';
import { generateVapidKeys } from '../lib/webpush-crypto.js';
import PushNotifications from '../components/PushNotifications.jsx';

let REAL;
async function realKeys() {
  if (!REAL) REAL = await generateVapidKeys();
  return REAL;
}

const reply = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

function fetchOf(impl) {
  const calls = [];
  const f = async (url, init) => { calls.push({ url, init }); return impl(url, init); };
  f.calls = calls;
  return f;
}

beforeEach(() => { resetVapidKeyCache(); });

describe('looksLikeVapidPublicKey — the shape check, against a REAL generated key', () => {
  it('accepts a key our own generator produced', async () => {
    const { publicKey } = await realKeys();
    expect(publicKey).toHaveLength(87);
    expect(looksLikeVapidPublicKey(publicKey)).toBe(true);
  });

  it('rejects the things a mis-set variable actually looks like', () => {
    // Each of these has been someone's production value at some point: an
    // empty box, a placeholder, a PEM pasted instead of base64url, the PRIVATE
    // half pasted into the public slot (43 chars, not 87).
    expect(looksLikeVapidPublicKey('')).toBe(false);
    expect(looksLikeVapidPublicKey('changeme')).toBe(false);
    expect(looksLikeVapidPublicKey('-----BEGIN PUBLIC KEY-----')).toBe(false);
    expect(looksLikeVapidPublicKey('omKAA21dpFuIuDaVpPO3SYhBI1Y1TY7l5VD8RV1wflE')).toBe(false);
    expect(looksLikeVapidPublicKey(null)).toBe(false);
  });

  it('rejects a right-length key that is not an uncompressed point', () => {
    // 87 chars but not starting 0x04 — `vapidKeyToBytes` would throw inside
    // subscribe() on a real phone, where the only symptom is a dead button.
    const notAPoint = `A${'x'.repeat(86)}`;
    expect(notAPoint).toHaveLength(87);
    expect(looksLikeVapidPublicKey(notAPoint)).toBe(false);
  });
});

describe('/api/push-key — the endpoint', () => {
  const get = (env) => onRequestGet({ env });

  it('serves the key when the environment holds one', async () => {
    const { publicKey } = await realKeys();
    const res = await get({ VAPID_PUBLIC_KEY: publicKey });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ configured: true, publicKey });
  });

  it('says NOT CONFIGURED — not an error — when nothing is set', async () => {
    // A 500 here would light up error surfaces on a site that simply has not
    // been set up yet. "Nobody configured this" is a state, not a failure.
    const res = await get({});
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ configured: false, reason: 'unset' });
  });

  it('says NOT CONFIGURED for a malformed key rather than serving it', async () => {
    const res = await get({ VAPID_PUBLIC_KEY: 'changeme' });
    await expect(res.json()).resolves.toEqual({ configured: false, reason: 'malformed' });
  });

  it('NEVER returns the private half, even though it is right there in env', async () => {
    const { publicKey, privateKey } = await realKeys();
    const res = await get({ VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey, VAPID_SUBJECT: 'mailto:x@y.z' });
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain(privateKey);
    expect(text).not.toContain('mailto:x@y.z');
  });

  it('an unconfigured answer is never cached — the moment it IS set, clients see it', async () => {
    expect((await get({})).headers.get('cache-control')).toBe('no-store');
    const { publicKey } = await realKeys();
    expect((await get({ VAPID_PUBLIC_KEY: publicKey })).headers.get('cache-control')).toContain('max-age=300');
  });
});

describe('fetchVapidPublicKey — the client half', () => {
  it('asks the same-origin endpoint and returns the key', async () => {
    const { publicKey } = await realKeys();
    const f = fetchOf(async () => reply({ configured: true, publicKey }));
    await expect(fetchVapidPublicKey({ fetchImpl: f, fallback: '' })).resolves.toBe(publicKey);
    expect(f.calls[0].url).toBe(PUSH_KEY_URL);
    expect(PUSH_KEY_URL.startsWith('/')).toBe(true);
  });

  it('PROVEN-TO-CATCH: an explicit configured:false does NOT fall back to the build-time key', async () => {
    // THE DRIFT CASE. The environment that signs has no public half; the bundle
    // still carries a stale one. Using it would produce subscriptions the
    // sender can never satisfy — a silent, permanent, invisible failure. The
    // server's answer is authoritative.
    const stale = (await realKeys()).publicKey;
    const f = fetchOf(async () => reply({ configured: false, reason: 'unset' }));
    await expect(fetchVapidPublicKey({ fetchImpl: f, fallback: stale })).resolves.toBe('');
  });

  it('falls back to the build-time key when the endpoint is UNREACHABLE', async () => {
    // Unreachable is different from answered-false: here the server said
    // nothing, so the last known-good key is better than no notifications.
    const { publicKey } = await realKeys();
    const f = fetchOf(async () => { throw new Error('offline'); });
    await expect(fetchVapidPublicKey({ fetchImpl: f, fallback: publicKey })).resolves.toBe(publicKey);
  });

  it('refuses a malformed key from either source', async () => {
    const f = fetchOf(async () => reply({ configured: true, publicKey: 'changeme' }));
    await expect(fetchVapidPublicKey({ fetchImpl: f, fallback: '' })).resolves.toBe('');
    const g = fetchOf(async () => { throw new Error('offline'); });
    await expect(fetchVapidPublicKey({ fetchImpl: g, fallback: 'changeme' })).resolves.toBe('');
  });

  it('NEVER THROWS on a non-JSON or 5xx reply', async () => {
    const bad = fetchOf(async () => ({ ok: true, status: 200, json: async () => { throw new Error('html'); } }));
    await expect(fetchVapidPublicKey({ fetchImpl: bad, fallback: '' })).resolves.toBe('');
    const five = fetchOf(async () => reply({}, 500));
    await expect(fetchVapidPublicKey({ fetchImpl: five, fallback: '' })).resolves.toBe('');
  });

  it('memoises SUCCESS but not failure — a bad moment at startup must be retryable', async () => {
    const { publicKey } = await realKeys();
    const failing = fetchOf(async () => { throw new Error('offline'); });
    await fetchVapidPublicKey({ fetchImpl: failing, fallback: '' });
    await fetchVapidPublicKey({ fetchImpl: failing, fallback: '' });
    expect(failing.calls, 'a failed lookup must be retried, not cached').toHaveLength(2);

    const ok = fetchOf(async () => reply({ configured: true, publicKey }));
    await fetchVapidPublicKey({ fetchImpl: ok, fallback: '' });
    await fetchVapidPublicKey({ fetchImpl: ok, fallback: '' });
    expect(ok.calls, 'a resolved key is asked for once per page').toHaveLength(1);
  });
});

describe('the control resolves its key from the server', () => {
  let container; let root;

  const fakeWin = () => ({
    navigator: { serviceWorker: { addEventListener() {}, removeEventListener() {} } },
    PushManager: function PushManager() {},
    Notification: { permission: 'default' },
  });
  const fakeRegistration = () => ({ pushManager: { getSubscription: async () => null } });
  const fakeSupabase = () => ({ auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) } });

  const mount = async (props) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(PushNotifications, {
        registration: fakeRegistration(), supabase: fakeSupabase(), win: fakeWin(),
        resolveInstanceId: async () => 'inst-1', ...props,
      }));
    });
    return container;
  };

  it('renders the control once the endpoint answers with a key', async () => {
    const { publicKey } = await realKeys();
    global.fetch = fetchOf(async () => reply({ configured: true, publicKey }));
    await mount({});
    expect(container.querySelector('button'), 'a configured site must offer the control').toBeTruthy();
    await act(async () => { root.unmount(); });
  });

  it('renders NOTHING when the endpoint says the site is not configured', async () => {
    global.fetch = fetchOf(async () => reply({ configured: false, reason: 'unset' }));
    await mount({});
    expect(container.textContent).toBe('');
    await act(async () => { root.unmount(); });
  });

  it('an explicit prop still wins, and asks the endpoint NOTHING', async () => {
    // The suite's injection seam, and the belt-and-braces path for a surface
    // that already has the key.
    const { publicKey } = await realKeys();
    const f = fetchOf(async () => reply({ configured: false }));
    global.fetch = f;
    await mount({ vapidPublicKey: publicKey });
    expect(container.querySelector('button')).toBeTruthy();
    expect(f.calls, 'a supplied key must not trigger a lookup').toHaveLength(0);
    await act(async () => { root.unmount(); });
  });
});
