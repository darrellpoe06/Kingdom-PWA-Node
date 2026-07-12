// =============================================================================
// watchdog — the last line under the whole boot chain (LESSONS P32, DR ledger)
// =============================================================================
// If the entry module never runs (a deploy-window 404 on a first visit, a dead
// chunk, anything that leaves the page blank with ZERO JavaScript), nothing in
// the bundle can help — boot-fallback and chunk-heal live INSIDE the bundle.
// This file lives at a STABLE, unhashed path so it survives every deploy, and
// the CSP allows it as 'self' (inline scripts are blocked — measured on
// production, 2026-07-10). main.jsx sets window.__PT_BOOTED the moment the
// entry module executes; if that flag hasn't appeared in time, retry ONCE with
// a cache-busting param, then say something honest instead of staying blank.
(function () {
  'use strict';
  // 20s, not 8s: the full app is a large bundle, and on a congested shared
  // network (a church sanctuary full of phones on one AP) it can take well over
  // 8s to arrive. An 8s window fired mid-download and the recovery below reloaded
  // the page — restarting the download from scratch, so it NEVER finished (the
  // 2026-07-12 "watchdog message, then instant white" outage on church WiFi).
  // Give a slow-but-working network time to boot before we ever intervene; a fast
  // network boots in under a second, so this longer wait is dormant for it.
  var WAIT_MS = 20000;
  function retried() {
    try { return new URL(window.location.href).searchParams.has('pt-retry'); } catch (e) { return true; }
  }
  function retryOnce() {
    try {
      var u = new URL(window.location.href);
      u.searchParams.set('pt-retry', Date.now().toString(36));
      window.location.replace(u.toString());
    } catch (e) { /* leave the message path to the next timer */ }
  }
  function saySomething() {
    try {
      if (window.__PT_BOOTED || (document.body && document.body.innerText.trim().length > 40)) return;
      document.body.innerHTML = '<div style="font-family:Georgia,serif;max-width:26em;margin:18vh auto 0;padding:0 1em;text-align:center">'
        + '<p style="letter-spacing:.3em;font-size:.8em">POETECH</p>'
        + '<h1 style="font-size:1.5em">Still loading a fresh copy&hellip;</h1>'
        + '<p>The newest version is settling in. Please close this tab and reopen poetech.us in a minute.</p>'
        + '</div>';
    } catch (e) { /* never throw from the watchdog */ }
  }
  // Free a WAITING worker before retrying (2026-07-10, the pinned-device
  // trap): when a broken active worker serves a blank-but-live page, that
  // live client blocks the FIXED worker from activating, and the in-bundle
  // update tap can never render — the device stays down until a human clears
  // it by hand. This file runs even when the bundle can't; a boot that
  // stalled with a waiting worker frees it (sw.js honors SKIP_WAITING), so
  // the retry navigates under the fixed worker. Bounded: one message per
  // firing, and retryOnce() already runs at most once (the pt-retry param).
  function freeWaitingWorker() {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
        navigator.serviceWorker.getRegistration().then(function (reg) {
          if (reg && reg.waiting) {
            try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch (e) { /* best-effort */ }
          }
        }).catch(function () { /* best-effort */ });
      }
    } catch (e) { /* never throw from the watchdog */ }
  }
  setTimeout(function () {
    if (window.__PT_BOOTED) return;
    // MESSAGE path (we already retried once and the app still hasn't booted):
    // leave a STABLE honest message and do NOT touch the service worker. Posting
    // SKIP_WAITING here makes sw-update's controllerchange handler auto-reload the
    // page with no user action — which WIPES this very message to white and
    // restarts the large bundle download, looping forever on a slow network. That
    // self-inflicted reload was the "watchdog message, then instant white" outage
    // (2026-07-12, church WiFi): during the Assembly every per-merge deploy left a
    // waiting worker, so the poke fired every time. The message must be terminal.
    if (retried()) { saySomething(); return; }
    // RETRY path: a navigation is the intent anyway, so it is safe to free a
    // waiting worker here so the retry loads under the newest worker.
    freeWaitingWorker();
    retryOnce();
  }, WAIT_MS);
})();
