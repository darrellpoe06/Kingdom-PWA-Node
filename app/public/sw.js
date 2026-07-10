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
// The FULL hashed asset set of THIS build, stamped at build time (vite.config.js
// sw-precache-stamp). "Stay on the previous build until you download it"
// (Darrell, 2026-07-10): with every chunk precached at install, the running
// build is COMPLETE on the device — a deploy that renames every file (the
// per-build stamp) can no longer strand it, and a deploy-propagation window
// (LESSONS P32) makes THIS install attempt fail whole, leaving the old worker
// serving the old, complete build until the next check succeeds. Unstamped in
// `vite dev` (empty array) — dev needs no cross-deploy resilience.
const PRECACHE_ASSETS = /*__PRECACHE_ASSETS__*/[];

self.addEventListener('install', (event) => {
  // Prime the offline shell with { cache: 'reload' } so the precached copy is
  // fetched fresh from the network at install — never a stale shell pulled from
  // the HTTP cache. (A stale precached index.html would point the offline
  // fallback at an old asset bundle.) Hashed assets need no reload (immutable
  // per content hash). ALL-OR-NOTHING on purpose: any missing piece rejects the
  // install, so a mid-deploy window can never produce a half-cached build.
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all([
        ...PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))),
        ...PRECACHE_ASSETS.map((url) => cache.add(new Request(url))),
      ])
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
    // App shell: CACHE-FIRST from the current build's cache (2026-07-10,
    // Darrell: "I've never had an app do this — it's just on the previous
    // build until you download it… why does ours?"). The device serves ITS
    // OWN complete build — shell + every precached chunk above — so a deploy
    // window (LESSONS P32) is invisible: no mid-swap navigation can strand it.
    // Updates arrive the way real apps update: the browser refetches sw.js
    // (no-store headers) on navigation + the periodic update checks; the new
    // worker precaches the ENTIRE new build in the background; the freshness
    // dot / "Download the latest" / SKIP_WAITING swap it in whole.
    //
    // The 2026-06-03 stale-iOS-HTML class this replaces (network-first
    // no-store) stays dead by a different door: the shell in THIS cache was
    // fetched { cache: 'reload' } at install, and the whole cache is dropped
    // the moment the next worker activates — no HTTP-cache staleness path.
    //
    // Only navigations INSIDE the app scope get the cached shell — /moore/
    // and the other static doors are real pages, not this shell.
    //
    // REDIRECT GUARD (2026-07-07, the /moore ERR_FAILED): the network path's
    // constructed fetch FOLLOWS redirects, and a browser refuses a `redirected`
    // response for a navigation — hand it a real redirect instead.
    let inAppScope = false;
    try {
      const navUrl = new URL(event.request.url);
      inAppScope = navUrl.origin === self.location.origin && navUrl.pathname.startsWith(BASE);
    } catch (_) { /* fall through to the network path */ }
    event.respondWith(
      (inAppScope ? caches.open(CACHE).then((c) => c.match(BASE + '/index.html')) : Promise.resolve(undefined))
        .then((cached) => cached || fetch(event.request.url, { cache: 'no-store' })
          .then((res) => (res.redirected ? Response.redirect(res.url, 301) : res)))
        .catch(() => caches.match(BASE + '/index.html'))
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
  // every prior-deploy cache, so this can never re-serve a stale shell — the
  // shell is served from the same per-build cache (above), swapped whole, so any
  // privacy/data fix still reaches the device on the very next navigation.
  const req = event.request;
  let isHashedAsset = false;
  try {
    const url = new URL(req.url);
    isHashedAsset = url.origin === self.location.origin
      && url.pathname.startsWith(BASE + '/')
      && /\.(?:js|css|woff2?)$/.test(url.pathname);
  } catch (_) { /* non-URL request → fall through to the default path */ }

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
