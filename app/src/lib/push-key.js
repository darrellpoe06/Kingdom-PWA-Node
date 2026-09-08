// =============================================================================
// push-key — the client asks the server which key to subscribe with
// =============================================================================
// The companion to `functions/api/push-key.js`. See that file for WHY this
// exists rather than reading a build-time var: the public and private halves of
// the VAPID pair must come from the same pair, and two independently-set copies
// drift into a state where every subscription is silently rejected at send time
// with nothing in the app able to say so.
//
// THREE PROPERTIES, EACH ONE A FAILURE THIS AVOIDS.
//
//   1. IT NEVER THROWS. This resolves during the first paint of a control. A
//      rejected fetch — offline, a proxy, a cold Function — must degrade to
//      "not configured" (the control renders nothing) rather than take a screen
//      down over a notification opt-in.
//   2. IT VALIDATES THE SHAPE BEFORE HANDING THE KEY ON. `vapidKeyToBytes`
//      throws on a malformed key, and the place it would throw is inside
//      `subscribe()` on somebody's phone, where the only visible symptom is a
//      button that will not turn on. Checked here, a bad key is simply "not
//      configured".
//   3. IT MEMOISES ONLY SUCCESS. A failed lookup must be retryable — caching
//      the failure would make one bad moment at startup permanent for the whole
//      page life.
import { useEffect, useState } from 'react';
import { vapidKeyToBytes } from './push-subscribe.js';

export const PUSH_KEY_URL = '/api/push-key';

let cached = null;

/** Test seam — the memo is module-level, so a suite must be able to clear it. */
export function resetVapidKeyCache() { cached = null; }

/** The key baked in at build time, kept ONLY as a fallback for an unreachable endpoint. */
export function buildTimeVapidKey() {
  try {
    return (import.meta.env || {}).VITE_VAPID_PUBLIC_KEY || '';
  } catch {
    return '';
  }
}

function usable(key) {
  if (!key) return '';
  try {
    vapidKeyToBytes(key);
    return key;
  } catch {
    return '';
  }
}

/**
 * Resolve the VAPID public key. Returns '' when push is not configured here.
 *
 * @param {object} [o]
 * @param {Function} [o.fetchImpl]  injected for tests
 * @param {string}   [o.fallback]   the build-time key, used only if the fetch fails
 */
export async function fetchVapidPublicKey({
  fetchImpl = typeof fetch !== 'undefined' ? fetch : null,
  fallback = buildTimeVapidKey(),
} = {}) {
  if (cached) return cached;
  if (typeof fetchImpl !== 'function') return usable(fallback);
  try {
    const res = await fetchImpl(PUSH_KEY_URL, { headers: { accept: 'application/json' } });
    if (!res || !res.ok) return usable(fallback);
    const body = await res.json();
    // An explicit `configured:false` is the SERVER'S answer and is authoritative
    // — it means the environment holding the private half has no public half to
    // pair with, so the build-time fallback would be exactly the drifted key
    // this module exists to stop us from using.
    if (body && body.configured === false) return '';
    const key = usable(body && body.publicKey);
    if (key) cached = key;
    return key;
  } catch {
    return usable(fallback);
  }
}

/**
 * The same resolution as a hook, for the surfaces that need to know whether to
 * render a push control at all.
 *
 * Returns `undefined` while unresolved — distinct from `''` ("resolved: not
 * configured"). A surface that treats "still loading" as "not configured" will
 * flash its fallback UI and then swap, which reads as a glitch.
 *
 * `{ skip: true }` resolves nothing and issues no request — for a caller that
 * already has the key by another route (an explicit prop, a test).
 */
export function useVapidPublicKey(options) {
  const skip = !!(options && options.skip);
  const [key, setKey] = useState(cached || undefined);
  useEffect(() => {
    if (skip) return undefined;
    let alive = true;
    fetchVapidPublicKey(options).then((k) => { if (alive) setKey(k); });
    return () => { alive = false; };
    // The options object is a stable injection point (tests) or absent (app);
    // re-resolving on identity change would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return key;
}
