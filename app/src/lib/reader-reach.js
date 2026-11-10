// =============================================================================
// reader-reach — who is reading the work orders, and whether that sign-in holds
// a seat in the landlord space (DR-1407)
// =============================================================================
// Poe Properties' work orders are read under the reader's own seat, so a
// sign-in without one reads an EMPTY list, not an error. The triage card uses
// this to say which it is (lib/work-order-triage.js readerReach) instead of
// looking like a smaller system.
// =============================================================================
import supabase from './supabase.js';

export async function loadReaderReach(client = supabase) {
  try {
    const [s, r] = await Promise.all([client.auth.getSession(), client.rpc('my_properties_instance_role')]);
    if (r.error) return { ok: false, reason: 'read-failed', error: r.error.message };
    const user = s && s.data && s.data.session ? s.data.session.user : null;
    const seat = r.data && r.data.instance_id ? { role: r.data.role || 'member', slug: r.data.instance_slug || null } : null;
    return { ok: true, email: (user && user.email) || null, seat };
  } catch (e) {
    return { ok: false, reason: 'unexpected', error: (e && e.message) || undefined };
  }
}
