// =============================================================================
// Supabase client — Layer 2 v0 backend
// =============================================================================
// One shared client for the whole React app. Reads VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY from app/.env.local (Vite exposes VITE_-prefixed
// env vars to the browser bundle automatically).
//
// The "anon key" / "publishable key" is safe to ship in browser JS — Row
// Level Security policies on every table are what actually gate data
// access. See infra/supabase/schema-v1.sql.
//
// Auth flow this client supports:
//   - Royalty Link sign-in via auth.signInWithOtp({ email })  (Supabase's
//     internal API name is signInWithOtp; we surface it as "Royalty Link"
//     because the user is a king under Christ's lordship — Rev 1:6, 5:10.
//     The word "magic" carries pharmakeia/sorcery weight that conflicts
//     with the system's biblical worldview, so it does not appear in this
//     codebase except where Supabase itself uses it internally.)
//   - Persistent session in localStorage so a returning user is already
//     signed in on next visit (essential for the family-PWA flow where
//     phones stay signed in across days/weeks)
//   - URL-fragment session detection so the Royalty Link callback URL
//     ("…/poetech-app/#access_token=…") boots the user straight in
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import { resolveAuthSession, isPossibleLogout } from './auth-session-guard.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail loud during dev so a missing .env.local is caught immediately,
  // not silently as "Royalty Link clicks don't work."
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Check app/.env.local — see infra/supabase/README.md for the layout.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persist the session so signed-in users stay signed in across reloads
    // and across PWA app launches. Family + church users sign in once.
    persistSession: true,
    storage: window.localStorage,

    // Refresh the access token automatically in the background so a phone
    // left signed-in for a week still has a valid token when picked up.
    autoRefreshToken: true,

    // The Royalty Link redirect comes back with the session in the URL hash;
    // supabase-js parses it and stores the session for us.
    detectSessionInUrl: true,

    // Use the implicit flow so the Royalty Link works cross-device.
    //
    // PKCE binds the code_verifier to the *originating* browser's
    // localStorage — meaning a link requested in a desktop incognito
    // window cannot complete sign-in when clicked on a phone, because
    // the phone has no matching verifier. The implicit flow returns the
    // session in the URL fragment, so any browser that opens the link
    // is signed in directly. This is the right tradeoff for a family +
    // church PWA where "email it to me, I'll click it on my phone" is
    // the dominant path. Google OAuth still works fine on implicit too
    // (the token returns as a fragment on the device where the user
    // clicked the Google button).
    flowType: 'implicit',
  },
});

// -----------------------------------------------------------------------------
// Auth helpers — thin wrappers so call sites don't import supabase-js types
// directly. Keep these small; the goal is one obvious way to do each thing.
// -----------------------------------------------------------------------------

/**
 * Send a Royalty Link email — passwordless sign-in. Supabase emails the
 * user a one-tap link that, when clicked, lands back on emailRedirectTo
 * with a session in the URL.
 *
 * (We deliberately do NOT call this a "magic link." See the file-level
 *  comment above for why.)
 *
 * Caller is responsible for the email format (basic check) and for
 * surfacing the returned error to the user.
 */
export async function sendRoyaltyLink(email, { name } = {}) {
  const trimmed = (email || '').trim();
  if (!trimmed || !trimmed.includes('@')) {
    return { error: { message: 'Please enter a valid email address.' } };
  }

  // The redirect URL must be added to Supabase Auth → URL Configuration →
  // Redirect URLs in the dashboard, otherwise Supabase refuses to send the
  // link. We use the current page's origin + path so the same code works
  // on the Synology PWA URL, localhost dev, and any future church host.
  const redirectTo = window.location.origin + window.location.pathname;

  // A first-time signer-up via the link still gets their NAME on the account
  // (user metadata) — the link-first door collects it up front (DR: sign-in
  // your way), so the passwordless path is never a nameless profile.
  const options = { emailRedirectTo: redirectTo };
  const cleanName = (name || '').trim();
  if (cleanName) options.data = { full_name: cleanName };
  const { data, error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options,
  });
  return { data, error };
}

// -----------------------------------------------------------------------------
// Email + password — the SIMPLE primary path (Darrell 2026-06-16). A profile is
// created at install (name + email + password) and the installed PWA stays signed
// in on the device. No link to click, nothing to break, nothing that looks like a
// virus. The Royalty Link / OAuth helpers above remain as fallbacks.
//
// IMPORTANT (Darrell's one dashboard action): for instant access at install,
// Supabase Auth → Providers → Email → "Confirm email" must be OFF, so signUp
// returns a live session immediately instead of waiting on a confirmation email
// (which would reintroduce the exact email round-trip we're removing). The
// password itself is the credential; RLS + roles are the real gate.
// -----------------------------------------------------------------------------

export function validateCredentials(email, password) {
  const e = (email || '').trim();
  if (!e || !e.includes('@')) return { error: { message: 'Please enter a valid email address.' } };
  if (!password || password.length < 8) return { error: { message: 'Password must be at least 8 characters.' } };
  return { email: e };
}

/**
 * Create an account at install: email + password, with the display name stored
 * in user_metadata. With "Confirm email" off, this returns a live session right
 * away → the person is in. Returns { data, error }.
 */
export async function signUpWithPassword(email, password, displayName) {
  const v = validateCredentials(email, password);
  if (v.error) return v;
  return supabase.auth.signUp({
    email: v.email,
    password,
    options: { data: { name: (displayName || '').trim() || null } },
  });
}

/** Sign in an existing account with email + password. Returns { data, error }. */
export async function signInWithPassword(email, password) {
  const v = validateCredentials(email, password);
  if (v.error) return v;
  return supabase.auth.signInWithPassword({ email: v.email, password });
}

/**
 * Initiate the Google OAuth sign-in flow. The browser navigates away to
 * Google's consent screen, then back to our app via the Supabase callback
 * (/auth/v1/callback → our redirectTo) — supabase-js parses the PKCE
 * code from the URL and stores the session automatically.
 *
 * No email is sent during this flow, so it bypasses the email rate limit
 * and is the recommended primary sign-in path for family + church users.
 * The Royalty Link email path remains available as a fallback for users
 * without a Google account.
 */
export async function signInWithGoogle() {
  const redirectTo = window.location.origin + window.location.pathname;
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

/**
 * Initiate the Apple OAuth sign-in flow (multi-point auth P1, added 2026-06-14).
 * Same shape as signInWithGoogle: the browser navigates to Apple's consent
 * screen, then back via the Supabase callback. The session returns as a URL
 * fragment under the implicit flow, so it works cross-device like the rest.
 *
 * REQUIRES one-time dashboard + Apple Developer setup (Darrell):
 *   - Apple Developer: a Services ID + Sign in with Apple key (the private .p8).
 *   - Supabase Dashboard -> Authentication -> Providers -> Apple: enable, paste
 *     the Services ID (client id) and the generated client secret JWT, add the
 *     Supabase callback URL to the Apple Services ID's Return URLs.
 * Until that is done the button surfaces Apple's "provider not enabled" error;
 * the email Royalty Link and Google paths remain fully available (no lockout).
 */
export async function signInWithApple() {
  const redirectTo = window.location.origin + window.location.pathname;
  return supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo },
  });
}

/**
 * Account linking (one person = one account across providers). Supabase links
 * identities that share the same VERIFIED email automatically when "Link
 * accounts with the same email" is enabled in the dashboard (Authentication ->
 * Settings). This helper is the MANUAL path: a signed-in user attaches an
 * additional provider (e.g. add Apple to an account created with Google) so all
 * providers resolve to the same user id and the same RLS-scoped instance.
 *
 * @param {'google'|'apple'} provider
 */
export async function linkIdentity(provider) {
  const redirectTo = window.location.origin + window.location.pathname;
  return supabase.auth.linkIdentity({ provider, options: { redirectTo } });
}

// True only for the brief window around a user-initiated sign-out. The auth
// guard reads this so a DELIBERATE sign-out clears immediately, while a
// transient SIGNED_OUT (PWA resume / rotated-token race) gets the recovery
// refresh first. Module-level (not per-subscriber) because the SIGNED_OUT
// event fans out to every onAuthChange subscriber.
let deliberateSignOut = false;

/** Sign the user out. Returns the supabase-js result. */
export async function signOut() {
  // Flag BEFORE calling signOut() so the SIGNED_OUT event it emits is treated
  // as deliberate (no recovery attempt). onAuthChange clears the flag once the
  // event is consumed.
  deliberateSignOut = true;
  try {
    return await supabase.auth.signOut();
  } catch (e) {
    // If signOut itself throws, don't leave the flag stuck — a later transient
    // SIGNED_OUT would then be misread as deliberate and skip recovery.
    deliberateSignOut = false;
    throw e;
  }
}

/**
 * Subscribe to auth state changes. Returns the unsubscribe function so the
 * caller can clean up on unmount. The callback receives the current
 * session (or null when signed out).
 *
 * Usage in a React effect:
 *   useEffect(() => onAuthChange(setSession), []);
 */
export function onAuthChange(callback) {
  // Fire immediately with the current session so callers don't need a
  // separate getSession() call. Then subscribe to future changes.
  supabase.auth.getSession().then(({ data }) => callback(data.session ?? null));

  // Re-arm the background token refresher whenever the app/tab returns to the
  // foreground. A PWA resume or a long-backgrounded tab lets the service
  // worker pause supabase-js's auto-refresh timer; without re-arming, a phone
  // picked up after hours wakes with a dead timer and the very next auth event
  // looks like a sign-out. startAutoRefresh() is idempotent and safe to call
  // repeatedly. (Pairs with the resolveAuthSession recovery below — re-arming
  // PREVENTS the stale-timer logout; recovery CATCHES the ones that slip past.)
  const rearmAutoRefresh = () => {
    try {
      const visible =
        typeof document === 'undefined' || document.visibilityState === 'visible';
      if (visible && typeof supabase.auth.startAutoRefresh === 'function') {
        supabase.auth.startAutoRefresh();
      }
    } catch (_) {
      // best-effort; never let a re-arm failure throw into a UI event handler
    }
  };
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', rearmAutoRefresh);
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('focus', rearmAutoRefresh);
  }

  const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
    // Fast path: a live session, or any non-logout event, passes straight
    // through unchanged.
    if (!isPossibleLogout(event, session)) {
      callback(session ?? null);
      return;
    }

    // A null / SIGNED_OUT event. Capture-and-reset the deliberate flag now so
    // concurrent subscribers all see the same intent for THIS event.
    const deliberate = deliberateSignOut;
    deliberateSignOut = false;

    // Defer the recovery refresh: calling supabase.auth.* synchronously inside
    // the onAuthStateChange callback can deadlock on supabase-js's internal
    // auth lock. setTimeout(…, 0) runs it after the callback returns.
    setTimeout(async () => {
      const { session: resolved } = await resolveAuthSession(
        event,
        session ?? null,
        supabase.auth,
        { deliberate },
      );
      callback(resolved);
    }, 0);
  });

  return () => {
    sub.subscription.unsubscribe();
    if (typeof document !== 'undefined' && document.removeEventListener) {
      document.removeEventListener('visibilitychange', rearmAutoRefresh);
    }
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('focus', rearmAutoRefresh);
    }
  };
}

export default supabase;
