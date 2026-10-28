// =============================================================================
// preview-isolation — a preview build can never reach the family's real data
// =============================================================================
// MEASURED 2026-10-28 (Christina, testing the Money redesign on the Vercel
// branch preview): the preview is built with the PRODUCTION connection values,
// so a signed-in family member on it IS in production — her real obligations
// and debts rendered inside what she believed was the sample, and a "Test
// Debt" she entered was written to the live accounts table. Sample mode was
// only a URL flag (`?demo=`), and a session persisted on the preview origin
// outlived it.
//
// THE RULE: a host that is not the family's own site is a PREVIEW, and on a
// preview the app is sample-only — the data client points at a stub that can
// reach nothing, sample mode is forced regardless of the URL, and sign-in is
// not offered. Production (poetech.us and its Pages alias) and the family's
// private hosts (localhost, LAN, Tailscale) are unchanged.
//
// Pure: hostnames in, decisions out. No window, no network. Proven by
// src/__tests__/preview-isolation.test.js.
// =============================================================================

/** The hosts that serve the real app. Everything else that is public is a preview. */
export const PRODUCTION_HOSTS = ['poetech.us', 'www.poetech.us', 'poetech-app.pages.dev'];

/** A stub the data client can be built with that reaches nothing. */
export const PREVIEW_STUB_URL = 'http://127.0.0.1:1';
export const PREVIEW_STUB_KEY = 'preview-isolated-no-key';

/** The sample household a preview always shows. */
export const PREVIEW_SAMPLE_PERSONA = 'family-of-4';

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

/** The sample persona to boot with: on a preview host ALWAYS a sample (the
 *  URL's choice if it names one, else the family sample); elsewhere exactly
 *  what the URL says (null = the real app). */
export function previewSamplePersona(hostname, fromUrl) {
  if (isPreviewHost(hostname)) return fromUrl || PREVIEW_SAMPLE_PERSONA;
  return fromUrl;
}

/** Window-reading conveniences for the shell; false/null where window is absent. */
export function currentHostname() {
  try { return typeof window !== 'undefined' ? (window.location.hostname || '') : ''; } catch (_) { return ''; }
}
export function isIsolatedPreview() { return isPreviewHost(currentHostname()); }
