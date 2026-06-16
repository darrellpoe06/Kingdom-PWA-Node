// =============================================================================
// interest-sync — Supabase-backed consented interest / invite list
// =============================================================================
// Writes a public, CONSENTED interest submission (name/email + optional phone /
// issue) to the app_interest table, and reads/manages it for the two admins.
//
// Boundary (migration 0023): ANYONE may INSERT (the public "get the app / I'm
// having trouble" form); only ADMIN_EMAILS may SELECT/UPDATE — enforced by RLS in
// the database, mirrored here client-side only for honest UI gating. A signed-out
// visitor uses the anon key, which the insert policy allows.
// =============================================================================
import supabase from './supabase.js';

// Darrell + Christina — the only eyes on the list ("all of this before me and my
// wife Christina"). Mirrors migration 0023's RLS allow-list; the DB is the real
// gate, this just drives whether the admin UI bothers to query.
export const ADMIN_EMAILS = ['darrellpoe06@gmail.com', 'mrspoe06@gmail.com'];

export function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(String(email).toLowerCase().trim());
}

async function currentEmail() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.email || null;
  } catch (e) {
    return null;
  }
}

// Submit one consented interest row. Best-effort: returns {ok:true,...} or
// {ok:false, error}. Never throws — a failed write must not break the form, but
// (unlike a sync mirror) here the row IS the deliverable, so we surface failure.
export async function submitInterest(form = {}) {
  const signedInEmail = await currentEmail();
  const row = {
    name: (form.name || '').trim() || null,
    email: (form.email || '').trim() || null,
    phone: (form.phone || '').trim() || null,
    issue: (form.issue || '').trim() || null,
    platform: form.platform || null,
    user_agent: (typeof navigator !== 'undefined' ? navigator.userAgent : null),
    referrer: (typeof document !== 'undefined' ? (document.referrer || null) : null),
    is_minor: !!form.isMinor,
    parent_confirmed: !!form.parentConfirmed,
    source: form.source || 'app',
    signed_in_email: signedInEmail,
    status: 'new',
  };
  try {
    const { error } = await supabase.from('app_interest').insert(row);
    if (error) {
      console.warn('[interest-sync] submit failed:', error.message || error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e) {
    console.warn('[interest-sync] submit threw:', e);
    return { ok: false, error: e };
  }
}

// Admin: fetch the list, newest first. Returns { ok, rows } / { ok:false, error }.
// RLS returns nothing for non-admins; we also short-circuit client-side.
export async function fetchInterest() {
  const email = await currentEmail();
  if (!isAdminEmail(email)) return { ok: false, error: 'not-admin', rows: [] };
  try {
    const { data, error } = await supabase
      .from('app_interest')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { ok: false, error, rows: [] };
    return { ok: true, rows: data || [] };
  } catch (e) {
    return { ok: false, error: e, rows: [] };
  }
}

// Admin: mark a row's status (e.g. 'invited' after one-tap, or 'installed').
export async function setInterestStatus(id, status) {
  const email = await currentEmail();
  if (!isAdminEmail(email)) return { ok: false, error: 'not-admin' };
  const patch = { status };
  if (status === 'invited') { patch.invited_at = new Date().toISOString(); patch.invited_by = email; }
  try {
    const { error } = await supabase.from('app_interest').update(patch).eq('id', id);
    if (error) return { ok: false, error };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}
