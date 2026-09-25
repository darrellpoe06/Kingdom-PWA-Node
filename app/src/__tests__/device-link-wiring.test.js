// @vitest-environment node
// =============================================================================
// The television signs in from the phone in your hand: the wiring (DR-0658)
// =============================================================================
// Darrell on the Fire TV, 2026-09-25 02:30 UTC: "Hard to sign in on a
// Firestick... what happened to the qr code ways?" device-link.js was written
// on 2026-09-20 and nothing called it. This gates the pieces that now do:
// the TV detector that decides which door leads, the hash the TV and the
// server must agree on, the Pages Function that turns an approval into a
// session, the /link route, and the client calls in between.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  isTvClass, deviceLabel, hashDeviceCode, isDeviceCode, isUserCode, newDeviceCode,
  stashLinkCode, readLinkStash, clearLinkStash, LINK_STASH_KEY, LINK_TTL_MS, askedAgo,
} from '../lib/device-link.js';
import { startLink, pollLink, claimLink, describeLink, decideLink, linkErrorMessage } from '../lib/device-link-client.js';
import { onRequestPost, onRequestGet } from '../../functions/api/device-link.js';
import { linkDestination, onRequest as linkRoute } from '../../functions/link.js';

const FIRE_TV = 'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633.3445N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.102 Silk/130.4.1 like Chrome/130.0.6723.102 Safari/537.36';
const FIRE_TABLET = 'Mozilla/5.0 (Linux; Android 11; KFTRWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120.3.1 like Chrome/120.0.6099.230 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

describe('which door leads: is this a television?', () => {
  it('a Fire TV Stick in Silk is a television', () => {
    expect(isTvClass({ userAgent: FIRE_TV, maxTouchPoints: 0, width: 960 })).toBe(true);
  });
  it('a Fire TABLET in Silk is not (it has a touchscreen)', () => {
    expect(isTvClass({ userAgent: FIRE_TABLET, maxTouchPoints: 5, width: 800 })).toBe(false);
  });
  it('a phone and a desktop with a mouse are not', () => {
    expect(isTvClass({ userAgent: IPHONE, maxTouchPoints: 5, width: 390 })).toBe(false);
    expect(isTvClass({ userAgent: DESKTOP, maxTouchPoints: 0, width: 1920, anyFinePointer: true })).toBe(false);
  });
  it('a big screen with nothing to tap and nothing to click is a television', () => {
    expect(isTvClass({ userAgent: 'SomeTVBrowser/1.0', maxTouchPoints: 0, width: 1280, anyFinePointer: false })).toBe(true);
  });
  it('the phone is told which screen is asking', () => {
    expect(deviceLabel(FIRE_TV)).toBe('Fire TV');
    expect(deviceLabel(FIRE_TABLET)).toBe('a tablet');
    expect(deviceLabel(DESKTOP)).toBe('a computer');
  });
  it('asked-ago reads like a person', () => {
    const now = Date.parse('2026-09-25T02:40:00Z');
    expect(askedAgo('2026-09-25T02:39:40Z', now)).toBe('just now');
    expect(askedAgo('2026-09-25T02:38:00Z', now)).toBe('2 minutes ago');
  });
});

describe('the hash the TV and the server must agree on', () => {
  it('is SHA-256 hex (the FIPS "abc" vector)', async () => {
    expect(await hashDeviceCode('abc', webcrypto)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('a device_code is 64 hex; a user_code is not one', () => {
    const dc = newDeviceCode(webcrypto);
    expect(isDeviceCode(dc)).toBe(true);
    expect(isDeviceCode('ACDEFGHJ')).toBe(false);
    expect(isUserCode('ACDEFGHJ')).toBe(true);
    expect(isUserCode('ACDE-FGHJ')).toBe(false);
  });
});

describe('the Google redirect stash', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m }; };
  it('keeps a code across the redirect and drops it after the link would be dead', () => {
    const s = mem();
    stashLinkCode(s, 'ACDEFGHJ', 1000);
    expect(readLinkStash(s, 2000)).toBe('ACDEFGHJ');
    expect(readLinkStash(s, 1000 + LINK_TTL_MS)).toBe('');
    expect(s.m.has(LINK_STASH_KEY)).toBe(false);
  });
  it('never stashes a malformed code, and clears on demand', () => {
    const s = mem();
    stashLinkCode(s, 'nope', 1);
    expect(s.m.size).toBe(0);
    stashLinkCode(s, 'ACDEFGHJ', 1);
    clearLinkStash(s);
    expect(s.m.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// The Pages Function, against a fake Supabase that records every call.
// ---------------------------------------------------------------------------
const ENV = { SUPABASE_URL: 'https://nas.example/sb', SUPABASE_SERVICE_KEY: 'svc' };
const req = (body) => ({ request: new Request('https://poetech.us/api/device-link', { method: 'POST', body: JSON.stringify(body) }), env: ENV });

function fakeSupabase({ claimRows = [{ user_id: 'u-1' }], pollState = 'pending', email = 'darrell@example.com' } = {}) {
  const calls = [];
  const fetchImpl = vi.fn(async (url, init = {}) => {
    const u = String(url);
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ u, body, headers: init.headers || {} });
    const ok = (v) => new Response(JSON.stringify(v), { status: 200 });
    if (u.endsWith('/rest/v1/rpc/device_link_claim')) return ok(claimRows);
    if (u.endsWith('/rest/v1/rpc/device_link_poll')) return ok([{ state: pollState }]);
    if (u.includes('/auth/v1/admin/users/')) return ok({ id: 'u-1', email });
    if (u.endsWith('/auth/v1/admin/generate_link')) return ok({ hashed_token: 'th-1', properties: { hashed_token: 'th-1' } });
    if (u.endsWith('/auth/v1/verify')) return ok({ access_token: 'at', refresh_token: 'rt' });
    return new Response('{}', { status: 404 });
  });
  return { fetchImpl, calls };
}

describe('/api/device-link turns an approval into a session, once', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('says whether it is wired and can reach auth and the database: status codes, never a value', async () => {
    const f = fakeSupabase();
    vi.stubGlobal('fetch', f.fetchImpl);
    // The fake answers the admin user list at /admin/users/ only, so give it that path.
    f.fetchImpl.mockImplementationOnce(async () => new Response('{"users":[]}', { status: 200 }));
    const res = await onRequestGet({ env: ENV });
    const body = await res.json();
    expect(body).toEqual({ ok: true, configured: true, ready: true, auth: 200, db: 200 });
    expect(JSON.stringify(body)).not.toContain('svc');
    const off = await onRequestGet({ env: {} });
    expect(await off.json()).toEqual({ ok: true, configured: false, ready: false });
  });

  it('a gateway that refuses the admin route reads as not ready', async () => {
    vi.stubGlobal('fetch', vi.fn(async (u) => new Response('{}', { status: String(u).includes('/auth/v1/admin/') ? 401 : 200 })));
    const body = await (await onRequestGet({ env: ENV })).json();
    expect(body).toMatchObject({ ready: false, auth: 401, db: 200 });
  });

  it('refuses to run without its keys (not-configured, 503)', async () => {
    const res = await onRequestPost({ request: new Request('https://x/api/device-link', { method: 'POST', body: '{}' }), env: {} });
    expect(res.status).toBe(503);
  });

  it('the user_code alone claims nothing: it is refused before any database call', async () => {
    const f = fakeSupabase();
    vi.stubGlobal('fetch', f.fetchImpl);
    const res = await onRequestPost(req({ device_code: 'ACDEFGHJ' }));
    expect(res.status).toBe(400);
    expect(f.calls.length).toBe(0);
  });

  it('claims by the SHA-256 of the device_code, never by the code itself', async () => {
    const f = fakeSupabase();
    vi.stubGlobal('fetch', f.fetchImpl);
    const code = newDeviceCode(webcrypto);
    await onRequestPost(req({ device_code: code }));
    const claim = f.calls.find((c) => c.u.endsWith('device_link_claim'));
    expect(claim.body.p_device_hash).toBe(await hashDeviceCode(code, webcrypto));
    expect(JSON.stringify(f.calls)).not.toContain(code);
    expect(claim.headers.Authorization).toBe('Bearer svc');
  });

  it('approved: claim, then the account, then a one-time link, then the session', async () => {
    const f = fakeSupabase();
    vi.stubGlobal('fetch', f.fetchImpl);
    const res = await onRequestPost(req({ device_code: newDeviceCode(webcrypto) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ access_token: 'at', refresh_token: 'rt' });
    const order = f.calls.map((c) => c.u.replace('https://nas.example/sb', ''));
    expect(order).toEqual([
      '/rest/v1/rpc/device_link_claim',
      '/auth/v1/admin/users/u-1',
      '/auth/v1/admin/generate_link',
      '/auth/v1/verify',
    ]);
    expect(f.calls[2].body).toEqual({ type: 'magiclink', email: 'darrell@example.com' });
    expect(f.calls[3].body).toEqual({ type: 'magiclink', token_hash: 'th-1' });
  });

  it('nothing to claim (denied, expired, used, pending): no session is minted, and the TV is told why', async () => {
    for (const state of ['denied', 'expired', 'consumed', 'pending']) {
      const f = fakeSupabase({ claimRows: [], pollState: state });
      vi.stubGlobal('fetch', f.fetchImpl);
      const res = await onRequestPost(req({ device_code: newDeviceCode(webcrypto) }));
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'not-claimable', state });
      expect(f.calls.some((c) => c.u.includes('/auth/v1/')), `${state} reached auth`).toBe(false);
    }
  });

  it('an account with no email is refused rather than guessed at', async () => {
    const f = fakeSupabase({ email: '' });
    vi.stubGlobal('fetch', f.fetchImpl);
    const res = await onRequestPost(req({ device_code: newDeviceCode(webcrypto) }));
    expect(res.status).toBe(422);
    expect(f.calls.some((c) => c.u.endsWith('generate_link'))).toBe(false);
  });
});

describe('/link sends the phone into the app with a clean code', () => {
  it('normalizes a hand-typed code (dashes, case, lookalikes)', () => {
    expect(linkDestination('https://poetech.us/link?c=acde-fghj')).toBe('https://poetech.us/poetech-app/?link=ACDEFGHJ');
    expect(linkDestination('https://poetech.us/link?c=ACDE%20FGH1')).toBe('https://poetech.us/poetech-app/?link=ACDEFGHJ');
  });
  it('no code still opens the approval screen, where it can be typed', async () => {
    expect(linkDestination('https://poetech.us/link')).toBe('https://poetech.us/poetech-app/?link=1');
    const res = await linkRoute({ request: new Request('https://poetech.us/link?c=ACDEFGHJ') });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://poetech.us/poetech-app/?link=ACDEFGHJ');
  });
});

describe('the client calls', () => {
  const rpcClient = (impl) => ({ rpc: vi.fn(impl) });

  it('start sends only the hash, and retries a short-code collision', async () => {
    let n = 0;
    const sb = rpcClient(async (name, args) => {
      n += 1;
      if (n === 1) return { data: null, error: { code: '23505', message: 'duplicate' } };
      return { data: [{ user_code: args.p_user_code, expires_at: '2026-09-25T03:00:00Z' }], error: null };
    });
    const l = await startLink(sb, { userAgent: FIRE_TV, crypto: webcrypto });
    expect(n).toBe(2);
    const args = sb.rpc.mock.calls[1][1];
    expect(args.p_device_hash).toBe(l.deviceHash);
    expect(args.p_device_hash).not.toBe(l.deviceCode);
    expect(JSON.stringify(sb.rpc.mock.calls)).not.toContain(l.deviceCode);
    expect(args.p_label).toBe('Fire TV');
  });

  it('a rate-limit is not retried, and reads as a sentence', async () => {
    const sb = rpcClient(async () => ({ data: null, error: { code: 'P0001', message: 'rate-limited' } }));
    await expect(startLink(sb, { crypto: webcrypto })).rejects.toMatchObject({ message: 'rate-limited' });
    expect(sb.rpc).toHaveBeenCalledTimes(1);
    expect(linkErrorMessage({ message: 'rate-limited' })).toMatch(/Wait a minute/);
  });

  it('poll never invents an approval from a failure', async () => {
    expect(await pollLink(rpcClient(async () => ({ data: null, error: { message: 'x' } })), 'h')).toBe('unknown');
    expect(await pollLink(rpcClient(async () => ({ data: [{ state: 'approved' }], error: null })), 'h')).toBe('approved');
    expect(await pollLink(rpcClient(async () => ({ data: [{ state: 'weird' }], error: null })), 'h')).toBe('unknown');
  });

  it('claim posts the raw code to our own endpoint and hands back the pair', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r' }), { status: 200 }));
    const res = await claimLink('d'.repeat(64), { fetchImpl: f });
    expect(res).toEqual({ ok: true, session: { access_token: 'a', refresh_token: 'r' } });
    expect(f.mock.calls[0][0]).toBe('/api/device-link');
    const bad = await claimLink('d'.repeat(64), { fetchImpl: vi.fn(async () => new Response(JSON.stringify({ error: 'not-claimable', state: 'denied' }), { status: 409 })) });
    expect(bad).toMatchObject({ ok: false, error: 'not-claimable', status: 409 });
  });

  it('the phone never sends a malformed code to the database', async () => {
    const sb = rpcClient(async () => ({ data: true, error: null }));
    expect(await describeLink(sb, 'ACDE-FGHJ')).toBe(null);
    expect(await decideLink(sb, 'bad', true)).toBe(false);
    expect(sb.rpc).not.toHaveBeenCalled();
    expect(await decideLink(sb, 'ACDEFGHJ', true)).toBe(true);
  });
});
