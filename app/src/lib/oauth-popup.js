// =============================================================================
// oauth-popup — Google sign-in in a POPUP window, so the user keeps their place
// =============================================================================
// Darrell 2026-06-17: auth should happen QUIETLY inside the app — no full-page
// redirect that yanks someone away from where they were. So Google OAuth runs in
// a small popup: they sign in, the popup closes, and they are signed in right
// where they stood (the in-app modal closes over the page they were on).
//
// HOW IT WORKS (implicit flow, same-origin, no extra backend):
//   1. We ask supabase for the provider URL WITHOUT redirecting this page
//      (skipBrowserRedirect), with redirectTo = this page + ?oauth_popup=1.
//   2. We open that URL in a popup. Google -> Supabase callback -> back to our
//      page with the session in the URL fragment, inside the popup.
//   3. The popup boot (main.jsx) detects ?oauth_popup=1, lets supabase parse and
//      STORE the session (shared per-origin localStorage), tells the opener via
//      postMessage, and closes itself.
//   4. This opener resolves: supabase's cross-tab broadcast already fires
//      SIGNED_IN to onAuthChange; as a deterministic backstop we refreshSession()
//      from the just-written storage and read getSession(). Either way the whole
//      app flips to signed-in in place.
//
// NO LOCKOUT / GRACEFUL FALLBACK: if the popup is blocked or unsupported, the
// caller falls back to the classic full-page redirect (signInWithGoogle). The
// email Royalty Link and email+password paths remain untouched. There is always
// a way in.
// =============================================================================
import supabase from './supabase.js';

export const OAUTH_POPUP_PARAM = 'oauth_popup';
const POPUP_NAME = 'poetech-oauth';
const POPUP_MESSAGE = 'poetech-oauth';

/**
 * Open Google sign-in in a popup. Resolves once the user is signed in, cancels,
 * or the popup is closed.
 *
 * @param {object} [opts]
 * @param {object} [opts.client] supabase client (injectable for tests)
 * @param {Window} [opts.win] window (injectable for tests)
 * @returns {Promise<{ ok: boolean, blocked?: boolean, unsupported?: boolean,
 *                      cancelled?: boolean, error?: { message: string }, url?: string }>}
 *   - { ok: true }                signed in (the app's onAuthChange will reflect it)
 *   - { blocked: true, url }      popup blocked — caller should fall back to redirect
 *   - { unsupported: true }       no window/window.open (SSR/old) — fall back
 *   - { cancelled: true }         popup closed without a session
 *   - { error }                   could not even start the flow — fall back
 */
export async function signInWithGooglePopup(opts = {}) {
  const client = opts.client || supabase;
  const win = opts.win || (typeof window !== 'undefined' ? window : null);
  if (!win || typeof win.open !== 'function') return { unsupported: true };

  const base = win.location.origin + win.location.pathname;
  const sep = base.includes('?') ? '&' : '?';
  const redirectTo = `${base}${sep}${OAUTH_POPUP_PARAM}=1`;

  let urlRes;
  try {
    urlRes = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { skipBrowserRedirect: true, redirectTo },
    });
  } catch (e) {
    return { error: { message: (e && e.message) || 'Could not start Google sign-in.' } };
  }
  if (!urlRes || urlRes.error || !urlRes.data || !urlRes.data.url) {
    return { error: urlRes && urlRes.error ? urlRes.error : { message: 'Could not start Google sign-in.' } };
  }

  const features = popupFeatures(win);
  const popup = win.open(urlRes.data.url, POPUP_NAME, features);
  if (!popup) {
    // Pop-up blocker. Hand the URL back so the caller can fall back to a redirect.
    return { blocked: true, url: urlRes.data.url };
  }
  try { popup.focus(); } catch (_) { /* best-effort */ }

  return await waitForPopup({ client, win, popup });
}

function popupFeatures(win) {
  const w = 480;
  const h = 640;
  let left = 0;
  let top = 0;
  try {
    const dualLeft = win.screenLeft != null ? win.screenLeft : win.screenX;
    const dualTop = win.screenTop != null ? win.screenTop : win.screenY;
    const width = win.innerWidth || (win.document && win.document.documentElement.clientWidth) || w;
    const height = win.innerHeight || (win.document && win.document.documentElement.clientHeight) || h;
    left = Math.max(0, Math.round(width / 2 - w / 2 + dualLeft));
    top = Math.max(0, Math.round(height / 2 - h / 2 + dualTop));
  } catch (_) { /* fall back to 0,0 */ }
  return `popup=yes,width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`;
}

function waitForPopup({ client, win, popup }) {
  return new Promise((resolve) => {
    let settled = false;
    let timer = null;

    const cleanup = () => {
      if (timer) clearInterval(timer);
      try { win.removeEventListener('message', onMessage); } catch (_) { /* noop */ }
    };
    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const confirmSignedIn = async () => {
      // Belt-and-suspenders: the popup wrote the session to shared storage. Force
      // a refresh from it so ALL onAuthChange subscribers fire even if the
      // cross-tab broadcast did not reach this tab. Harmless when no token exists.
      try { await client.auth.refreshSession(); } catch (_) { /* no token = fine */ }
      let session = null;
      try {
        const { data } = await client.auth.getSession();
        session = data && data.session;
      } catch (_) { /* treat as not signed in */ }
      finish(session ? { ok: true } : { cancelled: true });
    };

    const onMessage = (ev) => {
      if (!ev || ev.origin !== win.location.origin) return;
      if (ev.data && ev.data.type === POPUP_MESSAGE && ev.data.ok) {
        try { popup.close(); } catch (_) { /* it closes itself */ }
        confirmSignedIn();
      }
    };
    try { win.addEventListener('message', onMessage); } catch (_) { /* noop */ }

    // Backstop: poll for the popup closing (user finished, or closed it manually).
    timer = setInterval(() => {
      let closed;
      try { closed = popup.closed; } catch (_) { closed = false; }
      if (closed) confirmSignedIn();
    }, 500);
  });
}

/**
 * Run inside the POPUP (called from main.jsx when ?oauth_popup=1 is present).
 * Lets supabase finish parsing the session out of the URL, notifies the opener,
 * and closes the popup. Resolves to true when a session is present.
 *
 * @param {object} [opts]
 * @param {object} [opts.client] supabase client (injectable for tests)
 * @param {Window} [opts.win] window (injectable for tests)
 */
export async function completeOAuthPopup(opts = {}) {
  const client = opts.client || supabase;
  const win = opts.win || (typeof window !== 'undefined' ? window : null);
  if (!win) return false;

  let signedIn;
  try {
    // getSession awaits supabase's init, which (detectSessionInUrl: true) has
    // already parsed and stored the fragment session by the time this resolves.
    const { data } = await client.auth.getSession();
    signedIn = !!(data && data.session);
  } catch (_) { signedIn = false; }

  try {
    if (win.opener && !win.opener.closed) {
      win.opener.postMessage({ type: POPUP_MESSAGE, ok: signedIn }, win.location.origin);
    }
  } catch (_) { /* opener gone or blocked — the opener's poll will catch up */ }

  // Strip the OAuth fragment/marker so a stray bookmark of this popup URL is clean,
  // then close. Closing may be blocked if this window was not script-opened; the
  // opener's poll handles that case.
  try { win.close(); } catch (_) { /* opener poll will still resolve */ }
  return signedIn;
}
