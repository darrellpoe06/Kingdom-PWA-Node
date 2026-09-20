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
import { APP_STORE, APK_DOOR_BASE, INSTALL_STEPS } from '../lib/app-store.js';

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

  it('says "not published yet", not "bad gateway", for an empty shelf', async () => {
    // Measured 2026-08-28: properties.apk did not exist on the release, this
    // door turned GitHub's 404 into a 502, and Cloudflare showed Darrell
    // "Bad gateway · Host Error" — which reads as the whole site being down.
    // A missing package is a missing package.
    vi.stubGlobal('fetch', async () => new Response('Not Found', { status: 404 }));
    vi.stubGlobal('caches', { default: noCache });
    const res = await onRequestGet(ctx('properties.apk'));
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body).toContain('properties');
    expect(body).toMatch(/site is fine/i);
    expect(res.headers.get('Cache-Control')).toBe('no-store');   // never cache an empty shelf
  });

  it('answers 502 honestly when the release is unreachable or genuinely broken', async () => {
    vi.stubGlobal('fetch', async () => new Response('server error', { status: 500 }));
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

// =============================================================================
// The shelf describes what is actually on it
// =============================================================================
// MEASURED 2026-08-28: the android-latest release notes read "the four family
// apps" while the shelf held five (poetech, lovecorner, tlc, properties, moore).
// Not a typo — a one-way door. The publish step runs
// `gh release create ... --notes "..." || true`, so the notes are written ONCE
// at first creation (2026-07-23) and every run since has silently skipped them.
// A hardcoded count on a public page with no mechanism that could correct it.
//
// The `shelf` job now rewrites the notes from the release's OWN asset list, so
// the sentence is a reading rather than a claim. These pin that so the
// create-only version cannot come back.
import { readFileSync as _rf } from 'node:fs';
import { join as _join } from 'node:path';
import { APP_STORE as _APP_STORE } from '../lib/app-store.js';

const _wf = () => _rf(_join(process.cwd(), '..', '.github/workflows/android-package.yml'), 'utf8');

describe('the release notes are derived, not typed', () => {
  it('has a job that rewrites the notes after every brand uploads', () => {
    const src = _wf();
    expect(src).toMatch(/^ {2}shelf:/m);
    expect(src).toMatch(/needs: build/);
    expect(src).toMatch(/gh release edit android-latest/);
  });

  it('counts the assets rather than stating a number', () => {
    const src = _wf();
    const job = src.slice(src.indexOf('  shelf:'));
    // The count and the names both come from the release's own asset list.
    expect(job).toMatch(/\.assets\[\]\.name/);
    expect(job).toMatch(/\.assets \| length/);
    // And no literal count is written into the notes it publishes.
    expect(job).not.toMatch(/the (four|five|six) family apps"/);
  });

  it('never claims a shelf it could not read', () => {
    // An empty or unreadable asset list leaves the notes alone rather than
    // publishing "the 0 family apps" (DR-0076 §8: unknown is not a value).
    const job = _wf().slice(_wf().indexOf('  shelf:'));
    expect(job).toMatch(/leaving the notes alone/);
  });

  it('corrects the notes even when a brand failed to build', () => {
    // A partial run is exactly when a stale count is most misleading.
    expect(_wf().slice(_wf().indexOf('  shelf:'))).toMatch(/if: always\(\)/);
  });

  // NOTE, recorded rather than quietly dropped: a test that the store's brands
  // all appear in the build matrix ALREADY EXISTS above ("the Android lane
  // builds a package for every app the store lists") and it PASSED throughout
  // the outage. The properties brand was in the matrix with the right package
  // id the whole time. The config was never wrong — the lane was simply never
  // dispatched, and no config-conformance test can see that. The check that
  // would have caught it has to compare the store against the SHELF, which
  // needs the network; it lives in the `shelf` job below instead.
});

describe('the TV path tells the truth per platform, not one blurred answer', () => {
  // Darrell asked about a Firestick and then "Same on the Samsung TV?" — and it
  // is NOT the same in the way that matters. Fire TV runs Android, so the .apk
  // installs and disappoints. Samsung runs Tizen and LG runs webOS, where an
  // Android package cannot execute at all. A single "use the browser" line
  // would be true by accident and would leave someone hunting for a sideload
  // route that does not exist on their set.
  const steps = INSTALL_STEPS.tv.join(' ');

  it('names each of the three platforms, because the reason differs on each', () => {
    for (const platform of ['Fire TV', 'Samsung', 'LG']) {
      expect(steps, `the TV path never mentions ${platform}`).toContain(platform);
    }
  });

  it('says plainly that a Samsung cannot run an Android app AT ALL', () => {
    // The load-bearing distinction. "It will not work well" is the Fire TV
    // answer; "it cannot be installed" is the Samsung one, and collapsing them
    // sends someone on a hunt with no end.
    expect(steps).toMatch(/Tizen/);
    expect(steps).toMatch(/cannot be installed on one at all|cannot run at all/);
  });

  it('warns against sideloading on a TV and says why', () => {
    expect(steps).toMatch(/Do NOT sideload/);
    expect(steps).toMatch(/portrait|home screen/);
  });

  it('tells the viewer how to DRIVE it, not just how to open it', () => {
    // A browser address with no remote instructions is half an answer: the
    // arrows and the highlight are the whole interaction model on a sofa.
    expect(steps).toMatch(/arrows/);
    expect(steps).toMatch(/outline|highlight/i);
  });

  it('carries a fallback for sets with no browser', () => {
    expect(steps).toMatch(/cast or mirror/);
  });

  it('every path still points at the real site, not a placeholder', () => {
    expect(steps).toMatch(/poetech\.us/);
    expect(steps, 'a TV step points at a dead example host').not.toMatch(/example\.com/);
  });
});

describe('having BOTH a stick and a smart TV has a recommended answer', () => {
  // Darrell 2026-09-20: "I use both!" — a stick plugged into a smart TV is the
  // ordinary case, and the two browsers are not equal. Leaving the reader to
  // pick means half of them land on the weaker surface for no reason.
  it('recommends the stick, first, and says why', () => {
    const steps = INSTALL_STEPS.tv;
    expect(steps[0], 'the both-devices case is not the first thing said').toMatch(/USE THE STICK/);
    expect(steps[0]).toMatch(/more capable browser/);
  });
});

describe('The Love Corner on a television — the case that actually matters', () => {
  // Darrell 2026-09-20: "Can the Love Corner App work?" then "Love Corner".
  // VERIFIED rather than assumed, by reading the chain end to end:
  //   poetech.us/lovecorner -> public/lovecorner/index.html (the church door)
  //   -> /lovecorner/app/?view=church -> app/lovecorner/app/index.html
  //   -> <script type="module" src="/src/main.jsx"> -> wireRemoteNavigation()
  // All five brand entries load the SAME main.jsx, so the D-pad and the focus
  // ring are live on the church face with nothing brand-specific needed.
  const steps = INSTALL_STEPS.tv.join(' ');

  it('names the church address a TV viewer would actually type', () => {
    expect(steps).toMatch(/poetech\.us\/lovecorner/);
  });

  it('carries the aliases, so a remembered address is not a dead end', () => {
    // _redirects 301s /thelovecorner, /church and /LoveCorner to /lovecorner/.
    // Typing on a TV is slow and painful; being sent back to re-type is worse.
    expect(steps).toMatch(/thelovecorner/);
    expect(steps).toMatch(/church/);
  });

  it('warns that the built-in TV browsers are worst at the ONE job this is for', () => {
    // ChurchLearn.jsx carries a <video> element and youtube-feed.js a
    // livestream: watching service on the big screen IS the church use case.
    // Tizen and webOS browsers are documented as unreliable at video, so a
    // recommendation that ignored it would send people to the failing route
    // for the exact thing they came to do.
    expect(steps).toMatch(/video playback in those browsers is unreliable/);
    expect(steps).toMatch(/For anything with video, use the Fire Stick/);
  });

  it('the church brand is really in the store, with a real package door', () => {
    const church = APP_STORE.find((b) => b.key === 'lovecorner');
    expect(church, 'lovecorner is not in APP_STORE').toBeTruthy();
    expect(church.apk).toBe(`${APK_DOOR_BASE}/lovecorner.apk`);
  });
});
