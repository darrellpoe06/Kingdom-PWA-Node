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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail loud during dev so a missing .env.local is caught immediately,
  // not silently as "Royalty Link clicks don't work."
  // eslint-disable-next-line no-console
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
export async function sendRoyaltyLink(email) {
  const trimmed = (email || '').trim();
  if (!trimmed || !trimmed.includes('@')) {
    return { error: { message: 'Please enter a valid email address.' } };
  }

  // The redirect URL must be added to Supabase Auth → URL Configuration →
  // Redirect URLs in the dashboard, otherwise Supabase refuses to send the
  // link. We use the current page's origin + path so the same code works
  // on the Synology PWA URL, localhost dev, and any future church host.
  const redirectTo = window.location.origin + window.location.pathname;

  const { data, error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: { emailRedirectTo: redirectTo },
  });
  return { data, error };
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

/** Sign the user out. Returns the supabase-js result. */
export async function signOut() {
  return supabase.auth.signOut();
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
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ?? null);
  });
  return () => sub.subscription.unsubscribe();
}

export default supabase;
