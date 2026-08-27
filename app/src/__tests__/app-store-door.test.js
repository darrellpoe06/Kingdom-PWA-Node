// =============================================================================
// /store/apk/<brand>.apk — the App Store's same-origin download door, proven
// (measured 2026-07-23: the direct GitHub redirect chain stranded Chrome-on-
// Android at 100% and the installer never fired; this door is the fix).
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { brandFromParam, onRequestGet } from '../../functions/store/apk/[brand].js';
import { APP_STORE, APK_DOOR_BASE } from '../lib/app-store.js';

const here = dirname(fileURLToPath(import.meta.url));
const noCache = { match: async () => undefined, put: async () => {} };
beforeEach(() => { vi.stubGlobal('caches', { default: noCache }); });
afterEach(() => vi.unstubAllGlobals());

const ctx = (brand) => ({
  params: { brand },
  request: new Request(`https://poetech.us/store/apk/${brand}`),
  waitUntil: () => {},
});

describe('brandFromParam — allowlist only, .apk suffix tolerated', () => {
  it('accepts exactly the family brands, with or without .apk', () => {
    // DR-0313 added `properties` as the fifth. Derived from the shelf itself so
    // a sixth app cannot be listed in the store while the door 404s it.
    for (const b of ['poetech', 'lovecorner', 'tlc', 'moore', 'properties']) {
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

describe('every app on the shelf is REALLY downloadable (DR-0313)', () => {
  // A store row is a promise. Three things have to agree or the promise breaks:
  // the shelf lists it, the door serves it, and the Android lane BUILDS it —
  // otherwise the button downloads a 502 (worse than no button at all).
  it('the Android lane builds a package for every app the store lists', () => {
    const lane = readFileSync(join(here, '../../../.github/workflows/android-package.yml'), 'utf8');
    for (const a of APP_STORE) {
      expect(lane.includes(`- brand: ${a.key}`), `the store lists ${a.name} but the Android lane never builds ${a.key}.apk`).toBe(true);
      expect(lane.includes(`package_id: ${a.packageId}`), `${a.name}: the lane's package id does not match the shelf's`).toBe(true);
    }
  });

  it('every listed app has a real icon file on the origin it points at', () => {
    for (const a of APP_STORE) {
      expect(existsSync(join(here, '../../public/', a.icon)), `${a.name}: icon ${a.icon} does not exist`).toBe(true);
    }
  });

  it('Poe Properties launches its OWN scope, not a query on PoeTech\'s', () => {
    const lane = readFileSync(join(here, '../../../.github/workflows/android-package.yml'), 'utf8');
    const block = lane.slice(lane.indexOf('- brand: properties'));
    expect(block).toMatch(/start_url: \/properties\/app\//);
    expect(block).toMatch(/web_manifest: https:\/\/poetech\.us\/manifest-properties\.webmanifest/);
    const manifest = JSON.parse(readFileSync(join(here, '../../public/manifest-properties.webmanifest'), 'utf8'));
    // The TWA's start_url must live inside the manifest scope, or the installed
    // app opens OUTSIDE itself and Android shows the browser chrome.
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);
    expect('/properties/app/?properties=1'.startsWith(manifest.scope)).toBe(true);
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
