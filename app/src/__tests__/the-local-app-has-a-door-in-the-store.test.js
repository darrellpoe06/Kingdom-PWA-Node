// =============================================================================
// The local app has a door in the store (DR-0573)
// =============================================================================
// DR-0570's queue, item 2: "Surface it in the app. The PoeTech App Store offers
// the TWA packages; a 'local app' door appears there ONLY once the shelf holds
// a real package — an in-app button to a 404 is the defect the shelf gate
// exists to catch." Run 3 of native-shell.yml (35805849172) published five of
// five to android-native-latest, read back from the shelf. So the door opens.
//
// What this file holds: the door serves BOTH lanes through one allowlist
// (no user input reaches the upstream URL); every store row points its local
// button through the same-origin door at the id brands.json builds; the
// surface renders the button and says what the local app is and is not; and
// the native lane now carries the same shelf gate the TWA lane has.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { brandFromParam, shelfFor, onRequestGet } from '../../functions/store/apk/[brand].js';
import { APP_STORE, APK_DOOR_BASE, APK_LOCAL_SUFFIX, INSTALL_STEPS, LOCAL_APP_NOTE } from '../lib/app-store.js';
import { readBrands } from '../../native/stage.mjs';
import AppStore from '../components/AppStore.jsx';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = join(here, '../../..');
const read = (rel) => readFileSync(join(REPO, rel), 'utf8');
const noCache = { match: async () => undefined, put: async () => {} };
beforeEach(() => { vi.stubGlobal('caches', { default: noCache }); });
afterEach(() => vi.unstubAllGlobals());
const ctx = (brand) => ({ params: { brand }, request: new Request(`https://poetech.us/store/apk/${brand}`), waitUntil: () => {} });

describe('one door, two shelves, one allowlist', () => {
  it('serves <brand>-local.apk for exactly the family brands, and nothing else', () => {
    for (const b of ['poetech', 'lovecorner', 'tlc', 'moore', 'properties']) {
      expect(brandFromParam(`${b}-local.apk`)).toBe(`${b}-local`);
      expect(brandFromParam(`${b}-local`)).toBe(`${b}-local`);
      expect(brandFromParam(`${b}.apk`)).toBe(b); // the TWA door is untouched
    }
    expect(brandFromParam('evil-local.apk')).toBeNull();
    expect(brandFromParam('-local.apk')).toBeNull();
    expect(brandFromParam('poetech-local-local.apk')).toBeNull();
    expect(brandFromParam('../secrets-local')).toBeNull();
  });

  it('reads the local lane from its OWN shelf and the TWA lane from the original one', () => {
    expect(shelfFor('poetech-local')).toEqual({ lane: 'local', brand: 'poetech', url: 'https://github.com/darrellpoe06/Kingdom-PWA-Node/releases/download/android-native-latest/poetech-native.apk' });
    expect(shelfFor('poetech')).toEqual({ lane: 'twa', brand: 'poetech', url: 'https://github.com/darrellpoe06/Kingdom-PWA-Node/releases/download/android-latest/poetech.apk' });
  });

  it('fetches the local asset and serves it as an APK with an exact length', async () => {
    const bytes = new Uint8Array([0x50, 0x4b, 3, 4, 1, 2, 3]);
    let asked = '';
    vi.stubGlobal('fetch', async (url) => { asked = url; return new Response(bytes, { status: 200 }); });
    vi.stubGlobal('caches', { default: noCache });
    const res = await onRequestGet(ctx('tlc-local.apk'));
    expect(asked).toBe('https://github.com/darrellpoe06/Kingdom-PWA-Node/releases/download/android-native-latest/tlc-native.apk');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/vnd.android.package-archive');
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="tlc-local.apk"');
    expect(res.headers.get('Content-Length')).toBe(String(bytes.byteLength));
  });

  it('an empty local shelf says so in its own words, never a gateway error', async () => {
    vi.stubGlobal('fetch', async () => new Response('Not Found', { status: 404 }));
    vi.stubGlobal('caches', { default: noCache });
    const res = await onRequestGet(ctx('moore-local.apk'));
    expect(res.status).toBe(404);
    expect(await res.text()).toMatch(/site is fine/i);
  });
});

describe('every store row walks through the door to the id the lane builds', () => {
  const brands = readBrands();

  it('the local link is same-origin, suffixed, and served', () => {
    for (const a of APP_STORE) {
      expect(a.apkLocal).toBe(`${APK_DOOR_BASE}/${a.key}${APK_LOCAL_SUFFIX}.apk`);
      expect(a.apkLocal.startsWith('/store/apk/')).toBe(true);
      expect(brandFromParam(`${a.key}${APK_LOCAL_SUFFIX}.apk`)).toBe(`${a.key}${APK_LOCAL_SUFFIX}`);
    }
  });

  it('the local package id on the store row IS the id brands.json builds', () => {
    for (const a of APP_STORE) {
      const b = brands.find((x) => x.key === a.key);
      expect(b, `${a.key} is not in brands.json`).toBeTruthy();
      expect(a.packageIdLocal).toBe(b.appId);
      expect(a.packageIdLocal).toBe(`${a.packageId}.local`);
    }
  });

  it('the shelf the door reads is the shelf the lane publishes to', () => {
    const lane = read('.github/workflows/native-shell.yml');
    expect(lane).toMatch(/gh release upload android-native-latest "\$\{\{ matrix\.brand \}\}-native\.apk"/);
    expect(shelfFor('poetech-local').url).toContain('/android-native-latest/poetech-native.apk');
  });

  it('the native lane now carries the shelf gate the TWA lane has', () => {
    const lane = read('.github/workflows/native-shell.yml');
    expect(lane).toMatch(/^\s+shelf:\n\s+needs: build\n\s+if: always\(\)/m);
    expect(lane).toMatch(/\*",\$key-native\.apk,"\*\)/);
    expect(lane).toMatch(/grep -oP "\^\\s\+key: '\\K\[a-z\]\+" app\/src\/lib\/app-store\.js/);
  });
});

describe('the surface says what the local app is, and is not', () => {
  const html = renderToStaticMarkup(React.createElement(AppStore));

  it('renders a local button for every brand, pointing through the door', () => {
    for (const a of APP_STORE) {
      expect(html).toContain(`data-testid="apk-local-${a.key}"`);
      expect(html).toContain(`href="${a.apkLocal}"`);
    }
    expect((html.match(/Try the local app/g) || []).length).toBe(APP_STORE.length);
  });

  it('the Android (TWA) button is still there — both lanes are kept', () => {
    expect((html.match(/Download Android app/g) || []).length).toBe(APP_STORE.length);
    for (const a of APP_STORE) expect(html).toContain(`href="${a.apk}"`);
  });

  it('the note states the what, the why, and the limit — no promise the shelf has not kept', () => {
    expect(LOCAL_APP_NOTE.what).toMatch(/whole app inside the package/);
    expect(LOCAL_APP_NOTE.why).toMatch(/beside the Android app/i);
    expect(LOCAL_APP_NOTE.limit).toMatch(/Google sign-in and notifications are not in it yet/);
    expect(INSTALL_STEPS.local.join(' ')).toMatch(/BESIDE the Android app/);
    expect(INSTALL_STEPS.local.join(' ')).toMatch(/about 20 MB/);
  });
});
