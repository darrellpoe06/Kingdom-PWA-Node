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

// THE INSTALLABLE DOORS, BY PATH -- ONE list, two jobs (DR-0258 install-scope
// split; DR-0444 notification routing; #1405's offline shells).
//
// MUST stay in step with DOORS in src/lib/app-doors.js -- sw-push-handler
// .test.js derives both lists from source and fails if they disagree.
//
// Both features that need to know the doors now read THIS list rather than
// carrying one each, which is the unification the two changes owed each other:
//   * notificationclick prefers a window already in the target's own door, so
//     a church notification is never handed to a family window (DR-0444);
//   * a navigation that fails offline falls back to ITS OWN face's shell.
var DOOR_PATHS = ['/poetech-app/', '/lovecorner/app/', '/moore/app/', '/tlc/app/', '/properties/app/'];

// The door a URL belongs to: the longest door path it starts with, or ''.
function doorOf(pathname) {
  var best = '';
  for (var i = 0; i < DOOR_PATHS.length; i += 1) {
    var d = DOOR_PATHS[i];
    if (pathname.indexOf(d) === 0 && d.length > best.length) best = d;
  }
  return best;
}

// SCOPE-AWARE OFFLINE SHELLS. Diagnosed in PR #1405 (Darrell, 2026-08-30): the
// church app's own start_url died with ERR_FAILED on 4G while site-health
// reported "UP. Fresh." across every dimension. main.jsx then registered
// '/sw.js' at the DEFAULT scope '/', so ONE worker controlled every face while
// BASE names only PoeTech's -- and the navigation fallback was
// caches.match('/poetech-app/index.html'): the WRONG app's shell when that
// entry existed, and `undefined` when it did not. respondWith(undefined) IS a
// network error, which Chrome renders as ERR_FAILED. A fresh browser can never
// reproduce it (no worker installed), which is exactly why every probe stayed
// green while installed devices were dark.
//
// SINCE 2026-09-23 (DR-0584) the SAME file is registered once PER DOOR, at the
// door's own scope (lib/sw-door-scope.js), because Android credits a
// notification to an installed app only when the registration that shows it
// lies inside the app's manifest scope -- a root registration never did, so
// the shade said "Chrome" and the launcher icon never carried a count. Every
// handler below is written per-URL, not per-registration, so nothing here
// changes: each door's worker still answers its own shell and its own taps.
var FACE_SHELLS = DOOR_PATHS.filter(function (d) { return d !== BASE + '/'; });

// The shell belonging to a URL's own door; PoeTech's for anything else.
function shellPathFor(rawUrl) {
  try {
    var d = doorOf(new URL(rawUrl).pathname);
    if (d && d !== BASE + '/') return d + 'index.html';
  } catch (e) { /* unparseable -> the PoeTech shell below */ }
  return BASE + '/index.html';
}

// LAST RESORT -- a real Response, never undefined. The front door never shows
// a dead error page.
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

// This face's shell -> the PoeTech shell -> a real offline page. Never undefined.
function offlineShellFor(rawUrl) {
  var shell = shellPathFor(rawUrl);
  return Promise.resolve(caches.match(shell))
    .catch(function () { return undefined; })
    .then(function (hit) {
      if (hit) return hit;
      if (shell === BASE + '/index.html') return undefined;
      return Promise.resolve(caches.match(BASE + '/index.html')).catch(function () { return undefined; });
    })
    .then(function (hit) { return hit || offlineHtmlResponse(); });
}

self.addEventListener('install', (event) => {
  // Prime the offline shell with { cache: 'reload' } so the precached copy is
  // fetched fresh from the network at install — never a stale shell pulled from
  // the HTTP cache. (A stale precached index.html would point the offline
  // fallback at an old asset bundle.)
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
        // Each installable face's OWN shell, BEST-EFFORT: a face that 404s must
        // never reject install, because a failed install leaves the device with
        // NO worker at all -- strictly worse than one missing offline shell.
        // Strict for PoeTech above, tolerant for the faces here.
        .then(() => Promise.all(FACE_SHELLS.map((d) =>
          cache.add(new Request(d + 'index.html', { cache: 'reload' })).catch(() => {})
        )))
    )
  );
});

// KEPT ACROSS DEPLOYS (DR-0655). A cache whose name starts with KEEP_PREFIX
// holds what the person chose to put on the device -- the on-device reading
// voice (~63 MB model + runtime, lib/device-voice.js). Deleting it with the
// per-deploy caches would silently re-download 63 MB after every merge and
// leave the device voiceless offline until it did. Everything else is still
// dropped on activate, exactly as before.
var KEEP_PREFIX = 'poetech-keep-';

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k.indexOf(KEEP_PREFIX) !== 0).map((k) => caches.delete(k)))
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
// `badge` is the STATUS-BAR glyph Android paints when the shade is closed. It
// must be a monochrome raster (Chrome masks it to white on the bar's color);
// the seal SVG used to sit here and Android quietly substituted a generic bell
// for it (Darrell's shade, 2026-09-09). badge-96.png is a white cross on
// transparency, generated in-repo, so the church's own mark is what shows.
const NOTIFY_DEFAULTS = {
  icon: BASE + '/icon.svg',
  badge: BASE + '/badge-96.png',
};

// THE APP-ICON BADGE (Darrell, 2026-09-09: notifications "on the app and in
// the notification list"). The shade is one place; the number on the launcher
// icon is the other, and ConnectBot's badge beside a bare church icon was the
// picture that named the gap. The Badging API is available in this worker
// scope (`navigator.setAppBadge`), so the count follows the notifications this
// worker is showing: recounted after every show and every tap, cleared when
// none remain. Never throws — a launcher without badges is a no-op, not a fault.
function syncAppBadge() {
  var nav = self.navigator;
  if (!nav || typeof nav.setAppBadge !== 'function') return Promise.resolve();
  return self.registration.getNotifications().then(function (list) {
    var n = list ? list.length : 0;
    return n > 0 ? nav.setAppBadge(n) : (nav.clearAppBadge ? nav.clearAppBadge() : nav.setAppBadge(0));
  }).catch(function () { /* a launcher that cannot badge is not a fault */ });
}

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
    }).then(syncAppBadge, syncAppBadge)
  );
});

// Tapping the notification should land on the RIGHT screen, and should reuse a
// tab that is already open rather than stacking another copy of the app.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || BASE + '/';
  // Absolute, so a client's own href can be compared to it rather than
  // substring-matched (the old indexOf test called a client "already there"
  // whenever the target path merely appeared in its URL).
  var abs = target;
  var wantDoor = '';
  try {
    var u = new URL(target, self.location.origin);
    abs = u.href;
    wantDoor = doorOf(u.pathname);
  } catch (e) { /* keep the raw target; the openWindow fallback still works */ }

  event.waitUntil(
    syncAppBadge().then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(function (list) {
      // THE DOOR DECIDES WHICH WINDOW GETS THE TAP (2026-09-16, DR-0444).
      // Darrell: "I text Christina from the Love Corner App and receive a text
      // from the PoeTech App." Half of that was the landing URL (fixed in
      // app-doors.js); the other half was HERE. This matched clients by
      // `indexOf(BASE)` -- BASE being /poetech-app -- so a phone standing in
      // the church door was never matched at all, and a church notification
      // was handed to whatever PoeTech window happened to be open. Now a
      // client in the TARGET'S OWN door is preferred; any other same-origin
      // window is the fallback and is navigated to the target; and only with
      // no window at all do we open one.
      var same = [];
      for (var i = 0; i < list.length; i += 1) {
        var c = list[i];
        if (!('focus' in c)) continue;
        try {
          if (new URL(c.url).origin !== self.location.origin) continue;
        } catch (e) { continue; }
        same.push(c);
      }
      var pick = null;
      if (wantDoor) {
        for (var j = 0; j < same.length; j += 1) {
          try {
            if (doorOf(new URL(same[j].url).pathname) === wantDoor) { pick = same[j]; break; }
          } catch (e) { /* skip an unparseable client */ }
        }
      }
      if (!pick && same.length) pick = same[0];
      if (pick) {
        if ('navigate' in pick && pick.url !== abs) {
          return pick.navigate(abs).then(function (nc) { return (nc || pick).focus(); });
        }
        return pick.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(abs) : undefined;
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
