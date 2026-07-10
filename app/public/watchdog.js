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
  var WAIT_MS = 8000;
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
  setTimeout(function () {
    if (window.__PT_BOOTED) return;
    if (retried()) { saySomething(); return; }
    retryOnce();
  }, WAIT_MS);
})();
