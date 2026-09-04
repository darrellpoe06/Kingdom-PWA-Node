// PoeTech Family OS — minimal service worker
// Enables PWA installability + offline shell + opt-in instant updates.
//
// SW_VERSION is stamped at build time by the sw-version-stamp plugin in
// app/vite.config.js: the deploy's git SHA on Vercel, a timestamp fallback
// for local builds. Because CACHE derives from it, every deploy changes this
// file's bytes — the browser sees a byte-different sw.js, installs the new
// worker, and the activate handler below deletes every cache from prior
// deploys. This is forward fix #4 from the 2026-06-03 entry in
// docs/00-foundations/_root/LESSONS-LEARNED.md (stale SW cache masked a
// deployed privacy fix). Under `vite dev` the placeholder is served
// unstamped, which is fine — dev needs no per-deploy cache busting.
//
// BASE is the path the app is served under. Built artifacts live under this
// prefix because Synology Web Station uses an alias portal at /poetech-app/.
// If we ever move to a different mount point, update BASE and rebuild.
const SW_VERSION = '__SW_VERSION__';
const BASE = '/poetech-app';
const CACHE = 'poetech-' + SW_VERSION;
const PRECACHE = [BASE + '/', BASE + '/index.html', BASE + '/manifest.webmanifest', BASE + '/icon.svg'];

// SCOPE-AWARE OFFLINE SHELLS (2026-08-30, the church-door ERR_FAILED).
// DR-0258 split the INSTALL scopes so PoeTech and The Love Corner install as two
// apps: each face is its own served page (/lovecorner/app/, /moore/app/, ...).
// That decision is about MANIFEST scope. This worker is registered from
// main.jsx as register('/sw.js') — DEFAULT scope '/' — so ONE worker controls
// EVERY face while BASE below names only PoeTech's. The navigation handler's
// offline fallback was therefore `caches.match('/poetech-app/index.html')` for a
// CHURCH navigation: the wrong app's shell when that entry existed, and
// `undefined` when it did not. respondWith(undefined) is a network error — which
// Chrome renders as ERR_FAILED, the church app's own start_url dead on 4G
// (Darrell's 2026-08-30 screenshot of /lovecorner/app/?view=church&lovecorner=1).
// A fresh browser never reproduces it (no worker installed), which is exactly why
// the live-link probe stayed green while installed devices were dark.
// Each installable face now falls back to ITS OWN shell, and the ladder can
// never end in undefined.
const SCOPE_SHELLS = ['/lovecorner/app/', '/moore/app/', '/tlc/app/', '/properties/app/'];

// The shell that belongs to a URL's own install scope; PoeTech's for everything else.
function shellPathFor(rawUrl) {
  try {
    const path = new URL(rawUrl).pathname;
    for (const s of SCOPE_SHELLS) if (path.indexOf(s) === 0) return s + 'index.html';
  } catch (_) { /* unparseable → the PoeTech shell below */ }
  return BASE + '/index.html';
}

// LAST RESORT — a real Response, never undefined. The front door never shows a
// dead error page (the boot-fallback posture, applied in the network layer).
function offlineHtmlResponse() {
  return new Response(
    '<!doctype html><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Offline</title>'
    + '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;'
    + 'font-family:Georgia,\'Times New Roman\',serif;background:#FAF8F4;color:#1A1815;text-align:center;">'
    + '<div style="max-width:26rem;">'
    + '<div style="font-size:.625rem;letter-spacing:.25em;text-transform:uppercase;color:#B85838;'
    + 'font-weight:600;margin-bottom:.75rem;">PoeTech</div>'
    + '<h1 style="font-size:1.25rem;margin:0 0 .5rem;font-weight:600;">You are offline</h1>'
    + '<p style="font-size:.9375rem;line-height:1.5;color:#5A5751;margin:0;">'
    + 'The connection dropped before this page could load. Reopen it once you are back online.</p>'
    + '</div></div>',
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// This face's shell → the PoeTech shell → a real offline page. Never undefined.
function offlineShellFor(rawUrl) {
  const shell = shellPathFor(rawUrl);
  return Promise.resolve(caches.match(shell))
    .catch(() => undefined)
    .then((hit) => {
      if (hit) return hit;
      if (shell === BASE + '/index.html') return undefined;
      return Promise.resolve(caches.match(BASE + '/index.html')).catch(() => undefined);
    })
    .then((hit) => hit || offlineHtmlResponse());
}

self.addEventListener('install', (event) => {
  // Prime the offline shell with { cache: 'reload' } so the precached copy is
  // fetched fresh from the network at install — never a stale shell pulled from
  // the HTTP cache. (A stale precached index.html would point the offline
  // fallback at an old asset bundle.)
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
        // Each installable face's OWN shell (DR-0258 scope split), BEST-EFFORT:
        // a face that 404s must never reject install — a failed install leaves
        // the device with NO worker at all, which is worse than one missing
        // offline shell. Strict for PoeTech above, tolerant for the faces here.
        .then(() => Promise.all(SCOPE_SHELLS.map((s) =>
          cache.add(new Request(s + 'index.html', { cache: 'reload' })).catch(() => {})
        )))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Page can post { type: 'SKIP_WAITING' } to ask the new SW to take over right
// now (the user has clicked "Reload to update" in our update banner).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    // App shell: network-first AND cache-bypassing. The old handler used a
    // plain fetch(event.request), which honors the HTTP cache — so after a new
    // worker took over, the reload could re-serve a STALE index.html (iOS
    // Safari over-caches HTML) that still referenced the old asset bundle,
    // stranding the user on the prior build. { cache: 'no-store' } forces the
    // shell to come from the network every navigation when online; we fall
    // back to the precached shell only when offline. Content-hashed asset
    // bundles need no such guard (a new hash is always a fresh network fetch).
    //
    // REDIRECT GUARD (2026-07-07, the /moore ERR_FAILED): this constructed
    // fetch FOLLOWS redirects, and a browser refuses a `redirected` response
    // for a navigation — so any redirecting path (/moore -> /moore/) died with
    // ERR_FAILED on every device with this worker installed. When the followed
    // response is redirected, hand the browser a real redirect to the final
    // URL and let IT navigate; the second hop returns a direct 200.
    event.respondWith(
      fetch(event.request.url, { cache: 'no-store' })
        .then((res) => (res.redirected ? Response.redirect(res.url, 301) : res))
        .catch(() => offlineShellFor(event.request.url))
    );
    return;
  }
  // Hashed build assets (JS chunks / CSS / fonts) are IMMUTABLE per content hash.
  // Cache each one as it loads and serve it cache-first, so a build the device is
  // RUNNING keeps ALL of its chunks even after a newer deploy swaps the CDN. The
  // loaded (old) version therefore stays fully usable until the new worker takes
  // over in the background — instead of a lazy chunk 404ing mid-session, tripping
  // chunk-reload-heal, and dropping the user on the hard "Reload" wall (the
  // 2026-07-06 "app won't update / let me keep using the old one" report). A new
  // deploy means new hashes = new cache entries; the activate handler above drops
  // every prior-deploy cache, so this can never re-serve a stale shell — the app
  // shell itself stays network-first { no-store } (above), unchanged, so any
  // privacy/data fix still reaches the device on the very next navigation.
  const req = event.request;
  let isHashedAsset = false;
  let isStableBootstrap = false;
  try {
    const url = new URL(req.url);
    const sameApp = url.origin === self.location.origin && url.pathname.startsWith(BASE + '/');
    // STABLE-PATH BOOTSTRAP (2026-07-12, the church-phone blank that outlived its
    // own fix): watchdog.js lives at a fixed, UNHASHED path on purpose — it is the
    // always-fresh last line of the boot chain, and its whole contract (see the
    // header of watchdog.js) is "survives every deploy." But it ends in `.js`, so
    // the cache-first branch below treated it as an IMMUTABLE hashed chunk and
    // pinned the OLD copy on every already-installed device — a device stuck on a
    // stale 8s watchdog kept looping even after the 20s fix (#800) shipped to the
    // CDN, because the SW never served the new bytes. A stable-path file changes
    // content at the SAME url, so it must be NETWORK-FIRST: newest always wins,
    // with the cache only as an offline fallback. This is the ONE class the
    // "hashed = immutable" assumption is false for. (sw.js is fetched by the
    // browser's own update machinery, not this handler, so watchdog.js is the
    // only script that reaches here on a stable path.)
    isStableBootstrap = sameApp && /\/watchdog\.js$/.test(url.pathname);
    isHashedAsset = !isStableBootstrap && sameApp && /\.(?:js|css|woff2?)$/.test(url.pathname);
  } catch (_) { /* non-URL request → fall through to the default path */ }

  if (isStableBootstrap) {
    // Network-first: always try the freshest copy; fall back to cache only when
    // the network is unreachable, and refresh the cached copy on every success.
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then((res) => {
        try {
          if (res && res.ok && (res.type === 'basic' || res.type === 'default')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
        } catch (_) { /* caching is best-effort */ }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  if (isHashedAsset) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        // Best-effort populate; the response is returned either way. Only cache a
        // real, OK, same-origin response (never an opaque/error one).
        try {
          if (res && res.ok && (res.type === 'basic' || res.type === 'default')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
        } catch (_) { /* caching is best-effort */ }
        return res;
      }))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
