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

self.addEventListener('install', (event) => {
  // Prime the offline shell with { cache: 'reload' } so the precached copy is
  // fetched fresh from the network at install — never a stale shell pulled from
  // the HTTP cache. (A stale precached index.html would point the offline
  // fallback at an old asset bundle.)
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
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
    event.respondWith(
      fetch(event.request.url, { cache: 'no-store' }).catch(() => caches.match(BASE + '/index.html'))
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
