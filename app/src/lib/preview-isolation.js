// =============================================================================
// preview-isolation — a preview build can never reach the family's real data
// =============================================================================
// MEASURED 2026-10-28 (Christina, testing the Money redesign on the Vercel
// branch preview): the preview was built with the PRODUCTION connection values,
// so a signed-in family member on it WAS in production — her real obligations
// and debts rendered inside what she believed was the sample, and a "Test
// Debt" she entered was written to the live accounts table. Sample mode was
// only a URL flag (`?demo=`), and a session persisted on the preview origin
// outlived it.
//
// THE RULE: a host that is not the family's own site is a PREVIEW, and on a
// preview the app is a TEST HOUSEHOLD —
//   - the data client points at a stub that can reach nothing (no production
//     URL, no key); sign-in is not offered; no session can exist;
//   - every token the preview origin may still hold from before the rule
//     (a production auth token, the NAS bridge token, the saved profile) is
//     PURGED at boot, before the client is built, so "still signed in" is
//     impossible;
//   - the household is the fictional family sample, and what the tester
//     enters is saved ONLY on that device, under its own key, never the key
//     the real app uses — and any real snapshot the origin kept from before
//     the rule is removed, never loaded;
//   - `?demo=` still opens the pure sample (nothing saved) when asked for.
// Production (poetech.us and its Pages alias) and the family's private hosts
// (localhost, LAN, Tailscale) are unchanged.
//
// Pure decisions in, side effects only in the two purge helpers (which take
// their storage as an argument). Proven by src/__tests__/preview-isolation.test.js.
// =============================================================================

/** The hosts that serve the real app. Everything else that is public is a preview. */
export const PRODUCTION_HOSTS = ['poetech.us', 'www.poetech.us', 'poetech-app.pages.dev'];

/** A stub the data client can be built with that reaches nothing. */
export const PREVIEW_STUB_URL = 'http://127.0.0.1:1';
export const PREVIEW_STUB_KEY = 'preview-isolated-no-key';

/** The household a preview shows when the URL asks for a pure sample with no persona. */
export const PREVIEW_SAMPLE_PERSONA = 'family-of-4';

/** The owner stamp and the device-storage key of the preview test household.
 *  The real app saves under 'poe-financial-v28'; the test household never
 *  reads or writes that key. */
export const PREVIEW_TEST_OWNER = 'preview-test-household';
export const PREVIEW_STORAGE_KEY = 'poe-financial-v28-test-household';

/** The device-storage keys the REAL app may have left on a preview origin
 *  before the rule (a signed-in owner's snapshot, and the legacy keys the
 *  loader falls back to). On a preview they are removed, never loaded. */
export const PREVIEW_REAL_SNAPSHOT_KEYS = ['poe-financial-v28', 'poe-financial-v27', 'poe-financial-v26', 'poe-financial-v25', 'poe-financial-v24', 'poe-financial-v23', 'poe-financial-v22', 'poe-financial-v21'];

/** localStorage keys that carry identity or a road to the family's systems:
 *  the supabase-js session (`sb-<ref>-auth-token`, matched by shape), the
 *  per-device NAS bridge bearer, the saved profile, the cloud-snapshot marker. */
export const PREVIEW_FOREIGN_KEY_PATTERNS = [/^sb-.*-auth-token$/, /^poetech-chat-bridge-token$/, /^poe-current-profile$/, /^poe-snapshot-marker$/];

function isPrivateHost(host) {
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return true;
  if (host.startsWith('100.')) return true;        // Tailscale CGNAT
  if (host.endsWith('.ts.net')) return true;       // Tailscale magic DNS
  if (host.endsWith('.local')) return true;        // mDNS LAN
  if (/^192\.168\./.test(host) || /^10\./.test(host)) return true; // RFC1918
  return false;
}

/** True when `hostname` is a preview deployment: any *.vercel.app host, or a
 *  branch alias under the Pages project (<branch>.poetech-app.pages.dev). */
export function isPreviewHost(hostname) {
  const host = String(hostname || '').toLowerCase().trim();
  if (!host || isPrivateHost(host)) return false;
  if (PRODUCTION_HOSTS.includes(host)) return false;
  if (host.endsWith('.vercel.app')) return true;
  if (host.endsWith('.poetech-app.pages.dev')) return true; // a branch alias; the bare project host is production
  return false;
}

/** The connection the data client is built with: the real values on
 *  production and private hosts; a stub that can reach nothing on a preview. */
export function resolveSupabaseConfig({ hostname = '', url = '', key = '' } = {}) {
  if (isPreviewHost(hostname)) {
    return { url: PREVIEW_STUB_URL, key: PREVIEW_STUB_KEY, isolated: true, reason: `preview host ${hostname}: the data client is isolated from production` };
  }
  return { url: url || '', key: key || '', isolated: false, reason: null };
}

/** The sample persona to boot with. On a preview host the URL's `?demo=`
 *  choice still opens that pure sample; with no `?demo=` the preview boots the
 *  TEST HOUSEHOLD (null = the app's own path, which on a preview seeds the
 *  fictional family and saves on the device only). Elsewhere exactly what the
 *  URL says. */
export function previewSamplePersona(hostname, fromUrl) {
  return fromUrl || null;
}

/** The device-storage key the app saves under: the test household's own key
 *  on a preview, the real key everywhere else. */
export function previewStorageKey(hostname, realKey = 'poe-financial-v28') {
  return isPreviewHost(hostname) ? PREVIEW_STORAGE_KEY : realKey;
}

/** Remove every identity-carrying localStorage key from a preview origin.
 *  Returns the keys removed. Never throws; a blocked storage removes nothing. */
export function purgePreviewForeignState(ls) {
  const removed = [];
  try {
    if (!ls || typeof ls.length !== 'number') return removed;
    const keys = [];
    for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k) keys.push(k); }
    for (const k of keys) {
      if (PREVIEW_FOREIGN_KEY_PATTERNS.some((re) => re.test(k))) { ls.removeItem(k); removed.push(k); }
    }
  } catch (_) { /* storage blocked — nothing readable, nothing to purge */ }
  return removed;
}

/** Remove the REAL app's saved snapshots from a preview origin's device store
 *  (the `window.storage` shim: get/set/remove). Returns the keys that held a
 *  value and were removed. Never throws. */
export async function purgePreviewSnapshots(store) {
  const removed = [];
  if (!store || typeof store.get !== 'function' || typeof store.remove !== 'function') return removed;
  for (const k of PREVIEW_REAL_SNAPSHOT_KEYS) {
    try {
      const had = await store.get(k);
      if (had && had.value) { await store.remove(k); removed.push(k); }
    } catch (_) { /* best effort, key by key */ }
  }
  return removed;
}

/** Window-reading conveniences for the shell; false/null where window is absent. */
export function currentHostname() {
  try { return typeof window !== 'undefined' ? (window.location.hostname || '') : ''; } catch (_) { return ''; }
}
export function isIsolatedPreview() { return isPreviewHost(currentHostname()); }
