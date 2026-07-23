// =============================================================================
// /store/apk/<brand>.apk — the App Store's same-origin download door, proven
// (measured 2026-07-23: the direct GitHub redirect chain stranded Chrome-on-
// Android at 100% and the installer never fired; this door is the fix).
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { brandFromParam, onRequestGet } from '../../functions/store/apk/[brand].js';
import { APP_STORE, APK_DOOR_BASE } from '../lib/app-store.js';

const noCache = { match: async () => undefined, put: async () => {} };
beforeEach(() => { vi.stubGlobal('caches', { default: noCache }); });
afterEach(() => vi.unstubAllGlobals());

const ctx = (brand) => ({
  params: { brand },
  request: new Request(`https://poetech.us/store/apk/${brand}`),
  waitUntil: () => {},
});

describe('brandFromParam — allowlist only, .apk suffix tolerated', () => {
  it('accepts exactly the four family brands, with or without .apk', () => {
    for (const b of ['poetech', 'lovecorner', 'tlc', 'moore']) {
      expect(brandFromParam(b)).toBe(b);
      expect(brandFromParam(`${b}.apk`)).toBe(b);
    }
  });
  it('rejects anything else — the upstream URL can never be steered (SSRF guard)', () => {
    expect(brandFromParam('evil')).toBeNull();
    expect(brandFromParam('../secrets')).toBeNull();
    expect(brandFromParam('')).toBeNull();
    expect(brandFromParam(undefined)).toBeNull();
  });
});

describe('the door', () => {
  it('404s an unknown brand without ever fetching upstream', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('caches', { default: noCache });
    const res = await onRequestGet(ctx('mystery.apk'));
    expect(res.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('serves the release bytes with exact length + APK headers (the finalize fix)', async () => {
    const bytes = new Uint8Array([0x50, 0x4b, 3, 4, 9, 9]); // zip magic + junk
    vi.stubGlobal('fetch', async (url) => {
      expect(url).toBe('https://github.com/darrellpoe06/Kingdom-PWA-Node/releases/download/android-latest/poetech.apk');
      return new Response(bytes, { status: 200 });
    });
    vi.stubGlobal('caches', { default: noCache });
    const res = await onRequestGet(ctx('poetech.apk'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/vnd.android.package-archive');
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="poetech.apk"');
    expect(res.headers.get('Content-Length')).toBe(String(bytes.byteLength));
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
  });

  it('answers 502 honestly when the release is unreachable or missing', async () => {
    vi.stubGlobal('fetch', async () => new Response('nope', { status: 404 }));
    vi.stubGlobal('caches', { default: noCache });
    expect((await onRequestGet(ctx('tlc.apk'))).status).toBe(502);
    vi.stubGlobal('fetch', async () => { throw new Error('net down'); });
    expect((await onRequestGet(ctx('tlc.apk'))).status).toBe(502);
  });
});

describe('the store records walk through the door', () => {
  it('every APP_STORE apk link is same-origin via APK_DOOR_BASE and matches a served brand', () => {
    for (const a of APP_STORE) {
      expect(a.apk).toBe(`${APK_DOOR_BASE}/${a.key}.apk`);
      expect(a.apk.startsWith('/store/apk/')).toBe(true); // no cross-origin redirect chain
      expect(brandFromParam(`${a.key}.apk`)).toBe(a.key); // the door actually serves it
    }
  });
});
