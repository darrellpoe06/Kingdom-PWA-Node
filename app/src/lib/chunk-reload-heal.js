// =============================================================================
// chunk-reload-heal — recover the app when a lazy chunk 404s on a skewed deploy
// =============================================================================
// WHY THIS EXISTS (root-caused 2026-06-30). The live report: "the Voice tab does
// not work" — while other tabs did. The Voice surface (and every feature surface)
// is a `React.lazy(() => import('./components/VoiceStudio.jsx'))` in surfaces.js,
// so its JS chunk is fetched ON DEMAND the first time the tab is opened. Under this
// repo's heavy merge cadence, Vercel produces many production deploys a day, and
// the CDN edge can serve a STALE app shell whose immutable chunk hashes a newer
// deploy already replaced (deploy skew). A pre-loaded tab keeps working from cache;
// a lazy tab opened later requests `VoiceStudio-<oldhash>.js`, which the current
// deploy 404s → React.lazy throws → the ErrorBoundary shows a dead tab. That is the
// EXACT "Voice broken, everything else fine" signature, and nothing self-healed it.
//
// Vite fires a `vite:preloadError` event on window whenever a dynamic-import chunk
// fails to load. This module listens for it and, ONCE, reloads the page — the SW's
// network-first/no-store navigation (app/public/sw.js) then pulls the CURRENT shell
// with current chunk hashes, so the tab loads on the retry. A timestamp window
// guards against reload loops: if a heal-reload is followed by ANOTHER chunk failure
// within the window, we stop and let the ErrorBoundary show its fallback (the server
// is genuinely broken, not merely skewed — reloading would only spin the device).
//
// Pure + injectable (clock, reload, storage) so the decision is locked by a node
// vitest with no real browser — mirrors lib/sw-update.js. The healthy path is a
// no-op: `vite:preloadError` never fires unless a chunk actually failed, so a
// well-served user is never reloaded.
//
// PREVENT-DEFAULT ONLY WHEN HEALING (root-caused 2026-07-10, DR-0139, live).
// Vite's preload helper works like: catch(err) { dispatch vite:preloadError;
// if (!defaultPrevented) throw err; } — so preventDefault() makes the failed
// import() RESOLVE UNDEFINED instead of rejecting. The old handler prevented
// unconditionally; on the 'gave-up' rung (loop guard, no reload coming) the
// import resolved undefined, main.jsx destructured it ("Cannot destructure
// property 'default' of 'undefined'"), and the REAL error (a 404'd chunk, a
// module that threw) was destroyed — reproduced in a real Chromium run of the
// live build. Now: prevent ONLY when we are about to reload (the error is
// moot — the page is leaving); on gave-up we let Vite rethrow so the import
// REJECTS with the truth, the boundary shows it, and the journal records it.

// sessionStorage key holding the ms timestamp of the last heal-reload. sessionStorage
// survives the reload (same tab / PWA standalone window) so the post-reload load can
// detect a too-soon second failure = loop, instead of spinning.
import { recordError } from './error-journal.js';

export const HEAL_TS_KEY = 'poetech:chunk-heal-ts';

// If a chunk fails AGAIN within this window after a heal-reload, treat it as a loop
// (the reload did not fix it) and give up gracefully. Long enough that a genuine
// recovery — fresh shell boots, user later opens a different lazy tab — reads as a
// NEW, unrelated skew and is allowed to heal again.
export const HEAL_WINDOW_MS = 20000;

function safeSession(win) {
  try {
    return win && win.sessionStorage && typeof win.sessionStorage.getItem === 'function'
      ? win.sessionStorage
      : null;
  } catch (_) {
    return null; // private mode can throw on access
  }
}

/**
 * Decide whether to recover from a chunk-load failure. Pure + null-safe.
 * Returns 'reload' (stamp the time and reload now) or 'gave-up' (a heal-reload just
 * happened and it failed again — don't loop; let the boundary fallback show).
 * @param {object} win  window-like ({ sessionStorage })
 * @param {number} now  current time in ms (injected for tests)
 */
export function decideChunkHeal(win, now) {
  const ss = safeSession(win);
  // No sessionStorage (private mode / blocked) = no way to COUNT attempts, so a
  // persistently broken serve would reload-loop forever. Same brake as the
  // boot-heal ladder (DR-0139): can't count → don't loop; let the error surface.
  if (!ss) return 'gave-up';
  let prev = NaN;
  try { prev = parseInt(ss.getItem(HEAL_TS_KEY) || '', 10); } catch (_) { /* ignore */ }
  if (Number.isFinite(prev) && now - prev >= 0 && now - prev < HEAL_WINDOW_MS) {
    return 'gave-up'; // we already reloaded recently and a chunk STILL failed → loop guard
  }
  try { ss.setItem(HEAL_TS_KEY, String(now)); } catch (_) { /* ignore */ }
  return 'reload';
}

/**
 * Wire the self-heal: on `vite:preloadError` (a lazy chunk failed to load), recover
 * once by reloading to the current shell. Returns an unsubscribe fn. All side-effects
 * are injectable for tests; the default reload bypasses the HTTP cache where possible.
 * @param {object} win  window-like
 * @param {object} opts { now, reload } injected for tests
 */
export function wireChunkHeal(win, opts = {}) {
  const w = win || (typeof window !== 'undefined' ? window : undefined);
  if (!w || typeof w.addEventListener !== 'function') return () => {};
  const nowFn = opts.now || (() => Date.now());
  const reload = opts.reload || (() => {
    try {
      // Prefer a forced reload; fall back to plain reload() across engines.
      if (w.location && typeof w.location.reload === 'function') w.location.reload();
    } catch (_) { /* ignore */ }
  });
  const handler = (event) => {
    if (decideChunkHeal(w, nowFn()) === 'reload') {
      // We own the recovery: swallow the error (the reload replaces the page)
      // and journal the heal so the recovery is visible on the quality board.
      try { if (event && typeof event.preventDefault === 'function') event.preventDefault(); } catch (_) { /* ignore */ }
      try {
        recordError({ source: 'chunk-heal', kind: 'heal', message: 'stale chunk after a deploy — auto-reloaded to the current shell' }, w);
      } catch (_) { /* watcher never blocks the heal */ }
      reload();
    }
    // 'gave-up': do NOT preventDefault — Vite rethrows, the import rejects with
    // the REAL error, and the boundary/fallback + journal report the truth.
  };
  w.addEventListener('vite:preloadError', handler);
  return () => { try { w.removeEventListener('vite:preloadError', handler); } catch (_) { /* ignore */ } };
}
