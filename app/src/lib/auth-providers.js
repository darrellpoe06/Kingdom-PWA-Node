// =============================================================================
// auth-providers — ask GoTrue which social logins are ACTUALLY switched on
// =============================================================================
// Born 2026-09-11, 11:58am, in the middle of a church meeting. Someone tapped
// "Continue with Google" on /love-corner and got a popup containing this and
// nothing else:
//
//   {"code":400,"error_code":"validation_failed",
//    "msg":"Unsupported provider: provider is not enabled"}
//
// Raw JSON, no heading, no way back. The cause was upstream (the sovereign
// GoTrue stack carried no Google provider config -- fixed in
// infra/nas-supabase/docker-compose.yml), but the REASON it reached a person's
// eyes is here, in the client:
//
//   supabase-js builds the /authorize URL LOCALLY. signInWithOAuth never
//   touches the network, so it never fails, so `res.error` is always empty --
//   and the app hands the browser a URL it has no idea is dead. The popup
//   flow then reports `cancelled` when the user closes that JSON window, so
//   the modal shows NO error either. Silent, twice.
//
// The only thing that knows the truth is GoTrue itself. /auth/v1/settings is
// its public, unauthenticated description of its own configuration (kong's
// auth-v1 route carries no key-auth, so this is one same-origin GET through
// the /sb door the family's browsers already ride), and it reports:
//
//   { "external": { "google": false, "apple": false, "email": true, ... } }
//
// So we ASK before we navigate. Real state, from the running service, on the
// screen the user is actually on (DR-0061 reality-trace; DR-0076 measure,
// don't claim).
//
// THE NO-LOCKOUT RULE, and why "unknown" is permissive here:
//   Everywhere else in this repo, unknown never reads as good (DR-0125). This
//   is the one inversion, on purpose. A failed probe is not evidence that
//   Google is off -- it is evidence that we could not ask. Blocking sign-in on
//   a flaky network would take away a login path that works, which is a WORSE
//   outcome than the JSON popup we are fixing. So:
//
//     known-disabled -> block, and say what DOES work.
//     enabled or unknown -> proceed exactly as before. No regression.
//
//   The probe therefore never gates the happy path, and its own failure is
//   never fatal.
//
// WHY THE PROBE RUNS ON OPEN AND THE CLICK READS ONLY THE CACHE:
//   A popup must be opened from a user gesture. Awaiting a network request
//   inside the click handler spends that gesture -- Safari and Firefox then
//   treat the window.open as unsolicited and block it, which would demote
//   every Google sign-in to the full-page redirect and lose the "keep your
//   place" behaviour the popup exists for. So:
//
//     primeAuthProviders()   -- fired when the sign-in surface MOUNTS, ignored
//                               if it fails, deduped so many mounts cost one
//                               request.
//     guardProviderCached()  -- SYNCHRONOUS, cache-only, never fetches. This
//                               is what the click calls, so window.open still
//                               happens in the same tick as the tap.
//
//   A member who taps before the probe lands reads "unknown" and proceeds
//   exactly as they do today -- no regression, and the cancelled-popup
//   re-check still explains a real outage afterwards.
// =============================================================================
// Read the env DIRECTLY rather than importing SUPABASE_URL from supabase.js.
// Two reasons, both real: this module needs one string and has no business
// pulling in the whole client (and its localStorage/auth side effects) to get
// it; and supabase.js is vi.mock'd by the component render tests, so importing
// a named export from it would make THIS module's behaviour depend on every
// mock in the suite remembering to re-export a constant it never uses. Same
// source of truth either way -- supabase.js reads this exact variable.
const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};
const SUPABASE_URL = ENV.VITE_SUPABASE_URL || '';

// Written WITHOUT a leading slash on purpose. This is a suffix appended to
// SUPABASE_URL (which on the live host is `https://poetech.us/sb`), never a
// path the app requests from the site root -- and a root-absolute literal
// spelled with a leading slash would be exactly that lie. The client-path
// parity guard reads these literals and is right to: a bare /auth/... has no
// provider on the production host and would fall through to the SPA, which
// answers 200 with the app's HTML. A probe that "succeeds" against an HTML
// page is worse than one that fails.
const SETTINGS_PATH = 'auth/v1/settings';

// Explicit thresholds. An auth probe that hangs is a login that hangs, so it
// gets a hard ceiling and a short-lived cache (a provider is switched on by an
// env edit + restart, so minutes-fresh is fresh enough, and the cache means
// tapping the button twice does not re-probe).
const TIMEOUT_MS = 4000;
const TTL_MS = 5 * 60 * 1000;

let cache = null; // { at: epoch_ms, external: object|null }
let inflight = null; // the in-flight prime, so many mounts cost one request

/** Drop the memoised probe. Tests call this; so does a sign-out. */
export function resetAuthProvidersCache() {
  cache = null;
  inflight = null;
}

/**
 * Read GoTrue's own settings. Never throws, never rejects: every failure path
 * resolves to { known: false } so a caller can carry on.
 *
 * @param {object} [opts]
 * @param {Function} [opts.fetchImpl] injectable fetch (tests)
 * @param {string}   [opts.baseUrl]   injectable base URL (tests)
 * @param {number}   [opts.now]       injectable clock (tests)
 * @returns {Promise<{ known: boolean, external: object|null }>}
 */
export async function fetchAuthProviders(opts = {}) {
  const now = typeof opts.now === 'number' ? opts.now : Date.now();
  if (cache && cache.external && now - cache.at < TTL_MS) {
    return { known: true, external: cache.external };
  }

  const f = opts.fetchImpl || (typeof fetch === 'function' ? fetch : null);
  const base = opts.baseUrl || SUPABASE_URL;
  if (!f || !base) return { known: false, external: null };

  // AbortController is the timeout. Without it a stalled socket holds the
  // button in "Opening Google..." forever, which is the hang this guard exists
  // to prevent rather than cause.
  let ctl = null;
  let timer = null;
  try {
    if (typeof AbortController === 'function') {
      ctl = new AbortController();
      timer = setTimeout(() => { try { ctl.abort(); } catch (_) { /* noop */ } }, TIMEOUT_MS);
    }
  } catch (_) { ctl = null; }

  try {
    const res = await f(String(base).replace(/\/+$/, '') + '/' + SETTINGS_PATH, {
      method: 'GET',
      headers: { accept: 'application/json' },
      ...(ctl ? { signal: ctl.signal } : {}),
    });
    if (!res || !res.ok) return { known: false, external: null };
    const body = await res.json();
    const external = body && typeof body.external === 'object' && body.external ? body.external : null;
    if (!external) return { known: false, external: null };
    cache = { at: now, external };
    return { known: true, external };
  } catch (_) {
    // Offline, aborted, CORS, malformed JSON -- all the same answer: we could
    // not ask, so we do not claim to know.
    return { known: false, external: null };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * @param {string} provider e.g. 'google', 'apple'
 * @returns {Promise<'enabled'|'disabled'|'unknown'>}
 */
export async function providerStatus(provider, opts = {}) {
  const key = String(provider || '').toLowerCase();
  if (!key) return 'unknown';
  const { known, external } = await fetchAuthProviders(opts);
  if (!known || !external) return 'unknown';
  if (!(key in external)) return 'disabled'; // GoTrue lists every provider it knows
  return external[key] ? 'enabled' : 'disabled';
}

/**
 * Start the probe without waiting for it. Call this when a sign-in surface
 * mounts. Deduped: concurrent callers share one request, and a warm cache is a
 * no-op. Never throws, never rejects -- a failure just leaves the answer
 * unknown, which is permissive by design.
 */
export function primeAuthProviders(opts = {}) {
  const now = typeof opts.now === 'number' ? opts.now : Date.now();
  if (cache && cache.external && now - cache.at < TTL_MS) return Promise.resolve();
  if (inflight) return inflight;
  inflight = fetchAuthProviders(opts)
    .catch(() => ({ known: false, external: null }))
    .then(() => { inflight = null; });
  return inflight;
}

/**
 * Cache-only, SYNCHRONOUS provider state. Returns 'unknown' when the probe has
 * not landed (or failed) -- it never starts a request, so it is safe to call
 * inside a click handler without spending the user gesture.
 *
 * @returns {'enabled'|'disabled'|'unknown'}
 */
export function cachedProviderStatus(provider, opts = {}) {
  const key = String(provider || '').toLowerCase();
  if (!key) return 'unknown';
  const now = typeof opts.now === 'number' ? opts.now : Date.now();
  if (!cache || !cache.external || now - cache.at >= TTL_MS) return 'unknown';
  if (!(key in cache.external)) return 'disabled';
  return cache.external[key] ? 'enabled' : 'disabled';
}

const LABEL = { google: 'Google', apple: 'Apple', azure: 'Microsoft', facebook: 'Facebook' };

/**
 * The gate a sign-in button calls BEFORE it navigates anywhere.
 *
 * @returns {Promise<{ ok: boolean, status: string, message: string }>}
 *   ok:true  -> go (enabled, or we could not ask)
 *   ok:false -> do NOT navigate; show `message`, which names a way in that works
 */
export async function guardProvider(provider, opts = {}) {
  return verdict(provider, await providerStatus(provider, opts));
}

/**
 * The SYNCHRONOUS gate a sign-in BUTTON calls. Cache-only, so the popup is
 * still opened inside the user's own gesture. Same contract as guardProvider:
 * only a known-disabled provider is refused.
 */
export function guardProviderCached(provider, opts = {}) {
  return verdict(provider, cachedProviderStatus(provider, opts));
}

function verdict(provider, status) {
  if (status !== 'disabled') return { ok: true, status, message: '' };
  const name = LABEL[String(provider).toLowerCase()] || 'That';
  return {
    ok: false,
    status,
    message: `${name} sign-in isn’t switched on yet. Use your email and password just below — or the “trouble signing in?” link to get a sign-in link emailed to you.`,
  };
}

export default {
  fetchAuthProviders, providerStatus, guardProvider,
  primeAuthProviders, cachedProviderStatus, guardProviderCached,
  resetAuthProvidersCache,
};
