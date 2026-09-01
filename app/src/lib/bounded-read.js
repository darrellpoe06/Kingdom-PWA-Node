// =============================================================================
// bounded-read — a read that can never hang the surface waiting on it
// =============================================================================
// "Never throws" is not the same as "always answers". A promise that never
// SETTLES strands its caller exactly as badly as one that rejects, and unlike a
// rejection there is nothing to catch: the await simply never returns, and any
// setLoading(false) after it is unreachable code.
//
// THE HANG THIS EXISTS FOR IS NOT HYPOTHETICAL. supabase-js routes every
// PostgREST call through _getAccessToken() -> auth.getSession(), which takes the
// cross-tab Navigator lock. ONE frozen or discarded poetech.us tab holding that
// lock strands every query in the app indefinitely. It has now bitten three
// separate surfaces:
//   - the boot gate      -> bounded in lib/supabase.js (resolveInitialSession, 2026-07-13)
//   - Admin access+usage -> bounded in lib/access-metrics-sync.js (8 tabs open, 2026-07-22)
//   - PIN reads          -> bounded in lib/pin.js
//   - Properties         -> unbounded until 2026-09-01: ?view=properties sat on
//     "Opening your properties..." across reloads with nothing rendered to tap
//     (Darrell, build 3e929cf, ~9 tabs open).
//
// It lives in lib/ rather than beside any one module's loaders on purpose: a
// module's I/O file is routinely replaced wholesale by a test mock, and a bound
// that disappears under a mock is a bound the surface cannot rely on.
// =============================================================================

// Generous for a real round trip, tight enough that the surface resolves FAST
// into either the data or an honest error instead of a slow freeze. Matches
// SNAPSHOT_TIMEOUT_MS in access-metrics-sync.js, for the reason stated there.
export const READ_TIMEOUT_MS = 6000;

// The ceiling for an OPTIONAL pre-read that must never spend the real reads'
// time — e.g. properties' claimPropertyAccess(), a courtesy RPC that turns
// "invited" into "recognized" and whose failure is not a failure to reach
// anything. Deliberately shorter than READ_TIMEOUT_MS and deliberately its own
// budget: when it shared one, a ~5s stall on supabase-js's auth-lock acquire
// (lockAcquireTimeout is 5000ms in 2.106) left the reads ~1s and every one of
// them reported 'not-reached' — reads that would have answered given room. A
// bound must never become the thing that fails the read.
export const OPTIONAL_TIMEOUT_MS = 2500;

/**
 * One ceiling for a WHOLE sequence of reads, not one per read. A boot that makes
 * three sequential round trips stacks a per-call ceiling into 3 x 6s -- the ~18s
 * freeze access-metrics-sync.js was written to kill. Start a deadline once, spend
 * what is left of it on each call, and the sequence resolves inside
 * READ_TIMEOUT_MS however many stages it later grows to.
 *
 * @param {number} ms
 * @returns {() => number} milliseconds remaining, never negative.
 */
export function deadlineIn(ms = READ_TIMEOUT_MS) {
  const at = Date.now() + ms;
  return () => Math.max(0, at - Date.now());
}

/**
 * Resolve a `{ ok, ... }` read, or give back `fallback` once `ms` is spent. A
 * rejection degrades the same way, so this is the single place such a read can
 * end. The timeout NEVER cancels the underlying request -- it only stops the UI
 * waiting on it; a late answer is simply ignored.
 *
 * READS ONLY. Writes are deliberately left unbounded: telling someone a write
 * failed when it actually landed is worse than making them wait for it.
 */
export function boundedRead(promise, ms = READ_TIMEOUT_MS, fallback = { ok: false, reason: 'not-reached' }) {
  let timer;
  const timed = new Promise((resolve) => { timer = setTimeout(() => resolve(fallback), ms); });
  const wrapped = Promise.resolve(promise).then(
    (v) => { clearTimeout(timer); return v; },
    () => { clearTimeout(timer); return fallback; },
  );
  return Promise.race([wrapped, timed]);
}
