// PWA service-worker update lifecycle — pure, testable wiring.
//
// THE BUG (live builds 41258af -> C50B895): the in-app "Reload to update" banner
// appeared, but tapping it did NOT reliably move the device to the new build —
// the banner persisted / looped. Detection worked; actuation did not stick. For
// a conference congregation that is ~40% not tech-comfortable, the update must
// be SEAMLESS — applied automatically, no decision to make — so this module now
// does that and treats the banner as a rare fallback, not the primary path.
//
// THREE root causes, fixed here + in app/public/sw.js:
//
//   1. NON-DURABLE LOOP GUARD. The old "reload exactly once" guard was an
//      in-memory counter (state.reloaded) that RESET on every reload — so it
//      could not stop a CROSS-reload loop (reload -> new worker still pending ->
//      reload -> ...), which is exactly the "banner persists / loops" symptom on
//      Android (Samsung Internet / Chrome variants) and iOS standalone. Fixed
//      with a sessionStorage sentinel (RELOAD_SENTINEL) that SURVIVES the reload:
//      we set it immediately before reloading and read it on the next page load.
//      If we reloaded for an update yet a worker is STILL waiting, that is the
//      loop signature -> we refuse to auto-reload again and fall back to the
//      manual banner instead of spinning the device.
//
//   2. RELOAD-BEFORE-CONTROL RACE. The reload must fire ONLY after the new worker
//      takes control. We postMessage SKIP_WAITING to the waiting worker, listen
//      for navigator.serviceWorker 'controllerchange', and ONLY THEN reload —
//      exactly once, never on the first-install clients.claim() (hadController),
//      never twice in one page life (in-memory guard), never into a detected
//      loop (sentinel). applyUpdate (the manual button) never reloads the OLD
//      shell directly while a worker is pending; it skip-waits and lets
//      controllerchange do the single reload.
//
//   3. STALE APP SHELL. After the swap, the reload could re-fetch index.html from
//      the HTTP cache (iOS Safari over-caches HTML), re-serving the OLD bundle.
//      Fixed in sw.js: navigate handler fetches the shell { cache: 'no-store' };
//      precache primes { cache: 'reload' }. (Hashed asset bundles never needed a
//      guard — a new hash is always a cache miss -> network.)
//
// SEAMLESS BY DEFAULT: on detecting a pending worker we auto skip-wait it, so the
// controllerchange -> single reload happens with NO user action. The UPDATE_EVENT
// is still dispatched so the UI can show a fallback banner ONLY if the automatic
// path doesn't complete (the component delays the banner; if the auto-reload
// fires first, the banner never paints). After a successful update reload we
// dispatch UPDATED_EVENT so the UI can show a tiny, non-blocking "Updated to the
// latest version" confirmation AFTER the fact — never a decision the user must
// make.
//
// Everything takes injected navigator / window / registration handles so the
// suite drives the full lifecycle deterministically without a real browser
// (node-env vitest; see __tests__/sw-update.test.js). Mirrors the repo's
// "extract the critical decision into a pure module + lock it with an exhaustive
// test" pattern (lib/multi-point-auth.js).

export const UPDATE_EVENT = 'poetech:update-available';
export const UPDATED_EVENT = 'poetech:updated';
// Dispatched when an update could not be applied automatically AND a prior reload
// did not stick (loop signature) — the honest "close & reopen" escape hatch. The
// indicator reads this to escalate its message from "reload" (which isn't working)
// to a hard-relaunch hint, instead of silently spinning.
export const UPDATE_STUCK_EVENT = 'poetech:update-stuck';

// Manual-tap safety net. applyUpdate() posts SKIP_WAITING and lets the
// controllerchange listener (wired by wireUpdates) perform the single reload —
// the correct, race-free path. But controllerchange is not guaranteed to fire in
// every engine/state (a swallowed swap, a slow/failed claim, a scope mismatch),
// and when it doesn't the OLD behavior was a SILENT NO-OP: the tap did nothing
// and the indicator persisted (exactly Darrell's report). So a tap also arms a
// guarded fallback: if the page hasn't navigated within this window, force one
// reload. If controllerchange wins first, the page is already gone and this never
// runs. The sentinel makes the post-reload load detect a genuine non-stick (loop)
// rather than spin. Tuned long enough for a normal swap to win the race.
export const FALLBACK_RELOAD_MS = 2000;

// sessionStorage key. Set immediately before an update reload; read on the next
// page load. sessionStorage persists across same-tab navigations (and the PWA
// standalone window is one tab), so it is the durable loop-guard the in-memory
// counter could not be. Cleared on the post-reload load.
const RELOAD_SENTINEL = 'poetech:sw-reloading';

// ---- null-safe session-storage + reload helpers (all injectable for tests) ----

function getSession(win) {
  try {
    return win && win.sessionStorage && typeof win.sessionStorage.getItem === 'function'
      ? win.sessionStorage
      : null;
  } catch (_) {
    // Some browsers throw on sessionStorage access in private mode.
    return null;
  }
}

function readReloading(win) {
  const ss = getSession(win);
  if (!ss) return null;
  try { return ss.getItem(RELOAD_SENTINEL); } catch (_) { return null; }
}

function markReloading(win) {
  const ss = getSession(win);
  if (!ss) return;
  try { ss.setItem(RELOAD_SENTINEL, '1'); } catch (_) { /* noop */ }
}

function clearReloading(win) {
  const ss = getSession(win);
  if (!ss) return;
  try { ss.removeItem(RELOAD_SENTINEL); } catch (_) { /* noop */ }
}

function doReload(win) {
  try {
    if (win && win.location && typeof win.location.reload === 'function') win.location.reload();
  } catch (_) {
    /* noop */
  }
}

function dispatch(win, type, detail) {
  try {
    const evt = (win && typeof win.CustomEvent === 'function')
      ? new win.CustomEvent(type, { detail })
      : { type, detail };
    if (win && typeof win.dispatchEvent === 'function') win.dispatchEvent(evt);
  } catch (_) {
    /* noop — the banner/toast is a fallback, not load-bearing */
  }
}

// Has the update path become stuck (a reload didn't make the new build stick)?
// Null-safe. Read by the indicator to show the "close & reopen" hint instead of
// a "reload" that has proven not to work on this device.
export function isUpdateStuck(win) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  try { return !!(w && w.__pwaUpdateStuck); } catch (_) { return false; }
}

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

// The visible "Update — reload" indicator calls this. Skip-wait the pending
// worker (waiting, or one still installing); the controllerchange listener wired
// by wireUpdates() then performs the single reload once control passes — the
// correct, race-free path that never reloads the OLD shell while a new worker is
// sitting waiting (that was the loop).
//
// UNBREAKABLE GUARANTEE (the fix for "tap does nothing"): a tap can never be a
// silent no-op. After posting SKIP_WAITING we arm a guarded timed fallback —
// if controllerchange has NOT driven a navigation within FALLBACK_RELOAD_MS, we
// force one reload ourselves. If the swap wins the race first, the page has
// already navigated and the timer never runs. The post-reload load then either
// confirms (no worker waiting -> UPDATED) or, if the new build still didn't
// stick, surfaces the honest "close & reopen" hint (loop signature) — never an
// indicator that spins forever doing nothing.
//
// opts (all optional, for tests): { timeoutMs, setTimeout } inject the timer.
export function applyUpdate(registration, win, opts = {}) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  let pending = null;
  try {
    pending = registration && (registration.waiting || registration.installing);
  } catch (_) {
    /* pending stays null */
  }

  // No worker to hand control to — a plain guarded reload (the user asked to
  // refresh; honor it). The sentinel lets the next load detect the outcome.
  if (!pending) {
    markReloading(w);
    doReload(w);
    return 'reload';
  }

  activateWorker(pending);

  // Arm the safety net. We do NOT set the reload sentinel here — only the actual
  // reload (controllerchange handler, or this timer) sets it, so a swap that
  // succeeds without us is not mis-read as a loop on the next load.
  const setT = opts.setTimeout
    || (w && typeof w.setTimeout === 'function' ? w.setTimeout.bind(w) : null)
    || (typeof setTimeout !== 'undefined' ? setTimeout : null);
  const delay = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : FALLBACK_RELOAD_MS;
  if (setT) {
    try {
      setT(() => {
        // Reaching here means controllerchange did NOT navigate us in time —
        // force the single reload so the tap is never a dead end.
        markReloading(w);
        doReload(w);
      }, delay);
    } catch (_) {
      /* if scheduling fails, the controllerchange path is still in play */
    }
  }
  return 'skip-waiting';
}

// Wire a registration's update lifecycle. Returns a small handle for tests.
//   registration: SW registration ({ waiting, installing, addEventListener })
//   nav:          navigator-like ({ serviceWorker: { controller, addEventListener } })
//   win:          window-like ({ location: { reload }, dispatchEvent, sessionStorage? })
export function wireUpdates(registration, nav, win) {
  const sw = nav && nav.serviceWorker;
  const state = { reloaded: 0, announced: 0, updatedShown: 0, autoApplied: 0 };
  if (!registration || !sw || typeof sw.addEventListener !== 'function') {
    return { state, hadController: false, loopRisk: false };
  }

  // Was the page already controlled when we wired up? If NOT, the first
  // controllerchange is the brand-new install's clients.claim() — reloading
  // there is spurious (first paint already rendered the correct assets) and is
  // the classic source of a first-visit reload loop. We reload ONLY for a real
  // controller swap (old build -> new build).
  const hadController = !!sw.controller;

  // Did we just reload to apply an update? The sentinel survives the reload.
  const justReloaded = readReloading(win) != null;
  if (justReloaded) clearReloading(win);

  // Loop signature: we reloaded for an update last page-life, yet a worker is
  // STILL waiting now — the new build is not sticking (e.g. a stale shell, or a
  // browser that swallowed the swap). Auto-applying again would spin the device,
  // so we DON'T auto-skip-wait; we leave the manual banner as the escape hatch.
  // (controllerchange-driven reload is NOT blocked, so a manual tap still works.)
  const loopRisk = justReloaded && !!registration.waiting;

  const announce = () => {
    state.announced += 1;
    dispatch(win, UPDATE_EVENT, { reg: registration });
  };

  // Quiet, non-blocking confirmation AFTER a successful update reload. Most users
  // only ever see THIS — the seamless apply means they never saw a prompt.
  if (justReloaded && !loopRisk) {
    state.updatedShown += 1;
    dispatch(win, UPDATED_EVENT, {});
  }

  // Loop detected: a reload didn't make the new build stick. Mark the app
  // "stuck" so the indicator escalates from "reload" (proven not to work here)
  // to an honest "fully close & reopen" hint, and never spins the device.
  if (loopRisk) {
    try { if (win) win.__pwaUpdateStuck = true; } catch (_) { /* noop */ }
    dispatch(win, UPDATE_STUCK_EVENT, { reg: registration });
  }

  // Seamless apply: tell the pending worker to take over now. Suppressed only
  // when we've detected a loop — then the manual banner governs.
  const autoApply = (worker) => {
    announce(); // banner intent; the UI delays it and drops it if the reload wins
    if (loopRisk) return;
    if (activateWorker(worker)) state.autoApplied += 1;
  };

  // Case 1: a worker was already waiting at load.
  if (registration.waiting && sw.controller) {
    autoApply(registration.waiting);
  }

  // Case 2: a new worker installs during this session.
  if (typeof registration.addEventListener === 'function') {
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing || typeof installing.addEventListener !== 'function') return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && sw.controller) {
          autoApply(installing);
        }
      });
    });
  }

  // Reload EXACTLY ONCE when control passes to the new worker — only on a real
  // swap (hadController), never on first-install claim, never twice in one page
  // life (in-memory guard). The sentinel is set BEFORE the reload so the next
  // page load detects the loop signature and the "updated" confirmation.
  sw.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (state.reloaded) return;
    state.reloaded += 1;
    markReloading(win);
    doReload(win);
  });

  return { state, hadController, loopRisk };
}

// -----------------------------------------------------------------------------
// checkForLatest — the ACTIVE half of the update system ("Download the latest",
// Darrell 2026-07-07). Everything above reacts to a worker the browser already
// discovered; this asks RIGHT NOW: force registration.update() (re-fetch sw.js),
// then poll briefly for a pending worker. Honest tri-state result:
//   'update-found' — a newer build exists; `pending` is the worker to apply.
//   'latest'       — the check completed and nothing newer is deployed.
//   'no-sw'        — no live registration (dev / unsupported): updates arrive
//                    with the site itself, nothing to download.
// Injectable polls/sleep so the suite drives it deterministically.
// -----------------------------------------------------------------------------
export const CHECK_POLLS = 8;      // 8 × 500ms ≈ a 4s ceiling on "Checking…"
export const CHECK_POLL_MS = 500;
export async function checkForLatest(registration, opts = {}) {
  if (!registration || typeof registration.update !== 'function') {
    return { result: 'no-sw', pending: null };
  }
  try { await registration.update(); } catch (_) { /* offline / fetch fail — read state anyway */ }
  const polls = typeof opts.polls === 'number' ? opts.polls : CHECK_POLLS;
  const delay = typeof opts.pollMs === 'number' ? opts.pollMs : CHECK_POLL_MS;
  const sleep = opts.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  for (let i = 0; i <= polls; i++) {
    let pending = null;
    try { pending = registration.waiting || registration.installing; } catch (_) { /* stays null */ }
    if (pending) return { result: 'update-found', pending };
    if (i < polls) await sleep(delay);
  }
  return { result: 'latest', pending: null };
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
