// =============================================================================
// signup-metrics — platform-wide signup visibility (Darrell 2026-06-29)
// =============================================================================
// "Real people are creating accounts on poetech.us and I can't see who or why,
// and I need to KNOW my private data isn't exposed to them."
//
// The Access & Usage surface reads through RLS, so it can only show people in an
// instance the steward belongs to — it is structurally blind to the self-serve
// `u-*` instances strangers create on sign-up. This module is the GOVERNOR's
// cross-instance window: it calls the SECURITY DEFINER admin_signup_metrics()
// RPC (gated at the DB to the poe-family circle) and shapes its result for the
// Platform Signups section of AccessUsageMetrics.jsx.
//
// Every number here is REAL (DR-0076): the RPC counts auth.users + instance_
// members on the live cloud DB. This module NEVER fabricates a count — when the
// caller is not authorized, or the RPC is not yet on cloud, it returns an honest
// status the UI renders as-is. Pure helpers are isolated + unit-tested so the
// shaping logic is verified independent of the network.
// =============================================================================
import { relativeTime } from './access-metrics.js';
import { restRpc, readSnapshotToken } from './access-metrics-sync.js';

// ── fetch ────────────────────────────────────────────────────────────────────
// Returns a discriminated status object — never throws, never paints:
//   { status: 'signed-out' }                       — no session
//   { status: 'unauthorized' }                     — signed in, not a governor
//   { status: 'unavailable', error }               — RPC missing / transient
//   { status: 'ready', data }                      — real metrics payload
export async function fetchSignupMetrics() {
  // Read the token from the persisted session (synchronous, NO navigator.locks) and
  // call the RPC via direct REST — bypassing the Supabase client's cross-tab lock
  // that a wedged PoeTech tab can hold (Darrell 2026-07-22). Bounded by restRpc's
  // AbortController, so this never strands the SIGNUPS tab on "Loading…" (DR-0076).
  const token = readSnapshotToken();
  if (!token) return { status: 'signed-out' };

  try {
    const { data, error } = await restRpc('admin_signup_metrics', {}, token);
    if (error) {
      // 42501 = our in-function "not authorized" raise (insufficient_privilege).
      // PostgREST may also surface it as code 'P0001' (raise) — match on text too.
      const code = error.code || '';
      const msg = (error.message || '').toLowerCase();
      if (code === '42501' || msg.includes('not authorized')) {
        return { status: 'unauthorized' };
      }
      return { status: 'unavailable', error };
    }
    return { status: 'ready', data: data || null };
  } catch (e) {
    return { status: 'unavailable', error: e };
  }
}

// ── pure shaping ───────────────────────────────────────────────────────────────

// The headline tiles for the Platform Signups section. Driven entirely by the
// RPC summary object; missing keys read 0 (honest — an absent count is zero, not
// blank). Returns [{ label, value, sub }].
export function summaryTiles(summary) {
  const s = summary || {};
  const n = (k) => (typeof s[k] === 'number' ? s[k] : 0);
  return [
    { label: 'Total accounts', value: n('total_accounts'),
      sub: `${n('family_members')} family · ${n('church_members')} church` },
    { label: 'Public signups', value: n('self_serve_signups'),
      sub: 'own private space' },
    { label: 'New (7d)', value: n('signups_7d'),
      sub: `${n('signups_30d')} in 30d` },
    { label: 'Active (7d)', value: n('active_7d'),
      sub: `${n('returned')} ever returned` },
  ];
}

// Human label + tone for an instance category. Tone keys are theme-agnostic
// (the component maps them to its palette).
const CATEGORY_META = {
  'self-serve':    { label: 'Public signup', tone: 'new' },
  family:          { label: 'Family',        tone: 'trusted' },
  church:          { label: 'Church',        tone: 'church' },
  other:           { label: 'Other',         tone: 'neutral' },
  unprovisioned:   { label: 'No space yet',  tone: 'pending' },
  unknown:         { label: 'Unknown',       tone: 'neutral' },
};

export function categoryLabel(cat) {
  return (CATEGORY_META[cat] || CATEGORY_META.unknown).label;
}
export function categoryTone(cat) {
  return (CATEGORY_META[cat] || CATEGORY_META.unknown).tone;
}

// Mask an email for shoulder-surfing safety: keep the first char + domain.
//   "jane.doe@gmail.com" -> "j…@gmail.com".  Falsy -> '(no email)'.
export function maskEmail(email) {
  const e = String(email || '').trim();
  if (!e) return '(no email)';
  const at = e.indexOf('@');
  if (at <= 0) return e;            // not an address shape — show as-is
  const first = e[0];
  const domain = e.slice(at);      // includes '@'
  return `${first}…${domain}`;
}

// The account's EFFECTIVE last-active time: the later of "last authenticated"
// (auth.users.last_sign_in_at, the auth stamp) and "last seen in the app"
// (member_presence.last_seen_at, the real activity heartbeat). The RPC (0079)
// already computes this as last_active_at; we still fall back here so an older
// payload — or a row with only the auth stamp — degrades honestly instead of
// reading "never". Returns an ISO string or null (never fabricated).
//
// WHY THIS MATTERS: a persistent PWA session refreshes its token silently and
// does NOT bump last_sign_in_at, so a user active daily can carry a two-week-old
// sign-in stamp. last_active_at reflects real use; last_sign_in_at alone did not.
export function lastActiveAt(row) {
  const r = row || {};
  return r.last_active_at || r.last_sign_in_at || null;
}

// Has this account come back at least once since creating it? (returned vs.
// signed-up-and-vanished). Measured against the effective last-active, so a
// silently-refreshed session still counts as returned. Real timestamps only.
export function hasReturned(row) {
  if (!row || !row.created_at) return false;
  const activeIso = lastActiveAt(row);
  if (!activeIso) return false;
  const last = Date.parse(activeIso);
  const made = Date.parse(row.created_at);
  if (Number.isNaN(last) || Number.isNaN(made)) return false;
  return last - made > 5 * 60 * 1000; // > 5 min after creation
}

// Active within the last few minutes — "using the app right now". Drives the
// "active now" readout so a signed-in-this-minute member never reads as absent.
const ACTIVE_NOW_MS = 10 * 60 * 1000; // 10 min heartbeat-freshness window
export function isActiveNow(row, nowMs) {
  const activeIso = lastActiveAt(row);
  if (!activeIso) return false;
  const last = Date.parse(activeIso);
  if (Number.isNaN(last)) return false;
  return (nowMs - last) <= ACTIVE_NOW_MS && (nowMs - last) >= -ACTIVE_NOW_MS;
}

// Shape one RPC signup row into the fields the list renders. `mask` toggles
// email masking; `nowMs` stamps relative times once per render.
export function signupRowView(row, nowMs, mask = false) {
  const r = row || {};
  const activeIso = lastActiveAt(r);
  return {
    userId: r.user_id || null,
    name: (r.display_name && String(r.display_name).trim()) || null,
    email: mask ? maskEmail(r.email) : (r.email || '(no email)'),
    rawEmail: r.email || null,
    category: r.category || 'unknown',
    categoryLabel: categoryLabel(r.category),
    categoryTone: categoryTone(r.category),
    instanceType: r.instance_type || null,
    role: r.role || null,
    joined: relativeTime(r.created_at, nowMs),
    // "last active" = effective last-active (auth stamp OR live heartbeat).
    lastSeen: activeIso ? relativeTime(activeIso, nowMs) : 'never',
    activeNow: isActiveNow(r, nowMs),
    returned: hasReturned(r),
    emailConfirmed: !!r.email_confirmed,
  };
}

// Order the signup list for the governor's eye: newest accounts first. The RPC
// already returns created_at DESC, but re-assert it so the view never depends on
// server order. Pure; returns a new array.
export function sortSignups(rows) {
  return [...(rows || [])].sort((a, b) => {
    const ta = Date.parse((a && a.created_at) || '') || 0;
    const tb = Date.parse((b && b.created_at) || '') || 0;
    return tb - ta;
  });
}
