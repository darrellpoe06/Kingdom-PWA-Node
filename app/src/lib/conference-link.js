// =============================================================================
// conference-link — the OPTIONAL account on-ramp half of the registration funnel
// =============================================================================
// The open registration (conference-register.js) stays exactly as frictionless as
// it is — name + submit, no account, done. THIS module is the optional second step:
// a registrant who chooses to create a PoeTech account has their just-made
// registration LINKED to that account (one-time attendee -> app member), without
// re-entering anything. Skipping it leaves the registrant fully registered.
//
// The linking RPC (claim_conference_registration, migration 0032) is SECURITY
// DEFINER and self-scoped: it links an UNCLAIMED row to the CALLER's own auth.uid()
// only. We pass the row id the registrant's own browser generated at submit time
// (conference-register.submitRegistration) — never read back from the roll (anon
// has no SELECT). For the Google/OAuth path the browser navigates away and back, so
// the pending id is parked in localStorage and claimed on the authenticated return.
import supabase from './supabase.js';

const PENDING_KEY = 'poetech.pendingConfRegLink';

// --- pending-link store (survives the OAuth redirect round-trip) --------------
export function setPendingConferenceLink(regId) {
  if (!regId) return;
  try { window.localStorage.setItem(PENDING_KEY, String(regId)); } catch { /* storage optional */ }
}
export function getPendingConferenceLink() {
  try { return window.localStorage.getItem(PENDING_KEY) || null; } catch { return null; }
}
export function clearPendingConferenceLink() {
  try { window.localStorage.removeItem(PENDING_KEY); } catch { /* noop */ }
}

// Link a registration to the signed-in account. Returns {ok, linked} — linked is
// true only when a row was actually claimed (false if already claimed / not found).
// Never throws.
export async function claimConferenceRegistration(regId) {
  if (!regId) return { ok: false, error: { message: 'no-registration-id' } };
  try {
    const { data, error } = await supabase.rpc('claim_conference_registration', { p_reg_id: regId });
    if (error) {
      console.warn('[conference-link] claim failed:', error.message || error);
      return { ok: false, error };
    }
    return { ok: true, linked: data === true };
  } catch (e) {
    console.warn('[conference-link] claim threw:', e);
    return { ok: false, error: e };
  }
}

// On an authenticated load, claim any pending link, then clear it. Safe to call
// repeatedly: a no-op without a pending id, and it KEEPS the pending id if there is
// no session yet (so a later sign-in — e.g. after email confirmation — still links).
export async function resolvePendingConferenceLink() {
  const regId = getPendingConferenceLink();
  if (!regId) return { ok: true, claimed: false };
  try {
    const { data } = await supabase.auth.getSession();
    if (!data || !data.session) return { ok: true, claimed: false }; // not signed in yet — keep pending
    const res = await claimConferenceRegistration(regId);
    if (res.ok) clearPendingConferenceLink();
    return { ok: res.ok, claimed: !!(res.ok && res.linked), error: res.error };
  } catch (e) {
    return { ok: false, error: e };
  }
}

// Wire the redirect-return claim: whenever a session becomes available (e.g. the
// browser returns from Google's consent screen), resolve any pending link. Returns
// an unsubscribe fn. Used at full-app boot so the OAuth path completes its link no
// matter where the user lands. Idempotent (the pending id is cleared after claim).
export function wirePendingConferenceLink() {
  let stopped = false;
  // Try once immediately (covers a session already restored from storage).
  resolvePendingConferenceLink();
  let sub = null;
  try {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (stopped || !session) return;
      if (getPendingConferenceLink()) resolvePendingConferenceLink();
    });
    sub = data ? data.subscription : null;
  } catch { /* auth subscription optional */ }
  return function unsubscribe() {
    stopped = true;
    try { if (sub) sub.unsubscribe(); } catch { /* noop */ }
  };
}

// A member's own linked registration(s) — the funnel "carries into membership"
// read. Goes through the self-scoped get_my RPC (0032), never the roll. Returns
// {ok, rows}. Never throws.
export async function fetchMyConferenceRegistrations() {
  try {
    const { data, error } = await supabase.rpc('get_my_conference_registrations');
    if (error) return { ok: false, error, rows: [] };
    return { ok: true, rows: data || [] };
  } catch (e) {
    return { ok: false, error: e, rows: [] };
  }
}
