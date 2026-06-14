// PWA service-worker update lifecycle — pure, testable wiring.
//
// THE BUG (live build 41258af): pressing the in-app "Reload to update" banner
// (and the zero-click auto-update) left users on the OLD build. Detection
// worked (the banner appeared), but actuation did not swap the build. Two root
// causes, fixed here + in app/public/sw.js:
//
//   1. STALE APP SHELL. After the new worker took over, the reload re-fetched
//      the navigation (index.html) through the HTTP cache. iOS Safari (and any
//      intermediary) can hand back a stale shell that still points at the old
//      asset bundle — so the "fresh" reload re-served the old build. Fixed in
//      sw.js: the navigate handler now fetches the shell with { cache:
//      'no-store' } (network-first that actually bypasses the cache), and the
//      precache primes with { cache: 'reload' }. Hashed asset bundles were
//      never the problem (content-addressed; a new hash is always a cache miss
//      -> network), so only the shell needed hardening.
//
//   2. LIFECYCLE WIRING. The reload-on-controllerchange must fire EXACTLY ONCE
//      and ONLY for a real controller SWAP — never for the first-install
//      clients.claim() (that would be a spurious first-visit reload and could
//      mask first paint). The skip-waiting message must reach the WAITING
//      worker (the banner button) so it actually activates.
//
// Everything takes injected navigator / window / registration handles so the
// suite drives the full lifecycle deterministically without a real browser
// (node-env vitest; see __tests__/sw-update.test.js). This mirrors the repo's
// "extract the security-critical decision into a pure module + lock it with an
// exhaustive test" pattern (lib/multi-point-auth.js).

export const UPDATE_EVENT = 'poetech:update-available';

// Ask a specific worker (the waiting / freshly-installed one) to activate now.
// Returns true if the message was posted. Null-safe.
export function activateWorker(worker) {
  if (!worker || typeof worker.postMessage !== 'function') return false;
  try {
    worker.postMessage({ type: 'SKIP_WAITING' });
    return true;
  } catch (_) {
    return false;
  }
}

// The banner's "Reload to update" button calls this. Prefer SKIP_WAITING on the
// waiting worker — the controllerchange listener wired by wireUpdates() then
// performs the single reload once control passes. If there is no waiting worker
// (already activating / activated, e.g. zero-click already fired), fall back to
// a direct reload so the click is never a no-op.
export function applyUpdate(registration, win) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  try {
    if (registration && registration.waiting) {
      activateWorker(registration.waiting);
      return 'skip-waiting';
    }
  } catch (_) {
    /* fall through to reload */
  }
  try {
    if (w && w.location && typeof w.location.reload === 'function') w.location.reload();
  } catch (_) {
    /* noop */
  }
  return 'reload';
}

// Wire a registration's update lifecycle. Returns a small handle for tests.
//   registration: SW registration ({ waiting, installing, addEventListener })
//   nav:          navigator-like ({ serviceWorker: { controller, addEventListener } })
//   win:          window-like ({ location: { reload }, dispatchEvent, CustomEvent? })
export function wireUpdates(registration, nav, win) {
  const sw = nav && nav.serviceWorker;
  const state = { reloaded: 0, announced: 0 };
  if (!registration || !sw || typeof sw.addEventListener !== 'function') {
    return { state, hadController: false };
  }

  // Was the page already controlled when we wired up? If NOT, the first
  // controllerchange is the brand-new install's clients.claim() — reloading
  // there is spurious (first paint already rendered the correct assets) and is
  // the classic source of a first-visit reload loop. We reload ONLY for a real
  // controller swap (old build -> new build).
  const hadController = !!sw.controller;

  const announce = () => {
    state.announced += 1;
    try {
      const evt = (typeof win.CustomEvent === 'function')
        ? new win.CustomEvent(UPDATE_EVENT, { detail: { reg: registration } })
        : { type: UPDATE_EVENT, detail: { reg: registration } };
      if (typeof win.dispatchEvent === 'function') win.dispatchEvent(evt);
    } catch (_) {
      /* noop — the banner is a fallback, not load-bearing */
    }
  };

  // Case 1: a worker was already waiting at load — surface the banner and
  // zero-click skip-waiting it.
  if (registration.waiting && sw.controller) {
    announce();
    activateWorker(registration.waiting);
  }

  // Case 2: a new worker installs during this session.
  if (typeof registration.addEventListener === 'function') {
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing || typeof installing.addEventListener !== 'function') return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && sw.controller) {
          announce();
          activateWorker(installing);
        }
      });
    });
  }

  // Reload EXACTLY ONCE when control passes to the new worker — but only on a
  // real swap (hadController), never on the first-install claim. The guard also
  // makes repeated controllerchange events idempotent (no reload loop).
  sw.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (state.reloaded) return;
    state.reloaded += 1;
    try {
      if (win && win.location && typeof win.location.reload === 'function') win.location.reload();
    } catch (_) {
      /* noop */
    }
  });

  return { state, hadController };
}

// Proactively ask the browser to re-check for a new worker. The browser only
// checks on navigation / ~24h by default, so a long-lived installed PWA (iOS
// home-screen especially) can sit on an old build for days without this. Safe
// + idempotent: update() is a no-op when nothing changed. Checks on wire, and
// whenever the app regains visibility / focus.
export function startUpdateChecks(registration, win, nav) {
  if (!registration || typeof registration.update !== 'function') return;
  const check = () => {
    try { registration.update(); } catch (_) { /* noop */ }
  };
  check();
  try {
    if (win && typeof win.addEventListener === 'function') {
      win.addEventListener('focus', check);
      win.addEventListener('visibilitychange', () => {
        const doc = win.document;
        if (!doc || doc.visibilityState === 'visible') check();
      });
    }
  } catch (_) {
    /* noop */
  }
}
