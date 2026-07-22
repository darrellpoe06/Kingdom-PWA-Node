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

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// -----------------------------------------------------------------------------
// Phone + PIN sign-in (Darrell 2026-07-11: "can we allow a pin to begin instead
// of an email ... everyone doesn't have an email so cellphone and pin and etc").
//
// COMMUNITY-FIRST (commitment: the elderly, tech-novice COLG member is the first
// user): many people have a phone but no email. Supabase Auth requires SOME
// identifier, so we make the PHONE the identity and the PIN the credential —
// WITHOUT paying for SMS (Darrell's governed choice 2026-07-11: collected, not
// text-verified). The mechanism REUSES the existing email+password path via a
// SYNTHETIC, never-delivered identifier `<digits>@phone.poetech.us`; the real
// phone is stored in user_metadata so it is displayable + recoverable. Email is
// collected LATER (saveContactEmail) — optional, and it never blocks starting.
//
// SECURITY, stated plainly (DR-0100): the phone is NOT proven-owned (no SMS), so
// this is a family/church-TRUST identity, not a bank's. The PIN is the guard and
// Supabase Auth rate-limits sign-in attempts server-side (a 6-digit PIN is 1e6
// combinations behind that limit). Stronger later = SMS verify (costs money) or
// a longer PIN. The synthetic domain never receives mail, so it can never be a
// password-reset / account-takeover vector.
//
// ONE dashboard prerequisite (Darrell): Auth → Providers → Email "Minimum
// password length" must be ≤ 6 (6 is the Supabase default), or a 6-digit PIN is
// rejected at signup. Nothing else to configure — no SMS provider, no secrets.
// -----------------------------------------------------------------------------

// The synthetic-email domain — one place, so the mapping never drifts. It never
// receives mail; it only gives Supabase Auth a well-formed identifier.
export const PHONE_LOGIN_DOMAIN = 'phone.poetech.us';

// Strip a typed phone to digits; normalize a US 10-digit number to 11 (lead 1).
// Returns '' when the digits can't be a real number. Pure.
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D+/g, '');
  if (digits.length === 10) return '1' + digits;                 // US national → E.164 digits
  if (digits.length >= 11 && digits.length <= 15) return digits; // already country-coded
  return '';                                                     // too short / too long
}

// The Supabase identifier for a phone login. Pure; '' in → '' out.
export function phoneLoginEmail(rawPhone) {
  const d = normalizePhone(rawPhone);
  return d ? `${d}@${PHONE_LOGIN_DOMAIN}` : '';
}

// Validate phone + PIN before any network call. A PIN is 6 digits (meets the
// Supabase default 6-char minimum). Returns { email (synthetic), pin } or
// { error }. Pure.
export function validatePhonePin(rawPhone, pin) {
  const email = phoneLoginEmail(rawPhone);
  if (!email) return { error: { message: 'Please enter a valid phone number.' } };
  const p = String(pin || '');
  if (!/^\d{6}$/.test(p)) return { error: { message: 'Your PIN must be 6 digits.' } };
  return { email, pin: p };
}

/**
 * Create an account with phone + PIN. Reuses signUp; the real phone + method go
 * in user_metadata so the app can greet "(xxx) xxx-xxxx" and offer to add an
 * email later. Returns { data, error }.
 */
export async function signUpWithPhonePin(rawPhone, pin, displayName) {
  const v = validatePhonePin(rawPhone, pin);
  if (v.error) return v;
  return supabase.auth.signUp({
    email: v.email,
    password: v.pin,
    options: { data: {
      name: (displayName || '').trim() || null,
      phone: normalizePhone(rawPhone),
      login_method: 'phone-pin',
    } },
  });
}

/** Sign in an existing phone + PIN account. Returns { data, error }. */
export async function signInWithPhonePin(rawPhone, pin) {
  const v = validatePhonePin(rawPhone, pin);
  if (v.error) return v;
  return supabase.auth.signInWithPassword({ email: v.email, password: v.pin });
}

/**
 * "Add your email later" — stores a real contact email in user_metadata WITHOUT
 * the Supabase secure-email-change round-trip (the synthetic login email never
 * receives mail, so an email-change confirmation could never be clicked).
 * Promoting this contact email to a real LOGIN identity is a separate, explicit
 * step routed for later. Returns { data, error }.
 */
export async function saveContactEmail(email) {
  const e = (email || '').trim();
  if (!e || !e.includes('@')) return { error: { message: 'Please enter a valid email address.' } };
  return supabase.auth.updateUser({ data: { contact_email: e } });
}

// -----------------------------------------------------------------------------
// Promote a phone+PIN account to ALSO log in by a real, VERIFIED email.
// -----------------------------------------------------------------------------
// This is the DR-0172 follow-up — BUILT, not deferred to a re-review date no one
// owned (Darrell 2026-07-13: "we should have NO FOLLOWUP LATER"). The key fact
// that made "merging" sound hard: it is NOT a merge. A phone user adding their
// email has only ever had ONE account. updateUser({ email }) attaches the email
// to that SAME user id — the id never changes, so the phone-number → unique-ID
// mapping is preserved exactly (the deterministic synthetic identifier still
// resolves to the same row). Supabase emails a confirmation link to the new
// address; clicking it makes that email the account's VERIFIED login identifier,
// which UPGRADES the account (a collected-not-verified phone identity becomes a
// proven-owned email one) with no SMS and no second account. The phone stays in
// user_metadata for greeting + recovery. After confirmation the person signs in
// with email + PIN. Front-door identity = Tier C (DR-0172): this rides behind
// the Governor reviewer pass, never the auto-merge lane.

// The friendly domain check — a real email is never the synthetic placeholder.
export function isSyntheticPhoneEmail(email) {
  return typeof email === 'string' && email.endsWith('@' + PHONE_LOGIN_DOMAIN);
}

// Is this session a phone+PIN account whose login identifier is still the
// synthetic phone email (no real email attached yet)? Pure.
export function isPhoneLoginSession(session) {
  const email = session && session.user ? session.user.email : '';
  const method = session && session.user && session.user.user_metadata
    ? session.user.user_metadata.login_method : undefined;
  return method === 'phone-pin' || isSyntheticPhoneEmail(email || '');
}

// Format normalized phone digits as (xxx) xxx-xxxx for display; leaves anything
// non-standard untouched. Pure — never throws.
export function formatPhoneDisplay(rawPhone) {
  const d = String(rawPhone || '').replace(/\D+/g, '');
  const local = d.length === 11 && d[0] === '1' ? d.slice(1) : d;
  if (local.length === 10) return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  return String(rawPhone || '');
}

// The friendly identity label for the signed-in strip + admin list: a phone user
// sees their formatted number, NEVER the raw <digits>@phone.poetech.us; everyone
// else sees their email. Pure. (Fixes the ugly synthetic address in the Access
// & Usage list.)
export function identityLabel(session) {
  if (!session || !session.user) return '';
  if (isPhoneLoginSession(session)) {
    const meta = session.user.user_metadata || {};
    const phone = meta.phone || (session.user.email || '').split('@')[0];
    return formatPhoneDisplay(phone);
  }
  return session.user.email || '';
}

/**
 * Attach a real, verified login email to the CURRENT account (same user id — not
 * a merge). Supabase sends a confirmation link to the address; the account gains
 * email login once it's clicked. Returns { data, error }. Rejects the synthetic
 * placeholder so a phone user can't "add" the fake address.
 */
export async function promoteEmailToLogin(email) {
  const e = (email || '').trim();
  if (!e || !e.includes('@')) return { error: { message: 'Please enter a valid email address.' } };
  if (isSyntheticPhoneEmail(e)) {
    return { error: { message: 'That is the placeholder address — enter your real email.' } };
  }
  const redirectTo = window.location.origin + window.location.pathname;
  return supabase.auth.updateUser({ email: e }, { emailRedirectTo: redirectTo });
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

// -----------------------------------------------------------------------------
// The boot-gate's bounded fallback — read the persisted session from storage
// WITHOUT the network/lock path getSession() takes (2026-07-13).
// -----------------------------------------------------------------------------
// The "left the tab open, came back to a white screen after a while" hang:
// on the public host the app renders NOTHING until the first getSession()
// resolves (access-gate.js → the 'loading' blank). But getSession() can block
// INDEFINITELY in exactly the return-after-time case:
//   - the stored access token has expired, so init triggers a NETWORK refresh
//     before it resolves — a congested network stalls it; and/or
//   - supabase-js's cross-tab Navigator lock is held by a frozen/discarded tab
//     (several poetech.us tabs open), so the lock is never released.
// Either one strands the boot gate on blank forever — and nothing is rendered
// to tap, so no in-app button can recover it. The session itself is fine: the
// refresh token is sitting in localStorage. So we read it DIRECTLY (synchronous,
// no network, no lock) to render from the last-known session at once; the real
// getSession()/refresh reconciles in the background, and a genuinely-dead
// session still falls to the sign-in gate via the SIGNED_OUT recovery path.
// Pure + injectable so it is unit-testable without a live client.

/**
 * Synchronously read the persisted Supabase session from a Storage-like object
 * (defaults to window.localStorage). supabase-js persists it under the key
 * `sb-<project-ref>-auth-token`; we match by shape so no ref is needed. Returns
 * the session object or null. Best-effort — never throws (blocked/malformed
 * storage → null).
 */
export function readPersistedSession(store) {
  try {
    const ls = store || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!ls || typeof ls.length !== 'number') return null;
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (!key || !/^sb-.*-auth-token$/.test(key)) continue;
      const raw = ls.getItem(key);
      if (!raw) continue;
      let parsed;
      try { parsed = JSON.parse(raw); } catch (_) { continue; }
      // v2 stores the session object directly; v1 wrapped it in { currentSession }.
      const session = parsed && parsed.currentSession ? parsed.currentSession : parsed;
      if (session && session.access_token && session.user) return session;
    }
  } catch (_) { /* storage blocked / SecurityError → treat as no session */ }
  return null;
}

/**
 * Bounded initial auth resolution for onAuthChange. Fires `emit` with the
 * persisted session IMMEDIATELY (storage read — synchronous, can't hang), then
 * reconciles with getSession() when/if it resolves. Guarantees `emit` runs at
 * least once synchronously, so a hung getSession() can NEVER strand the boot
 * gate on a white screen. Injectable (getSession, readStored) for tests.
 *
 * @param {(session: object|null) => void} emit
 * @param {{ getSession: () => Promise<any>, readStored: () => (object|null) }} io
 */
export function resolveInitialSession(emit, { getSession, readStored }) {
  let stored;
  try { stored = readStored(); } catch (_) { stored = null; }
  emit(stored ?? null); // immediate + bounded — the gate resolves no matter what
  try {
    Promise.resolve(getSession())
      .then((res) => {
        const s = res && res.data ? res.data.session : undefined;
        if (s !== undefined) emit(s ?? null); // reconcile with the source of truth
      })
      .catch(() => { /* keep the optimistic read; onAuthStateChange corrects later */ });
  } catch (_) { /* getSession threw synchronously — the storage read already fired */ }
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
  // Fire immediately with the current session so callers don't need a separate
  // getSession() call — but resolve it with a BOUND (read storage first, then
  // reconcile with getSession) so a hung getSession() can never strand the app
  // on the blank boot gate. This is the fix for the "left the tab open, came
  // back to a white screen after a while" resume hang: getSession() blocks on an
  // expired-token network refresh / cross-tab lock, and the gate waits on it
  // forever. See readPersistedSession + resolveInitialSession above.
  resolveInitialSession(callback, {
    getSession: () => supabase.auth.getSession(),
    readStored: () => readPersistedSession(),
  });

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
