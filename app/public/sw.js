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

// ---------------------------------------------------------------------------
// PUSH — the handler that lets a CLOSED phone hear that the service started.
// ---------------------------------------------------------------------------
// Darrell, 2026-09-06: "My phone didn't notify me of the livestream... why not."
// The measured answer was that this file had no `push` listener at all, so the
// only notifications the app could raise were foreground `new Notification()`
// calls that require the tab to still be open. This is the fix. Everything
// above this line is unchanged.
//
// The payload arrives ENCRYPTED to this device's own keys (RFC 8291) and is
// decrypted by the browser before we see it — the push service relayed a blob
// it could not read. See app/src/lib/webpush-crypto.js for the sending half.
//
// DEFENSIVE BY DESIGN. Push services are permitted to deliver an EMPTY push
// (a "wake up and go look" ping), and a malformed body must never throw inside
// a push event: on some platforms a handler that rejects costs the origin its
// push permission. So every failure path still shows something honest rather
// than nothing, and nothing here can throw.
const NOTIFY_DEFAULTS = {
  icon: BASE + '/icon.svg',
  badge: BASE + '/icon.svg',
};

function parsePushPayload(raw) {
  // Returns a normalized notification, never throws, never invents a claim.
  var fallback = {
    title: 'The Love Corner',
    body: 'Open the app to see what is new.',
    url: BASE + '/',
    tag: 'poetech-generic',
    renotify: false,
  };
  if (!raw) return fallback;
  var data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    // Not JSON — treat the text itself as the body rather than dropping it.
    return { title: 'The Love Corner', body: String(raw).slice(0, 200), url: BASE + '/', tag: 'poetech-generic', renotify: false };
  }
  if (!data || typeof data !== 'object') return fallback;
  // Same-origin ONLY. A leading '/' is not sufficient: '//evil.example/x' and
  // '/\\evil.example/x' are PROTOCOL-RELATIVE and navigate off-origin, which
  // would let a compromised sender open any site while wearing the church's
  // icon. (This test caught exactly that hole in the first draft of this file.)
  var u = typeof data.url === 'string' ? data.url : '';
  var sameOrigin = u.charAt(0) === '/' && u.charAt(1) !== '/' && u.charAt(1) !== '\\';
  var url = sameOrigin ? u : BASE + '/';
  return {
    title: typeof data.title === 'string' && data.title ? data.title : fallback.title,
    body: typeof data.body === 'string' ? data.body : '',
    url: url,
    // `tag` collapses repeats: a second "we're live" REPLACES the first in the
    // shade instead of stacking a second buzz on top of it.
    tag: typeof data.tag === 'string' && data.tag ? data.tag : (data.kind ? 'poetech-' + data.kind : 'poetech-generic'),
    renotify: data.renotify === true,
  };
}

self.addEventListener('push', function (event) {
  var raw = '';
  try {
    raw = event.data ? event.data.text() : '';
  } catch (e) {
    raw = '';
  }
  var n = parsePushPayload(raw);
  event.waitUntil(
    self.registration.showNotification(n.title, {
      body: n.body,
      icon: NOTIFY_DEFAULTS.icon,
      badge: NOTIFY_DEFAULTS.badge,
      tag: n.tag,
      renotify: n.renotify,
      data: { url: n.url },
    })
  );
});

// Tapping the notification should land on the RIGHT screen, and should reuse a
// tab that is already open rather than stacking another copy of the app.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || BASE + '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i += 1) {
        var c = list[i];
        if (c.url.indexOf(BASE) !== -1 && 'focus' in c) {
          if ('navigate' in c && c.url.indexOf(target) === -1) {
            return c.navigate(target).then(function (nc) { return nc && nc.focus(); });
          }
          return c.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});

// A subscription can be rotated by the browser at any time. Without this the
// device silently stops receiving pushes and nobody finds out until someone
// says "my phone didn't notify me" — which is exactly how this work started.
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i += 1) {
        list[i].postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
      }
    })
  );
});
