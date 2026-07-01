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
import { cleanField, FIELD_CAPS } from './sanitize-input.js';
// The admin allowlist lives in its own dependency-free module (one source of truth,
// shared with admin-console). Re-exported here so this module's public API — which
// AppInterestAdmin imports — is unchanged.
import { ADMIN_EMAILS, isAdminEmail } from './admin-allowlist.js';
export { ADMIN_EMAILS, isAdminEmail };

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
  // Every text field cleaned + length-capped (HTML tags + control/invisible/bidi
  // chars stripped). user_agent / referrer are attacker-controllable too (a direct
  // POST can set any header-ish value), so they are capped as well. The 0033 CHECK
  // constraints are the enforceable server-side backstop.
  const row = {
    name: cleanField(form.name, FIELD_CAPS.name) || null,
    email: cleanField(form.email, FIELD_CAPS.email) || null,
    phone: cleanField(form.phone, FIELD_CAPS.phone) || null,
    issue: cleanField(form.issue, FIELD_CAPS.issue, { multiline: true }) || null,
    platform: cleanField(form.platform, FIELD_CAPS.platform) || null,
    user_agent: cleanField(typeof navigator !== 'undefined' ? navigator.userAgent : '', FIELD_CAPS.userAgent) || null,
    referrer: cleanField(typeof document !== 'undefined' ? document.referrer : '', FIELD_CAPS.referrer) || null,
    is_minor: !!form.isMinor,
    parent_confirmed: !!form.parentConfirmed,
    source: cleanField(form.source, FIELD_CAPS.source) || 'app',
    signed_in_email: cleanField(signedInEmail, FIELD_CAPS.signedInEmail) || null,
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
