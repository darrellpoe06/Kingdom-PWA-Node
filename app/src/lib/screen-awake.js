// =============================================================================
// screen-awake — the screen stays on while a lesson is open or being read
// =============================================================================
// Darrell 2026-09-16: "Can we have the system as cellphone user to increase
// their time limits on the screen use when the Learn and other media tabs are
// being used... my Zfold 7 allows 10 minutes until it goes black... A prompt to
// users... so it doesn't cut out their lesson and they can push play and it
// will continue."
//
// A web page cannot change a phone's screen-timeout setting. It CAN hold the
// screen on for as long as it is visible with the Screen Wake Lock API
// (navigator.wakeLock — Chrome/Android, Safari 16.4+, Edge). So the app holds
// one wake-lock sentinel while ANY holder is active — a lesson open in Learn, a
// reading in progress — and lets go the moment none is. The OS revokes the
// sentinel when the page hides; we re-request it when the page is visible
// again (the spec's own pattern). Where the API is missing, `supported` is
// false and the surface says so honestly, with the phone's own setting named,
// instead of pretending.
//
// The primitive, not per-surface code: reference-counted holders, one
// listener, one sentinel. Per-device preference (`poe-screen-awake`, default
// on — the reader asked for the screen to stay on; turning it off is one tap
// in the Read Aloud panel). Every async step has an explicit timeout and a
// fallback path (DoD): a request that neither resolves nor rejects in
// REQUEST_TIMEOUT_MS is treated as not held.
import { useCallback, useEffect, useState } from 'react';

export const SCREEN_AWAKE_KEY = 'poe-screen-awake';
export const REQUEST_TIMEOUT_MS = 5000;
// Plain words for the browser that cannot hold the screen. The Android path is
// named because that is the phone in the report; iOS has the same control under
// Display & Brightness → Auto-Lock.
export const NO_WAKE_LOCK_HINT = 'This browser cannot keep the screen on by itself. So the lesson is not cut off, lengthen your phone\'s screen timeout while you read (Android: Settings → Display → Screen timeout · iPhone: Settings → Display & Brightness → Auto-Lock).';

export function isScreenAwakeSupported(nav = (typeof navigator !== 'undefined' ? navigator : undefined)) {
  return !!(nav && nav.wakeLock && typeof nav.wakeLock.request === 'function');
}

export function loadScreenAwakePref(store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try { const v = store && store.getItem(SCREEN_AWAKE_KEY); if (v === 'off') return false; } catch (_) { /* private mode */ }
  return true;
}

export function saveScreenAwakePref(on, store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try { if (store) store.setItem(SCREEN_AWAKE_KEY, on ? 'on' : 'off'); } catch (_) { /* non-fatal */ }
}

/**
 * The manager. One per document; tests build their own with a fake navigator
 * and a fake document so every branch is exercised without a real screen.
 */
export function createScreenAwake({
  nav = (typeof navigator !== 'undefined' ? navigator : undefined),
  doc = (typeof document !== 'undefined' ? document : undefined),
  store = (typeof localStorage !== 'undefined' ? localStorage : undefined),
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  const holders = new Set();
  const subs = new Set();
  let sentinel = null;
  let requesting = false;
  let enabled = loadScreenAwakePref(store);
  let reason = ''; // '' | 'blocked' | 'timeout' | 'hidden' | 'off' | 'unsupported'
  let listening = false;

  const supported = isScreenAwakeSupported(nav);
  const state = () => ({ supported, enabled, held: !!sentinel && !sentinel.released, holders: holders.size, reason });
  const emit = () => { for (const cb of subs) { try { cb(state()); } catch (_) { /* a listener never breaks the lock */ } } };

  const wantHeld = () => supported && enabled && holders.size > 0 && !(doc && doc.visibilityState === 'hidden');

  async function acquire() {
    if (requesting || (sentinel && !sentinel.released)) return;
    requesting = true;
    try {
      const req = nav.wakeLock.request('screen');
      const timer = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs));
      const s = await Promise.race([req, timer]);
      if (!wantHeld()) { try { await s.release(); } catch (_) { /* ignore */ } sentinel = null; }
      else {
        sentinel = s;
        reason = '';
        try { s.addEventListener && s.addEventListener('release', () => { if (sentinel === s) { sentinel = null; if (doc && doc.visibilityState === 'hidden') reason = 'hidden'; emit(); } }); } catch (_) { /* ignore */ }
      }
    } catch (e) {
      sentinel = null;
      reason = e && e.message === 'timeout' ? 'timeout' : 'blocked';
    } finally {
      requesting = false;
      emit();
    }
  }

  async function release() {
    const s = sentinel; sentinel = null;
    if (s && !s.released) { try { await s.release(); } catch (_) { /* ignore */ } }
    emit();
  }

  function reconcile() {
    if (!supported) { reason = 'unsupported'; emit(); return; }
    if (!enabled) { reason = 'off'; if (sentinel) release(); else emit(); return; }
    if (wantHeld()) acquire(); else if (sentinel) release(); else emit();
  }

  const onVisibility = () => reconcile();
  function listen(on) {
    if (!doc || typeof doc.addEventListener !== 'function' || on === listening) return;
    if (on) doc.addEventListener('visibilitychange', onVisibility); else doc.removeEventListener('visibilitychange', onVisibility);
    listening = on;
  }

  return {
    hold(key) { holders.add(key); listen(true); reconcile(); },
    drop(key) { holders.delete(key); if (holders.size === 0) listen(false); reconcile(); },
    setEnabled(on) { enabled = !!on; saveScreenAwakePref(enabled, store); reconcile(); },
    subscribe(cb) { subs.add(cb); return () => subs.delete(cb); },
    getState: state,
  };
}

let shared = null;
export function screenAwake() { if (!shared) shared = createScreenAwake(); return shared; }
/** Tests only: drop the shared manager so the next call builds a fresh one. */
export function _resetScreenAwakeForTests() { shared = null; }

/**
 * React glue. Holds the screen while `active`; returns the live state and the
 * per-device switch. `key` names the holder (a lesson, the reader) so two
 * surfaces never release each other's hold.
 */
export function useScreenAwake(active, key = 'default') {
  const mgr = screenAwake();
  const [s, setS] = useState(() => mgr.getState());
  useEffect(() => mgr.subscribe(setS), [mgr]);
  useEffect(() => {
    if (!active) return undefined;
    mgr.hold(key);
    return () => mgr.drop(key);
  }, [mgr, active, key]);
  const setEnabled = useCallback((on) => mgr.setEnabled(on), [mgr]);
  return { ...s, setEnabled, hint: s.supported ? '' : NO_WAKE_LOCK_HINT };
}
