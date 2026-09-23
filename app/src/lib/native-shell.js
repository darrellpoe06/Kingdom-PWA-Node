// =============================================================================
// native-shell — the local app carries the house's address (DR-0570)
// =============================================================================
// The web app reaches the NAS through SAME-ORIGIN routes — '/n8n', '/voice',
// '/api/*', '/llm/chat', '/nas-photos', '/ways', '/store/apk', '/scribe',
// '/reviews', '/sb', '/poetech-app/taxes' — that Cloudflare Pages Functions
// answer at poetech.us. Those constants stay RELATIVE on purpose (DR-0218
// zero-n8n; the absolute Funnel URL throttles cross-origin), and this module
// does not change one of them.
//
// Inside the native shell the bundle is served FROM THE DEVICE (Capacitor's
// local server at https://localhost), so a relative '/n8n/…' would ask the
// phone's own asset server for a route only the house has, and get a 404. The
// shell's answer is to carry the house's address: every same-origin transport
// path is re-homed to HOUSE_ORIGIN before the request leaves. Local files —
// /assets, /bible, /emoji, /games — never match a transport route and reach
// the local server untouched.
//
// The ONLY truth consulted is the runtime the shell itself injects
// (window.Capacitor). A build flag would be a second truth that could
// disagree with the first; on the web this module installs nothing and
// returns false.
//
// CORS: capacitor.config enables CapacitorHttp, whose fetch patch routes every
// non-local URL through NATIVE HTTP (no browser origin check) and passes local
// URLs to the real fetch. The bridge is injected at document start, so by the
// time main.jsx installs this wrapper window.fetch is already that patch —
// the re-homed request goes native, the local one goes to the asset server.

export const HOUSE_ORIGIN = 'https://poetech.us';

// The same-origin routes the house answers — one entry per Pages Function
// under app/functions/, EXCEPT poetech-app/assets, which is the asset guard
// for real files that are LOCAL in the shell. A trailing slash means "this
// prefix and everything under it"; no slash means a single route file.
// The test enumerates app/functions and fails if this list and the directory
// disagree in either direction — a new route the shell cannot reach is caught
// the moment it is added.
export const REHOMED_ROUTES = Object.freeze([
  '/api/',
  '/llm/',
  '/n8n/',
  '/nas-photos/',
  '/poetech-app/taxes/',
  '/reviews/',
  '/sb/',
  '/scribe/',
  '/store/',
  '/voice/',
  '/ways/',
  '/automation-status',
  '/interest',
  '/property-history',
  '/review-action',
  '/review-feed',
  '/wake-orchestrator-control',
  '/wake-orchestrator',
]);

/** True when this page is running inside the native shell (the injected
 *  Capacitor runtime says so). Anything else — a browser, a TWA, a test — is
 *  the web, and the web is left exactly as it was. */
export function isNativeShell(win) {
  const cap = win && win.Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

/** Does this pathname belong to a route the house answers? Pure. */
export function isHouseRoute(pathname) {
  const p = String(pathname || '');
  for (const r of REHOMED_ROUTES) {
    if (r.endsWith('/')) {
      if (p === r.slice(0, -1) || p.startsWith(r)) return true;
    } else if (p === r || p.startsWith(r + '/')) {
      return true;
    }
  }
  return false;
}

const NON_HTTP = /^(data:|blob:|about:|javascript:)/i;
const DEFAULT_BASE = 'https://localhost/';

/** The house address for one URL, or null when it should travel as given.
 *  A relative path, or an absolute URL on the LOCAL origin (the base's), that
 *  names a house route becomes the same path at HOUSE_ORIGIN (query kept,
 *  hash dropped — a request never carries one). Any other origin, any
 *  non-http scheme, and every local asset path answers null. Pure. */
function houseAddress(s, base) {
  if (!s || NON_HTTP.test(s)) return null;
  let u, b;
  try { b = new URL(base || DEFAULT_BASE); u = new URL(s, b); } catch { return null; }
  if (u.origin !== b.origin) return null;
  if (!isHouseRoute(u.pathname)) return null;
  return HOUSE_ORIGIN + u.pathname + u.search;
}

/** Re-home one URL string; returns the input unchanged when it stays local
 *  or already points elsewhere. Pure. */
export function rehomeUrl(input, base) {
  const s = String(input == null ? '' : input);
  return houseAddress(s, base) || s;
}

/** Re-home whatever fetch was handed: a string, a URL, or a Request (whose
 *  method, headers and body travel with it). Pure apart from constructing
 *  the new Request. */
export function rehome(resource, base) {
  if (typeof resource === 'string') return rehomeUrl(resource, base);
  if (typeof URL !== 'undefined' && resource instanceof URL) {
    return houseAddress(resource.href, base) || resource;
  }
  if (typeof Request !== 'undefined' && resource instanceof Request) {
    const next = houseAddress(resource.url, base);
    return next ? new Request(next, resource) : resource;
  }
  return resource;
}

/** Wrap window.fetch so house routes leave for the house. Returns true when
 *  installed, false on the web (nothing touched) or when already installed. */
export function installNativeShell(win) {
  if (!isNativeShell(win)) return false;
  if (win.__PT_NATIVE_SHELL) return false;
  const inner = win.fetch;
  if (typeof inner !== 'function') return false;
  const base = () => (win.location && win.location.href) || 'https://localhost/';
  win.fetch = (resource, options) => inner.call(win, rehome(resource, base()), options);
  win.__PT_NATIVE_SHELL = true;
  return true;
}
