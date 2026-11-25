// =============================================================================
// sb-failover — a second road for sign-in and data (DR-1653; decided in DR-1622)
// =============================================================================
// The app reaches the house's own database by ONE address today, the Tailscale
// Funnel. On 2026-11-24/25 the NAS's Tailscale login lapsed (the box itself ran
// the whole time, 34 days up) and that one address went dark: sign-in, The
// Word, photos and cameras all failed at once. DR-1622: "No outside system is
// the only door."
//
// This wraps the Supabase client's fetch. When the primary address cannot be
// reached at all (a network error) or the EDGE in front of it answers with a
// gateway failure (502/503/504/520-530), the same request is sent once to the
// fallback address -- the Cloudflare Tunnel the NAS dials out on -- and the
// fallback is preferred for a few minutes so every call does not pay the
// failed first try. A 4xx is the server ANSWERING; it is never retried.
//
// OFF unless a fallback is configured: with no fallback this returns the
// platform fetch unchanged, byte for byte. Realtime websockets do not ride
// fetch and are not covered (said plainly, DR-0076).
// =============================================================================

export const FAILOVER_STATUSES = Object.freeze([502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530]);
export const PREFER_FALLBACK_MS = 5 * 60 * 1000;

const trimSlash = (s) => String(s || '').replace(/\/+$/, '');

/** Rewrite `url` from the primary base to the fallback base, or null if it is not under the primary. */
export function rewriteToFallback(url, primary, fallback) {
  const p = trimSlash(primary);
  const f = trimSlash(fallback);
  const u = String(url);
  if (!p || !f || !(u === p || u.startsWith(p + '/') || u.startsWith(p + '?'))) return null;
  return f + u.slice(p.length);
}

/**
 * @param {object} o
 * @param {string} o.primary   the base the client was created with (e.g. https://…ts.net/sb)
 * @param {string} [o.fallback] the tunnel base (e.g. https://sb.poetech.us); unset = off
 * @param {Function} [o.fetchImpl] injectable for tests
 * @param {Function} [o.now] injectable clock
 * @param {Function} [o.onSwitch] called with ('fallback'|'primary', reason) when the road changes
 */
export function createFailoverFetch({ primary, fallback, fetchImpl, now = () => Date.now(), onSwitch = null } = {}) {
  const base = fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (!fallback || !trimSlash(fallback) || !base) return base;
  let preferUntil = 0;

  return async function failoverFetch(input, init) {
    const url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
    const alt = rewriteToFallback(url, primary, fallback);
    // A Request object's body can be read once; only plain (url, init) calls are retried.
    const retryable = alt && (typeof input === 'string' || input instanceof URL);
    if (!retryable) return base(input, init);

    if (now() < preferUntil) {
      try {
        const r = await base(alt, init);
        if (!FAILOVER_STATUSES.includes(r.status)) return r;
      } catch (_) {
        /* the fallback is down too; try the primary below */
      }
      preferUntil = 0;
      if (onSwitch) onSwitch('primary', 'fallback failed');
      return base(input, init);
    }

    let reason;
    try {
      const r = await base(input, init);
      if (!FAILOVER_STATUSES.includes(r.status)) return r;
      reason = `HTTP ${r.status}`;
      // Keep the primary's answer to return if the fallback cannot do better.
      try {
        const r2 = await base(alt, init);
        if (!FAILOVER_STATUSES.includes(r2.status)) {
          preferUntil = now() + PREFER_FALLBACK_MS;
          if (onSwitch) onSwitch('fallback', reason);
          return r2;
        }
      } catch (_) {
        /* fallback unreachable: the primary's own answer is the honest one */
      }
      return r;
    } catch (e) {
      reason = (e && e.message) || 'network error';
      const r2 = await base(alt, init); // if this throws too, the caller sees the real failure
      preferUntil = now() + PREFER_FALLBACK_MS;
      if (onSwitch) onSwitch('fallback', reason);
      return r2;
    }
  };
}
