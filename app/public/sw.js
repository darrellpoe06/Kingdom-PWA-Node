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
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
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
    event.respondWith(
      fetch(event.request).catch(() => caches.match(BASE + '/index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
