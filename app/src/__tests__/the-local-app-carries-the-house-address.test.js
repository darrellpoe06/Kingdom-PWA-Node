// The local app carries the house's address (DR-0570).
//
// Darrell, 2026-09-22, after a voice read failed on a device the browser could
// not provision: "Let's make it a feature of downloading the app... all the
// bells and whistles come from a local download... Let's do the native shell...
// Don't undermine what we have however let's invest time and energy in our own
// local app... We don't have to pick either or... just need to plan for both."
//
// So there are TWO lanes and this file pins that both stay whole:
//
//   · The web / TWA lane is byte-for-byte untouched — the base is still
//     '/poetech-app/', the transports are still relative, main.jsx installs
//     nothing on the web, the TWA workflow and its shelf are not mentioned.
//   · The native lane builds the SAME app at base '/', ships it INSIDE the
//     package, and re-homes every same-origin NAS route to poetech.us from
//     inside the shell — the one thing a bundle served from the device cannot
//     do for itself.
//
// The re-homed route list is compared against app/functions on disk in BOTH
// directions, so a Pages Function added tomorrow that the shell cannot reach
// fails here today.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  HOUSE_ORIGIN, REHOMED_ROUTES, isNativeShell, isHouseRoute, rehomeUrl, rehome, installNativeShell,
} from '../lib/native-shell.js';
import {
  readBrands, brandFor, startFile, doorScript, injectDoor, capacitorConfigFor,
} from '../../native/stage.mjs';
import { APP_STORE } from '../lib/app-store.js';

const APP = resolve(__dirname, '../..');
const REPO = resolve(APP, '..');
const read = (p) => readFileSync(p, 'utf8');
const MAIN = read(join(APP, 'src/main.jsx'));
const VITE = read(join(APP, 'vite.config.js'));
const WORKFLOW = read(join(REPO, '.github/workflows/native-shell.yml'));
const TWA_WORKFLOW = read(join(REPO, '.github/workflows/android-package.yml'));
const PKG = JSON.parse(read(join(APP, 'package.json')));

const nativeWin = (fetchImpl) => ({
  Capacitor: { isNativePlatform: () => true },
  location: { href: 'https://localhost/' },
  fetch: fetchImpl,
});
const webWin = (fetchImpl) => ({ location: { href: 'https://poetech.us/poetech-app/' }, fetch: fetchImpl });

describe('the web is left exactly as it was', () => {
  it('a browser (no Capacitor runtime) is not the shell', () => {
    expect(isNativeShell(webWin(() => {}))).toBe(false);
    expect(isNativeShell(undefined)).toBe(false);
    expect(isNativeShell({ Capacitor: { isNativePlatform: () => false } })).toBe(false);
  });

  it('installNativeShell touches nothing on the web', () => {
    const f = () => 'web';
    const w = webWin(f);
    expect(installNativeShell(w)).toBe(false);
    expect(w.fetch).toBe(f);
    expect(w.__PT_NATIVE_SHELL).toBeUndefined();
  });

  it('the web build base is still /poetech-app/ by default', () => {
    expect(VITE).toMatch(/const NATIVE_SHELL = process\.env\.PT_NATIVE_SHELL === '1';/);
    expect(VITE).toMatch(/const BASE = NATIVE_SHELL \? '\/' : '\/poetech-app\/';/);
    expect(VITE).toMatch(/^\s*base: BASE,/m);
    // The modulepreload href follows the same base — two builds, one layout rule.
    expect(VITE).toMatch(/'__MONOLITH_PRELOAD_HREF__', BASE \+ fileName/);
    expect(VITE).not.toMatch(/'__MONOLITH_PRELOAD_HREF__', '\/poetech-app\/' \+ fileName/);
  });

  it('the TWA lane and its shelf are untouched by the native lane', () => {
    expect(WORKFLOW).toMatch(/android-native-latest/);
    expect(WORKFLOW).not.toMatch(/gh release upload android-latest\b/);
    expect(TWA_WORKFLOW).toMatch(/gh release upload android-latest /);
    expect(TWA_WORKFLOW).not.toMatch(/native/i);
  });

  it('the web bundle never imports Capacitor — the runtime is injected by the shell, not shipped to every browser', () => {
    expect(PKG.dependencies['@capacitor/core']).toBeUndefined();
    expect(PKG.devDependencies['@capacitor/core']).toBeTruthy();
    expect(PKG.devDependencies['@capacitor/android']).toBeTruthy();
    expect(PKG.devDependencies['@capacitor/cli']).toBeTruthy();
    const src = read(join(APP, 'src/lib/native-shell.js'));
    expect(src).not.toMatch(/from '@capacitor/);
  });
});

describe('inside the shell, the house routes leave for the house', () => {
  it('REPRODUCES THE FAULT: a relative NAS route resolved from the device is a 404 waiting to happen', () => {
    const local = new URL('/voice/speak', 'https://localhost/').href;
    expect(local).toBe('https://localhost/voice/speak');
    // …and after re-homing it is the house's own door.
    expect(rehomeUrl('/voice/speak', 'https://localhost/')).toBe(`${HOUSE_ORIGIN}/voice/speak`);
  });

  it('every transport the modules use is re-homed, query intact', () => {
    for (const p of ['/voice/speak', '/voice/health', '/api/voice-speak', '/api/push-key', '/llm/chat',
      '/nas-photos/property-photos/x.jpg', '/ways/brain.json', '/store/apk/poetech.apk', '/sb/auth/v1/token?grant_type=password',
      '/poetech-app/taxes/upload', '/scribe/x', '/reviews/feed', '/wake-orchestrator', '/review-feed?since=1']) {
      const out = rehomeUrl(p, 'https://localhost/');
      expect(out.startsWith(HOUSE_ORIGIN + '/')).toBe(true);
      expect(out).toBe(HOUSE_ORIGIN + p);
    }
  });

  it('local files stay local — the bundle is on the device', () => {
    for (const p of ['/assets/main-abc.js', '/bible/kjv/John.json', '/emoji/x.svg', '/games/heritage/a.jpg',
      '/index.html', '/lovecorner/app/index.html', '/', '/poetech-app/assets/x.js', '/manifest.webmanifest']) {
      expect(rehomeUrl(p, 'https://localhost/')).toBe(p);
    }
  });

  it('another origin and a non-http scheme are never rewritten', () => {
    for (const u of ['https://poetech.us/sb/rest/v1/x', 'https://example.org/n8n/x', 'http://192.168.1.26:5678/x',
      'data:text/plain,hi', 'blob:https://localhost/abc']) {
      expect(rehomeUrl(u, 'https://localhost/')).toBe(u);
    }
  });

  it('an absolute URL on the LOCAL origin is the same thing as a relative one', () => {
    // A module that builds `${location.origin}/voice/speak` must not slip past.
    expect(rehomeUrl('https://localhost/voice/speak', 'https://localhost/')).toBe(`${HOUSE_ORIGIN}/voice/speak`);
    expect(rehomeUrl('https://localhost/assets/x.js', 'https://localhost/')).toBe('https://localhost/assets/x.js');
  });

  it('a prefix is a prefix, a file is a file — no accidental matches', () => {
    expect(isHouseRoute('/voice')).toBe(true);
    expect(isHouseRoute('/voices/x')).toBe(false);
    expect(isHouseRoute('/wake-orchestrator-control')).toBe(true);
    expect(isHouseRoute('/wake-orchestrator/x')).toBe(true);
    expect(isHouseRoute('/interesting')).toBe(false);
    expect(isHouseRoute('/apix')).toBe(false);
  });

  it('a Request object is re-homed with its method and body intact', async () => {
    const req = new Request('https://localhost/voice/speak', { method: 'POST', body: 'hello', headers: { 'x-a': '1' } });
    const out = rehome(req, 'https://localhost/');
    expect(out).toBeInstanceOf(Request);
    expect(out.url).toBe(`${HOUSE_ORIGIN}/voice/speak`);
    expect(out.method).toBe('POST');
    expect(out.headers.get('x-a')).toBe('1');
    expect(await out.text()).toBe('hello');
    const local = new Request('https://localhost/assets/x.js');
    expect(rehome(local, 'https://localhost/')).toBe(local);
  });

  it('a URL object is re-homed too', () => {
    expect(rehome(new URL('https://localhost/llm/chat'), 'https://localhost/')).toBe(`${HOUSE_ORIGIN}/llm/chat`);
    const u = new URL('https://localhost/assets/x.js');
    expect(rehome(u, 'https://localhost/')).toBe(u);
  });

  it('installs once, wraps fetch, and hands the re-homed URL to the runtime underneath', async () => {
    const seen = [];
    const w = nativeWin((r, o) => { seen.push([r, o]); return 'ok'; });
    expect(installNativeShell(w)).toBe(true);
    expect(installNativeShell(w)).toBe(false); // idempotent
    expect(await w.fetch('/voice/health', { method: 'GET' })).toBe('ok');
    expect(seen[0][0]).toBe(`${HOUSE_ORIGIN}/voice/health`);
    expect(seen[0][1]).toEqual({ method: 'GET' });
    await w.fetch('/bible/kjv/John.json');
    expect(seen[1][0]).toBe('/bible/kjv/John.json');
  });
});

describe('the route list is the Pages Functions directory, in both directions', () => {
  const FUNCTIONS = join(APP, 'functions');
  // Every route the house answers, derived from disk: a directory is a prefix,
  // a root .js file is a single route. poetech-app/assets is the asset guard
  // for files that are LOCAL in the shell, and _lib is not a route.
  const onDisk = () => {
    const out = new Set();
    for (const name of readdirSync(FUNCTIONS)) {
      if (name === '_lib') continue;
      const p = join(FUNCTIONS, name);
      if (statSync(p).isDirectory()) {
        if (name === 'poetech-app') {
          for (const sub of readdirSync(p)) {
            if (sub === 'assets') continue;
            out.add(`/poetech-app/${sub}/`);
          }
        } else {
          out.add(`/${name}/`);
        }
      } else if (name.endsWith('.js')) {
        out.add('/' + name.replace(/\.js$/, ''));
      }
    }
    return out;
  };

  it('nothing the house answers is missing from the shell, and the shell names nothing the house does not answer', () => {
    const disk = onDisk();
    const listed = new Set(REHOMED_ROUTES);
    expect([...listed].filter((r) => !disk.has(r))).toEqual([]);
    expect([...disk].filter((r) => !listed.has(r))).toEqual([]);
  });

  it('the asset guard is deliberately excluded — real files are local in the shell', () => {
    expect(existsSync(join(FUNCTIONS, 'poetech-app/assets'))).toBe(true);
    expect(REHOMED_ROUTES.some((r) => r.startsWith('/poetech-app/assets'))).toBe(false);
    expect(isHouseRoute('/poetech-app/assets/main.js')).toBe(false);
  });
});

describe('main.jsx wires the shell first and skips the service worker inside it', () => {
  it('installs before anything else can fetch', () => {
    const install = MAIN.indexOf('installNativeShell(window);');
    expect(install).toBeGreaterThan(0);
    expect(install).toBeLessThan(MAIN.indexOf('captureDeepLink();'));
    expect(install).toBeLessThan(MAIN.indexOf('wireChunkHeal(window);'));
  });

  it('the service worker is not registered inside the shell — the shell IS the offline shell', () => {
    expect(MAIN).toMatch(/if \(!__standalone && !isNativeShell\(window\) && 'serviceWorker' in navigator\) \{/);
  });
});

describe('the brand table is one table — store, TWA matrix and native shell agree', () => {
  const brands = readBrands();

  it('the native brands are exactly the store brands', () => {
    expect(brands.map((b) => b.key).sort()).toEqual(APP_STORE.map((a) => a.key).sort());
  });

  it('the native brands are exactly the workflow matrix', () => {
    const m = /brand: \[([^\]]+)\]/.exec(WORKFLOW);
    expect(m).toBeTruthy();
    expect(m[1].split(',').map((s) => s.trim()).sort()).toEqual(brands.map((b) => b.key).sort());
  });

  it('every native package id is distinct, ends in .local, and is NOT a TWA id — both must install side by side', () => {
    const twa = new Set(APP_STORE.map((a) => a.packageId));
    const ids = brands.map((b) => b.appId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of brands) {
      expect(b.appId.endsWith('.local')).toBe(true);
      expect(twa.has(b.appId)).toBe(false);
      // …and it is the TWA id with .local appended, so the pairing is legible.
      const twaId = APP_STORE.find((a) => a.key === b.key).packageId;
      expect(b.appId).toBe(`${twaId}.local`);
    }
  });

  it('no segment of any id is a Java keyword — the first run failed on exactly this (DR-0571)', () => {
    // Run 1 of the lane, all five brands: "Namespace 'us.poetech.properties.native'
    // is not a valid Java package name as 'native' is a Java keyword." The
    // Android namespace is a Java package, so every dot-separated segment must
    // be a legal Java identifier, and this is the whole reserved-word list.
    const JAVA_KEYWORDS = new Set(('abstract assert boolean break byte case catch char class const continue default do double '
      + 'else enum extends final finally float for goto if implements import instanceof int interface long native new '
      + 'package private protected public return short static strictfp super switch synchronized this throw throws '
      + 'transient try void volatile while true false null').split(' '));
    for (const b of brands) {
      for (const seg of b.appId.split('.')) {
        expect(/^[a-z][a-z0-9_]*$/.test(seg), `${b.appId}: "${seg}" is not a Java identifier`).toBe(true);
        expect(JAVA_KEYWORDS.has(seg), `${b.appId}: "${seg}" is a Java keyword`).toBe(false);
      }
    }
    // proven-to-catch on the exact id that failed
    expect('us.poetech.properties.native'.split('.').some((s) => JAVA_KEYWORDS.has(s))).toBe(true);
  });

  it('every start page is a served HTML that exists in the app source, named as a FILE', () => {
    for (const b of brands) {
      const file = startFile(b.start);
      expect(file.endsWith('index.html')).toBe(true);
      expect(existsSync(join(APP, file))).toBe(true);
    }
  });

  it('the door fires only on the bare first load, and never for the brand that starts at /', () => {
    expect(doorScript('/')).toBe('');
    const s = doorScript('/lovecorner/app/index.html?view=church');
    expect(s).toMatch(/location\.pathname==='\/'&&!location\.search/);
    expect(s).toContain('"/lovecorner/app/index.html?view=church"');
  });

  it('injectDoor places the script in <head> exactly once', () => {
    const html = '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';
    const once = injectDoor(html, brandFor('tlc', brands).start);
    const twice = injectDoor(once, brandFor('tlc', brands).start);
    expect((twice.match(/native shell door/g) || []).length).toBe(1);
    expect(twice.indexOf('native shell door')).toBeLessThan(twice.indexOf('<meta'));
    expect(injectDoor(html, '/')).toBe(html);
  });

  it('the Capacitor config turns native HTTP on (no CORS wall) and keeps a secure origin', () => {
    const c = capacitorConfigFor(brandFor('poetech', brands));
    expect(c.appId).toBe('us.poetech.app.local');
    expect(c.webDir).toBe('native/www/poetech');
    expect(c.plugins.CapacitorHttp.enabled).toBe(true);
    expect(c.server.androidScheme).toBe('https');
    expect(c.android.allowMixedContent).toBe(false);
  });
});

describe('the lane carries the three brakes and proves what it built', () => {
  it('dispatch-only, single-instance, bounded', () => {
    expect(WORKFLOW).toMatch(/^on:\n {2}workflow_dispatch: \{\}/m);
    expect(WORKFLOW).not.toMatch(/^\s+schedule:/m);
    expect(WORKFLOW).toMatch(/group: native-shell/);
    expect(WORKFLOW).toMatch(/timeout-minutes: 30/);
  });

  it('sets up the JDK Capacitor 8 actually compiles for — run 2 failed on a 17 toolchain (DR-0571)', () => {
    // "invalid source release: 21" from :capacitor-android:compileReleaseJavaWithJavac.
    // The number is read from the installed module rather than remembered, so a
    // Capacitor upgrade that moves the target moves this pin with it.
    const gradle = read(join(APP, 'node_modules/@capacitor/android/capacitor/build.gradle'));
    const m = /sourceCompatibility JavaVersion\.VERSION_(\d+)/.exec(gradle);
    expect(m, 'could not read Capacitor’s Java target').toBeTruthy();
    expect(WORKFLOW).toMatch(new RegExp(`java-version: '${m[1]}'`));
  });

  it('builds at base / and stages through the same script the test exercises', () => {
    expect(WORKFLOW).toMatch(/PT_NATIVE_SHELL: '1'/);
    expect(WORKFLOW).toMatch(/node native\/stage\.mjs \$\{\{ matrix\.brand \}\}/);
    expect(WORKFLOW).toMatch(/npx cap add android/);
    expect(WORKFLOW).toMatch(/npx cap sync android/);
  });

  it('reads the real APK back — package id AND version — before publishing', () => {
    expect(WORKFLOW).toMatch(/dump badging/);
    expect(WORKFLOW).toMatch(/WANT_ID=/);
    expect(WORKFLOW).toMatch(/WANT_VC=/);
    const verify = WORKFLOW.indexOf('dump badging');
    const publish = WORKFLOW.indexOf('gh release upload android-native-latest');
    expect(verify).toBeGreaterThan(0);
    expect(publish).toBeGreaterThan(verify);
  });

  it('carries the same sovereign backend the web build carries', () => {
    expect(WORKFLOW).toMatch(/hashFiles\('infra\/nas-supabase\/REPOINT-ARMED'\)/);
    expect(WORKFLOW).toMatch(/SOVEREIGN_SB_URL=https:\/\/poetech\.us\/sb/);
  });
});
